/* global THREE, scene, camera, marioGroundY, marioBaseX, marioBaseY, marioMode */

var spidersGroup = null;
var spiderPool = [];
var spiderSpawnTimer = 0;
var spiderSpawnInterval = 0;
var spidersViewportSize = null;
var spiderLastMarioBaseY = 0;
var spiderLastMarioHitboxMinY = 0;

var SPIDER_BASE_SPEED = 2.8;
var SPIDER_SPEED_STEP = 0.25;
var SPIDER_MIN_SPAWN_DELAY = 2;
var SPIDER_MAX_SPAWN_DELAY = 6;
var SPIDER_BODY_RADIUS = 0.2;
var SPIDER_FOOT_GROUND_OFFSET = -0.7;
var SPIDER_BODY_BOB_AMPLITUDE = 0;
var SPIDER_BASE_JUMP_HEIGHT = 0.5;
var SPIDER_JUMP_DURATION = 0.7;
var SPIDER_MIN_JUMP_DELAY = 1.8;
var SPIDER_MAX_JUMP_DELAY = 4.2;

// Returns a random spider spawn delay between the configured bounds.
function getNextSpiderSpawnDelay() {
    return SPIDER_MIN_SPAWN_DELAY + (Math.random() * (SPIDER_MAX_SPAWN_DELAY - SPIDER_MIN_SPAWN_DELAY));
}

// Returns a random spider jump delay between the configured bounds.
function getNextSpiderJumpDelay(level) {
    var minDelay;
    var maxDelay;

    if (level >= 4) {
        minDelay = 1;
        maxDelay = 6;
    } else if (level === 3) {
        minDelay = SPIDER_MIN_JUMP_DELAY;
        maxDelay = SPIDER_MAX_JUMP_DELAY;
    } else if (level === 2) {
        minDelay = 2.3;
        maxDelay = 5;
    } else {
        minDelay = 3;
        maxDelay = 5.8;
    }

    return minDelay + (Math.random() * (maxDelay - minDelay));
}

// Returns the spider jump height offset for the current jump progress.
function getSpiderJumpOffset(progress, jumpHeight) {
    return Math.sin(progress * Math.PI) * jumpHeight;
}

// Returns spider jump height for a level.
function getSpiderJumpHeightForLevel(level) {
    if (level >= 3) {
        return 1;
    }

    return SPIDER_BASE_JUMP_HEIGHT;
}

// Returns the current spider difficulty level.
function getSpiderLevel() {
    if (typeof getCurrentLevel === 'function') {
        return getCurrentLevel();
    }

    return 1;
}

// Returns the spider speed for a given level.
function getSpiderSpeedForLevel(level) {
    if (typeof getBatSpeedForLevel === 'function') {
        return getBatSpeedForLevel(level);
    }

    return SPIDER_BASE_SPEED + ((Math.max(1, level) - 1) * SPIDER_SPEED_STEP);
}

// Constrains a value to a min/max range.
function clampSpiderValue(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
}

// Returns Mario hitbox data for hazard collisions.
function getSpiderMarioHitbox() {
    var centerY = marioBaseY + 0.8;
    var halfWidth = 0.33;
    var halfHeight = 0.62;

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

// Checks whether a spider overlaps Mario.
function isSpiderCollidingWithMario(spiderX, spiderY, hitbox, previousHitboxMinY, isMarioDescending) {
    var collisionCenterY = spiderY + 0.62;
    var closestX = clampSpiderValue(spiderX, hitbox.minX, hitbox.maxX);
    var closestY = clampSpiderValue(collisionCenterY, hitbox.minY, hitbox.maxY);
    var deltaX = spiderX - closestX;
    var deltaY = collisionCenterY - closestY;
    var collisionRadius = Math.max(SPIDER_BODY_RADIUS * 2.1, 0.42);
    var circleHit = (deltaX * deltaX) + (deltaY * deltaY) <= (collisionRadius * collisionRadius);
    var spiderHalfWidth = Math.max(SPIDER_BODY_RADIUS * 2.8, 0.56);
    var spiderHalfHeight = Math.max(SPIDER_BODY_RADIUS * 3.4, 0.76);
    var spiderLeft = spiderX - spiderHalfWidth;
    var spiderRight = spiderX + spiderHalfWidth;
    var spiderBottom = collisionCenterY - spiderHalfHeight;
    var spiderTop = collisionCenterY + (SPIDER_BODY_RADIUS * 1.25);
    var aabbHit = hitbox.maxX >= spiderLeft && hitbox.minX <= spiderRight && hitbox.maxY >= spiderBottom && hitbox.minY <= spiderTop;
    var horizontalOverlap = hitbox.maxX >= spiderLeft && hitbox.minX <= spiderRight;
    var landingTolerance = marioMode === 'super' || marioMode === 'superfly' ? 0.2 : 0.12;
    var landingDepth = marioMode === 'super' || marioMode === 'superfly' ? 0.3 : 0.2;
    var landingThreshold = spiderTop + landingTolerance;
    var crossingLandingContact = false;
    var overlapLandingContact = false;
    var superLandingContact = false;
    var sweepMin = Math.min(previousHitboxMinY, hitbox.minY);
    var sweepMax = Math.max(previousHitboxMinY, hitbox.minY);

    if (isMarioDescending && horizontalOverlap) {
        crossingLandingContact = sweepMax >= (spiderTop - landingDepth) && sweepMin <= landingThreshold;
        overlapLandingContact = hitbox.minY >= (spiderTop - landingDepth) && hitbox.minY <= landingThreshold;
    }

    if ((marioMode === 'super' || marioMode === 'superfly') && horizontalOverlap) {
        superLandingContact = hitbox.minY >= (spiderTop - 0.6) && hitbox.minY <= (landingThreshold + 0.1);
    }

    return circleHit || aabbHit || crossingLandingContact || overlapLandingContact || superLandingContact;
}

// Returns the viewport size used by spider movement.
function getSpidersViewportSize() {
    var spiderZ = -0.55;
    var distance = camera.position.z - spiderZ;
    var height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;

    return {
        width: height * camera.aspect,
        height: height
    };
}

// Creates a simple procedural spider mesh.
function createSpiderMesh() {
    var spider = new THREE.Group();
    var bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x171717 });
    var eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xc62828 });
    var body = new THREE.Mesh(new THREE.CircleGeometry(0.135, 20), bodyMaterial);
    var abdomen = new THREE.Mesh(new THREE.CircleGeometry(0.11, 18), bodyMaterial);
    var leftEye = new THREE.Mesh(new THREE.CircleGeometry(0.018, 10), eyeMaterial);
    var rightEye = new THREE.Mesh(new THREE.CircleGeometry(0.018, 10), eyeMaterial);
    var legMaterial = new THREE.LineBasicMaterial({ color: 0x090909 });
    var legBases = [-0.1, -0.03, 0.03, 0.1];
    var legAnchors = [];
    var i;

    abdomen.position.set(0.14, -0.01, 0);
    leftEye.position.set(-0.05, 0.038, 0.01);
    rightEye.position.set(0.006, 0.038, 0.01);

    spider.add(abdomen);
    spider.add(body);
    spider.add(leftEye);
    spider.add(rightEye);

    for (i = 0; i < legBases.length; i += 1) {
        var leftLegPivot = new THREE.Group();
        var rightLegPivot = new THREE.Group();
        var leftMidX = -0.34;
        var rightMidX = 0.34;
        var upperEndX = -0.5;
        var upperEndMirrorX = 0.5;
        var lowerEndX = -0.42;
        var lowerEndMirrorX = 0.42;
        var upperMidY = 0.12;
        var upperEndY = -0.36;
        var lowerMidY = -0.12;
        var lowerEndY = -0.59;
        var isUpperLeg = i < 2;
        var leftLegGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(leftMidX, isUpperLeg ? upperMidY : lowerMidY, 0),
            new THREE.Vector3(isUpperLeg ? upperEndX : lowerEndX, isUpperLeg ? upperEndY : lowerEndY, 0)
        ]);
        var rightLegGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(rightMidX, isUpperLeg ? upperMidY : lowerMidY, 0),
            new THREE.Vector3(isUpperLeg ? upperEndMirrorX : lowerEndMirrorX, isUpperLeg ? upperEndY : lowerEndY, 0)
        ]);
        var leftLeg = new THREE.Line(leftLegGeometry, legMaterial);
        var rightLeg = new THREE.Line(rightLegGeometry, legMaterial);
        var phase = i * 0.55;

        leftLegPivot.position.set(-0.05, legBases[i], 0);
        rightLegPivot.position.set(0.05, legBases[i], 0);
        leftLegPivot.add(leftLeg);
        rightLegPivot.add(rightLeg);
        spider.add(leftLegPivot);
        spider.add(rightLegPivot);

        legAnchors.push({
            pivot: leftLegPivot,
            side: -1,
            phase: phase,
            baseY: legBases[i],
            flapRate: 2.5 + (i * 0.22),
            swingAmplitude: 0.13 + (i * 0.016),
            liftAmplitude: 0.012 + (i * 0.003),
            line: leftLeg,
            midX: leftMidX,
            endX: isUpperLeg ? upperEndX : lowerEndX,
            baseMidY: isUpperLeg ? upperMidY : lowerMidY,
            baseEndY: isUpperLeg ? upperEndY : lowerEndY,
            bendMidAmplitude: 0.052 + (i * 0.01),
            bendEndAmplitude: 0.11 + (i * 0.02)
        });
        legAnchors.push({
            pivot: rightLegPivot,
            side: 1,
            phase: phase + 0.35,
            baseY: legBases[i],
            flapRate: 2.72 + (i * 0.24),
            swingAmplitude: 0.145 + (i * 0.018),
            liftAmplitude: 0.013 + (i * 0.0035),
            line: rightLeg,
            midX: rightMidX,
            endX: isUpperLeg ? upperEndMirrorX : lowerEndMirrorX,
            baseMidY: isUpperLeg ? upperMidY : lowerMidY,
            baseEndY: isUpperLeg ? upperEndY : lowerEndY,
            bendMidAmplitude: 0.058 + (i * 0.01),
            bendEndAmplitude: 0.12 + (i * 0.02)
        });
    }

    spider.userData.legs = legAnchors;

    return spider;
}

// Spawns one spider at ground level on the right side.
function spawnSpider() {
    var viewportSize = spidersViewportSize || getSpidersViewportSize();
    var level = getSpiderLevel();
    var spider = createSpiderMesh();

    spider.position.set((viewportSize.width * 0.5) + 1.2, marioGroundY + SPIDER_FOOT_GROUND_OFFSET, -0.55);
    spider.userData = {
        alive: true,
        time: 0,
        level: level,
        baseY: marioGroundY + SPIDER_FOOT_GROUND_OFFSET,
        legs: spider.userData.legs || [],
        jumpTimer: 0,
        nextJumpDelay: getNextSpiderJumpDelay(level),
        jumpElapsed: 0,
        isJumping: false,
        jumpHeight: getSpiderJumpHeightForLevel(level)
    };

    spidersGroup.add(spider);
    spiderPool.push(spider);
}

// Creates the spiders group.
function createSpiders() {
    spidersGroup = new THREE.Group();
    scene.add(spidersGroup);
    spiderPool = [];
    spiderSpawnInterval = getNextSpiderSpawnDelay();
    // Spawn the first spider immediately once updates begin.
    spiderSpawnTimer = spiderSpawnInterval;
    spidersViewportSize = getSpidersViewportSize();
    spiderLastMarioBaseY = marioBaseY;
    spiderLastMarioHitboxMinY = getSpiderMarioHitbox().minY;
}

// Updates cached spider viewport size.
function updateSpidersSize() {
    spidersViewportSize = getSpidersViewportSize();
}

// Updates active spiders and their spawn cadence.
function updateSpiders(delta) {
    var i;
    var spider;
    var viewportSize;
    var currentLevel;
    var currentSpeed;
    var isMarioDescending;
    var marioHitbox;

    if (!spidersGroup) {
        return;
    }

    viewportSize = spidersViewportSize || getSpidersViewportSize();
    currentLevel = getSpiderLevel();
    currentSpeed = getSpiderSpeedForLevel(currentLevel);
    marioHitbox = getSpiderMarioHitbox();
    isMarioDescending = marioBaseY < spiderLastMarioBaseY || marioHitbox.minY < spiderLastMarioHitboxMinY;
    spiderSpawnTimer += delta;

    while (spiderSpawnTimer >= spiderSpawnInterval) {
        spiderSpawnTimer -= spiderSpawnInterval;
        spiderSpawnInterval = getNextSpiderSpawnDelay();
        spawnSpider();
    }

    for (i = spiderPool.length - 1; i >= 0; i -= 1) {
        spider = spiderPool[i];

        if (!spider.userData.alive) {
            continue;
        }

        spider.userData.time += delta;
        spider.userData.jumpTimer += delta;

        if (!spider.userData.isJumping && spider.userData.jumpTimer >= spider.userData.nextJumpDelay) {
            spider.userData.isJumping = true;
            spider.userData.jumpElapsed = 0;
            spider.userData.jumpTimer = 0;
        }

        if (spider.userData.isJumping) {
            spider.userData.jumpElapsed += delta;
            if (spider.userData.jumpElapsed >= SPIDER_JUMP_DURATION) {
                spider.userData.isJumping = false;
                spider.userData.jumpElapsed = 0;
                spider.userData.nextJumpDelay = getNextSpiderJumpDelay(currentLevel);
            }
        }

        spider.position.x -= currentSpeed * delta;
        spider.userData.level = currentLevel;
        spider.userData.jumpHeight = getSpiderJumpHeightForLevel(currentLevel);
        spider.userData.baseY = marioGroundY + SPIDER_FOOT_GROUND_OFFSET;
        spider.position.y = spider.userData.baseY + (Math.sin(spider.userData.time * 12) * SPIDER_BODY_BOB_AMPLITUDE);
        if (spider.userData.isJumping) {
            spider.position.y += getSpiderJumpOffset(spider.userData.jumpElapsed / SPIDER_JUMP_DURATION, spider.userData.jumpHeight);
        }
        spider.rotation.z = Math.sin(spider.userData.time * 8) * 0.02;

        for (var legIndex = 0; legIndex < spider.userData.legs.length; legIndex += 1) {
            var legData = spider.userData.legs[legIndex];
            var stride = Math.sin((spider.userData.time * legData.flapRate) + legData.phase);
            var bend = Math.max(0, stride);
            var legGeometry = legData.line.geometry;
            var legPosition = legGeometry.getAttribute('position');
            legData.pivot.rotation.z = (0.16 * legData.side) + (stride * legData.swingAmplitude * legData.side);
            legData.pivot.position.y = legData.baseY + (Math.abs(stride) * legData.liftAmplitude);
            legPosition.setXYZ(1, legData.midX, legData.baseMidY + (bend * legData.bendMidAmplitude), 0);
            legPosition.setXYZ(2, legData.endX, legData.baseEndY + (bend * legData.bendEndAmplitude), 0);
            legPosition.needsUpdate = true;
        }

        if (isSpiderCollidingWithMario(spider.position.x, spider.position.y, marioHitbox, spiderLastMarioHitboxMinY, isMarioDescending)) {
            spider.userData.alive = false;
            spidersGroup.remove(spider);
            spiderPool.splice(i, 1);
            if (typeof registerMarioHazardHit === 'function') {
                registerMarioHazardHit();
            }
            continue;
        }

        if (spider.position.x < -((viewportSize.width * 0.5) + 0.9)) {
            spider.userData.alive = false;
            spidersGroup.remove(spider);
            spiderPool.splice(i, 1);
        }
    }

    spiderLastMarioBaseY = marioBaseY;
    spiderLastMarioHitboxMinY = marioHitbox.minY;
}

// Resets spiders to a clean level state.
function resetSpiders() {
    var i;

    if (!spidersGroup) {
        return;
    }

    for (i = 0; i < spiderPool.length; i += 1) {
        spidersGroup.remove(spiderPool[i]);
    }

    spiderPool = [];
    spiderSpawnTimer = 0;
    spiderSpawnInterval = getNextSpiderSpawnDelay();
    spiderLastMarioBaseY = marioBaseY;
    spiderLastMarioHitboxMinY = getSpiderMarioHitbox().minY;
}