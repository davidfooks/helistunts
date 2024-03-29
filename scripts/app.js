// Copyright (c) 2010-2012 Turbulenz Limited

/*global TurbulenzEngine: false*/
/*global Floor: false */
/*global Camera: false */
/*global RequestHandler: false */
/*global Scene: false */
/*global ShaderManager: false */
/*global PhysicsManager: false */
/*global TurbulenzServices: false */
/*global DefaultRendering: false */
/*global EffectManager: false */

/*global DefaultMap: false */
/*global Helicopter: false */
/*exported appCreate*/

var appDestroyCallback;
function appCreate()
{
    var errorCallback = function errorCallback(msg)
    {
        window.alert(msg);
    };

    var versionElem = document.getElementById("engine_version");
    if (versionElem)
    {
        versionElem.innerHTML = TurbulenzEngine.version;
    }

    var globals = {};

    var intervalID;

    var graphicsDeviceParameters = { };
    var graphicsDevice = globals.graphicsDevice = TurbulenzEngine.createGraphicsDevice(graphicsDeviceParameters);


    if (!graphicsDevice.shadingLanguageVersion)
    {
        errorCallback("No shading language support detected.\nPlease check your graphics drivers are up to date.");
        graphicsDevice = null;
        return;
    }

    var mathDeviceParameters = {};
    var mathDevice = globals.mathDevice = TurbulenzEngine.createMathDevice(mathDeviceParameters);

    var inputDeviceParameters = { };
    var inputDevice = globals.inputDevice = TurbulenzEngine.createInputDevice(inputDeviceParameters);

    var requestHandlerParameters = {};
    var requestHandler = globals.requestHandler = RequestHandler.create(requestHandlerParameters);

    var physicsDeviceParameters = { };
    var physicsDevice = globals.physicsDevice = TurbulenzEngine.createPhysicsDevice(physicsDeviceParameters);

    var dynamicsWorldParameters = { };
    var dynamicsWorld = globals.dynamicsWorld = physicsDevice.createDynamicsWorld(dynamicsWorldParameters);

    var shaderManager = globals.shaderManager = ShaderManager.create(graphicsDevice, requestHandler, null, errorCallback);
    var effectManager = globals.effectManager = EffectManager.create();
    var physicsManager = globals.physicsManager = PhysicsManager.create(mathDevice, physicsDevice, dynamicsWorld);

    var renderer;
    var scene = globals.scene = Scene.create(mathDevice);

    // Setup camera & controller
    var camera = globals.camera = Camera.create(mathDevice);
    var worldUp = globals.worldUp = mathDevice.v3BuildYAxis();

    var floor = Floor.create(graphicsDevice, mathDevice);

    var clearColor = mathDevice.v4Build(0.95, 0.95, 1.0, 1.0);

    // Specify the generic settings for the collision objects
    var collisionMargin = 0.005;

    // Floor is represented by a plane
    var floorShape = physicsDevice.createPlaneShape({
            normal : mathDevice.v3Build(0, 1, 0),
            distance : 0,
            margin : collisionMargin
        });

    var floorObject = physicsDevice.createCollisionObject({
            shape : floorShape,
            transform : mathDevice.m43BuildIdentity(),
            friction : 0.5,
            restitution : 0.3,
            group: physicsDevice.FILTER_STATIC,
            mask: physicsDevice.FILTER_ALL
        });

    // Adds the floor collision object to the physicsDevice
    dynamicsWorld.addCollisionObject(floorObject);

    var map = DefaultMap.create(globals);
    var helicopter = Helicopter.create(globals, {
        collectiveInputAcceleration: 25.0,
        collectiveRest: 0, //8,
        rudderAcceleration: 3,
        cyclicAcceleration: 0.3
    });

    var initTransform = mathDevice.m43BuildTranslation(0.0, 25.0, 0.0);
    helicopter.addPhysics(initTransform);

    var keyCodes = inputDevice.keyCodes;
    var mouseCodes = inputDevice.mouseCodes;

    var keyDown = {};
    var mouseDeltaX = 0;
    var mouseDeltaY = 0;

    var onMouseMove = function onMouseMoveFn(deltaX, deltaY)
    {
        mouseDeltaX += deltaX;
        mouseDeltaY += deltaY;
    };

    var onMouseDown = function onMouseDownFn(mouseCode/*, x, y*/)
    {
        inputDevice.lockMouse();
        if (mouseCode === mouseCodes.BUTTON_0)
        {
            helicopter.firing = true;
        }
    };

    var onMouseUp = function onMouseUpFn(mouseCode/*, x, y*/)
    {
        if (mouseCode === mouseCodes.BUTTON_0)
        {
            helicopter.firing = false;
        }
    };

    var onKeyUp = function physicsOnkeyUpFn(keynum)
    {
        keyDown[keynum] = false;

        if (keynum === keyCodes.R)
        {
            helicopter.teleport(mathDevice.m43Copy(initTransform));
            map.reset(globals);
        }
    };

    var onKeyDown = function physicsOnkeyDownFn(keynum)
    {
        keyDown[keynum] = true;
    };

    inputDevice.addEventListener("keyup", onKeyUp);
    inputDevice.addEventListener("keydown", onKeyDown);

    inputDevice.addEventListener('mousemove', onMouseMove);
    inputDevice.addEventListener('mousedown', onMouseDown);
    inputDevice.addEventListener('mouseup', onMouseUp);

    var mappingTable;

    var gpsXElement = document.getElementById("gpsX");
    var gpsYElement = document.getElementById("gpsY");
    var gpsZElement = document.getElementById("gpsZ");
    var airSpeedElement = document.getElementById("airSpeed");
    var altitudeElement = document.getElementById("altitude");

    var previousFrameTime = 0;

    var updateCamera = function updateCameraFn()
    {
        var heliTransform = helicopter.getTransform();
        var heliVelocity = helicopter.getLinearVelocity();
        var heliPos = mathDevice.m43Pos(heliTransform);

        /*var cameraPos = mathDevice.v3Build(-15.0, 3.0, 0.0);
        mathDevice.m43TransformPoint(helicopterRigidBody.transform, cameraPos, cameraPos);*/

        var cameraAt = mathDevice.m43At(heliTransform);
        mathDevice.v3ScalarMul(cameraAt, -10.0, cameraAt);

        var cameraUp = mathDevice.v3ScalarMul(worldUp, 6.0);

        var cameraNewPos = mathDevice.v3Add(cameraAt, cameraUp);

        // Velocity influence
        mathDevice.v3AddScalarMul(cameraNewPos, heliVelocity, -0.5, cameraNewPos);

        var distance = mathDevice.v3Length(cameraNewPos);
        mathDevice.v3ScalarMul(cameraNewPos, 15 / distance, cameraNewPos);

        var v3Temp = mathDevice.v3Normalize(cameraNewPos);
        var v3Temp2 = mathDevice.v3Normalize(cameraAt);
        var v3Temp3 = mathDevice.v3Normalize(cameraUp);

        var dotBack = mathDevice.v3Dot(v3Temp2, v3Temp);
        var dotUp = mathDevice.v3Dot(v3Temp3, v3Temp);

        mathDevice.v3Add(heliPos, cameraNewPos, cameraNewPos);

        // Back influence
        mathDevice.v3ScalarMul(v3Temp2, (30 * (1.0 - dotBack)), v3Temp2);
        mathDevice.v3Add(cameraNewPos, v3Temp2, cameraNewPos);

        // Up influence
        mathDevice.v3ScalarMul(v3Temp3, (5 * (1.0 - dotUp)), v3Temp3);
        mathDevice.v3Add(cameraNewPos, v3Temp3, cameraNewPos);


        camera.lookAt(heliPos, worldUp, cameraNewPos);
        camera.updateViewMatrix();
    };

    var updateCamera2 = function updateCamera2Fn()
    {
        var heliTransform = helicopter.getTransform();
        var heliVelocity = helicopter.getLinearVelocity();
        var heliPos = mathDevice.m43Pos(heliTransform);
        var heliUp = mathDevice.m43Up(heliTransform);
        var heliRight = mathDevice.m43Right(heliTransform);

        var quatHeliRotation = mathDevice.quatFromM43(heliTransform);

        var quatYRotation = mathDevice.quatFromAxisRotation(heliUp, Math.PI * 2 * -1/16 + Math.PI);
        var quatXRotation = mathDevice.quatFromAxisRotation(heliRight, Math.PI * 2 * -1/16);//Math.PI * 2 * 1/8);

        var quatTemp = mathDevice.quatMul(quatHeliRotation, quatYRotation);
        mathDevice.quatMul(quatTemp, quatXRotation, quatTemp);

        var cameraNewPos = mathDevice.v3Build(0, 0, 0);

        mathDevice.quatTransformVector(quatTemp, mathDevice.v3Build(0, 0, 10), cameraNewPos);
        mathDevice.v3Add(heliPos, cameraNewPos, cameraNewPos);

        var quatPosCamera = mathDevice.quatPosBuild(quatTemp, cameraNewPos);
        mathDevice.m43FromQuatPos(quatPosCamera, camera.matrix);

        mathDevice.m43SetPos(camera.matrix, cameraNewPos);

        camera.updateViewMatrix();
    };

    var mainLoop = function mainLoopFn()
    {
        var currentTime = TurbulenzEngine.time;
        var delta = currentTime - previousFrameTime;
        if (delta > 0.1)
        {
            delta = 0.1;
        }
        previousFrameTime = TurbulenzEngine.time;

        inputDevice.update();

        dynamicsWorld.update();

        physicsManager.update();

        if (airSpeedElement && altitudeElement)
        {
            var helicopterDisplays = helicopter.getDisplays();
            gpsXElement.innerHTML = helicopterDisplays.gpsX;
            gpsYElement.innerHTML = helicopterDisplays.gpsY;
            gpsZElement.innerHTML = helicopterDisplays.gpsZ;
            airSpeedElement.innerHTML = helicopterDisplays.airSpeed;
            altitudeElement.innerHTML = helicopterDisplays.altitude;
        }

        helicopter.update(delta, keyDown, mouseDeltaX, mouseDeltaY);
        mouseDeltaX = 0;
        mouseDeltaY = 0;

        scene.update();

        updateCamera();

        var aspectRatio = (graphicsDevice.width / graphicsDevice.height);
        if (aspectRatio !== camera.aspectRatio)
        {
            camera.aspectRatio = aspectRatio;
            camera.updateProjectionMatrix();
        }
        camera.updateViewProjectionMatrix();
        camera.updateFrustumPlanes();

        renderer.update(graphicsDevice, camera, scene, currentTime);

        if (graphicsDevice.beginFrame())
        {
            graphicsDevice.clear(clearColor, 1.0, 0.0);

            floor.render(graphicsDevice, camera);

            scene.drawPhysicsNodes(graphicsDevice, shaderManager, camera, physicsManager);
            scene.drawPhysicsGeometry(graphicsDevice, shaderManager, camera, physicsManager);
            //scene.drawSceneNodeHierarchy(graphicsDevice, shaderManager, camera);
            //scene.drawNodesTree(scene.rootNodes, graphicsDevice, shaderManager, camera, 10);
            //scene.drawOpaqueNodesExtents(graphicsDevice, shaderManager, camera);
        }

        graphicsDevice.endFrame();
    };

    var loadingLoop = function loadingLoopFn()
    {
        if (graphicsDevice.beginFrame())
        {
            graphicsDevice.clear(clearColor);
            graphicsDevice.endFrame();
        }

        if (shaderManager.getNumPendingShaders() === 0)
        {
            TurbulenzEngine.clearInterval(intervalID);

            renderer.updateShader(shaderManager);

            intervalID = TurbulenzEngine.setInterval(mainLoop, 1000 / 60);
        }
    };

    var mappingTableReceived = function mappingTableReceivedFn(mappingTable)
    {
        shaderManager.setPathRemapping(mappingTable.urlMapping, mappingTable.assetPrefix);

        renderer = DefaultRendering.create(graphicsDevice,
                                       mathDevice,
                                       shaderManager,
                                       effectManager);

        intervalID = TurbulenzEngine.setInterval(loadingLoop, 1000 / 60);
    };

    var gameSessionCreated = function gameSessionCreatedFn(gameSession)
    {
        mappingTable = TurbulenzServices.createMappingTable(requestHandler,
                                                            gameSession,
                                                            mappingTableReceived);
    };

    var gameSession = TurbulenzServices.createGameSession(requestHandler, gameSessionCreated);

    appDestroyCallback = function appDestroyCallbackFn()
    {
        TurbulenzEngine.clearInterval(intervalID);

        TurbulenzEngine.flush();

        if (gameSession)
        {
            gameSession.destroy();
            gameSession = null;
        }

    };
    TurbulenzEngine.onunload = appDestroyCallback;
}
