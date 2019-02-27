const https = require('https');
const fs = require('fs');
const express = require('express')
const expressWs = require('express-ws')
const internalIp = require('internal-ip')
const whitelist = require('./whitelist')

// ssl keys from lets encrypt
// generate keys with `sudo certbot renew`
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/socket-bouncer.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/socket-bouncer.com/cert.pem')
};

const app = express();
const server = https.createServer(options, app);

const wsOptions = { clientTracking: true }
const WS = expressWs(app, server, { wsOptions })
const wsServer = WS.getWss()
const app = WS.app

// validate origin
app.use((req, res, next) => {
  const origin = req.get('origin')
  if (!origin.match(whitelist)) {
    const error = `Origin ${origin} not included in whitelist for socket-bouncer`
    console.log(error)
    res.send(error)
  } else {
    return next();
  }
})

app.ws('*', (wsclient, req) => {

  wsclient.url = req.url

  wsclient.on('message', (msg) => {
    Array.from(wsServer.clients)
      .filter(client => client.url === req.url)
      .forEach(client => client.send(msg))
  })
})

const ip = internalIp()
const port = 5150

app.listen(port, () => {
  console.log(`Service running on  ${ip}:${port}`)
})
