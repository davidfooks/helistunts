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
    },

    addBox: function defaultMapAddBoxFn(halfExtents, x, y, z, params)
    {
        params = params || {};

        var globals = this.globals;
        var mathDevice = globals.mathDevice;
        var physicsDevice = globals.physicsDevice;
        var physicsManager = globals.physicsManager;
        var dynamicsWorld = globals.dynamicsWorld;
        var scene = globals.scene;

        var dynamic = params.dynamic || false;

        var collisionMargin = 0.005;

        var boxShape = physicsDevice.createBoxShape({
                halfExtents : halfExtents,
                margin : collisionMargin
            });

        var inertia = mathDevice.v3Copy(boxShape.inertia);
        inertia = mathDevice.v3ScalarMul(inertia, 1.0);

        var boxBody;
        var group;
        var mask;

        function onPreSolveContact(/*objectA, objectB, contacts*/)
        {
            console.log('onPreSolveContact');
        }
        function onProcessedContacts(/*objectA, objectB, contacts*/)
        {
            console.log('onProcessedContacts');
        }
        function onAddedContacts(/*objectA, objectB, contacts*/)
        {
            console.log('onAddedContacts');
        }
        function onRemovedContacts(/*objectA, objectB, contacts*/)
        {
            console.log('onRemovedContacts');
        }

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
            });

            this.rigidBodiesData[this.rigidBodiesCount] = {
                rigidBody: boxBody,
                initTransform: mathDevice.m43Copy(initTransform)
            };

            this.rigidBodiesCount += 1;
        }
        else
        {
            group = params.hasOwnProperty('group') ? params.group : physicsDevice.FILTER_STATIC;
            mask = params.hasOwnProperty('mask') ? params.mask : physicsDevice.FILTER_ALL;
            boxBody = physicsDevice.createCollisionObject({
                shape : boxShape,
                transform : mathDevice.m43BuildTranslation(x, y, z),
                friction : 0.5,
                restitution : 0.3,
                kinematic : false,
                group: group,
                mask: mask,
                onPreSolveContact: onPreSolveContact,
                onProcessedContacts: onProcessedContacts,
                onAddedContacts: onAddedContacts,
                onRemovedContacts: onRemovedContacts,
                trigger: params.trigger || false,
                contactCallbacksMask: params.contactCallbacksMask || 0,
            });
        }

        var position = mathDevice.m43BuildTranslation(x, y, z);
        var boxSceneNode = SceneNode.create({
                name: 'BoxPhys' + this.sceneNodeCount,
                local: position,
                dynamic: dynamic,
                disabled: false
            });
        this.sceneNodeCount += 1;

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
            if (!params.trigger)
            {
                // TODO: should be setStatic?  setDynamic takes no args.
                //boxSceneNode.setDynamic(false);
                boxSceneNode.setDynamic();
            }
            physicsManager.enableHierarchy(boxSceneNode, true);
        }

        return physicsNode;
    }
};

DefaultMap.create = function defaultMapCreateFn(globals)
{
    var defaultMap = new DefaultMap();

    var physicsDevice = globals.physicsDevice;

    var toppleBlockParams = {
        dynamic: true
    };

    var sensorParams = {
        trigger: true,
        mask: physicsDevice.FILTER_ALL,
        contactCallbacksMask: physicsDevice.FILTER_ALL
    };

    defaultMap.globals = globals;
    defaultMap.rigidBodiesData = {};
    defaultMap.rigidBodiesCount = 0;
    defaultMap.sceneNodeCount = 0;

    // landing pad
    defaultMap.addBox([10.0, 1.0, 10.0], 0.0, 1.0, 0.0);

    // pillars
    defaultMap.addBox([2.0, 10.0, 2.0], 35.0,  10.0,   0.0);
    defaultMap.addBox([2.0, 10.0, 2.0], 0.0,   10.0,  35.0);
    defaultMap.addBox([2.0, 10.0, 2.0], -35.0, 10.0,   0.0);
    defaultMap.addBox([2.0, 10.0, 2.0], 0.0,   10.0, -35.0);

    // pillars landing pads
    defaultMap.addBox([4.0, 1.0, 4.0], 35.0,  21.0,   0.0);
    defaultMap.addBox([4.0, 1.0, 4.0], 0.0,   21.0,  35.0);
    defaultMap.addBox([4.0, 1.0, 4.0], -35.0, 21.0,   0.0);
    defaultMap.addBox([4.0, 1.0, 4.0], 0.0,   21.0, -35.0);

    defaultMap.sensors = [
        Sensor.create(defaultMap.addBox([4.0, 4.0, 4.0], 35.0, 28.0, 0.0, sensorParams))
    ];

    // topple
    // defaultMap.addBox([1.0, 5.0, 1.0],  35.0, 27.5,   0.0, toppleBlockParams);
    // defaultMap.addBox([1.0, 5.0, 1.0],   0.0, 27.5,  35.0, toppleBlockParams);
    // defaultMap.addBox([1.0, 5.0, 1.0], -35.0, 27.5,   0.0, toppleBlockParams);
    // defaultMap.addBox([1.0, 5.0, 1.0],   0.0, 27.5, -35.0, toppleBlockParams);

    // arch pillars
    defaultMap.addBox([2.0, 10.0, 2.0], 100.0, 10.0, -35.0);
    defaultMap.addBox([2.0, 10.0, 2.0], 100.0, 10.0, 35.0);
    // arch bar
    defaultMap.addBox([1.0, 1.0, 35.0],  100.0, 21.0, 0.0);

    // arch pillars
    defaultMap.addBox([2.0, 7.0, 2.0], 150.0, 7.0, -20.0);
    defaultMap.addBox([2.0, 7.0, 2.0], 150.0, 7.0, 20.0);
    // arch bar
    defaultMap.addBox([1.0, 1.0, 20.0],  150.0, 15.0, 0.0);

    // arch pillars
    defaultMap.addBox([2.0, 3.0, 2.0], 200.0, 3.0, -10.0);
    defaultMap.addBox([2.0, 3.0, 2.0], 200.0, 3.0, 10.0);
    // arch bar
    defaultMap.addBox([1.0, 1.0, 10.0],  200.0, 7.0, 0.0);

    // arch end pillars
    defaultMap.addBox([2.0, 10.0, 2.0], 250.0,  10.0,   0.0);
    // arch end pillar landing pad
    defaultMap.addBox([4.0, 1.0, 4.0], 250.0,  21.0,   0.0);

    // tunnel
    defaultMap.addBox([2.0, 10.0, 100.0], -35.0, 10.0, 200.0);
    defaultMap.addBox([2.0, 10.0, 100.0], 35.0, 10.0, 200.0);
    // arch bar
    defaultMap.addBox([35.0, 1.0, 100.0],  0.0, 21.0, 200.0);

    // tunnel topples!
    var numX = 7;
    var numZ = 15;

    var i;
    var j;
    for (i = 0; i < numX; i += 1)
    {
        for (j = 0; j < numZ; j += 1)
        {
            defaultMap.addBox([1.0, 5.0, 1.0], ((i + 1) / (numX + 2)) * 70 - 35, 3.0,  ((j + 1) / (numZ + 2)) * 200 + 100, toppleBlockParams);
        }
    }


    return defaultMap;
};
