/**
 * Main Application Orchestrator for Robotic Arm Simulation & Sizing Suite
 * Handles Parametric Link Extensions, Smart Highlighting, Centered 3D View, Synchronized 2D/3D Motion, and Dynamic Forces
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Instantiate Physics & Visualizers
    const physics = new ManipulatorPhysics();
    let visualizer3D = null;
    let visualizer2D = null;

    // 2. State Configuration
    const state = {
        // Parametric Dimensions (mm)
        L_base: 48,
        L1: 170,
        L2: 170,
        L3: 60,
        link1Width: 26,
        link1Height: 26,
        link2Width: 22,
        link2Height: 22,

        // Material & Infill
        materialKey: 'pla',
        infillPct: 35,
        wallThicknessMm: 2.4,

        // Selected Motors & Gripper
        servo1: MOTOR_DATABASE.joint1_base[0],
        servo2: MOTOR_DATABASE.joint2_shoulder[0],
        servo3: MOTOR_DATABASE.joint3_elbow[0],
        servo4: MOTOR_DATABASE.joint4_wrist_gripper[0],
        gripper: GRIPPER_TYPES[0],

        // Active Highlight Target ('joint1', 'joint2', 'joint3', 'joint4', 'link1', 'link2', 'payload', or null)
        activeHighlight: null,

        // Joint Angles (deg)
        theta1: 0,
        theta2: 24,
        theta3: -54,
        theta4: 30,

        // Dynamic Loading & Payload
        payloadG: 200,
        isPayloadHeld: false,
        accelerationMs2: 2.5,
        angularAccelRadS2: 4.0,

        // UI & Drawer States
        leftDrawerOpen: false,
        rightDrawerOpen: false,
        activeTab: '3d',
        showWorkspace: true,
        showVectors: true,

        // Dynamic Trajectory Simulation State
        isPlaying: false,
        simSpeed: 1.0,
        simLoop: true,
        simWpIndex: 0,
        simProgressT: 0,
        lastTimestamp: null
    };

    // 3. UI DOM Elements Cache
    const el = {
        // Drawers
        leftDrawer: document.getElementById('left-drawer'),
        rightDrawer: document.getElementById('right-drawer'),
        btnToggleLeft: document.getElementById('btn-toggle-left-drawer'),
        btnCloseLeft: document.getElementById('btn-close-left-drawer'),
        btnToggleRight: document.getElementById('btn-toggle-right-drawer'),
        btnCloseRight: document.getElementById('btn-close-right-drawer'),

        // Simulation Controls
        btnSimRun: document.getElementById('btn-sim-run'),
        btnSimReset: document.getElementById('btn-sim-reset'),
        simStatusDot: document.getElementById('sim-status-dot'),
        simStatusLabel: document.getElementById('sim-status-label'),
        simStatusSub: document.getElementById('sim-status-sub'),
        simSpeedSelect: document.getElementById('sim-speed-select'),
        simLoopToggle: document.getElementById('sim-loop-toggle'),

        // Selectors
        matSelect: document.getElementById('mat-select'),
        infillSlider: document.getElementById('infill-slider'),
        infillVal: document.getElementById('infill-val'),
        servo1Select: document.getElementById('servo1-select'),
        servo2Select: document.getElementById('servo2-select'),
        servo3Select: document.getElementById('servo3-select'),
        servo4Select: document.getElementById('servo4-select'),
        gripperSelect: document.getElementById('gripper-select'),

        // HUD Overlay Elements
        hudJointBadge: document.getElementById('hud-joint-badge'),
        hudJointName: document.getElementById('hud-joint-name'),
        hudJointMotor: document.getElementById('hud-joint-motor'),
        btnSelectJ1: document.getElementById('btn-select-j1'),
        btnSelectJ2: document.getElementById('btn-select-j2'),
        btnSelectJ3: document.getElementById('btn-select-j3'),
        btnSelectJ4: document.getElementById('btn-select-j4'),

        // Dimensions
        l1Input: document.getElementById('l1-input'),
        l2Input: document.getElementById('l2-input'),
        l3Input: document.getElementById('l3-input'),
        lBaseInput: document.getElementById('lbase-input'),

        // Joint Angle Sliders
        th1Slider: document.getElementById('th1-slider'),
        th2Slider: document.getElementById('th2-slider'),
        th3Slider: document.getElementById('th3-slider'),
        th4Slider: document.getElementById('th4-slider'),
        th1Val: document.getElementById('th1-val'),
        th2Val: document.getElementById('th2-val'),
        th3Val: document.getElementById('th3-val'),
        th4Val: document.getElementById('th4-val'),

        // Payload & Dynamics
        payloadSlider: document.getElementById('payload-slider'),
        payloadVal: document.getElementById('payload-val'),
        accelSlider: document.getElementById('accel-slider'),
        accelVal: document.getElementById('accel-val'),

        // Telemetry Displays
        telemetryReach: document.getElementById('tel-reach'),
        telemetryZ: document.getElementById('tel-z'),
        telemetryMovingMass: document.getElementById('tel-moving-mass'),
        telemetryL1Mass: document.getElementById('tel-l1-mass'),
        telemetryL2Mass: document.getElementById('tel-l2-mass'),
        telemetryStressL1: document.getElementById('tel-stress-l1'),
        telemetryStressL2: document.getElementById('tel-stress-l2'),
        telemetryDeflection: document.getElementById('tel-deflection'),

        // Joint Gauges & Safety Factors
        gaugeJ1Fill: document.getElementById('gauge-j1-fill'),
        gaugeJ2Fill: document.getElementById('gauge-j2-fill'),
        gaugeJ3Fill: document.getElementById('gauge-j3-fill'),
        gaugeJ4Fill: document.getElementById('gauge-j4-fill'),
        torqueJ1Text: document.getElementById('torque-j1-text'),
        torqueJ2Text: document.getElementById('torque-j2-text'),
        torqueJ3Text: document.getElementById('torque-j3-text'),
        torqueJ4Text: document.getElementById('torque-j4-text'),
        sfJ1Badge: document.getElementById('sf-j1-badge'),
        sfJ2Badge: document.getElementById('sf-j2-badge'),
        sfJ3Badge: document.getElementById('sf-j3-badge'),
        sfJ4Badge: document.getElementById('sf-j4-badge'),

        // Toggles & Presets
        toggleWorkspace: document.getElementById('toggle-workspace'),
        toggleVectors: document.getElementById('toggle-vectors'),
        tab3d: document.getElementById('tab-3d-btn'),
        tab2d: document.getElementById('tab-2d-btn'),
        view3dContainer: document.getElementById('viewport-3d-container'),
        view2dContainer: document.getElementById('viewport-2d-container'),
        btnPresetHome: document.getElementById('btn-preset-home'),
        btnPresetPick: document.getElementById('btn-preset-pick'),
        btnPresetMaxReach: document.getElementById('btn-preset-maxreach'),
        btnExportReport: document.getElementById('btn-export-report')
    };

    // 4. Initialize Visualizers
    visualizer2D = new FbdVisualizer2D('fbd-canvas');
    visualizer3D = new ArmVisualizer3D('viewport-3d-container', (targetType) => {
        applySmartHighlight(targetType);
    });

    // 5. Smart Component Highlight Handler
    function applySmartHighlight(targetType) {
        state.activeHighlight = targetType;
        if (visualizer3D) {
            visualizer3D.setSmartHighlight(targetType, state.isPlaying);
        }

        // Update Quick Select Buttons
        const buttons = [
            { btn: el.btnSelectJ1, target: 'joint1' },
            { btn: el.btnSelectJ2, target: 'joint2' },
            { btn: el.btnSelectJ3, target: 'joint3' },
            { btn: el.btnSelectJ4, target: 'joint4' }
        ];

        buttons.forEach(b => {
            if (b.target === targetType) {
                b.btn.className = "flex-1 py-1 text-[9px] font-mono font-bold rounded bg-[#002bbb] text-white transition-all shadow-xs";
            } else {
                b.btn.className = "flex-1 py-1 text-[9px] font-mono font-bold rounded bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all";
            }
        });

        // Update HUD Banner Text with Tooltips
        if (targetType === 'joint1') {
            el.hudJointBadge.textContent = "JOINT 1";
            el.hudJointName.textContent = "Joint 1: Base Azimuth Slew Hub";
            el.hudJointName.title = "Joint 1: Base Azimuth Slew Hub";
            const motorStr = `${state.servo1.name} (${state.servo1.torque} kg·cm)`;
            el.hudJointMotor.textContent = motorStr;
            el.hudJointMotor.title = motorStr;
        } else if (targetType === 'joint2') {
            el.hudJointBadge.textContent = "JOINT 2";
            el.hudJointName.textContent = "Joint 2: Shoulder Pitch Servo";
            el.hudJointName.title = "Joint 2: Shoulder Pitch Servo";
            const motorStr = `${state.servo2.name} (${state.servo2.torque} kg·cm)`;
            el.hudJointMotor.textContent = motorStr;
            el.hudJointMotor.title = motorStr;
        } else if (targetType === 'joint3') {
            el.hudJointBadge.textContent = "JOINT 3";
            el.hudJointName.textContent = "Joint 3: Elbow Pitch Servo";
            el.hudJointName.title = "Joint 3: Elbow Pitch Servo";
            const motorStr = `${state.servo3.name} (${state.servo3.torque} kg·cm)`;
            el.hudJointMotor.textContent = motorStr;
            el.hudJointMotor.title = motorStr;
        } else if (targetType === 'joint4') {
            el.hudJointBadge.textContent = "JOINT 4";
            el.hudJointName.textContent = "Joint 4: Wrist Pitch & Gripper";
            el.hudJointName.title = "Joint 4: Wrist Pitch & Gripper";
            const motorStr = `${state.servo4.name} | ${state.gripper.name}`;
            el.hudJointMotor.textContent = motorStr;
            el.hudJointMotor.title = motorStr;
        } else if (targetType === 'link1') {
            el.hudJointBadge.textContent = "LINK 1";
            const nameStr = `Link 1 Structure (${state.L1}mm)`;
            el.hudJointName.textContent = nameStr;
            el.hudJointName.title = nameStr;
            const motorStr = `3D Printed PLA Truss (Infill: ${state.infillPct}%)`;
            el.hudJointMotor.textContent = motorStr;
            el.hudJointMotor.title = motorStr;
        } else if (targetType === 'link2') {
            el.hudJointBadge.textContent = "LINK 2";
            const nameStr = `Link 2 Forearm (${state.L2}mm)`;
            el.hudJointName.textContent = nameStr;
            el.hudJointName.title = nameStr;
            const motorStr = `3D Printed PLA Truss (Infill: ${state.infillPct}%)`;
            el.hudJointMotor.textContent = motorStr;
            el.hudJointMotor.title = motorStr;
        } else if (targetType === 'payload') {
            el.hudJointBadge.textContent = "PAYLOAD";
            const nameStr = `Workpiece Target (${state.payloadG}g)`;
            el.hudJointName.textContent = nameStr;
            el.hudJointName.title = nameStr;
            const motorStr = `Dynamic Lift Load: ${((state.payloadG/1000) * (9.81 + state.accelerationMs2)).toFixed(2)} N`;
            el.hudJointMotor.textContent = motorStr;
            el.hudJointMotor.title = motorStr;
        }
    }

    // 6. Populate Dropdowns
    function populateDropdowns() {
        el.matSelect.innerHTML = '';
        for (const [key, mat] of Object.entries(MATERIAL_DATABASE)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${mat.name} (${mat.yieldStrengthMPa} MPa)`;
            el.matSelect.appendChild(opt);
        }
        el.matSelect.value = state.materialKey;

        const populateServoList = (selectEl, list) => {
            selectEl.innerHTML = '';
            list.forEach((item, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = `${item.name} (${item.torque} kg·cm)`;
                selectEl.appendChild(opt);
            });
        };

        populateServoList(el.servo1Select, MOTOR_DATABASE.joint1_base);
        populateServoList(el.servo2Select, MOTOR_DATABASE.joint2_shoulder);
        populateServoList(el.servo3Select, MOTOR_DATABASE.joint3_elbow);
        populateServoList(el.servo4Select, MOTOR_DATABASE.joint4_wrist_gripper);

        el.gripperSelect.innerHTML = '';
        GRIPPER_TYPES.forEach((grip, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `${grip.name} (${grip.deadweightG}g)`;
            el.gripperSelect.appendChild(opt);
        });
    }

    // 7. Synchronized Physics & Viewport Update (3D & 2D)
    function updateSimulation() {
        const mat = MATERIAL_DATABASE[state.materialKey] || MATERIAL_DATABASE.pla;

        const link1Props = physics.calculateLinkMassProperties(
            state.L1, state.link1Width, state.link1Height,
            state.wallThicknessMm, state.infillPct, mat.density, 20
        );

        const link2Props = physics.calculateLinkMassProperties(
            state.L2, state.link2Width, state.link2Height,
            state.wallThicknessMm, state.infillPct, mat.density, 15
        );

        // Effective payload mass active on arm
        const activePayloadG = state.isPayloadHeld ? state.payloadG : 0;

        const dynamics = physics.evaluateArmDynamics({
            theta1: state.theta1,
            theta2: state.theta2,
            theta3: state.theta3,
            theta4: state.theta4,
            L_base: state.L_base,
            L1: state.L1,
            L2: state.L2,
            L3: state.L3,
            link1Props,
            link2Props,
            servo1: state.servo1,
            servo2: state.servo2,
            servo3: state.servo3,
            servo4: state.servo4,
            gripper: state.gripper,
            payloadG: activePayloadG,
            accelerationMs2: state.accelerationMs2,
            angularAccelRadS2: state.angularAccelRadS2
        });

        // Update 3D Model & Vectors
        if (visualizer3D) {
            visualizer3D.setJointAngles(state.theta1, state.theta2, state.theta3, state.theta4);
            visualizer3D.updateForceVectors(dynamics, state.showVectors);
        }

        // Update 2D FBD Canvas in Real Time
        if (visualizer2D) {
            visualizer2D.render(dynamics, {
                L_base: state.L_base,
                L1: state.L1,
                L2: state.L2,
                L3: state.L3,
                payloadG: activePayloadG
            }, state.isPayloadHeld);
        }

        // Update Telemetry Displays
        const fk = dynamics.fk;
        el.telemetryReach.textContent = `${fk.radialReach.toFixed(0)} mm`;
        el.telemetryZ.textContent = `${fk.p4.z.toFixed(0)} mm`;
        el.telemetryMovingMass.textContent = `${dynamics.weights.totalMovingMassG.toFixed(0)} g`;
        el.telemetryL1Mass.textContent = `${link1Props.totalMassG.toFixed(0)} g`;
        el.telemetryL2Mass.textContent = `${link2Props.totalMassG.toFixed(0)} g`;
        
        const l1Stress = dynamics.structuralStress.link1_sigma_MPa;
        const l2Stress = dynamics.structuralStress.link2_sigma_MPa;
        el.telemetryStressL1.textContent = `${l1Stress.toFixed(1)} MPa`;
        el.telemetryStressL2.textContent = `${l2Stress.toFixed(1)} MPa`;
        el.telemetryDeflection.textContent = `${dynamics.structuralStress.total_deflection_mm.toFixed(2)} mm`;

        // Gauges
        const updateGauge = (fillEl, textEl, badgeEl, reqTorque, ratedTorque, sf) => {
            const pct = Math.min(100, Math.max(0, (reqTorque / ratedTorque) * 100));
            fillEl.style.width = `${pct}%`;
            textEl.textContent = `${reqTorque.toFixed(1)} / ${ratedTorque.toFixed(0)} kg·cm`;

            if (sf >= 2.0) {
                fillEl.className = "h-full bg-emerald-500 transition-all";
                badgeEl.className = "px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 font-mono";
                badgeEl.textContent = `SF: ${sf.toFixed(1)}x (Safe)`;
            } else if (sf >= 1.25) {
                fillEl.className = "h-full bg-amber-500 transition-all";
                badgeEl.className = "px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-300 font-mono";
                badgeEl.textContent = `SF: ${sf.toFixed(1)}x (Marginal)`;
            } else {
                fillEl.className = "h-full bg-rose-600 transition-all";
                badgeEl.className = "px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-300 font-mono";
                badgeEl.textContent = `SF: ${sf.toFixed(1)}x (OVERLOAD)`;
            }
        };

        const t = dynamics.torques;
        updateGauge(el.gaugeJ1Fill, el.torqueJ1Text, el.sfJ1Badge, t.j1.dynamic_kgcm, t.j1.rated_kgcm, t.j1.sf);
        updateGauge(el.gaugeJ2Fill, el.torqueJ2Text, el.sfJ2Badge, t.j2.dynamic_kgcm, t.j2.rated_kgcm, t.j2.sf);
        updateGauge(el.gaugeJ3Fill, el.torqueJ3Text, el.sfJ3Badge, t.j3.dynamic_kgcm, t.j3.rated_kgcm, t.j3.sf);
        updateGauge(el.gaugeJ4Fill, el.torqueJ4Text, el.sfJ4Badge, t.j4.dynamic_kgcm, t.j4.rated_kgcm, t.j4.sf);
    }

    function refreshWorkspaceCloud() {
        if (!state.showWorkspace) {
            if (visualizer3D) visualizer3D.setWorkspaceVisible(false);
            return;
        }
        const points = physics.generateWorkspaceCloud(state.L_base, state.L1, state.L2, state.L3, 20);
        if (visualizer3D) {
            visualizer3D.renderWorkspacePointCloud(points);
            visualizer3D.setWorkspaceVisible(true);
        }
    }

    // 8. Dynamic Physical Trajectory Waypoints (Collision-Free Pick & Place Sequence)
    const trajectoryWaypoints = [
        // 1. Standby Home: Safe elevated home pose, gripper wide open
        { name: "Standby Home", q1: 0, q2: 68, q3: -42, q4: -26, gripOpen: 1.0, holdPay: false, atDrop: false, durationMs: 1200 },
        
        // 2. Approach Pick High: Elevate over pick station (Z ≈ 80mm), wide open gripper
        { name: "Approach Pick Station", q1: 33.7, q2: 51.0, q3: -84.3, q4: 23.3, gripOpen: 1.0, holdPay: false, atDrop: false, durationMs: 1300 },
        
        // 3. Vertical Descend: Lower fingers vertically down around workpiece (Z ≈ 22mm) with fingers open
        { name: "Descend Over Workpiece", q1: 33.7, q2: 37.6, q3: -85.5, q4: 42.9, gripOpen: 1.0, holdPay: false, atDrop: false, durationMs: 1000 },
        
        // 4. Smooth Clamp: Fingers close snugly from 1.0 -> 0.0 to grasp workpiece firmly
        { name: "Clamp Gripper & Lock", q1: 33.7, q2: 37.6, q3: -85.5, q4: 42.9, gripOpen: 0.0, holdPay: true, atDrop: false, durationMs: 800 },
        
        // 5. Dynamic Vertical Lift: Lift workpiece cleanly straight up with dynamic acceleration
        { name: "Dynamic Lift (a = 2.5 m/s²)", q1: 33.7, q2: 59.1, q3: -77.6, q4: 18.5, gripOpen: 0.0, holdPay: true, atDrop: false, durationMs: 1200 },
        
        // 6. Horizontal Slew: Transport held workpiece across to drop station at elevated safe height
        { name: "Slew to Drop Destination", q1: -33.7, q2: 59.1, q3: -77.6, q4: 18.5, gripOpen: 0.0, holdPay: true, atDrop: false, durationMs: 1500 },
        
        // 7. Lower to Drop Station: Place workpiece gently onto drop pad
        { name: "Lower to Drop Station", q1: -33.7, q2: 37.6, q3: -85.5, q4: 42.9, gripOpen: 0.0, holdPay: true, atDrop: true, durationMs: 1200 },
        
        // 8. Smooth Release: Fingers slide wide open from 0.0 -> 1.0 to release workpiece
        { name: "Release Workpiece", q1: -33.7, q2: 37.6, q3: -85.5, q4: 42.9, gripOpen: 1.0, holdPay: false, atDrop: true, durationMs: 800 },
        
        // 9. Vertical Retract: Ascend straight up away from released workpiece
        { name: "Vertical Retract", q1: -33.7, q2: 59.1, q3: -77.6, q4: 18.5, gripOpen: 1.0, holdPay: false, atDrop: true, durationMs: 1000 },
        
        // 10. Return to Home: Return arm to Standby pose for continuous loop
        { name: "Return to Home", q1: 0, q2: 68, q3: -42, q4: -26, gripOpen: 1.0, holdPay: false, atDrop: true, durationMs: 1300 }
    ];

    // 9. Continuous Dynamic Simulation Playback Engine
    function startSimulation() {
        state.isPlaying = true;
        state.lastTimestamp = null;
        if (visualizer3D) visualizer3D.setSmartHighlight(null, true);

        el.btnSimRun.innerHTML = "⏸";
        el.btnSimRun.className = "w-8 h-8 rounded-md bg-[#6c82a3] hover:bg-[#506686] text-white font-black text-xs flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer";
        el.simStatusDot.className = "w-2 h-2 rounded-full bg-[#ccff00] border border-[#002bbb] animate-pulse";
        requestAnimationFrame(simulationLoop);
    }

    function pauseSimulation() {
        state.isPlaying = false;
        el.btnSimRun.innerHTML = "▶";
        el.btnSimRun.className = "w-8 h-8 rounded-md bg-[#002bbb] hover:bg-[#002294] text-white font-black text-xs flex items-center justify-center shadow-md shadow-[#002bbb]/25 transition-transform active:scale-95 cursor-pointer";
        el.simStatusDot.className = "w-2 h-2 rounded-full bg-amber-500";
        el.simStatusLabel.textContent = "PAUSED";
    }

    function resetSimulation() {
        pauseSimulation();
        state.simWpIndex = 0;
        state.simProgressT = 0;
        state.isPayloadHeld = false;
        if (visualizer3D) {
            visualizer3D.clearTrajectory();
            visualizer3D.setPayloadHeld(false, state.payloadG, false);
            visualizer3D.setGripperAperture(1.0);
        }
        
        // Return to default pose
        state.theta1 = 0; state.theta2 = 24; state.theta3 = -54; state.theta4 = 30;
        el.th1Slider.value = 0; el.th1Val.textContent = "0°";
        el.th2Slider.value = 24; el.th2Val.textContent = "24°";
        el.th3Slider.value = -54; el.th3Val.textContent = "-54°";
        el.th4Slider.value = 30; el.th4Val.textContent = "30°";

        el.simStatusDot.className = "w-2 h-2 rounded-full bg-slate-400";
        el.simStatusLabel.textContent = "STANDBY";
        el.simStatusSub.textContent = "Kinematics & Dynamics";
        applySmartHighlight(null);
        updateSimulation();
    }

    function simulationLoop(timestamp) {
        if (!state.isPlaying) return;

        if (!state.lastTimestamp) state.lastTimestamp = timestamp;
        const delta = timestamp - state.lastTimestamp;
        state.lastTimestamp = timestamp;

        const currentWp = trajectoryWaypoints[state.simWpIndex];
        const nextWp = trajectoryWaypoints[(state.simWpIndex + 1) % trajectoryWaypoints.length];
        const duration = (currentWp.durationMs / state.simSpeed);

        state.simProgressT += delta / duration;

        if (state.simProgressT >= 1.0) {
            state.simProgressT = 0;
            state.simWpIndex++;

            if (state.simWpIndex >= trajectoryWaypoints.length) {
                if (state.simLoop) {
                    state.simWpIndex = 0;
                    if (visualizer3D) {
                        visualizer3D.clearTrajectory();
                        visualizer3D.setPayloadHeld(false, state.payloadG, false);
                    }
                } else {
                    resetSimulation();
                    return;
                }
            }
        }

        // Smooth Quintic Step Interpolation
        const t = Math.min(1.0, state.simProgressT);
        const ease = t * t * t * (t * (t * 6 - 15) + 10);

        const wpA = trajectoryWaypoints[state.simWpIndex];
        const wpB = trajectoryWaypoints[(state.simWpIndex + 1) % trajectoryWaypoints.length];

        state.theta1 = wpA.q1 + (wpB.q1 - wpA.q1) * ease;
        state.theta2 = wpA.q2 + (wpB.q2 - wpA.q2) * ease;
        state.theta3 = wpA.q3 + (wpB.q3 - wpA.q3) * ease;
        state.theta4 = wpA.q4 + (wpB.q4 - wpA.q4) * ease;
        
        // Continuous Smooth Gripper Aperture Motion (Opening / Closing Fingers)
        const gripA = typeof wpA.gripOpen === 'number' ? wpA.gripOpen : (wpA.gripOpen ? 1.0 : 0.0);
        const gripB = typeof wpB.gripOpen === 'number' ? wpB.gripOpen : (wpB.gripOpen ? 1.0 : 0.0);
        const currentAperture = gripA + (gripB - gripA) * ease;

        state.isPayloadHeld = wpA.holdPay;

        // Synchronize 3D Gripper Fingers and Workpiece Status
        if (visualizer3D) {
            visualizer3D.setGripperAperture(currentAperture);
            visualizer3D.setPayloadHeld(wpA.holdPay, state.payloadG, wpA.atDrop || false);
        }

        // Update Sliders in drawer
        el.th1Slider.value = Math.round(state.theta1); el.th1Val.textContent = `${Math.round(state.theta1)}°`;
        el.th2Slider.value = Math.round(state.theta2); el.th2Val.textContent = `${Math.round(state.theta2)}°`;
        el.th3Slider.value = Math.round(state.theta3); el.th3Val.textContent = `${Math.round(state.theta3)}°`;
        el.th4Slider.value = Math.round(state.theta4); el.th4Val.textContent = `${Math.round(state.theta4)}°`;

        // Update status label
        el.simStatusLabel.textContent = `${wpA.name.toUpperCase()}`;
        el.simStatusSub.textContent = `STEP ${state.simWpIndex + 1}/${trajectoryWaypoints.length} (${Math.round(t * 100)}%)`;

        // Synchronized Frame Update for 3D & 2D
        updateSimulation();

        // Add 3D trajectory point
        if (visualizer3D) {
            const fk = physics.forwardKinematics(state.theta1, state.theta2, state.theta3, state.theta4, state.L_base, state.L1, state.L2, state.L3);
            visualizer3D.addTrajectoryPoint(fk.p4.x, fk.p4.y, fk.p4.z);
        }

        requestAnimationFrame(simulationLoop);
    }

    // 10. Drawer Toggle Functions
    function toggleLeftDrawer(open) {
        state.leftDrawerOpen = (open !== undefined) ? open : !state.leftDrawerOpen;
        if (state.leftDrawerOpen) {
            el.leftDrawer.classList.add('open');
            el.btnToggleLeft.classList.add('active');
            el.btnToggleLeft.className = "px-3.5 py-1.5 rounded-lg bg-[#002bbb] text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md active cursor-pointer";
        } else {
            el.leftDrawer.classList.remove('open');
            el.btnToggleLeft.classList.remove('active');
            el.btnToggleLeft.className = "px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-300/80 text-slate-800 font-semibold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer";
        }
    }

    function toggleRightDrawer(open) {
        state.rightDrawerOpen = (open !== undefined) ? open : !state.rightDrawerOpen;
        if (state.rightDrawerOpen) {
            el.rightDrawer.classList.add('open');
            el.btnToggleRight.classList.add('active');
            el.btnToggleRight.className = "px-3.5 py-1.5 rounded-lg bg-[#002bbb] text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md active cursor-pointer";
        } else {
            el.rightDrawer.classList.remove('open');
            el.btnToggleRight.classList.remove('active');
            el.btnToggleRight.className = "px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-300/80 text-slate-800 font-semibold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer";
        }
    }

    // 11. Event Listeners Setup
    function setupEventListeners() {
        // Drawer buttons
        el.btnToggleLeft.addEventListener('click', () => toggleLeftDrawer());
        el.btnCloseLeft.addEventListener('click', () => toggleLeftDrawer(false));
        el.btnToggleRight.addEventListener('click', () => toggleRightDrawer());
        el.btnCloseRight.addEventListener('click', () => toggleRightDrawer(false));

        // Simulation Run/Pause
        el.btnSimRun.addEventListener('click', () => {
            if (state.isPlaying) {
                pauseSimulation();
            } else {
                startSimulation();
            }
        });

        el.btnSimReset.addEventListener('click', () => resetSimulation());

        el.simSpeedSelect.addEventListener('change', (e) => {
            state.simSpeed = parseFloat(e.target.value);
        });

        el.simLoopToggle.addEventListener('change', (e) => {
            state.simLoop = e.target.checked;
        });

        // Quick Joint Select Buttons
        el.btnSelectJ1.addEventListener('click', () => applySmartHighlight('joint1'));
        el.btnSelectJ2.addEventListener('click', () => applySmartHighlight('joint2'));
        el.btnSelectJ3.addEventListener('click', () => applySmartHighlight('joint3'));
        el.btnSelectJ4.addEventListener('click', () => applySmartHighlight('joint4'));

        // Material Change
        el.matSelect.addEventListener('change', (e) => {
            state.materialKey = e.target.value;
            if (visualizer3D) {
                visualizer3D.updateParametricStructure(state.L_base, state.L1, state.L2, state.L3, state.materialKey);
            }
            updateSimulation();
        });

        // Infill Slider
        el.infillSlider.addEventListener('input', (e) => {
            state.infillPct = parseInt(e.target.value);
            el.infillVal.textContent = `${state.infillPct}%`;
            updateSimulation();
        });

        // Motor Selections with Dynamic Recalculations
        el.servo1Select.addEventListener('change', (e) => {
            state.servo1 = MOTOR_DATABASE.joint1_base[e.target.value];
            applySmartHighlight('joint1');
            updateSimulation();
        });
        el.servo1Select.addEventListener('focus', () => applySmartHighlight('joint1'));

        el.servo2Select.addEventListener('change', (e) => {
            state.servo2 = MOTOR_DATABASE.joint2_shoulder[e.target.value];
            applySmartHighlight('joint2');
            updateSimulation();
        });
        el.servo2Select.addEventListener('focus', () => applySmartHighlight('joint2'));

        el.servo3Select.addEventListener('change', (e) => {
            state.servo3 = MOTOR_DATABASE.joint3_elbow[e.target.value];
            applySmartHighlight('joint3');
            updateSimulation();
        });
        el.servo3Select.addEventListener('focus', () => applySmartHighlight('joint3'));

        el.servo4Select.addEventListener('change', (e) => {
            state.servo4 = MOTOR_DATABASE.joint4_wrist_gripper[e.target.value];
            applySmartHighlight('joint4');
            updateSimulation();
        });
        el.servo4Select.addEventListener('focus', () => applySmartHighlight('joint4'));

        el.gripperSelect.addEventListener('change', (e) => {
            state.gripper = GRIPPER_TYPES[e.target.value];
            applySmartHighlight('joint4');
            updateSimulation();
        });
        el.gripperSelect.addEventListener('focus', () => applySmartHighlight('joint4'));

        // Parametric Dimensions with Immediate 3D & 2D Extension
        const onDimensionChange = () => {
            state.L1 = Math.max(20, Math.min(2000, parseFloat(el.l1Input.value) || 170));
            state.L2 = Math.max(20, Math.min(2000, parseFloat(el.l2Input.value) || 170));
            state.L3 = Math.max(10, Math.min(500, parseFloat(el.l3Input.value) || 60));
            state.L_base = Math.max(20, Math.min(500, parseFloat(el.lBaseInput.value) || 48));

            if (visualizer3D) {
                visualizer3D.updateParametricStructure(state.L_base, state.L1, state.L2, state.L3, state.materialKey);
            }
            refreshWorkspaceCloud();
            updateSimulation();
        };

        el.l1Input.addEventListener('input', () => { applySmartHighlight('link1'); onDimensionChange(); });
        el.l1Input.addEventListener('focus', () => applySmartHighlight('link1'));

        el.l2Input.addEventListener('input', () => { applySmartHighlight('link2'); onDimensionChange(); });
        el.l2Input.addEventListener('focus', () => applySmartHighlight('link2'));

        el.l3Input.addEventListener('input', onDimensionChange);
        el.lBaseInput.addEventListener('input', onDimensionChange);

        // Joint Angle Sliders
        const bindAngleSlider = (slider, valEl, key, targetType) => {
            slider.addEventListener('input', (e) => {
                state[key] = parseFloat(e.target.value);
                valEl.textContent = `${state[key]}°`;
                applySmartHighlight(targetType);
                updateSimulation();
            });
            slider.addEventListener('focus', () => applySmartHighlight(targetType));
        };

        bindAngleSlider(el.th1Slider, el.th1Val, 'theta1', 'joint1');
        bindAngleSlider(el.th2Slider, el.th2Val, 'theta2', 'joint2');
        bindAngleSlider(el.th3Slider, el.th3Val, 'theta3', 'joint3');
        bindAngleSlider(el.th4Slider, el.th4Val, 'theta4', 'joint4');

        // Payload Slider with Smart Object Glow
        el.payloadSlider.addEventListener('input', (e) => {
            state.payloadG = parseInt(e.target.value);
            el.payloadVal.textContent = `${state.payloadG} g`;
            applySmartHighlight('payload');
            updateSimulation();
        });
        el.payloadSlider.addEventListener('focus', () => applySmartHighlight('payload'));

        // Dynamic Acceleration Slider
        el.accelSlider.addEventListener('input', (e) => {
            state.accelerationMs2 = parseFloat(e.target.value);
            el.accelVal.textContent = `${state.accelerationMs2.toFixed(1)} m/s²`;
            updateSimulation();
        });

        // Toggle Helpers
        el.toggleWorkspace.addEventListener('change', (e) => {
            state.showWorkspace = e.target.checked;
            refreshWorkspaceCloud();
        });

        el.toggleVectors.addEventListener('change', (e) => {
            state.showVectors = e.target.checked;
            updateSimulation();
        });

        // View Tabs (3D vs 2D FBD)
        el.tab3d.addEventListener('click', () => {
            state.activeTab = '3d';
            el.tab3d.className = "px-3 py-1 rounded font-bold text-xs bg-[#002bbb] text-white shadow-xs";
            el.tab2d.className = "px-3 py-1 rounded font-bold text-xs bg-transparent text-slate-600 hover:text-slate-900";
            el.view3dContainer.classList.remove('hidden');
            el.view2dContainer.classList.add('hidden');
            if (visualizer3D) visualizer3D.onWindowResize();
        });

        el.tab2d.addEventListener('click', () => {
            state.activeTab = '2d';
            el.tab2d.className = "px-3 py-1 rounded font-bold text-xs bg-[#002bbb] text-white shadow-xs";
            el.tab3d.className = "px-3 py-1 rounded font-bold text-xs bg-transparent text-slate-600 hover:text-slate-900";
            el.view2dContainer.classList.remove('hidden');
            el.view3dContainer.classList.add('hidden');
            if (visualizer2D) {
                visualizer2D.resize();
            }
            updateSimulation();
        });

        // 2D Pan / Zoom & Center View Controls
        const btn2dZoomIn = document.getElementById('btn-2d-zoom-in');
        const btn2dZoomOut = document.getElementById('btn-2d-zoom-out');
        const btn2dResetView = document.getElementById('btn-2d-reset-view');

        if (btn2dZoomIn) btn2dZoomIn.addEventListener('click', () => visualizer2D && visualizer2D.zoomIn());
        if (btn2dZoomOut) btn2dZoomOut.addEventListener('click', () => visualizer2D && visualizer2D.zoomOut());
        if (btn2dResetView) btn2dResetView.addEventListener('click', () => visualizer2D && visualizer2D.resetView());

        // Presets
        const applyPose = (q1, q2, q3, q4) => {
            state.theta1 = q1; state.theta2 = q2; state.theta3 = q3; state.theta4 = q4;
            el.th1Slider.value = q1; el.th1Val.textContent = `${q1}°`;
            el.th2Slider.value = q2; el.th2Val.textContent = `${q2}°`;
            el.th3Slider.value = q3; el.th3Val.textContent = `${q3}°`;
            el.th4Slider.value = q4; el.th4Val.textContent = `${q4}°`;
            applySmartHighlight(null);
            updateSimulation();
        };

        el.btnPresetHome.addEventListener('click', () => applyPose(0, 68, -42, -26));
        el.btnPresetPick.addEventListener('click', () => applyPose(34, 38, -85, 43));
        el.btnPresetMaxReach.addEventListener('click', () => applyPose(0, 0, 0, 0));

        // Export Report
        el.btnExportReport.addEventListener('click', () => {
            exportEngineeringReport();
        });
    }

    function exportEngineeringReport() {
        const mat = MATERIAL_DATABASE[state.materialKey] || MATERIAL_DATABASE.pla;
        const report = {
            project: "Robotic Manipulator Simulation & Sizing Suite",
            date: new Date().toISOString(),
            specifications: {
                link1_length_mm: state.L1,
                link2_length_mm: state.L2,
                gripper_length_mm: state.L3,
                base_height_mm: state.L_base,
                material: mat.name,
                infill_percentage: state.infillPct,
                tested_payload_g: state.payloadG,
                dynamic_acceleration_ms2: state.accelerationMs2
            },
            selectedHardware: {
                joint1_base: state.servo1,
                joint2_shoulder: state.servo2,
                joint3_elbow: state.servo3,
                joint4_gripper: state.servo4,
                gripper_assembly: state.gripper
            }
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 4));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `robotic_arm_simulation_config_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    // 12. Initial Run
    populateDropdowns();
    setupEventListeners();
    applySmartHighlight(null);
    if (visualizer3D) {
        visualizer3D.updateParametricStructure(state.L_base, state.L1, state.L2, state.L3, state.materialKey);
    }
    refreshWorkspaceCloud();
    updateSimulation();
});
