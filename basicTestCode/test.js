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
        Microsoft.Maps.Events.addHandler(directionsManager, 'directionsUpdated', function(e) {
            //e.stopImmediatePropagation();
            console.log('DirectionsUpdated event handler called!')
            //document.getElementById('PrintRoutePoints').innerHTML = JSON.stringify(directionsManager.getRouteResult()[0]);
            /*for (var i=0; i < directionsManager.getRouteResult().length; i++) {
                $( "<p>" + JSON.stringify(directionsManager.getRouteResult()[i]) + "</p>" ).appendTo( $( "#PrintRoutePoints" ) );
            }*/
            console.log('Now calling the parseCoords function');
            var routeCoords = parseBingMapRouteResult(directionsManager.getRouteResult()[0])
            console.log('should have returned by now! Entering for loop.');
            for (var i=0; i < routeCoords.length; i++) {
                $( "<p>" + routeCoords[i].getObjectString() + "</p>" ).appendTo( $( "#PrintRoutePoints" ) );
            }
        });
    });
}



function onGeoSuccess(position) {
    var curPos = new Microsoft.Maps.Location(position.coords.latitude, position.coords.longitude);
}

function onGeoError(err) {
    var curPos = new Microsoft.Maps.Location(47.67683, -122.11);
}



//RouteCoordObject class definition
function RouteCoordObject(lat, lon, secondsToArrival, distanceFromStart, coordType) {
    this.lat = lat;
    this.lon = lon;
    this.secondsToArrival = secondsToArrival;
    this.distanceFromStart = distanceFromStart;
    this.coordType = coordType;
    this.getObjectString = function() {
        return '[' + this.lat + ', ' + this.lon + '], time = ' + this.secondsToArrival + ', distance = ' + this.distanceFromStart + ', type = ' + this.coordType;
    };
}


function parseBingMapRouteResult(resultBlob) {
    console.log('Parsing map result! Result Blob passed in was: ');
    console.log(resultBlob);

    returnList = [];
    resultJSON = JSON.stringify(resultBlob);
    var resultsObject = JSON.parse(resultJSON);
    prevDistance = 0;
    newDistance = 0;
    prevTime = 0;
    newTime = 0;

    //Add all of the route coordinates from the "Itinerary Items" array within the JSON blob
    for (var i=0; i < resultsObject.routeLegs[0].itineraryItems.length; i++) {
        thisItineraryCoordObj = resultsObject.routeLegs[0].itineraryItems[i]
        console.log('Looping over itinerary Coord: ');
        console.log(thisItineraryCoordObj);
        newDistance = prevDistance + Number(thisItineraryCoordObj.distance);
        newTime = prevTime + thisItineraryCoordObj.durationInSeconds;
        returnList.push(new RouteCoordObject(thisItineraryCoordObj.coordinate.latitude, thisItineraryCoordObj.coordinate.longitude, newTime, newDistance, 'Given'))
        prevDistance = newDistance;
        prevTime = newTime;
    }

    //Now, loop through the list.
    //If the distance between any of the objects is > 10 miles, then start sampling points as the crow flies between the two objects
        //sample every 10 miles until we get to or surpass the next coordinate in the list
    //remember to either 
        // 1) inject the new array items in their proper spot as you create them OR 
        // 2) sort all the array items by "distance" at the end
    
    console.log('Returning the following list:');
    console.log(returnList);
    return returnList;
}