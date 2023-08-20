<p align="center"> <img width="default" height="200"
        src="https://cdn.discordapp.com/attachments/736359303744585821/1142936556387184821/i.png" style="border-radius: 200px;">
</p>

# **ade - Adaptive Dialing Engine**

`ade` is a website that can verify phone numbers using the Twilio API in JavaScript. The project verifies a number by sending a custom message to the number, then the reciever responds to the text to verify. The response is shown on the website once verified.

The website uses WebSockets to get verification statuses quickly and efficiently. The website also has maintenance functionality where you can remotely turn the server on/off for testing.

## Usage
`ade` requires SSL certificates and keys. Refer to the `credentials` variable in `index.js` for configuration.

```js
const credentials = {
  domain: "your.domain.com",
  maintenance_code: "your_maintenance_code", // For maintenance requests
  key: ssl.key,
  cert: ssl.certificate,
  ca: ssl.ca,
  twilio: ["keys", "here"],
  number: "+15555555555" // Twilio Phone Number
};
```

## That's All
`ade` is a project from July 2021, so I won't be updating the code. Thanks!