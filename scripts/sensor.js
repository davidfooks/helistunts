//
// Sensor - class description
//

function Sensor() {}

Sensor.prototype =
{
    complete : function sensorCompleteFn(helicopterRigidBody)
    {
        var mathDevice = this.mathDevice;
        var position = this.position;
        var halfExtents = this.halfExtents;
        var heliPos = mathDevice.m43Pos(helicopterRigidBody.transform);
        if (heliPos[0] < position[0] + halfExtents[0] &&
            heliPos[0] > position[0] - halfExtents[0] &&
            heliPos[1] < position[1] + halfExtents[1] &&
            heliPos[1] > position[1] - halfExtents[1] &&
            heliPos[2] < position[2] + halfExtents[2] &&
            heliPos[2] > position[2] - halfExtents[2])
        {
            return true;
        }
        return false;
    },
};

Sensor.create = function sensorCreateFn(mathDevice, halfExtents, position, sensorUp)
{
    var sensor = new Sensor();

    sensor.mathDevice = mathDevice;
    sensor.halfExtents = halfExtents;
    sensor.position = position;
    sensor.sensorUp = sensorUp;

    return sensor;
};
