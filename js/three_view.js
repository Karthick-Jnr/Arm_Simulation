/**
 * Three.js 3D Visualizer - Precision Robotics Studio Edition
 * Features:
 * - Silver Studio Floor Environment (Matte non-glare brushed silver platform)
 * - Industrial Mechanical Robot Model in Gray & Royal Blue Combination
 * - Concentric Architectural Radial Measurement Rings (200, 300, 400, 500 mm)
 * - Dynamic Link Length Extension (L_base, L1, L2, L3)
 * - Context-Aware Smart Highlighting with Precision Beacon
 * - Synchronized 3D Workpiece Manipulation & Neon Laser Trajectory Ribbon
 */

class ArmVisualizer3D {
    constructor(containerId, onJointClickCallback = null) {
        this.container = document.getElementById(containerId);
        this.width = this.container ? this.container.clientWidth : 800;
        this.height = this.container ? this.container.clientHeight : 600;
        this.onJointClickCallback = onJointClickCallback;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Arm Kinematic Groups
        this.armRoot = null;
        this.basePedestal = null;
        this.j1Hub = null;
        this.j2Housing = null;
        this.link1Group = null;
        this.link1Body = null;
        this.link1MeshList = [];
        this.j3Hub = null;
        this.j3Housing = null;
        this.link2Group = null;
        this.link2Body = null;
        this.link2MeshList = [];
        this.j4WristGroup = null;
        this.j4Housing = null;
        this.gripperGroup = null;
        this.gripperFingers = [];
        this.payloadMesh = null;

        // Table & Stations
        this.tableWorkpiece = null;
        this.pickStationMesh = null;
        this.dropStationMesh = null;

        // Smart Highlighting Target
        this.activeHighlight = null;
        this.highlightGroup = null;
        this.beaconRing = null;
        this.beaconRing2 = null;
        this.pointerArrow = null;
        this.animTime = 0;

        // Trajectory Ribbon Trail
        this.trajectoryLine = null;
        this.trailPoints = [];
        this.maxTrailPoints = 180;

        // Visual helper groups
        this.forceVectorsGroup = null;
        this.workspaceGroup = null;

        // PBR Materials Cache
        this.materials = {};

        if (this.container) {
            this.init();
        }
    }

    init() {
        // Scene setup - Clean Neutral Studio
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf1f4f8);
        this.scene.fog = new THREE.FogExp2(0xf1f4f8, 0.00035);

        // Camera setup (Z is UP)
        this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 1, 8000);
        this.camera.position.set(580, -680, 480);
        this.camera.up.set(0, 0, 1);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.02;
        this.controls.target.set(0, 0, 95);

        // Studio Lighting
        this.setupLighting();

        // Silver Studio Ground Platform
        this.setupEnvironment();

        // Robot CAD Geometry & Materials (Gray + Blue Combination)
        this.createMaterials();
        this.createArmGeometry();

        // Selection Beacon & Trajectory Trail
        this.createSelectionBeacon();
        this.createTrajectoryLine();

        // Helper Groups
        this.forceVectorsGroup = new THREE.Group();
        this.scene.add(this.forceVectorsGroup);

        this.workspaceGroup = new THREE.Group();
        this.scene.add(this.workspaceGroup);

        // Resize & Click Handlers
        window.addEventListener('resize', () => this.onWindowResize());
        this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));

        // Start Animation Loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupLighting() {
        // Soft diffuse ambient light for clear, uniform illumination without glares
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
        this.scene.add(ambientLight);

        // Top diffuse directional light
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.75);
        keyLight.position.set(400, -350, 800);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 50;
        keyLight.shadow.camera.far = 3000;
        keyLight.shadow.camera.left = -750;
        keyLight.shadow.camera.right = 750;
        keyLight.shadow.camera.top = 750;
        keyLight.shadow.camera.bottom = -750;
        keyLight.shadow.bias = -0.0003;
        this.scene.add(keyLight);

        // Soft fill light from opposite side
        const fillLight = new THREE.DirectionalLight(0xdce3ed, 0.45);
        fillLight.position.set(-400, 400, 500);
        this.scene.add(fillLight);
    }

    setupEnvironment() {
        // Studio Floor (1600mm x 1600mm) - Silver Matte Platform
        const floorGeo = new THREE.BoxGeometry(1600, 1600, 24);
        const floorMat = new THREE.MeshLambertMaterial({
            color: 0xc8d0da // Silver color
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(0, 0, -12);
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Titanium Slate Edge Trim Accent
        const trimGeo = new THREE.BoxGeometry(1608, 1608, 2);
        const trimMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.set(0, 0, 0.5);
        this.scene.add(trim);

        // Silver Studio Grid
        const grid = new THREE.GridHelper(1500, 60, 0x002bbb, 0x8c9ba8);
        grid.rotation.x = Math.PI / 2;
        grid.position.set(0, 0, 1.0);
        this.scene.add(grid);

        // Concentric Measurement Rings (R = 200, 300, 400, 500 mm)
        const addRadiusRing = (r, colorHex, opacity = 0.4) => {
            const ringGeo = new THREE.RingGeometry(r - 1.2, r + 1.2, 96);
            const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.set(0, 0, 1.2);
            this.scene.add(ring);
        };

        addRadiusRing(200, 0x475569, 0.35);
        addRadiusRing(300, 0x002bbb, 0.65); // Active inner pick radius
        addRadiusRing(400, 0x002bbb, 0.65); // Max reach zone
        addRadiusRing(500, 0x64748b, 0.35);

        // 1. Pick Station Marker & Workpiece (at X = 240, Y = 160)
        const pickGeo = new THREE.RingGeometry(24, 32, 32);
        const pickMat = new THREE.MeshBasicMaterial({ color: 0x002bbb, side: THREE.DoubleSide });
        this.pickStationMesh = new THREE.Mesh(pickGeo, pickMat);
        this.pickStationMesh.position.set(240, 160, 1.5);
        this.scene.add(this.pickStationMesh);

        // Pick Station Workpiece Object (Height 28mm, Radius 14mm)
        const objGeo = new THREE.CylinderGeometry(14, 14, 28, 24);
        objGeo.rotateX(Math.PI / 2);
        const objMat = new THREE.MeshStandardMaterial({ color: 0x002bbb, roughness: 0.3, metalness: 0.5 });
        this.pickWorkpiece = new THREE.Mesh(objGeo, objMat);
        this.pickWorkpiece.position.set(240, 160, 14);
        this.pickWorkpiece.castShadow = true;
        this.pickWorkpiece.receiveShadow = true;
        this.pickWorkpiece.userData = { targetType: 'payload', name: 'Workpiece (Pick Station)' };
        this.scene.add(this.pickWorkpiece);
        this.tableWorkpiece = this.pickWorkpiece; // alias for highlights

        // 2. Drop Station Destination (at X = -240, Y = 160)
        const dropGeo = new THREE.RingGeometry(24, 32, 32);
        const dropMat = new THREE.MeshBasicMaterial({ color: 0x475569, side: THREE.DoubleSide });
        this.dropStationMesh = new THREE.Mesh(dropGeo, dropMat);
        this.dropStationMesh.position.set(-240, 160, 1.5);
        this.scene.add(this.dropStationMesh);

        // Drop Station Placed Workpiece
        this.dropWorkpiece = new THREE.Mesh(objGeo.clone(), objMat.clone());
        this.dropWorkpiece.position.set(-240, 160, 14);
        this.dropWorkpiece.castShadow = true;
        this.dropWorkpiece.receiveShadow = true;
        this.dropWorkpiece.visible = false;
        this.dropWorkpiece.userData = { targetType: 'payload', name: 'Workpiece (Drop Station)' };
        this.scene.add(this.dropWorkpiece);
    }

    createMaterials() {
        // Gray and Blue Color Combination Palette
        this.materials.pla = new THREE.MeshStandardMaterial({
            color: 0x505f75, // Sleek Precision Slate Gray Link Body
            roughness: 0.35,
            metalness: 0.2
        });
        this.materials.linkAccentBlue = new THREE.MeshStandardMaterial({
            color: 0x002bbb, // Royal Cobalt Accent Strips & Insets
            roughness: 0.25,
            metalness: 0.6
        });
        this.materials.plaGlow = new THREE.MeshStandardMaterial({
            color: 0x002bbb,
            emissive: 0x002bbb,
            emissiveIntensity: 0.75,
            roughness: 0.25,
            metalness: 0.5
        });
        this.materials.servoBody = new THREE.MeshStandardMaterial({
            color: 0x1e293b, // Dark Graphite Motor Chassis
            roughness: 0.4,
            metalness: 0.6
        });
        this.materials.servoGlow = new THREE.MeshStandardMaterial({
            color: 0x002bbb,
            emissive: 0x002bbb,
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.7
        });
        this.materials.cncFaceplate = new THREE.MeshStandardMaterial({
            color: 0x002bbb, // Royal Cobalt Anodized Faceplate
            roughness: 0.25,
            metalness: 0.7
        });
        this.materials.bracketGray = new THREE.MeshStandardMaterial({
            color: 0x475569, // Titanium Bracket Gray
            roughness: 0.35,
            metalness: 0.3
        });
        this.materials.hardwareSteel = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0, // Polished Stainless Steel Fasteners
            roughness: 0.15,
            metalness: 0.95
        });
        this.materials.gripperFingers = new THREE.MeshStandardMaterial({
            color: 0x334155,
            roughness: 0.4,
            metalness: 0.4
        });
        this.materials.fsrSensor = new THREE.MeshStandardMaterial({
            color: 0xccff00, // Laser Lime Sensor Pad
            emissive: 0xa3cc00,
            emissiveIntensity: 0.4,
            roughness: 0.3
        });
        this.materials.payload = new THREE.MeshStandardMaterial({
            color: 0x002bbb,
            roughness: 0.3,
            metalness: 0.5
        });
        this.materials.payloadGlow = new THREE.MeshStandardMaterial({
            color: 0xccff00,
            emissive: 0xccff00,
            emissiveIntensity: 0.75,
            roughness: 0.2
        });
    }

    createArmGeometry() {
        this.armRoot = new THREE.Group();
        this.scene.add(this.armRoot);

        // 1. Centered Base Assembly (J1 Pedestal at 0, 0, 0)
        const basePedestalGroup = new THREE.Group();
        
        const baseFlangeGeo = new THREE.CylinderGeometry(60, 72, 16, 32);
        baseFlangeGeo.rotateX(Math.PI / 2);
        const baseFlange = new THREE.Mesh(baseFlangeGeo, this.materials.cncFaceplate);
        baseFlange.position.set(0, 0, 8);
        baseFlange.castShadow = true;
        basePedestalGroup.add(baseFlange);

        // Slewing Bearing Ring
        const bearingGeo = new THREE.CylinderGeometry(52, 52, 12, 32);
        bearingGeo.rotateX(Math.PI / 2);
        const bearing = new THREE.Mesh(bearingGeo, this.materials.hardwareSteel);
        bearing.position.set(0, 0, 22);
        basePedestalGroup.add(bearing);

        this.basePedestal = baseFlange;
        this.basePedestal.userData = { targetType: 'joint1', name: "Joint 1 (Base Slew)" };
        this.armRoot.add(basePedestalGroup);

        // 2. Joint 1 Rotating Turret / Shoulder Hub (Rotates around Z-axis: Theta 1)
        this.j1Hub = new THREE.Group();
        this.j1Hub.position.set(0, 0, 48); // L_base
        this.armRoot.add(this.j1Hub);

        // U-Fork Shoulder Bracket (Titanium Gray)
        const forkBaseGeo = new THREE.BoxGeometry(48, 64, 30);
        const forkBase = new THREE.Mesh(forkBaseGeo, this.materials.bracketGray);
        forkBase.position.set(0, 0, -8);
        forkBase.castShadow = true;
        this.j1Hub.add(forkBase);

        // Joint 2 Shoulder Servo Motor (Royal Blue Faceplate)
        const j2ServoGeo = new THREE.CylinderGeometry(20, 20, 52, 28);
        this.j2Housing = new THREE.Mesh(j2ServoGeo, this.materials.cncFaceplate);
        this.j2Housing.castShadow = true;
        this.j2Housing.userData = { targetType: 'joint2', name: "Joint 2 (Shoulder Pitch)" };
        this.j1Hub.add(this.j2Housing);

        const hornGeo = new THREE.CylinderGeometry(14, 14, 6, 24);
        const horn = new THREE.Mesh(hornGeo, this.materials.hardwareSteel);
        horn.position.set(0, 27, 0);
        this.j1Hub.add(horn);

        // 3. Link 1 Group (Pivots at J2 Shoulder around Y-axis: Theta 2)
        this.link1Group = new THREE.Group();
        this.j1Hub.add(this.link1Group);

        this.link1Body = this.buildMechanicalLink(170, 26, 26, 'link1');
        this.link1Group.add(this.link1Body);

        // 4. Joint 3 Elbow Hub (Located at end of Link 1: (L1, 0, 0))
        this.j3Hub = new THREE.Group();
        this.j3Hub.position.set(170, 0, 0);
        this.link1Group.add(this.j3Hub);

        const j3BracketGeo = new THREE.BoxGeometry(36, 48, 36);
        const j3Bracket = new THREE.Mesh(j3BracketGeo, this.materials.bracketGray);
        j3Bracket.castShadow = true;
        this.j3Hub.add(j3Bracket);

        // Joint 3 Elbow Servo
        const j3ServoGeo = new THREE.CylinderGeometry(17, 17, 44, 28);
        this.j3Housing = new THREE.Mesh(j3ServoGeo, this.materials.cncFaceplate);
        this.j3Housing.castShadow = true;
        this.j3Housing.userData = { targetType: 'joint3', name: "Joint 3 (Elbow Pitch)" };
        this.j3Hub.add(this.j3Housing);

        // 5. Link 2 Group (Pivots at J3 Elbow around Y-axis: Theta 3)
        this.link2Group = new THREE.Group();
        this.j3Hub.add(this.link2Group);

        this.link2Body = this.buildMechanicalLink(170, 22, 22, 'link2');
        this.link2Group.add(this.link2Body);

        // 6. Joint 4 Wrist Group (Located at end of Link 2: (L2, 0, 0))
        this.j4WristGroup = new THREE.Group();
        this.j4WristGroup.position.set(170, 0, 0);
        this.link2Group.add(this.j4WristGroup);

        const j4ServoGeo = new THREE.BoxGeometry(24, 36, 26);
        this.j4Housing = new THREE.Mesh(j4ServoGeo, this.materials.servoBody);
        this.j4Housing.castShadow = true;
        this.j4Housing.userData = { targetType: 'joint4', name: "Joint 4 (Wrist / Gripper)" };
        this.j4WristGroup.add(this.j4Housing);

        // 7. Gripper Mechanism Group
        this.gripperGroup = new THREE.Group();
        this.j4WristGroup.add(this.gripperGroup);

        this.buildMechanicalGripper(60);

        // 8. Attached Gripped Payload Mesh
        const payloadGeo = new THREE.CylinderGeometry(16, 16, 28, 24);
        payloadGeo.rotateX(Math.PI / 2);
        this.payloadMesh = new THREE.Mesh(payloadGeo, this.materials.payload);
        this.payloadMesh.position.set(60, 0, 0);
        this.payloadMesh.castShadow = true;
        this.payloadMesh.visible = false;
        this.payloadMesh.userData = { targetType: 'payload', name: 'Gripped Payload' };
        this.gripperGroup.add(this.payloadMesh);
    }

    buildMechanicalLink(lengthMm, widthMm, heightMm, linkId) {
        const group = new THREE.Group();
        group.userData = { targetType: linkId, name: linkId === 'link1' ? "Link 1 Truss" : "Link 2 Truss" };

        // Main Gray Beam Truss
        const beamGeo = new THREE.BoxGeometry(lengthMm, widthMm, heightMm);
        const beam = new THREE.Mesh(beamGeo, this.materials.pla);
        beam.position.set(lengthMm / 2, 0, 0);
        beam.castShadow = true;
        beam.receiveShadow = true;
        beam.userData = { targetType: linkId };
        group.add(beam);

        // Royal Blue Inset Pockets
        const cutoutCount = Math.max(1, Math.floor(lengthMm / 45));
        const pocketGeo = new THREE.BoxGeometry(lengthMm / (cutoutCount * 2.1), widthMm + 2, heightMm * 0.58);
        for (let i = 0; i < cutoutCount; i++) {
            const pocket = new THREE.Mesh(pocketGeo, this.materials.linkAccentBlue);
            const xPos = (lengthMm / (cutoutCount + 1)) * (i + 1);
            pocket.position.set(xPos, 0, 0);
            group.add(pocket);
        }

        // Royal Blue Top Conduit Rail
        const conduitGeo = new THREE.CylinderGeometry(3, 3, lengthMm * 0.9, 12);
        conduitGeo.rotateZ(Math.PI / 2);
        const conduit = new THREE.Mesh(conduitGeo, this.materials.linkAccentBlue);
        conduit.position.set(lengthMm / 2, 0, heightMm / 2 + 1);
        group.add(conduit);

        // Stainless Steel Hardware Bolts
        const boltGeo = new THREE.CylinderGeometry(2, 2, widthMm + 3, 12);
        const bolt1 = new THREE.Mesh(boltGeo, this.materials.hardwareSteel);
        bolt1.position.set(8, 0, 0);
        group.add(bolt1);

        const bolt2 = new THREE.Mesh(boltGeo, this.materials.hardwareSteel);
        bolt2.position.set(lengthMm - 8, 0, 0);
        group.add(bolt2);

        if (linkId === 'link1') {
            this.link1MeshList = [beam];
        } else {
            this.link2MeshList = [beam];
        }

        return group;
    }

    buildMechanicalGripper(gripperLengthMm) {
        while (this.gripperGroup.children.length > 0) {
            this.gripperGroup.remove(this.gripperGroup.children[0]);
        }
        this.gripperFingers = [];
        this.gripperFSR = [];

        // 1. Central Gripper Mounting Palm Chassis (Titanium Slate)
        const palmGeo = new THREE.BoxGeometry(24, 34, 22);
        const palm = new THREE.Mesh(palmGeo, this.materials.gripperFingers);
        palm.position.set(12, 0, 0);
        palm.castShadow = true;
        palm.userData = { targetType: 'joint4', name: "Gripper Palm Chassis" };
        this.gripperGroup.add(palm);

        // Linear Guide Rail (Stainless Steel)
        const railGeo = new THREE.BoxGeometry(10, 44, 4);
        const rail = new THREE.Mesh(railGeo, this.materials.hardwareSteel);
        rail.position.set(16, 0, 0);
        this.gripperGroup.add(rail);

        const fingerLength = Math.max(18, gripperLengthMm - 14);
        const fingerGeo = new THREE.BoxGeometry(fingerLength, 6, 18);

        // Left Sliding Finger
        const fingerLeft = new THREE.Mesh(fingerGeo, this.materials.gripperFingers);
        fingerLeft.position.set(12 + fingerLength / 2, 18, 0);
        fingerLeft.castShadow = true;
        this.gripperGroup.add(fingerLeft);
        this.gripperFingers.push(fingerLeft);

        // Right Sliding Finger
        const fingerRight = new THREE.Mesh(fingerGeo, this.materials.gripperFingers);
        fingerRight.position.set(12 + fingerLength / 2, -18, 0);
        fingerRight.castShadow = true;
        this.gripperGroup.add(fingerRight);
        this.gripperFingers.push(fingerRight);

        // Tactile Pressure Sensing Pads (Laser Lime High-Visibility Gripper Liners)
        const padGeo = new THREE.BoxGeometry(fingerLength * 0.75, 1.8, 14);
        const fsrLeft = new THREE.Mesh(padGeo, this.materials.fsrSensor);
        fsrLeft.position.set(12 + fingerLength / 2, 15, 0);
        this.gripperGroup.add(fsrLeft);
        this.gripperFSR.push(fsrLeft);

        const fsrRight = new THREE.Mesh(padGeo, this.materials.fsrSensor);
        fsrRight.position.set(12 + fingerLength / 2, -15, 0);
        this.gripperGroup.add(fsrRight);
        this.gripperFSR.push(fsrRight);

        // Re-attach Held Payload centered directly inside the finger clamp envelope (x = 38 mm)
        if (!this.payloadMesh) {
            const payloadGeo = new THREE.CylinderGeometry(14, 14, 28, 24);
            payloadGeo.rotateX(Math.PI / 2);
            this.payloadMesh = new THREE.Mesh(payloadGeo, this.materials.payload);
            this.payloadMesh.castShadow = true;
            this.payloadMesh.userData = { targetType: 'payload', name: 'Gripped Payload' };
        }
        this.payloadMesh.position.set(12 + Math.min(26, fingerLength * 0.55), 0, 0);
        this.payloadMesh.visible = false;
        this.gripperGroup.add(this.payloadMesh);

        // Initialize aperture to open (1.0)
        this.setGripperAperture(1.0);
    }

    setGripperAperture(ratio) {
        // ratio: 0.0 (fully clamped closed on 28mm object) -> 1.0 (wide open approach clearance)
        const r = typeof ratio === 'number' ? Math.max(0.0, Math.min(1.0, ratio)) : (ratio ? 1.0 : 0.0);
        this.gripperApertureRatio = r;
        
        if (this.gripperFingers && this.gripperFingers.length === 2) {
            // Closed: fingers at +/- 15.5mm (inner clearance = 25mm, clamping snug on 28mm cylinder)
            // Open: fingers at +/- 24mm (inner clearance = 42mm, clean clearance around object)
            const leftY = 15.5 + r * 8.5;
            const rightY = -15.5 - r * 8.5;
            this.gripperFingers[0].position.y = leftY;
            this.gripperFingers[1].position.y = rightY;

            if (this.gripperFSR && this.gripperFSR.length === 2) {
                this.gripperFSR[0].position.y = leftY - 2.8;
                this.gripperFSR[1].position.y = rightY + 2.8;
            }
        }
    }

    createSelectionBeacon() {
        this.highlightGroup = new THREE.Group();
        this.scene.add(this.highlightGroup);
        this.highlightGroup.visible = false;

        const ringGeo = new THREE.TorusGeometry(26, 1.6, 16, 48);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x002bbb, transparent: true, opacity: 0.9 });
        this.beaconRing = new THREE.Mesh(ringGeo, ringMat);
        this.highlightGroup.add(this.beaconRing);

        const ringGeo2 = new THREE.TorusGeometry(36, 1.0, 16, 48);
        const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.5 });
        this.beaconRing2 = new THREE.Mesh(ringGeo2, ringMat2);
        this.highlightGroup.add(this.beaconRing2);

        // Arrow Pointer
        const arrowGroup = new THREE.Group();

        const stemGeo = new THREE.CylinderGeometry(2.5, 2.5, 22, 16);
        stemGeo.rotateX(Math.PI / 2);
        const stemMat = new THREE.MeshStandardMaterial({
            color: 0x002bbb,
            emissive: 0x002bbb,
            emissiveIntensity: 0.8,
            metalness: 0.85,
            roughness: 0.15
        });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.set(0, 0, 32);
        arrowGroup.add(stem);

        const coneGeo = new THREE.ConeGeometry(9, 20, 20);
        coneGeo.rotateX(-Math.PI / 2);
        const coneMat = new THREE.MeshStandardMaterial({
            color: 0xccff00, // Laser Lime Pointer Tip
            emissive: 0xccff00,
            emissiveIntensity: 0.95,
            metalness: 0.9,
            roughness: 0.1
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.set(0, 0, 12);
        arrowGroup.add(cone);

        this.pointerArrow = arrowGroup;
        this.highlightGroup.add(this.pointerArrow);
    }

    createTrajectoryLine() {
        const maxPoints = this.maxTrailPoints;
        const positions = new Float32Array(maxPoints * 3);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setDrawRange(0, 0);

        const material = new THREE.LineBasicMaterial({
            color: 0xccff00,
            linewidth: 3,
            transparent: true,
            opacity: 0.95
        });

        this.trajectoryLine = new THREE.Line(geometry, material);
        this.scene.add(this.trajectoryLine);
    }

    addTrajectoryPoint(x, y, z) {
        if (!this.trajectoryLine) return;
        this.trailPoints.push(new THREE.Vector3(x, y, z));
        if (this.trailPoints.length > this.maxTrailPoints) {
            this.trailPoints.shift();
        }

        const posAttr = this.trajectoryLine.geometry.attributes.position;
        for (let i = 0; i < this.trailPoints.length; i++) {
            posAttr.setXYZ(i, this.trailPoints[i].x, this.trailPoints[i].y, this.trailPoints[i].z);
        }
        posAttr.needsUpdate = true;
        this.trajectoryLine.geometry.setDrawRange(0, this.trailPoints.length);
    }

    clearTrajectory() {
        this.trailPoints = [];
        if (this.trajectoryLine) {
            this.trajectoryLine.geometry.setDrawRange(0, 0);
        }
    }

    setSmartHighlight(targetType, isSimulating = false) {
        this.activeHighlight = targetType;

        if (this.basePedestal) this.basePedestal.material = this.materials.cncFaceplate;
        if (this.j2Housing) this.j2Housing.material = this.materials.cncFaceplate;
        if (this.j3Housing) this.j3Housing.material = this.materials.cncFaceplate;
        if (this.j4Housing) this.j4Housing.material = this.materials.servoBody;
        if (this.link1MeshList.length > 0) this.link1MeshList[0].material = this.materials.pla;
        if (this.link2MeshList.length > 0) this.link2MeshList[0].material = this.materials.pla;
        if (this.tableWorkpiece) this.tableWorkpiece.material = this.materials.payload;
        if (this.payloadMesh) this.payloadMesh.material = this.materials.payload;

        if (isSimulating || !targetType) {
            this.highlightGroup.visible = false;
            return;
        }

        this.highlightGroup.visible = true;

        if (targetType === 'joint1' && this.basePedestal) {
            this.basePedestal.material = this.materials.servoGlow;
        } else if (targetType === 'joint2' && this.j2Housing) {
            this.j2Housing.material = this.materials.servoGlow;
        } else if (targetType === 'joint3' && this.j3Housing) {
            this.j3Housing.material = this.materials.servoGlow;
        } else if (targetType === 'joint4' && this.j4Housing) {
            this.j4Housing.material = this.materials.servoGlow;
        } else if (targetType === 'link1' && this.link1MeshList.length > 0) {
            this.link1MeshList[0].material = this.materials.plaGlow;
        } else if (targetType === 'link2' && this.link2MeshList.length > 0) {
            this.link2MeshList[0].material = this.materials.plaGlow;
        } else if (targetType === 'payload') {
            if (this.tableWorkpiece) this.tableWorkpiece.material = this.materials.payloadGlow;
            if (this.payloadMesh) this.payloadMesh.material = this.materials.payloadGlow;
        }
    }

    updateParametricStructure(L_base = 48, L1 = 170, L2 = 170, L3 = 60, materialKey = 'pla') {
        const matSpec = (typeof MATERIAL_DATABASE !== 'undefined' && MATERIAL_DATABASE[materialKey]) ? MATERIAL_DATABASE[materialKey] : { color: 0x505f75, roughness: 0.35, metalness: 0.2 };
        if (this.materials.pla) {
            this.materials.pla.color.set(matSpec.color || 0x505f75);
            this.materials.pla.roughness = matSpec.roughness || 0.35;
            this.materials.pla.metalness = matSpec.metalness || 0.2;
        }

        if (this.j1Hub) {
            this.j1Hub.position.set(0, 0, L_base);
        }

        if (this.link1Group && this.link1Body) {
            this.link1Group.remove(this.link1Body);
            this.link1Body = this.buildMechanicalLink(L1, 26, 26, 'link1');
            this.link1Group.add(this.link1Body);
        }

        if (this.j3Hub) {
            this.j3Hub.position.set(L1, 0, 0);
        }

        if (this.link2Group && this.link2Body) {
            this.link2Group.remove(this.link2Body);
            this.link2Body = this.buildMechanicalLink(L2, 22, 22, 'link2');
            this.link2Group.add(this.link2Body);
        }

        if (this.j4WristGroup) {
            this.j4WristGroup.position.set(L2, 0, 0);
        }

        if (this.gripperGroup) {
            this.buildMechanicalGripper(L3);
        }

        this.setSmartHighlight(this.activeHighlight);
    }

    setJointAngles(theta1Deg, theta2Deg, theta3Deg, theta4Deg) {
        if (this.j1Hub) this.j1Hub.rotation.z = (theta1Deg * Math.PI) / 180.0;
        if (this.link1Group) this.link1Group.rotation.y = -(theta2Deg * Math.PI) / 180.0;
        if (this.link2Group) this.link2Group.rotation.y = -(theta3Deg * Math.PI) / 180.0;
        if (this.gripperGroup) this.gripperGroup.rotation.y = -(theta4Deg * Math.PI) / 180.0;
    }

    updateForceVectors(dynamicsData, showVectors = true) {
        while (this.forceVectorsGroup.children.length > 0) {
            this.forceVectorsGroup.remove(this.forceVectorsGroup.children[0]);
        }

        if (!showVectors || !dynamicsData || !dynamicsData.fk) return;

        const fk = dynamicsData.fk;
        const weights = dynamicsData.weights || {};
        const dynForces = dynamicsData.dynamicForces || {};

        const createArrow = (startPos, forceMagnitudeN, colorHex, label) => {
            if (!startPos || !forceMagnitudeN || forceMagnitudeN <= 0.01) return;
            const dir = new THREE.Vector3(0, 0, -1);
            const length = Math.max(15, Math.min(180, forceMagnitudeN * 25));
            const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(startPos.x, startPos.y, startPos.z), length, colorHex, 8, 5);
            this.forceVectorsGroup.add(arrow);
        };

        const p_cg1 = {
            x: ((fk.p1?.x || 0) + (fk.p2?.x || 0)) / 2,
            y: ((fk.p1?.y || 0) + (fk.p2?.y || 0)) / 2,
            z: ((fk.p1?.z || 0) + (fk.p2?.z || 0)) / 2
        };
        createArrow(p_cg1, dynForces.link1_N, 0x002bbb, "W_link1");
        createArrow(fk.p2, dynForces.j3_node_N, 0x475569, "W_j3");

        const p_cg2 = {
            x: ((fk.p2?.x || 0) + (fk.p3?.x || 0)) / 2,
            y: ((fk.p2?.y || 0) + (fk.p3?.y || 0)) / 2,
            z: ((fk.p2?.z || 0) + (fk.p3?.z || 0)) / 2
        };
        createArrow(p_cg2, dynForces.link2_N, 0x002bbb, "W_link2");
        createArrow(fk.p3, dynForces.j4_node_N, 0x64748b, "W_grip");

        if (weights.payload_N > 0.05 && this.payloadMesh && this.payloadMesh.visible) {
            createArrow(fk.p4, dynForces.payload_N, 0xccff00, "F_payload");
        }
    }

    renderWorkspacePointCloud(points) {
        while (this.workspaceGroup.children.length > 0) {
            this.workspaceGroup.remove(this.workspaceGroup.children[0]);
        }

        if (!points || points.length === 0) return;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(points.length * 3);
        const colors = new Float32Array(points.length * 3);

        const colorInner = new THREE.Color(0x475569);
        const colorActive = new THREE.Color(0x002bbb);
        const colorOuter = new THREE.Color(0xccff00);

        for (let i = 0; i < points.length; i++) {
            positions[i * 3] = points[i].x;
            positions[i * 3 + 1] = points[i].y;
            positions[i * 3 + 2] = points[i].z;

            const r = points[i].reach;
            let c = colorInner;
            if (r >= 300 && r <= 400) {
                c = colorActive;
            } else if (r > 400) {
                c = colorOuter;
            }

            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 4.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.45
        });

        const pointCloud = new THREE.Points(geometry, material);
        this.workspaceGroup.add(pointCloud);
    }

    setWorkspaceVisible(visible) {
        this.workspaceGroup.visible = visible;
    }

    setPayloadHeld(isHeld, payloadG = 200, isAtDrop = false) {
        if (this.payloadMesh) {
            this.payloadMesh.visible = isHeld && (payloadG > 0);
            if (payloadG > 0) {
                const scale = Math.max(0.7, Math.min(1.8, Math.cbrt(payloadG / 200.0)));
                this.payloadMesh.scale.set(scale, scale, scale);
                if (this.pickWorkpiece) this.pickWorkpiece.scale.set(scale, scale, scale);
                if (this.dropWorkpiece) this.dropWorkpiece.scale.set(scale, scale, scale);
            }
        }
        if (this.pickWorkpiece) {
            this.pickWorkpiece.visible = !isHeld && !isAtDrop;
        }
        if (this.dropWorkpiece) {
            this.dropWorkpiece.visible = !isHeld && isAtDrop;
        }
    }

    onPointerDown(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            for (let hit of intersects) {
                let obj = hit.object;
                while (obj && obj !== this.scene) {
                    if (obj.userData && obj.userData.targetType) {
                        this.setSmartHighlight(obj.userData.targetType);
                        if (this.onJointClickCallback) {
                            this.onJointClickCallback(obj.userData.targetType);
                        }
                        return;
                    }
                    obj = obj.parent;
                }
            }
        }
    }

    onWindowResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        if (this.width === 0 || this.height === 0) return;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(this.animate);
        this.animTime += 0.045;

        // Animate selection beacon
        if (this.highlightGroup && this.highlightGroup.visible && this.activeHighlight) {
            const worldPos = new THREE.Vector3();

            if (this.activeHighlight === 'joint1' && this.basePedestal) {
                this.basePedestal.getWorldPosition(worldPos);
                worldPos.z += 30;
            } else if (this.activeHighlight === 'joint2' && this.j2Housing) {
                this.j2Housing.getWorldPosition(worldPos);
                worldPos.z += 35;
            } else if (this.activeHighlight === 'joint3' && this.j3Housing) {
                this.j3Housing.getWorldPosition(worldPos);
                worldPos.z += 35;
            } else if (this.activeHighlight === 'joint4' && this.j4Housing) {
                this.j4Housing.getWorldPosition(worldPos);
                worldPos.z += 30;
            } else if (this.activeHighlight === 'link1' && this.link1MeshList.length > 0) {
                this.link1MeshList[0].getWorldPosition(worldPos);
                worldPos.z += 25;
            } else if (this.activeHighlight === 'link2' && this.link2MeshList.length > 0) {
                this.link2MeshList[0].getWorldPosition(worldPos);
                worldPos.z += 25;
            } else if (this.activeHighlight === 'payload') {
                if (this.payloadMesh && this.payloadMesh.visible) {
                    this.payloadMesh.getWorldPosition(worldPos);
                    worldPos.z += 25;
                } else if (this.tableWorkpiece) {
                    this.tableWorkpiece.getWorldPosition(worldPos);
                    worldPos.z += 25;
                }
            }

            this.highlightGroup.position.copy(worldPos);

            const hoverBob = Math.sin(this.animTime * 3) * 5;
            this.pointerArrow.position.set(0, 0, hoverBob);
            this.beaconRing.rotation.z = this.animTime * 1.5;
            this.beaconRing2.rotation.z = -this.animTime * 0.9;
            
            const pulse = 1.0 + Math.sin(this.animTime * 4) * 0.1;
            this.beaconRing.scale.set(pulse, pulse, 1.0);
        }

        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
    }
}

window.ArmVisualizer3D = ArmVisualizer3D;
