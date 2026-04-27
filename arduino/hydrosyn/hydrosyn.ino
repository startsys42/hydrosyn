#include <WiFi.h>
#include <ESPSupabase.h>
#include "time.h"
#include <HTTPClient.h>

// Add you Wi-Fi credentials
const char* ssid = "DIGIFIBRA-dCzt";
const char* password = "UbQKASyhH2Ne";

// Supabase credentials
const char* supabaseUrl = "https://iolzdktanpnlofgfjorw.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbHpka3RhbnBubG9mZ2Zqb3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTM3NTQsImV4cCI6MjA2OTc4OTc1NH0.JTtINgbiIphtXs0X5Yzi9N3luGKmL30EiZREWJcsj5M";

const char* ESP_CODE="hfkfjfhye566";

const char* SYSTEM_NAME = "pruebaSistema";
const char* ESP_NAME = "espPrueba";

// ===== DRV8833 pins (cámbialos si quieres) =====
// Motor A: AIN1/AIN2
#define AIN1 26
#define AIN2 27
// Motor B: BIN1/BIN2
#define BIN1 14
#define BIN2 12


// ===== PWM ESP32 =====
const uint32_t PWM_FREQ = 20000; // DRV8833 va muy bien a 20 kHz (menos ruido)
const uint8_t  PWM_RES  = 8;     // 0-255, velocidad
// ===== Movimientos demo =====
int velocidad = 255; // 0-255
// Objeto Supabase
Supabase db;

// Tiempo de calibración (30 segundos = 30000 ms)
const unsigned long TIEMPO_CALIBRACION = 30000;

const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 3600;  // España = 3600 (UTC+1)
const int   daylightOffset_sec = 3600;  // Horario de verano

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
     Serial.print(".");
    delay(1000);
   
  }
    // Configurar hora con NTP
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  
  // Esperar sincronización
  struct tm timeinfo;
  while(!getLocalTime(&timeinfo)){
    Serial.println("Waiting for time sync...");
    delay(1000);
  }

 db.begin(supabaseUrl, supabaseKey);


 // PWM por pin (ESP32 core 3.x)
 ledcAttach(AIN1, PWM_FREQ, PWM_RES);
  ledcAttach(AIN2, PWM_FREQ, PWM_RES);
  ledcAttach(BIN1, PWM_FREQ, PWM_RES);
  ledcAttach(BIN2, PWM_FREQ, PWM_RES);
 pararCoast();
}


void loop() {
    Serial.println("\n=== NUEVA ITERACIÓN DEL LOOP ===");  // ← AÑADE ESTO
  Serial.print("Estado WiFi: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "CONECTADO" : "DESCONECTADO");
  checkLightProgramRPC();
  checkCalibrationRPC();
  delay(5000);
  checkLightProgramRPC();
  checkManualRecordRPC();
  delay(5000);
  checkLightProgramRPC();
  checkProgramRecordRPC();
  delay(5000);
  
 
}


String callSupabaseRPC(const char* functionName, const String& jsonParams) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("No WiFi");
    return "{\"error\":\"no wifi\"}";
  }
  
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/rpc/" + String(functionName);
  
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Accept", "application/json");
  
  int httpCode = http.POST(jsonParams);
  String response = http.getString();
  http.end();
  
  if (httpCode != 200) {
    Serial.print("HTTP Error ");
    Serial.print(httpCode);
    Serial.print(": ");
    Serial.println(response);
    return "{\"error\":\"http " + String(httpCode) + "\"}";
  }
  
  return response;
}

// ===========================================
// CALIBRACIONES
// ===========================================
void checkCalibrationRPC() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  // Crear JSON con parámetros
  StaticJsonDocument<2028> params;
  params["p_system_name"] = SYSTEM_NAME;
  params["p_esp_name"] = ESP_NAME;
  params["p_code"] = ESP_CODE;
  
  String jsonParams;
  serializeJson(params, jsonParams);
  
  // ✅ LLAMADA RPC CON HTTPClient
  String resultado = callSupabaseRPC("get_pending_calibrations", jsonParams);
  
  Serial.print("Respuesta: ");
  Serial.println(resultado);
  
  // Procesar resultado (IGUAL que antes)
  DynamicJsonDocument doc(8192);
  DeserializationError error = deserializeJson(doc, resultado);
  
  if (error || doc.size() == 0) {
    Serial.println("No hay calibraciones pendientes");
    return;
  }
  
  JsonArray calibraciones = doc.as<JsonArray>();
  
  for (JsonObject cal : calibraciones) {
    long calId = cal["calibration_id"];
    int gpio = cal["pump_gpio"];
    
    Serial.print("Calibrando GPIO "); Serial.println(gpio);
    checkLightProgramRPC();
    activatePumpByGPIO(gpio, 30000);
    markCalibrationAsCompleted(calId);
  }
}



// ===========================================
// RECORDS MANUALES
// ===========================================
void checkManualRecordRPC() {
  if (WiFi.status() != WL_CONNECTED) return;

  Serial.println("\n--- Buscando records manuales pendientes ---");
  
  StaticJsonDocument<2048> params;
  params["p_system_name"] = SYSTEM_NAME;
  params["p_esp_name"] = ESP_NAME;
  params["p_code"] = ESP_CODE;
  
  String jsonParams;
  serializeJson(params, jsonParams);
  
  // ✅ LLAMADA RPC CON HTTPClient
  String resultado = callSupabaseRPC("get_pending_manual_records", jsonParams);
  
  Serial.print("Respuesta: ");
  Serial.println(resultado);
  
  // Procesar resultado (IGUAL)
  DynamicJsonDocument doc(8192);
  DeserializationError error = deserializeJson(doc, resultado);
  
  if (error || doc.size() == 0) {
    Serial.println("No hay records manuales pendientes");
    return;
  }
  
  JsonArray records = doc.as<JsonArray>();
  
  for (JsonObject record : records) {
    long recordId = record["record_id"];
    int gpio = record["pump_gpio"];
    unsigned long tiempoMs = record["required_time_ms"];
    
    Serial.print("Record ID: "); Serial.print(recordId);
    Serial.print(" GPIO: "); Serial.print(gpio);
    Serial.print(" Tiempo: "); Serial.print(tiempoMs/1000); Serial.println(" seg");
    checkLightProgramRPC();
    activatePumpByGPIO(gpio, tiempoMs);
    markRecordAsCompleted(recordId);
  }
}

// ===========================================
// PROGRAMACIONES
// ===========================================
void checkProgramRecordRPC() {
  if (WiFi.status() != WL_CONNECTED) return;

  Serial.println("\n--- Buscando programaciones pendientes ---");
  
   // Obtener hora actual
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("Failed to obtain time");
    return;
  }
  
  char timeStr[30];
  strftime(timeStr, sizeof(timeStr), "%Y-%m-%d %H:%M:%S", &timeinfo);
  
  StaticJsonDocument<2048> params;
  params["p_system_name"] = SYSTEM_NAME;
  params["p_esp_name"] = ESP_NAME;
  params["p_code"] = ESP_CODE;
  params["p_esp_time"] = timeStr;  // 👈 AÑADIR ESTO

  
  String jsonParams;
  serializeJson(params, jsonParams);
  
  //  LLAMADA RPC CON HTTPClient
  String resultado = callSupabaseRPC("get_pending_programs", jsonParams);
  
  Serial.print("Respuesta: ");
  Serial.println(resultado);
  
  // Procesar resultado (IGUAL)
  DynamicJsonDocument doc(8192);
  DeserializationError error = deserializeJson(doc, resultado);
  
  if (error || doc.size() == 0) {
    Serial.println("No hay programaciones pendientes");
    return;
  }
  
  JsonArray programas = doc.as<JsonArray>();
  
  for (JsonObject prog : programas) {
    long progId = prog["programming_id"];
    int gpio = prog["gpio"];
    unsigned long tiempoMs = prog["required_time_ms"];
    
    Serial.print("Programación ID: "); Serial.print(progId);
    Serial.print(" GPIO: "); Serial.print(gpio);
    Serial.print(" Tiempo: "); Serial.print(tiempoMs/1000); Serial.println(" seg");
    checkLightProgramRPC();
    activatePumpByGPIO(gpio, tiempoMs);
    registerExecution(progId);
  }
}


// ===========================================
// CONTROL DE MOTORES
// ===========================================
void activatePumpByGPIO(int gpio, unsigned long tiempoMs) {
  Serial.print("Activando bomba GPIO ");
  Serial.print(gpio);
  Serial.print(" durante ");
  Serial.print(tiempoMs / 1000);
  Serial.println(" segundos...");
  
 
  
 
  
  delay(tiempoMs);
  pararCoast();
}



void markCalibrationAsCompleted(long calId) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  StaticJsonDocument<2048> params;
  params["p_calibration_id"] = calId;
  params["p_esp_name"] = ESP_NAME;
  params["p_code"] = ESP_CODE;
  
  String jsonParams;
  serializeJson(params, jsonParams);
  
  //  RPC CON HTTPClient
  String resultado = callSupabaseRPC("complete_calibration", jsonParams);
  
  if (resultado == "true") {
    Serial.println(" Calibración completada");
  } else {
    Serial.println(" Error: " + resultado);
  }
}

void markRecordAsCompleted(long recordId) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  StaticJsonDocument<2048> params;
  params["p_record_id"] = recordId;
  params["p_esp_name"] = ESP_NAME;
  params["p_code"] = ESP_CODE;
  
  String jsonParams;
  serializeJson(params, jsonParams);
  
  //  RPC CON HTTPClient
  String resultado = callSupabaseRPC("complete_manual_record", jsonParams);
  
  if (resultado == "true") {
    Serial.println(" Record completado");
  } else {
    Serial.println(" Error: " + resultado);
  }
}

void registerExecution(long programmingId) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  StaticJsonDocument<2048> params;
  params["p_programming_id"] = programmingId;
  params["p_esp_name"] = ESP_NAME;
  params["p_code"] = ESP_CODE;
  params["p_success"] = true;
  
  String jsonParams;
  serializeJson(params, jsonParams);
  
  //  RPC CON HTTPClient
  String resultado = callSupabaseRPC("register_execution", jsonParams);
  
  if (resultado == "true") {
    Serial.println(" Ejecución registrada");
  } else {
    Serial.println(" Error: " + resultado);
  }
}

void setMotor(int gpio, int speed) {
   speed = constrain(speed, 0, 255);
  if (gpio == AIN1 || gpio == AIN2) {
     pwmWritePin(AIN1, speed);
  pwmWritePin(AIN2, 0);
  } 
  else if (gpio == BIN1 || gpio == BIN2) {
    pwmWritePin(BIN1, speed);
  pwmWritePin(BIN2, 0);
  }
 

}

















// ===== PWM helper (core 3.x) =====
inline void pwmWritePin(int pin, int duty0_255) {
  if (duty0_255 < 0) duty0_255 = 0;
  if (duty0_255 > 255) duty0_255 = 255;
  ledcWrite(pin, duty0_255);  // escribir PWM al pin
}


// Frenado activo (brake): IN1=IN2=HIGH (o PWM alto)
// OJO: con PWM por pin, lo hacemos poniendo ambos a 255.
void brakeA() {
  pwmWritePin(AIN1, 255);
  pwmWritePin(AIN2, 255);
}
void brakeB() {
  pwmWritePin(BIN1, 255);
  pwmWritePin(BIN2, 255);
}







void pararCoast() {

  setMotor(AIN1,0);
  setMotor(BIN1,0);
}

void pararBrake() {
 
  brakeA();
  brakeB();
}

void checkLightProgramRPC() {
  if (WiFi.status() != WL_CONNECTED) return;

  Serial.println("\n--- Buscando luces pendientes ---");

  // Obtener hora actual
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("Failed to obtain time");
    return;
  }
  
  char timeStr[30];
  strftime(timeStr, sizeof(timeStr), "%Y-%m-%d %H:%M:%S", &timeinfo);
    Serial.print("Hora ESP32: ");
  Serial.println(timeStr);
  StaticJsonDocument<2048> params;
  params["p_system_name"] = SYSTEM_NAME;
  params["p_esp_name"] = ESP_NAME;
  params["p_code"] = ESP_CODE;
  params["p_esp_time"] = timeStr;  // 👈 AÑADIR ESTO

  String jsonParams;
  serializeJson(params, jsonParams);

  String resultado = callSupabaseRPC("get_pending_light_events", jsonParams);

  Serial.print("Respuesta: ");
  Serial.println(resultado);

  DynamicJsonDocument doc(8192);
  DeserializationError error = deserializeJson(doc, resultado);

  if (error || doc.size() == 0) {
    Serial.println("No hay eventos de luces pendientes");
    return;
  }

  JsonArray luces = doc.as<JsonArray>();
  
  for (JsonObject luz : luces) {
    long lightId = luz["light_id"];
    int gpio = luz["gpio"];
    int action = luz["action"];  // 1=ON, 0=OFF
    String scheduled = luz["scheduled_at"];

    Serial.print("Light ID: "); Serial.print(lightId);
    Serial.print(" GPIO: "); Serial.print(gpio);
    Serial.print(" Acción: "); Serial.println(action);

    // Encender o apagar
    setLight(gpio, action == 1);

    // Registrar en history
    registerLightHistory(lightId, action, scheduled);
  }
}
void setLight(int gpio, bool on) {
  pinMode(gpio, OUTPUT);
 digitalWrite(gpio, on ? LOW : HIGH);
  Serial.print("Light GPIO "); Serial.print(gpio);
  Serial.print(" -> ");
  Serial.println(on ? "ON" : "OFF");
}

void registerLightHistory(long lightId, int action, String scheduledAt) {
    if (WiFi.status() != WL_CONNECTED) return;

    StaticJsonDocument<1024> params;
    params["p_light_id"] = lightId;
    params["p_action"] = action;          // 1 = ON, 0 = OFF
    params["p_esp_name"] = ESP_NAME;
    params["p_code"] = ESP_CODE;
    params["p_scheduled_at"] = scheduledAt;

    String jsonParams;
    serializeJson(params, jsonParams);

    String resultado = callSupabaseRPC("register_light_event", jsonParams);

    if (resultado == "true") {
        Serial.println("Historial de luz registrado");
    } else {
        Serial.println("Error al registrar historial de luz: " + resultado);
    }
}
