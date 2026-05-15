#include <SoftwareSerial.h>
#include <DFRobotDFPlayerMini.h>
#include <Keyboard.h>

// Definición de pines de botones
#define BTN_Q   A0   // Botón 1 - Tecla Q
#define BTN_W   A1   // Botón 2 - Tecla W
#define BTN_E   A2   // Botón 3 - Tecla E
#define BTN_R   A3   // Botón 4 - Tecla R
#define BTN_ENTER A4 // Botón 5 - Tecla ENTER

// Definición de pines de LEDs
#define LED_Q   2
#define LED_W   3
#define LED_E   4
#define LED_R   5

// Definición de pines para DFPlayer Mini
#define DFPLAYER_TX   9
#define DFPLAYER_RX   10

// Objetos
SoftwareSerial mySoftwareSerial(DFPLAYER_RX, DFPLAYER_TX);
DFRobotDFPlayerMini myDFPlayer;

// Variables para control de LEDs (apagado automático)
unsigned long ledOffTime[4] = {0, 0, 0, 0};
bool ledState[4] = {false, false, false, false};

// Último estado de los botones
int lastButtonState[5] = {HIGH, HIGH, HIGH, HIGH, HIGH};

// Variable para evitar reproducción redundante
unsigned long lastPlayTime = 0;

void setup() {
  // Configurar LEDs
  pinMode(LED_Q, OUTPUT);
  pinMode(LED_W, OUTPUT);
  pinMode(LED_E, OUTPUT);
  pinMode(LED_R, OUTPUT);
  
  digitalWrite(LED_Q, LOW);
  digitalWrite(LED_W, LOW);
  digitalWrite(LED_E, LOW);
  digitalWrite(LED_R, LOW);
  
  // Configurar botones con pull-up
  pinMode(BTN_Q, INPUT_PULLUP);
  pinMode(BTN_W, INPUT_PULLUP);
  pinMode(BTN_E, INPUT_PULLUP);
  pinMode(BTN_R, INPUT_PULLUP);
  pinMode(BTN_ENTER, INPUT_PULLUP);
  
  // Serial para debug
  Serial.begin(115200);
  
  // Iniciar DFPlayer
  mySoftwareSerial.begin(9600);
  
  Keyboard.begin();
  
  Serial.println("Inicializando DFPlayer...");
  
  if (!myDFPlayer.begin(mySoftwareSerial)) {
    Serial.println("ERROR: No se pudo inicializar DFPlayer!");
    while (true) {
      for(int i = 2; i <= 5; i++) {
        digitalWrite(i, HIGH);
      }
      delay(200);
      for(int i = 2; i <= 5; i++) {
        digitalWrite(i, LOW);
      }
      delay(200);
    }
  }
  
  myDFPlayer.volume(30);
  Serial.println("DFPlayer listo!");
}

void loop() {
  // Verificar botones (la reproducción es inmediata)
  checkButton(BTN_Q, 'u', 0, LED_Q, 1);
  checkButton(BTN_W, 'i', 1, LED_W, 2);
  checkButton(BTN_E, 'o', 2, LED_E, 3);
  checkButton(BTN_R,'p', 3, LED_R, 4);
  checkButtonEnter(BTN_ENTER);
  
  // Apagar LEDs después de 1000ms (esto NO bloquea nada)
  for (int i = 0; i < 4; i++) {
    if (ledState[i] && millis() - ledOffTime[i] >= 1000) {
      digitalWrite(i + 2, LOW);
      ledState[i] = false;
    }
  }
  
  delay(10);
}

void checkButton(int buttonPin, char keyChar, int ledIndex, int ledPin, int trackNumber) {
  int currentState = digitalRead(buttonPin);
  
  if (currentState == LOW && lastButtonState[ledIndex] == HIGH) {
       // 3. Reproducir audio (inmediato) - SIN delay que bloquee
    myDFPlayer.play(trackNumber);  // play() reemplaza automáticamente el audio actual
    
    // 1. Enviar tecla HID (inmediato)
    Keyboard.press(keyChar);
    delay(50);
    Keyboard.release(keyChar);
    
    // 2. Encender LED (inmediato)
    digitalWrite(ledPin, HIGH);
    ledState[ledIndex] = true;
    ledOffTime[ledIndex] = millis();
    

    // Debug
    Serial.print("Botón ");
    Serial.print(keyChar);
    Serial.print(" - LED encendido, reproduce 00");
    Serial.print(trackNumber);
    Serial.println(".mp3");
  }
  
  lastButtonState[ledIndex] = currentState;
}

void checkButtonEnter(int buttonPin) {
  int currentState = digitalRead(buttonPin);
  
  if (currentState == LOW && lastButtonState[4] == HIGH) {
    Keyboard.press(KEY_RETURN);
    delay(50);
    Keyboard.release(KEY_RETURN);
    Serial.println("ENTER");
  }
  
  lastButtonState[4] = currentState;
}