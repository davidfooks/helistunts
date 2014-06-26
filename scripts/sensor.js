//
// Sensor - class description
//

/*global console: false */

function Sensor() {}

Sensor.prototype =
{
    onAddedContacts: function onAddedContacts(/*objectA, objectB, contacts*/)
    {
        if (!this.active)
        {
            console.log('onAddedContacts');
        }
        this.active = true;
    },

    onRemovedContacts: function onRemovedContacts(objectA, objectB, contacts)
    {
        if (contacts.length === 0)
        {
            this.active = false;
            console.log('onRemovedContacts');
        }
    }
};

Sensor.create = function sensorCreateFn(globals, defaultMap, halfExtents, x, y, z)
{
    var sensor = new Sensor();

    sensor.active = false;

    var physicsDevice = globals.physicsDevice;
    var sensorParams = {
        trigger: true,
        mask: physicsDevice.FILTER_ALL,
        contactCallbacksMask: physicsDevice.FILTER_ALL,
        onAddedContacts: sensor.onAddedContacts.bind(sensor),
        onRemovedContacts: sensor.onRemovedContacts.bind(sensor)
    };

    sensor.physicsNode = defaultMap.addBox(halfExtents, x, y, z, sensorParams);

    return sensor;
};
