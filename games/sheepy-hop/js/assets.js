// 3D Models: Sheep, Tree, Textures, Coins, etc.

// Texture generation
const TextureGenerator = {
    // Generate meadow texture with grass and flowers
    generateMeadowTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base grass color
        ctx.fillStyle = '#2d5a27';
        ctx.fillRect(0, 0, size, size);

        // Draw grass blades
        for (let i = 0; i < 15000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const len = Math.random() * 8 + 2;
            const angle = Math.random() * Math.PI * 2;

            ctx.strokeStyle = `rgb(${Math.random() * 100 + 50}, ${Math.random() * 100 + 100}, ${Math.random() * 100 + 50})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            ctx.stroke();
        }

        // Draw flowers
        const flowerColors = ['#ffeb3b', '#ffffff', '#e91e63', '#9c27b0'];
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = flowerColors[Math.floor(Math.random() * flowerColors.length)];
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 3 + 1, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(25, 25);

        return texture;
    },

    generateSnowTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#e8f0f8';
        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i < 8000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const v = Math.floor(Math.random() * 25 + 220);
            ctx.fillStyle = `rgb(${v},${v + 5},${v + 10})`;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 4 + 1, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let i = 0; i < 30; i++) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(200, 215, 235, ${Math.random() * 0.4})`;
            ctx.lineWidth = 2;
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(25, 25);

        return texture;
    },

    generateVolcanoTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Volcanic rock base — lifted from near-black to dark charcoal-brown
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(0, 0, size, size);

        // Glowing lava crack lines — brighter and more opaque
        for (let i = 0; i < 70; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 70, y + (Math.random() - 0.5) * 70);
            ctx.strokeStyle = `rgba(240, ${Math.floor(Math.random() * 60 + 80)}, 10, ${Math.random() * 0.5 + 0.45})`;
            ctx.lineWidth = Math.random() * 2 + 0.5;
            ctx.stroke();
        }

        // Ash and cooled rock patches — lighter range so they read against the ground
        for (let i = 0; i < 200; i++) {
            const v = Math.floor(Math.random() * 30 + 55);
            ctx.fillStyle = `rgba(${v}, ${v - 5}, ${v - 12}, 0.55)`;
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 6 + 1, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(25, 25);

        return texture;
    },

    generateJungleTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(0, 0, size, size);

        // Scattered leaf/patch shapes
        const leafColors = ['#1e5c1e', '#236b23', '#2a7a2a', '#1a4f1a'];
        for (let i = 0; i < 300; i++) {
            ctx.fillStyle = leafColors[Math.floor(Math.random() * leafColors.length)];
            ctx.beginPath();
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = Math.random() * 18 + 6;
            ctx.ellipse(x, y, r, r * 0.5, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // Dirt patches
        for (let i = 0; i < 80; i++) {
            ctx.fillStyle = `rgba(80, 50, 20, ${Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 8 + 2, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(25, 25);

        return texture;
    },

    generateDesertTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base sand color
        ctx.fillStyle = '#eaddb8';
        ctx.fillRect(0, 0, size, size);

        // Draw subtle dune waves
        ctx.lineWidth = 4;
        for (let i = 0; i < 50; i++) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(200, 180, 140, ${Math.random() * 0.3})`;
            const y = Math.random() * size;
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(size * 0.3, y - 20, size * 0.6, y + 20, size, y);
            ctx.stroke();
        }

        // Draw small rocks/pebbles
        const rockColors = ['#a0a0a0', '#8b7355', '#cd853f'];
        for (let i = 0; i < 300; i++) {
            ctx.fillStyle = rockColors[Math.floor(Math.random() * rockColors.length)];
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 2 + 1, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(25, 25);

        return texture;
    },

    // Seashell Shore: pale golden sand, finer and warmer than the desert's, with damp patches and
    // tiny flecks of broken shell (far too small to be taken for the shells you collect)
    generateBeachTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f2e0b0';
        ctx.fillRect(0, 0, size, size);

        // Soft damp patches, drawn wrapped round the edges so the texture tiles without seams
        for (let i = 0; i < 18; i++) {
            const x = Math.random() * size, y = Math.random() * size, r = 20 + Math.random() * 50;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, 'rgba(205, 175, 125, 0.25)');
            g.addColorStop(1, 'rgba(205, 175, 125, 0)');
            ctx.fillStyle = g;
            for (const dx of [-size, 0, size]) {
                for (const dy of [-size, 0, size]) {
                    ctx.save();
                    ctx.translate(dx, dy);
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
        }

        // Fine grain: light and dark specks
        for (let i = 0; i < 9000; i++) {
            ctx.fillStyle = Math.random() < 0.5
                ? `rgba(255, 250, 235, ${0.3 + Math.random() * 0.4})`
                : `rgba(190, 160, 110, ${0.2 + Math.random() * 0.3})`;
            ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
        }

        // Flecks of broken shell
        for (let i = 0; i < 220; i++) {
            ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 190, 175, 0.8)';
            ctx.beginPath();
            ctx.ellipse(Math.random() * size, Math.random() * size, 1 + Math.random() * 1.5, 0.8 + Math.random(), Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(25, 25);
        return texture;
    }
};

// Shared geometries — created once at startup, reused by every mesh instance
const _Geo = {
    treeTrunk:     new THREE.CylinderGeometry(0.5, 0.7, 2, 8),
    treeLeaves:    new THREE.ConeGeometry(2, 4, 8),
    coin:          new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16),
    raspberry:     new THREE.DodecahedronGeometry(0.6, 0),
    waterDrop:     (() => {
        const geo = new THREE.SphereGeometry(0.5, 16, 16);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            if (y > 0) {
                pos.setX(i, pos.getX(i) * (1 - y));
                pos.setZ(i, pos.getZ(i) * (1 - y));
                pos.setY(i, y * 1.5);
            }
        }
        geo.computeVertexNormals();
        return geo;
    })(),
    snakeBody:     new THREE.SphereGeometry(0.6, 16, 16),
    snakeEye:      new THREE.SphereGeometry(0.15, 8, 8),
    snakePupil:    new THREE.SphereGeometry(0.08, 8, 8),
    snakeTongue:   new THREE.BoxGeometry(0.1, 0.05, 0.4),
    sunRay:        new THREE.ConeGeometry(0.15, 0.5, 3),
    watermelon:    (() => {
        const geo = new THREE.SphereGeometry(0.8, 16, 16);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            pos.setZ(i, pos.getZ(i) * 1.3);
        }
        geo.computeVertexNormals();
        return geo;
    })(),
    cactusTrunk:   new THREE.CylinderGeometry(0.6, 0.8, 4, 8),
    cactusArm:     new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8),
    cactusArmTall: new THREE.CylinderGeometry(0.4, 0.4, 2, 8),
    sheepBody:     new THREE.DodecahedronGeometry(1, 0),
    sheepHead:     new THREE.BoxGeometry(0.7, 0.7, 0.8),
    sheepEye:      new THREE.SphereGeometry(0.12, 8, 8),
    sheepPupil:    new THREE.SphereGeometry(0.06, 4, 4),
    sheepLeg:      new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8),
    chickenBody:   new THREE.SphereGeometry(1.2, 16, 16),
    chickenHead:   new THREE.SphereGeometry(0.6, 16, 16),
    chickenBeak:   new THREE.ConeGeometry(0.15, 0.4, 8),
    chickenComb:   new THREE.BoxGeometry(0.2, 0.4, 0.4),
    chickenLeg:    new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
    fencePost:     new THREE.BoxGeometry(0.5, 2.5, 0.5),
    // Snow level
    snowCap:         new THREE.ConeGeometry(1.8, 1.0, 8),
    snowflakeArm:    new THREE.BoxGeometry(1.6, 0.12, 0.12),
    snowflakeCenter: new THREE.SphereGeometry(0.2, 8, 8),
    baubleBody:      new THREE.SphereGeometry(0.6, 16, 16),
    baubleTop:       new THREE.CylinderGeometry(0.12, 0.15, 0.25, 8),
    penguinBody:     new THREE.SphereGeometry(0.7, 12, 12),
    penguinHead:     new THREE.SphereGeometry(0.42, 12, 12),
    penguinBelly:    new THREE.SphereGeometry(0.42, 10, 10),
    penguinBeak:     new THREE.ConeGeometry(0.1, 0.32, 6),
    penguinWing:     new THREE.BoxGeometry(0.18, 0.65, 0.12),
    penguinFoot:     new THREE.BoxGeometry(0.32, 0.08, 0.22),
    penguinScarf:    new THREE.CylinderGeometry(0.44, 0.44, 0.22, 12),
    coconut:         new THREE.SphereGeometry(0.7, 10, 10),
    coconutEye:      new THREE.SphereGeometry(0.09, 6, 6),
    // Volcano level
    crabShell:      new THREE.SphereGeometry(0.65, 10, 8),
    crabClaw:       new THREE.BoxGeometry(0.35, 0.25, 0.5),
    crabClawTip:    new THREE.BoxGeometry(0.12, 0.22, 0.35),
    crabLeg:        new THREE.CylinderGeometry(0.07, 0.05, 0.9, 5),
    crabEyeStalk:   new THREE.CylinderGeometry(0.06, 0.06, 0.35, 5),
    crabEyeBall:    new THREE.SphereGeometry(0.12, 7, 7),
    ruby:           new THREE.OctahedronGeometry(0.5, 0),
    diamond:        new THREE.OctahedronGeometry(0.55, 0),
    iceCreamScoop:  new THREE.SphereGeometry(0.55, 10, 10),
    iceCreamCone:   new THREE.CylinderGeometry(0.55, 0, 1.0, 8),
    iceCreamCherry: new THREE.SphereGeometry(0.14, 6, 6),
    volcRock:       new THREE.DodecahedronGeometry(1.2, 0),
    // Jungle level
    tigerBody:     new THREE.SphereGeometry(0.7, 12, 12),
    tigerHead:     new THREE.SphereGeometry(0.45, 10, 10),
    tigerEar:      new THREE.ConeGeometry(0.18, 0.35, 6),
    tigerTail:     new THREE.CylinderGeometry(0.08, 0.12, 1.2, 6),
    tigerStripe:   new THREE.BoxGeometry(0.08, 0.55, 0.22),
    tigerNose:     new THREE.SphereGeometry(0.12, 6, 6),
    flowerStem:    new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6),
    flowerCenter:  new THREE.SphereGeometry(0.22, 8, 8),
    flowerPetal:   new THREE.SphereGeometry(0.18, 6, 6),
    grassBlade:    new THREE.ConeGeometry(0.07, 0.7, 4),
    palmTrunk:     new THREE.CylinderGeometry(0.35, 0.5, 5, 8),
    palmFrond:     new THREE.ConeGeometry(1.2, 2.2, 6),
    pineappleBody: new THREE.SphereGeometry(0.65, 10, 10),
    pineappleLeaf: new THREE.ConeGeometry(0.1, 0.55, 4),
    // Seashell Shore
    // Scallop shell: a wedge of a thick disc (a fan) standing up, hinge at the bottom. Every other
    // rim point is pushed out a little and the rim thickened, which makes the ridges and the
    // scalloped edge.
    seashell: (() => {
        const SEGMENTS = 14, START = Math.PI - 1.25, LENGTH = 2.5;
        const geo = new THREE.CylinderGeometry(0.85, 0.85, 0.14, SEGMENTS, 1, false, START, LENGTH);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), z = pos.getZ(i);
            if (Math.hypot(x, z) < 0.8) continue; // the hinge point in the middle of each face
            let a = Math.atan2(x, z) - START;
            if (a < -1e-6) a += Math.PI * 2;
            if (Math.round(a / (LENGTH / SEGMENTS)) % 2 === 1) {
                pos.setX(i, x * 1.07);
                pos.setZ(i, z * 1.07);
                pos.setY(i, pos.getY(i) * 1.5);
            }
        }
        geo.rotateX(Math.PI / 2);   // stand it up, facing the camera, fan pointing up
        geo.translate(0, -0.42, 0); // spin round its middle
        geo.computeVertexNormals();
        return geo;
    })(),
    seashellHinge: new THREE.BoxGeometry(0.42, 0.16, 0.18),
    // Five-pointed starfish, puffy from its bevel, standing up like the coins
    starfish: (() => {
        const shape = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 + Math.PI / 2; // first point straight up
            const r = i % 2 === 0 ? 0.85 : 0.36;
            if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 1 });
        geo.translate(0, 0, -0.06);
        return geo;
    })(),
    // Beach ball: six coloured panels round it, white at the poles. Each triangle takes the colour
    // of the panel its middle is in; the panel edges fall on the sphere's own segment edges.
    beachBall: (() => {
        const geo = new THREE.SphereGeometry(0.55, 18, 12).toNonIndexed();
        const pos = geo.attributes.position;
        const panels = [0xe53935, 0xffffff, 0x1e88e5, 0xffffff, 0xfdd835, 0xffffff].map(c => new THREE.Color(c));
        const white = new THREE.Color(0xffffff);
        const colors = [];
        for (let i = 0; i < pos.count; i += 3) {
            const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
            const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
            const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
            const a = Math.atan2(cz, cx) + Math.PI; // 0 to 2 pi round the ball
            const c = Math.abs(cy) > 0.47 ? white : panels[Math.floor(a / (Math.PI * 2) * 6) % 6];
            for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b);
        }
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        return geo;
    })(),
    gullBody:      new THREE.SphereGeometry(1, 12, 10),
    gullHead:      new THREE.SphereGeometry(0.32, 10, 8),
    gullBeak:      new THREE.ConeGeometry(0.09, 0.42, 6),
    gullEye:       new THREE.SphereGeometry(0.06, 6, 6),
    gullNeck:      new THREE.CylinderGeometry(0.33, 0.4, 0.16, 10),
    gullNeckTip:   new THREE.ConeGeometry(0.14, 0.3, 4),
    gullWing:      new THREE.BoxGeometry(0.08, 0.36, 1.0),
    gullWingTip:   new THREE.BoxGeometry(0.09, 0.3, 0.32),
    gullTail:      new THREE.BoxGeometry(0.35, 0.08, 0.4),
    gullLeg:       new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5),
    gullFoot:      new THREE.BoxGeometry(0.2, 0.04, 0.26),
};

// Shared materials — created once at startup, reused by every mesh instance
const _Mat = {
    treeTrunk:   new THREE.MeshStandardMaterial({ color: 0x8B4513 }),
    treeLeaves:  new THREE.MeshStandardMaterial({ color: 0x2E8B57 }),
    pinkCoin:    new THREE.MeshStandardMaterial({ color: 0xFF69B4, metalness: 0.1, roughness: 0.3, emissive: 0x442233 }),
    goldCoin:    new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.3, roughness: 0.2, emissive: 0x443300 }),
    raspberry:   new THREE.MeshStandardMaterial({ color: 0xe30b5d, roughness: 0.6, emissive: 0x550022 }),
    waterDrop:   new THREE.MeshStandardMaterial({ color: 0x4facfe, metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.8, emissive: 0x003366 }),
    snakeEye:    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    snakePupil:  new THREE.MeshBasicMaterial({ color: 0x000000 }),
    snakeTongue: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    sunCoin:     new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.4, roughness: 0.2, emissive: 0x442200 }),
    watermelon:  new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.7, emissive: 0x003300 }),
    cactus:      new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 0.8 }),
    sheepBody:   new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }),
    sheepDark:   new THREE.MeshStandardMaterial({ color: 0x333333 }),
    sheepEye:    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    sheepPupil:  new THREE.MeshBasicMaterial({ color: 0x000000 }),
    chickenBody: new THREE.MeshStandardMaterial({ color: 0xFFFFFF }),
    chickenBeak: new THREE.MeshStandardMaterial({ color: 0xFFA500 }),
    chickenComb: new THREE.MeshStandardMaterial({ color: 0xFF0000 }),
    wood:        new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 }),
    // Snow level
    snowCap:      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
    snowflake:    new THREE.MeshStandardMaterial({ color: 0xddf0ff, metalness: 0.3, roughness: 0.2, emissive: 0x112233 }),
    baubleBody:   new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.6, roughness: 0.1, emissive: 0x332200 }),
    baubleTop:    new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.8, roughness: 0.1 }),
    penguinBelly: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
    penguinEye:   new THREE.MeshBasicMaterial({ color: 0xffffff }),
    penguinPupil: new THREE.MeshBasicMaterial({ color: 0x111111 }),
    coconut:      new THREE.MeshStandardMaterial({ color: 0x6b3f1e, roughness: 1.0, metalness: 0 }),
    coconutEye:   new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.8 }),
    // Volcano level
    ruby:           new THREE.MeshStandardMaterial({ color: 0xCC0033, metalness: 0.7, roughness: 0.08, emissive: 0x550011 }),
    diamond:        new THREE.MeshStandardMaterial({ color: 0xc8f4ff, metalness: 0.85, roughness: 0.05, emissive: 0x0077cc, emissiveIntensity: 0.6 }),
    diamondGlow:    (() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0,    'rgba(136, 204, 255, 0.9)');
        g.addColorStop(0.35, 'rgba(100, 180, 255, 0.5)');
        g.addColorStop(1,    'rgba(80,  150, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
    })(),
    iceCone:        new THREE.MeshStandardMaterial({ color: 0xd4904a, roughness: 0.8 }),
    iceCreamCherry: new THREE.MeshStandardMaterial({ color: 0xcc0022, roughness: 0.5 }),
    volcRock:       new THREE.MeshStandardMaterial({ color: 0x3d3020, roughness: 0.95, emissive: 0x661800, emissiveIntensity: 0.4 }),
    crabEye:        new THREE.MeshBasicMaterial({ color: 0xffffff }),
    crabPupil:      new THREE.MeshBasicMaterial({ color: 0x111111 }),
    // Jungle level
    flowerStem:    new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 }),
    flowerCenter:  new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.1, roughness: 0.4 }),
    flowerPetal:   new THREE.MeshStandardMaterial({ color: 0xFF69B4, roughness: 0.5 }),
    grassBlade:    new THREE.MeshStandardMaterial({ color: 0x32CD32, roughness: 0.9 }),
    palmTrunk:     new THREE.MeshStandardMaterial({ color: 0xA0522D, roughness: 0.9 }),
    palmFrond:     new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.7 }),
    pineappleBody: new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.6, emissive: 0x443300 }),
    pineappleLeaf: new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.7 }),
    tigerEye:      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    tigerPupil:    new THREE.MeshBasicMaterial({ color: 0x111111 }),
    tigerStripe:   new THREE.MeshBasicMaterial({ color: 0x1a0a00 }),
    // Seashell Shore
    seashell:      new THREE.MeshStandardMaterial({ color: 0xffa98f, roughness: 0.45, metalness: 0.05, emissive: 0x3a1a12, flatShading: true, side: THREE.DoubleSide }),
    starfish:      new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.3, roughness: 0.3, emissive: 0x443300 }),
    beachBall:     new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.05 }),
    gullWhite:     new THREE.MeshStandardMaterial({ color: 0xf7f7f2, roughness: 0.8 }),
    gullGrey:      new THREE.MeshStandardMaterial({ color: 0x9aa5b1, roughness: 0.8 }),
    gullDark:      new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.8 }),
    gullEye:       new THREE.MeshBasicMaterial({ color: 0x111111 }),
    gullLeg:       new THREE.MeshStandardMaterial({ color: 0xf08a24, roughness: 0.6 }),
};

// 3D Model creation functions
const ModelCreator = {
    createTree() {
        const group = new THREE.Group();

        const trunk = new THREE.Mesh(_Geo.treeTrunk, _Mat.treeTrunk);
        trunk.position.y = 1;
        trunk.castShadow = true;
        group.add(trunk);

        const leaves = new THREE.Mesh(_Geo.treeLeaves, _Mat.treeLeaves);
        leaves.position.y = 4;
        leaves.castShadow = true;
        group.add(leaves);

        return group;
    },

    createPinkCoin() {
        const coin = new THREE.Mesh(_Geo.coin, _Mat.pinkCoin);
        coin.rotation.x = Math.PI / 2;
        coin.castShadow = true;
        return coin;
    },

    createGoldCoin() {
        const coin = new THREE.Mesh(_Geo.coin, _Mat.goldCoin);
        coin.rotation.x = Math.PI / 2;
        coin.castShadow = true;
        return coin;
    },

    createRaspberry() {
        const raspberry = new THREE.Mesh(_Geo.raspberry, _Mat.raspberry);
        raspberry.castShadow = true;
        return raspberry;
    },

    createWaterDrop() {
        const drop = new THREE.Mesh(_Geo.waterDrop, _Mat.waterDrop);
        drop.castShadow = true;
        drop.position.y = 0.5;
        return drop;
    },

    createSnake(colorHex) {
        const group = new THREE.Group();

        // Body material is unique per snake (different colours), so created per call
        const bodyMat = new THREE.MeshPhongMaterial({ color: colorHex, roughness: 0.5 });
        const body = new THREE.Mesh(_Geo.snakeBody, bodyMat);
        body.scale.set(0.6, 0.6, 1.5);
        body.position.y = 0.5;
        group.add(body);

        const leftEye = new THREE.Mesh(_Geo.snakeEye, _Mat.snakeEye);
        leftEye.position.set(0.25, 0.7, 0.6);
        const leftPupil = new THREE.Mesh(_Geo.snakePupil, _Mat.snakePupil);
        leftPupil.position.set(0, 0, 0.1);
        leftEye.add(leftPupil);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(_Geo.snakeEye, _Mat.snakeEye);
        rightEye.position.set(-0.25, 0.7, 0.6);
        const rightPupil = new THREE.Mesh(_Geo.snakePupil, _Mat.snakePupil);
        rightPupil.position.set(0, 0, 0.1);
        rightEye.add(rightPupil);
        group.add(rightEye);

        const tongue = new THREE.Mesh(_Geo.snakeTongue, _Mat.snakeTongue);
        tongue.position.set(0, 0.4, 1.0);
        group.add(tongue);

        group.userData = {
            originalColor: colorHex,
            isScared: false,
            bodyMesh: body,
            tongueMesh: tongue
        };

        return group;
    },

    createSunCoin() {
        const group = new THREE.Group();

        const coin = new THREE.Mesh(_Geo.coin, _Mat.sunCoin);
        coin.rotation.x = Math.PI / 2;
        coin.castShadow = true;
        group.add(coin);

        for (let i = 0; i < 8; i++) {
            const ray = new THREE.Mesh(_Geo.sunRay, _Mat.sunCoin);
            const angle = (i / 8) * Math.PI * 2;
            ray.position.set(Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 0);
            ray.rotation.z = angle - Math.PI / 2;
            group.add(ray);
        }

        return group;
    },

    createWatermelon() {
        const watermelon = new THREE.Mesh(_Geo.watermelon, _Mat.watermelon);
        watermelon.castShadow = true;
        return watermelon;
    },

    createCactus() {
        const group = new THREE.Group();

        const trunk = new THREE.Mesh(_Geo.cactusTrunk, _Mat.cactus);
        trunk.position.y = 2;
        trunk.castShadow = true;
        group.add(trunk);

        if (Math.random() > 0.2) {
            const lArmH = new THREE.Mesh(_Geo.cactusArm, _Mat.cactus);
            lArmH.rotation.z = Math.PI / 2;
            lArmH.position.set(-1, 2.5, 0);
            lArmH.castShadow = true;
            group.add(lArmH);

            const lArmV = new THREE.Mesh(_Geo.cactusArm, _Mat.cactus);
            lArmV.position.set(-1.5, 3.0, 0);
            lArmV.castShadow = true;
            group.add(lArmV);
        }

        if (Math.random() > 0.2) {
            const rArmH = new THREE.Mesh(_Geo.cactusArm, _Mat.cactus);
            rArmH.rotation.z = Math.PI / 2;
            rArmH.position.set(1, 1.5, 0);
            rArmH.castShadow = true;
            group.add(rArmH);

            const rArmV = new THREE.Mesh(_Geo.cactusArmTall, _Mat.cactus);
            rArmV.position.set(1.5, 2.2, 0);
            rArmV.castShadow = true;
            group.add(rArmV);
        }

        return group;
    },

    createSheep() {
        const group = new THREE.Group();

        const body = new THREE.Mesh(_Geo.sheepBody, _Mat.sheepBody);
        body.scale.set(1, 0.8, 1.2);
        body.position.y = 1;
        body.castShadow = true;
        group.add(body);

        const head = new THREE.Mesh(_Geo.sheepHead, _Mat.sheepDark);
        head.position.set(0, 1.4, 0.8);
        head.castShadow = true;
        group.add(head);

        const leftEye = new THREE.Mesh(_Geo.sheepEye, _Mat.sheepEye);
        leftEye.position.set(-0.2, 1.5, 1.2);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(_Geo.sheepEye, _Mat.sheepEye);
        rightEye.position.set(0.2, 1.5, 1.2);
        group.add(rightEye);

        const leftPupil = new THREE.Mesh(_Geo.sheepPupil, _Mat.sheepPupil);
        leftPupil.position.set(-0.2, 1.55, 1.28);
        group.add(leftPupil);

        const rightPupil = new THREE.Mesh(_Geo.sheepPupil, _Mat.sheepPupil);
        rightPupil.position.set(0.2, 1.55, 1.28);
        group.add(rightPupil);

        const legPositions = [
            { x: -0.4, z: 0.4 },
            { x: 0.4, z: 0.4 },
            { x: -0.4, z: -0.4 },
            { x: 0.4, z: -0.4 }
        ];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(_Geo.sheepLeg, _Mat.sheepDark);
            leg.position.set(pos.x, 0.4, pos.z);
            leg.castShadow = true;
            group.add(leg);
        });

        return group;
    },

    createChicken() {
        const group = new THREE.Group();

        const body = new THREE.Mesh(_Geo.chickenBody, _Mat.chickenBody);
        body.position.y = 1.5;
        body.castShadow = true;
        group.add(body);

        const head = new THREE.Mesh(_Geo.chickenHead, _Mat.chickenBody);
        head.position.set(0, 2.5, 0.5);
        head.castShadow = true;
        group.add(head);

        const beak = new THREE.Mesh(_Geo.chickenBeak, _Mat.chickenBeak);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 2.5, 1.1);
        group.add(beak);

        const comb = new THREE.Mesh(_Geo.chickenComb, _Mat.chickenComb);
        comb.position.set(0, 3.1, 0.5);
        group.add(comb);

        const leg1 = new THREE.Mesh(_Geo.chickenLeg, _Mat.chickenBeak);
        leg1.position.set(-0.4, 0.5, 0);
        group.add(leg1);

        const leg2 = new THREE.Mesh(_Geo.chickenLeg, _Mat.chickenBeak);
        leg2.position.set(0.4, 0.5, 0);
        group.add(leg2);

        return group;
    },

    createSnowCapTree() {
        const group = new THREE.Group();

        const trunk = new THREE.Mesh(_Geo.treeTrunk, _Mat.treeTrunk);
        trunk.position.y = 1;
        trunk.castShadow = true;
        group.add(trunk);

        const leaves = new THREE.Mesh(_Geo.treeLeaves, _Mat.treeLeaves);
        leaves.position.y = 4;
        leaves.castShadow = true;
        group.add(leaves);

        const cap = new THREE.Mesh(_Geo.snowCap, _Mat.snowCap);
        cap.position.y = 6.3;
        group.add(cap);

        return group;
    },

    createSnowflake() {
        const group = new THREE.Group();

        const center = new THREE.Mesh(_Geo.snowflakeCenter, _Mat.snowflake);
        group.add(center);

        for (let i = 0; i < 3; i++) {
            const arm = new THREE.Mesh(_Geo.snowflakeArm, _Mat.snowflake);
            arm.rotation.z = (i / 3) * Math.PI;
            group.add(arm);
        }

        return group;
    },

    createBauble() {
        const group = new THREE.Group();

        const body = new THREE.Mesh(_Geo.baubleBody, _Mat.baubleBody);
        body.castShadow = true;
        group.add(body);

        const top = new THREE.Mesh(_Geo.baubleTop, _Mat.baubleTop);
        top.position.y = 0.72;
        group.add(top);

        return group;
    },

    createPenguin(colorHex) {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5 });
        const scarfMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });

        const body = new THREE.Mesh(_Geo.penguinBody, bodyMat);
        body.scale.set(1, 1.2, 0.9);
        body.position.y = 0.85;
        body.castShadow = true;
        group.add(body);

        const belly = new THREE.Mesh(_Geo.penguinBelly, _Mat.penguinBelly);
        belly.scale.set(0.7, 0.9, 0.3);
        belly.position.set(0, 0.85, 0.62);
        group.add(belly);

        const head = new THREE.Mesh(_Geo.penguinHead, bodyMat);
        head.position.set(0, 1.88, 0);
        head.castShadow = true;
        group.add(head);

        const beak = new THREE.Mesh(_Geo.penguinBeak, beakMat);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 1.88, 0.52);
        group.add(beak);

        const leftEye = new THREE.Mesh(_Geo.snakeEye, _Mat.penguinEye);
        leftEye.position.set(-0.18, 2.0, 0.34);
        const leftPupil = new THREE.Mesh(_Geo.snakePupil, _Mat.penguinPupil);
        leftPupil.position.z = 0.08;
        leftEye.add(leftPupil);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(_Geo.snakeEye, _Mat.penguinEye);
        rightEye.position.set(0.18, 2.0, 0.34);
        const rightPupil = new THREE.Mesh(_Geo.snakePupil, _Mat.penguinPupil);
        rightPupil.position.z = 0.08;
        rightEye.add(rightPupil);
        group.add(rightEye);

        const leftWing = new THREE.Mesh(_Geo.penguinWing, bodyMat);
        leftWing.position.set(-0.82, 0.9, 0);
        leftWing.rotation.z = 0.3;
        group.add(leftWing);

        const rightWing = new THREE.Mesh(_Geo.penguinWing, bodyMat);
        rightWing.position.set(0.82, 0.9, 0);
        rightWing.rotation.z = -0.3;
        group.add(rightWing);

        const leftFoot = new THREE.Mesh(_Geo.penguinFoot, beakMat);
        leftFoot.position.set(-0.25, 0.04, 0.28);
        group.add(leftFoot);

        const rightFoot = new THREE.Mesh(_Geo.penguinFoot, beakMat);
        rightFoot.position.set(0.25, 0.04, 0.28);
        group.add(rightFoot);

        // Coloured scarf identifies AI type and changes colour when scared
        const scarf = new THREE.Mesh(_Geo.penguinScarf, scarfMat);
        scarf.position.set(0, 1.52, 0);
        group.add(scarf);

        group.userData = {
            originalColor: colorHex,
            isScared: false,
            bodyMesh: scarf,
            tongueMesh: beak,
            tongueMeshNormalColor: 0xff6600
        };

        return group;
    },

    createCoconut() {
        const group = new THREE.Group();

        const body = new THREE.Mesh(_Geo.coconut, _Mat.coconut);
        body.castShadow = true;
        group.add(body);

        // Three dark eyes arranged on the top face
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const eye = new THREE.Mesh(_Geo.coconutEye, _Mat.coconutEye);
            eye.position.set(Math.cos(angle) * 0.22, 0.58, Math.sin(angle) * 0.22);
            group.add(eye);
        }

        return group;
    },

    createFireCrab(colorHex) {
        const group = new THREE.Group();

        // Per-instance materials so shell and claws all shift colour together when scared
        const shellMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5, metalness: 0.2 });
        const clawMat  = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4, metalness: 0.3 });

        // Flat oval shell
        const shell = new THREE.Mesh(_Geo.crabShell, shellMat);
        shell.scale.set(1.3, 0.45, 1.0);
        shell.position.y = 0.4;
        shell.castShadow = true;
        group.add(shell);

        // Left claw (arm + upper pincer + lower pincer)
        const leftArm = new THREE.Mesh(_Geo.crabClaw, clawMat);
        leftArm.position.set(-1.0, 0.45, 0.25);
        leftArm.rotation.y = 0.4;
        leftArm.castShadow = true;
        group.add(leftArm);

        const leftPincerTop = new THREE.Mesh(_Geo.crabClawTip, clawMat);
        leftPincerTop.position.set(-1.45, 0.58, 0.5);
        group.add(leftPincerTop);

        const leftPincerBot = new THREE.Mesh(_Geo.crabClawTip, clawMat);
        leftPincerBot.position.set(-1.45, 0.34, 0.5);
        group.add(leftPincerBot);

        // Right claw
        const rightArm = new THREE.Mesh(_Geo.crabClaw, clawMat);
        rightArm.position.set(1.0, 0.45, 0.25);
        rightArm.rotation.y = -0.4;
        rightArm.castShadow = true;
        group.add(rightArm);

        const rightPincerTop = new THREE.Mesh(_Geo.crabClawTip, clawMat);
        rightPincerTop.position.set(1.45, 0.58, 0.5);
        group.add(rightPincerTop);

        const rightPincerBot = new THREE.Mesh(_Geo.crabClawTip, clawMat);
        rightPincerBot.position.set(1.45, 0.34, 0.5);
        group.add(rightPincerBot);

        // Walking legs — three per side
        [{ x: -0.90, z: -0.10 }, { x: -0.85, z: -0.40 }, { x: -0.75, z: -0.65 }].forEach(p => {
            const leg = new THREE.Mesh(_Geo.crabLeg, shellMat);
            leg.position.set(p.x, 0.18, p.z);
            leg.rotation.z = 0.5;
            group.add(leg);
        });
        [{ x: 0.90, z: -0.10 }, { x: 0.85, z: -0.40 }, { x: 0.75, z: -0.65 }].forEach(p => {
            const leg = new THREE.Mesh(_Geo.crabLeg, shellMat);
            leg.position.set(p.x, 0.18, p.z);
            leg.rotation.z = -0.5;
            group.add(leg);
        });

        // Eye stalks + eyeballs
        const leftStalk = new THREE.Mesh(_Geo.crabEyeStalk, shellMat);
        leftStalk.position.set(-0.28, 0.68, 0.42);
        group.add(leftStalk);

        const leftEyeBall = new THREE.Mesh(_Geo.crabEyeBall, _Mat.crabEye);
        leftEyeBall.position.set(-0.28, 0.9, 0.42);
        const leftPupil = new THREE.Mesh(_Geo.snakePupil, _Mat.crabPupil);
        leftPupil.position.z = 0.1;
        leftEyeBall.add(leftPupil);
        group.add(leftEyeBall);

        const rightStalk = new THREE.Mesh(_Geo.crabEyeStalk, shellMat);
        rightStalk.position.set(0.28, 0.68, 0.42);
        group.add(rightStalk);

        const rightEyeBall = new THREE.Mesh(_Geo.crabEyeBall, _Mat.crabEye);
        rightEyeBall.position.set(0.28, 0.9, 0.42);
        const rightPupil = new THREE.Mesh(_Geo.snakePupil, _Mat.crabPupil);
        rightPupil.position.z = 0.1;
        rightEyeBall.add(rightPupil);
        group.add(rightEyeBall);

        group.userData = {
            originalColor: colorHex,
            isScared: false,
            bodyMesh: shell,      // shellMat shared across shell + legs + stalks
            tongueMesh: leftArm,  // clawMat shared across all claw pieces
            tongueMeshNormalColor: colorHex
        };

        return group;
    },

    createRuby() {
        const gem = new THREE.Mesh(_Geo.ruby, _Mat.ruby);
        gem.scale.set(1.1, 1.3, 1.1);
        gem.castShadow = true;
        return gem;
    },

    createDiamond() {
        const group = new THREE.Group();

        const gem = new THREE.Mesh(_Geo.diamond, _Mat.diamond);
        gem.scale.set(1, 1.5, 1);
        gem.castShadow = true;
        group.add(gem);

        // Billboard sprite — always faces camera, additive blending punches through fog
        const sprite = new THREE.Sprite(_Mat.diamondGlow);
        sprite.scale.set(6, 6, 1);
        group.add(sprite);

        return group;
    },

    createIceCreamScoop() {
        const group = new THREE.Group();

        // Random flavour per spawn
        const flavours = [0xFFF5E0, 0xFFB3BA, 0xB4F0C8, 0xB3D9FF, 0xFFE4B5, 0xE8B4F0];
        const scoopMat = new THREE.MeshStandardMaterial({
            color: flavours[Math.floor(Math.random() * flavours.length)],
            roughness: 0.7
        });

        // Waffle cone — wide at top (y=1), point at bottom (y=0)
        const cone = new THREE.Mesh(_Geo.iceCreamCone, _Mat.iceCone);
        cone.position.y = 0.5;
        cone.castShadow = true;
        group.add(cone);

        // Ice cream scoop sitting on the rim
        const scoop = new THREE.Mesh(_Geo.iceCreamScoop, scoopMat);
        scoop.position.y = 1.5;
        scoop.castShadow = true;
        group.add(scoop);

        // Cherry on top
        const cherry = new THREE.Mesh(_Geo.iceCreamCherry, _Mat.iceCreamCherry);
        cherry.position.y = 2.1;
        group.add(cherry);

        return group;
    },

    createVolcanicRock() {
        const group = new THREE.Group();

        const rock = new THREE.Mesh(_Geo.volcRock, _Mat.volcRock);
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.castShadow = true;
        group.add(rock);

        // Smaller companion rock
        const small = new THREE.Mesh(_Geo.volcRock, _Mat.volcRock);
        small.scale.setScalar(0.45);
        small.position.set(0.9, 0, 0.6);
        small.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        small.castShadow = true;
        group.add(small);

        return group;
    },

    createTiger(colorHex) {
        const group = new THREE.Group();

        // Per-instance materials so scared-state colour changes work
        const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 });
        const noseMat = new THREE.MeshStandardMaterial({ color: 0xff69b4, roughness: 0.5 });

        const body = new THREE.Mesh(_Geo.tigerBody, bodyMat);
        body.scale.set(1.0, 0.75, 1.6);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);

        const head = new THREE.Mesh(_Geo.tigerHead, bodyMat);
        head.position.set(0, 0.9, 0.9);
        head.castShadow = true;
        group.add(head);

        const leftEar = new THREE.Mesh(_Geo.tigerEar, bodyMat);
        leftEar.position.set(-0.28, 1.3, 0.9);
        group.add(leftEar);

        const rightEar = new THREE.Mesh(_Geo.tigerEar, bodyMat);
        rightEar.position.set(0.28, 1.3, 0.9);
        group.add(rightEar);

        const leftEye = new THREE.Mesh(_Geo.snakeEye, _Mat.tigerEye);
        leftEye.position.set(-0.18, 1.02, 1.22);
        const leftPupil = new THREE.Mesh(_Geo.snakePupil, _Mat.tigerPupil);
        leftPupil.position.z = 0.09;
        leftEye.add(leftPupil);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(_Geo.snakeEye, _Mat.tigerEye);
        rightEye.position.set(0.18, 1.02, 1.22);
        const rightPupil = new THREE.Mesh(_Geo.snakePupil, _Mat.tigerPupil);
        rightPupil.position.z = 0.09;
        rightEye.add(rightPupil);
        group.add(rightEye);

        const nose = new THREE.Mesh(_Geo.tigerNose, noseMat);
        nose.position.set(0, 0.87, 1.32);
        group.add(nose);

        // Stripes alternating left and right
        const stripeOffsets = [
            { x: -0.38, z:  0.35 },
            { x:  0.38, z:  0.10 },
            { x: -0.38, z: -0.15 },
            { x:  0.38, z: -0.40 },
        ];
        stripeOffsets.forEach((o, idx) => {
            const stripe = new THREE.Mesh(_Geo.tigerStripe, _Mat.tigerStripe);
            stripe.position.set(o.x, 0.62, o.z);
            stripe.rotation.z = 0.4 * (idx % 2 === 0 ? 1 : -1);
            group.add(stripe);
        });

        const tail = new THREE.Mesh(_Geo.tigerTail, bodyMat);
        tail.position.set(0, 0.55, -1.1);
        tail.rotation.x = 0.5;
        group.add(tail);

        group.userData = {
            originalColor: colorHex,
            isScared: false,
            bodyMesh: body,
            tongueMesh: nose,
            tongueMeshNormalColor: 0xff69b4
        };

        return group;
    },

    createFlower() {
        const group = new THREE.Group();

        const stem = new THREE.Mesh(_Geo.flowerStem, _Mat.flowerStem);
        stem.position.y = 0.6;
        stem.castShadow = true;
        group.add(stem);

        const center = new THREE.Mesh(_Geo.flowerCenter, _Mat.flowerCenter);
        center.position.y = 1.3;
        center.castShadow = true;
        group.add(center);

        // Six petals evenly spaced around the center
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const petal = new THREE.Mesh(_Geo.flowerPetal, _Mat.flowerPetal);
            petal.position.set(Math.cos(angle) * 0.36, 1.3, Math.sin(angle) * 0.36);
            petal.castShadow = true;
            group.add(petal);
        }

        return group;
    },

    createGrassTuft() {
        const group = new THREE.Group();

        for (let i = 0; i < 9; i++) {
            const angle = (i / 9) * Math.PI * 2;
            const blade = new THREE.Mesh(_Geo.grassBlade, _Mat.grassBlade);
            blade.position.set(Math.cos(angle) * 0.28, 0.35, Math.sin(angle) * 0.28);
            blade.rotation.z = angle - Math.PI / 2;
            blade.castShadow = true;
            group.add(blade);
        }

        return group;
    },

    createPalmTree() {
        const group = new THREE.Group();

        const trunk = new THREE.Mesh(_Geo.palmTrunk, _Mat.palmTrunk);
        trunk.position.y = 2.5;
        trunk.rotation.z = 0.15;
        trunk.castShadow = true;
        group.add(trunk);

        // Fan of fronds at the top
        const frondAngles = [0, 1.05, 2.09, 3.14, 4.19, 5.24];
        frondAngles.forEach(angle => {
            const frond = new THREE.Mesh(_Geo.palmFrond, _Mat.palmFrond);
            frond.position.set(
                Math.cos(angle) * 1.1,
                5.2,
                Math.sin(angle) * 1.1
            );
            frond.rotation.z = Math.cos(angle) * 0.7;
            frond.rotation.x = Math.sin(angle) * 0.7;
            frond.castShadow = true;
            group.add(frond);
        });

        return group;
    },

    createPineapple() {
        const group = new THREE.Group();

        const body = new THREE.Mesh(_Geo.pineappleBody, _Mat.pineappleBody);
        body.scale.set(1, 1.3, 1);
        body.castShadow = true;
        group.add(body);

        // Crown of leaves fanning upward
        for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2;
            const leaf = new THREE.Mesh(_Geo.pineappleLeaf, _Mat.pineappleLeaf);
            leaf.position.set(Math.cos(angle) * 0.3, 0.9, Math.sin(angle) * 0.3);
            leaf.rotation.z = Math.cos(angle) * 0.5;
            leaf.rotation.x = Math.sin(angle) * 0.5;
            group.add(leaf);
        }

        // Topmost upright leaf
        const topLeaf = new THREE.Mesh(_Geo.pineappleLeaf, _Mat.pineappleLeaf);
        topLeaf.position.y = 1.1;
        group.add(topLeaf);

        return group;
    },

    createFencePerimeter(size) {
        const group = new THREE.Group();
        const halfSize = size / 2;
        // Rail geometries depend on size so are created per call, but shared across the 8 rail meshes
        const railGeometryX = new THREE.BoxGeometry(size, 0.3, 0.2);
        const railGeometryZ = new THREE.BoxGeometry(0.2, 0.3, size);

        for (let i = -halfSize; i <= halfSize; i += 5) {
            const post1 = new THREE.Mesh(_Geo.fencePost, _Mat.wood);
            post1.position.set(i, 1.25, -halfSize);
            post1.castShadow = true;
            group.add(post1);

            const post2 = new THREE.Mesh(_Geo.fencePost, _Mat.wood);
            post2.position.set(i, 1.25, halfSize);
            post2.castShadow = true;
            group.add(post2);

            if (i > -halfSize && i < halfSize) {
                const post3 = new THREE.Mesh(_Geo.fencePost, _Mat.wood);
                post3.position.set(-halfSize, 1.25, i);
                post3.castShadow = true;
                group.add(post3);

                const post4 = new THREE.Mesh(_Geo.fencePost, _Mat.wood);
                post4.position.set(halfSize, 1.25, i);
                post4.castShadow = true;
                group.add(post4);
            }
        }

        const railsInfo = [
            { geo: railGeometryX, pos: [0, 1.8, -halfSize] },
            { geo: railGeometryX, pos: [0, 0.8, -halfSize] },
            { geo: railGeometryX, pos: [0, 1.8,  halfSize] },
            { geo: railGeometryX, pos: [0, 0.8,  halfSize] },
            { geo: railGeometryZ, pos: [-halfSize, 1.8, 0] },
            { geo: railGeometryZ, pos: [-halfSize, 0.8, 0] },
            { geo: railGeometryZ, pos: [ halfSize, 1.8, 0] },
            { geo: railGeometryZ, pos: [ halfSize, 0.8, 0] }
        ];

        railsInfo.forEach(info => {
            const rail = new THREE.Mesh(info.geo, _Mat.wood);
            rail.position.set(...info.pos);
            rail.castShadow = true;
            group.add(rail);
        });

        return group;
    },

    // ---------- Seashell Shore (beach) ----------

    createSeashell() {
        const group = new THREE.Group();
        const shell = new THREE.Mesh(_Geo.seashell, _Mat.seashell);
        shell.castShadow = true;
        group.add(shell);
        const hinge = new THREE.Mesh(_Geo.seashellHinge, _Mat.seashell);
        hinge.position.y = -0.42;
        group.add(hinge);
        return group;
    },

    createStarfish() {
        const star = new THREE.Mesh(_Geo.starfish, _Mat.starfish);
        star.castShadow = true;
        return star;
    },

    createBeachBall() {
        const ball = new THREE.Mesh(_Geo.beachBall, _Mat.beachBall);
        ball.castShadow = true;
        return ball;
    },

    // Beach obstacle: a striped umbrella with a towel, or a sandcastle with a flag and bucket. Each
    // is one merged, vertex-coloured mesh (one draw call), and stands within the usual 1.5
    // collision radius of the obstacles. Uses mergePieces from scenery.js (loaded by the time
    // levels are built).
    createBeachObstacle() {
        const variants = sceneryCached('beachObstacles', () => {
            const B = new THREE.BoxGeometry(1, 1, 1);
            const umbrella = ([a, b]) => {
                const pieces = [
                    { geo: new THREE.CylinderGeometry(0.07, 0.07, 3.1, 6), color: '#f2f2f2', pos: [0, 1.55, 0] },
                    { geo: new THREE.SphereGeometry(0.12, 6, 4), color: a, pos: [0, 3.85, 0] }
                ];
                for (let k = 0; k < 8; k++) { // canopy: eight wedges in two colours
                    pieces.push({ geo: new THREE.ConeGeometry(2.0, 0.8, 2, 1, false, k * Math.PI / 4, Math.PI / 4), color: k % 2 ? b : a, pos: [0, 3.4, 0] });
                }
                for (let k = 0; k < 4; k++) { // striped towel on the sand beside the pole
                    pieces.push({ geo: B, color: k % 2 ? '#ffffff' : a, pos: [0.85, 0.025, -0.45 + k * 0.5], scale: [1.2, 0.04, 0.5] });
                }
                return mergePieces(pieces);
            };
            const sandcastle = (flag, pointy) => {
                const SAND = '#e3c48a', DARK = '#d4b276';
                const pieces = [
                    { geo: new THREE.CylinderGeometry(1.35, 1.5, 0.35, 8), color: DARK, pos: [0, 0.17, 0] },
                    { geo: B, color: SAND, pos: [0, 0.85, 0], scale: [1.5, 1.0, 1.5] },
                    { geo: new THREE.CylinderGeometry(0.42, 0.48, 0.9, 7), color: SAND, pos: [0, 1.8, 0] },
                    { geo: B, color: '#a8875a', pos: [0, 0.62, 0.76], scale: [0.4, 0.55, 0.05] },   // door, facing the camera
                    { geo: new THREE.CylinderGeometry(0.025, 0.025, 0.9, 4), color: '#8a6a42', pos: [0, 2.7, 0] },
                    { geo: B, color: flag, pos: [0.25, 2.98, 0], scale: [0.5, 0.3, 0.03] },
                    // a bucket left beside it
                    { geo: new THREE.CylinderGeometry(0.22, 0.17, 0.35, 8), color: flag, pos: [1.05, 0.18, 0.55] }
                ];
                [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
                    pieces.push({ geo: new THREE.CylinderGeometry(0.32, 0.36, 1.5, 7), color: SAND, pos: [sx * 0.75, 0.75, sz * 0.75] });
                    pieces.push(pointy
                        ? { geo: new THREE.ConeGeometry(0.38, 0.55, 7), color: DARK, pos: [sx * 0.75, 1.77, sz * 0.75] }
                        : { geo: new THREE.CylinderGeometry(0.4, 0.34, 0.2, 7), color: DARK, pos: [sx * 0.75, 1.6, sz * 0.75] });
                });
                return mergePieces(pieces);
            };
            return [
                umbrella(['#e53935', '#ffffff']), umbrella(['#1e88e5', '#ffffff']), umbrella(['#fdd835', '#ff7043']),
                sandcastle('#e53935', true), sandcastle('#1e88e5', false)
            ];
        });
        // Three umbrellas to every two sandcastles
        const mesh = new THREE.Mesh(variants[Math.floor(Math.random() * variants.length)], vertexColourMaterial());
        mesh.castShadow = true;
        const group = new THREE.Group();
        group.add(mesh);
        return group;
    },

    // Seagull enemy, facing +z: waddles, then spreads its wings and swoops (see 'swoop' in
    // main.js). It's all in an inner group (userData.bird), so the swoop can lift the bird
    // without moving the enemy itself, whose collision stays the same. The neckerchief's colour
    // shows the AI type, and turns grey when scared.
    createSeagull(colorHex) {
        const group = new THREE.Group();
        const bird = new THREE.Group();
        bird.position.y = -0.5; // enemies are held 0.5 above the ground: this stands the gull on it
        group.add(bird);

        const neckMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xffc030, roughness: 0.5 });
        const add = (geo, mat, x, y, z, parent = bird) => {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            parent.add(mesh);
            return mesh;
        };

        const body = add(_Geo.gullBody, _Mat.gullWhite, 0, 0.9, 0);
        body.scale.set(0.55, 0.5, 0.85);
        body.castShadow = true;
        add(_Geo.gullHead, _Mat.gullWhite, 0, 1.45, 0.6).castShadow = true;
        const beak = add(_Geo.gullBeak, beakMat, 0, 1.38, 1.0);
        beak.rotation.x = Math.PI / 2;
        add(_Geo.gullEye, _Mat.gullEye, -0.2, 1.53, 0.82);
        add(_Geo.gullEye, _Mat.gullEye, 0.2, 1.53, 0.82);

        const neck = add(_Geo.gullNeck, neckMat, 0, 1.18, 0.45);
        neck.rotation.x = -0.3;
        const tip = add(_Geo.gullNeckTip, neckMat, 0, 1.0, 0.78);
        tip.rotation.x = Math.PI; // the neckerchief's point, hanging down at the front

        const tail = add(_Geo.gullTail, _Mat.gullGrey, 0, 0.98, -0.85);
        tail.rotation.x = -0.3;

        // Wings hang along the sides from a hinge at the shoulder; the swoop swings them out
        const wings = [-1, 1].map(s => {
            const pivot = new THREE.Group();
            pivot.position.set(s * 0.48, 1.08, 0.05);
            bird.add(pivot);
            add(_Geo.gullWing, _Mat.gullGrey, s * 0.02, -0.16, -0.05, pivot).castShadow = true;
            add(_Geo.gullWingTip, _Mat.gullDark, s * 0.02, -0.18, -0.6, pivot);
            return pivot;
        });

        [-0.15, 0.15].forEach(x => {
            add(_Geo.gullLeg, _Mat.gullLeg, x, 0.3, 0.05);
            add(_Geo.gullFoot, _Mat.gullLeg, x, 0.04, 0.12);
        });

        group.userData = {
            originalColor: colorHex,
            isScared: false,
            bodyMesh: neck,
            tongueMesh: beak,
            tongueMeshNormalColor: 0xffc030,
            bird,
            wings
        };
        return group;
    }
};

// Particle system
const ParticleSystem = {
    particles: [],
    particleGeometry: new THREE.BoxGeometry(0.5, 0.5, 0.5),
    particleMaterial: new THREE.MeshBasicMaterial({ color: 0xFF1493 }),
    scene: null,

    init(scene) {
        this.scene = scene;
    },

    spawnSpark(position, moveX, moveZ) {
        if (!this.scene) {
            console.error('ParticleSystem not initialized with scene');
            return null;
        }

        const mesh = new THREE.Mesh(this.particleGeometry, this.particleMaterial);
        mesh.position.copy(position);
        mesh.position.y += 2.5;

        const offsetDist = 2.5;
        mesh.position.x -= moveX * offsetDist;
        mesh.position.z -= moveZ * offsetDist;

        mesh.position.x += (Math.random() - 0.5) * 1.5;
        mesh.position.y += (Math.random() - 0.5) * 1.5;
        mesh.position.z += (Math.random() - 0.5) * 1.5;

        this.scene.add(mesh);
        this.particles.push({
            mesh: mesh,
            life: 1.0,
            velocity: new THREE.Vector3(0, -0.1, 0)
        });

        return mesh;
    },

    // frameScale: 1.0 at 60fps (values below are tuned per 60fps frame)
    updateParticles(frameScale = 1) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= 0.03 * frameScale;
            p.mesh.position.addScaledVector(p.velocity, frameScale);
            p.mesh.rotation.x += 0.2 * frameScale;
            p.mesh.rotation.z += 0.2 * frameScale;
            p.mesh.scale.setScalar(p.life);

            if (p.life <= 0) {
                if (p.mesh.parent) {
                    p.mesh.parent.remove(p.mesh);
                }
                this.particles.splice(i, 1);
            }
        }
    },

    clearParticles() {
        this.particles.forEach(p => {
            if (p.mesh.parent) {
                p.mesh.parent.remove(p.mesh);
            }
        });
        this.particles = [];
    }
};

// Biome background effects (snowfall, embers, blowing sand, fireflies, pollen): one THREE.Points
// cloud in a box that follows Sheepy. Particles wrap around the box edges, so the effect is
// always on screen without spawning anything. Configured per level by `ambientEffect` in levels.js.
const AmbientEffects = {
    AREA: 50,          // half-width of the box around Sheepy (camera sees roughly ±30)
    points: null,
    config: null,
    base: null,        // un-swayed positions, Float32Array of x,y,z
    phase: null,       // per-particle random phase for sway/twinkle
    time: 0,
    dotTexture: (() => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.4, 'rgba(255,255,255,0.8)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    })(),

    create(scene, config, center) {
        this.dispose();
        if (!config) return;
        this.config = config;
        this.time = 0;

        const n = config.count;
        this.base = new Float32Array(n * 3);
        this.phase = new Float32Array(n);
        const cx = center ? center.x : 0, cz = center ? center.z : 0;
        for (let i = 0; i < n; i++) {
            this.base[i * 3] = cx + (Math.random() * 2 - 1) * this.AREA;
            this.base[i * 3 + 1] = config.heightMin + Math.random() * (config.heightMax - config.heightMin);
            this.base[i * 3 + 2] = cz + (Math.random() * 2 - 1) * this.AREA;
            this.phase[i] = Math.random() * Math.PI * 2;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.base), 3));
        if (config.twinkle) {
            geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        }
        const material = new THREE.PointsMaterial({
            size: config.size,
            map: this.dotTexture,
            color: config.twinkle ? 0xffffff : config.color, // twinkling particles take their colour per particle
            vertexColors: !!config.twinkle,
            transparent: true,
            opacity: config.opacity,
            depthWrite: false,
            blending: config.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
            sizeAttenuation: true
        });
        this.points = new THREE.Points(geometry, material);
        this.points.frustumCulled = false; // positions move with Sheepy, so the cached bounds would be wrong
        scene.add(this.points);
        this.update(0, center);
    },

    // deltaTime in seconds; center = Sheepy's position
    update(deltaTime, center) {
        if (!this.points) return;
        const c = this.config, n = c.count, A = this.AREA;
        const [vx, vy, vz] = c.velocity;
        const span = c.heightMax - c.heightMin;
        this.time += deltaTime;
        const pos = this.points.geometry.attributes.position.array;
        const col = c.twinkle ? this.points.geometry.attributes.color.array : null;
        const baseColor = c.twinkle ? new THREE.Color(c.color) : null;
        const cx = center ? center.x : 0, cz = center ? center.z : 0;

        for (let i = 0; i < n; i++) {
            const k = i * 3;
            let x = this.base[k] + vx * deltaTime;
            let y = this.base[k + 1] + vy * deltaTime;
            let z = this.base[k + 2] + vz * deltaTime;
            // Wrap inside the box around Sheepy
            if (x - cx > A) x -= 2 * A; else if (x - cx < -A) x += 2 * A;
            if (z - cz > A) z -= 2 * A; else if (z - cz < -A) z += 2 * A;
            if (y > c.heightMax) y -= span; else if (y < c.heightMin) y += span;
            this.base[k] = x; this.base[k + 1] = y; this.base[k + 2] = z;

            const p = this.phase[i];
            const swayX = c.sway ? Math.sin(this.time * 1.3 + p) * c.sway : 0;
            const swayZ = c.sway ? Math.cos(this.time * 1.1 + p * 1.7) * c.sway : 0;
            pos[k] = x + swayX; pos[k + 1] = y; pos[k + 2] = z + swayZ;

            if (col) {
                const glow = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(this.time * (2 + (p % 1.5)) + p * 3));
                col[k] = baseColor.r * glow; col[k + 1] = baseColor.g * glow; col[k + 2] = baseColor.b * glow;
            }
        }
        this.points.geometry.attributes.position.needsUpdate = true;
        if (col) this.points.geometry.attributes.color.needsUpdate = true;
    },

    dispose() {
        if (this.points) {
            if (this.points.parent) this.points.parent.remove(this.points);
            this.points.geometry.dispose();
            this.points.material.dispose();
        }
        this.points = null;
        this.config = null;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextureGenerator, ModelCreator, ParticleSystem, AmbientEffects };
}
