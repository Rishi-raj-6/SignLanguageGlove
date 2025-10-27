## 🧤 Sign Language Translating Glove

[![Patent Status](https://img.shields.io/badge/Patent-Filed-orange?style=for-the-badge)](https://drive.google.com/file/d/1mAWRo3B0yhgc6pjPqB1Wzh_iHI6tEH8N/view?usp=drive_link)

This Arduino-based project detects hand gestures using **MPU6050 (Accelerometer + Gyroscope)** and **flex sensors** on a glove, then translates them into text (or can be extended to speech).  
It uses an **HC-05 Bluetooth module** for wireless communication with a mobile or PC.

---

## 🔧 Components Used
- Arduino Nano  
- MPU6050 Sensor  
- 5 Flex Sensors  
- HC-05 Bluetooth Module  
- Jumper Wires  
- Power Supply (Battery or USB)

---

## ⚙️ Working Principle
1. The **MPU6050** detects the orientation (X, Y, Z axes).  
2. The **flex sensors** detect finger bending.  
3. Data is processed by Arduino to identify specific **ASL letters or gestures**.  
4. The result is sent via **Bluetooth (HC-05)** to a receiver app or serial monitor.

---

## 🧠 Key Features
✅ Gesture recognition using MPU6050  
✅ Real-time calibration of flex sensors  
✅ Recalibration when abnormal readings are detected  
✅ Bluetooth communication with HC-05  
✅ Ready for expansion to full ASL alphabet  

---

## 📁 Code Overview
- **Calibration**: Ensures each finger’s resting position is recorded.  
- **Gesture Detection**: Maps MPU + flex sensor data to known patterns.  
- **ASL Recognition**: Recognizes specific letters (E, I, K, T).  
- **Recalibration**: Automatically resets thresholds if readings drift.

---

## 🧰 Libraries Required
- [Wire.h](https://www.arduino.cc/en/reference/wire)  
- [I2Cdev.h](https://github.com/jrowberg/i2cdevlib)  
- [MPU6050.h](https://github.com/jrowberg/i2cdevlib/tree/master/Arduino/MPU6050)

---

## 📸 Circuit Overview

| Component | Arduino Pin |
|------------|--------------|
| Flex Sensor 1 | A6 |
| Flex Sensor 2 | A0 |
| Flex Sensor 3 | A1 |
| Flex Sensor 4 | A2 |
| Flex Sensor 5 | A3 |
| MPU6050 SDA | A4 |
| MPU6050 SCL | A5 |
| HC-05 TX | D0 (RX) |
| HC-05 RX | D1 (TX) |
| Power | 5V & GND |

---

## 🧑‍💻 Authors
**Rishi Raj**  
**Aryan Kumar Tiwari**  
**Dhruv Kesarwani**  
*(Built for IoT + Hardware innovation projects)*

---

## 🧩 Patent Information

This project is officially patented in India.

- **Application No.:** 202511085296 A  
- **Date of Filing:** 09/09/2025  
- **Publication Date:** 26/09/2025  
- **Patent Document:** [View Patent PDF](https://drive.google.com/file/d/1mAWRo3B0yhgc6pjPqB1Wzh_iHI6tEH8N/view?usp=drive_link)

> This ensures that the **Sign Language Translating Glove** is legally protected under patent law.

---


