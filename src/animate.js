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
    var health;
    var hearts;
    var mins;
    var secs;
    var millis;
    var score;
    var speed;
    var i;

    if (!hudEl) {
        return;
    }

    score = typeof batScore !== 'undefined' ? batScore : 0;
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
}

// Sets status message.
function setStatusMessage(text, cssClass, isVisible) {
    if (!gameStatusOverlay) {
        return;
    }

    gameStatusOverlay.textContent = text;
    gameStatusOverlay.classList.remove('game-over');

    if (cssClass) {
        gameStatusOverlay.classList.add(cssClass);
    }

    gameStatusOverlay.style.display = isVisible ? 'block' : 'none';
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
    clock.getDelta();
    setAllVideoPlayback(true);
    gameDuration = 0;
    if (typeof resetBats === 'function') {
        resetBats();
    }
}

// Triggers game over.
function triggerGameOver() {
    gameState = 'gameover';
    stopAllInput();
    runMode = 'idle';
    currentBackgroundSpeed = runSettings.idle.backgroundSpeed;
    positionGameOverMessage();
    setStatusMessage('Game Over', 'game-over', true);
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
        if (gameState === 'gameover') {
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