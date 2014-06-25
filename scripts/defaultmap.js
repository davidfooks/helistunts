//
// DefaultMap - class description
//

/*global Sensor: false */
/*global SceneNode: false */

function DefaultMap() {}

DefaultMap.prototype =
{
    reset: function defaultMapResetFn(globals)
    {
        var mathDevice = globals.mathDevice;

        var rigidBodiesData = this.rigidBodiesData;
        var rigidBodyId;
        for (rigidBodyId in rigidBodiesData)
        {
            if (rigidBodiesData.hasOwnProperty(rigidBodyId))
            {
                var rigidBodyData = rigidBodiesData[rigidBodyId];
                var rigidBody = rigidBodyData.rigidBody;
                rigidBody.transform = mathDevice.m43Copy(rigidBodyData.initTransform);
                rigidBody.linearVelocity = mathDevice.v3Build(0.001, 0.001, 0.001);
                rigidBody.angularVelocity = mathDevice.v3Build(0.001, 0.001, 0.001);
                rigidBody.active = true;
            }
        }
    }
};

DefaultMap.create = function defaultMapCreateFn(globals)
{
    var physicsDevice = globals.physicsDevice;
    var mathDevice = globals.mathDevice;
    var physicsManager = globals.physicsManager;
    var dynamicsWorld = globals.dynamicsWorld;
    var scene = globals.scene;

    var defaultMap = new DefaultMap();

    defaultMap.rigidBodiesData = {};
    var rigidBodiesCount = 0;

    var count = 0;

    var addBox = function addBoxFn(halfExtents, x, y, z, dynamic)
    {
        dynamic = dynamic || false;

        //var collisionMargin = 0.005;

        var boxShape = physicsDevice.createBoxShape({
                halfExtents : halfExtents//,
                //margin : collisionMargin
            });

        var inertia = mathDevice.v3Copy(boxShape.inertia);
        inertia = mathDevice.v3ScalarMul(inertia, 1.0);

        var boxBody;

        // Initial box is created as a rigid body
        if (dynamic)
        {
            var initTransform = mathDevice.m43BuildTranslation(x, y, z);
            boxBody = physicsDevice.createRigidBody({
                shape : boxShape,
                mass: 0.1,
                inertia: inertia,
                transform : initTransform,
                friction : 0.5,
                restitution : 0.3,
                linearVelocity : mathDevice.v3Build(0.001, 0.001, 0.001),
                angularVelocity : mathDevice.v3Build(0.001, 0.001, 0.001)
                //active : false
            });

            defaultMap.rigidBodiesData[rigidBodiesCount] = {
                rigidBody: boxBody,
                initTransform: mathDevice.m43Copy(initTransform)
            };

            rigidBodiesCount += 1;
        }
        else
        {
            boxBody = physicsDevice.createCollisionObject({
                shape : boxShape,
                transform : mathDevice.m43BuildTranslation(x, y, z),
                friction : 0.5,
                restitution : 0.3,
                kinematic : false,
                group: physicsDevice.FILTER_STATIC,
                mask: physicsDevice.FILTER_ALL
            });
        }

        var position = mathDevice.m43BuildTranslation(x, y, z);
        var boxSceneNode = SceneNode.create({
                name: 'BoxPhys' + count,
                local: position,
                dynamic: dynamic,
                disabled: false
            });
        count += 1;

        var physicsNode = {
            body : boxBody,
            target : boxSceneNode,
            dynamic : dynamic
        };

        scene.addRootNode(boxSceneNode);
        boxSceneNode.physicsNodes = [physicsNode];

        physicsManager.physicsNodes.push(physicsNode);
        if (dynamic)
        {
            dynamicsWorld.addRigidBody(boxBody);
            physicsManager.dynamicPhysicsNodes.push(physicsNode);
        }
        else
        {
            // TODO: should be setStatic?  setDynamic takes no args.
            //boxSceneNode.setDynamic(false);
            boxSceneNode.setDynamic();
            physicsManager.enableHierarchy(boxSceneNode, true);
        }
    };

    // landing pad
    addBox([10.0, 1.0, 10.0], 0.0, 1.0, 0.0);

    // pillars
    addBox([2.0, 10.0, 2.0], 35.0,  10.0,   0.0);
    addBox([2.0, 10.0, 2.0], 0.0,   10.0,  35.0);
    addBox([2.0, 10.0, 2.0], -35.0, 10.0,   0.0);
    addBox([2.0, 10.0, 2.0], 0.0,   10.0, -35.0);

    // pillars landing pads
    addBox([4.0, 1.0, 4.0], 35.0,  21.0,   0.0);
    addBox([4.0, 1.0, 4.0], 0.0,   21.0,  35.0);
    addBox([4.0, 1.0, 4.0], -35.0, 21.0,   0.0);
    addBox([4.0, 1.0, 4.0], 0.0,   21.0, -35.0);

    // var sensors = defaultMap.sensors = [
    //     Sensor.create(mathDevice, 'checkpoint0', [5, 5, 5], mathDevice.v3Build(35, 26, 0), mathDevice.v3Build(0, 1, 0))
    // ];

    // var sensorsLength = sensors.length;
    // var i;
    // for (i = 0; i < sensorsLength; i += 1)
    // {
    //     var sensor = sensors[i];
    //     sensor.addPhysics(globals);
    // }

    // topple
    addBox([1.0, 5.0, 1.0],  35.0, 27.5,   0.0, true);
    addBox([1.0, 5.0, 1.0],   0.0, 27.5,  35.0, true);
    addBox([1.0, 5.0, 1.0], -35.0, 27.5,   0.0, true);
    addBox([1.0, 5.0, 1.0],   0.0, 27.5, -35.0, true);

    // arch pillars
    addBox([2.0, 10.0, 2.0], 100.0, 10.0, -35.0);
    addBox([2.0, 10.0, 2.0], 100.0, 10.0, 35.0);
    // arch bar
    addBox([1.0, 1.0, 35.0],  100.0, 21.0, 0.0);

    // arch pillars
    addBox([2.0, 7.0, 2.0], 150.0, 7.0, -20.0);
    addBox([2.0, 7.0, 2.0], 150.0, 7.0, 20.0);
    // arch bar
    addBox([1.0, 1.0, 20.0],  150.0, 15.0, 0.0);

    // arch pillars
    addBox([2.0, 3.0, 2.0], 200.0, 3.0, -10.0);
    addBox([2.0, 3.0, 2.0], 200.0, 3.0, 10.0);
    // arch bar
    addBox([1.0, 1.0, 10.0],  200.0, 7.0, 0.0);

    // arch end pillars
    addBox([2.0, 10.0, 2.0], 250.0,  10.0,   0.0);
    // arch end pillar landing pad
    addBox([4.0, 1.0, 4.0], 250.0,  21.0,   0.0);

    // tunnel
    addBox([2.0, 10.0, 100.0], -35.0, 10.0, 200.0);
    addBox([2.0, 10.0, 100.0], 35.0, 10.0, 200.0);
    // arch bar
    addBox([35.0, 1.0, 100.0],  0.0, 21.0, 200.0);


    return defaultMap;
};
