/*global $, window, L, fullscreen */

// import io from 'socket.io-client';

(function (L) {
    'use strict';

    var doc = $(document),
        featureRenderer;

    // var doc = $(document),
    //     socket = io('http://localhost:3001');

    // socket.on('news', function (data) {
    //     console.log(data);
    // });

    // socket.on('connect_error', function () {
    //     console.log('Socket connection error, disconnecting..');
    //     socket.disconnect();
    // });

    // navigator.geolocation.getCurrentPosition(function(position) {
    //     console.log('-t-', position.coords.latitude, position.coords.longitude);
    // });

    function reverseCoordinates(point) {
        return [point[1], point[0]];
    }

    featureRenderer = {
        drawMultiLineString: function (map, feature) {
            var coordinates = feature.geometry.coordinates.map(
                function(line) {
                    return line.map(reverseCoordinates);
                });

            L.polygon(coordinates, feature.properties).addTo(map);
        },
        drawCircle: function(map, feature) {
            L.circle([51.508, -0.11], 50, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5
            }).addTo(map);
        }
    }


    function initMap() {
        var map = L.map('map');

        var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var osmAttrib = '© <a href="http://openstreetmap.org">OpenStreetMap</a>';
        var osm = new L.TileLayer(osmUrl, {
            minZoom: 5, maxZoom: 16, attribution: osmAttrib
        });

        map.addLayer(osm);

        return map;

    }

    function computeBoxCenter(coords) {
        return [(coords[1] + coords[3]) / 2, (coords[0] + coords[2]) / 2];
    }

    function getData(map) {
        return $.getJSON('/www/data/nepal-shakemap/cont-mi.json')
            .then(function (response) {
                var center = computeBoxCenter(response.bbox);
                map.setView(
                    new L.LatLng(
                        response.metadata.latitude,
                        response.metadata.longitude
                    ), 7);
                drawFeatures(map, response.features);
            });
    }

    function drawFeatures(map, features) {
        var fr = featureRenderer;

        features.map(function (feature) {
            fr['draw' + feature.geometry.type](map, feature);
        });

        return map;
    }

    $(function () {
        var map = initMap();

        getData(map);
    });
}(L));
