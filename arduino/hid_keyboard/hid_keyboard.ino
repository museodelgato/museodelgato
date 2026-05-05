/*
 * Museo del Gato — HID Keyboard sketch
 *
 * Compatible boards: Arduino Leonardo, Pro Micro, Micro, Due, Zero,
 *                    Teensy, ESP32-S2 / ESP32-S3 (USB Host enabled).
 *                    NOT Arduino Uno/Nano/Mega (no native USB-HID).
 *
 * The board emulates a USB keyboard. The web app (app/game/useKeyboardInput.ts)
 * listens for these keys — no drivers, no permissions, no extra wiring.
 *
 * Required library: "Keyboard" (built-in in the Arduino IDE).
 *
 * Wiring (simple pull-up buttons):
 *   Each button has one leg to its assigned pin and the other to GND.
 *   pinMode INPUT_PULLUP -> pressed reads LOW.
 *
 * Key mapping (matches app/game/useKeyboardInput.ts):
 *   P1 buttons -> '1' '2' '3' '4'   (Orejas, Pata, Cara, Cola)
 *   P2 buttons -> 'q' 'w' 'e' 'r'
 *   P3 buttons -> 'a' 's' 'd' 'f'
 *   P4 buttons -> 'z' 'x' 'c' 'v'
 *   Tech button -> SPACE (' ')
 *
 * Adjust PINS[][] below to match your physical wiring.
 */

#include <Keyboard.h>

const char KEY_MAP[4][4] = {
  {'1', '2', '3', '4'},  // Player 1
  {'q', 'w', 'e', 'r'},  // Player 2
  {'a', 's', 'd', 'f'},  // Player 3
  {'z', 'x', 'c', 'v'},  // Player 4
};

// Adjust these pins to wherever you wire the buttons.
// Pro Micro example pinout (avoid pins used by USB / TX / RX if you need them):
const int PINS[4][4] = {
  { 2,  3,  4,  5},   // P1
  { 6,  7,  8,  9},   // P2
  {10, 14, 15, 16},   // P3
  {18, 19, 20, 21},   // P4
};
const int TECH_PIN = 1;  // free pin (TX1 on Pro Micro). Change to any unused pin.

const unsigned long DEBOUNCE_MS = 25;

bool prev[4][4];
bool prevTech;
unsigned long lastChange[4][4];
unsigned long lastTechChange;

void setup() {
  for (int p = 0; p < 4; p++) {
    for (int b = 0; b < 4; b++) {
      pinMode(PINS[p][b], INPUT_PULLUP);
      prev[p][b] = false;
      lastChange[p][b] = 0;
    }
  }
  pinMode(TECH_PIN, INPUT_PULLUP);
  prevTech = false;
  lastTechChange = 0;

  Keyboard.begin();
}

void loop() {
  unsigned long now = millis();

  // Player buttons — fire on press edge, debounced.
  for (int p = 0; p < 4; p++) {
    for (int b = 0; b < 4; b++) {
      bool pressed = digitalRead(PINS[p][b]) == LOW;
      if (pressed != prev[p][b] && (now - lastChange[p][b]) > DEBOUNCE_MS) {
        lastChange[p][b] = now;
        if (pressed) {
          Keyboard.press(KEY_MAP[p][b]);
          delay(15);
          Keyboard.release(KEY_MAP[p][b]);
        }
        prev[p][b] = pressed;
      }
    }
  }

  // Tech button — SPACE.
  bool techPressed = digitalRead(TECH_PIN) == LOW;
  if (techPressed != prevTech && (now - lastTechChange) > DEBOUNCE_MS) {
    lastTechChange = now;
    if (techPressed) {
      Keyboard.press(' ');
      delay(15);
      Keyboard.release(' ');
    }
    prevTech = techPressed;
  }

  delay(2);
}
