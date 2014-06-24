//
// Sensor - class description
//

/*global SceneNode: false */

function Sensor() {}

Sensor.prototype =
{
    addPhysics : function sensorAddPhysicsFn(globals)
    {
        // Specify the generic settings for the collision objects
        var collisionMargin = 0.005;

        var physicsDevice = globals.physicsDevice;
        var mathDevice = globals.mathDevice;
        var physicsManager = globals.physicsManager;
        var dynamicsWorld = globals.dynamicsWorld;
        var scene = globals.scene;

        var position = this.position;

        var boxShape = physicsDevice.createBoxShape({
                halfExtents : this.halfExtents,
                margin : collisionMargin
            });

        var inertia = mathDevice.v3Copy(boxShape.inertia);
        inertia = mathDevice.v3ScalarMul(inertia, 1.0);

        // Initial box is created as a rigid body
        var sensorRigidBody = this.rigidBody = physicsDevice.createRigidBody({
            shape : boxShape,
            mass : 20.0,
            transform : position,
            friction : 0.5,
            restitution : 0.3,
            angularDamping: 0.9,
            linearDamping: 0.1,
            frozen : false,
            active : true
        });
        dynamicsWorld.addRigidBody(sensorRigidBody);

        var sceneNodePosition = mathDevice.m43BuildTranslation(0.0, 0.0, 0.0);
        var sensorSceneNode = SceneNode.create({
                name: 'sensor_' + this.name,
                local: sceneNodePosition,
                dynamic: true,
                disabled: false,
                extents: [-1.0, -1.0, -2.0, 1.0, 1.0, 2.0]
            });

        var physicsNode = {
            body : sensorRigidBody,
            target : sensorSceneNode,
            dynamic : true
        };
        physicsManager.physicsNodes.push(physicsNode);
        physicsManager.dynamicPhysicsNodes.push(physicsNode);
        scene.addRootNode(sensorSceneNode);
    },
};

Sensor.create = function sensorCreateFn(mathDevice, name, halfExtents, position, sensorUp)
{
    var sensor = new Sensor();

    sensor.name = name;
    sensor.mathDevice = mathDevice;
    sensor.halfExtents = halfExtents;
    sensor.position = position;
    sensor.sensorUp = sensorUp;

    return sensor;
};
