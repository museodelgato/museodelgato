#include <SoftwareSerial.h>
#include <DFRobotDFPlayerMini.h>
#include <Keyboard.h>

// Definición de pines de botones
#define BTN_Q   A0
#define BTN_W   A1
#define BTN_E   A2
#define BTN_R   A3
#define BTN_ENTER A4

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

// Variables para control de LEDs
unsigned long ledOffTime[4] = {0, 0, 0, 0};
bool ledState[4] = {false, false, false, false};

// Último estado de los botones
int lastButtonState[5] = {HIGH, HIGH, HIGH, HIGH, HIGH};

// Flag para saber si el DFPlayer está disponible
bool dfplayerAvailable = false;

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
  
  // Configurar botones
  pinMode(BTN_Q, INPUT_PULLUP);
  pinMode(BTN_W, INPUT_PULLUP);
  pinMode(BTN_E, INPUT_PULLUP);
  pinMode(BTN_R, INPUT_PULLUP);
  pinMode(BTN_ENTER, INPUT_PULLUP);
  
  // Iniciar teclado HID (siempre funciona)
  Keyboard.begin();
  
  // Serial para debug
  Serial.begin(115200);
  
  // Intentar inicializar DFPlayer (opcional)
  mySoftwareSerial.begin(9600);
  
  Serial.println("Intentando inicializar DFPlayer...");
  
  // Dar tiempo al DFPlayer para encenderse
  delay(500);
  
  if (myDFPlayer.begin(mySoftwareSerial)) {
    dfplayerAvailable = true;
    myDFPlayer.volume(20);
    Serial.println("DFPlayer conectado y listo!");
    
    // Opcional: reproducir un sonido de inicio para confirmar
    // myDFPlayer.play(1);
  } else {
    dfplayerAvailable = false;
    Serial.println("DFPlayer NO detectado - El sistema funciona sin audio");
    
    // Opcional: parpadeo rápido en LED_Q para indicar que no hay DFPlayer
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_Q, HIGH);
      delay(100);
      digitalWrite(LED_Q, LOW);
      delay(100);
    }
  }
}

void loop() {
  // Verificar botones (con o sin DFPlayer)
  checkButton(BTN_Q, '1', 0, LED_Q, 1);
  checkButton(BTN_W, '2', 1, LED_W, 2);
  checkButton(BTN_E, '3', 2, LED_E, 3);
  checkButton(BTN_R, '4', 3, LED_R, 4);
  checkButtonEnter(BTN_ENTER);
  
  // Apagar LEDs después de 1000ms
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
    // Enviar tecla HID (siempre funciona)
    Keyboard.press(keyChar);
    delay(50);
    Keyboard.release(keyChar);
    
    // Encender LED (siempre funciona)
    digitalWrite(ledPin, HIGH);
    ledState[ledIndex] = true;
    ledOffTime[ledIndex] = millis();
    
    // Reproducir audio SOLO si el DFPlayer está disponible
    if (dfplayerAvailable) {
      myDFPlayer.play(trackNumber);
      Serial.print("Audio reproducido: 00");
      Serial.print(trackNumber);
      Serial.println(".mp3");
    } else {
      Serial.print("Tecla enviada: ");
      Serial.print(keyChar);
      Serial.println(" (sin audio - DFPlayer no conectado)");
    }
    
    // Debug
    Serial.print("Botón ");
    Serial.print(keyChar);
    Serial.println(" - LED encendido");
  }
  
  lastButtonState[ledIndex] = currentState;
}

void checkButtonEnter(int buttonPin) {
  int currentState = digitalRead(buttonPin);
  
  if (currentState == LOW && lastButtonState[4] == HIGH) {
    Keyboard.press(KEY_RETURN);
    delay(50);
    Keyboard.release(KEY_RETURN);
    Serial.println("ENTER presionado");
  }
  
  lastButtonState[4] = currentState;
}