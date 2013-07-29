// Copyright (c) 2010-2012 Turbulenz Limited

/*global TurbulenzEngine: false*/
/*global Floor: false */
/*global Camera: false */
/*global RequestHandler: false */
/*global Scene: false */
/*global SceneNode: false */
/*global ShaderManager: false */
/*global PhysicsManager: false */
/*global TurbulenzServices: false */
/*global DefaultRendering: false */
/*global EffectManager: false */

/*global DefaultMap: false */
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

    var intervalID;

    var graphicsDeviceParameters = { };
    var graphicsDevice = TurbulenzEngine.createGraphicsDevice(graphicsDeviceParameters);

    if (!graphicsDevice.shadingLanguageVersion)
    {
        errorCallback("No shading language support detected.\nPlease check your graphics drivers are up to date.");
        graphicsDevice = null;
        return;
    }

    var mathDeviceParameters = {};
    var mathDevice = TurbulenzEngine.createMathDevice(mathDeviceParameters);

    var inputDeviceParameters = { };
    var inputDevice = TurbulenzEngine.createInputDevice(inputDeviceParameters);

    var requestHandlerParameters = {};
    var requestHandler = RequestHandler.create(requestHandlerParameters);

    var physicsDeviceParameters = { };
    var physicsDevice = TurbulenzEngine.createPhysicsDevice(physicsDeviceParameters);

    var dynamicsWorldParameters = { };
    var dynamicsWorld = physicsDevice.createDynamicsWorld(dynamicsWorldParameters);

    var shaderManager = ShaderManager.create(graphicsDevice, requestHandler, null, errorCallback);
    var effectManager = EffectManager.create();
    var physicsManager = PhysicsManager.create(mathDevice, physicsDevice, dynamicsWorld);

    var renderer;
    var scene = Scene.create(mathDevice);

    // Setup camera & controller
    var camera = Camera.create(mathDevice);
    var worldUp = mathDevice.v3BuildYAxis();

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

    var boxShape = physicsDevice.createBoxShape({
            halfExtents : [2.0, 1.0, 1.0],
            margin : collisionMargin
        });

    var inertia = mathDevice.v3Copy(boxShape.inertia);
    inertia = mathDevice.v3ScalarMul(inertia, 1.0);

    // Initial box is created as a rigid body
    var helicopterRigidBody = physicsDevice.createRigidBody({
        shape : boxShape,
        mass : 20.0,
        transform : mathDevice.m43BuildTranslation(0.0, 5.0, 0.0),
        friction : 0.5,
        restitution : 0.3,
        angularDamping: 0.9,
        frozen : false,
        active : true
    });
    dynamicsWorld.addRigidBody(helicopterRigidBody);

    var position = mathDevice.m43BuildTranslation(0.0, 5.0, 0.0);
    var helicopterSceneNode = SceneNode.create({
            name: 'HeliPhys',
            local: position,
            dynamic: true,
            disabled: false
        });

    var physicsNode = {
        body : helicopterRigidBody,
        target : helicopterSceneNode,
        dynamic : true
    };
    physicsManager.physicsNodes.push(physicsNode);
    physicsManager.dynamicPhysicsNodes.push(physicsNode);
    scene.addRootNode(helicopterSceneNode);

    DefaultMap.create(physicsDevice, mathDevice, physicsManager, dynamicsWorld, scene);

    var keyCodes = inputDevice.keyCodes;
    var mouseCodes = inputDevice.mouseCodes;

    var onMouseMove = function onMouseMoveFn(deltaX, deltaY)
    {
        var rollAndPitch = mathDevice.v3Build(deltaX * 0.01, 0, -deltaY * 0.01);
        mathDevice.m43TransformVector(helicopterRigidBody.transform, rollAndPitch, rollAndPitch);
        helicopterRigidBody.angularVelocity = mathDevice.v3Add(helicopterRigidBody.angularVelocity, rollAndPitch);
    };

    var onMouseDown = function onMouseDownFn(mouseCode, x, y)
    {
        if (mouseCode === mouseCodes.BUTTON_0)
        {
            inputDevice.lockMouse();
        }
    };

    var keyDown = {};

    var onKeyUp = function physicsOnkeyUpFn(keynum)
    {
        keyDown[keynum] = false;
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

    var helicopterUpdate = function helicopterUpdateFn()
    {
        if (airSpeedElement && altitudeElement)
        {
            airSpeedElement.innerHTML = mathDevice.v3Length(helicopterRigidBody.linearVelocity).toFixed(2);
            altitudeElement.innerHTML = helicopterRigidBody.transform[10].toFixed(2);
        }

        var heliUp = mathDevice.m43Up(helicopterRigidBody.transform);
        var yaw;

        if (keyDown[keyCodes.UP] || keyDown[keyCodes.W])
        {
            heliUp = mathDevice.v3ScalarMul(heliUp, 0.3, heliUp);
            helicopterRigidBody.linearVelocity = mathDevice.v3Add(helicopterRigidBody.linearVelocity, heliUp);
            helicopterRigidBody.active = true;
        }
        else if (keyDown[keyCodes.DOWN] || keyDown[keyCodes.S])
        {
            var heliDown = mathDevice.v3ScalarMul(heliUp, -0.3, heliUp);
            helicopterRigidBody.linearVelocity = mathDevice.v3Add(helicopterRigidBody.linearVelocity, heliDown);
            helicopterRigidBody.active = true;
        }

        if (keyDown[keyCodes.LEFT] || keyDown[keyCodes.A])
        {
            yaw = mathDevice.v3Build(0, 0.1, 0);
            mathDevice.m43TransformVector(helicopterRigidBody.transform, yaw, yaw);
            helicopterRigidBody.angularVelocity = mathDevice.v3Add(helicopterRigidBody.angularVelocity, yaw);
            helicopterRigidBody.active = true;
        }
        else if (keyDown[keyCodes.RIGHT] || keyDown[keyCodes.D])
        {
            yaw = mathDevice.v3Build(0, -0.1, 0);
            mathDevice.m43TransformVector(helicopterRigidBody.transform, yaw, yaw);
            helicopterRigidBody.angularVelocity = mathDevice.v3Add(helicopterRigidBody.angularVelocity, yaw);
            helicopterRigidBody.active = true;
        }
    };

    var mainLoop = function mainLoopFn()
    {
        var currentTime = TurbulenzEngine.time;

        var heliPos = mathDevice.m43Pos(helicopterRigidBody.transform);

        /*var cameraPos = mathDevice.v3Build(-15.0, 3.0, 0.0);
        mathDevice.m43TransformPoint(helicopterRigidBody.transform, cameraPos, cameraPos);*/

        var cameraDeltaY = mathDevice.m43Up(helicopterRigidBody.transform);
        mathDevice.v3ScalarMul(cameraDeltaY, 3.0, cameraDeltaY);

        var cameraDeltaX = mathDevice.m43Right(helicopterRigidBody.transform);
        mathDevice.v3ScalarMul(cameraDeltaX, -15.0, cameraDeltaX);

        var cameraPos = mathDevice.v3Add(heliPos, mathDevice.v3Add(cameraDeltaX, cameraDeltaY));

        camera.lookAt(heliPos, worldUp, cameraPos);
        camera.updateViewMatrix();

        inputDevice.update();

        helicopterUpdate();

        var aspectRatio = (graphicsDevice.width / graphicsDevice.height);
        if (aspectRatio !== camera.aspectRatio)
        {
            camera.aspectRatio = aspectRatio;
            camera.updateProjectionMatrix();
        }
        camera.updateViewProjectionMatrix();

        dynamicsWorld.update();

        physicsManager.update();
        scene.update();

        renderer.update(graphicsDevice, camera, scene, currentTime);

        if (graphicsDevice.beginFrame())
        {
            graphicsDevice.clear(clearColor, 1.0, 0.0);

            floor.render(graphicsDevice, camera);

            scene.drawPhysicsNodes(graphicsDevice, shaderManager, camera, physicsManager);
            scene.drawPhysicsGeometry(graphicsDevice, shaderManager, camera, physicsManager);
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
