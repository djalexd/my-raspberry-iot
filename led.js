const awsIot = require('aws-iot-device-sdk')

const thing = 'RedLED'

const shadow = awsIot.thingShadow({
    caPath: process.env.caPath,
   keyPath: process.env.keyPath,
  certPath: process.env.certPath,
  clientId: process.env.clientId,
      host: process.env.host
})

let clientTokenUpdate

shadow.on('connect', function() {
    thingShadows.register(thing, {}, function() {
      const state = {
        state: {
          desired: "off"
        }
      }
      clientTokenUpdate = shadow.update(thing, state);
      if (clientTokenUpdate === null) {
        console.log('update shadow failed, operation still in progress')
      }
    })
})

shadow.on('status', (thingName, stat, clientToken, stateObject) => {
  console.log(`received ${stat} on ${thingName}: ${JSON.stringify(stateObject)}`)
})

shadow.on('delta', (thingName, stateObject) => {
  console.log(`received delta on ${thingName}: ${JSON.stringify(stateObject)}`)
})

shadow.on('timeout', (thingName, clientToken) => {
  console.log(`received timeout on ${thingName} with token: ${clientToken}`)
})
