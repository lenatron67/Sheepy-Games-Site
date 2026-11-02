// Biome scenery: one big landmark per biome (solid: Sheepy and enemies go round it) and
// walk-through ground detail. Each level picks its models with `landmarks` and `groundDetail`
// in levels.js; the models are in SceneryModels below. Loaded after assets.js.
//
// Textures, geometry and materials are built the first time a biome needs them, then reused on
// every later visit, so they only go to the GPU once.

const _SceneryCache = {};
function sceneryCached(key, build) {
    if (!_SceneryCache[key]) _SceneryCache[key] = build();
    return _SceneryCache[key];
}

// Round soft-edged texture for smoke puffs and glows. stops: [[offset, 'rgba(...)'], ...]
function makeRadialTexture(size, stops) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([offset, color]) => g.addColorStop(offset, color));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
}

// Many flat quads lying on the ground, merged into one mesh so they cost a single draw call.
// Each quad: { x, z, angle, width, length, start, uvRect }. It runs `length` units in direction
// (sin angle, cos angle) from `start` units along (default: centred on x, z), and the texture's
// v axis runs the same way. uvRect [u0, v0, du, dv] picks part of a texture atlas (default: all).
function buildGroundDecals(quads, y) {
    const positions = [], uvs = [], indices = [];
    quads.forEach((q, n) => {
        const dx = Math.sin(q.angle), dz = Math.cos(q.angle); // along the quad
        const ax = dz, az = -dx;                              // across it
        const start = q.start !== undefined ? q.start : -q.length / 2;
        const [u0, v0, du, dv] = q.uvRect || [0, 0, 1, 1];
        [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]].forEach(([across, along]) => {
            const a = across * q.width, l = start + along * q.length;
            positions.push(q.x + dx * l + ax * a, y, q.z + dz * l + az * a);
            uvs.push(u0 + (across + 0.5) * du, v0 + along * dv);
        });
        const b = n * 4;
        indices.push(b, b + 2, b + 1, b, b + 3, b + 2); // wound to face up
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

// Material for ground decals, drawn just above the ground without z-fighting it.
//   'glow'  - unlit, so it glows even in shadow (lava)
//   'lit'   - lit and shadowed like the ground (paths, ripples)
//   'shiny' - lit, with a glint of sun (ice)
function makeDecalMaterial(texture, kind = 'glow') {
    const options = {
        map: texture,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -4
    };
    if (kind === 'lit') return new THREE.MeshLambertMaterial(options);
    if (kind === 'shiny') return new THREE.MeshPhongMaterial({ ...options, shininess: 60, specular: 0x6688aa });
    return new THREE.MeshBasicMaterial(options);
}

// Glowing branching lava crack, drawn centred on (cx, cy) and kept inside `radius`
function drawLavaCrack(ctx, cx, cy, radius) {
    const branches = [];
    const grow = (x, y, angle, len, width, depth) => {
        const pts = [[x, y]];
        let a = angle;
        const steps = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < steps; i++) {
            a += (Math.random() - 0.5) * 0.9;
            x += Math.cos(a) * len / steps;
            y += Math.sin(a) * len / steps;
            if (Math.hypot(x - cx, y - cy) > radius) break;
            pts.push([x, y]);
            if (depth < 2 && Math.random() < 0.3) {
                grow(x, y, a + (Math.random() < 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.5), len * 0.5, width * 0.6, depth + 1);
            }
        }
        branches.push({ pts, width });
    };
    const arms = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < arms; i++) {
        grow(cx, cy, (i / arms) * Math.PI * 2 + Math.random() * 0.8, radius * (0.75 + Math.random() * 0.25), 4.5, 0);
    }
    const stroke = (color, widthScale, blur) => {
        ctx.strokeStyle = color;
        ctx.shadowColor = blur ? 'rgba(255, 80, 0, 0.9)' : 'transparent';
        ctx.shadowBlur = blur;
        ctx.lineCap = ctx.lineJoin = 'round';
        branches.forEach(b => {
            ctx.lineWidth = b.width * widthScale;
            ctx.beginPath();
            b.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
            ctx.stroke();
        });
    };
    stroke('rgba(40, 10, 0, 0.85)', 2.2, 0);  // dark scorched edge
    stroke('#ff5a08', 1.0, 10);               // glowing lava
    stroke('#ffd36a', 0.35, 0);               // hot core
}

// Sideways wiggle (canvas px) of a lava stream at t = 0..1 along it
function lavaWiggle(t, width, seed) {
    return Math.sin(t * 7 + seed) * width * 0.35 + Math.sin(t * 17 + seed * 3) * width * 0.12;
}

// A wiggly lava stream on a canvas, from yStart to yEnd, losing `taper` of its width by the end.
// glowOnly draws just the bright parts (for emissive maps). Used down the volcano's sides and as
// rivers on the ground.
function drawLavaStream(ctx, x, yStart, yEnd, width, seed, glowOnly, taper) {
    const steps = 40;
    const layers = glowOnly
        ? [['#ff6a00', 1.0], ['#ffc040', 0.4]]
        : [['rgba(45, 15, 5, 0.9)', 1.35], ['#ff6a10', 1.0], ['#ffd060', 0.45]];
    layers.forEach(([color, scale]) => {
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        for (let i = 0; i < steps; i++) {
            const t0 = i / steps, t1 = (i + 1) / steps;
            const px = t => x + lavaWiggle(t, width, seed);
            const py = t => yStart + (yEnd - yStart) * t;
            ctx.lineWidth = Math.max(1, width * scale * (1 - t0 * taper));
            ctx.beginPath();
            ctx.moveTo(px(t0), py(t0));
            ctx.lineTo(px(t1), py(t1));
            ctx.stroke();
        }
    });
}

// Rounded rectangle path (ctx.roundRect is missing on older tablet browsers)
function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function makeCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return [canvas, canvas.getContext('2d')];
}

// Many simple shapes merged into one mesh, each with its own colour, so a whole landmark costs
// one draw call. Texture coordinates are kept too, for textured merges.
// pieces: [{ geo, color, pos: [x,y,z], rot: [x,y,z], scale: [x,y,z] }], or { geo, color, matrix }
// with a ready-made Matrix4 instead of pos/rot/scale
function mergePieces(pieces) {
    const positions = [], normals = [], colors = [], uvs = [], indices = [];
    const m = new THREE.Matrix4(), nm = new THREE.Matrix3();
    const v = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
    let offset = 0;
    pieces.forEach(p => {
        if (p.matrix) m.copy(p.matrix);
        else m.compose(new THREE.Vector3(...(p.pos || [0, 0, 0])),
                       q.setFromEuler(e.set(...(p.rot || [0, 0, 0]))),
                       new THREE.Vector3(...(p.scale || [1, 1, 1])));
        nm.getNormalMatrix(m);
        col.set(p.color);
        const pos = p.geo.attributes.position, nor = p.geo.attributes.normal, uv = p.geo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i).applyMatrix4(m);
            positions.push(v.x, v.y, v.z);
            v.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
            normals.push(v.x, v.y, v.z);
            colors.push(col.r, col.g, col.b);
            if (uv) uvs.push(uv.getX(i), uv.getY(i)); else uvs.push(0, 0);
        }
        if (p.geo.index) {
            for (let i = 0; i < p.geo.index.count; i++) indices.push(p.geo.index.getX(i) + offset);
        } else {
            for (let i = 0; i < pos.count; i++) indices.push(i + offset);
        }
        offset += pos.count;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
}

// Low-poly material for merged landmarks: colour comes from each piece, faces shaded flat
function vertexColourMaterial() {
    return sceneryCached('vertexColourMat', () => new THREE.MeshStandardMaterial({
        vertexColors: true, flatShading: true, roughness: 0.9, metalness: 0
    }));
}

// A flat strip along a curve through `points` (on the ground), `width` wide. The texture repeats
// every `texLength` units along it, and the strip narrows to nothing over the last `taper` of
// its length, so it fades out instead of stopping. One draw call.
function buildGroundRibbon(points, width, texLength, y, taper) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal'); // centripetal: no loops or overshoot at bends
    const n = Math.max(2, Math.ceil(curve.getLength() / 1.5));
    const pts = curve.getSpacedPoints(n);
    const positions = [], uvs = [], indices = [];
    let dist = 0;
    pts.forEach((p, i) => {
        if (i > 0) dist += p.distanceTo(pts[i - 1]);
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
        const len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
        const tx = (b.x - a.x) / len, tz = (b.z - a.z) / len;
        const half = (width / 2) * Math.min(1, (1 - i / n) / taper);
        positions.push(p.x - tz * half, y, p.z + tx * half, p.x + tz * half, y, p.z - tx * half);
        uvs.push(0, dist / texLength, 1, dist / texLength);
        if (i > 0) {
            const k = (i - 1) * 2;
            indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); // wound to face up
        }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

// Smoke puffs that rise from (x, y, z) in `group`, grow and fade, then start again. Each puff lives
// `life` seconds, rising `rise` and drifting `drift` east (with the embers) while growing from
// `size` by `grow`. Returns update(t, camera) to call every frame, and the materials to free.
function addSmoke(group, { x = 0, y, z = 0, count, life, rise, drift, size, grow, opacity }) {
    const texture = sceneryCached('smokeTex', () => makeRadialTexture(64,
        [[0, 'rgba(255,255,255,0.85)'], [0.5, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]));
    const puffs = [];
    for (let k = 0; k < count; k++) {
        const puff = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture, color: 0x48403c, transparent: true, depthWrite: false, opacity: 0
        }));
        group.add(puff);
        puffs.push(puff);
    }
    const worldPos = new THREE.Vector3();
    return {
        materials: puffs.map(p => p.material),
        update(t, camera) {
            puffs.forEach((puff, k) => {
                const age = (t / life + k / count) % 1;
                puff.position.set(x + age * drift + Math.sin(t * 0.7 + k) * 0.4, y + age * rise, z + Math.cos(t * 0.5 + k) * 0.4);
                puff.scale.setScalar(size + age * grow);
                // Fade puffs close to the camera, so smoke never fills the screen when the camera passes over it
                puff.getWorldPosition(worldPos);
                const nearFade = Math.min(1, Math.max(0, (worldPos.distanceTo(camera.position) - 5) / 8));
                puff.material.opacity = opacity * Math.sin(Math.PI * age) * nearFade;
            });
        }
    };
}

// A winding path from the front (south side) of a biome's first landmark towards the middle of
// the map, as a ground ribbon. Returns the mesh, with keepClear circles along it so obstacles
// don't spawn on it. taper: share of its length over which the end narrows to nothing.
function pathFromLandmark(level, texture, width, taper = 0.25) {
    const l = level.landmarks[0];
    const front = l.halfSize !== undefined ? l.halfSize : l.radius;
    const start = new THREE.Vector3(l.x, 0, l.z + front + 0.5);
    const end = new THREE.Vector3(l.x * 0.3, 0, l.z * 0.25);
    const dx = end.x - start.x, dz = end.z - start.z, len = Math.hypot(dx, dz);
    const side = new THREE.Vector3(-dz / len, 0, dx / len);
    // Out of the door straight ahead, then a gentle S-bend towards the middle
    const points = [start, new THREE.Vector3(start.x, 0, start.z + 3.5)];
    [0.3, 0.55, 0.8, 1].forEach(t => points.push(new THREE.Vector3(start.x + dx * t, 0, start.z + dz * t)
        .addScaledVector(side, Math.sin(t * Math.PI * 2) * 4)));

    const geo = buildGroundRibbon(points, width, width * 2, 0.025, taper);
    const mesh = new THREE.Mesh(geo, makeDecalMaterial(texture, 'lit'));
    mesh.receiveShadow = true;
    mesh.userData.disposables = [geo, mesh.material];
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    mesh.userData.keepClear = curve.getSpacedPoints(Math.ceil(curve.getLength() / 3))
        .map(p => ({ x: p.x, z: p.z, r: width / 2 + 2 }));
    return mesh;
}

// Decals scattered over the arena, kept off landmarks. Picks a random cell of a 2x2 atlas for
// each, so neighbours don't look copy-pasted. angleFn() gives each one's direction.
function scatterDecalQuads(level, count, minSize, maxSize, angleFn) {
    const half = level.WORLD_SIZE / 2 - 4;
    const quads = [];
    for (let tries = 0; quads.length < count && tries < count * 10; tries++) {
        const x = (Math.random() * 2 - 1) * half, z = (Math.random() * 2 - 1) * half;
        const size = minSize + Math.random() * (maxSize - minSize);
        if (Scenery.isBlocked(x, z, size * 0.6)) continue;
        const c = Math.floor(Math.random() * 4);
        quads.push({ x, z, angle: angleFn(), width: size, length: size,
                     uvRect: [(c % 2) * 0.5, c < 2 ? 0.5 : 0, 0.5, 0.5] });
    }
    return quads;
}

// Ground-decal mesh from quads, lit so tree shadows fall across it like the ground
function litDecalMesh(quads, material) {
    const geo = buildGroundDecals(quads, 0.02);
    const mesh = new THREE.Mesh(geo, material);
    mesh.receiveShadow = true;
    mesh.userData.disposables = [geo];
    return mesh;
}

// Landmark and ground-detail models, named in levels.js
const SceneryModels = {
    // Volcano Valley landmark: a smoking volcano with a glowing crater and lava running down its
    // sides into rivers on the ground. 26 units across, 11 high. Its solid radius is in levels.js.
    createVolcanoLandmark() {
        const parts = sceneryCached('volcano', () => {
            // Side profile (radius, height): from the foot, up over the crater rim, down inside to the lava
            const profile = [[13, 0], [11.5, 0.8], [9.8, 2.2], [8.0, 4.3], [6.4, 6.6], [5.2, 8.7],
                             [4.4, 10.3], [4.0, 11.0], [3.4, 11.3], [2.9, 10.6], [2.7, 10.0]];
            const FOOT_RADIUS = 13;
            const RIM_V = 7 / (profile.length - 1); // texture v at the outer edge of the rim
            // Lava streaks down the sides. u = position around the volcano (0 faces south, towards
            // the camera), len = how far down they reach, w = width in texture px,
            // river = length of the river each full-length streak feeds on the ground
            const streaks = [
                { u: 0.04, len: 1, w: 14, river: 9 }, { u: 0.14, len: 1, w: 16, river: 13 },
                { u: 0.30, len: 1, w: 12, river: 8 }, { u: 0.86, len: 1, w: 14, river: 10 },
                { u: 0.22, len: 0.45, w: 8 }, { u: 0.52, len: 0.7, w: 10 }, { u: 0.66, len: 0.5, w: 8 },
                { u: 0.95, len: 0.35, w: 7 }, { u: 0.76, len: 0.6, w: 9 }
            ];

            // Colour texture (map) and glow texture (emissiveMap). Canvas top = inside the crater.
            const W = 512, H = 256;
            const rimY = (1 - RIM_V) * H;
            const map = document.createElement('canvas');
            map.width = W; map.height = H;
            const mc = map.getContext('2d');
            const rock = mc.createLinearGradient(0, 0, 0, H);
            rock.addColorStop(0, '#5a1e08');    // crater wall, lit by the lava
            rock.addColorStop(0.2, '#2a2220');  // rim
            rock.addColorStop(0.32, '#605650'); // ash-grey upper slopes
            rock.addColorStop(0.65, '#40322b');
            rock.addColorStop(1, '#2c1d15');    // dark foot, close to the ground colour
            mc.fillStyle = rock;
            mc.fillRect(0, 0, W, H);
            for (let i = 0; i < 1800; i++) {
                const v = Math.random() < 0.5 ? 0 : 255;
                mc.fillStyle = `rgba(${v}, ${v}, ${v}, ${Math.random() * 0.08})`;
                mc.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 4, 2 + Math.random() * 3);
            }

            const glow = document.createElement('canvas');
            glow.width = W; glow.height = H;
            const gc = glow.getContext('2d');
            gc.fillStyle = '#000';
            gc.fillRect(0, 0, W, H);
            const craterGlow = gc.createLinearGradient(0, 0, 0, 0.22 * H);
            craterGlow.addColorStop(0, '#ff7a1a');
            craterGlow.addColorStop(0.6, '#5a1400');
            craterGlow.addColorStop(1, '#000');
            gc.fillStyle = craterGlow;
            gc.fillRect(0, 0, W, 0.22 * H);

            streaks.forEach((s, i) => {
                const yEnd = (1 - RIM_V * (1 - s.len)) * H;
                const taper = s.river ? 0 : 0.6; // streaks that feed a river keep their width
                drawLavaStream(mc, s.u * W, rimY - 6, yEnd, s.w, i * 1.7, false, taper);
                drawLavaStream(gc, s.u * W, rimY - 6, yEnd, s.w, i * 1.7, true, taper);
            });

            const coneGeo = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 18);
            const pos = coneGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
                // Lumpy sides. Based only on position, so the seam where the lathe closes stays shut.
                const n = Math.sin(x * 0.73 + z * 0.21 + y * 0.3) * Math.cos(z * 0.67 - x * 0.29 + y * 0.5);
                pos.setX(i, x * (1 + n * 0.07));
                pos.setZ(i, z * (1 + n * 0.07));
                if (y > 10.9) pos.setY(i, y + n * 0.35); // ragged rim
            }
            coneGeo.computeVertexNormals();
            const coneMat = new THREE.MeshStandardMaterial({
                map: new THREE.CanvasTexture(map),
                emissiveMap: new THREE.CanvasTexture(glow),
                emissive: 0xffffff,
                roughness: 0.95,
                metalness: 0,
                flatShading: true
            });

            // Rivers: one ground quad per full-length streak, starting under the foot so the join is hidden
            const river = document.createElement('canvas');
            river.width = 64; river.height = 256;
            const rc = river.getContext('2d');
            drawLavaStream(rc, 32, 256, 12, 22, 0, false, 0.5);
            rc.globalCompositeOperation = 'destination-in'; // cool and fade out at the far end
            const fade = rc.createLinearGradient(0, 256, 0, 0);
            fade.addColorStop(0, 'rgba(0,0,0,1)');
            fade.addColorStop(0.55, 'rgba(0,0,0,1)');
            fade.addColorStop(1, 'rgba(0,0,0,0)');
            rc.fillStyle = fade;
            rc.fillRect(0, 0, 64, 256);
            const LAVA_SHARE = 22 / 64; // how much of the river texture's width is lava
            const riverQuads = streaks.filter(s => s.river).map(s => {
                const seed = streaks.indexOf(s) * 1.7;
                const u = s.u + lavaWiggle(1, s.w, seed) / W; // where the streak actually meets the ground
                const lavaWidth = (s.w / W) * Math.PI * 2 * FOOT_RADIUS;
                return { x: 0, z: 0, angle: u * Math.PI * 2, width: lavaWidth / LAVA_SHARE, length: s.river + 1.5, start: FOOT_RADIUS - 1.5 };
            });

            return {
                coneGeo, coneMat,
                poolGeo: new THREE.CircleGeometry(2.8, 18),
                poolMat: new THREE.MeshBasicMaterial({ color: 0xff6a10 }),
                glowMat: new THREE.SpriteMaterial({
                    map: makeRadialTexture(64, [[0, 'rgba(255,170,60,0.9)'], [0.4, 'rgba(255,90,10,0.4)'], [1, 'rgba(255,60,0,0)']]),
                    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
                }),
                riverGeo: buildGroundDecals(riverQuads, 0.03),
                riverMat: makeDecalMaterial(new THREE.CanvasTexture(river))
            };
        });

        const group = new THREE.Group();

        const cone = new THREE.Mesh(parts.coneGeo, parts.coneMat);
        cone.castShadow = true;
        group.add(cone);

        const pool = new THREE.Mesh(parts.poolGeo, parts.poolMat);
        pool.rotation.x = -Math.PI / 2;
        pool.position.y = 10.15;
        group.add(pool);

        const glow = new THREE.Sprite(parts.glowMat);
        glow.position.y = 12;
        glow.scale.setScalar(10);
        group.add(glow);

        group.add(new THREE.Mesh(parts.riverGeo, parts.riverMat));

        const smoke = addSmoke(group, { y: 11.5, count: 6, life: 6, rise: 9, drift: 3, size: 2.5, grow: 6, opacity: 0.5 });

        const poolCool = new THREE.Color(0xff4a00), poolHot = new THREE.Color(0xffb030);
        group.userData.update = (deltaTime, t, camera) => {
            const pulse = 0.5 + 0.5 * Math.sin(t * 2.1);
            parts.poolMat.color.copy(poolCool).lerp(poolHot, Math.max(0, pulse * 0.7 + 0.15 * Math.sin(t * 7.3)));
            parts.glowMat.opacity = 0.55 + 0.3 * pulse;
            parts.coneMat.emissiveIntensity = 0.8 + 0.2 * Math.sin(t * 1.7);
            // Above 1 pushes the orange towards yellow-hot, so the lava glows rather than dims
            parts.riverMat.color.setScalar(1.15 + 0.15 * Math.sin(t * 1.7));
            smoke.update(t, camera);
        };
        group.userData.disposables = smoke.materials;
        return group;
    },

    // Volcano Valley ground detail: glowing lava cracks scattered over the arena (walk-through)
    createLavaCracks(level, solids) {
        const mat = sceneryCached('lavaCracks', () => {
            // 2x2 atlas of different cracks, so neighbouring cracks don't look copy-pasted
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 256;
            const ctx = canvas.getContext('2d');
            for (let c = 0; c < 4; c++) drawLavaCrack(ctx, (c % 2) * 128 + 64, Math.floor(c / 2) * 128 + 64, 48);
            return makeDecalMaterial(new THREE.CanvasTexture(canvas));
        });

        const quads = scatterDecalQuads(level, 22, 5, 10, () => Math.random() * Math.PI * 2);
        const geo = buildGroundDecals(quads, 0.02);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData.update = (deltaTime, t) => mat.color.setScalar(1.15 + 0.15 * Math.sin(t * 1.3));
        mesh.userData.disposables = [geo];
        return mesh;
    },

    // Volcano Valley second landmark: a bubbling lava pool ringed by dark rocks, with a little
    // smoking vent at the back. 12 units across. Solid radius in levels.js.
    createLavaPool() {
        const VENT = { x: 1.0, z: -4.3 };
        const parts = sceneryCached('lavaPool', () => {
            // Molten lava with dark crust floating on it. It tiles, so update() can scroll it slowly.
            const S = 128;
            const [canvas, ctx] = makeCanvas(S, S);
            ctx.fillStyle = '#ff6a12';
            ctx.fillRect(0, 0, S, S);
            const tiled = draw => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) draw(dx, dy); };
            for (let i = 0; i < 50; i++) { // hot yellow spots
                const x = Math.random() * S, y = Math.random() * S, r = 2 + Math.random() * 5;
                tiled((dx, dy) => {
                    ctx.fillStyle = 'rgba(255, 215, 90, 0.55)';
                    ctx.beginPath();
                    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
            for (let i = 0; i < 12; i++) { // crust plates
                const x = Math.random() * S, y = Math.random() * S, r = 7 + Math.random() * 9;
                const sides = 6 + Math.floor(Math.random() * 3);
                const pts = [];
                for (let k = 0; k < sides; k++) {
                    const a = (k / sides) * Math.PI * 2, rr = r * (0.7 + Math.random() * 0.4);
                    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
                }
                tiled((dx, dy) => {
                    ctx.beginPath();
                    pts.forEach(([px, py], k) => k ? ctx.lineTo(x + dx + px, y + dy + py) : ctx.moveTo(x + dx + px, y + dy + py));
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(70, 22, 8, 0.85)';
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255, 120, 20, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                });
            }
            const lavaTex = new THREE.CanvasTexture(canvas);
            lavaTex.wrapS = lavaTex.wrapT = THREE.RepeatWrapping;
            lavaTex.repeat.set(2, 2);
            const poolGeo = new THREE.CircleGeometry(4.2, 24);
            poolGeo.rotateX(-Math.PI / 2);
            poolGeo.translate(0, 0.12, 0);

            // Ring of rocks (with a gap where the vent stands) and the vent: an open-topped rocky cone
            const LUMP = new THREE.DodecahedronGeometry(1, 0);
            const ROCKS = ['#3a2a22', '#2e211b', '#47342a'];
            const ventAngle = Math.atan2(VENT.x, VENT.z);
            const pieces = [];
            for (let k = 0; k < 18; k++) {
                const a = (k / 18) * Math.PI * 2;
                if (Math.abs(Math.atan2(Math.sin(a - ventAngle), Math.cos(a - ventAngle))) < 0.4) continue;
                const s = 0.8 + ((k * 7) % 5) / 10;
                pieces.push({ geo: LUMP, color: ROCKS[k % 3], scale: [s, s * 0.7, s], pos: [Math.sin(a) * 4.7, s * 0.3, Math.cos(a) * 4.7], rot: [k, k * 1.3, 0] });
            }
            pieces.push({ geo: new THREE.CylinderGeometry(0.7, 1.7, 3.4, 9, 1, true), color: '#3b2b23', pos: [VENT.x, 1.7, VENT.z] });
            const ventGlowGeo = new THREE.CircleGeometry(0.76, 10);
            ventGlowGeo.rotateX(-Math.PI / 2);
            ventGlowGeo.translate(VENT.x, 3.15, VENT.z); // just inside the top of the vent

            return {
                lavaTex, poolGeo, ventGlowGeo,
                poolMat: new THREE.MeshBasicMaterial({ map: lavaTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
                rimGeo: mergePieces(pieces),
                ventGlowMat: new THREE.MeshBasicMaterial({ color: 0xffa030 }),
                glowMat: new THREE.SpriteMaterial({
                    map: makeRadialTexture(64, [[0, 'rgba(255,170,60,0.9)'], [0.4, 'rgba(255,90,10,0.4)'], [1, 'rgba(255,60,0,0)']]),
                    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
                }),
                // Bubbles are half-spheres that swell on the surface then pop
                bubbleGeo: new THREE.SphereGeometry(0.45, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
                bubbleMat: new THREE.MeshBasicMaterial({ color: 0xffb030 })
            };
        });

        const group = new THREE.Group();
        group.add(new THREE.Mesh(parts.poolGeo, parts.poolMat));
        const rim = new THREE.Mesh(parts.rimGeo, vertexColourMaterial());
        rim.castShadow = true;
        group.add(rim);
        group.add(new THREE.Mesh(parts.ventGlowGeo, parts.ventGlowMat));
        const glow = new THREE.Sprite(parts.glowMat);
        glow.position.y = 1.2;
        glow.scale.setScalar(9);
        group.add(glow);

        const BUBBLES = 4;
        const bubbles = new THREE.InstancedMesh(parts.bubbleGeo, parts.bubbleMat, BUBBLES); // one draw call for all
        bubbles.frustumCulled = false; // its bounds don't include where the bubbles have moved to
        group.add(bubbles);
        const bubbleState = Array.from({ length: BUBBLES }, () => ({ x: 0, z: 0, cycle: -1, speed: 0.45 + Math.random() * 0.3, offset: Math.random() }));
        const dummy = new THREE.Object3D();

        const smoke = addSmoke(group, { x: VENT.x, y: 3.6, z: VENT.z, count: 4, life: 4, rise: 5, drift: 1.5, size: 1.2, grow: 3, opacity: 0.45 });

        group.userData.update = (deltaTime, t, camera) => {
            parts.lavaTex.offset.set(t * 0.03, t * 0.017); // slow flow
            parts.poolMat.color.setScalar(1.05 + 0.15 * Math.sin(t * 2.3));
            parts.glowMat.opacity = 0.45 + 0.2 * Math.sin(t * 2.3);
            bubbleState.forEach((b, i) => {
                const phase = t * b.speed + b.offset;
                const cycle = Math.floor(phase);
                if (cycle !== b.cycle) { // popped: the next one swells somewhere else
                    b.cycle = cycle;
                    const a = Math.random() * Math.PI * 2, d = Math.random() * 3.2;
                    b.x = Math.sin(a) * d;
                    b.z = Math.cos(a) * d;
                }
                const swell = phase - cycle;
                dummy.position.set(b.x, 0.1, b.z);
                dummy.scale.setScalar(swell < 0.85 ? Math.max(0.001, swell / 0.85) : 0.001);
                dummy.updateMatrix();
                bubbles.setMatrixAt(i, dummy.matrix);
            });
            bubbles.instanceMatrix.needsUpdate = true;
            smoke.update(t, camera);
        };
        group.userData.disposables = [...smoke.materials, bubbles];
        return group;
    },

    // Sunny Meadow landmark: a windmill with turning sails, door facing south. 9.4 units across,
    // about 18 high with the sails up. Solid radius in levels.js.
    createWindmill() {
        const parts = sceneryCached('windmill', () => {
            const F = Math.PI / 8; // turns the 8-sided shapes so a flat side faces the camera (south)
            const BASE_H = 1.2, TOWER_H = 9.5, TOP = BASE_H + TOWER_H;
            const body = mergePieces([
                { geo: new THREE.CylinderGeometry(4.5, 4.7, BASE_H, 8), color: '#9a9286', pos: [0, BASE_H / 2, 0], rot: [0, F, 0] },
                { geo: new THREE.CylinderGeometry(3.0, 4.1, TOWER_H, 8), color: '#f3ead8', pos: [0, BASE_H + TOWER_H / 2, 0], rot: [0, F, 0] },
                { geo: new THREE.CylinderGeometry(3.3, 3.3, 0.5, 8), color: '#7a5634', pos: [0, TOP + 0.25, 0], rot: [0, F, 0] },
                { geo: new THREE.ConeGeometry(3.8, 3.8, 8), color: '#b8452e', pos: [0, TOP + 0.5 + 1.9, 0], rot: [0, F, 0] },
                { geo: new THREE.SphereGeometry(0.45, 8, 6), color: '#e8c04a', pos: [0, TOP + 4.6, 0] },
                // door and windows
                { geo: new THREE.BoxGeometry(1.7, 2.6, 0.4), color: '#5b3b22', pos: [0, BASE_H + 1.3, 3.62] },
                { geo: new THREE.BoxGeometry(1.0, 1.3, 0.4), color: '#3d5f80', pos: [0, 6.3, 3.25] },
                { geo: new THREE.BoxGeometry(0.4, 1.3, 1.0), color: '#3d5f80', pos: [3.15, 7.4, 0] },
                { geo: new THREE.BoxGeometry(0.4, 1.3, 1.0), color: '#3d5f80', pos: [-3.15, 7.4, 0] },
                // axle sticking out of the front, which the sails turn on
                { geo: new THREE.CylinderGeometry(0.55, 0.55, 1.6, 8), color: '#6b4a2b', pos: [0, 10.2, 3.4], rot: [Math.PI / 2, 0, 0] }
            ]);

            // Four sails, each a spar with a cloth panel and lattice bars, built pointing up then turned
            const sailPieces = [{ geo: new THREE.CylinderGeometry(0.6, 0.6, 0.4, 8), color: '#5b3b22', pos: [0, 0, 0.25], rot: [Math.PI / 2, 0, 0] }];
            const blade = [
                { geo: new THREE.BoxGeometry(0.3, 7.8, 0.3), color: '#6b4a2b', x: 0, y: 3.9, z: 0 },
                { geo: new THREE.BoxGeometry(1.9, 6.0, 0.08), color: '#f6f0e1', x: 1.15, y: 4.6, z: 0.12 },
                { geo: new THREE.BoxGeometry(0.12, 6.0, 0.16), color: '#6b4a2b', x: 2.1, y: 4.6, z: 0.18 }
            ];
            for (let j = 0; j < 5; j++) blade.push({ geo: new THREE.BoxGeometry(2.2, 0.12, 0.16), color: '#6b4a2b', x: 1.0, y: 1.8 + j * 1.45, z: 0.18 });
            for (let k = 0; k < 4; k++) {
                const a = k * Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
                blade.forEach(p => sailPieces.push({ geo: p.geo, color: p.color, pos: [p.x * c - p.y * s, p.x * s + p.y * c, p.z], rot: [0, 0, a] }));
            }
            return { body, sails: mergePieces(sailPieces) };
        });

        const group = new THREE.Group();
        const body = new THREE.Mesh(parts.body, vertexColourMaterial());
        body.castShadow = true;
        group.add(body);

        const sails = new THREE.Mesh(parts.sails, vertexColourMaterial());
        sails.position.set(0, 10.2, 4.3);
        sails.castShadow = true;
        group.add(sails);

        group.userData.update = (deltaTime, t) => { sails.rotation.z = -t * 0.7; };
        return group;
    },

    // Sunny Meadow ground detail: a dirt path from the windmill door towards the middle
    createMeadowPath(level, solids) {
        const texture = sceneryCached('dirtPathTex', () => {
            const W = 128, H = 256;
            const [canvas, ctx] = makeCanvas(W, H);
            const img = ctx.createImageData(W, H);
            for (let y = 0; y < H; y++) {
                // Soft, slightly wobbly edges. The wobble repeats every 256px so the texture tiles.
                const wobble = Math.sin(y / H * Math.PI * 6) * 0.04 + Math.sin(y / H * Math.PI * 10 + 1) * 0.03;
                for (let x = 0; x < W; x++) {
                    const edge = Math.min(x, W - 1 - x) / (W - 1); // 0 at the sides, 0.5 in the middle
                    const alpha = Math.min(1, Math.max(0, (edge - 0.06 - wobble) / 0.16));
                    const n = Math.floor(Math.random() * 18);
                    const i = (y * W + x) * 4;
                    img.data[i] = 168 + n; img.data[i + 1] = 130 + n; img.data[i + 2] = 80 + n;
                    img.data[i + 3] = alpha * 240;
                }
            }
            ctx.putImageData(img, 0, 0);
            ctx.globalCompositeOperation = 'source-atop'; // pebbles only where there's path
            for (let i = 0; i < 140; i++) {
                const x = Math.random() * W, y = Math.random() * H, r = 1 + Math.random() * 2.5;
                ctx.fillStyle = Math.random() < 0.5 ? 'rgba(225, 205, 160, 0.7)' : 'rgba(120, 90, 50, 0.5)';
                for (const dy of [-H, 0, H]) { // drawn three times so pebbles wrap across the tiling seam
                    ctx.beginPath();
                    ctx.ellipse(x, y + dy, r * 1.4, r, Math.random() * Math.PI, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        });
        return pathFromLandmark(level, texture, 3.2);
    },

    // Sunny Meadow second landmark: a ring of standing stones round a little cairn, with
    // wildflowers. Sheepy can wander in between the stones: each stone and the cairn is solid
    // on its own (userData.colliders), not the whole ring. 17 units across.
    createStoneCircle() {
        const parts = sceneryCached('stoneCircle', () => {
            const B = new THREE.BoxGeometry(1, 1, 1);
            const LUMP = new THREE.DodecahedronGeometry(1, 0);
            const GREYS = ['#9a9a92', '#8c8d86', '#a5a49b', '#93948a'];
            const RING = 7, N = 10;
            const pieces = [], colliders = [];
            const stoneAt = i => {
                const a = (i / N) * Math.PI * 2 + 0.15;
                return { a, x: Math.sin(a) * RING, z: Math.cos(a) * RING };
            };
            for (let i = 0; i < N; i++) {
                if (i === 4) continue; // one stone is missing
                const { a, x, z } = stoneAt(i);
                if (i === 7) { // one has fallen over, lying outwards
                    const mid = RING + 1.2;
                    pieces.push({ geo: B, color: GREYS[1], scale: [1.4, 0.9, 3.4], pos: [Math.sin(a) * mid, 0.4, Math.cos(a) * mid], rot: [0, a, 0] });
                    colliders.push({ x: Math.sin(a) * (mid - 0.9), z: Math.cos(a) * (mid - 0.9), radius: 0.8 });
                    colliders.push({ x: Math.sin(a) * (mid + 0.9), z: Math.cos(a) * (mid + 0.9), radius: 0.8 });
                    continue;
                }
                // Stones 0 and 1 stand level, to carry a lintel; the rest lean a little
                const h = i <= 1 ? 3.6 : 2.8 + ((i * 37) % 10) / 10 * 1.4;
                const lean = i <= 1 ? 0 : (((i * 53) % 10) / 10 - 0.5) * 0.16;
                pieces.push({ geo: B, color: GREYS[i % GREYS.length], scale: [1.4, h, 0.9], pos: [x, h / 2 - 0.2, z], rot: [lean, a, 0] });
                colliders.push({ x, z, radius: 0.9 });
            }
            // Lintel across stones 0 and 1
            const s0 = stoneAt(0), s1 = stoneAt(1);
            pieces.push({ geo: B, color: GREYS[2], scale: [5.4, 0.7, 1.0],
                          pos: [(s0.x + s1.x) / 2, 3.4 + 0.35, (s0.z + s1.z) / 2], rot: [0, Math.atan2(-(s1.z - s0.z), s1.x - s0.x), 0] });
            // Cairn: a little pile of stones in the middle
            [[0, 0.5, 0, 1.2], [1.0, 0.45, 0.6, 0.9], [-0.9, 0.45, 0.7, 0.85], [0.2, 0.45, -1.1, 0.95],
             [-0.6, 1.3, -0.2, 0.8], [0.5, 1.35, 0.3, 0.75], [0, 2.0, 0.1, 0.6], [0.05, 2.55, 0, 0.42]].forEach(([x, y, z, s], k) => {
                pieces.push({ geo: LUMP, color: k % 2 ? '#8a857a' : '#a09a8c', scale: [s, s * 0.75, s], pos: [x, y, z], rot: [k, k * 2, 0] });
            });
            colliders.push({ x: 0, z: 0, radius: 1.8 });
            // Wildflowers round the stones
            const FLOWERS = ['#ff7eb6', '#ffe14d', '#ffffff', '#c58cff'];
            for (let k = 0; k < 18; k++) {
                const a = k * 2.4, d = 3.2 + (k % 3) * 2.4;
                pieces.push({ geo: LUMP, color: FLOWERS[k % FLOWERS.length], scale: [0.28, 0.2, 0.28], pos: [Math.sin(a) * d, 0.15, Math.cos(a) * d] });
            }
            return { geo: mergePieces(pieces), colliders };
        });

        const group = new THREE.Group();
        const mesh = new THREE.Mesh(parts.geo, vertexColourMaterial());
        mesh.castShadow = true;
        group.add(mesh);
        group.userData.colliders = parts.colliders;
        group.userData.keepClear = [{ x: 0, z: 0, r: 9 }]; // no trees inside the ring
        return group;
    },

    // Dusty Desert landmark: a sandstone pyramid with a gold capstone and a doorway facing south.
    // 22 units across, 14 high; levels.js adds a smaller one on a side edge.
    createPyramid() {
        const parts = sceneryCached('pyramid', () => {
            const HALF = 11, H = 14, CAP = 0.14; // the top 14% is the gold capstone

            // Courses of sandstone blocks, each block a slightly different shade
            const [canvas, ctx] = makeCanvas(512, 256);
            ctx.fillStyle = '#9c7440'; // mortar
            ctx.fillRect(0, 0, 512, 256);
            const ROWS = 16, BLOCKS = 32, rowH = 256 / ROWS, bw = 512 / BLOCKS;
            for (let r = 0; r < ROWS; r++) {
                const off = (r % 2) * bw / 2;
                for (let b = -1; b < BLOCKS; b++) {
                    const tint = Math.floor(Math.random() * 26) - 13;
                    ctx.fillStyle = `rgb(${214 + tint}, ${169 + tint}, ${94 + tint})`;
                    ctx.fillRect(b * bw + off + 1, r * rowH + 1, bw - 2, rowH - 2);
                }
            }
            for (let i = 0; i < 500; i++) {
                ctx.fillStyle = Math.random() < 0.5 ? 'rgba(90, 60, 25, 0.25)' : 'rgba(255, 240, 200, 0.25)';
                ctx.fillRect(Math.random() * 512, Math.random() * 256, 2, 2);
            }

            // 4-sided cone turned 45 degrees so its faces line up with the square collision footprint
            const bodyGeo = new THREE.ConeGeometry(HALF * Math.SQRT2, H, 4, 8, true);
            bodyGeo.rotateY(Math.PI / 4);
            bodyGeo.translate(0, H / 2, 0);

            const capH = H * CAP * 1.03;
            const capGeo = new THREE.ConeGeometry(HALF * Math.SQRT2 * CAP * 1.03, capH, 4);
            capGeo.rotateY(Math.PI / 4);
            capGeo.translate(0, H * (1 - CAP) - 0.02 + capH / 2, 0);

            // Doorway: a dark slab lying flat against the south face, which leans back
            const lean = Math.atan(HALF / H);
            const doorY = 1.9;
            const doorGeo = new THREE.BoxGeometry(2.2, 3.0, 0.3);
            doorGeo.rotateX(-lean);
            doorGeo.translate(0, doorY, HALF * (1 - doorY / H) + 0.05);

            return {
                bodyGeo, capGeo, doorGeo,
                bodyMat: new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), flatShading: true, roughness: 0.95 }),
                capMat: new THREE.MeshStandardMaterial({ color: 0xffcf4a, metalness: 0.5, roughness: 0.3, emissive: 0x5a3c00, flatShading: true }),
                doorMat: new THREE.MeshStandardMaterial({ color: 0x2b1c0e, roughness: 1 })
            };
        });

        const group = new THREE.Group();
        [[parts.bodyGeo, parts.bodyMat], [parts.capGeo, parts.capMat], [parts.doorGeo, parts.doorMat]].forEach(([geo, mat]) => {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            group.add(mesh);
        });
        return group;
    },

    // Dusty Desert ground detail: patches of wind ripples in the sand
    createSandRipples(level, solids) {
        const mat = sceneryCached('sandRipples', () => {
            const [canvas, ctx] = makeCanvas(256, 256);
            for (let c = 0; c < 4; c++) {
                const cx = (c % 2) * 128, cy = Math.floor(c / 2) * 128;
                ctx.save();
                ctx.beginPath();
                ctx.rect(cx, cy, 128, 128);
                ctx.clip();
                const phase = Math.random() * 10;
                for (let y = cy + 10; y < cy + 122; y += 15) {
                    [[0, 'rgba(160, 115, 55, 0.55)', 3.5], [3.5, 'rgba(255, 250, 230, 0.65)', 2]].forEach(([dy, color, width]) => {
                        ctx.beginPath();
                        for (let x = cx; x <= cx + 128; x += 4) {
                            const yy = y + dy + Math.sin((x - cx) * 0.05 + phase + y * 0.3) * 4.5;
                            if (x === cx) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
                        }
                        ctx.strokeStyle = color;
                        ctx.lineWidth = width;
                        ctx.stroke();
                    });
                }
                // Fade out towards the edges of the patch
                ctx.globalCompositeOperation = 'destination-in';
                const g = ctx.createRadialGradient(cx + 64, cy + 64, 20, cx + 64, cy + 64, 62);
                g.addColorStop(0, 'rgba(0, 0, 0, 1)');
                g.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = g;
                ctx.fillRect(cx, cy, 128, 128);
                ctx.restore();
            }
            return makeDecalMaterial(new THREE.CanvasTexture(canvas), 'lit');
        });
        // Ripple lines run roughly across the screen: from this camera that reads as dunes, where
        // lines running up the screen looked like scratch marks
        const quads = scatterDecalQuads(level, 16, 12, 22, () => (Math.random() - 0.5) * 0.6);
        return litDecalMesh(quads, mat);
    },

    // Snowy Peaks landmark: an igloo of ice blocks with an entrance tunnel facing south.
    // 14.5 units across; levels.js adds a smaller one.
    createIgloo() {
        const parts = sceneryCached('igloo', () => {
            const R = 6;
            // Rows of ice blocks; canvas top = top of the dome. Fewer blocks per row higher up,
            // where the dome is narrower, so the blocks stay about the same size.
            const [canvas, ctx] = makeCanvas(512, 128);
            ctx.fillStyle = '#a9c8e4'; // joints
            ctx.fillRect(0, 0, 512, 128);
            const ROWS = 6, rowH = 128 / ROWS;
            for (let r = 0; r < ROWS; r++) {
                const latitude = (1 - (r + 0.5) / ROWS) * Math.PI / 2;
                const n = Math.max(4, Math.round(24 * Math.cos(latitude)));
                const bw = 512 / n, off = (r % 2) * bw / 2;
                for (let b = -1; b < n; b++) {
                    const shade = 236 + Math.floor(Math.random() * 16);
                    ctx.fillStyle = `rgb(${shade - 8}, ${shade}, 255)`;
                    ctx.fillRect(b * bw + off + 2, r * rowH + 2, bw - 4, rowH - 4);
                }
            }

            // Dome, shifted back so dome + tunnel are centred on the collision circle
            const dome = new THREE.SphereGeometry(R, 20, 7, 0, Math.PI * 2, 0, Math.PI / 2);
            dome.translate(0, 0, -1.25);
            // Half-tube tunnel along +z, its open end at z = 7.25
            const tunnel = new THREE.CylinderGeometry(2.1, 2.1, 4.3, 10, 1, true, Math.PI / 2, Math.PI);
            tunnel.rotateX(Math.PI / 2);
            tunnel.translate(0, 0, 5.1);

            const doorway = new THREE.CircleGeometry(1.75, 12, 0, Math.PI);
            doorway.translate(0, 0, 6.4);

            return {
                bodyGeo: mergePieces([{ geo: dome, color: '#ffffff' }, { geo: tunnel, color: '#ffffff' }]),
                // Double-sided so the inside of the tunnel shows
                bodyMat: new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), flatShading: true, roughness: 0.5, side: THREE.DoubleSide }),
                doorGeo: doorway,
                doorMat: new THREE.MeshBasicMaterial({ color: 0x1d3347 })
            };
        });

        const group = new THREE.Group();
        const body = new THREE.Mesh(parts.bodyGeo, parts.bodyMat);
        body.castShadow = true;
        group.add(body);
        group.add(new THREE.Mesh(parts.doorGeo, parts.doorMat));
        return group;
    },

    // Snowy Peaks ground detail: shiny frozen puddles
    createIcePatches(level, solids) {
        const mat = sceneryCached('icePatches', () => {
            const [canvas, ctx] = makeCanvas(256, 256);
            for (let c = 0; c < 4; c++) {
                const cx = (c % 2) * 128 + 64, cy = Math.floor(c / 2) * 128 + 64;
                ctx.save();
                ctx.beginPath();
                ctx.rect(cx - 64, cy - 64, 128, 128);
                ctx.clip();
                // An irregular puddle made of overlapping circles
                ctx.fillStyle = '#86bdea';
                for (let k = 0; k < 6; k++) {
                    ctx.beginPath();
                    ctx.arc(cx + (Math.random() - 0.5) * 44, cy + (Math.random() - 0.5) * 44, 22 + Math.random() * 18, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalCompositeOperation = 'source-atop'; // the rest only paints on the ice
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 58);
                g.addColorStop(0, 'rgba(205, 235, 255, 0.75)');
                g.addColorStop(1, 'rgba(120, 180, 235, 0)');
                ctx.fillStyle = g;
                ctx.fillRect(cx - 64, cy - 64, 128, 128);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.lineCap = 'round';
                for (let k = 0; k < 3; k++) { // shine streaks
                    const x = cx - 25 + Math.random() * 40, y = cy - 10 + Math.random() * 30;
                    ctx.lineWidth = 2 + Math.random() * 4;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + 16, y - 16);
                    ctx.stroke();
                }
                ctx.restore();
            }
            // Slightly see-through, so the snow shows faintly under the ice
            ctx.globalCompositeOperation = 'destination-in';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, 0, 256, 256);
            return makeDecalMaterial(new THREE.CanvasTexture(canvas), 'shiny');
        });
        const quads = scatterDecalQuads(level, 12, 5, 10, () => Math.random() * Math.PI * 2);
        return litDecalMesh(quads, mat);
    },

    // Jungle Jumble landmark: an overgrown stepped temple, stairs facing south, with a shrine on
    // top, mossy ledges, hanging vines and broken pillars. 20 units across (22 with the stairs),
    // 13.5 high. Square collision footprint in levels.js.
    createJungleRuins() {
        const geo = sceneryCached('jungleRuins', () => {
            const B = new THREE.BoxGeometry(1, 1, 1);
            const PILLAR = new THREE.CylinderGeometry(1, 1, 1, 8);
            const LUMP = new THREE.DodecahedronGeometry(1, 0);
            const STONE_A = '#8b907c', STONE_B = '#7b8270', STONE_C = '#969a86', STONE_DARK = '#5e6455';
            const MOSS = '#56802f', MOSS_2 = '#4a7228', VINE = '#2f6a24', LEAF = '#3f8a2c', DOOR = '#14180f';
            const box = (color, sx, sy, sz, x, y, z, rot) => ({ geo: B, color, scale: [sx, sy, sz], pos: [x, y, z], rot });
            const pieces = [
                // Three terraces, each with a mossy top
                box(STONE_A, 20, 3, 20, 0, 1.5, 0), box(MOSS, 19.4, 0.3, 19.4, 0, 3.1, 0),
                box(STONE_B, 15, 3, 15, 0, 4.5, 0), box(MOSS_2, 14.4, 0.3, 14.4, 0, 6.1, 0),
                box(STONE_A, 10, 3, 10, 0, 7.5, 0), box(MOSS, 9.4, 0.3, 9.4, 0, 9.1, 0),
                // Shrine on top, with its dark doorway facing the stairs
                box(STONE_C, 6, 3.4, 6, 0, 10.7, -0.5), box(STONE_DARK, 7, 0.7, 7, 0, 12.75, -0.5),
                box(DOOR, 1.8, 2.4, 0.2, 0, 10.2, 2.55),
                // Side walls of the staircase
                box(STONE_DARK, 0.8, 11.4, 0.9, -2.5, 4.5, 8.5, [-0.66, 0, 0]),
                box(STONE_DARK, 0.8, 11.4, 0.9, 2.5, 4.5, 8.5, [-0.66, 0, 0])
            ];
            // Staircase up the south face: 9 steps from the ground (z = 12) to the top terrace (z = 5)
            for (let k = 0; k < 9; k++) {
                const h = k + 1, depth = 7 / 9;
                pieces.push(box(STONE_C, 4.2, h, depth, 0, h / 2, 12 - depth * (k + 0.5)));
            }
            // Pillars on the first terrace: two standing, one broken short, one fallen over
            [[-8.7, 8.7, 4.5], [8.7, 8.7, 2.2], [-8.7, -8.7, 3.4]].forEach(([x, z, h]) => {
                pieces.push({ geo: PILLAR, color: STONE_C, scale: [0.8, h, 0.8], pos: [x, 3 + h / 2, z] });
            });
            pieces.push(box(STONE_C, 2, 0.5, 2, -8.7, 7.75, 8.7));
            pieces.push({ geo: PILLAR, color: STONE_C, scale: [0.8, 3.2, 0.8], pos: [7.2, 3.8, -8.8], rot: [0, 0.3, Math.PI / 2] });
            // Rubble and bushes on the ledges
            [[5, 3.5, 9, 0.7], [-6, 6.5, 6.6, 0.8], [9.2, 3.4, -3, 0.6], [-9.2, 3.4, 2, 0.75], [3.6, 6.4, 6.8, 0.5]].forEach(([x, y, z, s]) => {
                pieces.push({ geo: LUMP, color: STONE_B, scale: [s, s * 0.8, s], pos: [x, y, z], rot: [x, z, 0] });
            });
            [[-9, 3.7, -5], [6, 6.7, -6.2], [4, 9.6, 3.6], [-8.8, 3.7, 5.5], [8.6, 3.6, 4]].forEach(([x, y, z]) => {
                pieces.push({ geo: LUMP, color: LEAF, scale: [1.2, 0.9, 1.2], pos: [x, y, z], rot: [z, x, 0] });
            });
            // Vines hanging down the front and side faces of each terrace
            const vines = [
                // [x, z, top of the face, length]
                [-8, 10.08, 3, 2.4], [-5.5, 10.08, 3, 1.6], [4.5, 10.08, 3, 2.8], [7, 10.08, 3, 1.9],
                [-6, 7.58, 6, 2.2], [5, 7.58, 6, 2.7], [-4, 5.08, 9, 2.0], [3.8, 5.08, 9, 2.5]
            ];
            vines.forEach(([x, z, top, len]) => pieces.push(box(VINE, 0.3, len, 0.15, x, top - len / 2, z)));
            [[10.08, -6, 3, 2.5], [10.08, 2, 3, 1.8], [10.08, 6, 3, 2.6], [-10.08, -3, 3, 2.2], [-10.08, 5, 3, 2.7],
             [7.58, -2, 6, 2.3], [-7.58, 3, 6, 1.9]].forEach(([x, z, top, len]) => {
                pieces.push(box(VINE, 0.15, len, 0.3, x, top - len / 2, z));
            });
            return mergePieces(pieces);
        });

        const mesh = new THREE.Mesh(geo, vertexColourMaterial());
        mesh.castShadow = true;
        const group = new THREE.Group();
        group.add(mesh);
        return group;
    },

    // Jungle Jumble ground detail: a broken flagstone path from the temple stairs towards the middle
    createRuinsPath(level, solids) {
        const texture = sceneryCached('flagstoneTex', () => {
            const [canvas, ctx] = makeCanvas(128, 256);
            // Four rows of stones (64px each, so the texture tiles); gaps let the ground show through
            for (let row = 0; row < 4; row++) {
                let x = 2;
                while (x < 124) {
                    let w = 28 + Math.random() * 34;
                    if (126 - (x + w) < 14) w = 126 - x;
                    const atEdge = x < 10 || x + w > 118;
                    if (!(atEdge && Math.random() < 0.3)) { // some stones at the edges are missing
                        const shade = 128 + Math.floor(Math.random() * 30);
                        ctx.fillStyle = `rgb(${shade}, ${shade + 6}, ${shade - 10})`;
                        roundRectPath(ctx, x + 2, row * 64 + 3, w - 4, 58, 8);
                        ctx.fill();
                        ctx.fillStyle = 'rgba(80, 125, 45, 0.55)'; // moss creeping over the stone
                        for (let k = 0; k < 4; k++) {
                            ctx.beginPath();
                            ctx.arc(x + 4 + Math.random() * (w - 8), row * 64 + 5 + Math.random() * 54, 2 + Math.random() * 5, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                    x += w;
                }
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        });
        return pathFromLandmark(level, texture, 3.6);
    },

    // Jungle Jumble second landmark: a giant stone head, half swallowed by the jungle, with a
    // mossy crown, vines and bushes. Faces south (towards the camera). 7 units across, 7.5 high.
    // Seashell Shore landmark: a red-and-white lighthouse on a rocky base, door facing south, its
    // lamp glowing. 9 units across at the rocks, 15 high. Solid radius in levels.js.
    createLighthouse() {
        const parts = sceneryCached('lighthouse', () => {
            const BASE = 0.8, TOWER = 10.5, R0 = 2.4, R1 = 1.5; // the tower narrows from R0 to R1
            const TOP = BASE + TOWER;
            const IRON = '#2f2f2f', WINDOW = '#2d4a6a';
            const radiusAt = y => R0 + (R1 - R0) * Math.min(1, Math.max(0, (y - BASE) / TOWER));
            const pieces = [];
            // Rocks round the foot, leaving the door clear
            const ROCKS = ['#7d7a74', '#6e6b66', '#8a8780'];
            const LUMP = new THREE.DodecahedronGeometry(1, 0);
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2 + 0.31;
                if (Math.cos(a) > 0.8) continue; // the front, where the door is
                const s = 0.9 + ((i * 37) % 10) / 10 * 0.5;
                pieces.push({ geo: LUMP, color: ROCKS[i % 3], pos: [Math.sin(a) * 3.2, 0.25, Math.cos(a) * 3.2], scale: [s, s * 0.7, s], rot: [i, i * 2, 0] });
            }
            pieces.push({ geo: new THREE.CylinderGeometry(R0 + 0.5, R0 + 0.7, BASE, 12), color: '#a8a39a', pos: [0, BASE / 2, 0] });
            // The tower, in five red and white bands
            const BANDS = 5;
            for (let b = 0; b < BANDS; b++) {
                const y0 = BASE + TOWER * b / BANDS, y1 = BASE + TOWER * (b + 1) / BANDS;
                pieces.push({ geo: new THREE.CylinderGeometry(radiusAt(y1), radiusAt(y0), y1 - y0, 14), color: b % 2 ? '#f4f1ea' : '#d63a2f', pos: [0, (y0 + y1) / 2, 0] });
            }
            // Door and two little windows, facing south
            pieces.push({ geo: new THREE.BoxGeometry(1.1, 1.9, 0.4), color: WINDOW, pos: [0, BASE + 0.95, radiusAt(BASE + 0.95) - 0.1] });
            [4.2, 7.6].forEach(y => pieces.push({ geo: new THREE.BoxGeometry(0.55, 0.8, 0.3), color: WINDOW, pos: [0, BASE + y, radiusAt(BASE + y) - 0.05] }));
            // Gallery with its railing, the lantern room's frame, and a red roof
            pieces.push({ geo: new THREE.CylinderGeometry(R1 + 0.7, R1 + 0.5, 0.35, 14), color: IRON, pos: [0, TOP + 0.17, 0] });
            for (let k = 0; k < 14; k++) {
                const a = (k / 14) * Math.PI * 2;
                pieces.push({ geo: new THREE.BoxGeometry(0.08, 0.7, 0.08), color: IRON, pos: [Math.sin(a) * (R1 + 0.6), TOP + 0.7, Math.cos(a) * (R1 + 0.6)] });
            }
            pieces.push({ geo: new THREE.TorusGeometry(R1 + 0.6, 0.05, 4, 28), color: IRON, pos: [0, TOP + 1.05, 0], rot: [Math.PI / 2, 0, 0] });
            for (let k = 0; k < 6; k++) {
                const a = (k / 6) * Math.PI * 2;
                pieces.push({ geo: new THREE.BoxGeometry(0.12, 1.7, 0.12), color: IRON, pos: [Math.sin(a) * 1.12, TOP + 1.2, Math.cos(a) * 1.12] });
            }
            pieces.push({ geo: new THREE.CylinderGeometry(1.3, 1.3, 0.2, 14), color: IRON, pos: [0, TOP + 2.1, 0] });
            pieces.push({ geo: new THREE.ConeGeometry(1.6, 1.4, 14), color: '#c8352b', pos: [0, TOP + 2.9, 0] });
            pieces.push({ geo: new THREE.SphereGeometry(0.22, 8, 6), color: IRON, pos: [0, TOP + 3.7, 0] });
            return {
                body: mergePieces(pieces),
                lamp: new THREE.CylinderGeometry(0.95, 0.95, 1.5, 14),
                lampMat: new THREE.MeshBasicMaterial({ color: 0xfff2a0 }), // unlit, so it glows
                lampY: TOP + 1.2
            };
        });

        const group = new THREE.Group();
        const body = new THREE.Mesh(parts.body, vertexColourMaterial());
        body.castShadow = true;
        group.add(body);
        const lamp = new THREE.Mesh(parts.lamp, parts.lampMat);
        lamp.position.y = parts.lampY;
        group.add(lamp);
        return group;
    },

    // Seashell Shore ground detail: a wooden boardwalk from the lighthouse door towards the middle
    createBoardwalk(level, solids) {
        const texture = sceneryCached('boardwalkTex', () => {
            const W = 128, H = 256, PLANKS = 8;
            const [canvas, ctx] = makeCanvas(W, H);
            for (let k = 0; k < PLANKS; k++) {
                const y = k * H / PLANKS, h = H / PLANKS;
                const n = Math.floor(Math.random() * 20);
                ctx.fillStyle = `rgb(${176 + n}, ${132 + n}, ${86 + n})`;
                ctx.fillRect(0, y, W, h);
                for (let g = 0; g < 5; g++) { // wood grain along the plank
                    ctx.strokeStyle = Math.random() < 0.5 ? 'rgba(120, 80, 40, 0.35)' : 'rgba(230, 200, 150, 0.35)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    const gy = y + 4 + Math.random() * (h - 8);
                    ctx.moveTo(0, gy);
                    ctx.bezierCurveTo(W * 0.3, gy + 2, W * 0.6, gy - 2, W, gy);
                    ctx.stroke();
                }
                ctx.fillStyle = '#4e3520'; // gap between planks
                ctx.fillRect(0, y, W, 3);
                ctx.fillStyle = '#3a2a1a'; // nails at each end
                [10, W - 10].forEach(x => { ctx.beginPath(); ctx.arc(x, y + h / 2, 2, 0, Math.PI * 2); ctx.fill(); });
            }
            ctx.fillStyle = '#7a5532'; // the boards it rests on, along each edge
            ctx.fillRect(0, 0, 6, H);
            ctx.fillRect(W - 6, 0, 6, H);
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        });
        return pathFromLandmark(level, texture, 3.0, 0.02); // a boardwalk ends square, not in a point
    },

    // Seashell Shore second landmark: an old wooden rowing boat beached on the sand, tipped a
    // little onto its side, with its oars and a coil of rope. Lies north-south, 8 long, so it can
    // be solid as three circles along the hull (userData.colliders).
    createRowingBoat() {
        const parts = sceneryCached('rowingBoat', () => {
            const WOOD = '#9a6a3e', DARK = '#6e4a2a', PAINT = '#3f7fb5';
            const B = new THREE.BoxGeometry(1, 1, 1);
            const OAR = new THREE.CylinderGeometry(0.07, 0.07, 3.2, 6);
            const boat = [
                // Hull: the bottom half of a stretched sphere, open at the top
                { geo: new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), color: PAINT, pos: [0, 1.0, 0], scale: [1.6, 1.0, 4.0] },
                { geo: new THREE.TorusGeometry(1, 0.09, 4, 32), color: WOOD, pos: [0, 1.0, 0], rot: [Math.PI / 2, 0, 0], scale: [1.6, 4.0, 1] },
                { geo: B, color: DARK, pos: [0, 0.32, 0], scale: [1.9, 0.06, 5.0] },   // floor boards
                { geo: B, color: WOOD, pos: [0, 0.85, -1.2], scale: [2.6, 0.12, 0.45] }, // seats
                { geo: B, color: WOOD, pos: [0, 0.85, 1.1], scale: [2.6, 0.12, 0.45] },
                // An oar resting across the seats
                { geo: OAR, color: WOOD, pos: [0.3, 1.0, -0.1], rot: [Math.PI / 2, 0, 0.1] },
                { geo: B, color: WOOD, pos: [0.3, 1.0, 1.65], scale: [0.4, 0.06, 0.9] }
            ];
            // Lying flat on the sand (not tipped with the boat): the other oar, and a coil of rope by the bow
            const sand = [
                { geo: OAR, color: WOOD, pos: [2.4, 0.08, 0.4], rot: [Math.PI / 2, 0, 0.35] },
                { geo: B, color: WOOD, pos: [2.95, 0.05, 2.0], scale: [0.4, 0.06, 0.9], rot: [0, 0.35, 0] },
                { geo: new THREE.TorusGeometry(0.4, 0.1, 5, 14), color: '#d8c49a', pos: [-1.1, 0.1, 4.4], rot: [Math.PI / 2, 0, 0] },
                { geo: new THREE.TorusGeometry(0.28, 0.09, 5, 12), color: '#cbb68a', pos: [-1.1, 0.25, 4.4], rot: [Math.PI / 2, 0, 0] }
            ];
            return { boat: mergePieces(boat), sand: mergePieces(sand) };
        });

        const group = new THREE.Group();
        const boat = new THREE.Mesh(parts.boat, vertexColourMaterialDoubleSided());
        boat.rotation.z = 0.22; // tipped onto its side a little
        boat.castShadow = true;
        group.add(boat);
        const sand = new THREE.Mesh(parts.sand, vertexColourMaterial());
        sand.castShadow = true;
        group.add(sand);
        group.userData.colliders = [-2.6, 0, 2.6].map(z => ({ x: 0, z, radius: 1.6 }));
        return group;
    },

    createStoneHead() {
        const geo = sceneryCached('stoneHead', () => {
            const BALL = new THREE.SphereGeometry(1, 8, 6); // low-poly ball, squashed into each shape
            const B = new THREE.BoxGeometry(1, 1, 1);
            const BAND = new THREE.CylinderGeometry(1, 1, 1, 10);
            const LUMP = new THREE.DodecahedronGeometry(1, 0);
            // Warm, light stone so it stands out from the green jungle fog
            const STONE = '#a29d88', STONE_LIGHT = '#b3ad96', CAP = '#958f7a', DARK = '#1e1b14';
            const MOSS = '#4f7a2c', VINE = '#2f6a24', LEAF = '#3f8a2c';
            const box = (color, sx, sy, sz, x, y, z) => ({ geo: B, color, scale: [sx, sy, sz], pos: [x, y, z] });
            const pieces = [
                { geo: BALL, color: STONE, scale: [3.2, 3.6, 2.8], pos: [0, 3.3, 0] },        // head
                { geo: BALL, color: CAP, scale: [3.35, 1.9, 2.95], pos: [0, 5.2, -0.1] },     // rounded helmet
                { geo: BAND, color: CAP, scale: [3.15, 0.7, 2.8], pos: [0, 4.45, 0] },        // headband
                { geo: BALL, color: MOSS, scale: [2.8, 0.9, 2.4], pos: [0, 6.75, -0.2] },     // moss on top
                // Face (front = +z)
                box(STONE_LIGHT, 4.0, 0.5, 0.7, 0, 3.95, 2.55),                                // brow
                { geo: BALL, color: DARK, scale: [0.72, 0.42, 0.3], pos: [-1.15, 3.5, 2.55] },  // eyes
                { geo: BALL, color: DARK, scale: [0.72, 0.42, 0.3], pos: [1.15, 3.5, 2.55] },
                box(STONE_LIGHT, 1.3, 1.3, 0.9, 0, 2.75, 2.75),                                // nose
                box(DARK, 0.3, 0.2, 0.2, -0.35, 2.15, 3.15), box(DARK, 0.3, 0.2, 0.2, 0.35, 2.15, 3.15),
                box(STONE_LIGHT, 2.3, 0.45, 0.6, 0, 1.75, 2.5),                                // lips
                box(DARK, 2.0, 0.12, 0.3, 0, 1.5, 2.65),
                box(STONE_LIGHT, 2.1, 0.45, 0.55, 0, 1.25, 2.3),
                box(STONE, 0.6, 1.8, 1.3, -3.15, 3.3, 0.4), box(STONE, 0.6, 1.8, 1.3, 3.15, 3.3, 0.4) // ears
            ];
            // Vines hanging from the headband down the sides and back (angle round the head, length)
            [[1.3, 2.2], [1.9, 2.6], [2.6, 1.8], [3.4, 2.4], [4.2, 2.0], [4.9, 2.5]].forEach(([a, len]) => {
                pieces.push(box(VINE, 0.25, len, 0.25, Math.sin(a) * 3.15 * 1.04, 4.6 - len / 2, Math.cos(a) * 2.8 * 1.04));
            });
            // Bushes round the base
            [[-3.2, 1.8, 1.2], [3.3, 1.5, 1.1], [2.6, -2.2, 1.3], [-2.4, -2.4, 1.2], [0.4, -2.9, 1.0]]
                .forEach(([x, z, s], k) => pieces.push({ geo: LUMP, color: k % 2 ? LEAF : MOSS, scale: [s, s * 0.75, s], pos: [x, 0.5, z], rot: [k, k * 1.7, 0] }));
            return mergePieces(pieces);
        });

        const mesh = new THREE.Mesh(geo, vertexColourMaterial());
        mesh.castShadow = true;
        const group = new THREE.Group();
        group.add(mesh);
        return group;
    }
};

// Double-sided copy of the landmark material, for open shapes you can see into (the rowing boat)
function vertexColourMaterialDoubleSided() {
    return sceneryCached('vertexColourMatDouble', () => {
        const m = vertexColourMaterial().clone();
        m.side = THREE.DoubleSide;
        return m;
    });
}

// Builds, animates and clears the current biome's scenery, and answers collision questions about
// landmarks. A model can animate through userData.update(deltaTime, time, camera), list what to
// free on level change in userData.disposables (cached shared resources are kept for the next
// visit), and list spots obstacles mustn't spawn on in userData.keepClear. A landmark made of
// separate solid parts (the stone circle) lists them in userData.colliders instead of using the
// single radius/halfSize from levels.js. Colliders and keepClear are in the model's own units.
const Scenery = {
    objects: [],
    solids: [],    // landmark footprints: { x, z, radius } circles or { x, z, halfSize } squares
    keepClear: [], // { x, z, r } spots where obstacles mustn't spawn (paths, inside the stone circle)
    time: 0,

    create(scene, level) {
        this.dispose();
        (level.landmarks || []).forEach(l => {
            const obj = SceneryModels[l.model]();
            const scale = l.scale || 1;
            obj.position.set(l.x, 0, l.z);
            obj.scale.setScalar(scale);
            scene.add(obj);
            this.objects.push(obj);
            const toWorld = c => ({ x: l.x + c.x * scale, z: l.z + c.z * scale });
            if (obj.userData.colliders) {
                obj.userData.colliders.forEach(c => this.solids.push({ ...toWorld(c), radius: c.radius * scale }));
            } else {
                this.solids.push({ x: l.x, z: l.z, radius: l.radius, halfSize: l.halfSize });
            }
            (obj.userData.keepClear || []).forEach(c => this.keepClear.push({ ...toWorld(c), r: c.r * scale }));
        });
        if (level.groundDetail) {
            const obj = SceneryModels[level.groundDetail](level, this.solids);
            scene.add(obj);
            this.objects.push(obj);
            this.keepClear.push(...(obj.userData.keepClear || []));
        }
    },

    // How far (x, z) is from a landmark's edge (negative = inside it), and the outward direction
    edge(s, x, z) {
        const dx = x - s.x, dz = z - s.z;
        if (s.halfSize === undefined) {
            const d = Math.hypot(dx, dz) || 1e-6;
            return { dist: d - s.radius, nx: dx / d, nz: dz / d };
        }
        const qx = Math.abs(dx) - s.halfSize, qz = Math.abs(dz) - s.halfSize;
        if (qx > 0 || qz > 0) { // outside the square: measure from its nearest point
            const ox = Math.max(qx, 0) * Math.sign(dx), oz = Math.max(qz, 0) * Math.sign(dz);
            const d = Math.hypot(ox, oz);
            return { dist: d, nx: ox / d, nz: oz / d };
        }
        // Inside: out through the nearest side
        return qx > qz ? { dist: qx, nx: Math.sign(dx) || 1, nz: 0 } : { dist: qz, nx: 0, nz: Math.sign(dz) || 1 };
    },

    // Move pos (anything with x and z) out of every landmark, keeping `radius` clear of its edge
    pushOut(pos, radius) {
        for (const s of this.solids) {
            const e = this.edge(s, pos.x, pos.z);
            if (e.dist < radius) {
                pos.x += e.nx * (radius - e.dist);
                pos.z += e.nz * (radius - e.dist);
            }
        }
    },

    // Is (x, z) on a landmark, or within `margin` of one?
    isBlocked(x, z, margin = 0) {
        return this.solids.some(s => this.edge(s, x, z).dist < margin);
    },

    // Obstacles (trees, cacti, rocks...) stay 3 units off landmarks and off paths
    blocksObstacles(x, z) {
        return this.isBlocked(x, z, 3) || this.keepClear.some(c => Math.hypot(x - c.x, z - c.z) < c.r);
    },

    update(deltaTime, camera) {
        this.time += deltaTime;
        this.objects.forEach(o => { if (o.userData.update) o.userData.update(deltaTime, this.time, camera); });
    },

    dispose() {
        this.objects.forEach(o => {
            if (o.parent) o.parent.remove(o);
            (o.userData.disposables || []).forEach(d => d.dispose());
        });
        this.objects = [];
        this.solids = [];
        this.keepClear = [];
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SceneryModels, Scenery };
}
