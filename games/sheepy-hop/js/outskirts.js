// The world outside the fence, and the quiet outer part of the arena. All of it is decoration:
// nothing here is solid, moves an obstacle or can be picked up, so it can't change how the game
// plays. Each level picks a set with `outskirts` in levels.js; the sets are in SETS below.
//
//   backdrop - hills, trees and rocks past the fence, so the world fades into the fog instead of
//              stopping at an edge. Only on the north, east and west sides: the camera always
//              faces north, so the south side is never on screen (and anything there could come
//              between the camera and Sheepy when Sheepy is by the south fence).
//   animals  - a few creatures wandering, hopping or flying just outside the fence, and other
//              things that move out there (the beach's sea and boats, the volcano's geysers)
//   detail   - small walk-through things (flowers, pebbles, mushrooms...) between the middle
//              80x80, where collectables spawn, and the fence. Kept low, and in shapes and colours
//              that can't be taken for that world's collectables, bonus items or enemies.
//
// Built after the obstacles, so the detail can keep off the trees without moving any. Everything
// goes into Scenery.objects, so it is animated and freed with the rest of the scenery.
// Loaded after scenery.js (uses its mergePieces, vertexColourMaterial, addSmoke and sceneryCached).

const Outskirts = (() => {
    const TAU = Math.PI * 2;
    const UP = new THREE.Vector3(0, 1, 0);
    const rand = (a, b) => a + Math.random() * (b - a);
    const randInt = (a, b) => Math.floor(rand(a, b + 1));
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const ease = (from, to, amount) => from + (to - from) * Math.min(1, amount);
    const angleDiff = (a, b) => {
        let d = (a - b) % TAU;
        if (d > Math.PI) d -= TAU;
        if (d < -Math.PI) d += TAU;
        return d;
    };

    // ---------- Building blocks ----------

    // Unit-sized shapes that every prop is made from, scaled and turned per part
    function shapes() {
        return sceneryCached('outskirtsShapes', () => ({
            box: new THREE.BoxGeometry(1, 1, 1),
            ball: new THREE.IcosahedronGeometry(1, 1),          // round lump: animal bodies, bushes
            rock: new THREE.DodecahedronGeometry(1, 0),         // rough lump: rocks, tree tops
            pebble: new THREE.IcosahedronGeometry(1, 0),        // small rough lump
            cone: new THREE.ConeGeometry(1, 1, 7),
            spike: new THREE.ConeGeometry(1, 1, 4),             // blades of grass, spires, horns
            cyl: new THREE.CylinderGeometry(1, 1, 1, 7),
            stem: new THREE.CylinderGeometry(1, 1, 1, 3, 1, true),
            bloom: new THREE.CylinderGeometry(1, 0.35, 1, 6),   // flower head
            crater: new THREE.CylinderGeometry(0.3, 1, 1, 8),   // cone with its top cut off
            prism: new THREE.CylinderGeometry(1, 1, 1, 3),      // barn roof
            octa: new THREE.OctahedronGeometry(1, 0),           // kite
            dome: new THREE.SphereGeometry(1, 10, 4, 0, TAU, 0, Math.PI / 2), // flat base at y = 0
            donut: new THREE.TorusGeometry(1, 0.45, 8, 16),
            // Low rounded hill: a slice off the top of a sphere, so its edge meets the ground at a
            // gentle slope instead of a wall. Base radius 1 at y = 0, height 1.
            cap: (() => {
                const a = 0.75;
                const g = new THREE.SphereGeometry(1, 16, 4, 0, TAU, 0, a);
                g.translate(0, -Math.cos(a), 0);
                g.scale(1 / Math.sin(a), 1 / (1 - Math.cos(a)), 1 / Math.sin(a));
                return g;
            })()
        }));
    }

    // One part of a prop: shape g (from shapes()), colour c, centre p, size s (a number or [x, y, z])
    // and turn r [x, y, z]. Turns are applied z, then x, then y, so tilts happen in the prop's own
    // space before it is turned round the vertical. g can also be a geometry of its own (the candy
    // shapes from scenery.js); with no colour, a part keeps the colours painted on its geometry.
    const part = (g, c, p, s = 1, r) => ({ g, c, p, s, r });

    // A colour a little lighter or darker than c, so repeated props don't all match
    const _hsl = {};
    function vary(c, amount = 0.06) {
        const col = new THREE.Color(c);
        col.getHSL(_hsl);
        return col.setHSL(_hsl.h, _hsl.s, Math.min(1, Math.max(0, _hsl.l + rand(-amount, amount))));
    }

    // n things scattered within `radius` of the middle of a prop; each(x, z, i) returns their parts
    function cluster(n, radius, each) {
        const parts = [];
        for (let i = 0; i < n; i++) {
            const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * radius;
            parts.push(...each(Math.sin(a) * d, Math.cos(a) * d, i));
        }
        return parts;
    }

    // Props placed round the map, merged into one mesh (one draw call)
    const _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ');
    class PropBatch {
        constructor() { this.pieces = []; }

        // Adds a prop (a list of parts, in its own space) standing at (x, y, z), turned `turn` round
        // the vertical and scaled by `scale`
        add(parts, x, z, turn = 0, scale = 1, y = 0) {
            const S = shapes();
            const place = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
                new THREE.Quaternion().setFromAxisAngle(UP, turn), new THREE.Vector3(scale, scale, scale));
            parts.forEach(pt => {
                const s = Array.isArray(pt.s) ? pt.s : [pt.s, pt.s, pt.s];
                const local = new THREE.Matrix4().compose(new THREE.Vector3(...pt.p),
                    _q.setFromEuler(_e.set(...(pt.r || [0, 0, 0]), 'YXZ')), new THREE.Vector3(...s));
                this.pieces.push({ geo: typeof pt.g === 'string' ? S[pt.g] : pt.g, color: pt.c, matrix: place.clone().multiply(local) });
            });
        }

        build(material, receiveShadow = true) {
            if (!this.pieces.length) return null;
            const geo = mergePieces(this.pieces);
            const mesh = new THREE.Mesh(geo, material);
            mesh.receiveShadow = receiveShadow;
            mesh.userData.disposables = [geo];
            return mesh;
        }
    }

    // The camera's view, worked out once per frame (t is the same for everything in a frame)
    const _frustum = new THREE.Frustum(), _viewProj = new THREE.Matrix4(), _sphere = new THREE.Sphere();
    let _frustumTime = -1;
    function viewOf(camera, t) {
        if (t !== _frustumTime) {
            _viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            _frustum.setFromProjectionMatrix(_viewProj);
            _frustumTime = t;
        }
        return _frustum;
    }

    // Is a sphere in the camera's view? Flocks and geyser blobs are instanced, which three.js can't
    // cull by itself, so they check for themselves and skip drawing (and updating) when out of view.
    function inView(camera, t, x, y, z, r) {
        _sphere.center.set(x, y, z);
        _sphere.radius = r;
        return viewOf(camera, t).intersectsSphere(_sphere);
    }

    // Props split into chunks by area (key). Each chunk hides itself when its box is out of view:
    // three.js only checks a bounding sphere, which for a wide flat strip of land reaches far
    // above it and keeps it drawn when it's well off the top of the screen.
    class ChunkedBatch {
        constructor() { this.chunks = new Map(); }
        get(key) {
            if (!this.chunks.has(key)) this.chunks.set(key, new PropBatch());
            return this.chunks.get(key);
        }
        build(material, receiveShadow) {
            return [...this.chunks.values()].map(b => {
                const mesh = b.build(material, receiveShadow);
                if (!mesh) return null;
                mesh.geometry.computeBoundingBox();
                // A little extra, as this runs before the camera moves for the frame
                const box = mesh.geometry.boundingBox.clone().expandByScalar(2);
                mesh.userData.update = (dt, t, camera) => { mesh.visible = viewOf(camera, t).intersectsBox(box); };
                return mesh;
            }).filter(Boolean);
        }
    }
    const CHUNK = 45; // units of fence per backdrop chunk

    // One prop's parts merged into a geometry, for animals (built once, then reused)
    function mergeParts(parts) {
        const batch = new PropBatch();
        batch.add(parts, 0, 0);
        return mergePieces(batch.pieces);
    }

    // Backdrop and detail are flat-shaded like the landmarks, unless the set asks for `smooth`
    // shading (Cloud Kingdom: round, soft clouds)
    const setMaterial = set => (set.smooth ? fluffMaterial() : vertexColourMaterial());

    // Unlit vertex-coloured material, for glowing lava
    const glowMaterial = () => sceneryCached('outskirtsGlow', () => new THREE.MeshBasicMaterial({ vertexColors: true }));
    // Separate copy of the landmark material for flocks: three.js would otherwise switch the one
    // material between its plain and instanced versions every frame
    const flockMaterial = () => sceneryCached('outskirtsFlockMat', () => new THREE.MeshStandardMaterial({
        vertexColors: true, flatShading: true, roughness: 0.9, metalness: 0
    }));

    // ---------- Where things go ----------

    // Random spot in the outer part of the arena: between `inner` and `outer` from the middle,
    // measured along x or z like the fence
    function arenaSpot(inner, outer) {
        for (;;) {
            const x = rand(-outer, outer), z = rand(-outer, outer);
            if (Math.max(Math.abs(x), Math.abs(z)) >= inner) return { x, z };
        }
    }

    // Random spot `near` to `far` past the fence on side 'N', 'E' or 'W'. The north side runs on
    // past the corners; east and west run from the north fence to a little past the south one.
    function outsideSpot(side, fence, near, far) {
        const d = fence + rand(near, far);
        if (side === 'N') return { x: rand(-1, 1) * (fence + far), z: -d };
        return { x: side === 'E' ? d : -d, z: rand(-fence, fence + 10) };
    }
    const sideLength = (side, fence, far) => (side === 'N' ? 2 * (fence + far) : 2 * fence + 10);

    // Spots kept for animals (and the barn): { x1, z1, x2, z2, r }, a line or (x1 = x2) a circle
    function distToSegment(x, z, s) {
        const dx = s.x2 - s.x1, dz = s.z2 - s.z1;
        const len2 = dx * dx + dz * dz;
        const t = len2 ? Math.max(0, Math.min(1, ((x - s.x1) * dx + (z - s.z1) * dz) / len2)) : 0;
        return Math.hypot(x - (s.x1 + dx * t), z - (s.z1 + dz * t));
    }
    const isKept = (x, z, kept, gap = 0) => kept.some(s => distToSegment(x, z, s) < s.r + gap);
    const circle = (x, z, r) => ({ x1: x, z1: z, x2: x, z2: z, r });

    // A spot near the fence for an animal's home, in the part of each side the camera sees most
    function homeSpot(side, fence, near, far, kept, r) {
        for (let tries = 0; ; tries++) {
            const d = fence + rand(near, far);
            const along = side === 'N' ? rand(-50, 50) : rand(-62, 50);
            const spot = side === 'N' ? { x: along, z: -d } : { x: side === 'E' ? d : -d, z: along };
            if (tries > 30 || !isKept(spot.x, spot.z, kept, r)) return spot;
        }
    }

    // ---------- Backdrop and detail ----------

    // Layers of props outside the fence: { near, far, per100 (per 100 units of fence) or count,
    // sides, prop() -> parts or { parts, glow }, scale: [min, max], turn: [min, max], clear }.
    // A layer with `clear` keeps that much room round each of its props for later layers.
    function buildBackdrop(set, fence, kept) {
        const props = new ChunkedBatch(), glows = new ChunkedBatch();
        set.backdrop.forEach(layer => {
            const sides = layer.sides || ['N', 'E', 'W'];
            const counts = {};
            if (layer.count) {
                for (let i = 0; i < layer.count; i++) { const s = pick(sides); counts[s] = (counts[s] || 0) + 1; }
            } else {
                sides.forEach(s => { counts[s] = Math.round(sideLength(s, fence, layer.far) / 100 * layer.per100); });
            }
            sides.forEach(side => {
                for (let placed = 0, tries = 0; placed < (counts[side] || 0) && tries < 400; tries++) {
                    const { x, z } = outsideSpot(side, fence, layer.near, layer.far);
                    if (isKept(x, z, kept, 1.5)) continue;
                    const made = layer.prop();
                    const turn = layer.turn ? rand(...layer.turn) : rand(0, TAU);
                    const scale = layer.scale ? rand(...layer.scale) : 1;
                    const key = side + Math.floor(((side === 'N' ? x : z) + 200) / CHUNK);
                    props.get(key).add(made.parts || made, x, z, turn, scale);
                    if (made.glow) glows.get(key).add(made.glow, x, z, turn, scale);
                    if (layer.clear) kept.push(circle(x, z, layer.clear));
                    placed++;
                }
            });
        });
        return [...props.build(setMaterial(set)), ...glows.build(glowMaterial(), false)];
    }

    // Small walk-through things in the outer part of the arena, kept off landmarks, paths and
    // obstacles. In 40x40 chunks, so the ones out of view aren't drawn.
    function buildDetail(set, level, obstacles) {
        const inner = level.SMALL_WORLD_SIZE / 2 + 5, outer = level.WORLD_SIZE / 2 - 3;
        const batches = new ChunkedBatch();
        set.detail.forEach(d => {
            for (let placed = 0, tries = 0; placed < d.count && tries < d.count * 20; tries++) {
                const { x, z } = arenaSpot(inner, outer);
                if (Scenery.isBlocked(x, z, 2) ||
                    Scenery.keepClear.some(c => Math.hypot(x - c.x, z - c.z) < c.r) ||
                    obstacles.some(o => Math.abs(o.position.x - x) < 2.5 && Math.abs(o.position.z - z) < 2.5)) continue;
                batches.get(Math.floor(x / 40) + ',' + Math.floor(z / 40)).add(d.prop(), x, z, rand(0, TAU), d.scale ? rand(...d.scale) : 1);
                placed++;
            }
        });
        return batches.build(setMaterial(set));
    }

    // ---------- Animals ----------

    // An animal's meshes, built once and reused on every visit: model() returns { body, head, neck }
    // (parts, and where the head turns) or, for flocks, { body, left, right } (wings hinged at x = 0)
    function animalGeo(spec) {
        return sceneryCached('outskirtsAnimal-' + spec.name, () => {
            const m = spec.model();
            const geo = {};
            Object.keys(m).forEach(k => { geo[k] = Array.isArray(m[k]) && typeof m[k][0] === 'object' ? mergeParts(m[k]) : m[k]; });
            return geo;
        });
    }

    function animalMesh(geo) {
        const mesh = new THREE.Mesh(geo, vertexColourMaterial());
        mesh.castShadow = true;
        return mesh;
    }

    // Walkers stroll to a random point on their stretch of land along the fence, stop to graze
    // (head down) or look about for a while, and set off again.
    //   speed (units/sec), stride (steps per unit), bob (how far the body bounces each step),
    //   graze (how far the head drops when stopped), look (how far it turns side to side)
    function walkers(spec, fence, kept) {
        return spec.sides.map(side => {
            const geo = animalGeo(spec);
            const group = new THREE.Group();
            const body = animalMesh(geo.body);
            group.add(body);
            const neck = new THREE.Group();
            neck.position.set(...geo.neck);
            neck.add(animalMesh(geo.head));
            body.add(neck);
            group.scale.setScalar(spec.scale || 1);

            const length = rand(14, 22), home = homeSpot(side, fence, 5, 11, kept, length / 2 + 3);
            const tilt = rand(-0.1, 0.1);
            const lane = side === 'N'
                ? { x1: home.x - length / 2, z1: home.z - length * tilt, x2: home.x + length / 2, z2: home.z + length * tilt }
                : { x1: home.x - length * tilt, z1: home.z - length / 2, x2: home.x + length * tilt, z2: home.z + length / 2 };
            kept.push({ ...lane, r: 3.5 });
            const pointOnLane = () => {
                const t = Math.random();
                return { x: lane.x1 + (lane.x2 - lane.x1) * t, z: lane.z1 + (lane.z2 - lane.z1) * t };
            };
            const start = pointOnLane();
            group.position.set(start.x, 0, start.z);
            group.rotation.y = rand(0, TAU);

            let target = pointOnLane(), rest = rand(0.5, 5), step = 0;
            const phase = rand(0, 10);
            group.userData.update = (dt, t) => {
                if (rest > 0) {
                    rest -= dt;
                    neck.rotation.x = ease(neck.rotation.x, spec.graze + Math.sin(t * 5 + phase) * 0.05, dt * 2);
                    neck.rotation.y = ease(neck.rotation.y, Math.sin(t * 0.5 + phase) * spec.look, dt * 2);
                    body.position.y = ease(body.position.y, 0, dt * 4);
                    body.rotation.z = ease(body.rotation.z, 0, dt * 4);
                    if (rest <= 0) target = pointOnLane();
                    return;
                }
                const dx = target.x - group.position.x, dz = target.z - group.position.z;
                const dist = Math.hypot(dx, dz);
                if (dist < 0.2) { rest = rand(3, 8); return; }
                const turn = angleDiff(Math.atan2(dx, dz), group.rotation.y);
                group.rotation.y += Math.sign(turn) * Math.min(Math.abs(turn), dt * 1.4);
                neck.rotation.x = ease(neck.rotation.x, 0, dt * 2);
                neck.rotation.y = ease(neck.rotation.y, 0, dt * 2);
                if (Math.abs(turn) < 0.6) { // set off once roughly facing the right way
                    const d = Math.min(dist, spec.speed * dt);
                    group.position.x += dx / dist * d;
                    group.position.z += dz / dist * d;
                    step += d * spec.stride;
                    body.position.y = Math.abs(Math.sin(step)) * spec.bob;
                    body.rotation.z = Math.sin(step) * 0.04;
                }
            };
            return group;
        });
    }

    // Hoppers sit a while, then hop a few times to another spot near home.
    //   hop (length of one hop), hopHeight, hopTime (seconds per hop)
    function hoppers(spec, fence, kept) {
        return spec.sides.map(side => {
            const geo = animalGeo(spec);
            const group = new THREE.Group();
            const body = animalMesh(geo.body);
            group.add(body);
            group.scale.setScalar(spec.scale || 1);
            const home = homeSpot(side, fence, 4, 10, kept, 6);
            kept.push(circle(home.x, home.z, 5.5));
            group.position.set(home.x, 0, home.z);
            group.rotation.y = rand(0, TAU);

            let rest = rand(0.5, 3), target = null, hopT = 0;
            const from = new THREE.Vector3(), to = new THREE.Vector3();
            const nextHop = () => {
                from.copy(group.position).setY(0);
                const dx = target.x - from.x, dz = target.z - from.z, dist = Math.max(1e-3, Math.hypot(dx, dz));
                const d = Math.min(dist, spec.hop);
                to.set(from.x + dx / dist * d, 0, from.z + dz / dist * d);
                group.rotation.y = Math.atan2(dx, dz);
                hopT = 0;
            };
            group.userData.update = dt => {
                if (rest > 0) {
                    rest -= dt;
                    if (rest <= 0) {
                        const a = rand(0, TAU), r = rand(1.5, 4.5);
                        target = { x: home.x + Math.sin(a) * r, z: home.z + Math.cos(a) * r };
                        nextHop();
                    }
                    return;
                }
                hopT += dt / spec.hopTime;
                const t = Math.min(1, hopT);
                group.position.lerpVectors(from, to, t);
                group.position.y = Math.sin(Math.PI * t) * spec.hopHeight;
                body.rotation.x = -Math.sin(TAU * t) * 0.25; // nose up taking off, down landing
                if (t >= 1) {
                    if (Math.hypot(target.x - to.x, target.z - to.z) < 0.1) rest = rand(1.5, 5);
                    else nextHop();
                }
            };
            return group;
        });
    }

    // A flock circling just outside the fence. All the bodies are one InstancedMesh, and each wing
    // another, so a whole flock is three draw calls.
    //   count, radius [min, max] of the circle, height [min, max], speed (units/sec),
    //   flapRate, flapAmount (radians), glide (0..1: share of the time spent gliding),
    //   jitter (how much the circle wobbles), tints (colours to pick from for each bird)
    function flocks(spec, fence) {
        return spec.sides.map(side => {
            const geo = animalGeo(spec);
            const n = spec.count;
            const meshes = [geo.body, geo.left, geo.right].map(g => {
                const mesh = new THREE.InstancedMesh(g, flockMaterial(), n);
                mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                mesh.frustumCulled = false; // instances fly far from the mesh's own origin
                return mesh;
            });
            if (spec.tints) {
                for (let i = 0; i < n; i++) {
                    const tint = new THREE.Color(pick(spec.tints));
                    meshes.forEach(m => m.setColorAt(i, tint));
                }
            }
            const group = new THREE.Group();
            meshes.forEach(m => group.add(m));

            const r = rand(...spec.radius);
            const d = fence + r + rand(3, 6);
            const centre = side === 'N' ? { x: rand(-45, 45), z: -d } : { x: side === 'E' ? d : -d, z: rand(-55, 35) };
            const dir = Math.random() < 0.5 ? 1 : -1;
            const start = rand(0, TAU);
            const birds = Array.from({ length: n }, (_, i) => ({
                angle: start + i * 0.45 + rand(-0.15, 0.15), // a loose group following each other round
                radius: r + rand(-2, 2),
                height: rand(...spec.height),
                speed: spec.speed * rand(0.92, 1.08),
                phase: rand(0, TAU)
            }));

            const body = new THREE.Matrix4(), wing = new THREE.Matrix4(), out = new THREE.Matrix4();
            const pos = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ');
            const size = new THREE.Vector3().setScalar(spec.scale || 1);
            const midHeight = (spec.height[0] + spec.height[1]) / 2;
            group.userData.update = (dt, t, camera) => {
                birds.forEach(b => { b.angle += dir * b.speed / b.radius * dt; });
                group.visible = inView(camera, t, centre.x, midHeight, centre.z, r + (spec.jitter || 0) + 4);
                if (!group.visible) return;
                birds.forEach((b, i) => {
                    const rr = b.radius + (spec.jitter ? Math.sin(t * 2.3 + b.phase) * spec.jitter : 0);
                    pos.set(centre.x + Math.sin(b.angle) * rr,
                            b.height + Math.sin(t * 0.8 + b.phase) * 0.6,
                            centre.z + Math.cos(b.angle) * rr);
                    // Facing along the circle, leaning into the turn
                    e.set(0, b.angle + dir * Math.PI / 2, dir * 0.2);
                    body.compose(pos, q.setFromEuler(e), size);
                    meshes[0].setMatrixAt(i, body);
                    // Flap, easing into a glide (wings held a little up) for `glide` of the time
                    const flapping = spec.glide ? Math.min(1, Math.max(0, (Math.sin(t * 0.9 + b.phase) - (2 * spec.glide - 1)) * 2)) : 1;
                    const flap = 0.12 + Math.sin(t * spec.flapRate + b.phase * 7) * spec.flapAmount * flapping;
                    meshes[1].setMatrixAt(i, out.multiplyMatrices(body, wing.makeRotationZ(flap)));
                    meshes[2].setMatrixAt(i, out.multiplyMatrices(body, wing.makeRotationZ(-flap)));
                });
                meshes.forEach(m => { m.instanceMatrix.needsUpdate = true; });
            };
            group.userData.disposables = meshes;
            return group;
        });
    }

    // Tumbleweeds bowling east along the north fence with the wind. One blown out of sight comes
    // back in on the far side, also out of sight, so there's always one or two going past.
    function rollers(spec, fence) {
        return Array.from({ length: spec.count }, () => {
            const geo = animalGeo(spec);
            const group = new THREE.Group();
            const ball = animalMesh(geo.body);
            group.add(ball);
            const r = spec.radius, z = -(fence + rand(3, 12)), speed = rand(3.5, 5.5), phase = rand(0, TAU);
            let x = rand(-90, 90);
            group.userData.update = (dt, t, camera) => {
                x += speed * dt;
                if (x > camera.position.x + 95) x -= 190 + rand(0, 25);
                if (x < camera.position.x - 125) x += 200;
                group.position.set(x, r + Math.abs(Math.sin(t * 2.4 + phase)) * 0.7, z);
                ball.rotation.z -= speed * dt / r;
            };
            return group;
        });
    }

    // Lava geysers: little vents just outside the fence that spit glowing blobs every few seconds
    function geysers(spec, fence, kept) {
        const blobMat = sceneryCached('geyserBlob', () => new THREE.MeshBasicMaterial({ color: 0xffa424 }));
        return spec.sides.map(side => {
            const geo = animalGeo(spec);
            const home = homeSpot(side, fence, 4, 10, kept, 6);
            kept.push(circle(home.x, home.z, 5));
            const group = new THREE.Group();
            group.position.set(home.x, 0, home.z);
            group.add(animalMesh(geo.body));
            group.add(new THREE.Mesh(geo.glow, glowMaterial()));
            const N = 12;
            const blobs = new THREE.InstancedMesh(shapes().pebble, blobMat, N);
            blobs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            blobs.frustumCulled = false;
            group.add(blobs);
            const drops = Array.from({ length: N }, () => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), s: 0 }));
            const m = new THREE.Matrix4(), still = new THREE.Quaternion(), size = new THREE.Vector3();
            let next = rand(1, 5);
            group.userData.update = (dt, t, camera) => {
                blobs.visible = inView(camera, t, home.x, 4, home.z, 7);
                next -= dt;
                if (next <= 0) {
                    drops.forEach(b => {
                        b.on = true;
                        b.p.set(rand(-0.2, 0.2), 1.3, rand(-0.2, 0.2));
                        b.v.set(rand(-1.6, 1.6), rand(6, 10), rand(-1.6, 1.6));
                        b.s = rand(0.15, 0.32);
                    });
                    next = rand(3, 7);
                }
                drops.forEach((b, i) => {
                    if (b.on) {
                        b.v.y -= 16 * dt;
                        b.p.addScaledVector(b.v, dt);
                        if (b.p.y < 0.1) b.on = false;
                    }
                    if (blobs.visible) blobs.setMatrixAt(i, m.compose(b.p, still, size.setScalar(b.on ? b.s : 0)));
                });
                if (blobs.visible) blobs.instanceMatrix.needsUpdate = true;
            };
            group.userData.disposables = [blobs];
            return group;
        });
    }

    // Small smoking volcanoes a little way past the fence
    function smokers(spec, fence, kept) {
        return spec.sides.map(side => {
            const geo = animalGeo(spec);
            const home = homeSpot(side, fence, 18, 26, kept, 10);
            kept.push(circle(home.x, home.z, 9));
            const group = new THREE.Group();
            group.position.set(home.x, 0, home.z);
            group.rotation.y = rand(0, TAU);
            group.add(new THREE.Mesh(geo.body, vertexColourMaterial()));
            group.add(new THREE.Mesh(geo.glow, glowMaterial()));
            const smoke = addSmoke(group, { y: 7.6, count: 5, life: 7, rise: 11, drift: 4, size: 2.5, grow: 6, opacity: 0.5 });
            group.userData.update = (dt, t, camera) => smoke.update(t, camera);
            group.userData.disposables = smoke.materials;
            return group;
        });
    }

    // The sea past the north fence (Seashell Shore): water whose edge washes in and out along a
    // wavy shore, a line of foam that follows it, and a band of wet sand. Waves roll in towards
    // the beach. At high tide the water comes to about 3 past the fence, never closer.
    function seas(spec, fence) {
        const SHORE = fence + 7; // the water's edge at low tide
        const W = 440, D = 170, SEG = 110;
        const waveTex = sceneryCached('seaWaves', () => {
            const S = 256;
            const [canvas, ctx] = makeCanvas(S, S);
            ctx.fillStyle = '#2f9fcf';
            ctx.fillRect(0, 0, S, S);
            // Wave crests: wobbly light lines across, each a whole number of wobbles wide (so the
            // texture tiles), drawn again a tile up and down so none are cut at the edges
            for (let k = 0; k < 6; k++) {
                const y0 = (k + Math.random() * 0.5) * S / 6, phase = Math.random() * Math.PI * 2;
                [[3, 'rgba(190, 235, 250, 0.55)', 0], [7, 'rgba(160, 220, 245, 0.22)', 6]].forEach(([width, colour, behind]) => {
                    ctx.strokeStyle = colour;
                    ctx.lineWidth = width;
                    for (const dy of [-S, 0, S]) {
                        ctx.beginPath();
                        for (let x = 0; x <= S; x += 4) {
                            const y = y0 + behind + dy + Math.sin(x / S * Math.PI * 4 + phase) * 6;
                            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }
                });
            }
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; // glints
            for (let i = 0; i < 120; i++) ctx.fillRect(Math.random() * S, Math.random() * S, 2, 1);
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(W / 18, D / 18);
            return tex;
        });
        // Foam: white and bubbly, strongest in the middle of the strip (the water's edge)
        const foamTex = sceneryCached('seaFoam', () => {
            const U = 256, V = 64;
            const [canvas, ctx] = makeCanvas(U, V);
            const img = ctx.createImageData(U, V);
            for (let y = 0; y < V; y++) {
                const v = 1 - y / (V - 1); // 0 on the sea side, 1 on the beach side
                const profile = v < 0.5 ? Math.pow(v / 0.5, 1.5) : Math.pow(1 - (v - 0.5) / 0.5, 2);
                for (let x = 0; x < U; x++) {
                    const i = (y * U + x) * 4;
                    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
                    img.data[i + 3] = 255 * profile * (0.5 + 0.5 * Math.random());
                }
            }
            ctx.putImageData(img, 0, 0);
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            return tex;
        });
        // Wet sand: darker, fading out up the beach
        const wetTex = sceneryCached('wetSand', () => {
            const [canvas, ctx] = makeCanvas(4, 64);
            const g = ctx.createLinearGradient(0, 0, 0, 64);
            g.addColorStop(0, 'rgba(190, 160, 110, 0.85)');  // top = the sea side
            g.addColorStop(1, 'rgba(190, 160, 110, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 4, 64);
            return new THREE.CanvasTexture(canvas);
        });

        const geo = new THREE.PlaneGeometry(W, D, SEG, 1);
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, 0.06, -(SHORE + D / 2));
        const pos = geo.attributes.position;
        const edge = []; // the points along the shore (the south row), west to east
        for (let i = 0; i < pos.count; i++) if (pos.getZ(i) > -(SHORE + 1)) edge.push(i);
        edge.sort((a, b) => pos.getX(a) - pos.getX(b));
        const waterMat = new THREE.MeshPhongMaterial({ map: waveTex, shininess: 80, specular: 0x9fd8f0 });
        const water = new THREE.Mesh(geo, waterMat);

        // Foam strip along the edge: two points per edge point, sea side then beach side
        const n = edge.length;
        const foamGeo = new THREE.BufferGeometry();
        const uvs = [], index = [];
        for (let k = 0; k < n; k++) {
            const u = pos.getX(edge[k]) / 8;
            uvs.push(u, 0, u, 1);
            if (k > 0) {
                const a = (k - 1) * 2;
                index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); // wound to face up
            }
        }
        foamGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 6), 3));
        foamGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        foamGeo.setIndex(index);
        foamGeo.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(n * 6).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3)); // all facing up
        const foamMat = makeDecalMaterial(foamTex, 'lit');
        const foam = new THREE.Mesh(foamGeo, foamMat);
        foam.frustumCulled = false; // its points move every frame; the whole sea is culled below instead

        const wetGeo = new THREE.PlaneGeometry(W, SHORE + 3 - (fence + 1.5));
        wetGeo.rotateX(-Math.PI / 2);
        wetGeo.translate(0, 0.03, -(fence + 1.5 + (SHORE + 3 - (fence + 1.5)) / 2));
        const wetMat = makeDecalMaterial(wetTex, 'lit');
        const wet = new THREE.Mesh(wetGeo, wetMat);
        wet.receiveShadow = true;

        const group = new THREE.Group();
        group.add(water, foam, wet);
        const fpos = foamGeo.attributes.position;
        const box = new THREE.Box3(new THREE.Vector3(-W / 2, -1, -(SHORE + D)), new THREE.Vector3(W / 2, 2, -(fence + 1)));
        group.userData.update = (dt, t, camera) => {
            group.visible = viewOf(camera, t).intersectsBox(box);
            if (!group.visible) return;
            const tide = Math.sin(t * 0.45) * 1.4;
            for (let k = 0; k < n; k++) {
                const i = edge[k], x = pos.getX(i);
                const z = -SHORE + 1.5 + tide + Math.sin(x * 0.07 + t * 0.6) * 0.8 + Math.sin(x * 0.21 - t * 0.9) * 0.35;
                pos.setZ(i, z);
                fpos.setXYZ(2 * k, x, 0.09, z - 1.4);
                fpos.setXYZ(2 * k + 1, x, 0.09, z + 0.9);
            }
            pos.needsUpdate = true;
            fpos.needsUpdate = true;
            waveTex.offset.y = (t * 0.04) % 1;       // waves rolling in
            foamMat.opacity = 0.8 + 0.15 * Math.sin(t * 0.45);
        };
        group.userData.disposables = [geo, waterMat, foamGeo, foamMat, wetGeo, wetMat];
        return [group];
    }

    // Sailing boats out at sea, drifting along and rocking on the waves. One that sails out of
    // sight comes back in on the far side, also out of sight.
    function sailboats(spec, fence) {
        return Array.from({ length: spec.count }, () => {
            const colour = pick(['#e53935', '#1e88e5', '#fdd835', '#43a047']);
            const boat = new THREE.Mesh(sceneryCached('sailboat' + colour, () => mergeParts(sailboat(colour))), vertexColourMaterial());
            boat.rotation.order = 'YXZ';
            boat.scale.setScalar(1.3);
            const z = -(fence + rand(16, 34)), speed = rand(0.8, 1.6) * (Math.random() < 0.5 ? 1 : -1), phase = rand(0, TAU);
            let x = rand(-100, 100);
            boat.userData.update = (dt, t, camera) => {
                x += speed * dt;
                if (x > camera.position.x + 120) x -= 240;
                if (x < camera.position.x - 120) x += 240;
                boat.position.set(x, 0.05 + Math.sin(t * 1.3 + phase) * 0.12, z);
                boat.rotation.set(Math.sin(t * 0.9 + phase) * 0.05, speed > 0 ? Math.PI / 2 : -Math.PI / 2, Math.sin(t * 1.1 + phase) * 0.08);
            };
            return boat;
        });
    }

    // Dolphins out at sea, leaping out of the water every few seconds, with a splash going in
    // and coming out
    function dolphins(spec, fence) {
        const geo = animalGeo(spec).body;
        const splashGeo = sceneryCached('splashRing', () => new THREE.RingGeometry(0.5, 1.0, 18).rotateX(-Math.PI / 2));
        return Array.from({ length: spec.count }, () => {
            const group = new THREE.Group();
            const body = animalMesh(geo);
            body.rotation.order = 'YXZ';
            body.visible = false;
            group.add(body);
            const splashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
            const splash = new THREE.Mesh(splashGeo, splashMat);
            group.add(splash);
            const z = -(fence + rand(13, 26));
            let x = rand(-60, 60), dir = Math.random() < 0.5 ? 1 : -1, wait = rand(0.5, 5), leap = -1, from = 0, splashAge = 9;
            const makeSplash = () => { splash.position.set(x, 0.1, z); splashAge = 0; };
            group.userData.update = dt => {
                splashAge += dt;
                splash.scale.setScalar(1 + splashAge * 2.5);
                splashMat.opacity = Math.max(0, 0.8 - splashAge * 1.2);
                splash.visible = splashMat.opacity > 0;
                if (leap < 0) {
                    wait -= dt;
                    if (wait <= 0) { leap = 0; from = x; body.visible = true; makeSplash(); }
                    return;
                }
                leap = Math.min(1, leap + dt / 1.3);
                x = from + dir * 8 * leap;
                body.position.set(x, -0.7 + Math.sin(Math.PI * leap) * 3.4, z);
                // Nose follows the arc: up coming out, down going in
                body.rotation.set(-Math.atan2(3.4 * Math.PI * Math.cos(Math.PI * leap), 8), dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
                if (leap >= 1) {
                    leap = -1;
                    wait = rand(2.5, 6);
                    body.visible = false;
                    makeSplash();
                    if (Math.abs(x) > 70) dir = x > 0 ? -1 : 1; // turn back before swimming off
                    else if (Math.random() < 0.3) dir = -dir;
                }
            };
            group.userData.disposables = [splashMat];
            return group;
        });
    }

    // Buoys bobbing just off the beach
    function buoys(spec, fence) {
        const geo = animalGeo(spec).body;
        return Array.from({ length: spec.count }, () => {
            const mesh = new THREE.Mesh(geo, vertexColourMaterial());
            const x = rand(-80, 80), z = -(fence + rand(10, 15)), phase = rand(0, TAU);
            mesh.userData.update = (dt, t) => {
                mesh.position.set(x, -0.2 + Math.sin(t * 1.6 + phase) * 0.15, z);
                mesh.rotation.set(Math.sin(t * 1.2 + phase) * 0.12, 0, Math.cos(t * 1.4 + phase) * 0.12);
            };
            return mesh;
        });
    }

    // Kites flying over the beach outside the east and west fences, their strings tied to the sand
    function kites(spec, fence, kept) {
        const stringMat = sceneryCached('kiteString', () => new THREE.LineBasicMaterial({ color: 0x555555 }));
        return spec.sides.map(side => {
            const colour = pick(['#e53935', '#1e88e5', '#fdd835', '#8e44ad', '#ff7043']);
            const kiteMesh = new THREE.Mesh(sceneryCached('kite' + colour, () => mergeParts(kite(colour))), vertexColourMaterial());
            const anchor = homeSpot(side, fence, 4, 10, kept, 3);
            kept.push(circle(anchor.x, anchor.z, 2));
            const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
            const line = new THREE.Line(lineGeo, stringMat);
            const group = new THREE.Group();
            group.add(kiteMesh, line);
            const phase = rand(0, TAU), lp = lineGeo.attributes.position;
            group.userData.update = (dt, t) => {
                kiteMesh.position.set(anchor.x + Math.sin(t * 0.6 + phase) * 2.2, 10.5 + Math.sin(t * 1.3 + phase) * 0.9, anchor.z + 4 + Math.cos(t * 0.45 + phase) * 1.5);
                kiteMesh.rotation.set(-0.35, Math.sin(t * 0.5 + phase) * 0.3, Math.sin(t * 1.7 + phase) * 0.25);
                lp.setXYZ(0, anchor.x, 0.3, anchor.z);
                lp.setXYZ(1, kiteMesh.position.x, kiteMesh.position.y - 1.2, kiteMesh.position.z);
                lp.needsUpdate = true;
                lineGeo.computeBoundingSphere(); // its ends move, so three.js can still tell when it's out of view
            };
            group.userData.disposables = [lineGeo];
            return group;
        });
    }

    // The chocolate river past the north fence (Sweetie Valley): glossy chocolate flowing east
    // between wavy banks, from `near` to `far` past the fence, with a darker edge of melted
    // chocolate along each bank
    const RIVER_FLOW = 1.3; // units/sec
    function chocolateRivers(spec, fence) {
        const NEAR = fence + spec.near, FAR = fence + spec.far, W = 440, SEG = 110;
        const tex = sceneryCached('chocolateRiver', () => {
            const S = 256;
            const [canvas, ctx] = makeCanvas(S, S);
            ctx.fillStyle = '#4e240d'; // darker than milk chocolate, as the pink fog lightens it
            ctx.fillRect(0, 0, S, S);
            // Streaks along the flow: wavy lighter and darker lines, each a whole number of waves
            // wide (so the texture tiles), drawn again a tile up and down so none are cut off
            for (let k = 0; k < 16; k++) {
                const y0 = Math.random() * S, phase = Math.random() * TAU, waves = 1 + Math.floor(Math.random() * 3);
                ctx.strokeStyle = k % 3 === 0 ? 'rgba(30, 12, 4, 0.4)' : 'rgba(130, 75, 38, 0.4)';
                ctx.lineWidth = 2 + Math.random() * 5;
                for (const dy of [-S, 0, S]) {
                    ctx.beginPath();
                    for (let x = 0; x <= S; x += 4) {
                        const y = y0 + dy + Math.sin(x / S * TAU * waves + phase) * 7;
                        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }
            }
            ctx.fillStyle = 'rgba(255, 225, 190, 0.45)'; // glossy glints
            for (let i = 0; i < 90; i++) ctx.fillRect(Math.random() * S, Math.random() * S, 3 + Math.random() * 6, 1.5);
            const t = new THREE.CanvasTexture(canvas);
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(W / 24, (FAR - NEAR) / 24);
            return t;
        });
        const bankTex = sceneryCached('chocolateBank', () => {
            const [canvas, ctx] = makeCanvas(4, 64);
            const g = ctx.createLinearGradient(0, 64, 0, 0); // bottom of the canvas = the river side
            g.addColorStop(0, 'rgba(60, 28, 10, 0.95)');
            g.addColorStop(0.45, 'rgba(75, 38, 16, 0.6)');
            g.addColorStop(1, 'rgba(75, 38, 16, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 4, 64);
            return new THREE.CanvasTexture(canvas);
        });

        // Wavy edges, fixed (the chocolate flows along them rather than washing in and out)
        const nearEdge = x => -NEAR + Math.sin(x * 0.09) * 0.8 + Math.sin(x * 0.23 + 1) * 0.3;
        const farEdge = x => -FAR + Math.sin(x * 0.07 + 2) * 0.9 + Math.sin(x * 0.19) * 0.35;
        const geo = new THREE.PlaneGeometry(W, FAR - NEAR, SEG, 2);
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, 0.07, -(NEAR + FAR) / 2);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), z = pos.getZ(i);
            if (Math.abs(z + NEAR) < 0.01) pos.setZ(i, nearEdge(x));
            else if (Math.abs(z + FAR) < 0.01) pos.setZ(i, farEdge(x));
        }
        geo.computeVertexNormals();
        const riverMat = new THREE.MeshPhongMaterial({ map: tex, shininess: 55, specular: 0x7a5038 });
        const river = new THREE.Mesh(geo, riverMat);
        river.receiveShadow = true;

        // A strip along a bank, from just under the river out onto the ground (outward: +1 = south)
        const bankGeo = (edge, outward) => {
            const positions = [], uvs = [], index = [];
            for (let k = 0; k <= SEG; k++) {
                const x = -W / 2 + W * k / SEG, z = edge(x);
                positions.push(x, 0.035, z - outward * 0.5, x, 0.035, z + outward * 1.7);
                uvs.push(0, 0, 0, 1);
                if (k > 0) {
                    const a = (k - 1) * 2;
                    if (outward > 0) index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
                    else index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
                }
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            g.setIndex(index);
            g.computeVertexNormals();
            return g;
        };
        const bankMat = makeDecalMaterial(bankTex, 'lit');
        const banks = [bankGeo(nearEdge, 1), bankGeo(farEdge, -1)].map(g => {
            const m = new THREE.Mesh(g, bankMat);
            m.receiveShadow = true;
            return m;
        });

        const group = new THREE.Group();
        group.add(river, ...banks);
        const box = new THREE.Box3(new THREE.Vector3(-W / 2, -1, -(FAR + 3)), new THREE.Vector3(W / 2, 1, -(NEAR - 3)));
        group.userData.update = (dt, t, camera) => {
            group.visible = viewOf(camera, t).intersectsBox(box);
            if (group.visible) tex.offset.x = (-t * RIVER_FLOW / 24) % 1; // flowing east
        };
        group.userData.disposables = [geo, riverMat, ...banks.map(b => b.geometry), bankMat];
        return [group];
    }

    // Marshmallows and biscuits floating down the chocolate river, bobbing as they go. One that
    // drifts out of sight comes back in on the far side, also out of sight.
    function floaters(spec, fence) {
        const NEAR = fence + spec.near + 1.5, FAR = fence + spec.far - 1.5;
        return Array.from({ length: spec.count }, (_, i) => {
            const kind = ['marshmallowWhite', 'marshmallowPink', 'biscuit'][i % 3];
            const mesh = new THREE.Mesh(sceneryCached('floater-' + kind, () => mergeParts(FLOATERS[kind]())), vertexColourMaterial());
            mesh.rotation.order = 'YXZ';
            const z = -rand(NEAR, FAR), speed = RIVER_FLOW * rand(0.8, 1.2), phase = rand(0, TAU), spin = rand(-0.3, 0.3);
            let x = rand(-100, 100);
            mesh.userData.update = (dt, t, camera) => {
                x += speed * dt;
                if (x > camera.position.x + 110) x -= 220;
                if (x < camera.position.x - 110) x += 220;
                mesh.position.set(x, 0.05 + Math.sin(t * 1.4 + phase) * 0.06, z);
                mesh.rotation.set(Math.sin(t * 1.1 + phase) * 0.07, phase + t * spin, Math.sin(t * 0.9 + phase) * 0.07);
            };
            return mesh;
        });
    }

    // Hot-air balloons (Cloud Kingdom). Most drift east with the wind past the north fence; one
    // that drifts out of sight comes back in on the far side, also out of sight. The rest hang over
    // the east and west sides, bobbing and turning slowly.
    function balloons(spec, fence) {
        return Array.from({ length: spec.count }, (_, i) => {
            const [a, b] = pick([['#e53935', '#fdd835'], ['#1e88e5', '#ffffff'], ['#8e24aa', '#ff9ccf'], ['#43a047', '#fdd835'], ['#ff9800', '#ffffff']]);
            const mesh = new THREE.Mesh(hotAirBalloonGeo(a, b), fluffMaterial());
            const drifting = i % 3 !== 2;
            const side = Math.random() < 0.5 ? 1 : -1;
            const z = drifting ? -(fence + rand(14, 34)) : rand(-fence, fence * 0.6);
            const xHome = side * (fence + rand(14, 26));
            const y = rand(5, 12), speed = rand(0.7, 1.3), phase = rand(0, TAU), size = rand(1.1, 1.5);
            mesh.scale.setScalar(size);
            let x = drifting ? rand(-100, 100) : xHome;
            mesh.userData.update = (dt, t, camera) => {
                if (drifting) {
                    x += speed * dt;
                    if (x > camera.position.x + 110) x -= 220;
                    if (x < camera.position.x - 110) x += 220;
                }
                mesh.position.set(x + (drifting ? 0 : Math.sin(t * 0.3 + phase) * 2), y + Math.sin(t * 0.8 + phase) * 0.4, z);
                mesh.rotation.y = t * 0.1 + phase;
            };
            return mesh;
        });
    }

    const ANIMAL_KINDS = {
        walker: walkers, hopper: hoppers, flock: flocks, roller: rollers, geyser: geysers, smoker: smokers,
        sea: seas, sailboat: sailboats, dolphin: dolphins, buoy: buoys, kite: kites,
        chocolateRiver: chocolateRivers, floater: floaters, balloon: balloons
    };

    // ---------- Shared props ----------

    // A tuft of thin blades leaning outwards (grass, dry grass, twigs)
    function tuft(colours, n, height, lean = 0.35) {
        return cluster(n, 0.2, (x, z) => {
            const h = height * rand(0.7, 1.15);
            return [part('spike', vary(pick(colours), 0.05), [x, h * 0.45, z], [0.06, h, 0.06], [lean * rand(0.5, 1.2), Math.atan2(x, z), 0])];
        });
    }

    function pebbles(colours, size = 0.25) {
        return cluster(randInt(2, 4), 0.5, (x, z) => {
            const s = size * rand(0.5, 1.2);
            return [part('pebble', vary(pick(colours), 0.05), [x, s * 0.3, z], [s, s * rand(0.5, 0.8), s * rand(0.8, 1.3)], [0, rand(0, TAU), 0])];
        });
    }

    function rockPile(colours, size) {
        return cluster(randInt(2, 3), size, (x, z) => {
            const s = size * rand(0.6, 1);
            return [part('rock', vary(pick(colours), 0.05), [x, s * 0.35, z], [s, s * rand(0.6, 0.85), s * rand(0.8, 1.2)], [rand(0, 0.5), rand(0, TAU), 0])];
        });
    }

    function mushrooms(capColours) {
        return cluster(randInt(2, 4), 0.35, (x, z) => {
            const h = rand(0.15, 0.3), r = rand(0.12, 0.2);
            return [
                part('cyl', '#efe6d2', [x, h / 2, z], [r * 0.35, h, r * 0.35]),
                part('dome', vary(pick(capColours), 0.05), [x, h * 0.85, z], [r, r * 0.7, r])
            ];
        });
    }

    function flowers(colours) {
        const colour = pick(colours);
        return cluster(randInt(5, 8), 0.7, (x, z) => {
            const h = rand(0.4, 0.6);
            return [
                part('stem', '#3f8f3a', [x, h / 2, z], [0.035, h, 0.035]),
                part('bloom', vary(Math.random() < 0.25 ? '#fbfbf2' : colour, 0.04), [x, h + 0.04, z], [0.2, 0.11, 0.2])
            ];
        });
    }

    function bush(colours, size = 1) {
        return cluster(randInt(2, 3), 0.6 * size, (x, z) => {
            const s = size * rand(0.6, 1.0);
            return [part('rock', vary(pick(colours)), [x, s * 0.5, z], [s, s * 0.8, s], [0, rand(0, TAU), 0])];
        });
    }

    // Small rounded heap (snow drifts, ash)
    const mound = (colour, w, h, d) => [part('dome', vary(colour, 0.03), [0, 0, 0], [rand(...w), rand(...h), rand(...d)])];
    // Low rolling hill, in a colour close to the ground's
    const hill = (colour, w, h, d) => () => [part('cap', vary(colour, 0.025), [0, 0, 0], [rand(...w), rand(...h), rand(...d)])];
    // Hills sit far enough out that their near edge stays 14 or more past the fence
    const hillLayer = (colour, height = [1.5, 3.5], sides) => ({ near: 30, far: 54, per100: 7, sides, prop: hill(colour, [10, 16], height, [8, 13]) });

    // ---------- Sunny Meadow ----------

    const meadowTree = () => [
        part('cyl', vary('#8B4513'), [0, 1, 0], [0.55, 2, 0.55]),
        part('cone', vary('#2E8B57', 0.05), [0, 4, 0], [2, 4, 2])
    ];

    const roundTree = () => {
        const h = rand(2.5, 3.5);
        return [
            part('cyl', vary('#7a4a26'), [0, h / 2, 0], [0.4, h, 0.4]),
            part('rock', vary('#3f9b4a'), [0, h + 1.2, 0], [2.3, 2.0, 2.3]),
            part('rock', vary('#4aa556'), [1.1, h + 0.6, 0.5], [1.5, 1.3, 1.5], [0, 1, 0]),
            part('rock', vary('#38903f'), [-1.0, h + 0.8, -0.4], [1.6, 1.4, 1.6], [0, 2, 0])
        ];
    };

    // A red barn facing south (towards the camera). 6 wide, 8 deep, 6.6 high.
    const barn = () => {
        const RED = vary('#b8402e', 0.04), TRIM = '#f2ede4', ROOF = '#5a4a44';
        return [
            part('box', RED, [0, 2.2, 0], [6, 4.4, 8]),
            part('prism', RED, [0, 5.13, 0], [3.46, 8, 1.47], [-Math.PI / 2, 0, 0]),
            part('box', ROOF, [1.5, 5.6, 0], [4.0, 0.25, 8.5], [0, 0, -0.633]),
            part('box', ROOF, [-1.5, 5.6, 0], [4.0, 0.25, 8.5], [0, 0, 0.633]),
            part('box', '#7a2a1e', [0, 1.6, 4.0], [2.6, 3.2, 0.1]),           // door
            part('box', TRIM, [0, 1.6, 4.06], [0.18, 3.6, 0.06], [0, 0, 0.68]), // white X on it
            part('box', TRIM, [0, 1.6, 4.06], [0.18, 3.6, 0.06], [0, 0, -0.68]),
            part('box', TRIM, [0, 3.25, 4.06], [2.9, 0.2, 0.06]),
            part('box', TRIM, [-1.35, 1.6, 4.06], [0.2, 3.3, 0.06]),
            part('box', TRIM, [1.35, 1.6, 4.06], [0.2, 3.3, 0.06]),
            part('box', TRIM, [0, 4.9, 4.03], [1.3, 1.1, 0.06]),               // hayloft window
            part('box', '#3a2a22', [0, 4.9, 4.07], [0.95, 0.75, 0.06])
        ];
    };

    const hayBale = () => [
        part('cyl', vary('#e0c05a', 0.04), [0, 0.8, 0], [0.8, 1.4, 0.8], [0, 0, Math.PI / 2]),
        part('cyl', '#c9a94a', [0, 0.8, 0], [0.82, 0.1, 0.82], [0, 0, Math.PI / 2])
    ];

    // No pink or red flowers in the meadow: the coins there are pink and the raspberries red
    const MEADOW_FLOWERS = ['#f6d33c', '#a48be6', '#6fa3f5', '#fbfbf2'];
    const meadowTuft = () => tuft(['#4f9a3a', '#5aa845', '#3f8a32'], randInt(5, 7), 0.55);

    // Cow, facing +z, about 2.2 tall
    const cow = () => {
        const W = '#f4f1ea', B = '#2b2b2b', PINK = '#e7a7a0';
        const body = [
            part('box', W, [0, 1.35, 0], [1.25, 1.05, 2.3]),
            part('box', B, [0.05, 1.5, -0.45], [1.27, 0.6, 0.8]),
            part('box', B, [-0.1, 1.2, 0.6], [1.27, 0.5, 0.55]),
            part('box', B, [0.25, 1.88, 0.15], [0.55, 0.02, 0.7]),
            part('box', PINK, [0, 0.75, -0.55], [0.45, 0.25, 0.4]),          // udder
            part('box', W, [0, 1.35, -1.2], [0.08, 0.9, 0.08], [0.2, 0, 0]),   // tail
            part('box', B, [0, 0.88, -1.27], [0.15, 0.22, 0.15])
        ];
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
            body.push(part('box', '#ebe7df', [sx * 0.4, 0.45, sz * 0.8], [0.28, 0.85, 0.28]),
                      part('box', '#3a3030', [sx * 0.4, 0.06, sz * 0.8], [0.3, 0.12, 0.3]));
        });
        const head = [
            part('box', W, [0, 0.05, 0.45], [0.7, 0.7, 0.85]),
            part('box', B, [0.12, 0.2, 0.5], [0.72, 0.4, 0.45]),
            part('box', PINK, [0, -0.15, 0.92], [0.62, 0.38, 0.22]),
            part('box', '#1a1a1a', [-0.36, 0.18, 0.66], [0.06, 0.12, 0.12]),
            part('box', '#1a1a1a', [0.36, 0.18, 0.66], [0.06, 0.12, 0.12]),
            part('box', B, [-0.5, 0.25, 0.3], [0.35, 0.12, 0.2], [0, 0, 0.3]),
            part('box', B, [0.5, 0.25, 0.3], [0.35, 0.12, 0.2], [0, 0, -0.3]),
            part('spike', '#efe2c4', [-0.25, 0.5, 0.3], [0.07, 0.28, 0.07], [0, 0, 0.4]),
            part('spike', '#efe2c4', [0.25, 0.5, 0.3], [0.07, 0.28, 0.07], [0, 0, -0.4])
        ];
        return { body, head, neck: [0, 1.6, 1.1] };
    };

    // Rabbit (or hare), facing +z, about 1.2 tall
    const rabbit = (fur, earTip) => () => {
        const body = [
            part('ball', fur, [0, 0.38, -0.05], [0.38, 0.34, 0.5]),
            part('ball', fur, [0, 0.68, 0.32], [0.26, 0.24, 0.28]),
            part('box', fur, [-0.09, 1.0, 0.24], [0.08, 0.42, 0.14], [-0.2, 0, 0.12]),
            part('box', fur, [0.09, 1.0, 0.24], [0.08, 0.42, 0.14], [-0.2, 0, -0.12]),
            part('ball', '#f2eee6', [0, 0.45, -0.52], 0.13),
            part('box', '#1a1a1a', [-0.17, 0.74, 0.45], [0.04, 0.06, 0.06]),
            part('box', '#1a1a1a', [0.17, 0.74, 0.45], [0.04, 0.06, 0.06]),
            part('ball', '#e7a0a0', [0, 0.66, 0.59], 0.045)
        ];
        if (earTip) {
            body.push(part('box', earTip, [-0.115, 1.19, 0.2], [0.085, 0.1, 0.145], [-0.2, 0, 0.12]),
                      part('box', earTip, [0.115, 1.19, 0.2], [0.085, 0.1, 0.145], [-0.2, 0, -0.12]));
        }
        return { body };
    };

    // A bird for flocks, facing +z, wings 2.6 across. c: { body, head, wing, tip, beak }
    const bird = c => () => ({
        body: [
            part('ball', c.body, [0, 0, 0], [0.22, 0.2, 0.55]),
            part('ball', c.head, [0, 0.1, 0.48], 0.17),
            part('spike', c.beak, [0, 0.08, 0.7], [0.05, 0.2, 0.05], [Math.PI / 2, 0, 0]),
            part('box', c.wing, [0, 0.02, -0.62], [0.32, 0.03, 0.34])
        ],
        left: [part('box', c.wing, [0.55, 0, 0], [1.0, 0.04, 0.4]), part('box', c.tip, [1.25, 0, -0.06], [0.45, 0.035, 0.3])],
        right: [part('box', c.wing, [-0.55, 0, 0], [1.0, 0.04, 0.4]), part('box', c.tip, [-1.25, 0, -0.06], [0.45, 0.035, 0.3])]
    });

    // ---------- Dusty Desert ----------

    const cactus = () => {
        const G = vary('#2E8B57', 0.04);
        const parts = [part('cyl', G, [0, 2, 0], [0.45, 4, 0.45]), part('dome', G, [0, 4, 0], [0.45, 0.3, 0.45])];
        [-1, 1].forEach(s => {
            if (Math.random() < 0.75) {
                const y = rand(1.4, 2.6);
                parts.push(part('cyl', G, [s * 0.75, y, 0], [0.28, 1.1, 0.28], [0, 0, Math.PI / 2]),
                           part('cyl', G, [s * 1.25, y + 0.65, 0], [0.28, 1.5, 0.28]),
                           part('dome', G, [s * 1.25, y + 1.4, 0], [0.28, 0.2, 0.28]));
            }
        });
        return parts;
    };

    // Flat-topped rock with coloured bands
    const mesa = () => {
        const h = rand(7, 14), r = rand(4, 8), k = rand(0.65, 1);
        return [
            part('cyl', vary('#c9824e', 0.04), [0, h * 0.35, 0], [r, h * 0.7, r * k]),
            part('cyl', vary('#b56f42', 0.04), [0, h * 0.78, 0], [r * 0.93, h * 0.16, r * k * 0.93]),
            part('cyl', vary('#dca06a', 0.04), [0, h * 0.93, 0], [r * 0.87, h * 0.14, r * k * 0.87])
        ];
    };

    const DESERT_STONE = ['#b09270', '#9a7d5e', '#c8ad88'];
    const dryTuft = () => tuft(['#c9b06b', '#b39a58', '#d8c27e'], randInt(6, 8), 0.6, 0.5);
    const twigBush = () => cluster(randInt(4, 6), 0.1, () => {
        const h = rand(0.5, 0.9);
        return [part('cyl', vary('#8a6a42'), [0, h * 0.45, 0], [0.03, h, 0.03], [rand(0.3, 0.8), rand(0, TAU), 0])];
    });

    // Bleached cow skull with horns
    const skull = () => {
        const BONE = '#efe8d6';
        return [
            part('box', BONE, [0, 0.16, 0], [0.4, 0.28, 0.5]),
            part('box', BONE, [0, 0.11, 0.33], [0.26, 0.18, 0.3]),
            part('box', '#5a4a3a', [-0.11, 0.24, 0.2], [0.1, 0.08, 0.08]),
            part('box', '#5a4a3a', [0.11, 0.24, 0.2], [0.1, 0.08, 0.08]),
            part('spike', '#e3d6b8', [-0.32, 0.24, -0.1], [0.07, 0.42, 0.07], [0, 0, 1.2]),
            part('spike', '#e3d6b8', [0.32, 0.24, -0.1], [0.07, 0.42, 0.07], [0, 0, -1.2])
        ];
    };

    // Camel, facing +z, about 3.3 tall
    const camel = () => {
        const C = '#c9a26b', D = '#b08654';
        const body = [
            part('box', C, [0, 2.3, 0], [1.1, 1.0, 2.3]),
            part('ball', '#c29660', [0, 2.85, -0.15], [0.6, 0.6, 0.8]),
            part('box', C, [0, 2.15, -1.2], [0.08, 0.8, 0.08], [0.25, 0, 0])
        ];
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
            body.push(part('box', D, [sx * 0.35, 0.95, sz * 0.85], [0.25, 1.9, 0.25]),
                      part('box', '#8f6e45', [sx * 0.35, 0.06, sz * 0.85], [0.34, 0.12, 0.34]));
        });
        const head = [
            part('box', C, [0, 0.55, 0.35], [0.35, 1.3, 0.4], [0.55, 0, 0]),
            part('box', C, [0, 1.15, 0.95], [0.4, 0.4, 0.8]),
            part('box', D, [0, 1.08, 1.38], [0.34, 0.3, 0.15]),
            part('box', D, [-0.14, 1.4, 0.72], [0.08, 0.18, 0.08]),
            part('box', D, [0.14, 1.4, 0.72], [0.08, 0.18, 0.08]),
            part('box', '#1a1a1a', [-0.21, 1.25, 1.05], [0.04, 0.08, 0.08]),
            part('box', '#1a1a1a', [0.21, 1.25, 1.05], [0.04, 0.08, 0.08])
        ];
        return { body, head, neck: [0, 2.55, 1.05] };
    };

    const tumbleweed = () => {
        const body = [
            part('rock', '#a8804a', [0, 0, 0], 0.7),
            part('rock', '#8f6a3c', [0, 0, 0], [0.62, 0.75, 0.62], [0.6, 0.3, 0.2])
        ];
        for (let i = 0; i < 8; i++) {
            body.push(part('cyl', '#9a7444', [0, 0, 0], [0.035, 1.75, 0.035], [rand(0, Math.PI), rand(0, TAU), rand(0, Math.PI)]));
        }
        return { body };
    };

    // ---------- Snowy Peaks ----------

    const snowPine = () => {
        const parts = [part('cyl', vary('#6b4a2b'), [0, 0.8, 0], [0.35, 1.6, 0.35])];
        [[2.0, 2.6, 2.5], [1.5, 2.2, 3.9], [1.0, 1.8, 5.1]].forEach(([r, h, y]) => {
            parts.push(part('cone', vary('#2f6b4f', 0.04), [0, y, 0], [r, h, r]),
                       part('cone', '#f4f8fc', [0, y + h / 2 - h * 0.21, 0], [r * 0.47, h * 0.44, r * 0.47]));
        });
        return parts;
    };

    const snowman = () => {
        const SNOW = '#f8fbff', COAL = '#222222';
        return [
            part('ball', SNOW, [0, 0.8, 0], 0.9),
            part('ball', SNOW, [0, 2.0, 0], 0.65),
            part('ball', SNOW, [0, 2.95, 0], 0.45),
            part('cyl', '#d0473a', [0, 2.52, 0], [0.5, 0.16, 0.5]),           // scarf
            part('pebble', COAL, [-0.16, 3.05, 0.4], 0.06),
            part('pebble', COAL, [0.16, 3.05, 0.4], 0.06),
            part('spike', '#f08a24', [0, 2.92, 0.62], [0.08, 0.42, 0.08], [Math.PI / 2, 0, 0]),
            part('pebble', COAL, [0, 2.15, 0.63], 0.07),
            part('pebble', COAL, [0, 1.85, 0.63], 0.07),
            part('cyl', '#6b4a2b', [-0.9, 2.2, 0], [0.04, 0.9, 0.04], [0, 0, 1.0]),
            part('cyl', '#6b4a2b', [0.9, 2.2, 0], [0.04, 0.9, 0.04], [0, 0, -1.0]),
            part('cyl', COAL, [0, 3.45, 0], [0.32, 0.45, 0.32]),               // hat
            part('cyl', COAL, [0, 3.25, 0], [0.48, 0.05, 0.48])
        ];
    };

    const SNOW_ROCK = ['#7d8590', '#8a919b', '#6f7782'];
    const snowyRock = (size = 0.4) => {
        const s = size * rand(0.7, 1.2);
        return [
            part('rock', vary(pick(SNOW_ROCK), 0.04), [0, s * 0.35, 0], [s, s * 0.7, s * 1.1], [0.3, rand(0, TAU), 0]),
            part('dome', '#f4f8fc', [0, s * 0.62, 0], [s * 0.85, s * 0.35, s * 0.95])
        ];
    };
    const snowDrift = () => mound('#f2f7fc', [0.8, 1.5], [0.2, 0.4], [0.6, 1.0]);
    const sapling = () => [
        part('cone', vary('#2f6b4f', 0.04), [0, 0.45, 0], [0.4, 0.9, 0.4]),
        part('cone', '#f4f8fc', [0, 0.78, 0], [0.17, 0.3, 0.17])
    ];

    // Reindeer, facing +z, about 2.6 tall with antlers
    const reindeer = () => {
        const FUR = '#8a5a3a', PALE = '#ebe1d1', ANTLER = '#e3d3b0';
        const body = [
            part('box', FUR, [0, 1.45, 0], [0.95, 0.9, 1.9]),
            part('box', PALE, [0, 1.12, 0], [0.97, 0.26, 1.6]),
            part('box', PALE, [0, 1.75, -0.98], [0.3, 0.32, 0.1])
        ];
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
            body.push(part('box', '#6e472d', [sx * 0.3, 0.55, sz * 0.7], [0.18, 1.1, 0.18]));
        });
        const head = [
            part('box', FUR, [0, 0.35, 0.2], [0.35, 0.8, 0.4], [0.5, 0, 0]),
            part('box', FUR, [0, 0.75, 0.55], [0.38, 0.38, 0.7]),
            part('box', '#3a2a22', [0, 0.68, 0.92], [0.24, 0.22, 0.12]),
            part('box', '#1a1a1a', [-0.2, 0.82, 0.68], [0.04, 0.07, 0.07]),
            part('box', '#1a1a1a', [0.2, 0.82, 0.68], [0.04, 0.07, 0.07]),
            part('box', FUR, [-0.28, 0.9, 0.42], [0.25, 0.08, 0.12], [0, 0, 0.4]),
            part('box', FUR, [0.28, 0.9, 0.42], [0.25, 0.08, 0.12], [0, 0, -0.4])
        ];
        [-1, 1].forEach(s => head.push(
            part('cyl', ANTLER, [s * 0.34, 1.34, 0.45], [0.045, 0.9, 0.045], [0, 0, -s * 0.5]),
            part('cyl', ANTLER, [s * 0.4, 1.5, 0.58], [0.035, 0.42, 0.035], [0.6, 0, -s * 0.15]),
            part('cyl', ANTLER, [s * 0.62, 1.72, 0.4], [0.035, 0.38, 0.035], [0.2, 0, -s * 0.9])
        ));
        return { body, head, neck: [0, 1.8, 0.9] };
    };

    // ---------- Jungle Jumble ----------

    const JUNGLE_LEAF = ['#2d6b34', '#3a7d3c', '#255e2c', '#357a3a'];
    const canopyTree = () => {
        const h = rand(6, 9);
        return [
            part('cyl', vary('#6b4a2b'), [0, h / 2, 0], [0.5, h, 0.5]),
            part('rock', vary(JUNGLE_LEAF[0]), [0, h + 0.8, 0], [3, 2.2, 3]),
            part('rock', vary(JUNGLE_LEAF[1]), [1.8, h + 0.2, 0.6], 2, [0, 1, 0]),
            part('rock', vary(JUNGLE_LEAF[2]), [-1.6, h + 0.4, -0.8], 2.2, [0, 2, 0]),
            part('rock', vary(JUNGLE_LEAF[3]), [0.3, h + 1.8, -0.6], 1.8, [0, 3, 0])
        ];
    };

    // Same shape as the palm trees in the arena
    const palm = () => {
        const parts = [part('cyl', vary('#A0522D'), [0.35, 2.5, 0], [0.42, 5, 0.42], [0, 0, -0.15])];
        [0, 1.05, 2.09, 3.14, 4.19, 5.24].forEach(a => {
            parts.push(part('cone', vary('#228B22', 0.04), [0.7 + Math.cos(a) * 1.1, 5.2, Math.sin(a) * 1.1], [1.2, 2.2, 1.2],
                [Math.sin(a) * 0.7, 0, Math.cos(a) * 0.7]));
        });
        return parts;
    };

    // Low spreading fern: darker than the bright grass tufts the jungle's gold coins are
    const fern = () => {
        const n = randInt(5, 7), colour = pick(['#3f8a42', '#4a9448', '#358038']);
        const parts = [];
        for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU + rand(-0.2, 0.2), len = rand(0.7, 1.0);
            parts.push(part('box', vary(colour, 0.04), [Math.sin(a) * len * 0.45, 0.16, Math.cos(a) * len * 0.45], [0.2, 0.03, len], [-0.4, a, 0]));
        }
        return parts;
    };

    const mossyRock = () => {
        const s = rand(0.35, 0.6);
        return [
            part('rock', vary('#7a7d72', 0.05), [0, s * 0.35, 0], [s, s * 0.7, s * 1.1], [0.2, rand(0, TAU), 0]),
            part('dome', vary('#4a7a3a', 0.04), [0, s * 0.6, 0], [s * 0.8, s * 0.3, s * 0.9])
        ];
    };

    const root = () => [
        part('cyl', vary('#5a3d24'), [0, 0.1, 0], [0.12, rand(1.2, 1.8), 0.12], [0, 0, Math.PI / 2]),
        part('cyl', '#5a3d24', [0.3, 0.2, 0.2], [0.07, 0.6, 0.07], [0.9, 0.5, 0])
    ];

    // Elephant, facing +z, about 4 tall
    const elephant = () => {
        const G = '#8e8e96', D = '#85858d';
        const body = [
            part('ball', G, [0, 2.5, 0], [1.45, 1.35, 2.0]),
            part('box', G, [0, 2.4, -2.0], [0.08, 1.0, 0.08], [0.3, 0, 0])
        ];
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
            body.push(part('cyl', D, [sx * 0.75, 0.95, sz * 1.0], [0.42, 1.9, 0.42]));
        });
        const head = [
            part('ball', G, [0, 0.1, 0.45], [0.95, 0.95, 0.85]),
            part('box', D, [-0.95, 0.05, 0.15], [0.12, 1.4, 1.1], [0, -0.35, 0]),
            part('box', D, [0.95, 0.05, 0.15], [0.12, 1.4, 1.1], [0, 0.35, 0]),
            part('cyl', G, [0, -0.45, 1.15], [0.28, 0.9, 0.28], [0.25, 0, 0]),
            part('cyl', G, [0, -1.2, 1.3], [0.22, 0.8, 0.22], [0.05, 0, 0]),
            part('cyl', G, [0, -1.7, 1.45], [0.17, 0.5, 0.17], [-0.5, 0, 0]),
            part('spike', '#f2ead8', [-0.35, -0.5, 1.15], [0.08, 0.6, 0.08], [1.2, 0, 0]),
            part('spike', '#f2ead8', [0.35, -0.5, 1.15], [0.08, 0.6, 0.08], [1.2, 0, 0]),
            part('box', '#1a1a1a', [-0.5, 0.3, 0.92], [0.06, 0.1, 0.1]),
            part('box', '#1a1a1a', [0.5, 0.3, 0.92], [0.06, 0.1, 0.1])
        ];
        return { body, head, neck: [0, 3.0, 1.6] };
    };

    // ---------- Volcano Valley ----------

    const DARK_ROCK = ['#2b2522', '#3a302a', '#463a32'];
    const spires = () => cluster(randInt(1, 3), 2.5, (x, z) => {
        const h = rand(5, 14), r = rand(1.2, 3);
        return [part('spike', vary(pick(['#2e2420', '#3b2e26', '#33281f']), 0.04), [x, h / 2, z], [r, h, r], [rand(-0.1, 0.1), rand(0, TAU), rand(-0.1, 0.1)])];
    });
    const ridge = () => [part('rock', vary('#3a2c24', 0.04), [0, 0.3, 0], [rand(4, 8), rand(1.2, 2.6), rand(3, 5)], [0, 0, rand(-0.1, 0.1)])];
    const deadTree = () => {
        const h = rand(2.5, 4);
        return [
            part('cyl', '#2a201c', [0, h / 2, 0], [0.22, h, 0.22], [0, 0, rand(-0.1, 0.1)]),
            part('cyl', '#2a201c', [0.45, h * 0.7, 0], [0.09, 1.2, 0.09], [0, 0, -0.8]),
            part('cyl', '#2a201c', [-0.35, h * 0.55, 0.1], [0.08, 1.0, 0.08], [0.2, 0, 0.9])
        ];
    };

    // A pool of glowing lava with a dark crust round it (the glow is unlit, so it shines in the gloom)
    const lavaPool = () => {
        const w = rand(1.5, 3), d = rand(1.0, 2.0);
        return {
            parts: cluster(randInt(4, 6), 0.1, (x, z, i) => {
                const a = (i / 5) * TAU, s = rand(0.35, 0.6);
                return [part('rock', vary(pick(DARK_ROCK), 0.04), [Math.sin(a) * w, s * 0.3, Math.cos(a) * d], [s, s * 0.6, s])];
            }),
            glow: [part('cyl', '#ff7a1a', [0, 0.04, 0], [w, 0.06, d]), part('cyl', '#ffc04a', [0, 0.06, 0], [w * 0.5, 0.06, d * 0.5])]
        };
    };

    const ashMound = () => mound('#5e5652', [0.6, 1.1], [0.2, 0.35], [0.5, 0.9]);
    // Black glassy spikes (cone-shaped, so they can't be taken for the rubies and diamonds)
    const shards = () => cluster(randInt(2, 4), 0.25, (x, z) => {
        const h = rand(0.35, 0.7);
        return [part('spike', vary('#1c1618', 0.03), [x, h * 0.4, z], [rand(0.08, 0.14), h, rand(0.08, 0.14)], [rand(0.2, 0.5), rand(0, TAU), 0])];
    });
    const stump = () => [
        part('cyl', '#2a1f1a', [0, 0.25, 0], [0.25, 0.5, 0.25]),
        part('cyl', '#2a1f1a', [0.2, 0.45, 0], [0.06, 0.4, 0.06], [0, 0, -0.7])
    ];

    const geyser = () => {
        const body = [part('crater', '#2e2420', [0, 0.6, 0], [1.4, 1.2, 1.4])];
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * TAU;
            body.push(part('rock', pick(DARK_ROCK), [Math.sin(a) * 1.5, 0.2, Math.cos(a) * 1.5], [0.45, 0.35, 0.45], [0, a, 0]));
        }
        return { body, glow: mergeParts([part('cyl', '#ffb030', [0, 1.21, 0], [0.38, 0.02, 0.38])]) };
    };

    const smallVolcano = () => ({
        body: mergeParts([
            part('crater', '#3a2a22', [0, 3.5, 0], [7, 7, 7]),
            part('rock', '#2e221c', [4, 0.8, 2], [3, 2, 2.5]),
            part('rock', '#33271f', [-3.5, 0.6, -2.5], [2.5, 1.6, 2])
        ]),
        glow: mergeParts([
            part('cyl', '#ff7a1a', [0, 7.0, 0], [1.9, 0.05, 1.9]),
            part('box', '#ff6a10', [0, 4.65, 3.82], [0.35, 5.7, 0.1], [-0.61, 0, 0]) // lava down the front
        ])
    });

    // ---------- Seashell Shore ----------
    // No shells, starfish or balls out here: those are the beach's collectables and bonus items

    const SHORE_ROCK = ['#8d8a84', '#7a7771', '#9a968f'];
    const duneGrass = (height = 0.8) => tuft(['#b9b77a', '#a8a868', '#c8c48a'], randInt(6, 9), height, 0.4);
    const driftwood = () => [
        part('cyl', vary('#a89a88', 0.05), [0, 0.12, 0], [0.12, rand(1.4, 2.4), 0.12], [0, 0, Math.PI / 2]),
        part('cyl', '#9a8c7a', [0.4, 0.2, 0.25], [0.07, 0.7, 0.07], [0.9, 0.6, 0])
    ];
    // Seaweed washed up on the sand: dark strands lying flat
    const seaweed = () => cluster(randInt(4, 6), 0.25, (x, z) => [
        part('box', vary(pick(['#4f5f26', '#5a6b2e', '#45532a']), 0.04), [x, 0.03, z], [0.12, 0.04, rand(0.5, 0.9)], [0, rand(0, TAU), 0])
    ]);
    const towel = () => {
        const colour = pick(['#e53935', '#1e88e5', '#fdd835', '#43a047', '#ff7043']);
        const parts = [];
        for (let k = 0; k < 5; k++) parts.push(part('box', k % 2 ? '#ffffff' : colour, [0, 0.025, -0.9 + k * 0.45], [1.2, 0.04, 0.45]));
        return parts;
    };
    // Striped beach hut, door facing the camera
    const beachHut = () => {
        const parts = [
            part('box', vary(pick(['#4fa3e0', '#e85a5a', '#f2c94c', '#6fcf97', '#f28cc0']), 0.03), [0, 1.3, 0], [2.4, 2.6, 2.4]),
            part('prism', '#f4f1ea', [0, 2.93, 0], [1.55, 2.7, 0.67], [-Math.PI / 2, 0, 0]),
            part('box', '#f4f1ea', [0, 0.85, 1.23], [0.95, 1.7, 0.05]),
            part('box', '#7a5532', [0, 0.1, 1.55], [1.2, 0.2, 0.6])
        ];
        for (let k = 0; k < 4; k++) parts.push(part('box', '#ffffff', [-1.05 + k * 0.7, 1.3, 1.215], [0.22, 2.6, 0.04]));
        return parts;
    };

    // Sailing boat, facing +z: white hull with a coloured stripe and jib
    const sailboat = colour => [
        part('box', '#f4f4f0', [0, 0.3, 0], [1.2, 0.6, 3.0]),
        part('spike', '#f4f4f0', [0, 0.3, 1.85], [0.6, 0.8, 0.3], [Math.PI / 2, 0, 0]),
        part('box', colour, [0, 0.55, 0], [1.24, 0.14, 3.04]),
        part('cyl', '#8a6a42', [0, 2.6, -0.2], [0.06, 4.4, 0.06]),
        part('spike', '#ffffff', [0, 2.5, -0.85], [0.04, 3.6, 1.25]), // a cone squashed flat is a triangular sail
        part('spike', colour, [0, 1.9, 0.75], [0.04, 2.5, 0.75])
    ];

    // Dolphin, facing +z, 4 long
    const dolphin = () => ({ body: [
        part('ball', '#6f8fa8', [0, 0, 0], [0.55, 0.55, 1.6]),
        part('ball', '#d8e4ec', [0, -0.18, 0.1], [0.45, 0.35, 1.3]),
        part('cone', '#6f8fa8', [0, -0.05, 1.75], [0.2, 0.6, 0.2], [Math.PI / 2, 0, 0]),
        part('spike', '#5f7f98', [0, 0.62, -0.15], [0.08, 0.6, 0.4], [-0.5, 0, 0]),
        part('cone', '#6f8fa8', [0, 0, -1.55], [0.3, 0.9, 0.3], [-Math.PI / 2, 0, 0]),
        part('box', '#5f7f98', [0, 0, -2.0], [1.3, 0.06, 0.45]),
        part('box', '#5f7f98', [-0.5, -0.3, 0.5], [0.5, 0.05, 0.25], [0, 0, 0.5]),
        part('box', '#5f7f98', [0.5, -0.3, 0.5], [0.5, 0.05, 0.25], [0, 0, -0.5]),
        part('box', '#1a1a1a', [-0.38, 0.12, 1.05], [0.05, 0.07, 0.07]),
        part('box', '#1a1a1a', [0.38, 0.12, 1.05], [0.05, 0.07, 0.07])
    ]});

    const buoy = () => ({ body: [
        part('cyl', '#e53935', [0, 0.5, 0], [0.45, 1.0, 0.45]),
        part('cyl', '#ffffff', [0, 0.85, 0], [0.47, 0.25, 0.47]),
        part('cone', '#e53935', [0, 1.35, 0], [0.4, 0.6, 0.4]),
        part('pebble', '#ffe066', [0, 1.75, 0], 0.13)
    ]});

    // Seal lying on the sand, facing +z; it galumphs about as a hopper with tiny hops
    const seal = () => ({ body: [
        part('ball', '#8a8078', [0, 0.4, -0.1], [0.5, 0.4, 0.95]),
        part('ball', '#8a8078', [0, 0.72, 0.68], 0.32),
        part('ball', '#a8a096', [0, 0.66, 0.96], [0.16, 0.12, 0.14]),
        part('pebble', '#1a1a1a', [0, 0.72, 1.08], 0.05),
        part('box', '#1a1a1a', [-0.15, 0.84, 0.9], [0.05, 0.07, 0.05]),
        part('box', '#1a1a1a', [0.15, 0.84, 0.9], [0.05, 0.07, 0.05]),
        part('box', '#7a7068', [-0.45, 0.12, 0.35], [0.35, 0.06, 0.25], [0, 0, 0.3]),
        part('box', '#7a7068', [0.45, 0.12, 0.35], [0.35, 0.06, 0.25], [0, 0, -0.3]),
        part('box', '#7a7068', [-0.15, 0.1, -1.0], [0.3, 0.05, 0.35], [0, 0.5, 0]),
        part('box', '#7a7068', [0.15, 0.1, -1.0], [0.3, 0.05, 0.35], [0, -0.5, 0])
    ]});

    // Diamond kite with a bow tail, facing +z
    const kite = colour => [
        part('octa', colour, [0, 0, 0], [0.95, 1.35, 0.05]),
        part('box', '#5a3d24', [0, 0, 0.06], [0.05, 2.7, 0.05]),
        part('box', '#5a3d24', [0, 0.3, 0.06], [1.9, 0.05, 0.05]),
        part('box', '#666666', [0, -2.2, 0], [0.02, 1.8, 0.02]),
        ...[-1.6, -2.1, -2.6, -3.1].map((y, i) => part('box', i % 2 ? '#ffffff' : colour, [0, y, 0], [0.32, 0.12, 0.04]))
    ];

    // ---------- Sweetie Valley ----------
    // Inside the fence, nothing here is shaped or coloured like a jelly bean, a jelly blob or a
    // cupcake: the detail is mint grass, white meringues, chocolate chips and flat peppermints.

    const SWEET_COLOURS = ['#ff4f9a', '#ffd93a', '#35b8ff', '#6fd13a', '#a35cff', '#ff8a1f'];
    const LOLLY_PAIRS = [['#ffffff', '#ff4f9a'], ['#ffd93a', '#ff8a1f'], ['#ffffff', '#2fbfa8'], ['#ffffff', '#a35cff'], ['#ff9ac8', '#ffffff']];
    const CANE_COLOURS = [['#ffffff', '#e5283a'], ['#ffffff', '#2fae4a'], ['#ffffff', '#ff7ab8']];
    const STICK = '#fdf8f2';

    // A giant lollipop on a stick: mostly swirls facing the camera, some round
    const bigLollipop = () => {
        const h = rand(3, 5);
        const stick = part('cyl', STICK, [0, h / 2, 0], [0.16, h, 0.16]);
        if (Math.random() < 0.3) {
            const r = rand(0.9, 1.3);
            return [stick, part(sceneryCached('smoothBall', () => new THREE.SphereGeometry(1, 12, 8)), vary(pick(SWEET_COLOURS), 0.04), [0, h + r * 0.9, 0], r)];
        }
        const r = rand(1.3, 1.9), [a, b] = pick(LOLLY_PAIRS);
        return [stick, part(lollipopSwirlGeo(1, a, b), undefined, [0, h + r * 0.95, 0], r, [-0.2, 0, 0])];
    };

    const bigCane = () => [part(candyCaneGeo(5, 0.3, pick(CANE_COLOURS)), undefined, [-0.45, 0, 0])];

    // Wrapped sweet lying on the grass, its wrapper twisted at both ends
    const wrappedSweet = () => {
        const c = pick(SWEET_COLOURS), s = rand(0.35, 0.5);
        return [
            part('ball', c, [0, s * 0.8, 0], [s * 1.2, s * 0.8, s * 0.8]),
            part('spike', c, [s * 1.55, s * 0.8, 0], [s * 0.55, s * 0.7, s * 0.55], [0, 0, Math.PI / 2]),
            part('spike', c, [-s * 1.55, s * 0.8, 0], [s * 0.55, s * 0.7, s * 0.55], [0, 0, -Math.PI / 2])
        ];
    };

    // A peppermint lying flat
    const peppermint = (size = 0.45) => [part(lollipopSwirlGeo(1, '#ffffff', '#e5283a', 2), undefined, [0, 0.07, 0], size, [-Math.PI / 2, 0, 0])];

    const donut = () => [
        part('donut', '#d9a35c', [0, 0.36, 0], 0.8, [Math.PI / 2, 0, 0]),
        part('donut', pick(['#ff9ac8', '#6b3a1f', '#fffaf4', '#b8f0d0']), [0, 0.52, 0], [0.84, 0.84, 0.5], [Math.PI / 2, 0, 0])
    ];

    const gumdrops = () => cluster(randInt(2, 4), 0.55, (x, z) => {
        const h = rand(0.35, 0.6);
        return [part('crater', vary(pick(SWEET_COLOURS), 0.03), [x, h / 2, z], [h * 0.8, h, h * 0.8])];
    });

    const sugarGrass = () => tuft(['#7fd49a', '#93dcaa', '#6cc58a'], randInt(5, 7), 0.5);

    const meringues = () => cluster(randInt(1, 3), 0.4, (x, z) => {
        const s = rand(0.18, 0.26);
        return [part('cone', vary(pick(['#fffaf4', '#ffe8f2', '#fff2dc']), 0.02), [x, s * 0.8, z], [s, s * 1.6, s], [0, rand(0, TAU), 0])];
    });

    const chocChips = () => cluster(randInt(2, 4), 0.4, (x, z) => {
        const s = rand(0.1, 0.15);
        return [part('cone', vary('#4a2512', 0.04), [x, s * 0.7, z], [s, s * 1.4, s])];
    });

    // Low rolling hills in pink, mint and lemon
    const candyHill = () => hill(pick(['#f6bcd6', '#b5e6c5', '#fbe3ad']), [10, 16], [2, 4.5], [8, 13])();

    // A little gingerbread cottage facing south, with an iced roof. 4.4 wide, 5 high.
    const cottage = () => {
        const G = vary('#b8692e', 0.03), ICING = '#fffaf4', ROOF = pick(['#ff9ac8', '#fffaf4', '#8fd0ff']);
        const parts = [
            part('box', G, [0, 1.6, 0], [4.4, 3.2, 4.4]),
            part('prism', G, [0, 3.8, 0], [2.54, 4.4, 1.2], [-Math.PI / 2, 0, 0]),
            part('box', ROOF, [1.15, 4.2, 0], [3.2, 0.3, 5.0], [0, 0, -0.686]),
            part('box', ROOF, [-1.15, 4.2, 0], [3.2, 0.3, 5.0], [0, 0, 0.686]),
            part('box', '#5a3018', [0, 1.1, 2.22], [1.1, 2.2, 0.08]),            // chocolate door
            part('box', ICING, [0, 2.3, 2.25], [1.4, 0.15, 0.08])
        ];
        [-1.4, 1.4].forEach(x => parts.push(
            part('box', ICING, [x, 1.9, 2.22], [0.95, 0.95, 0.06]),
            part('box', '#ffe7a3', [x, 1.9, 2.26], [0.7, 0.7, 0.06])
        ));
        [[-2.2, 2.2], [2.2, 2.2], [-2.2, -2.2], [2.2, -2.2]].forEach(([x, z]) => parts.push(part('box', ICING, [x, 1.6, z], [0.16, 3.2, 0.16])));
        for (let k = 0; k < 4; k++) parts.push(part('crater', pick(SWEET_COLOURS), [0, 5.05, -1.5 + k], [0.22, 0.3, 0.22]));
        return parts;
    };

    // Gingerbread man, facing +z, about 1.9 tall, arms out
    const gingerbreadMan = () => {
        const G = '#b8692e', ICING = '#fffaf4';
        const body = [
            part('ball', G, [0, 1.0, 0], [0.42, 0.5, 0.17]),
            part('ball', G, [-0.22, 0.38, 0], [0.17, 0.4, 0.15], [0, 0, 0.25]),
            part('ball', G, [0.22, 0.38, 0], [0.17, 0.4, 0.15], [0, 0, -0.25]),
            part('ball', G, [-0.52, 1.12, 0], [0.38, 0.15, 0.14], [0, 0, 0.45]),
            part('ball', G, [0.52, 1.12, 0], [0.38, 0.15, 0.14], [0, 0, -0.45]),
            part('ball', '#e5283a', [0, 1.2, 0.16], 0.07),
            part('ball', '#3fbf5a', [0, 1.0, 0.17], 0.07),
            part('ball', '#2f8fe0', [0, 0.8, 0.16], 0.07),
            part('box', ICING, [-0.8, 1.29, 0.06], [0.04, 0.22, 0.04], [0, 0, 0.45]),   // icing at the wrists and ankles
            part('box', ICING, [0.8, 1.29, 0.06], [0.04, 0.22, 0.04], [0, 0, -0.45]),
            part('box', ICING, [-0.3, 0.1, 0.1], [0.22, 0.04, 0.04]),
            part('box', ICING, [0.3, 0.1, 0.1], [0.22, 0.04, 0.04])
        ];
        const head = [
            part('ball', G, [0, 0.3, 0], [0.34, 0.32, 0.16]),
            part('ball', ICING, [-0.12, 0.37, 0.13], 0.05),
            part('ball', ICING, [0.12, 0.37, 0.13], 0.05),
            part('box', ICING, [0, 0.2, 0.15], [0.18, 0.035, 0.03]),
            part('ball', '#ff9ab8', [-0.21, 0.25, 0.11], 0.045),
            part('ball', '#ff9ab8', [0.21, 0.25, 0.11], 0.045)
        ];
        return { body, head, neck: [0, 1.45, 0] };
    };

    // Gummy bear, facing +z, about 1.25 tall; it bounces about as a hopper
    const gummyBear = c => () => ({ body: [
        part('ball', c, [0, 0.45, 0], [0.36, 0.42, 0.3]),
        part('ball', c, [0, 0.98, 0.02], [0.3, 0.28, 0.26]),
        part('ball', c, [-0.2, 1.2, 0], 0.1),
        part('ball', c, [0.2, 1.2, 0], 0.1),
        part('ball', vary(c, 0.1), [0, 0.92, 0.25], [0.13, 0.1, 0.08]),
        part('ball', '#2a1a1a', [0, 0.96, 0.33], 0.035),
        part('ball', '#2a1a1a', [-0.11, 1.05, 0.23], 0.03),
        part('ball', '#2a1a1a', [0.11, 1.05, 0.23], 0.03),
        part('ball', c, [-0.32, 0.58, 0.12], [0.12, 0.2, 0.12], [0.4, 0, 0.3]),
        part('ball', c, [0.32, 0.58, 0.12], [0.12, 0.2, 0.12], [0.4, 0, -0.3]),
        part('ball', c, [-0.18, 0.1, 0.12], [0.15, 0.12, 0.2]),
        part('ball', c, [0.18, 0.1, 0.12], [0.15, 0.12, 0.2])
    ]});

    // Things floating down the chocolate river
    const FLOATERS = {
        marshmallowWhite: () => [part('cyl', '#fffaf4', [0, 0.2, 0], [0.55, 0.7, 0.55])],
        marshmallowPink: () => [part('cyl', '#ffc4dc', [0, 0.2, 0], [0.55, 0.7, 0.55])],
        biscuit: () => [
            part('cyl', '#c98a4a', [0, 0.05, 0], [0.85, 0.18, 0.85]),
            ...[[0.3, 0.2], [-0.35, 0.1], [0.05, -0.4], [-0.1, 0.45], [0.45, -0.25]].map(([x, z]) => part('pebble', '#4a2512', [x, 0.16, z], 0.09))
        ]
    };

    // ---------- Cloud Kingdom ----------
    // Inside the fence the detail is white cloud tufts, lavender and blue flowers, marble pebbles and
    // feathers: nothing yellow like the stars, pink like the candyfloss, or dark like the storm clouds.

    const CLOUDS = ['#ffffff', '#f4eefc', '#fbeff6', '#eef0fc'];
    const MARBLE = ['#f1ede6', '#e4dfd6', '#d8d2c8'];

    // A heap of big cloud puffs sitting on the floor
    const cloudBank = () => cluster(randInt(3, 5), 2.2, (x, z) => {
        const r = rand(1.6, 3.0);
        return [part('ball', vary(pick(CLOUDS), 0.02), [x, r * 0.4, z], [r, r * 0.7, r])];
    });

    const cloudTuft = (size = 1) => cluster(randInt(2, 4), 0.6 * size, (x, z) => {
        const r = rand(0.3, 0.6) * size;
        return [part('ball', vary(pick(CLOUDS), 0.02), [x, r * 0.45, z], [r, r * 0.75, r])];
    });

    // A marble column standing out in the clouds, some with a puff of cloud round the top
    const marbleColumn = () => {
        const h = rand(3, 6);
        const parts = [
            part('box', MARBLE[1], [0, 0.2, 0], [1.3, 0.4, 1.3]),
            part('cyl', MARBLE[0], [0, h / 2, 0], [0.45, h, 0.45]),
            part('box', MARBLE[2], [0, h + 0.15, 0], [1.2, 0.3, 1.2])
        ];
        if (Math.random() < 0.6) parts.push(part('ball', '#ffffff', [0.2, h + 0.4, 0], [0.9, 0.6, 0.8]));
        return parts;
    };

    // A little island of cloud floating in the air, with a round tree on it
    const floatingIsland = () => {
        const y = rand(5, 8);
        return [
            part('ball', '#ffffff', [0, y, 0], [2.2, 0.9, 1.8]),
            part('ball', '#f4eefc', [1.3, y - 0.2, 0.4], [1.3, 0.7, 1.2]),
            part('ball', '#fbeff6', [-1.2, y - 0.1, -0.3], [1.4, 0.7, 1.2]),
            part('cyl', '#8a6a4a', [0, y + 1.1, 0], [0.18, 1.4, 0.18]),
            part('ball', vary('#6cc26a', 0.05), [0, y + 2.2, 0], [1.0, 0.9, 1.0])
        ];
    };

    const SKY_FLOWERS = ['#b9a4ff', '#a8c8ff', '#ffffff'];
    const feather = () => [
        part('box', '#ffffff', [0, 0.03, 0], [0.12, 0.03, 0.55], [0, 0, 0.1]),
        part('box', '#d8d2e8', [0, 0.05, 0], [0.02, 0.02, 0.6])
    ];

    // A sheep with little wings, for the flocks flying past (facing +z, wings hinged at x = 0)
    const flyingSheep = () => ({
        body: [
            part('ball', '#ffffff', [0, 0, 0], [0.45, 0.38, 0.6]),
            part('ball', '#f4f4f4', [0.15, 0.18, -0.12], 0.3),
            part('ball', '#ffffff', [-0.15, 0.2, 0.1], 0.3),
            part('ball', '#2b2b2b', [0, 0.05, 0.62], [0.2, 0.22, 0.24]),
            part('box', '#2b2b2b', [-0.21, 0.12, 0.58], [0.14, 0.05, 0.08]),
            part('box', '#2b2b2b', [0.21, 0.12, 0.58], [0.14, 0.05, 0.08]),
            ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => part('box', '#2b2b2b', [sx * 0.18, -0.38, sz * 0.25], [0.08, 0.25, 0.08]))
        ],
        left: [part('box', '#ffffff', [0.5, 0.05, 0], [0.8, 0.04, 0.42]), part('box', '#eeeeee', [0.98, 0.05, -0.05], [0.36, 0.035, 0.3])],
        right: [part('box', '#ffffff', [-0.5, 0.05, 0], [0.8, 0.04, 0.42]), part('box', '#eeeeee', [-0.98, 0.05, -0.05], [0.36, 0.035, 0.3])]
    });

    // ---------- The sets, named by `outskirts` in levels.js ----------
    // Backdrop distances are past the fence. The camera sees about 30-50 units past the east and
    // west fences, and 25-40 past the north one (fog hides the rest), so that's where things go.

    const SETS = {
        meadow: {
            backdrop: [
                { count: 1, sides: ['E', 'W'], near: 13, far: 17, prop: barn, turn: [-0.25, 0.25], clear: 7 },
                { near: 9, far: 20, per100: 3, prop: hayBale },
                { near: 2, far: 12, per100: 16, prop: () => pick([() => flowers(MEADOW_FLOWERS), () => bush(['#3d8f3d', '#4a9c45']), meadowTuft, meadowTuft])() },
                { near: 13, far: 32, per100: 26, prop: () => (Math.random() < 0.55 ? meadowTree() : roundTree()), scale: [0.9, 1.4] },
                hillLayer('#4a8a3c')
            ],
            animals: [
                { kind: 'walker', name: 'cow', model: cow, sides: ['N', 'N', 'E', 'W'], speed: 1.1, stride: 2.2, bob: 0.07, graze: 1.15, look: 0.2 },
                { kind: 'hopper', name: 'rabbit', model: rabbit('#9c8670'), sides: ['N', 'E', 'W', 'W'], hop: 1.0, hopHeight: 0.45, hopTime: 0.32, scale: 1.2 },
                { kind: 'flock', name: 'swallow', model: bird({ body: '#2c3e66', head: '#2c3e66', wing: '#24324f', tip: '#1c2740', beak: '#222222' }),
                  sides: ['N', 'E'], count: 6, radius: [7, 10], height: [5, 9], speed: 7, flapRate: 11, flapAmount: 0.7, glide: 0.3 }
            ],
            detail: [
                { count: 80, prop: () => flowers(MEADOW_FLOWERS) },
                { count: 70, prop: meadowTuft },
                { count: 18, prop: () => mushrooms(['#b8875a', '#c99a6b', '#a8744a']) },
                { count: 30, prop: () => pebbles(['#9a9a92', '#8c8d86', '#a5a49b']) }
            ]
        },

        beach: {
            // The sea fills the north side, so the backdrop is only on the east and west
            animals: [
                { kind: 'sea' },
                { kind: 'sailboat', count: 4 },
                { kind: 'dolphin', name: 'dolphin', model: dolphin, count: 3 },
                { kind: 'buoy', name: 'buoy', model: buoy, count: 5 },
                { kind: 'hopper', name: 'seal', model: seal, sides: ['E', 'W', 'E'], hop: 0.5, hopHeight: 0.12, hopTime: 0.45, scale: 1.3 },
                { kind: 'kite', sides: ['E', 'W', 'W'] }
            ],
            backdrop: [
                { count: 5, sides: ['E', 'W'], near: 10, far: 14, prop: beachHut, turn: [-0.2, 0.2], clear: 3.5 },
                { near: 1.5, far: 4.5, sides: ['N'], per100: 5, prop: () => pick([driftwood, seaweed, () => pebbles(SHORE_ROCK, 0.35)])() },
                { near: 2, far: 12, sides: ['E', 'W'], per100: 14, prop: () => pick([() => duneGrass(), () => duneGrass(), driftwood, towel, () => rockPile(SHORE_ROCK, 0.7)])() },
                { near: 13, far: 32, sides: ['E', 'W'], per100: 9, prop: palm, scale: [0.9, 1.3] },
                { near: 14, far: 34, sides: ['E', 'W'], per100: 12, prop: () => duneGrass(1.1), scale: [1, 1.6] },
                hillLayer('#efdcae', [1.5, 3.5], ['E', 'W'])
            ],
            detail: [
                { count: 55, prop: () => duneGrass(0.6) },
                { count: 40, prop: () => pebbles(SHORE_ROCK) },
                { count: 25, prop: driftwood },
                { count: 30, prop: seaweed }
            ]
        },

        desert: {
            backdrop: [
                { near: 2, far: 12, per100: 12, prop: () => pick([dryTuft, dryTuft, twigBush, () => pebbles(DESERT_STONE, 0.45), skull])() },
                { near: 10, far: 32, per100: 10, prop: cactus, scale: [0.9, 1.5] },
                { near: 10, far: 32, per100: 6, prop: () => rockPile(['#a8835c', '#94714e', '#b8936a'], 1.6) },
                { near: 24, far: 45, per100: 3, prop: mesa },
                hillLayer('#ead39e', [1.5, 4])
            ],
            animals: [
                { kind: 'walker', name: 'camel', model: camel, sides: ['N', 'E', 'W'], speed: 1.0, stride: 1.6, bob: 0.1, graze: 0.35, look: 0.6 },
                { kind: 'roller', name: 'tumbleweed', model: tumbleweed, count: 4, radius: 0.8 },
                { kind: 'flock', name: 'vulture', model: bird({ body: '#4a3a2e', head: '#e0c0a8', wing: '#3e3026', tip: '#2a2018', beak: '#d8c8a0' }),
                  sides: ['N', 'W'], count: 4, radius: [9, 12], height: [7, 10], speed: 6, flapRate: 4, flapAmount: 0.35, glide: 0.75, scale: 1.4 }
            ],
            detail: [
                { count: 70, prop: dryTuft },
                { count: 45, prop: () => pebbles(DESERT_STONE) },
                { count: 25, prop: twigBush },
                { count: 6, prop: skull }
            ]
        },

        snow: {
            backdrop: [
                { count: 3, near: 3, far: 10, prop: snowman, turn: [-0.4, 0.4], clear: 2 },
                { near: 2, far: 12, per100: 10, prop: () => pick([() => snowyRock(0.9), snowDrift, sapling])(), scale: [1, 1.8] },
                { near: 12, far: 32, per100: 22, prop: snowPine, scale: [0.9, 1.4] },
                hillLayer('#eef4fa', [2, 4.5])
            ],
            animals: [
                { kind: 'walker', name: 'reindeer', model: reindeer, sides: ['N', 'E', 'W'], speed: 1.2, stride: 2.4, bob: 0.06, graze: 1.0, look: 0.3 },
                { kind: 'hopper', name: 'hare', model: rabbit('#f6f6f2', '#2a2a2a'), sides: ['N', 'E', 'W', 'E'], hop: 1.2, hopHeight: 0.5, hopTime: 0.3, scale: 1.2 },
                { kind: 'flock', name: 'gull', model: bird({ body: '#f2f4f6', head: '#f2f4f6', wing: '#c9ced6', tip: '#5a6068', beak: '#e0a030' }),
                  sides: ['N', 'W'], count: 5, radius: [8, 11], height: [6, 9], speed: 6.5, flapRate: 7, flapAmount: 0.55, glide: 0.5 }
            ],
            detail: [
                { count: 40, prop: () => snowyRock() },
                { count: 50, prop: () => tuft(['#a08a5a', '#8a7048', '#b49a68'], randInt(3, 5), 0.5, 0.45) },
                { count: 40, prop: snowDrift },
                { count: 20, prop: sapling }
            ]
        },

        jungle: {
            backdrop: [
                { near: 2, far: 12, per100: 14, prop: () => pick([fern, fern, () => bush(JUNGLE_LEAF, 1.3), mossyRock])(), scale: [1.3, 2.2] },
                { near: 11, far: 32, per100: 30, prop: () => (Math.random() < 0.6 ? canopyTree() : palm()), scale: [0.9, 1.4] },
                hillLayer('#24552a', [2, 4.5])
            ],
            animals: [
                { kind: 'walker', name: 'elephant', model: elephant, sides: ['N', 'E', 'W'], speed: 0.9, stride: 1.4, bob: 0.08, graze: 0.35, look: 0.45 },
                { kind: 'flock', name: 'parrot', model: bird({ body: '#ffffff', head: '#ffffff', wing: '#e8e8e8', tip: '#9a9a9a', beak: '#3a3a3a' }),
                  sides: ['N', 'E', 'W'], count: 6, radius: [7, 10], height: [5, 9], speed: 7, flapRate: 10, flapAmount: 0.7, glide: 0.2,
                  tints: ['#2f7fe0', '#f2c230', '#5cc23a', '#8a5ad0'] }
            ],
            detail: [
                { count: 70, prop: fern, scale: [1.3, 1.9] },
                { count: 25, prop: () => mushrooms(['#9a5a3a', '#b07a4a', '#7a4fa0']) },
                { count: 30, prop: mossyRock },
                { count: 20, prop: root }
            ]
        },

        sweetie: {
            // The chocolate river runs 15 to 27 past the north fence, so the north side's backdrop
            // goes either side of it: small sweets on the near bank, lollipops and hills beyond
            animals: [
                { kind: 'chocolateRiver', near: 15, far: 27 },
                { kind: 'floater', count: 9, near: 15, far: 27 },
                { kind: 'walker', name: 'gingerbreadMan', model: gingerbreadMan, sides: ['N', 'E', 'W', 'W'], speed: 1.0, stride: 3.0, bob: 0.1, graze: 0.25, look: 0.6, scale: 1.3 },
                { kind: 'hopper', name: 'gummyRed', model: gummyBear('#e8333f'), sides: ['E'], hop: 0.8, hopHeight: 0.45, hopTime: 0.33, scale: 1.3 },
                { kind: 'hopper', name: 'gummyGreen', model: gummyBear('#5cc84a'), sides: ['W'], hop: 0.8, hopHeight: 0.45, hopTime: 0.33, scale: 1.3 },
                { kind: 'hopper', name: 'gummyYellow', model: gummyBear('#ffc93a'), sides: ['E', 'W'], hop: 0.8, hopHeight: 0.45, hopTime: 0.33, scale: 1.3 },
                { kind: 'flock', name: 'sugarbird', model: bird({ body: '#ffffff', head: '#ffffff', wing: '#f0f0f0', tip: '#d6d6d6', beak: '#ffb030' }),
                  sides: ['N', 'E', 'W'], count: 6, radius: [7, 10], height: [5, 9], speed: 7, flapRate: 10, flapAmount: 0.7, glide: 0.3,
                  tints: ['#ff9ccf', '#9fd8ff', '#c8a8ff', '#fff07a', '#a8f0c0'] }
            ],
            backdrop: [
                { count: 2, sides: ['E', 'W'], near: 13, far: 17, prop: cottage, turn: [-0.25, 0.25], clear: 5 },
                { near: 2, far: 12, per100: 14, prop: () => pick([wrappedSweet, () => peppermint(rand(0.5, 0.8)), donut, gumdrops, sugarGrass, sugarGrass])() },
                { near: 12, far: 32, sides: ['E', 'W'], per100: 16, prop: bigLollipop, turn: [-0.5, 0.5], scale: [1, 1.5] },
                { near: 12, far: 32, sides: ['E', 'W'], per100: 6, prop: bigCane, scale: [1, 1.4] },
                { near: 30, far: 42, sides: ['N'], per100: 14, prop: bigLollipop, turn: [-0.5, 0.5], scale: [1.1, 1.6] },
                { near: 30, far: 42, sides: ['N'], per100: 5, prop: bigCane, scale: [1.1, 1.5] },
                { near: 30, far: 54, per100: 7, sides: ['E', 'W'], prop: candyHill },
                { near: 46, far: 62, per100: 7, sides: ['N'], prop: candyHill }
            ],
            detail: [
                { count: 70, prop: sugarGrass },
                { count: 30, prop: meringues },
                { count: 30, prop: chocChips },
                { count: 15, prop: () => peppermint(rand(0.3, 0.4)) }
            ]
        },

        cloud: {
            smooth: true, // round, soft clouds
            animals: [
                { kind: 'balloon', count: 7 },
                { kind: 'flock', name: 'flyingSheep', model: flyingSheep, sides: ['N', 'E', 'W'], count: 5, radius: [8, 11], height: [7, 11],
                  speed: 5, flapRate: 6, flapAmount: 0.55, glide: 0.3, scale: 1.2 }
            ],
            backdrop: [
                { near: 2, far: 12, per100: 14, prop: () => pick([() => cloudTuft(1.4), () => cloudTuft(1.4), () => flowers(SKY_FLOWERS), () => pebbles(MARBLE, 0.4)])() },
                { near: 10, far: 32, per100: 12, prop: cloudBank, scale: [0.9, 1.4] },
                { near: 10, far: 30, per100: 4, prop: marbleColumn },
                { near: 18, far: 40, per100: 3, prop: floatingIsland, scale: [0.9, 1.3] },
                hillLayer('#c9bfea', [2, 4.5])
            ],
            detail: [
                { count: 60, prop: () => cloudTuft(0.8) },
                { count: 45, prop: () => flowers(SKY_FLOWERS) },
                { count: 30, prop: () => pebbles(MARBLE) },
                { count: 20, prop: feather }
            ]
        },

        volcano: {
            backdrop: [
                { near: 2, far: 12, per100: 9, prop: () => pick([() => rockPile(DARK_ROCK, 0.8), deadTree, lavaPool])() },
                { near: 10, far: 32, per100: 12, prop: spires },
                { near: 10, far: 32, per100: 6, prop: ridge },
                hillLayer('#3a2214', [1.5, 3.5])
            ],
            animals: [
                { kind: 'smoker', name: 'smallVolcano', model: smallVolcano, sides: ['N', 'E', 'W'] },
                { kind: 'geyser', name: 'geyser', model: geyser, sides: ['N', 'E', 'W'] },
                { kind: 'flock', name: 'bat', model: bird({ body: '#2b2230', head: '#2b2230', wing: '#3a2c40', tip: '#2b2230', beak: '#2b2230' }),
                  sides: ['N', 'E'], count: 7, radius: [5, 8], height: [5, 9], speed: 9, flapRate: 18, flapAmount: 0.9, jitter: 2 }
            ],
            detail: [
                { count: 50, prop: () => pebbles(DARK_ROCK, 0.4) },
                { count: 35, prop: ashMound },
                { count: 35, prop: shards },
                { count: 15, prop: stump }
            ]
        }
    };

    return {
        SETS,

        // Builds the current level's outskirts. obstacles: the arena's trees/cacti/rocks, which the
        // detail keeps off (it never moves them).
        create(scene, level, obstacles) {
            const set = SETS[level.outskirts];
            if (!set) return;
            const fence = level.WORLD_SIZE / 2;
            const kept = []; // room kept for animals, so backdrop props don't stand in their way
            const add = obj => { scene.add(obj); Scenery.objects.push(obj); };
            (set.animals || []).forEach(spec => ANIMAL_KINDS[spec.kind](spec, fence, kept).forEach(add));
            buildBackdrop(set, fence, kept).forEach(add);
            buildDetail(set, level, obstacles).forEach(add);
        }
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Outskirts };
}
