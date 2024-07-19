#!/usr/bin/python3
import os

# Mock data if not on hardware
if os.getenv('RASPBERRY_PI', 'false') == 'false':
    print(f'{{"ferm1":950, "ferm2": 970}}')
    quit()

import argparse
import statistics
from hx711 import HX711
import RPi.GPIO as GPIO
from dotenv import load_dotenv

load_dotenv()

parser = argparse.ArgumentParser()
parser.add_argument('--clock', type=int)
parser.add_argument('--data1', type=int)
parser.add_argument('--data2', type=int)
args = parser.parse_args()    
    
try:
    hx711_1 = HX711(
        dout_pin=args.data1,
        pd_sck_pin=args.clock,
        channel='A',
        gain=64
    )

    hx711_1.reset()   # Before we start, reset the HX711 (not obligate)
    measures_1 = hx711_1.get_raw_data(num_measures=10)
    mean_1 = statistics.mean(measures_1)

    hx711_2 = HX711(
        dout_pin=args.data1,
        pd_sck_pin=args.clock,
        channel='A',
        gain=64
    )
    hx711_2.reset()   # Before we start, reset the HX711 (not obligate)
    measures_2 = hx711_2.get_raw_data(num_measures=10)
    mean_2 = statistics.mean(measures_2)

finally:
    GPIO.cleanup()  # always do a GPIO cleanup in your scripts!

print(f'{{"ferm1":{mean_1}, "ferm2": {mean_2}}}')