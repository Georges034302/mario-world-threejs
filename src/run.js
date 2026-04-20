/* Execute the graphics setup, build, and animate functions
 * - setScene
 * - addShapes
 * - animateScene
 * - add window event listener to trigger the resize function
 */
setScene();
addShapes();
animateScene();

// Freeze Mario and ghost animations until the user presses Space to start
setAllVideoPlayback(false);
// Re-pause ghost if it starts playing after its canplay event fires before Space is pressed
if (typeof ghostVideo !== 'undefined' && ghostVideo) {
    ghostVideo.addEventListener('play', function onReadyPlay() {
        if (gameState === 'ready') {
            ghostVideo.pause();
        } else {
            ghostVideo.removeEventListener('play', onReadyPlay);
        }
    });
}
if (marioOverlay && marioOverlay.complete && marioOverlay.naturalWidth) {
    freezeMarioOverlayAnimation();
} else if (marioOverlay) {
    marioOverlay.addEventListener('load', function onReadyFreeze() {
        marioOverlay.removeEventListener('load', onReadyFreeze);
        if (gameState === 'ready') {
            freezeMarioOverlayAnimation();
        }
    });
}

window.addEventListener('resize', resizeScene);
