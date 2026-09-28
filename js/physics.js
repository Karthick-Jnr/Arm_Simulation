/**
 * Robotics Physics, Kinematics & Structural Dynamics Engine
 * Handles 3-DOF / 4-DOF Articulated Arm Physics:
 * - Forward & Inverse Kinematics (FK / IK)
 * - Parametric mass, CG, and Inertia calculations based on Link Dimensions & Material Infill %
 * - Static Holding Torque & Dynamic Newton-Euler Torques (with user-defined acceleration)
 * - Bending stress & safety factor (SF) for 3D printed PLA
 * - 3D Workspace volume cloud generator
 */

class ManipulatorPhysics {
    constructor() {
        this.gravity = 9.80665; // m/s²
    }

    /**
     * Compute mass and CG for a 3D-printed link
     * @param {number} lengthMm - length of the link in mm
     * @param {number} widthMm - outer width/diameter in mm (default 24mm)
     * @param {number} heightMm - outer height in mm (default 24mm)
     * @param {number} wallMm - shell wall thickness in mm
     * @param {number} infillPct - infill percentage (0-100)
     * @param {number} densityGcm3 - solid material density in g/cm³
     * @param {number} harnessG - internal wiring / bracket parasitic mass in g
     */
    calculateLinkMassProperties(lengthMm, widthMm = 24, heightMm = 24, wallMm = 2.4, infillPct = 35, densityGcm3 = 1.24, harnessG = 15) {
        const lengthCm = lengthMm / 10.0;
        const widthCm = widthMm / 10.0;
        const heightCm = heightMm / 10.0;
        const wallCm = wallMm / 10.0;

        // Outer volume
        const totalVolCm3 = lengthCm * widthCm * heightCm;
        
        // Inner core volume
        const innerWidthCm = Math.max(0, widthCm - 2 * wallCm);
        const innerHeightCm = Math.max(0, heightCm - 2 * wallCm);
        const innerVolCm3 = lengthCm * innerWidthCm * innerHeightCm;
        
        // Solid shell volume
        const shellVolCm3 = totalVolCm3 - innerVolCm3;
        
        // Infill effective volume
        const effectiveInfillVolCm3 = innerVolCm3 * (infillPct / 100.0);
        const totalMaterialVolCm3 = shellVolCm3 + effectiveInfillVolCm3;
        
        // Net structural mass
        const structureMassG = totalMaterialVolCm3 * densityGcm3;
        const totalMassG = structureMassG + harnessG;

        // Weight in Newtons
        const weightN = (totalMassG / 1000.0) * this.gravity;

        // Second moment of area I_xx for rectangular hollow beam (for bending stress)
        // I = (B*H^3 - b*h^3) / 12  in mm^4
        const I_outer = (widthMm * Math.pow(heightMm, 3)) / 12.0;
        const innerW = Math.max(1, widthMm - 2 * wallMm);
        const innerH = Math.max(1, heightMm - 2 * wallMm);
        const I_inner = (innerW * Math.pow(innerH, 3)) / 12.0;
        // Infill contributes partially to core stiffness (approx 0.4 * infillPct)
        const I_infill = I_inner * (infillPct / 100.0) * 0.35;
        const I_xx = (I_outer - I_inner) + I_infill; // mm^4

        // Section modulus Z = I / (H/2)
        const sectionModulusMm3 = I_xx / (heightMm / 2.0);

        return {
            structureMassG,
            totalMassG,
            weightN,
            cgPositionMm: lengthMm / 2.0, // symmetric CG
            I_xx,
            sectionModulusMm3
        };
    }

    /**
     * Compute full forward kinematics
     * Joint angles in degrees: theta1 (Base Azimuth), theta2 (Shoulder Pitch), theta3 (Elbow Pitch), theta4 (Wrist Pitch)
     * Base pivot origin: (0, 0, baseHeightMm)
     */
    forwardKinematics(theta1Deg, theta2Deg, theta3Deg, theta4Deg, L_base, L1, L2, L3) {
        const q1 = (theta1Deg * Math.PI) / 180.0;
        const q2 = (theta2Deg * Math.PI) / 180.0;
        const q3 = (theta3Deg * Math.PI) / 180.0;
        const q4 = (theta4Deg * Math.PI) / 180.0;

        // Origin at ground datum
        const p0 = { x: 0, y: 0, z: 0, r: 0, rx: 0 };
        
        // J2 Shoulder Pivot
        const p1 = { x: 0, y: 0, z: L_base, r: 0, rx: 0 };

        // Planar radial and vertical components
        // Angle relative to horizontal ground
        const phi1 = q2; 
        const phi2 = q2 + q3;
        const phi3 = q2 + q3 + q4;

        // Link 1 end (J3 Elbow)
        const r1 = L1 * Math.cos(phi1);
        const z1 = L_base + L1 * Math.sin(phi1);
        const p2 = {
            x: r1 * Math.cos(q1),
            y: r1 * Math.sin(q1),
            z: z1,
            r: r1,
            rx: r1
        };

        // Link 2 end (J4 Wrist)
        const r2 = r1 + L2 * Math.cos(phi2);
        const z2 = z1 + L2 * Math.sin(phi2);
        const p3 = {
            x: r2 * Math.cos(q1),
            y: r2 * Math.sin(q1),
            z: z2,
            r: r2,
            rx: r2
        };

        // Gripper Tip / End Effector (Payload point)
        const r3 = r2 + L3 * Math.cos(phi3);
        const z3 = z2 + L3 * Math.sin(phi3);
        const p4 = {
            x: r3 * Math.cos(q1),
            y: r3 * Math.sin(q1),
            z: z3,
            r: r3,
            rx: r3
        };

        // Radial horizontal reach from base axis
        const radialReach = Math.sqrt(p4.x * p4.x + p4.y * p4.y);

        return {
            p0, p1, p2, p3, p4,
            radialReach,
            q1, q2, q3, q4,
            phi1, phi2, phi3
        };
    }

    /**
     * Analytical Inverse Kinematics for 3-DOF Arm (Target X, Y, Z in mm)
     */
    inverseKinematics(targetX, targetY, targetZ, L_base, L1, L2, L3, wristAngleDeg = 0) {
        // Base Azimuth
        let theta1 = Math.atan2(targetY, targetX) * (180.0 / Math.PI);
        const R_total = Math.sqrt(targetX * targetX + targetY * targetY);
        
        // Target relative to shoulder
        const wristAngleRad = (wristAngleDeg * Math.PI) / 180.0;
        const Rw = R_total - L3 * Math.cos(wristAngleRad);
        const Zw = targetZ - L_base - L3 * Math.sin(wristAngleRad);

        const D_sq = Rw * Rw + Zw * Zw;
        const D = Math.sqrt(D_sq);

        if (D > (L1 + L2) || D < Math.abs(L1 - L2)) {
            return { reachable: false, reason: "Target out of reach" };
        }

        // Cosine rule for elbow angle
        const cos_q3 = (D_sq - L1 * L1 - L2 * L2) / (2 * L1 * L2);
        const clamped_cos = Math.max(-1.0, Math.min(1.0, cos_q3));
        const q3_rad = -Math.acos(clamped_cos); // Elbow up/down config

        // Shoulder angle
        const alpha = Math.atan2(Zw, Rw);
        const beta = Math.atan2(L2 * Math.sin(-q3_rad), L1 + L2 * Math.cos(q3_rad));
        const q2_rad = alpha + beta;

        const theta2 = q2_rad * (180.0 / Math.PI);
        const theta3 = q3_rad * (180.0 / Math.PI);
        const theta4 = wristAngleDeg - (theta2 + theta3);

        return {
            reachable: true,
            theta1,
            theta2,
            theta3,
            theta4
        };
    }

    /**
     * Compute comprehensive static and dynamic torques, force vectors, and stresses
     */
    evaluateArmDynamics(config) {
        const {
            theta1, theta2, theta3, theta4,
            L_base, L1, L2, L3,
            link1Props, link2Props,
            servo1, servo2, servo3, servo4,
            gripper,
            payloadG,
            accelerationMs2,
            angularAccelRadS2
        } = config;

        // Kinematics positions
        const fk = this.forwardKinematics(theta1, theta2, theta3, theta4, L_base, L1, L2, L3);
        
        // Effective vertical acceleration factor (opposing gravity during lift)
        const g_eff = this.gravity + Math.max(0, accelerationMs2);

        // Mass breakdowns (in kg)
        const m_link1 = link1Props.totalMassG / 1000.0;
        const m_j3_node = (servo3.weight + 40 + 10) / 1000.0; // servo + bracket + horn (kg)
        const m_link2 = link2Props.totalMassG / 1000.0;
        const m_j4_node = (servo4.weight + gripper.deadweightG) / 1000.0; // gripper assembly (kg)
        const m_payload = (payloadG || 0) / 1000.0;

        // Gravity Forces (N)
        const W_link1 = m_link1 * this.gravity;
        const W_j3_node = m_j3_node * this.gravity;
        const W_link2 = m_link2 * this.gravity;
        const W_j4_node = m_j4_node * this.gravity;
        const W_payload = m_payload * this.gravity;

        // Dynamic Lift Forces (N)
        const Fdyn_link1 = m_link1 * g_eff;
        const Fdyn_j3_node = m_j3_node * g_eff;
        const Fdyn_link2 = m_link2 * g_eff;
        const Fdyn_j4_node = m_j4_node * g_eff;
        const Fdyn_payload = m_payload * g_eff;

        // Moment arms from Joint 3 (Elbow) in horizontal projection (in meters)
        // Elbow is at (r1)
        const cos_phi2 = Math.cos(fk.phi2);
        const cos_phi3 = Math.cos(fk.phi3);
        
        const arm_link2_from_j3 = (L2 / 2000.0) * Math.abs(cos_phi2);
        const arm_j4_from_j3 = (L2 / 1000.0) * Math.abs(cos_phi2);
        const arm_pay_from_j3 = (L2 / 1000.0) * Math.abs(cos_phi2) + (L3 / 1000.0) * Math.abs(cos_phi3);

        // Joint 3 (Elbow) Torque Calculation (N·m and kg·cm)
        // Static holding torque
        const tau_j3_static_Nm = (W_link2 * arm_link2_from_j3) + 
                                 (W_j4_node * arm_j4_from_j3) + 
                                 (W_payload * arm_pay_from_j3);
        
        // Inertia of Link 2 + Payload about J3
        const I_link2_j3 = (1.0 / 3.0) * m_link2 * Math.pow(L2 / 1000.0, 2);
        const I_pay_j3 = (m_j4_node + m_payload) * Math.pow(L2 / 1000.0, 2);
        const I_total_j3 = I_link2_j3 + I_pay_j3;
        const tau_j3_inertial_Nm = I_total_j3 * angularAccelRadS2;

        const tau_j3_dyn_Nm = (Fdyn_link2 * arm_link2_from_j3) + 
                              (Fdyn_j4_node * arm_j4_from_j3) + 
                              (Fdyn_payload * arm_pay_from_j3) + 
                              tau_j3_inertial_Nm;

        // Convert N·m to kg·cm: 1 N·m = 10.197162 kg·cm
        const NM_TO_KGCM = 10.197162;
        const tau_j3_static_kgcm = tau_j3_static_Nm * NM_TO_KGCM;
        const tau_j3_dyn_kgcm = tau_j3_dyn_Nm * NM_TO_KGCM;

        // Moment arms from Joint 2 (Shoulder) in horizontal projection (meters)
        const cos_phi1 = Math.cos(fk.phi1);
        const arm_link1_from_j2 = (L1 / 2000.0) * Math.abs(cos_phi1);
        const arm_j3_from_j2 = (L1 / 1000.0) * Math.abs(cos_phi1);
        const arm_link2_from_j2 = arm_j3_from_j2 + (L2 / 2000.0) * Math.abs(cos_phi2);
        const arm_j4_from_j2 = arm_j3_from_j2 + (L2 / 1000.0) * Math.abs(cos_phi2);
        const arm_pay_from_j2 = arm_j3_from_j2 + (L2 / 1000.0) * Math.abs(cos_phi2) + (L3 / 1000.0) * Math.abs(cos_phi3);

        // Joint 2 (Shoulder) Torque Calculation
        const tau_j2_static_Nm = (W_link1 * arm_link1_from_j2) + 
                                 (W_j3_node * arm_j3_from_j2) + 
                                 (W_link2 * arm_link2_from_j2) + 
                                 (W_j4_node * arm_j4_from_j2) + 
                                 (W_payload * arm_pay_from_j2);

        // Rotational inertia about J2 shoulder
        const I_link1_j2 = (1.0 / 3.0) * m_link1 * Math.pow(L1 / 1000.0, 2);
        const I_j3_node_j2 = m_j3_node * Math.pow(L1 / 1000.0, 2);
        // Parallel axis for link 2 and payload
        const r_link2_j2 = Math.sqrt(Math.pow(L1, 2) + Math.pow(L2/2, 2) + 2*L1*(L2/2)*Math.cos((theta3*Math.PI)/180.0)) / 1000.0;
        const r_tip_j2 = fk.radialReach / 1000.0;
        const I_link2_j2 = (1.0 / 12.0) * m_link2 * Math.pow(L2 / 1000.0, 2) + m_link2 * Math.pow(r_link2_j2, 2);
        const I_tip_j2 = (m_j4_node + m_payload) * Math.pow(r_tip_j2, 2);
        const I_total_j2 = I_link1_j2 + I_j3_node_j2 + I_link2_j2 + I_tip_j2;
        const tau_j2_inertial_Nm = I_total_j2 * angularAccelRadS2;

        const tau_j2_dyn_Nm = (Fdyn_link1 * arm_link1_from_j2) + 
                              (Fdyn_j3_node * arm_j3_from_j2) + 
                              (Fdyn_link2 * arm_link2_from_j2) + 
                              (Fdyn_j4_node * arm_j4_from_j2) + 
                              (Fdyn_payload * arm_pay_from_j2) + 
                              tau_j2_inertial_Nm;

        const tau_j2_static_kgcm = tau_j2_static_Nm * NM_TO_KGCM;
        const tau_j2_dyn_kgcm = tau_j2_dyn_Nm * NM_TO_KGCM;

        // Joint 1 (Base Azimuth) Slew Torque: Accelerating all rotating mass in horizontal plane
        const I_azimuth = I_total_j2; // Approximate horizontal plane moment of inertia
        const tau_j1_dyn_Nm = I_azimuth * (angularAccelRadS2 * 1.2); // include slewing bearing friction
        const tau_j1_dyn_kgcm = tau_j1_dyn_Nm * NM_TO_KGCM;

        // Joint 4 (Wrist) Torque
        const tau_j4_static_Nm = W_payload * ((L3 / 1000.0) * Math.abs(cos_phi3));
        const tau_j4_dyn_Nm = Fdyn_payload * ((L3 / 1000.0) * Math.abs(cos_phi3)) + (m_payload * Math.pow(L3/1000.0, 2) * angularAccelRadS2);
        const tau_j4_dyn_kgcm = tau_j4_dyn_Nm * NM_TO_KGCM;

        // Safety Factors (Rated Servo Torque / Dynamic Required Torque)
        const sf_j1 = servo1.torque / Math.max(0.1, tau_j1_dyn_kgcm);
        const sf_j2 = servo2.torque / Math.max(0.1, tau_j2_dyn_kgcm);
        const sf_j3 = servo3.torque / Math.max(0.1, tau_j3_dyn_kgcm);
        const sf_j4 = servo4.torque / Math.max(0.1, tau_j4_dyn_kgcm);

        // PLA Structural Bending Stress Evaluation
        // Link 1 Maximum Bending Moment at Shoulder Root (M_max = tau_j2_dyn_Nm in N·mm = Nm * 1000)
        const M_link1_root_Nmm = tau_j2_dyn_Nm * 1000.0;
        const sigma_bending_link1_MPa = M_link1_root_Nmm / link1Props.sectionModulusMm3;
        
        // Link 2 Maximum Bending Moment at Elbow Root
        const M_link2_root_Nmm = tau_j3_dyn_Nm * 1000.0;
        const sigma_bending_link2_MPa = M_link2_root_Nmm / link2Props.sectionModulusMm3;

        // Deflection estimation (Cantilever approximation delta = F * L^3 / (3 * E * I))
        const E_pla_MPa = 3500; // 3.5 GPa
        const delta_link1_mm = (Fdyn_j3_node + Fdyn_link2 + Fdyn_j4_node + Fdyn_payload) * Math.pow(L1, 3) / (3 * E_pla_MPa * link1Props.I_xx);
        const delta_link2_mm = (Fdyn_j4_node + Fdyn_payload) * Math.pow(L2, 3) / (3 * E_pla_MPa * link2Props.I_xx);
        const total_deflection_mm = delta_link1_mm + delta_link2_mm;

        return {
            fk,
            weights: {
                link1_N: W_link1,
                j3_node_N: W_j3_node,
                link2_N: W_link2,
                j4_node_N: W_j4_node,
                payload_N: W_payload,
                totalMovingMassG: (m_link1 + m_j3_node + m_link2 + m_j4_node + m_payload) * 1000.0
            },
            dynamicForces: {
                link1_N: Fdyn_link1,
                j3_node_N: Fdyn_j3_node,
                link2_N: Fdyn_link2,
                j4_node_N: Fdyn_j4_node,
                payload_N: Fdyn_payload
            },
            torques: {
                j1: { dynamic_kgcm: tau_j1_dyn_kgcm, rated_kgcm: servo1.torque, sf: sf_j1 },
                j2: { static_kgcm: tau_j2_static_kgcm, dynamic_kgcm: tau_j2_dyn_kgcm, rated_kgcm: servo2.torque, sf: sf_j2 },
                j3: { static_kgcm: tau_j3_static_kgcm, dynamic_kgcm: tau_j3_dyn_kgcm, rated_kgcm: servo3.torque, sf: sf_j3 },
                j4: { static_kgcm: (tau_j4_static_Nm * NM_TO_KGCM), dynamic_kgcm: tau_j4_dyn_kgcm, rated_kgcm: servo4.torque, sf: sf_j4 }
            },
            structuralStress: {
                link1_sigma_MPa: sigma_bending_link1_MPa,
                link2_sigma_MPa: sigma_bending_link2_MPa,
                link1_deflection_mm: delta_link1_mm,
                link2_deflection_mm: delta_link2_mm,
                total_deflection_mm
            }
        };
    }

    /**
     * Generate 3D Reachable Workspace Point Cloud
     */
    generateWorkspaceCloud(L_base, L1, L2, L3, sampleStepDeg = 15) {
        const points = [];
        // Sweep theta1, theta2, theta3
        for (let q1 = -135; q1 <= 135; q1 += 30) {
            for (let q2 = -10; q2 <= 110; q2 += sampleStepDeg) {
                for (let q3 = -140; q3 <= 10; q3 += sampleStepDeg) {
                    const fk = this.forwardKinematics(q1, q2, q3, 0, L_base, L1, L2, L3);
                    if (fk.p4.z >= -10) { // above table datum
                        points.push({ x: fk.p4.x, y: fk.p4.y, z: fk.p4.z, reach: fk.radialReach });
                    }
                }
            }
        }
        return points;
    }
}

window.ManipulatorPhysics = ManipulatorPhysics;
