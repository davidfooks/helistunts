//
// Sensor - class description
//

function Sensor() {}

Sensor.prototype =
{
};

Sensor.create = function sensorCreateFn(physicsNode)
{
    var sensor = new Sensor();

    sensor.physicsNode = physicsNode;

    var rigidBody = physicsNode.body;

    return sensor;
};
