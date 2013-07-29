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

    var collisionMargin = 0.005;

    var boxShape = physicsDevice.createBoxShape({
            halfExtents : [10.0, 1.0, 10.0],
            margin : collisionMargin
        });

    var inertia = mathDevice.v3Copy(boxShape.inertia);
    inertia = mathDevice.v3ScalarMul(inertia, 1.0);

    // Initial box is created as a rigid body
    var boxBody = physicsDevice.createCollisionObject({
        shape : boxShape,
        mass : 20.0,
        transform : mathDevice.m43BuildTranslation(0.0, 1.0, 0.0),
        friction : 0.5,
        restitution : 0.3,
        kinematic : false,
        group: physicsDevice.FILTER_STATIC,
        mask: physicsDevice.FILTER_ALL
    });

    var position = mathDevice.m43BuildTranslation(0.0, 5.0, 0.0);
    var boxSceneNode = SceneNode.create({
            name: 'BoxPhys',
            local: position,
            dynamic: false,
            disabled: false
        });

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

    return defaultMap;
};
