# 🤖 4-DOF Robotic Manipulator Simulation & Sizing Suite

A web-based 3D simulation, kinematics, dynamics, and structural sizing suite for 4-DOF robotic arms.

🌐 **Live Web Demo**: [https://karthick-jnr.github.io/Arm_Simulation/](https://karthick-jnr.github.io/Arm_Simulation/)

## ✨ Features

- **Real-Time 3D Interactive WebGL Simulation**: Powered by Three.js with full orbit controls, dynamic mesh deformation, parametric link dimensions, and joint angle articulation.
- **2D Free Body Diagram (FBD)**: Real-time dynamic drafting canvas rendering joint torques, active sorting envelopes, moment arms, and force vectors with collision-free badges.
- **Multi-Body Dynamics & Motor Sizing**: Static holding torque, dynamic inertial acceleration torques, safety factor bars (SF), and motor catalog selection (RDS5160, MG996R, DS3218, etc.).
- **Parametric Link Scaling**: Real-time elongation and kinematics computation for user-defined link lengths ($L_1, L_2, L_3, L_0$).
- **Clean Architectural UI**: Built with Google Sans typography, silver studio floor, slate gray truss with royal cobalt accents, and smooth drawer slide-outs.

## 🚀 Live Access & Local Quick Start

### 1. Run Directly Online (GitHub Pages)
Visit [https://karthick-jnr.github.io/Arm_Simulation/](https://karthick-jnr.github.io/Arm_Simulation/) directly from any modern web browser on PC, tablet, or phone (no installation needed).

### 2. Running Locally with Python:
```bash
python run_simulator.py
```
Then navigate to `http://localhost:8080/index.html` in your web browser.

## 📂 Project Structure

- `index.html` - Main WebGL and FBD simulation interface
- `css/style.css` - Custom styling tokens, Google Sans typography, and architectural drawer layouts
- `js/`
  - `app.js` - Application coordinator, UI event listeners, and 60 FPS loop
  - `three_view.js` - Three.js WebGL 3D robot arm renderer with parametric meshes
  - `fbd_view.js` - 2D Free Body Diagram technical drawing canvas
  - `physics.js` - Forward kinematics, dynamics, payload analysis, deflection, and bending stress
  - `motor_db.js` - Actuator specifications and 3D printing material properties
- `run_simulator.py` - Local HTTP web server script
