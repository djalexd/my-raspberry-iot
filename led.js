const awsIot = require('aws-iot-device-sdk')
const fs = require('fs')
const gpio = require('rpi-gpio')

const usageAndExit = () => {
  console.log(`Usage`)
  console.log(`\tnode led.js --config=<configuration file>`)
  process.exit(1)
}

if (process.argv.length < 3) {
  usageAndExit()
}

const args = require('minimist')(process.argv.slice(2))
if (!args.config) {
  console.log('Missing --config argument')
  usageAndExit()
}

const config = JSON.parse(fs.readFileSync(args.config, 'utf8'))

if (!config.thingName) {
  console.log('Missing thingName from config file')
  usageAndExit()
}

if (!config.pin) {
  console.log('Missing output pin from config file')
  usageAndExit()
}

const setup = (pin, dir) => {
  return new Promise((resolve, reject) => {
    gpio.setup(pin, dir, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

const write = (pin, state) => {
  return new Promise((resolve, reject) => {
    gpio.write(pin, state, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

const thing = args.thingName
const shadow = awsIot.thingShadow(config)

let clientTokenUpdate

shadow.on('connect', function() {
    shadow.register(thing, {}, function() {
      const state = {
        "state": {
          "desired": {
            "toggle": "off"
          }
        }
      }
      clientTokenUpdate = shadow.update(thing, state)
      if (clientTokenUpdate === null) {
        console.log('update shadow failed, operation still in progress')
      }
    })
})

shadow.on('status', (thingName, stat, clientToken, stateObject) => {
  console.log(`received status '${stat}' on ${thingName}: ${JSON.stringify(stateObject)}`)
})

shadow.on('delta', (thingName, stateObject) => {
  console.log(`received delta on ${thingName}: ${JSON.stringify(stateObject)}`)
  if (stateObject.state && stateObject.state.toggle) {
    setup(config.pin, gpio.DIR_OUT)
    .then(_ => write(config.pin, stateObject.state.toggle === "on"))
  }
})

shadow.on('timeout', (thingName, clientToken) => {
  console.log(`received timeout on ${thingName} with token: ${clientToken}`)
})
