window.onload = GetMap;

function GetMap()
{
	if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
    }
    else {
        var curPos = new Microsoft.Maps.Location(47.67683, -122.11);

    }


	var navigationBarMode = Microsoft.Maps.NavigationBarMode;
    var map = new Microsoft.Maps.Map('#myMap', {
        credentials: 'AomGAtcZAICKw58BzpjxfMs4yensI72mmTF4L91dPB_09ZraJhnlWPmXaFhUpDeg',
        center: curPos,
        zoom: 12,
        navigationBarMode: navigationBarMode.compact,
        customizeOverlays: true
    });

    var pushpin = new Microsoft.Maps.Pushpin(map.getCenter(), null);
	map.entities.push(pushpin);
	pushpin.setOptions({ enableHoverStyle: true, enableClickedStyle: true });

	Microsoft.Maps.loadModule('Microsoft.Maps.Directions', function () {
	    var directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);
	    directionsManager.setRenderOptions({ itineraryContainer: document.getElementById('outputDirections') });
	    directionsManager.showInputPanel('floatingControls');
	});
}



function onGeoSuccess(position) {
	var curPos = new Microsoft.Maps.Location(position.coords.latitude, position.coords.longitude);
}

function onGeoError(err) {
	var curPos = new Microsoft.Maps.Location(47.67683, -122.11);
}
