const express = require('express');
const expressws = require('express-ws');
const fs = require("fs");
const https = require("https");

// Change these to your own SSL keys
const ssl = {
  key: fs.readFileSync('./cert/private.key', 'utf8'),
  cert: fs.readFileSync('./cert/certificate.crt', 'utf8'),
  ca: fs.readFileSync('./cert/ca_bundle.crt', 'utf8')
}

// Configuration, make sure to change these
const credentials = {
  domain: "your.domain.com",
  maintenance_code: "your_maintenance_code",
  key: ssl.key, 
  cert: ssl.certificate,
  ca: ssl.ca,
  twilio: ["keys", "here"],
  number: "+15555555555" // Change this to your Twilio phone number
};
const app = express();

const server = https.createServer(credentials, app).listen(443);

expressws(app, server);
var sessions = [];
var cons = [];

app.use(express.static(".", {
  extensions: ["js", "css", "png"]
}));

var maintenance = false;

app.use(function(request, response, next) {
  if (request.originalUrl.startsWith("/api/maintenance")
  ||
  request.originalUrl.startsWith("/maintenance")
  ||
  request.originalUrl == "/bg") return next();
  if (maintenance) {
    response.sendFile(__dirname + "/m.html")
  } else {
    next();
  }
});

app.get("/maintenance_status", function(request, response) {
  response.json({
      m: maintenance
    })
});

app.get("/", function(request, response) {
  response.sendFile(__dirname + "/main.html");
});

app.get("/bg", function(request, response) {
  response.sendFile(__dirname + "/bg.jpg");
});

app.post("/api/start", express.json(), async function(request, response) {
  const { phone } = require('phone');
  const generate = require("generatehash");


  let number = phone(request.body.phone_number);
  if (!number.isValid) {
    response
    .status(404)
    .json({
      error: "Invalid phone number."
    });

    return;
  }

  let check = sessions.some(i => i.to === number.phoneNumber && !i.done);
  if (check) {
    response
    .status(404)
    .json({
      error: "Phone number already in queue"
    });

    return;
  } 

  let session = {
    id: generate("md5"),
    to: number.phoneNumber,
    from: credentials.number,
    message: request.body.message,
    connection_id: generate("md5").slice(15)
  }

  const client = require('twilio')(credentials.twilio[0], credentials.twilio[1]);

  var message = await client.messages.create({
    from: session.from,
    to: session.to,
    body: session.message
  })
  .catch(err => {
    response
    .status(404)
    .json({
      error: err.code == 21211 && "Invalid phone number."
    });

    return;
  })

  session.sid = message.sid;

  sessions.push(session);
  
  response.json({
    id: session.id,
    connection_id: session.connection_id,
    realtime_link: `wss://${credentials.domain}/realtime?&id=${session.id}&connection_id=${session.connection_id}`
  });

});

app.post("/api/sms", express.urlencoded(), function(request, response) {
  const { phone } = require('phone');

  var number = phone(request.body.From);
  var session = sessions.find(i => i.to === number.phoneNumber && !i.done );

  if (session) {
    sessions[sessions.indexOf(session)].done = true;
    session.realtime().send(JSON.stringify([
      "TextRecieved",
      {
        body: request.body.Body
      }
    ]));

    session.realtime().close();
  }
});

app.ws("/realtime", function(ws, request) {
  var session = sessions.find(i => i.id === request.query.id && i.connection_id === request.query.connection_id);

  if (!session) {
    ws.send(JSON.stringify({
      error: "Invalid session"
    }));

    ws.close();

    return;
  }

  sessions[sessions.indexOf(session)].realtime_established = true;

  sessions[sessions.indexOf(session)].realtime = function() {
    return ws;
  }

});

app.get("/api/maintenance", function(request, response) {
  if (request.query.code !== credentials.maintenance_code) {
    response.json({error: "Unauthorized"});
  } else {
    if (maintenance) {
      maintenance = false
    } else {
      maintenance = true
    }

    for (var x in cons) {
      cons[x].send("ref");
    }

    response.json({});
  }
});

app.ws("/maintenance", function(ws, request) {
  cons.push(ws);
});

app.listen(3000);