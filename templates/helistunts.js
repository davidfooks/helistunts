/*{# Copyright (c) 2010-2012 Turbulenz Limited #}*/

/*{# Add library javascript files here e.g. #}*/
/*{{ javascript("jslib/camera.js") }}*/

/*{{ javascript("jslib/scenenode.js") }}*/
/*{{ javascript("jslib/scene.js") }}*/
/*{{ javascript("jslib/scenedebugging.js") }}*/
/*{{ javascript("jslib/aabbtree.js") }}*/
/*{{ javascript("jslib/physicsmanager.js") }}*/
/*{{ javascript("jslib/shadermanager.js") }}*/
/*{{ javascript("jslib/effectmanager.js") }}*/
/*{{ javascript("jslib/renderingcommon.js") }}*/
/*{{ javascript("jslib/defaultrendering.js") }}*/

/*{{ javascript("jslib/observer.js") }}*/
/*{{ javascript("jslib/utilities.js") }}*/
/*{{ javascript("jslib/requesthandler.js") }}*/
/*{{ javascript("jslib/services/turbulenzservices.js") }}*/
/*{{ javascript("jslib/services/turbulenzbridge.js") }}*/
/*{{ javascript("jslib/services/gamesession.js") }}*/
/*{{ javascript("jslib/services/mappingtable.js") }}*/

/*{# Game code javascript includes #}*/
/*{{ javascript("scripts/app.js") }}*/
/*{{ javascript("scripts/sensor.js") }}*/
/*{{ javascript("scripts/defaultmap.js") }}*/
/*{{ javascript("scripts/helicopter.js") }}*/
/*{{ javascript("scripts/floor.js") }}*/

/*global TurbulenzEngine: false*/
/*global appCreate: false */

TurbulenzEngine.onload = function onloadFn()
{
    appCreate();
};
