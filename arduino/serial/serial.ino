/*
 * Museo del Gato — Serial sketch
 *
 * Compatible boards: ANY Arduino with USB serial (Uno, Nano, Mega, Leonardo,
 *                    Pro Micro, ESP32, etc.). Use this if your board does not
 *                    support native USB-HID, or if you prefer an explicit
 *                    serial protocol.
 *
 * The web app (app/game/useSerialBridge.ts) connects via WebSerial API
 * (Chrome/Edge only, requires user gesture once per session).
 *
 * Protocol (text, line-delimited, 9600 baud):
 *   READY            <- sent on boot
 *   P{p}:{b}\n       <- player p (0-3) pressed button b (0-3), e.g. P0:2
 *   T\n              <- tech (encargado) button pressed
 *
 * Wiring: each button connects its pin to GND. Pins use INPUT_PULLUP.
 * Adjust PINS[][] and TECH_PIN to match your physical wiring.
 *
 * NOTE: 16 buttons + 1 tech = 17 pins. Arduino Uno has 14 digital + 6 analog
 * (usable as digital A0-A5) = 20 pins. Plenty for direct wiring. For tighter
 * boards (Nano Every, Pro Micro) consider a button matrix or shift register.
 */

const int PINS[4][4] = {
  // P1                 P2                 P3                  P4
  { 2,  3,  4,  5},   //                   shifted in groups
  { 6,  7,  8,  9},
  {10, 11, 12, 13},
  {A0, A1, A2, A3},
};
const int TECH_PIN = A4;

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

  Serial.begin(9600);
  while (!Serial && millis() < 2000) { /* wait briefly on boards w/ native USB */ }
  Serial.println("READY");
}

void loop() {
  unsigned long now = millis();

  for (int p = 0; p < 4; p++) {
    for (int b = 0; b < 4; b++) {
      bool pressed = digitalRead(PINS[p][b]) == LOW;
      if (pressed != prev[p][b] && (now - lastChange[p][b]) > DEBOUNCE_MS) {
        lastChange[p][b] = now;
        if (pressed) {
          Serial.print('P');
          Serial.print(p);
          Serial.print(':');
          Serial.println(b);
        }
        prev[p][b] = pressed;
      }
    }
  }

  bool techPressed = digitalRead(TECH_PIN) == LOW;
  if (techPressed != prevTech && (now - lastTechChange) > DEBOUNCE_MS) {
    lastTechChange = now;
    if (techPressed) {
      Serial.println('T');
    }
    prevTech = techPressed;
  }

  delay(2);
}
