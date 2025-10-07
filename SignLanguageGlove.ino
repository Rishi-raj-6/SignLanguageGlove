#include "Wire.h"       
#include "I2Cdev.h"     
#include "MPU6050.h"

// MPU6050 declaration
MPU6050 mpu;
int16_t ax, ay, az;
int16_t gx, gy, gz;

// Struct to store MPU data in 8-bit range
struct MyData {
  byte X;
  byte Y;
  byte Z;
};
MyData data;

// Pin definitions for the flex sensors
int flexSensorPins[5] = {A6, A0, A1, A2, A3}; // Analog pins
int flexValues[5];       // Array to store flex sensor readings
int baseThresholds[5];   // Array to store base values as thresholds
int initialOffsets[5];   // Store the initial offsets (starting positions of fingers)
int bendOffsets[5] = {50, 15, 15, 15, 15}; // Individual offsets for each finger
int calibrationSamples = 10; // Number of samples for baseline calibration

bool isCalibrating = false; // Flag to indicate if calibration is in progress
bool isCalibrated = false;  // Flag to check if calibration is complete
bool isRecalibrating = false; // Flag to indicate if recalibration is needed

// Function to calibrate baseline values for flex sensors
void calibrate() {
  isCalibrating = true; // Set flag to true during calibration
  Serial.println("Calibrating baseline values...");
  for (int i = 0; i < 5; i++) {
    int sum = 0;
    for (int j = 0; j < calibrationSamples; j++) {
      sum += analogRead(flexSensorPins[i]); // Take multiple readings
      delay(10); // Small delay between readings
    }
    baseThresholds[i] = sum / calibrationSamples; // Calculate average
    initialOffsets[i] = baseThresholds[i]; // Store the initial unbent state
    Serial.print("Baseline for Finger ");
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.println(baseThresholds[i]);
  }
  Serial.println("Calibration complete!");
  isCalibrating = false; // Reset flag after calibration
  isCalibrated = true;   // Mark as calibrated
  isRecalibrating = false; // Reset recalibration flag
}

void setup() {
  Serial.begin(9600); // Initialize Serial communication for debugging
  Wire.begin();
  
  // Initialize MPU6050
  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("MPU6050 connection failed!");
    while (1); // Halt if MPU is not detected
  }
  Serial.println("MPU6050 connection successful!");

  // Set flex sensor pins as inputs
  for (int i = 0; i < 5; i++) {
    pinMode(flexSensorPins[i], INPUT);
  }

  // Initial calibration of flex sensors
  calibrate();
}

void loop() {
  // Skip all operations until calibration is complete
  if (isCalibrating || !isCalibrated || isRecalibrating) {
    return; // Do nothing if calibrating or recalibrating
  }

  // Read flex sensor values, but only for the first four fingers
  bool validData = true; // Flag to check if all readings are below 1020
  for (int i = 0; i < 4; i++) { // Only check first four fingers (index 0 to 3)
    flexValues[i] = analogRead(flexSensorPins[i]);
    if (flexValues[i] > 1020) { // Check if any sensor reading exceeds 1020
      validData = false;
      // Print which sensor exceeded the value
      Serial.print("Sensor ");
      Serial.print(i + 1); // Print the finger number (sensor 1 is for the first finger)
      Serial.print(" exceeded the threshold: ");
      Serial.println(flexValues[i]);
      
      // Trigger recalibration if a sensor value exceeds 1020
      if (!isRecalibrating) {
        Serial.println("Recalibrating due to sensor exceeding 1020...");
        isRecalibrating = true; // Set recalibration flag
        calibrate(); // Trigger recalibration
        return; // Exit loop and restart after recalibration
      }
    }
  }

  // At this point, the program is calibrated, and sensor values are valid (below 1020)
  // Now assign the value of x-y-z axis
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  data.X = map(ax, -17000, 17000, 0, 255 ); // X axis data
  data.Y = map(ay, -17000, 17000, 0, 255);  // Y axis data
  data.Z = map(az, -17000, 17000, 0, 255);  // Z axis data

  

  // Check flex sensor status (bent or straight) for the first four fingers
 // Serial.println("Finger Status:");
  bool fingerStatus[5]; // Store finger status for each finger
  for (int i = 0; i < 4; i++) { // Only check the first four fingers
    if (flexValues[i] > baseThresholds[i] + bendOffsets[i]) { // Use individual offsets
      fingerStatus[i] = true; // Finger is bent
    } else {
      fingerStatus[i] = false; // Finger is straight
    }

/*
    // Print finger status
    Serial.print("Finger ");
    Serial.print(i + 1);
    if (fingerStatus[i]) {
      Serial.println(": Bent");
    } else {
      Serial.println(": Straight");
    }
    */
  }
  //print x-y-z axis data
  
  Serial.print("Axis X = ");
  Serial.print(data.X);
  Serial.print("  ");
  Serial.print("Axis Y = ");
  Serial.print(data.Y);
  Serial.print("  ");
  Serial.print("Axis Z = ");
  Serial.println(data.Z);

  // Recognize ASL alphabet based on finger statuses
  char letter = recognizeSignLanguage(fingerStatus);
 // Serial.print("Recognized Sign Language Letter: ");
   Serial.print("SL Letter:");
  Serial.println(letter);
 // delay(2000);

 // Recognize the gesture
  String gesture = recognizeGesture(fingerStatus, data.X, data.Y, data.Z);
  Serial.print("Gesture:");
  Serial.println(gesture);

  Serial.println("---------------------"); // Divider for readability
  delay(500); // Delay for stability


  //Serial.println("---------------------"); // Divider for readability
 // delay(500); // Delay for stability (adjust as needed)
}

// Function to recognize gestures based on accelerometer values and finger statuses
String recognizeGesture(bool fingerStatus[5], int ax, int ay, int az) {
  // Gesture: Hello
  if (ax >= 155 && ax <= 200 && ay >= 49 && ay <= 90 && az >= 5 && az <= 30 &&
      fingerStatus[0] && !fingerStatus[1] && !fingerStatus[2] && !fingerStatus[3]) {
    return "Hello";
  }
  // Gesture: Sorry
  if (ax >= 135 && ax <= 185 && ay >= 210 && ay <= 240 && az >= 25 && az <= 85 &&
      !fingerStatus[0] && fingerStatus[1] && fingerStatus[2] && fingerStatus[3]) {
    return "Sorry";
  }
  // Gesture: Please
  if (ax >= 135 && ax <= 185 && ay >= 210 && ay <= 240 && az >= 25 && az <= 85 &&
      !fingerStatus[0] && !fingerStatus[1] && !fingerStatus[2] && !fingerStatus[3]) {
    return "Please";
  }
  // Gesture: Yes
  if (ax >= 185 && ax <= 215 && ay >= 105 && ay <= 135 && az >= 0 && az <= 25 &&
      fingerStatus[0] && fingerStatus[1] && fingerStatus[2] && fingerStatus[3]) {
    return "Yes";
  }
  // Gesture: Thank You
  if (ax >= 130 && ax <= 150 && ay >= 175 && ay <= 205 && az >= 5 && az <= 30 &&
      !fingerStatus[0] && !fingerStatus[1] && !fingerStatus[2] && !fingerStatus[3]) {
    return "Thank You";
  }
  // Gesture: Welcome
  if (ax >= 95 && ax <= 135 && ay >= 155 && ay <= 195 && az >= 0 && az <= 30 &&
      fingerStatus[0] && !fingerStatus[1] && !fingerStatus[2] && !fingerStatus[3]) {
    return "Welcome";
  }
  // Gesture: Goodbye
  if (ax >= 155 && ax <= 200 && ay >= 90 && ay <= 135 && az >= 5 && az <= 40 &&
      fingerStatus[0] && !fingerStatus[1] && !fingerStatus[2] && !fingerStatus[3]) {
    return "Goodbye";
  }

  return "Unknown";
}

// Function to recognize ASL based on finger status
char recognizeSignLanguage(bool fingerStatus[5]) {
  // Define the ASL letters with finger status combinations
  // This is a simplified mapping, you will need to expand it for all letters

  // K: 0 0 0 1 
  if (!fingerStatus[0] && !fingerStatus[1] && !fingerStatus[2] && fingerStatus[3]) {
    return 'K';
    
  }

  // I: 0 1 1 1 
  if (!fingerStatus[0] && fingerStatus[1] && fingerStatus[2] && fingerStatus[3]) {
    return 'I';
    
  }

  // E: 1 1 1 1 
  if (fingerStatus[0] && fingerStatus[1] && fingerStatus[2] && fingerStatus[3]) {
    return 'E';
 
  }

  // T: 0 0 1 1 
  if (!fingerStatus[0] && !fingerStatus[1] && fingerStatus[2] && fingerStatus[3]) {
    return 'T';
    
  }

  // You can continue expanding this function to include more ASL letters

  return '.';


}