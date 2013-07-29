// Copyright (c) 2010-2012 Turbulenz Limited

/*global TurbulenzEngine: false*/
/*global Floor: false */
/*global Camera: false */
/*global CameraController: false */
/*global RequestHandler: false */
/*global Scene: false */
/*global SceneNode: false */
/*global ShaderManager: false */
/*global PhysicsManager: false */
/*global TurbulenzServices: false */
/*global DefaultRendering: false */
/*global EffectManager: false */
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
    var cameraInitialize = function cameraInitializeFn()
    {
        var worldUp = mathDevice.v3BuildYAxis();
        camera.lookAt(worldUp, worldUp, mathDevice.v3Build(0.0, 3.0, -15.0));
        camera.updateViewMatrix();
    };
    cameraInitialize();

    var cameraController = CameraController.create(graphicsDevice, inputDevice, camera);

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
            halfExtents : [1.0, 1.0, 1.0],
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

    var keyCodes = inputDevice.keyCodes;

    var onKeyUp = function physicsOnkeyUpFn(keynum)
    {
        cameraController.onkeyup(keynum);
    };

    var onKeyDown = function physicsOnkeyDownFn(keynum)
    {
        var heliUp = mathDevice.m43Up(helicopterRigidBody.transform);

        if (keynum === keyCodes.UP)
        {
            heliUp = mathDevice.v3ScalarMul(heliUp, 3, heliUp);
            helicopterRigidBody.linearVelocity = mathDevice.v3Add(helicopterRigidBody.linearVelocity, heliUp);
            helicopterRigidBody.active = true;
        }
        else if (keynum === keyCodes.DOWN)
        {
            var heliDown = mathDevice.v3Neg(heliUp);
            helicopterRigidBody.linearVelocity = mathDevice.v3Add(helicopterRigidBody.linearVelocity, heliDown);
            helicopterRigidBody.active = true;
        }
        else
        {
            cameraController.onkeydown(keynum);
        }
    };

    inputDevice.addEventListener("keyup", onKeyUp);
    inputDevice.addEventListener("keydown", onKeyDown);

    var mappingTable;

    var mainLoop = function mainLoopFn()
    {
        var currentTime = TurbulenzEngine.time;

        //inputDevice.update();
        cameraController.update();

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
