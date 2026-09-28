// Market Hardware Database & Material Properties

const MOTOR_DATABASE = {
    joint1_base: [
        { id: "rds5160", name: "RDS5160 High Torque (60 kg·cm)", torque: 60.0, weight: 162, voltage: "7.4V - 8.4V", speed: "0.13 s/60°", type: "Digital Metal Gear", costINR: 1950, recJoint: "Base / Shoulder" },
        { id: "td8140mg", name: "TD-8140MG Waterproof (40 kg·cm)", torque: 40.0, weight: 65, voltage: "6.0V - 7.4V", speed: "0.18 s/60°", type: "Digital Metal Gear", costINR: 1350, recJoint: "Base / Shoulder" },
        { id: "ds3235", name: "DS3235 Coreless (35 kg·cm)", torque: 35.0, weight: 64, voltage: "6.0V - 7.4V", speed: "0.12 s/60°", type: "Coreless Stainless Steel", costINR: 1700, recJoint: "Base / Shoulder" },
        { id: "ds3225", name: "DS3225 Red (25 kg·cm)", torque: 25.0, weight: 60, voltage: "4.8V - 6.8V", speed: "0.16 s/60°", type: "Digital Metal Gear", costINR: 850, recJoint: "Base / Elbow" },
        { id: "nema17", name: "NEMA 17 Stepper + Geared 5:1 (45 kg·cm)", torque: 45.0, weight: 350, voltage: "12V - 24V", speed: "Stepper (Custom)", type: "Planetary Geared Stepper", costINR: 2200, recJoint: "Base" },
        { id: "custom", name: "Custom Motor Spec...", torque: 50.0, weight: 100, voltage: "Custom", speed: "Custom", type: "User Defined", costINR: 0, recJoint: "Custom" }
    ],
    joint2_shoulder: [
        { id: "rds5160", name: "RDS5160 Heavy Duty (60 kg·cm)", torque: 60.0, weight: 162, voltage: "7.4V - 8.4V", speed: "0.13 s/60°", type: "Digital Metal Gear", costINR: 1950, recJoint: "Shoulder" },
        { id: "td8140mg", name: "TD-8140MG (40 kg·cm)", torque: 40.0, weight: 65, voltage: "6.0V - 7.4V", speed: "0.18 s/60°", type: "Digital Metal Gear", costINR: 1350, recJoint: "Shoulder" },
        { id: "ds3235", name: "DS3235 Coreless (35 kg·cm)", torque: 35.0, weight: 64, voltage: "6.0V - 7.4V", speed: "0.12 s/60°", type: "Coreless Stainless Steel", costINR: 1700, recJoint: "Shoulder" },
        { id: "ds3225", name: "DS3225 (25 kg·cm)", torque: 25.0, weight: 60, voltage: "4.8V - 6.8V", speed: "0.16 s/60°", type: "Digital Metal Gear", costINR: 850, recJoint: "Shoulder" },
        { id: "custom", name: "Custom Motor Spec...", torque: 40.0, weight: 70, voltage: "Custom", speed: "Custom", type: "User Defined", costINR: 0, recJoint: "Custom" }
    ],
    joint3_elbow: [
        { id: "ds3218mg", name: "DS3218MG (20 kg·cm) - Recommended", torque: 20.0, weight: 60, voltage: "4.8V - 6.8V", speed: "0.14 s/60°", type: "Digital Metal Gear", costINR: 650, recJoint: "Elbow" },
        { id: "ds3225", name: "DS3225 (25 kg·cm)", torque: 25.0, weight: 60, voltage: "4.8V - 6.8V", speed: "0.16 s/60°", type: "Digital Metal Gear", costINR: 850, recJoint: "Elbow" },
        { id: "ds3235", name: "DS3235 Coreless (35 kg·cm)", torque: 35.0, weight: 64, voltage: "6.0V - 7.4V", speed: "0.12 s/60°", type: "Coreless Stainless Steel", costINR: 1700, recJoint: "Elbow" },
        { id: "mg996r", name: "TowerPro MG996R (11 kg·cm)", torque: 11.0, weight: 55, voltage: "4.8V - 6.0V", speed: "0.17 s/60°", type: "Analog Metal Gear", costINR: 320, recJoint: "Elbow" },
        { id: "custom", name: "Custom Motor Spec...", torque: 20.0, weight: 60, voltage: "Custom", speed: "Custom", type: "User Defined", costINR: 0, recJoint: "Custom" }
    ],
    joint4_wrist_gripper: [
        { id: "mg90s", name: "MG90S Micro Metal Gear (2.2 kg·cm)", torque: 2.2, weight: 14, voltage: "4.8V - 6.0V", speed: "0.10 s/60°", type: "Micro Metal Gear", costINR: 180, recJoint: "Gripper" },
        { id: "sg90", name: "SG90 Micro Nylon Gear (1.8 kg·cm)", torque: 1.8, weight: 9, voltage: "4.8V - 5.0V", speed: "0.12 s/60°", type: "Micro Nylon Gear", costINR: 95, recJoint: "Gripper" },
        { id: "ds929mg", name: "Corona DS-929MG Digital (2.2 kg·cm)", torque: 2.2, weight: 12.5, voltage: "4.8V - 6.0V", speed: "0.09 s/60°", type: "Precision Digital Micro", costINR: 420, recJoint: "Gripper" },
        { id: "ds3218mg_wrist", name: "DS3218MG Standard (20 kg·cm - Heavy)", torque: 20.0, weight: 60, voltage: "4.8V - 6.8V", speed: "0.14 s/60°", type: "Standard Digital", costINR: 650, recJoint: "Heavy Wrist" },
        { id: "custom", name: "Custom Motor Spec...", torque: 2.5, weight: 15, voltage: "Custom", speed: "Custom", type: "User Defined", costINR: 0, recJoint: "Custom" }
    ]
};

const MATERIAL_DATABASE = {
    pla: {
        name: "3D Printed PLA (Gray & Blue Two-Tone)",
        density: 1.24, // g/cm³ for 100% solid
        yieldStrengthMPa: 45.0, // MPa
        elasticModulusGPa: 3.5, // GPa
        costPerKgINR: 750,
        defaultInfill: 35, // %
        wallThicknessMm: 2.4, // mm
        color: "#505f75", // Sleek Precision Slate Gray
        roughness: 0.35,
        metalness: 0.2
    },
    petg: {
        name: "3D Printed PETG (Tough / Heat Resistant)",
        density: 1.27,
        yieldStrengthMPa: 50.0,
        elasticModulusGPa: 2.1,
        costPerKgINR: 950,
        defaultInfill: 40,
        wallThicknessMm: 2.4,
        color: "#002bbb", // Royal Cobalt
        roughness: 0.35,
        metalness: 0.2
    },
    abs: {
        name: "3D Printed ABS (High Impact / Lightweight)",
        density: 1.04,
        yieldStrengthMPa: 40.0,
        elasticModulusGPa: 2.3,
        costPerKgINR: 850,
        defaultInfill: 35,
        wallThicknessMm: 2.4,
        color: "#334155", // Charcoal Slate
        roughness: 0.45,
        metalness: 0.15
    },
    carbon_fiber_nylon: {
        name: "CF-Nylon (Carbon Fiber Reinforced)",
        density: 1.15,
        yieldStrengthMPa: 85.0,
        elasticModulusGPa: 6.5,
        costPerKgINR: 2800,
        defaultInfill: 30,
        wallThicknessMm: 2.0,
        color: "#1e293b",
        roughness: 0.5,
        metalness: 0.3
    },
    aluminum_6061: {
        name: "CNC Machined Aluminum 6061-T6 (Benchmark)",
        density: 2.70,
        yieldStrengthMPa: 276.0,
        elasticModulusGPa: 68.9,
        costPerKgINR: 1600,
        defaultInfill: 100,
        wallThicknessMm: 3.0,
        color: "#cbd5e1",
        roughness: 0.2,
        metalness: 0.95
    }
};

const GRIPPER_TYPES = [
    { id: "2finger_servo", name: "2-Finger Parallel (Micro Servo Driven)", deadweightG: 42, maxPayloadG: 450, strokeMm: 45, maxGripForceN: 8.5 },
    { id: "2finger_fsr", name: "2-Finger Compliant + Dual FSR Sensors", deadweightG: 50, maxPayloadG: 500, strokeMm: 50, maxGripForceN: 10.0 },
    { id: "vacuum_suction", name: "Mini Suction Cup (Solenoid Vacuum)", deadweightG: 28, maxPayloadG: 350, strokeMm: 0, maxGripForceN: 14.0 },
    { id: "magnetic_gripper", name: "Electromagnetic Pickup Tool", deadweightG: 35, maxPayloadG: 600, strokeMm: 0, maxGripForceN: 18.0 }
];

window.MOTOR_DATABASE = MOTOR_DATABASE;
window.MATERIAL_DATABASE = MATERIAL_DATABASE;
window.GRIPPER_TYPES = GRIPPER_TYPES;
