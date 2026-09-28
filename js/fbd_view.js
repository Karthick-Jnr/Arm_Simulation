/**
 * Real-Time 2D Free Body Diagram (FBD) - Technical Drafting Visualizer
 * Features:
 * - Pure White & Slate Technical Drafting Aesthetic
 * - 60 FPS Real-time Kinematic Animation
 * - Collision-Free Callout Badges for Joints, Torques & Force Vectors
 * - Dynamic Vector Scaling & Moment Arm Projection
 */

class FbdVisualizer2D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
    }

    resize() {
        if (!this.canvas || !this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        if (this.ctx) {
            this.ctx.resetTransform?.();
            this.ctx.scale(dpr, dpr);
        }
        this.displayW = rect.width;
        this.displayH = rect.height;
    }

    render(dynamicsData, config, isHeld = true) {
        if (!this.canvas) {
            this.canvas = document.getElementById('fbd-canvas');
            if (this.canvas) this.ctx = this.canvas.getContext('2d');
        }
        if (!this.ctx || !dynamicsData || !dynamicsData.fk) return;
        
        if (!this.displayW || this.displayW === 0) {
            this.resize();
        }

        const ctx = this.ctx;
        const w = this.displayW || this.canvas.width;
        const h = this.displayH || this.canvas.height;

        // Clear canvas with Clean White Background
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);

        const fk = dynamicsData.fk;
        const weights = dynamicsData.weights || {};
        const dynForces = dynamicsData.dynamicForces || {};
        const torques = dynamicsData.torques || {};

        // Scaling & Dynamic Centering (Horizontally and Vertically Centered)
        const L1 = config.L1 || 170;
        const L2 = config.L2 || 170;
        const L3 = config.L3 || 60;
        const L_base = config.L_base || 48;
        const totalArmReach = L1 + L2 + L3;
        const maxEnvReach = Math.max(totalArmReach + 50, 460);
        
        // Compute responsive scale so the entire reach fits comfortably
        const scale = Math.max(0.35, Math.min((w - 280) / maxEnvReach, (h - 170) / (totalArmReach * 0.95)));
        
        // Dynamically center the kinematic mechanism horizontally in the viewport
        const diagramWidthPx = (Math.max(totalArmReach, 400) + 120) * scale;
        const originX = Math.max(160, Math.floor((w - diagramWidthPx) / 2 + 80 * scale));
        const originY = Math.floor(h - 95); // Workbench datum baseline

        const toScreen = (rx, z) => ({
            x: originX + (rx || 0) * scale,
            y: originY - (z || 0) * scale
        });

        // 1. Technical Drafting Blueprint Grid (Full Canvas)
        ctx.strokeStyle = "rgba(15, 23, 42, 0.04)";
        ctx.lineWidth = 1;
        const gridStep = 50 * scale;
        
        // Vertical grid lines aligned to originX
        for (let x = originX; x < w; x += gridStep) {
            ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, originY + 65); ctx.stroke();
        }
        for (let x = originX - gridStep; x > 0; x -= gridStep) {
            ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, originY + 65); ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let z = 0; z < 700; z += 50) {
            const y = originY - z * scale;
            if (y > 10) {
                ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(w - 10, y); ctx.stroke();
            }
        }

        // 2. Workbench Reference Datum (Full Width Floor)
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, originY, w, h - originY);
        
        ctx.strokeStyle = "#002bbb";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(w, originY);
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.font = "bold 9.5px 'Google Sans', 'Product Sans', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("WORKBENCH REFERENCE DATUM // Z = 0.00 mm", w - 35, originY + 22);
        ctx.textAlign = "left";

        // 3. Optimal Sorting Zone (300mm to 400mm)
        const zStart = toScreen(300, 0).x;
        const zEnd = toScreen(400, 0).x;
        ctx.fillStyle = "rgba(0, 43, 187, 0.04)";
        ctx.fillRect(zStart, 30, zEnd - zStart, originY - 30);
        ctx.strokeStyle = "rgba(0, 43, 187, 0.35)";
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(zStart, 30, zEnd - zStart, originY - 30);
        ctx.setLineDash([]);
        
        ctx.fillStyle = "#002bbb";
        ctx.font = "bold 9.5px 'Google Sans', 'Product Sans', sans-serif";
        ctx.fillText("ACTIVE SORTING ENVELOPE [300 - 400 mm]", zStart + 8, 48);

        // 4. Base Pedestal
        ctx.fillStyle = "#e2e8f0";
        ctx.strokeStyle = "#002bbb";
        ctx.lineWidth = 2;
        ctx.fillRect(originX - 22, originY - L_base * scale, 44, L_base * scale);
        ctx.strokeRect(originX - 22, originY - L_base * scale, 44, L_base * scale);

        // 5. Kinematic Nodes
        const r1 = fk.p1.rx !== undefined ? fk.p1.rx : 0;
        const r2 = fk.p2.rx !== undefined ? fk.p2.rx : (L1 * Math.cos(fk.phi1 || 0));
        const r3 = fk.p3.rx !== undefined ? fk.p3.rx : (r2 + L2 * Math.cos(fk.phi2 || 0));
        const r4 = fk.p4.rx !== undefined ? fk.p4.rx : (r3 + L3 * Math.cos(fk.phi3 || 0));

        const p1 = toScreen(r1, fk.p1.z);
        const p2 = toScreen(r2, fk.p2.z);
        const p3 = toScreen(r3, fk.p3.z);
        const p4 = toScreen(r4, fk.p4.z);

        // Link 1 (Shoulder to Elbow)
        ctx.strokeStyle = "#002bbb";
        ctx.lineWidth = 9;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Link 2 (Elbow to Wrist)
        ctx.strokeStyle = "#6c82a3";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.stroke();

        // Gripper (Wrist to Tip)
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();

        // Helper: Draw Collision-Free Rounded Pill Callout Badge for Joint Information
        const drawJointBadge = (pt, label, torqueVal = 0, sf = 1.0, alignOffset = { dx: -70, dy: -36 }) => {
            // Draw joint circle pin
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#002bbb";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Background badge card
            const bx = pt.x + alignOffset.dx;
            const by = pt.y + alignOffset.dy;
            const bw = 138;
            const bh = 30;

            ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
            ctx.strokeStyle = "rgba(0, 43, 187, 0.35)";
            ctx.lineWidth = 1.2;
            ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 5);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0; // reset shadow

            // Text inside badge
            ctx.fillStyle = "#002bbb";
            ctx.font = "bold 10px 'Google Sans', 'Product Sans', sans-serif";
            ctx.fillText(label, bx + 7, by + 12);
            
            ctx.fillStyle = "#475569";
            ctx.font = "9px 'Google Sans', 'Product Sans', 'JetBrains Mono', sans-serif";
            const tStr = typeof torqueVal === 'number' ? torqueVal.toFixed(1) : '0.0';
            const sfStr = typeof sf === 'number' ? sf.toFixed(1) : '1.0';
            ctx.fillText(`τ: ${tStr} kg·cm  (SF: ${sfStr}x)`, bx + 7, by + 24);
        };

        const tJ2 = torques.j2 ? torques.j2.dynamic_kgcm : 0;
        const sfJ2 = torques.j2 ? torques.j2.sf : 1.0;
        const tJ3 = torques.j3 ? torques.j3.dynamic_kgcm : 0;
        const sfJ3 = torques.j3 ? torques.j3.sf : 1.0;
        const tJ4 = torques.j4 ? torques.j4.dynamic_kgcm : 0;
        const sfJ4 = torques.j4 ? torques.j4.sf : 1.0;

        // Position J2 badge to the top-left
        drawJointBadge(p1, "J2 (SHOULDER)", tJ2, sfJ2, { dx: -145, dy: -20 });
        // Position J3 badge above the elbow vertex
        drawJointBadge(p2, "J3 (ELBOW)", tJ3, sfJ3, { dx: -68, dy: -42 });
        // Position J4 badge above the wrist
        drawJointBadge(p3, "J4 (WRIST)", tJ4, sfJ4, { dx: 14, dy: -36 });

        // 6. Force Vectors (Downward Dynamic Forces with Clean Pill Labels)
        const drawForceArrowWithBadge = (pt, forceN = 0, label = "", color = "#002bbb") => {
            if (!forceN || forceN < 0.01) return;
            const arrowLen = Math.max(18, Math.min(65, forceN * 16));
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 2.2;

            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(pt.x, pt.y + arrowLen);
            ctx.stroke();

            // Arrow head
            ctx.beginPath();
            ctx.moveTo(pt.x - 4, pt.y + arrowLen - 6);
            ctx.lineTo(pt.x + 4, pt.y + arrowLen - 6);
            ctx.lineTo(pt.x, pt.y + arrowLen);
            ctx.fill();

            // Clean background pill for text label
            const textStr = `${label}: ${forceN.toFixed(2)} N`;
            ctx.font = "bold 9.5px 'Google Sans', 'Product Sans', sans-serif";
            const textWidth = ctx.measureText(textStr).width;
            
            const lx = pt.x + 7;
            const ly = pt.y + arrowLen / 2 - 8;
            ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
            ctx.strokeStyle = "rgba(15, 23, 42, 0.15)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(lx - 3, ly, textWidth + 8, 15, 3);
            ctx.fill();
            ctx.stroke();

            // Text Label
            ctx.fillStyle = color;
            ctx.fillText(textStr, lx + 1, ly + 11);
        };

        const cg1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const cg2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

        drawForceArrowWithBadge(cg1, dynForces.link1_N, "W_L1", "#002bbb");
        drawForceArrowWithBadge(p2, dynForces.j3_node_N, "W_J3", "#6c82a3");
        drawForceArrowWithBadge(cg2, dynForces.link2_N, "W_L2", "#002bbb");
        drawForceArrowWithBadge(p3, dynForces.j4_node_N, "W_GRIP", "#475569");

        if (isHeld && (weights.payload_N > 0.05 || (config.payloadG && config.payloadG > 0))) {
            const payForce = dynForces.payload_N || ((config.payloadG / 1000) * 9.81);
            drawForceArrowWithBadge(p4, payForce, "F_PAYLOAD", "#002bbb");

            // Draw payload block
            ctx.fillStyle = "#002bbb";
            ctx.strokeStyle = "#002294";
            ctx.lineWidth = 1.5;
            ctx.fillRect(p4.x - 8, p4.y - 8, 16, 16);
            ctx.strokeRect(p4.x - 8, p4.y - 8, 16, 16);
        }

        // 7. Moment Arm Dotted Reference Lines
        ctx.strokeStyle = "rgba(0, 43, 187, 0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p1.x, originY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p4.x, p4.y); ctx.lineTo(p4.x, originY); ctx.stroke();
        ctx.setLineDash([]);

        // Radial Reach Dimension Leader (Positioned cleanly below the datum)
        ctx.strokeStyle = "#002bbb";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, originY + 28);
        ctx.lineTo(p4.x, originY + 28);
        ctx.stroke();

        // Arrow tick marks
        ctx.beginPath();
        ctx.moveTo(p1.x, originY + 24); ctx.lineTo(p1.x, originY + 32);
        ctx.moveTo(p4.x, originY + 24); ctx.lineTo(p4.x, originY + 32);
        ctx.stroke();

        ctx.fillStyle = "#002bbb";
        ctx.font = "bold 10px 'Google Sans', 'Product Sans', sans-serif";
        ctx.textAlign = "center";
        const reachVal = fk.radialReach !== undefined ? fk.radialReach : Math.abs(r4);
        ctx.fillText(`TOTAL REACH R = ${reachVal.toFixed(1)} mm`, (p1.x + p4.x) / 2, originY + 44);
        ctx.textAlign = "left";
    }
}

window.FbdVisualizer2D = FbdVisualizer2D;
