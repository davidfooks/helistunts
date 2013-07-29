//
// DefaultMap - class description
//

/*global SceneNode: false */

function DefaultMap() {}

DefaultMap.prototype =
{
};

DefaultMap.create = function defaultMapCreateFn(physicsDevice, mathDevice, physicsManager, dynamicsWorld, scene)
{
    var defaultMap = new DefaultMap();

    var count = 0;

    var addBox = function addBoxFn(halfExtents, x, y, z, dynamic)
    {
        dynamic = dynamic || false;

        var collisionMargin = 0.005;

        var boxShape = physicsDevice.createBoxShape({
                halfExtents : halfExtents,
                margin : collisionMargin
            });

        var inertia = mathDevice.v3Copy(boxShape.inertia);
        inertia = mathDevice.v3ScalarMul(inertia, 1.0);

        // Initial box is created as a rigid body
        if (dynamic)
        {
            var boxBody = physicsDevice.createRigidBody({
                shape : boxShape,
                mass: 1.0,
                inertia: inertia,
                transform : mathDevice.m43BuildTranslation(x, y, z),
                friction : 0.5,
                restitution : 0.3,
                frozen : false,
                active : false
            });
        }
        else
        {
            var boxBody = physicsDevice.createCollisionObject({
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

    // topple
    /*addBox([0.5, 0.5, 0.5], 35.0, 22.5, 0.0, true);
    addBox([0.5, 0.5, 0.5], 35.0, 23.5, 0.0, true);
    addBox([0.5, 0.5, 0.5], 35.0, 24.5, 0.0, true);
    addBox([0.5, 0.5, 0.5], 35.0, 25.5, 0.0, true);
    addBox([0.5, 0.5, 0.5], 35.0, 26.5, 0.0, true);*/

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

    return defaultMap;
};
