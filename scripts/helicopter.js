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

        var boxShape = physicsDevice.createBoxShape({
                halfExtents : [1.0, 1.0, 2.0],
                margin : collisionMargin
            });

        var inertia = mathDevice.v3Copy(boxShape.inertia);
        inertia = mathDevice.v3ScalarMul(inertia, 1.0);

        // Initial box is created as a rigid body
        var helicopterRigidBody = this.rigidBody = physicsDevice.createRigidBody({
            shape : boxShape,
            mass : 20.0,
            transform : initTransform,
            friction : 0.5,
            restitution : 0.3,
            angularDamping: 0.9,
            linearDamping: 0.1,
            frozen : false,
            active : true
        });
        dynamicsWorld.addRigidBody(helicopterRigidBody);

        var position = mathDevice.m43BuildTranslation(0.0, 0.0, 0.0);
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
    },

    getDisplays : function helicopterGetDisplaysFn()
    {
        var mathDevice = this.globals.mathDevice;
        var helicopterRigidBody = this.rigidBody;
        return {
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
