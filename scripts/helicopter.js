//
// Helicopter - class description
//

/*global SceneNode: false */

function Helicopter() {}

Helicopter.prototype =
{
    teleport : function helicopterTeleportFn(transform) // use m43BuildTranslation
    {
        var mathDevice = this.globals.mathDevice;
        var helicopterRigidBody = this.rigidBody;

        helicopterRigidBody.transform = transform;
        helicopterRigidBody.linearVelocity = mathDevice.v3BuildZero();
        helicopterRigidBody.angularVelocity = mathDevice.v3BuildZero();
    },

    fire : function helicopterFireFn()
    {
        var globals = this.globals;
        var mathDevice = globals.mathDevice;
        var physicsDevice = globals.physicsDevice;
        var physicsManager = globals.physicsManager;
        var dynamicsWorld = globals.dynamicsWorld;
        var scene = globals.scene;

        var helicopterRigidBody = this.rigidBody;
        var m43HelicopterTransform = helicopterRigidBody.transform;

        var v3At = mathDevice.m43At(m43HelicopterTransform);
        var v3Pos = mathDevice.m43Pos(m43HelicopterTransform);
        var v3Position = mathDevice.v3AddScalarMul(v3Pos, v3At, 3);
        var v3Velocity = mathDevice.v3ScalarMul(v3At, 50);

        var m43BulletTransform = mathDevice.m43Build(
            m43HelicopterTransform[0],
            m43HelicopterTransform[1],
            m43HelicopterTransform[2],
            m43HelicopterTransform[3],
            m43HelicopterTransform[4],
            m43HelicopterTransform[5],
            m43HelicopterTransform[6],
            m43HelicopterTransform[7],
            m43HelicopterTransform[8],
            v3Position[0],
            v3Position[1],
            v3Position[2]);

        var collisionMargin = 0.005;

        var boxShape = physicsDevice.createBoxShape({
                halfExtents : this.bulletHalfExtents,
                margin : collisionMargin
            });

        var inertia = mathDevice.v3Copy(boxShape.inertia);
        inertia = mathDevice.v3ScalarMul(inertia, 1.0);

        var boxBody;

        // Initial box is created as a rigid body
        boxBody = physicsDevice.createRigidBody({
            shape : boxShape,
            mass: 0.1,
            inertia: inertia,
            transform : m43BulletTransform,
            friction : 0.5,
            restitution : 0.3,
            linearVelocity : v3Velocity,
            angularVelocity : mathDevice.v3Build(0.001, 0.001, 0.001)
            //active : false
        });

        var boxSceneNode = SceneNode.create({
                name: 'BulletPhys' + this.bulletCount,
                local: mathDevice.m43Copy(m43BulletTransform),
                dynamic: true,
                disabled: false
            });
        this.bulletCount += 1;

        var physicsNode = {
            body : boxBody,
            target : boxSceneNode,
            dynamic : true
        };

        scene.addRootNode(boxSceneNode);
        boxSceneNode.physicsNodes = [physicsNode];

        physicsManager.physicsNodes.push(physicsNode);
        // TODO: should be setStatic?  setDynamic takes no args.
        //boxSceneNode.setDynamic(false);
        boxSceneNode.setDynamic();
        physicsManager.enableHierarchy(boxSceneNode, true);
    },

    update : function helicopterUpdateFn(delta, keyDown, mouseDeltaX, mouseDeltaY)
    {
        var mathDevice = this.globals.mathDevice;
        var keyCodes = this.globals.inputDevice.keyCodes;

        var helicopterRigidBody = this.rigidBody;
        var heliUp = mathDevice.m43Up(helicopterRigidBody.transform);

        if (keyDown[keyCodes.UP] || keyDown[keyCodes.W])
        {
            this.collectiveInput = this.collectiveRest + this.collectiveInputAcceleration;
        }
        else if (keyDown[keyCodes.DOWN] || keyDown[keyCodes.S])
        {
            this.collectiveInput = this.collectiveRest - this.collectiveInputAcceleration;
        }
        else
        {
            this.collectiveInput = this.collectiveRest;
        }

        var yaw = 0;
        if (keyDown[keyCodes.LEFT] || keyDown[keyCodes.A])
        {
            yaw += 1;
        }
        if (keyDown[keyCodes.RIGHT] || keyDown[keyCodes.D])
        {
            yaw -= 1;
        }

        if (this.collectiveInput !== 0)
        {
            heliUp = mathDevice.v3ScalarMul(heliUp, this.collectiveInput * delta, heliUp);
            helicopterRigidBody.linearVelocity = mathDevice.v3Add(helicopterRigidBody.linearVelocity, heliUp);
        }

        if (yaw !== 0)
        {
            yaw = mathDevice.v3Build(0, yaw * this.rudderAcceleration * delta, 0);
            mathDevice.m43TransformVector(helicopterRigidBody.transform, yaw, yaw);
            helicopterRigidBody.angularVelocity = mathDevice.v3Add(helicopterRigidBody.angularVelocity, yaw);
        }

        if (mouseDeltaX !== 0 && mouseDeltaY !== 0)
        {
            var tmpRollAndPitch = this.tmpRollAndPitch;
            var deltaAcceleration = this.cyclicAcceleration * delta;
            mathDevice.v3Build(mouseDeltaY * deltaAcceleration, 0, mouseDeltaX * deltaAcceleration, tmpRollAndPitch);
            mathDevice.m43TransformVector(helicopterRigidBody.transform, tmpRollAndPitch, tmpRollAndPitch);
            helicopterRigidBody.angularVelocity = mathDevice.v3Add(helicopterRigidBody.angularVelocity, tmpRollAndPitch);
        }

        helicopterRigidBody.active = true;
    },

    addPhysics : function helicopterAddPhysicsFn(initTransform)
    {
        // Specify the generic settings for the collision objects
        var collisionMargin = 0.005;

        var physicsDevice = this.globals.physicsDevice;
        var mathDevice = this.globals.mathDevice;
        var physicsManager = this.globals.physicsManager;
        var dynamicsWorld = this.globals.dynamicsWorld;
        var scene = this.globals.scene;

        var helicopterBottomWidth = 0.9;
        var helicopterPoints = [
        //top
            1,   1,  1,
            -1,  1,  1,
            1,   1,  -1,
            -1,  1,  -1,

        //bottom
            helicopterBottomWidth,  -1,  helicopterBottomWidth,
            -helicopterBottomWidth, -1,  helicopterBottomWidth,
            helicopterBottomWidth,  -1,  -helicopterBottomWidth,
            -helicopterBottomWidth, -1,  -helicopterBottomWidth,

        //front
            0,   0.5, 1.3,
        //top blades
            0,   1.1, 0.5,
        //tail
            0,   1,  -3
        ];

        var i;
        for (i = 0; i < helicopterPoints.length; i += 1)
        {
            helicopterPoints[i] += Math.random() * 0.001;
        }

        var helicopterShape = physicsDevice.createConvexHullShape({
                points : helicopterPoints,
                margin : collisionMargin
            });

        var inertia = mathDevice.v3Copy(helicopterShape.inertia);
        inertia = mathDevice.v3ScalarMul(inertia, 1.0);

        // Initial box is created as a rigid body
        var helicopterRigidBody = this.rigidBody = physicsDevice.createRigidBody({
            shape : helicopterShape,
            mass : 20.0,
            transform : initTransform,
            friction : 0.5,
            restitution : 0.3,
            angularDamping: 0.9,
            linearDamping: 0.1,
            frozen : false
        });
        dynamicsWorld.addRigidBody(helicopterRigidBody);

        var position = mathDevice.m43BuildTranslation(0.0, 0.0, 0.0);
        var helicopterSceneNode = SceneNode.create({
                name: 'HeliPhys',
                local: position,
                dynamic: true,
                disabled: false,
                extents: [-1.0, -1.0, -2.0, 1.0, 1.0, 2.0]
            });

        var physicsNode = {
            body : helicopterRigidBody,
            target : helicopterSceneNode,
            dynamic : true
        };
        physicsManager.physicsNodes.push(physicsNode);
        physicsManager.dynamicPhysicsNodes.push(physicsNode);
        scene.addRootNode(helicopterSceneNode);
    },

    getDisplays : function helicopterGetDisplaysFn()
    {
        var mathDevice = this.globals.mathDevice;
        var helicopterRigidBody = this.rigidBody;
        var helicopterTransform = helicopterRigidBody.transform;
        return {
            gpsX: helicopterTransform[9].toFixed(2),
            gpsY: helicopterTransform[10].toFixed(2),
            gpsZ: helicopterTransform[11].toFixed(2),
            airSpeed: mathDevice.v3Length(helicopterRigidBody.linearVelocity).toFixed(2),
            altitude: helicopterRigidBody.transform[10].toFixed(2)
        };
    },

    getLinearVelocity : function helicopterGetLinearVelocityFn()
    {
        return this.rigidBody.linearVelocity;
    },

    getTransform : function helicopterGetTransformFn()
    {
        return this.rigidBody.transform;
    }
};

Helicopter.create = function helicopterCreateFn(globals, stats)
{
    var helicopter = new Helicopter();

    var mathDevice = globals.mathDevice;

    helicopter.globals = globals;
    helicopter.rigidBody = null;

    helicopter.bulletCount = 0;

    helicopter.bulletHalfExtents = [0.1, 0.1, 0.5];

    helicopter.collectiveInputMax = stats.collectiveInputMax;
    helicopter.collectiveInputMin = stats.collectiveInputMin;
    helicopter.collectiveInputAcceleration = stats.collectiveInputAcceleration;
    helicopter.collectiveRest = stats.collectiveRest; // the value collective will return to with no input
    helicopter.collectiveRestLimiter = stats.collectiveRestLimiter;
    helicopter.collectiveInput = 0;

    helicopter.rudderAcceleration = stats.rudderAcceleration;

    // TODO - limits cyclic pitch/roll to avoid flipping the helicopter (like bike stabilizers)
    // take the helicopter up normal with worldUp and scale cyclic controls with the result
    //helicopter.cyclicMax = stats.cyclicMax;
    helicopter.cyclicAcceleration = stats.cyclicAcceleration;

    helicopter.tmpRollAndPitch = mathDevice.v3BuildZero();

    return helicopter;
};
