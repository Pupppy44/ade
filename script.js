new WebSocket("wss://vm.kirb.xyz/maintenance").onmessage = function(e) {
  location.reload();
};

document.getElementById("start").addEventListener("click", function(event) {
  var card = document.getElementsByClassName("card")[0];
  card.style.height = "630px";

  document.getElementById("status").style.color = "black";
  document.getElementById("status").innerHTML = '<i class="fas fa-circle-notch fa-spin fa-1x"></i>';
  document.getElementById("status").style.visibility = "visible";

  fetch("/api/start", {
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({
      phone_number: document.getElementById("phone-number").value,
      message: document.getElementById("question").value
    })
  })
  .then(response => {
    if (!response.ok) {
      response.json()
      .then(body => {
        let status = document.getElementById("status");
        status.style.color = "red";
        status.innerText = body.error
      })
    } else {
      response.json()
      .then(body => {
        let progress = document.getElementsByClassName("progress")[0];
        
        document.getElementsByClassName("card")[0].style.opacity = "0";
        progress.style.visibility = "visible";

        let realtime = new WebSocket(body.realtime_link);

        realtime.onmessage = function(ev) {
          let [ event, message ] = JSON.parse(ev.data);
          console.log("hi");

          switch(event) {
            case "TextRecieved":
              progress.innerHTML = `
                <br>
                <br>
                <i class="fas fa-check-circle fa-3x"></i>
                <br>
                <h1>Success</h1>
                <h3>Message</h3>
                <label class="message-text">${message.body}</label>
                <br>
                <br>
                <button onclick="location.reload()">Close</button>
                <br>
                <br>
              `
              break;
          }
        }
      });
    }
  })
});
