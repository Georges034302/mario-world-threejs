/* global THREE, backgroundMaterial, renderer, scene, camera */
/* global ghostSprite, clock, scrollOffset, backgroundRotation, marioOverlay, marioBaseX, marioBaseY, marioGroundY, marioFlyY, ghostBaseY, ghostBaseX, ghostCurrentX, ghostCurrentY, animatedVideos, ghostVideo */

var runMode = 'idle';
var marioMode = 'normal';
var runKeyState = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false
};
var runSettings = {
    idle: {
        backgroundSpeed: 0.11,
        ghostPlaybackRate: 0.18
    },
    slow: {
        backgroundSpeed: 0.055,
        ghostPlaybackRate: 0.18


    },
    super: {
        backgroundSpeed: 1.11,
        ghostPlaybackRate: 0.18
    },
    fast: {
        backgroundSpeed: 1.25,
        ghostPlaybackRate: 0.18
    },
    superflyRun: {
        backgroundSpeed: 1.95,
        ghostPlaybackRate: 0.18
    },
    attack: {
        ghostPlaybackRate: 0.7,
        ghostMoveSpeed: 1.4
    },
    superfly: {
        ghostPlaybackRate: 0.85,
        ghostMoveSpeed: 1.0
    }
};
var currentBackgroundSpeed = runSettings.idle.backgroundSpeed;
var currentGhostPlaybackRate = runSettings.idle.ghostPlaybackRate;
var upOnlyLiftEasing = 2.15;
var superflyLiftEasing = 1.95;
var groundReturnEasing = 1.4;
var airborneDropEasing = 0.5;
var minAirborneDropSpeed = 0.95;
var ghostReturnEasing = 0.9;
var gameState = 'ready';
var gameOverDistance = 0.62;
var gameDuration = 0;
var gameStatusOverlay = document.getElementById('gameStatus');
var marioFrozenFrameSrc = '';
var winFireworksGroup = null;
var winFireworksBursts = [];
var winFireworksElapsed = 0;
var winFireworksSpawnTimer = 0;
var winFireworksActive = false;
var WIN_FIREWORKS_DURATION = 5;
var WIN_FIREWORKS_Z = -1.2;
var WIN_FIREWORKS_BURST_INTERVAL = 0.22;
var WIN_FIREWORKS_INITIAL_BURSTS = 3;
var WIN_FIREWORKS_MIN_POINTS = 72;
var WIN_FIREWORKS_POINT_VARIANCE = 40;

// Returns the current level for a given score.
function getLevelForScore(score) {
    if (score >= 75) {
        return 4;
    }

    if (score >= 50) {
        return 3;
    }

    if (score >= 25) {
        return 2;
    }

    return 1;
}

// Returns the current game level.
function getCurrentLevel() {
    var score = typeof batScore !== 'undefined' ? batScore : 0;

    return getLevelForScore(score);
}

// Handles freeze mario overlay animation.
function freezeMarioOverlayAnimation() {
    var frameCanvas;
    var context;

    if (!marioOverlay) {
        return;
    }

    if (!marioOverlay.naturalWidth || !marioOverlay.naturalHeight) {
        return;
    }

    frameCanvas = document.createElement('canvas');
    frameCanvas.width = marioOverlay.naturalWidth;
    frameCanvas.height = marioOverlay.naturalHeight;
    context = frameCanvas.getContext('2d');

    if (!context) {
        return;
    }

    context.drawImage(marioOverlay, 0, 0, frameCanvas.width, frameCanvas.height);
    marioFrozenFrameSrc = frameCanvas.toDataURL('image/png');
    marioOverlay.setAttribute('src', marioFrozenFrameSrc);
}

// Handles unfreeze mario overlay animation.
function unfreezeMarioOverlayAnimation() {
    marioFrozenFrameSrc = '';
    updateMarioOverlayImage();
}

// Updates hud.
function updateHUD() {
    var hudEl = document.getElementById('hud');
    var pageLevelEl = document.getElementById('pageLevel');
    var health;
    var hearts;
    var mins;
    var secs;
    var millis;
    var score;
    var speed;
    var level;
    var i;

    if (!hudEl) {
        return;
    }

    score = typeof batScore !== 'undefined' ? batScore : 0;
    level = getLevelForScore(score);
    health = Math.max(0, 3 - (typeof batHitCount !== 'undefined' ? batHitCount : 0));
    hearts = '';
    for (i = 0; i < 3; i += 1) {
        hearts += i < health ? '\u2665' : '\u2661';
    }
    speed = currentBackgroundSpeed.toFixed(2);
    mins = Math.floor(gameDuration / 60);
    secs = Math.floor(gameDuration % 60);
    millis = Math.floor((gameDuration % 1) * 1000);

    document.getElementById('hud-score').textContent = score;
    document.getElementById('hud-health').textContent = hearts;
    document.getElementById('hud-speed').textContent = speed;
    document.getElementById('hud-time').textContent =
        (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs + '.' +
        (millis < 100 ? (millis < 10 ? '00' : '0') : '') + millis;

    if (pageLevelEl) {
        pageLevelEl.textContent = 'Level ' + level;
    }
}

// Sets status message.
function setStatusMessage(text, cssClass, isVisible) {
    if (!gameStatusOverlay) {
        return;
    }

    gameStatusOverlay.textContent = text;
    gameStatusOverlay.classList.remove('game-over');
    gameStatusOverlay.classList.remove('win');

    if (cssClass) {
        gameStatusOverlay.classList.add(cssClass);
    }

    gameStatusOverlay.style.display = isVisible ? 'block' : 'none';
}

// Converts normalized device coordinates to a world point at the target Z plane.
function ndcToWorldAtZ(ndcX, ndcY, targetZ) {
    var projected = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
    var direction = projected.sub(camera.position).normalize();
    var distance = (targetZ - camera.position.z) / direction.z;

    return camera.position.clone().add(direction.multiplyScalar(distance));
}

// Creates win fireworks group lazily.
function ensureWinFireworksGroup() {
    if (winFireworksGroup) {
        return;
    }

    winFireworksGroup = new THREE.Group();
    scene.add(winFireworksGroup);
}

// Clears all active fireworks bursts.
function clearWinFireworksBursts() {
    for (var i = winFireworksBursts.length - 1; i >= 0; i -= 1) {
        var burst = winFireworksBursts[i];
        if (winFireworksGroup) {
            winFireworksGroup.remove(burst.points);
        }
        burst.points.geometry.dispose();
        burst.points.material.dispose();
    }

    winFireworksBursts = [];
}

// Stops and clears win fireworks.
function stopWinFireworks() {
    winFireworksActive = false;
    winFireworksElapsed = 0;
    winFireworksSpawnTimer = 0;
    clearWinFireworksBursts();
}

// Creates one procedural fireworks burst near the win label.
function spawnWinFireworkBurst() {
    var pointCount;
    var positions;
    var colors;
    var velocities;
    var geometry;
    var material;
    var points;
    var origin;
    var i;

    ensureWinFireworksGroup();
    origin = ndcToWorldAtZ((Math.random() - 0.5) * 0.22, 0.7 + (Math.random() * 0.16), WIN_FIREWORKS_Z);
    pointCount = WIN_FIREWORKS_MIN_POINTS + Math.floor(Math.random() * WIN_FIREWORKS_POINT_VARIANCE);
    positions = new Float32Array(pointCount * 3);
    colors = new Float32Array(pointCount * 3);
    velocities = new Float32Array(pointCount * 3);

    for (i = 0; i < pointCount; i += 1) {
        var index = i * 3;
        var angle = Math.random() * Math.PI * 2;
        var radiusSpeed = 1.1 + Math.random() * 2.2;
        var verticalBoost = (Math.random() - 0.35) * 2.1;
        var color = new THREE.Color().setHSL(Math.random(), 0.95, 0.58);

        positions[index] = origin.x;
        positions[index + 1] = origin.y;
        positions[index + 2] = origin.z + ((Math.random() - 0.5) * 0.25);

        velocities[index] = Math.cos(angle) * radiusSpeed;
        velocities[index + 1] = Math.sin(angle) * radiusSpeed + verticalBoost;
        velocities[index + 2] = (Math.random() - 0.5) * 0.3;

        colors[index] = color.r;
        colors[index + 1] = color.g;
        colors[index + 2] = color.b;
    }

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    material = new THREE.PointsMaterial({
        size: 0.12,
        transparent: true,
        opacity: 1,
        vertexColors: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    winFireworksGroup.add(points);

    winFireworksBursts.push({
        points: points,
        velocities: velocities,
        age: 0,
        life: 1.1 + Math.random() * 0.9,
        gravity: 1.6 + Math.random() * 0.7
    });
}

// Starts win fireworks sequence.
function startWinFireworks() {
    var i;

    ensureWinFireworksGroup();
    clearWinFireworksBursts();
    winFireworksActive = true;
    winFireworksElapsed = 0;
    winFireworksSpawnTimer = 0;

    for (i = 0; i < WIN_FIREWORKS_INITIAL_BURSTS; i += 1) {
        spawnWinFireworkBurst();
    }
}

// Updates fireworks particles and spawn cadence.
function updateWinFireworks(delta) {
    var i;

    if (!winFireworksGroup) {
        return;
    }

    if (gameState === 'win' && winFireworksActive) {
        winFireworksElapsed += delta;
        winFireworksSpawnTimer += delta;

        while (winFireworksElapsed <= WIN_FIREWORKS_DURATION && winFireworksSpawnTimer >= WIN_FIREWORKS_BURST_INTERVAL) {
            winFireworksSpawnTimer -= WIN_FIREWORKS_BURST_INTERVAL;
            spawnWinFireworkBurst();
        }

        if (winFireworksElapsed > WIN_FIREWORKS_DURATION) {
            winFireworksActive = false;
        }
    }

    for (i = winFireworksBursts.length - 1; i >= 0; i -= 1) {
        var burst = winFireworksBursts[i];
        var positionAttr = burst.points.geometry.getAttribute('position');
        var positions = positionAttr.array;
        var lifeRatio;
        var pointIndex;

        burst.age += delta;
        lifeRatio = Math.max(0, 1 - (burst.age / burst.life));

        for (pointIndex = 0; pointIndex < positions.length; pointIndex += 3) {
            burst.velocities[pointIndex + 1] -= burst.gravity * delta;
            positions[pointIndex] += burst.velocities[pointIndex] * delta;
            positions[pointIndex + 1] += burst.velocities[pointIndex + 1] * delta;
            positions[pointIndex + 2] += burst.velocities[pointIndex + 2] * delta;
        }

        positionAttr.needsUpdate = true;
        burst.points.material.opacity = lifeRatio;

        if (burst.age >= burst.life) {
            winFireworksGroup.remove(burst.points);
            burst.points.geometry.dispose();
            burst.points.material.dispose();
            winFireworksBursts.splice(i, 1);
        }
    }
}

// Converts world coordinates into screen coordinates.
function worldToScreen(worldX, worldY, worldZ) {
    var projected = new THREE.Vector3(worldX, worldY, worldZ);
    projected.project(camera);

    return {
        x: (projected.x * 0.5 + 0.5) * window.innerWidth,
        y: (-projected.y * 0.5 + 0.5) * window.innerHeight
    };
}

// Handles position game over message.
function positionGameOverMessage() {
    var collisionPoint;
    var offsetTop;

    if (!gameStatusOverlay) {
        return;
    }

    collisionPoint = worldToScreen((marioBaseX + ghostCurrentX) * 0.5, Math.max(marioBaseY, ghostCurrentY) + 1.25, -1.4);
    offsetTop = Math.max(28, collisionPoint.y - 38);
    gameStatusOverlay.style.left = collisionPoint.x + 'px';
    gameStatusOverlay.style.top = offsetTop + 'px';
    gameStatusOverlay.style.transform = 'translate(-50%, -100%)';
}

// Stops all input.
function stopAllInput() {
    runKeyState.ArrowLeft = false;
    runKeyState.ArrowRight = false;
    runKeyState.ArrowUp = false;
}

// Sets all video playback.
function setAllVideoPlayback(shouldPlay) {
    for (var i = 0; i < animatedVideos.length; i += 1) {
        var video = animatedVideos[i];

        if (video.readyState < 2) {
            continue;
        }

        if (shouldPlay) {
            if (video.paused) {
                video.play().catch(function() {});
            }
        } else if (!video.paused) {
            video.pause();
        }
    }
}

// Starts or resume game.
function startOrResumeGame() {
    if (gameState === 'ready') {
        gameDuration = 0;
    }
    gameState = 'running';
    stopWinFireworks();
    setStatusMessage('', '', false);
    unfreezeMarioOverlayAnimation();
    clock.getDelta();
    setAllVideoPlayback(true);
}

// Pauses game.
function pauseGame() {
    gameState = 'paused';
    stopAllInput();
    updateRunMode();
    setStatusMessage('Paused', '', true);
    if (gameStatusOverlay) {
        gameStatusOverlay.style.left = '50%';
        gameStatusOverlay.style.top = '50%';
        gameStatusOverlay.style.transform = 'translate(-50%, -50%)';
    }
    freezeMarioOverlayAnimation();
    setAllVideoPlayback(false);
}

// Restarts game.
function restartGame() {
    gameState = 'running';
    stopAllInput();
    runMode = 'idle';
    marioMode = 'normal';
    marioBaseY = marioGroundY;
    ghostCurrentX = ghostBaseX;
    ghostCurrentY = ghostBaseY;
    currentBackgroundSpeed = runSettings.idle.backgroundSpeed;
    currentGhostPlaybackRate = runSettings.idle.ghostPlaybackRate;
    scrollOffset = 0;
    backgroundRotation = 0;

    if (backgroundMaterial && backgroundMaterial.map) {
        backgroundMaterial.map.offset.x = scrollOffset;
        backgroundMaterial.map.rotation = backgroundRotation;
    }

    if (ghostSprite) {
        ghostSprite.position.x = ghostCurrentX;
        ghostSprite.position.y = ghostCurrentY;
    }

    updateRunMode();
    unfreezeMarioOverlayAnimation();
    updateMarioOverlayImage();
    syncMarioOverlay();
    setStatusMessage('', '', false);
    stopWinFireworks();
    clock.getDelta();
    setAllVideoPlayback(true);
    gameDuration = 0;
    if (typeof resetBats === 'function') {
        resetBats();
    }
    updateHUD();
}

// Triggers game over.
function triggerGameOver() {
    gameState = 'gameover';
    stopAllInput();
    runMode = 'idle';
    currentBackgroundSpeed = runSettings.idle.backgroundSpeed;
    positionGameOverMessage();
    setStatusMessage('Game Over', 'game-over', true);
    stopWinFireworks();
    setAllVideoPlayback(false);
}

// Triggers win state.
function triggerWin() {
    gameState = 'win';
    stopAllInput();
    runMode = 'idle';
    currentBackgroundSpeed = runSettings.idle.backgroundSpeed;
    if (typeof batScore !== 'undefined') {
        batScore = 100;
    }
    setStatusMessage('WIN', 'win', true);
    if (gameStatusOverlay) {
        gameStatusOverlay.style.left = '50%';
        gameStatusOverlay.style.top = '7%';
        gameStatusOverlay.style.transform = 'translate(-50%, 0)';
    }
    updateHUD();
    startWinFireworks();
    setAllVideoPlayback(false);
}

// Checks whether has ghost mario collision.
function hasGhostMarioCollision() {
    var deltaX;
    var deltaY;

    if (!ghostSprite) {
        return false;
    }

    deltaX = ghostCurrentX - marioBaseX;
    deltaY = ghostCurrentY - marioBaseY;

    return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY)) < gameOverDistance;
}

// Checks whether is mario airborne.
function isMarioAirborne() {
    return marioBaseY > (marioGroundY + 0.03);
}

// Syncs mario overlay.
function syncMarioOverlay() {
    var distance;
    var viewportHeight;
    var viewportWidth;
    var screenBottom;
    var flyBottom;
    var groundBottom;
    var spriteWidth;
    var spriteHeight;
    var flightProgress;

    if (!marioOverlay) {
        return;
    }

    distance = camera.position.z - 1;
    viewportHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;
    viewportWidth = viewportHeight * camera.aspect;
    spriteWidth = (1.5 / viewportWidth) * window.innerWidth;
    spriteHeight = (1.5 / viewportHeight) * window.innerHeight;
    flightProgress = (marioBaseY - marioGroundY) / Math.max(0.001, marioFlyY - marioGroundY);
    flightProgress = Math.max(0, Math.min(1, flightProgress));
    groundBottom = ((2.5 - (1 / 6)) / viewportHeight) * window.innerHeight;
    flyBottom = window.innerHeight * 0.75;
    screenBottom = groundBottom + ((flyBottom - groundBottom) * flightProgress);

    marioOverlay.style.left = '50%';
    marioOverlay.style.top = 'auto';
    marioOverlay.style.bottom = screenBottom + 'px';
    marioOverlay.style.width = spriteWidth + 'px';
    marioOverlay.style.height = spriteHeight + 'px';
    marioOverlay.style.transform = 'translateX(-50%)';
    marioOverlay.style.display = 'block';
    marioOverlay.style.opacity = '1';
    marioOverlay.style.visibility = 'visible';
}

// Updates mario mode.
function updateMarioMode() {
    if (runKeyState.ArrowUp && runKeyState.ArrowRight) {
        marioMode = 'superfly';
        return;
    }

    if (runKeyState.ArrowUp) {
        marioMode = 'super';
        return;
    }

    if (isMarioAirborne()) {
        marioMode = 'super';
        return;
    }

    marioMode = 'normal';
}

// Updates mario overlay image.
function updateMarioOverlayImage() {
    var nextSource;

    if (!marioOverlay) {
        return;
    }

    nextSource = marioMode === 'normal' ? 'media/mario.gif' : 'media/super.gif';
    if (marioOverlay.getAttribute('src') !== nextSource) {
        marioOverlay.setAttribute('src', nextSource);
    }

    marioOverlay.dataset.mode = marioMode;
}

// Updates ghost attack.
function updateGhostAttack(delta) {
    var attackSettings;
    var targetX;
    var targetY;
    var deltaX;
    var deltaY;
    var distance;
    var maxStep;

    if (!ghostSprite) {
        return;
    }

    if (marioMode === 'normal') {
        currentGhostPlaybackRate += (runSettings.idle.ghostPlaybackRate - currentGhostPlaybackRate) * Math.min(1, delta * 4);
        ghostCurrentX += (ghostBaseX - ghostCurrentX) * Math.min(1, delta * ghostReturnEasing);
        ghostCurrentY += (ghostBaseY - ghostCurrentY) * Math.min(1, delta * ghostReturnEasing);
        return;
    }

    attackSettings = marioMode === 'superfly' ? runSettings.superfly : runSettings.attack;
    currentGhostPlaybackRate += (attackSettings.ghostPlaybackRate - currentGhostPlaybackRate) * Math.min(1, delta * 5);
    targetX = marioMode === 'superfly' ? marioBaseX - 3 : marioBaseX;
    targetY = marioMode === 'superfly' ? Math.min(marioBaseY - 2.2, ghostBaseY + 1.5) : marioBaseY;
    deltaX = targetX - ghostCurrentX;
    deltaY = targetY - ghostCurrentY;
    distance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));

    if (distance === 0) {
        return;
    }

    maxStep = attackSettings.ghostMoveSpeed * delta;
    if (maxStep >= distance) {
        ghostCurrentX = targetX;
        ghostCurrentY = targetY;
        return;
    }

    ghostCurrentX += (deltaX / distance) * maxStep;
    ghostCurrentY += (deltaY / distance) * maxStep;
}

// Applies ghost collision rules.
function applyGhostCollisionRules() {
    var deltaX;
    var deltaY;
    var distance;

    if (!ghostSprite || marioMode === 'normal' || marioMode === 'superfly') {
        return;
    }

    deltaX = ghostCurrentX - marioBaseX;
    deltaY = ghostCurrentY - marioBaseY;
    distance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));

    if (distance < 1.05) {
        ghostCurrentX = marioBaseX - 0.2;
        ghostCurrentY = marioBaseY;
    }
}

// Updates run mode.
function updateRunMode() {
    updateMarioMode();

    if (marioMode === 'superfly') {
        runMode = 'superflyRun';
        return;
    }

    if (marioMode === 'super') {
        runMode = 'super';
        return;
    }

    if (runKeyState.ArrowRight) {
        runMode = 'fast';
        return;
    }

    if (runKeyState.ArrowLeft) {
        runMode = 'slow';
        return;
    }

    runMode = 'idle';
}

// Handles run key change.
function handleRunKeyChange(event, isPressed) {
    if (event.key === 'ArrowLeft') {
        runKeyState.ArrowLeft = isPressed;
        updateRunMode();
        updateMarioOverlayImage();
        event.preventDefault();
    }

    if (event.key === 'ArrowRight') {
        runKeyState.ArrowRight = isPressed;
        updateRunMode();
        updateMarioOverlayImage();
        event.preventDefault();
    }

    if (event.key === 'ArrowUp') {
        runKeyState.ArrowUp = isPressed;
        updateRunMode();
        updateMarioOverlayImage();
        event.preventDefault();
    }
}

window.addEventListener('keydown', function(event) {
    if ((event.code === 'Space' || event.key === ' ') && !event.repeat) {
        event.preventDefault();
        if (gameState === 'ready' || gameState === 'paused') {
            startOrResumeGame();
            return;
        }

        if (gameState === 'running') {
            pauseGame();
        }
        return;
    }

    if (event.key === 'Tab') {
        event.preventDefault();
        if (gameState === 'gameover' || gameState === 'win') {
            restartGame();
        }
        return;
    }

    if (gameState !== 'running') {
        return;
    }

    handleRunKeyChange(event, true);
});

window.addEventListener('keyup', function(event) {
    if (gameState !== 'running') {
        return;
    }

    handleRunKeyChange(event, false);
});

setStatusMessage('Press Space To Start', '', true);

// Handles animate scene.
function animateScene() {
    var delta = clock.getDelta();
    var targetMarioY;
    var currentRunSettings;
    var verticalTargetEasing;
    var descentStep;
    var isUpHeld = runKeyState.ArrowUp;
    var isSuperflyHeld = runKeyState.ArrowUp && runKeyState.ArrowRight;
    var airborneWithoutUp = isMarioAirborne() && !runKeyState.ArrowUp;
    var easing;

    updateRunMode();
    currentRunSettings = runSettings[runMode];
    easing = Math.min(1, delta * (runMode === 'idle' ? 2.5 : 10));

    if (isSuperflyHeld) {
        verticalTargetEasing = superflyLiftEasing;
    } else if (isUpHeld) {
        verticalTargetEasing = upOnlyLiftEasing;
    } else if (airborneWithoutUp) {
        verticalTargetEasing = airborneDropEasing;
    } else {
        verticalTargetEasing = groundReturnEasing;
    }

    var verticalEasing = Math.min(1, delta * verticalTargetEasing);

    if (gameState !== 'running') {
        if (gameState === 'gameover') {
            positionGameOverMessage();
        }
        updateWinFireworks(delta);
        renderer.render(scene, camera);
        requestAnimationFrame(animateScene);
        return;
    }

    currentBackgroundSpeed += (currentRunSettings.backgroundSpeed - currentBackgroundSpeed) * easing;
    targetMarioY = isUpHeld ? marioFlyY : marioGroundY;
    marioBaseY += (targetMarioY - marioBaseY) * verticalEasing;

    if (airborneWithoutUp && marioBaseY > marioGroundY) {
        descentStep = minAirborneDropSpeed * delta;
        marioBaseY = Math.max(marioGroundY, marioBaseY - descentStep);
    }

    if (!runKeyState.ArrowUp && marioBaseY <= marioGroundY + 0.01) {
        marioBaseY = marioGroundY;
    }

    updateRunMode();
    updateMarioOverlayImage();

    setAllVideoPlayback(true);

    if (ghostVideo && ghostVideo.readyState >= 2) {
        ghostVideo.playbackRate = currentGhostPlaybackRate;
    }

    if (backgroundMaterial && backgroundMaterial.map) {
        scrollOffset += currentBackgroundSpeed * delta;
        backgroundRotation = 0;
        backgroundMaterial.map.offset.x = scrollOffset;
        backgroundMaterial.map.rotation = backgroundRotation;
    }

    if (typeof updateForestTheme === 'function') {
        updateForestTheme(delta, currentBackgroundSpeed);
    }

    if (typeof updateBats === 'function') {
        updateBats(delta);
    }

    updateWinFireworks(delta);

    if (gameState !== 'running') {
        renderer.render(scene, camera);
        requestAnimationFrame(animateScene);
        return;
    }

    gameDuration += delta;
    updateHUD();

    syncMarioOverlay();
    updateGhostAttack(delta);

    if (hasGhostMarioCollision()) {
        triggerGameOver();
        if (ghostSprite) {
            ghostSprite.position.x = ghostCurrentX;
            ghostSprite.position.y = ghostCurrentY;
        }
        renderer.render(scene, camera);
        requestAnimationFrame(animateScene);
        return;
    }

    applyGhostCollisionRules();

    if (ghostSprite) {
        ghostSprite.position.x = ghostCurrentX;
        ghostSprite.position.y = ghostCurrentY;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animateScene);
}