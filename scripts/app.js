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

    var initTransform = mathDevice.m43BuildTranslation(0.0, 5.0, 0.0);
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

    var onMouseDown = function onMouseDownFn(mouseCode, x, y)
    {
        if (mouseCode === mouseCodes.BUTTON_0)
        {
            inputDevice.lockMouse();
        }
    };

    var onKeyUp = function physicsOnkeyUpFn(keynum)
    {
        keyDown[keynum] = false;

        if (keynum === keyCodes.R)
        {
            helicopter.teleport(mathDevice.m43BuildTranslation(0.0, 5.0, 0.0));
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

    var mappingTable;

    var airSpeedElement = document.getElementById("airSpeed");
    var altitudeElement = document.getElementById("altitude");

    var previousFrameTime = 0;

    var mainLoop = function mainLoopFn()
    {
        var currentTime = TurbulenzEngine.time;
        var delta = currentTime - previousFrameTime;
        if (delta > 0.1)
        {
            delta = 0.1;
        }
        previousFrameTime = TurbulenzEngine.time;

        var heliTransform = helicopter.getTransform();
        var heliVelocity = helicopter.getLinearVelocity();
        var heliPos = mathDevice.m43Pos(heliTransform);

        /*var cameraPos = mathDevice.v3Build(-15.0, 3.0, 0.0);
        mathDevice.m43TransformPoint(helicopterRigidBody.transform, cameraPos, cameraPos);*/

        var cameraAt = mathDevice.m43At(heliTransform);
        mathDevice.v3ScalarMul(cameraAt, -10.0, cameraAt);

        var cameraUp = mathDevice.v3ScalarMul(worldUp, 6.0);

        var cameraNewPos = mathDevice.v3Add(cameraAt, cameraUp);
        mathDevice.v3AddScalarMul(cameraNewPos, heliVelocity, -0.5, cameraNewPos);

        var distance = mathDevice.v3Length(cameraNewPos);
        mathDevice.v3ScalarMul(cameraNewPos, 15 / distance, cameraNewPos);
        mathDevice.v3Add(heliPos, cameraNewPos, cameraNewPos);

        camera.lookAt(heliPos, worldUp, cameraNewPos);
        camera.updateViewMatrix();

        inputDevice.update();

        map.update(helicopter);

        if (airSpeedElement && altitudeElement)
        {
            var helicopterDisplays = helicopter.getDisplays();
            airSpeedElement.innerHTML = helicopterDisplays.airSpeed;
            altitudeElement.innerHTML = helicopterDisplays.altitude;
        }

        helicopter.update(delta, keyDown, mouseDeltaX, mouseDeltaY);
        mouseDeltaX = 0;
        mouseDeltaY = 0;

        var aspectRatio = (graphicsDevice.width / graphicsDevice.height);
        if (aspectRatio !== camera.aspectRatio)
        {
            camera.aspectRatio = aspectRatio;
            camera.updateProjectionMatrix();
        }
        camera.updateViewProjectionMatrix();

        renderer.update(graphicsDevice, camera, scene, currentTime);

        if (graphicsDevice.beginFrame())
        {
            graphicsDevice.clear(clearColor, 1.0, 0.0);

            floor.render(graphicsDevice, camera);

            scene.drawPhysicsNodes(graphicsDevice, shaderManager, camera, physicsManager);
            scene.drawPhysicsGeometry(graphicsDevice, shaderManager, camera, physicsManager);
        }

        graphicsDevice.endFrame();

        dynamicsWorld.update();

        physicsManager.update();
        scene.update();

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
