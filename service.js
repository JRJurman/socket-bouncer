const express = require('express')
const expressWs = require('express-ws')
const internalIp = require('internal-ip')
const whitelist = require('./whitelist')

const wsOptions = { clientTracking: true }
const WS = expressWs(express(), null, { wsOptions })
const server = WS.getWss()
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
    Array.from(server.clients)
      .filter(client => client.url === req.url)
      .forEach(client => client.send(msg))
  })
})

const ip = internalIp()
const port = 5150

app.listen(port, () => {
  console.log(`Service running on  ${ip}:${port}`)
})
