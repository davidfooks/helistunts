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

    var addBox = function addBoxFn(halfExtents, x, y, z)
    {
        var collisionMargin = 0.005;

        var boxShape = physicsDevice.createBoxShape({
                halfExtents : halfExtents,
                margin : collisionMargin
            });

        var inertia = mathDevice.v3Copy(boxShape.inertia);
        inertia = mathDevice.v3ScalarMul(inertia, 1.0);

        // Initial box is created as a rigid body
        var boxBody = physicsDevice.createCollisionObject({
            shape : boxShape,
            transform : mathDevice.m43BuildTranslation(x, y, z),
            friction : 0.5,
            restitution : 0.3,
            kinematic : false,
            group: physicsDevice.FILTER_STATIC,
            mask: physicsDevice.FILTER_ALL
        });

        var position = mathDevice.m43BuildIdentity();
        var boxSceneNode = SceneNode.create({
                name: 'BoxPhys' + count,
                local: position,
                dynamic: false,
                disabled: false
            });

        count += 1;

        var physicsNode = {
            body : boxBody,
            target : boxSceneNode,
            dynamic : false
        };

        scene.addRootNode(boxSceneNode);
        boxSceneNode.physicsNodes = [physicsNode];
        // TODO: should be setStatic?  setDynamic takes no args.
        //boxSceneNode.setDynamic(false);
        boxSceneNode.setDynamic();

        physicsManager.physicsNodes.push(physicsNode);
        physicsManager.enableHierarchy(boxSceneNode, true);
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

    return defaultMap;
};
