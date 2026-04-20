/* global THREE, scene, camera, marioGroundY */

var forestThemeGroup = null;
var forestThemeViewportSize = null;
var forestThemeStars = null;
var forestThemeLayers = {
    clouds: [],
    farTrees: [],
    nearTrees: [],
    bushes: [],
    groundBands: [],
    grass: []
};
var forestThemeRandom = createForestSeededRandom(18491);

// Creates forest seeded random.
function createForestSeededRandom(seed) {
    var state = seed >>> 0;

    return function() {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

// Returns forest theme viewport size.
function getForestThemeViewportSize() {
    var distance = camera.position.z + 9.8;
    var height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;

    return {
        width: height * camera.aspect,
        height: height
    };
}

// Handles forest theme rand.
function forestThemeRand(minValue, maxValue) {
    return minValue + ((maxValue - minValue) * forestThemeRandom());
}

// Returns forest ground anchor.
function getForestGroundAnchor() {
    return marioGroundY;
}

// Clears forest theme children.
function clearForestThemeChildren() {
    if (!forestThemeGroup) {
        return;
    }

    while (forestThemeGroup.children.length > 0) {
        forestThemeGroup.remove(forestThemeGroup.children[0]);
    }

    forestThemeLayers.clouds = [];
    forestThemeLayers.farTrees = [];
    forestThemeLayers.nearTrees = [];
    forestThemeLayers.bushes = [];
    forestThemeLayers.groundBands = [];
    forestThemeLayers.grass = [];
    forestThemeStars = null;
}

// Creates forest backdrop.
function createForestBackdrop() {
    var groundAnchor = getForestGroundAnchor();
    var hillBackHeight = forestThemeViewportSize.height * 0.28;
    var hillFrontHeight = forestThemeViewportSize.height * 0.16;
    var fogBackHeight = forestThemeViewportSize.height * 0.18;
    var fogFrontHeight = forestThemeViewportSize.height * 0.14;
    var moonGlow = new THREE.Mesh(
        new THREE.CircleGeometry(1.1, 32),
        new THREE.MeshBasicMaterial({
            color: 0x8aa4d9,
            transparent: true,
            opacity: 0.14
        })
    );
    var sky = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            color: 0x060d1b,
            transparent: true,
            opacity: 1
        })
    );
    var haze = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            color: 0x101b31,
            transparent: true,
            opacity: 0.82
        })
    );
    var moon = new THREE.Mesh(
        new THREE.CircleGeometry(0.62, 28),
        new THREE.MeshBasicMaterial({
            color: 0xe6efff,
            transparent: true,
            opacity: 0.95
        })
    );
    var hillBack = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            color: 0x12211f,
            transparent: true,
            opacity: 0.95
        })
    );
    var hillFront = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            color: 0x0b1614,
            transparent: true,
            opacity: 1
        })
    );
    var fogBack = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            color: 0x6f86ad,
            transparent: true,
            opacity: 0.12
        })
    );
    var fogFront = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            color: 0x9eb5cf,
            transparent: true,
            opacity: 0.16
        })
    );

    sky.position.set(0, 0.3, -9.8);
    sky.scale.set(forestThemeViewportSize.width, forestThemeViewportSize.height, 1);
    forestThemeGroup.add(sky);

    haze.position.set(0, -forestThemeViewportSize.height * 0.07, -9.74);
    haze.scale.set(forestThemeViewportSize.width, forestThemeViewportSize.height * 0.48, 1);
    forestThemeGroup.add(haze);

    moonGlow.position.set(forestThemeViewportSize.width * 0.24, forestThemeViewportSize.height * 0.22, -9.73);
    forestThemeGroup.add(moonGlow);

    moon.position.set(forestThemeViewportSize.width * 0.24, forestThemeViewportSize.height * 0.22, -9.72);
    forestThemeGroup.add(moon);

    hillBack.position.set(0, (groundAnchor + 0.55) - (hillBackHeight * 0.5), -9.66);
    hillBack.scale.set(forestThemeViewportSize.width * 1.18, hillBackHeight, 1);
    forestThemeGroup.add(hillBack);

    hillFront.position.set(0, (groundAnchor - 0.06) - (hillFrontHeight * 0.5), -9.52);
    hillFront.scale.set(forestThemeViewportSize.width * 1.22, hillFrontHeight, 1);
    forestThemeGroup.add(hillFront);

    fogBack.position.set(0, (groundAnchor + 0.72) - (fogBackHeight * 0.5), -9.48);
    fogBack.scale.set(forestThemeViewportSize.width * 1.12, fogBackHeight, 1);
    forestThemeGroup.add(fogBack);

    fogFront.position.set(0, (groundAnchor + 0.34) - (fogFrontHeight * 0.5), -9.16);
    fogFront.scale.set(forestThemeViewportSize.width * 1.14, fogFrontHeight, 1);
    forestThemeGroup.add(fogFront);
}

// Creates forest stars.
function createForestStars() {
    var starCount = 180;
    var positions = new Float32Array(starCount * 3);
    var i;

    for (i = 0; i < starCount; i += 1) {
        positions[(i * 3)] = forestThemeRand(-forestThemeViewportSize.width * 0.5, forestThemeViewportSize.width * 0.5);
        positions[(i * 3) + 1] = forestThemeRand(forestThemeViewportSize.height * 0.02, forestThemeViewportSize.height * 0.5);
        positions[(i * 3) + 2] = -9.67;
    }

    forestThemeStars = new THREE.Points(
        new THREE.BufferGeometry(),
        new THREE.PointsMaterial({
            color: 0xe6eeff,
            size: 0.06,
            transparent: true,
            opacity: 0.96,
            sizeAttenuation: true
        })
    );
    forestThemeStars.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    forestThemeGroup.add(forestThemeStars);
}

// Creates forest cloud item.
function createForestCloudItem() {
    var group = new THREE.Group();
    var puffs = [];
    var i;

    for (i = 0; i < 4; i += 1) {
        var puff = new THREE.Mesh(
            new THREE.CircleGeometry(0.5, 18),
            new THREE.MeshBasicMaterial({
                color: 0x9cb0c9,
                transparent: true,
                opacity: 0.22
            })
        );
        group.add(puff);
        puffs.push(puff);
    }

    group.userData.puffs = puffs;
    return group;
}

// Resets forest cloud item.
function resetForestCloudItem(item, xPosition) {
    var width = forestThemeRand(forestThemeViewportSize.width * 0.1, forestThemeViewportSize.width * 0.18);
    var height = width * forestThemeRand(0.3, 0.45);
    var puffs = item.userData.puffs;
    var i;

    item.position.set(xPosition, forestThemeRand(forestThemeViewportSize.height * 0.12, forestThemeViewportSize.height * 0.34), -9.44);
    item.userData.width = width * 1.25;

    for (i = 0; i < puffs.length; i += 1) {
        var puffScale = forestThemeRand(0.42, 0.68);
        puffs[i].scale.set(width * puffScale, height * forestThemeRand(0.95, 1.2), 1);
        puffs[i].position.set(
            (-width * 0.42) + (i * width * 0.26),
            forestThemeRand(-height * 0.08, height * 0.12),
            0
        );
        puffs[i].material.opacity = forestThemeRand(0.12, 0.24);
    }
}

// Creates forest tree item.
function createForestTreeItem(isNearLayer) {
    var group = new THREE.Group();
    var trunk = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            color: 0x5e3f29,
            transparent: true,
            opacity: 1
        })
    );
    var canopies = [];
    var i;

    group.add(trunk);
    for (i = 0; i < 3; i += 1) {
        var canopy = new THREE.Mesh(
            new THREE.CircleGeometry(0.5, 18),
            new THREE.MeshBasicMaterial({
                color: isNearLayer ? 0x1b3425 : 0x24392e,
                transparent: true,
                opacity: isNearLayer ? 0.98 : 0.9
            })
        );
        group.add(canopy);
        canopies.push(canopy);
    }

    group.userData.isNearLayer = isNearLayer;
    group.userData.trunk = trunk;
    group.userData.canopies = canopies;
    return group;
}

// Resets forest tree item.
function resetForestTreeItem(item, xPosition) {
    var isNearLayer = item.userData.isNearLayer;
    var scaleFactor = isNearLayer ? 1 : 0.72;
    var width = forestThemeRand(forestThemeViewportSize.width * 0.035, forestThemeViewportSize.width * 0.07) * scaleFactor;
    var height = forestThemeRand(forestThemeViewportSize.height * 0.2, forestThemeViewportSize.height * 0.34) * scaleFactor;
    var trunkWidth = width * forestThemeRand(0.18, 0.26);
    var trunkHeight = height * forestThemeRand(0.45, 0.62);
    var baseY = getForestGroundAnchor() + (isNearLayer ? 0.16 : 0.54);
    var canopies = item.userData.canopies;
    var i;

    item.position.set(xPosition, baseY + (height * 0.35), isNearLayer ? -9.18 : -9.38);
    item.userData.width = width * 1.1;
    item.userData.height = height;

    item.userData.trunk.scale.set(trunkWidth, trunkHeight, 1);
    item.userData.trunk.position.set(0, -height * 0.1, 0);
    item.userData.trunk.material.color.setHex(isNearLayer ? 0x26170f : 0x332218);

    for (i = 0; i < canopies.length; i += 1) {
        var canopyWidth = width * forestThemeRand(0.58, 0.86);
        var canopyHeight = canopyWidth * forestThemeRand(0.72, 0.95);
        canopies[i].scale.set(canopyWidth, canopyHeight, 1);
        canopies[i].position.set(
            (-width * 0.22) + (i * width * 0.22),
            (height * 0.1) + forestThemeRand(-height * 0.04, height * 0.15),
            0
        );
        canopies[i].material.color.setHex(isNearLayer ? 0x163120 : 0x294233);
        canopies[i].material.opacity = isNearLayer ? 0.98 : 0.88;
    }
}

// Creates forest grass item.
function createForestGrassItem() {
    var group = new THREE.Group();
    var blades = [];
    var i;

    for (i = 0; i < 3; i += 1) {
        var blade = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({
                color: 0x245d31,
                transparent: true,
                opacity: 0.96
            })
        );
        group.add(blade);
        blades.push(blade);
    }

    group.userData.blades = blades;
    return group;
}

// Creates forest bush item.
function createForestBushItem() {
    var group = new THREE.Group();
    var puffs = [];
    var i;

    for (i = 0; i < 5; i += 1) {
        var puff = new THREE.Mesh(
            new THREE.CircleGeometry(0.5, 18),
            new THREE.MeshBasicMaterial({
                color: 0x224f2d,
                transparent: true,
                opacity: 0.96
            })
        );
        group.add(puff);
        puffs.push(puff);
    }

    group.userData.puffs = puffs;
    return group;
}

// Resets forest bush item.
function resetForestBushItem(item, xPosition) {
    var width = forestThemeRand(forestThemeViewportSize.width * 0.05, forestThemeViewportSize.width * 0.1);
    var height = width * forestThemeRand(0.42, 0.62);
    var puffs = item.userData.puffs;
    var baseY = getForestGroundAnchor() + 0.04;
    var i;

    item.position.set(xPosition, baseY + (height * 0.1), -9.1);
    item.userData.width = width * 1.15;

    for (i = 0; i < puffs.length; i += 1) {
        puffs[i].scale.set(width * forestThemeRand(0.32, 0.48), height * forestThemeRand(0.72, 1.02), 1);
        puffs[i].position.set(
            (-width * 0.36) + (i * width * 0.18),
            forestThemeRand(-height * 0.04, height * 0.18),
            0
        );
        puffs[i].material.color.setHex(i % 2 === 0 ? 0x193d22 : 0x24542d);
    }
}

// Creates forest ground band item.
function createForestGroundBandItem() {
    var strip = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
                color: 0x54783b,
            transparent: true,
            opacity: 0.96
        })
    );

    return strip;
}

// Resets forest ground band item.
function resetForestGroundBandItem(item, xPosition) {
    var width = forestThemeRand(forestThemeViewportSize.width * 0.03, forestThemeViewportSize.width * 0.085);
    var height = forestThemeRand(forestThemeViewportSize.height * 0.01, forestThemeViewportSize.height * 0.026);
    var baseY = getForestGroundAnchor() - 0.22;

    item.scale.set(width, height, 1);
    item.position.set(xPosition, baseY + forestThemeRand(-0.03, 0.05), -8.98);
    item.rotation.z = forestThemeRand(-0.08, 0.08);
    item.material.color.setHex(forestThemeRandom() > 0.5 ? 0x4d7336 : 0x6b8745);
    item.userData.width = width;
}

// Resets forest grass item.
function resetForestGrassItem(item, xPosition) {
    var width = forestThemeRand(forestThemeViewportSize.width * 0.014, forestThemeViewportSize.width * 0.028);
    var height = forestThemeRand(forestThemeViewportSize.height * 0.055, forestThemeViewportSize.height * 0.1);
    var blades = item.userData.blades;
    var baseY = getForestGroundAnchor() - 0.1;
    var rotations = [-0.28, 0, 0.28];
    var i;

    item.position.set(xPosition, baseY + (height * 0.4), -9.02);
    item.userData.width = width * 1.15;

    for (i = 0; i < blades.length; i += 1) {
        blades[i].scale.set(width * forestThemeRand(0.22, 0.34), height * forestThemeRand(0.86, 1.08), 1);
        blades[i].position.set((i - 1) * width * 0.24, 0, 0);
        blades[i].rotation.z = rotations[i] * forestThemeRand(0.8, 1.15);
        blades[i].material.color.setHex(i === 1 ? 0x2f7a42 : 0x1e5a31);
    }
}

// Builds forest layer.
function buildForestLayer(layerName, count, createItem, resetItem, spacingMin, spacingMax) {
    var xPosition = -forestThemeViewportSize.width * 0.62;
    var i;

    for (i = 0; i < count; i += 1) {
        var item = createItem();
        resetItem(item, xPosition);
        forestThemeGroup.add(item);
        forestThemeLayers[layerName].push(item);
        xPosition += item.userData.width + forestThemeRand(spacingMin, spacingMax);
    }
}

// Handles rebuild forest theme.
function rebuildForestTheme() {
    forestThemeViewportSize = getForestThemeViewportSize();
    clearForestThemeChildren();
    createForestBackdrop();
    createForestStars();
    buildForestLayer('clouds', Math.max(4, Math.round(forestThemeViewportSize.width / 3.8)), createForestCloudItem, resetForestCloudItem, forestThemeViewportSize.width * 0.08, forestThemeViewportSize.width * 0.16);
    buildForestLayer('farTrees', Math.max(12, Math.round(forestThemeViewportSize.width / 0.95)), function() {
        return createForestTreeItem(false);
    }, resetForestTreeItem, forestThemeViewportSize.width * 0.012, forestThemeViewportSize.width * 0.035);
    buildForestLayer('nearTrees', Math.max(10, Math.round(forestThemeViewportSize.width / 1.25)), function() {
        return createForestTreeItem(true);
    }, resetForestTreeItem, forestThemeViewportSize.width * 0.02, forestThemeViewportSize.width * 0.05);
    buildForestLayer('bushes', Math.max(12, Math.round(forestThemeViewportSize.width / 0.9)), createForestBushItem, resetForestBushItem, forestThemeViewportSize.width * 0.012, forestThemeViewportSize.width * 0.03);
    buildForestLayer('groundBands', Math.max(24, Math.round(forestThemeViewportSize.width / 0.45)), createForestGroundBandItem, resetForestGroundBandItem, forestThemeViewportSize.width * 0.004, forestThemeViewportSize.width * 0.018);
    buildForestLayer('grass', Math.max(20, Math.round(forestThemeViewportSize.width / 0.55)), createForestGrassItem, resetForestGrassItem, forestThemeViewportSize.width * 0.002, forestThemeViewportSize.width * 0.012);
}

// Returns forest layer rightmost.
function getForestLayerRightmost(items, ignoredItem) {
    var rightmost = -Infinity;
    var i;

    for (i = 0; i < items.length; i += 1) {
        var currentItem = items[i];

        if (currentItem === ignoredItem) {
            continue;
        }

        rightmost = Math.max(rightmost, currentItem.position.x + (currentItem.userData.width * 0.5));
    }

    if (rightmost === -Infinity) {
        rightmost = forestThemeViewportSize.width * 0.55;
    }

    return rightmost;
}

// Updates forest layer.
function updateForestLayer(items, delta, movementSpeed, layerSpeed, spacingMin, spacingMax, resetItem) {
    var leftBoundary = -forestThemeViewportSize.width * 0.62;
    var i;

    for (i = 0; i < items.length; i += 1) {
        items[i].position.x -= movementSpeed * layerSpeed * delta;
    }

    for (i = 0; i < items.length; i += 1) {
        var item = items[i];
        if (item.position.x + (item.userData.width * 0.5) < leftBoundary) {
            var nextX = getForestLayerRightmost(items, item) + forestThemeRand(spacingMin, spacingMax) + (item.userData.width * 0.5);
            resetItem(item, nextX);
        }
    }
}

// Creates forest theme.
function createForestTheme() {
    if (!scene || forestThemeGroup) {
        return;
    }

    forestThemeGroup = new THREE.Group();
    forestThemeGroup.name = 'forest-theme';
    scene.add(forestThemeGroup);
    rebuildForestTheme();
}

// Updates forest theme size.
function updateForestThemeSize() {
    if (!forestThemeGroup) {
        return;
    }

    rebuildForestTheme();
}

// Updates forest theme.
function updateForestTheme(delta, movementSpeed) {
    if (!forestThemeGroup || !forestThemeViewportSize) {
        return;
    }

    updateForestLayer(forestThemeLayers.clouds, delta, movementSpeed, 1.4, forestThemeViewportSize.width * 0.08, forestThemeViewportSize.width * 0.16, resetForestCloudItem);
    updateForestLayer(forestThemeLayers.farTrees, delta, movementSpeed, 10.5, forestThemeViewportSize.width * 0.012, forestThemeViewportSize.width * 0.035, resetForestTreeItem);
    updateForestLayer(forestThemeLayers.nearTrees, delta, movementSpeed, 15.5, forestThemeViewportSize.width * 0.02, forestThemeViewportSize.width * 0.05, resetForestTreeItem);
    updateForestLayer(forestThemeLayers.bushes, delta, movementSpeed, 18.5, forestThemeViewportSize.width * 0.012, forestThemeViewportSize.width * 0.03, resetForestBushItem);
    updateForestLayer(forestThemeLayers.groundBands, delta, movementSpeed, 23.5, forestThemeViewportSize.width * 0.004, forestThemeViewportSize.width * 0.018, resetForestGroundBandItem);
    updateForestLayer(forestThemeLayers.grass, delta, movementSpeed, 21, forestThemeViewportSize.width * 0.002, forestThemeViewportSize.width * 0.012, resetForestGrassItem);
}
