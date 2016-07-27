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
        directionsManager.setRenderOptions({ itineraryContainer: document.getElementById('outputDirections')});
        directionsManager.setRequestOptions({distanceUnit: Microsoft.Maps.Directions.DistanceUnit.miles, routeOptimization: Microsoft.Maps.Directions.RouteOptimization.shortestTime});
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
                CreatePushPin(map, routeCoords[i].lat, routeCoords[i].lon);
            }
        });
    });
}


function httpGet(theUrl)
{
    var request =  new XMLHttpRequest();
    request.open("GET", theUrl, false);
    request.send(null);
    return request.responseText;
}

function ConstructUrl(lattitude, longitude){
    var url = "http://api.wunderground.com/api/4ba128ed10d80d64/conditions/q/"+lattitude+","+longitude+".json";
    return url;
}

function CreatePushPin(map, lattitude, longitude){
    var url = ConstructUrl(lattitude, longitude);
    var response = httpGet(url);
    var imageIcon = JSON.parse(response).current_observation.icon_url;
    var pushpinOptions = {icon:imageIcon, width: 50, height: 50, draggable:false, zIndex:100}; 
    var pushpin= new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(lattitude, longitude), pushpinOptions); 
    map.entities.push(pushpin);
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

    var returnList = [];
    resultJSON = JSON.stringify(resultBlob);
    var resultsObject = JSON.parse(resultJSON);
    var prevDistance = 0;
    var newDistance = 0;
    var prevTime = 0;
    var newTime = 0;

    //Add all of the route coordinates from the "Itinerary Items" array within the JSON blob
    for (var i=0; i < resultsObject.routeLegs[0].itineraryItems.length; i++) {
        thisItineraryCoordObj = resultsObject.routeLegs[0].itineraryItems[i];
        console.log('Looping over itinerary Coord: ');
        console.log(thisItineraryCoordObj);
        console.log(thisItineraryCoordObj.coordinate);
        console.log(thisItineraryCoordObj.coordinate.latitude);
        console.log(thisItineraryCoordObj.coordinate.longitude);
        newDistance = prevDistance + Number(thisItineraryCoordObj.distance);
        newTime = prevTime + thisItineraryCoordObj.durationInSeconds;
        returnList.push(new RouteCoordObject(thisItineraryCoordObj.coordinate.latitude, thisItineraryCoordObj.coordinate.longitude, newTime, newDistance, 'Given'))
        prevDistance = newDistance;
        prevTime = newTime;
    }

    //Now, loop through the given coordinate list.
    //If the distance between any of the objects is > 10 miles, then start sampling points as the crow flies between the two objects
        //sample every 10 miles until we get to or surpass the next coordinate in the list
    //remember to either 
        // 1) inject the new array items in their proper spot as you create them OR 
        // 2) sort all the array items by "distance" at the end
    var originalCoordListLength = returnList.length;
    var nextInsertIndex = 1;
    var previousIndex = 0;
    var currentLat = 0;
    var currentLon = 0;
    var nextLat = 0;
    var nextLon = 0;
    var distanceToNextWaypoint = 0;
    var newLat = 0;
    var newLon = 0;
    var newSecondsToArrival = 0;
    var newDistanceFromStart = 0;
    var bearing = 0;
    // RouteCoordObject currentRouteCoord = null;
    // RouteCoordObject nextRouteCoord = null;
    // RouteCoordObject newRouteCoord = null;

    for (var i=0; i < originalCoordListLength; i++) {
        
        if (i == (originalCoordListLength - 1)) {
            //if we hit the last coordinate in the original list, we can stop.
            break;
        } 
        else {
            //otherwise, check if the distance between the current waypoint and the next one is > 10 miles
            //if so, keep adding new waypoints along the line between current and next waypoints until we are within 10 miles of next waypoint
            currentRouteCoord = returnList[previousIndex];
            nextRouteCoord = returnList[nextInsertIndex];
            currentLat = currentRouteCoord.lat;
            currentLon = currentRouteCoord.lon;
            nextLat = nextRouteCoord.lat;
            nextLon = nextRouteCoord.lon;
            distanceToNextWaypoint = nextRouteCoord.distanceFromStart - currentRouteCoord.distanceFromStart;
            timeToNextWaypoint = nextRouteCoord.secondsToArrival - currentRouteCoord.secondsToArrival;

            if (distanceToNextWaypoint > 10) {
                while (distanceToNextWaypoint > 10) {
                    //determine a point along the line between start and end waypoint that is 10 miles away from start point
                    bearing = calculateBearingBetween2Coords(currentLat, currentLon, nextLat, nextLon);
                    nextLat = calculateNewLatitude(currentLat, bearing, 10);
                    nextLon = calculateNewLongitude(currentLon, currentLat, bearing, 10);
                    newArrivalTime = currentRouteCoord.secondsToArrival + (10/distanceToNextWaypoint)*(timeToNextWaypoint);
                    newDistanceFromStart = currentRouteCoord.distanceFromStart + 10;
                    
                    //insert the new coordObject at index = nextInsertIndex;
                    newRouteCoord = new RouteCoordObject(nextLat, nextLon, newArrivalTime, newDistanceFromStart, 'Calculated');
                    returnList.splice(nextInsertIndex, 0, newRouteCoord);
                    
                    //get ready for the next loop iteration (if it is even necessary)
                    previousIndex = nextInsertIndex;
                    nextInsertIndex = nextInsertIndex + 1;
                    currentRouteCoord = newRouteCoord;
                    distanceToNextWaypoint = nextRouteCoord.distanceFromStart - currentRouteCoord.distanceFromStart;
                    timeToNextWaypoint = nextRouteCoord.secondsToArrival - currentRouteCoord.secondsToArrival;
                }
            }
            else {
                previousIndex = nextInsertIndex;
                nextInsertIndex = nextInsertIndex + 1;
            }
        }

    }
    
    console.log('Returning the following list:');
    console.log(returnList);
    return returnList;
}



function calculateBearingBetween2Coords(lat1, lon1, lat2, lon2) {
    /*
      dlat = lat2 - lat1
      dlon = lon2 - lon1
      y = sin(lon2-lon1)*cos(lat2)
      x = cos(lat1)*sin(lat2)-sin(lat1)*cos(lat2)*cos(lon2-lon1)
      if y > 0 then
        if x > 0 then tc1 = arctan(y/x)
        if x < 0 then tc1 = 180 - arctan(-y/x)
        if x = 0 then tc1 = 90
      if y < 0 then
        if x > 0 then tc1 = -arctan(-y/x)
        if x < 0 then tc1 = arctan(y/x)-180
        if x = 0 then tc1 = 270
      if y = 0 then
        if x > 0 then tc1 = 0
        if x < 0 then tc1 = 180
        if x = 0 then [the 2 points are the same]
    */
    var deltaLat = lat2 - lat1;
    var deltaLon = lon2 - lon1;
    var y = Math.sin(deltaLon) * Math.cos(lat2);
    var x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(deltaLon);

    if (y>0) {
        if (x > 0) {
            return Math.atan(y/x);
        }
        else if (x < 0) {
            return (180 - Math.atan((-1*y)/x));
        }
        else {
            //x must equal 0
            return 90;
        }
    }
    else if (y < 0) {
        if (x > 0) {
            return (-1)*Math.atan((-1*y)/x);
        }
        else if (x < 0) {
            return (Math.atan(y/x) - 180);
        }
        else {
            //x must equal 0
            return 270;
        }
    }
    else {
        //y must equal 0
        if (x > 0) {
            return 0;
        }
        else if (x < 0) {
            return 180;
        }
        else {
            //x must equal 0
            //two points are the same.
            return 0;
            
        }
    }
}







/*
It seems you are measuring distance (R) in meters, and bearing (theta) counterclockwise from due east. And for your purposes (hundereds of meters), plane geometry should be accurate enough. In that case,
dx = R*cos(theta) ; theta measured counterclockwise from due east
dy = R*sin(theta) ; dx, dy same units as R


If theta is measured clockwise from due north (for example, compass bearings), the calculation for dx and dy is slightly different:
dx = R*sin(theta)  ; theta measured clockwise from due north
dy = R*cos(theta)  ; dx, dy same units as R


In either case, the change in degrees longitude and latitude is:
delta_longitude = dx/(111320*cos(latitude))  ; dx, dy in meters
delta_latitude = dy/110540                   ; result in degrees long/lat


The difference between the constants 110540 and 111320 is due to the earth's oblateness (polar and equatorial circumferences are different).

*/


function calculateNewLatitude(originalLat, bearingDegrees, distance) {
    var dy = distance * Math.sin(bearingDegrees);
    var delta_lat = dy/110540;
    return originalLat + delta_lat;
}


function calculateNewLongitude(originalLon, originalLat, bearingDegrees, distance) {
    var dx = distance * Math.cos(bearingDegrees);
    var delta_lon = dx/(111320*Math.cos(originalLat));
    return originalLon + delta_lon;
}