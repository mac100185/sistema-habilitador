const express = require("express");
const router = express.Router();
const fs = require("fs");
const JSEncrypt = require("node-jsencrypt");
const bodyParser = require("body-parser");

// import library
var captcha = require("@bestdon/nodejs-captcha");

// Create new Captcha
var newCaptcha = captcha();

// Value of the captcha
var value = newCaptcha.value;

// Image in base64
var imagebase64 = newCaptcha.image;

// Width of the image
var width = newCaptcha.width;

// Height of the image
var height = newCaptcha.height;

router.get("/captcha", (req, res) => {
  let result = captcha();
  let source = result.image;
  res.send(
    `
    <!doctype html>
    <html>
        <head>
            <title>Test Captcha</title>
        </head>
        <body>
        <label>Test image</label>
        <img src="${source}" />
        </body>
    </html>
    `,
  );
});

router.post("/api/token", (req, res) => {
  let token = req.body.oeiro;

  console.log("cifrado: " + token);

  //const privateKey = fs.readFileSync('./../key/keyToken/privado.pem', 'utf8');
  let decrypt = new JSEncrypt();
  //let publicKey = fs.readFileSync('./publico.pem', 'utf8');

  decrypt.setPrivateKey(
    atob(
      "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBamNXZTg1cXRobWRsSStYeTArajIweWpGQTkxaXA4Yzd2Qy9Xb1hxc054UmlweXd2CjR3TzkxNnBIc0xBME1oMnRBdkdNc21PUEcxODRzaDZ4MkNrRERwNmpqd2wzSHAvUG1TVUMvREJiYlBORkh4aFEKM3BXS0xpRjA4TGxJanB3cWs4c2NIbWpXQ1pnNk8xL1lVTWRlVk9YREVYY29md1pFL3RpZzJjZ0RxT2N5dGxOSwpqMWtNV05oTDNUY2lPSmRHdlZhTi9sUithN3dIRmQ2Um5yUjFkTFR3S21zMkptZm1pbjFZdS83dWFZZ0Rlc2VJCnFnOXhKSnpPRnUyV0xmY3VhaVREdTg2WG55UmJsbEdVbkp4TUJ1RzNkZ3EvQ2s1dGtIOWRHQVljVTZrc04yK0gKbXVOeVpsdTlSVC8rUHpMQ2U0NzIyRkdyOG45VkhYTTJWRVVwZ1FJREFRQUJBb0lCQUJPTUI5cDJuUzVHMno4VAoyV00yWDdIRmtVUnpKY01VU1R3dExGNmZWMWRRekRsWWNsSE9sa0pDREJoa2N3M2w0WkRpVlEvVGdrdTMyVTFWCnhoZVRzQVE0QXowWmhQOEg4Y3VmdXNXaXRUaFVZbGRqTnVNNW93K3hOVHBya1lGNExyYXA3bnFTNGMvNDJTNk8KakhpMnhGN1lQd2tOY052eXRWaWQ3YStaVUVmZFF1UGtPL0dib0FmbFFOU1NnQzlWaTM5RW96S0ZSaDZOdEhKYgozbit0R0h1YU9QYmZOUUhsamQ5bjVHUDJ2V2Fld3drK1lEQzVxaEFFdW9ncGxPQ3hzaGplQkprZ08rcE5WMTJLCjhqZVg0WU9abER1cnREQU51N0k1Q2hleWlRMElDeW94Q2dOYVdIZkkwcENpUjlMbjMyQkQvckpCa3hhMUxwWjMKZ3hGY0xERUNnWUVBN1g1bHNIbG9XZW5JS1R6QTJ4YzNBdUNHNEJ1VzNVeDNzU0ZUMzNqV0JZR2dUTzlzL1VvagozU3piUmZFamtDN3JZSU05eGp3MjFTK0cvTVhPa2tKRHFHYkxidURJalNGRm0xVWtDdnczNjk3aDB3ejQ0b2dWCnBJcktWNUU2Nkh2ejZoN3R3eEpnNXgzT1FsajA1eFdTMWF4U3RBd1FCbW5tNDYzbkhIem12emNDZ1lFQW1ORzcKK0c3TWdBU2RiaW1haFM0aCtFQ0ljUTNuYlpCN3FwdFlzZ3duM2ZmRGV6SW1IYUdhdklFcXY1M0hSVjlUQ3NXaQpwbmFpQldvdkJFbWpkbEJmc3BjZTdZY2owTm5hbjhNWWQwOHhQQ0krNThaV2JUc2M2aDFCL1FHZXBSRG42SjZRCllYbitockNwU3BzRUJlZFdweHh0WEI1b3RKa0ZGYWNoVGtrckNRY0NnWUVBb3kwMloyTnpqRnV4bUl2U29uWTMKNlBVbUZyTStHLzBmUEFmL0hjdGptZEx2dGd6SG9OeWcrYVdKWDJ3SW1GZDBpQktFamtEdkY5a1k4WEpqdFdCcwpKamZDelFNTEtOVFVnNTZqTGgwUHV6T2ZpNmdkRldDVkprSHFOdkpsUERsMlpNVXRiZHVoMHdwS25wR0thNEFLCkxGL0RUMHYrY3JtdTEzNjBEWUhQOVU4Q2dZQnorcWtYOEs4UGNYRXhqQzJUYWVHcUVQLzhIVHRJc2VESktFRDIKVDdkcUJJRzlXK0FGbVFKZ2tmOHBrY3NNWVQ0YTdNZDJZbzZ3WVZmeGZ4bXB6M0h4ampPUXZZRjNIZitJUkg2cQovZFUxK0IrWnM3TWdEejd3aHVmdjVtektoYndibFV1cVR2WFdydmlzZ0YxYlJhbEVCcFVRMXB0TWhOMlJBMWlKCm00b252UUtCZ1FDT093d0ZhdVBQTldOcUZScTQ1YnR4SDZPVmdMK1JaWkwvc1Q5Z2JpeW9kdmJValdkVmE2RWEKai82YkYxRGw3WCtUb0tjdllqNm5mRUJuMXBNOHFpbmNWWUZWRWYwR1NuRHpiQnZtMndCS0RYMHhRT2IvZEFudApFUkhaSWlSSkZDaDdzdGlhT2NRVk9GaXVoSTRXODloSXY5K09xS2k1T3JmTVhRSjVVcVNsTUE9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQ==",
    ),
  );
  let descifrado = decrypt.decrypt(token);
  console.log("Descifrado: " + descifrado);

  /* var encrypt = new JSEncrypt();
  encrypt.setPublicKey(atob("LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFqY1dlODVxdGhtZGxJK1h5MCtqMgoweWpGQTkxaXA4Yzd2Qy9Xb1hxc054UmlweXd2NHdPOTE2cEhzTEEwTWgydEF2R01zbU9QRzE4NHNoNngyQ2tECkRwNmpqd2wzSHAvUG1TVUMvREJiYlBORkh4aFEzcFdLTGlGMDhMbElqcHdxazhzY0htaldDWmc2TzEvWVVNZGUKVk9YREVYY29md1pFL3RpZzJjZ0RxT2N5dGxOS2oxa01XTmhMM1RjaU9KZEd2VmFOL2xSK2E3d0hGZDZSbnJSMQpkTFR3S21zMkptZm1pbjFZdS83dWFZZ0Rlc2VJcWc5eEpKek9GdTJXTGZjdWFpVER1ODZYbnlSYmxsR1VuSnhNCkJ1RzNkZ3EvQ2s1dGtIOWRHQVljVTZrc04yK0htdU55Wmx1OVJULytQekxDZTQ3MjJGR3I4bjlWSFhNMlZFVXAKZ1FJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t"));
   var encrypted = encrypt.encrypt("Hola");
   console.log("Cifrado: " + encrypted);*/

  res.send("Recibido");
});

module.exports = router;
