/* global THREE, scene, camera, marioGroundY, marioBaseX, marioBaseY, marioMode, triggerGameOver */

var batsGroup = null;
var batsPool = [];
var batsTimer = 0;
var batsSpawnInterval = 3.5;
var batsViewportSize = null;

// Fixed bat travel speed — half of Mario idle backgroundSpeed (0.11 * 0.5 = 0.055 world units/s)
// Scaled to feel right at a fixed 2.8 world units per second of lateral travel
var BAT_SPEED = 2.8;
var batHitCount = 0;
var batScore = 0;
var BAT_BODY_RADIUS = 0.27;
var BAT_MAX_HITS = 3;
var BAT_SPAWN_BATCH_SIZE = 2;

// Constrains a value to stay within a minimum and maximum range.
function clamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
}

// Returns mario hitbox.
function getMarioHitbox() {
    var centerY = marioBaseY + 0.8;
    var halfWidth = 0.33;
    var halfHeight = 0.62;

    // Super/superfly sprite is visually bulkier than normal mode.
    if (marioMode === 'super' || marioMode === 'superfly') {
        halfWidth = 0.37;
        halfHeight = 0.68;
    }

    return {
        minX: marioBaseX - halfWidth,
        maxX: marioBaseX + halfWidth,
        minY: centerY - halfHeight,
        maxY: centerY + halfHeight
    };
}

// Checks whether is bat colliding with mario.
function isBatCollidingWithMario(batX, batY) {
    var hitbox = getMarioHitbox();
    var closestX = clamp(batX, hitbox.minX, hitbox.maxX);
    var closestY = clamp(batY, hitbox.minY, hitbox.maxY);
    var deltaX = batX - closestX;
    var deltaY = batY - closestY;

    // Circle-vs-AABB gives more reliable edge collisions than center-point checks.
    return (deltaX * deltaX) + (deltaY * deltaY) <= (BAT_BODY_RADIUS * BAT_BODY_RADIUS);
}

// Checks whether is score eligible mode.
function isScoreEligibleMode() {
    return marioMode === 'super' || marioMode === 'superfly';
}

// Returns bats viewport size.
function getBatsViewportSize() {
    var batZ = -0.5;
    var distance = camera.position.z - batZ;
    var height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;

    return {
        width: height * camera.aspect,
        height: height
    };
}

// Creates bat mesh.
function createBatMesh() {
    var bodyGeo = new THREE.CircleGeometry(0.18, 8);
    var bodyMat = new THREE.MeshBasicMaterial({ color: 0xddaaff });
    var body = new THREE.Mesh(bodyGeo, bodyMat);

    // Left wing
    var leftWingShape = new THREE.Shape();
    leftWingShape.moveTo(0, 0);
    leftWingShape.bezierCurveTo(-0.38, 0.22, -0.55, -0.08, -0.42, -0.28);
    leftWingShape.bezierCurveTo(-0.28, -0.1, -0.14, 0.04, 0, 0);
    var leftWingGeo = new THREE.ShapeGeometry(leftWingShape);
    var wingMat = new THREE.MeshBasicMaterial({ color: 0xbb88ee, side: THREE.DoubleSide });
    var leftWing = new THREE.Mesh(leftWingGeo, wingMat);

    // Right wing (mirror)
    var rightWingShape = new THREE.Shape();
    rightWingShape.moveTo(0, 0);
    rightWingShape.bezierCurveTo(0.38, 0.22, 0.55, -0.08, 0.42, -0.28);
    rightWingShape.bezierCurveTo(0.28, -0.1, 0.14, 0.04, 0, 0);
    var rightWingGeo = new THREE.ShapeGeometry(rightWingShape);
    var rightWing = new THREE.Mesh(rightWingGeo, wingMat.clone());

    var bat = new THREE.Group();
    bat.add(body);
    bat.add(leftWing);
    bat.add(rightWing);

    return bat;
}

// Handles spawn bat.
function spawnBat() {
    var vp = batsViewportSize || getBatsViewportSize();
    var ground = marioGroundY;
    var sky = ground + vp.height * 0.85;

    // Random starting Y in the upper 2/3 of the screen (avoid ground level)
    var startY = ground + vp.height * 0.2 + (Math.random() * (sky - ground - vp.height * 0.2));
    var startX = vp.width * 0.5 + 0.6; // just off right edge

    var bat = createBatMesh();
    bat.position.set(startX, startY, -0.5);

    // Oscillation parameters — each bat gets unique wave
    bat.userData = {
        alive: true,
        baseY: startY,
        ampY: 0.35 + Math.random() * 0.65,       // vertical oscillation amplitude (0.35–1.0)
        freqY: 1.2 + Math.random() * 1.8,          // oscillation frequency (1.2–3.0 Hz)
        phaseY: Math.random() * Math.PI * 2,        // random phase offset
        ampX: 0.0,                                   // secondary horizontal wobble (unused, keep simple)
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 6 + Math.random() * 4,            // wing flap speed
        time: 0
    };

    batsGroup.add(bat);
    batsPool.push(bat);
}

// Creates bats.
function createBats() {
    batsGroup = new THREE.Group();
    scene.add(batsGroup);
    batsTimer = 0;
    batsPool = [];
    batsViewportSize = getBatsViewportSize();
}

// Updates bats size.
function updateBatsSize() {
    batsViewportSize = getBatsViewportSize();
}

// Updates bats.
function updateBats(delta) {
    var i;
    var bat;
    var ud;
    var vp;

    if (!batsGroup) {
        return;
    }

    vp = batsViewportSize || getBatsViewportSize();
    // Spawn timer
    batsTimer += delta;
    if (batsTimer >= batsSpawnInterval) {
        batsTimer -= batsSpawnInterval;
        for (var spawnIndex = 0; spawnIndex < BAT_SPAWN_BATCH_SIZE; spawnIndex += 1) {
            spawnBat();
        }
    }

    // Update each bat
    for (i = batsPool.length - 1; i >= 0; i -= 1) {
        bat = batsPool[i];
        ud = bat.userData;

        if (!ud.alive) {
            continue;
        }

        ud.time += delta;

        // Move left at fixed speed
        bat.position.x -= BAT_SPEED * delta;

        // Oscillating vertical trajectory (sine wave around baseY)
        bat.position.y = ud.baseY + Math.sin(ud.time * ud.freqY + ud.phaseY) * ud.ampY;

        // Wing flap: scale the wing children on Y axis
        var flapScale = 0.55 + 0.45 * Math.abs(Math.sin(ud.time * ud.wingSpeed + ud.wingPhase));
        if (bat.children[1]) {
            bat.children[1].scale.y = flapScale;
        }
        if (bat.children[2]) {
            bat.children[2].scale.y = flapScale;
        }

        // Check Mario collision
        if (isBatCollidingWithMario(bat.position.x, bat.position.y)) {
            ud.alive = false;
            batsGroup.remove(bat);
            batsPool.splice(i, 1);
            batHitCount += 1;
            if (batHitCount >= BAT_MAX_HITS) {
                if (typeof triggerGameOver === 'function') {
                    triggerGameOver();
                }
            }
            continue;
        }

        // Remove when off left edge — bat missed Mario, award a point
        if (bat.position.x < -(vp.width * 0.5 + 0.6)) {
            ud.alive = false;
            batsGroup.remove(bat);
            batsPool.splice(i, 1);
            if (isScoreEligibleMode()) {
                batScore += 1;
            }
        }
    }
}

// Resets bats.
function resetBats() {
    var i;

    if (!batsGroup) {
        return;
    }

    for (i = 0; i < batsPool.length; i += 1) {
        batsGroup.remove(batsPool[i]);
    }

    batsPool = [];
    batsTimer = 0;
    batHitCount = 0;
    batScore = 0;
}
