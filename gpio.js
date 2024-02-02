const rpio = require('rpio')

const COOL1 = 37
const HEAT1 = 35
const COOL2 = 33
const HEAT2 = 31
const CHILLER = 29

const CLOCK = 38
const DATA = 40

require('dotenv').config()
let options = {}

if (!process.env.RASPBERRY_PI) {
  options.mock = 'raspi-3'
}

rpio.init(options);

rpio.open(COOL1, rpio.OUTPUT, rpio.HIGH);
rpio.open(HEAT1, rpio.OUTPUT, rpio.HIGH);
rpio.open(COOL2, rpio.OUTPUT, rpio.HIGH);
rpio.open(HEAT2, rpio.OUTPUT, rpio.HIGH);
rpio.open(CHILLER, rpio.OUTPUT, rpio.HIGH);

rpio.open(CLOCK, rpio.OUTPUT, rpio.LOW);
rpio.open(DATA, rpio.INPUT, rpio.PULL_DOWN);

const get_hx711_data = () => {
  let output = 0

  for (bit=0; bit<25; bit++) {
    rpio.write(CLOCK, rpio.HIGH);
    const currentBit = rpio.read(DATA) << (24-bit)
    output += currentBit
    rpio.usleep(1);
    rpio.write(CLOCK, rpio.LOW);
  }

  rpio.write(CLOCK, rpio.HIGH);
  rpio.usleep(1);
  rpio.write(CLOCK, rpio.LOW);

  return output
}