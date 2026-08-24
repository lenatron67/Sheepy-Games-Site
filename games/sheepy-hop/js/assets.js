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

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= 0.03;
            p.mesh.position.add(p.velocity);
            p.mesh.rotation.x += 0.2;
            p.mesh.rotation.z += 0.2;
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextureGenerator, ModelCreator, ParticleSystem };
}
