/*global $, window, L, fullscreen */

// import io from 'socket.io-client';

(function () {
    'use strict';

    var doc = $(document),
        drawers;

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


    draw = {
        drawMultiLineString: function (feature) {
            console.log(feature);
        }
    }


    function initMap() {
        // var map = L.map('map').setView([51.505, -0.09], 13),
        var map = L.map('map');

        return map;

        // L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IjZjNmRjNzk3ZmE2MTcwOTEwMGY0MzU3YjUzOWFmNWZhIn0.Y8bhBaUMqFiPrDRW9hieoQ', {
        //     maxZoom: 18,
        //     attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        //         '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        //         'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        //     id: 'mapbox.streets'
        // }).addTo(map);

        // L.circle([51.508, -0.11], 50, {
        //     color: 'red',
        //     fillColor: '#f03',
        //     fillOpacity: 0.5
        // }).addTo(map);
    }

    function computeBoxCenter(coords) {
        return [(coords[1] + coords[3]) / 2, (coords[0] + coords[2]) / 2];
    }

    function getData(map) {
        return $.getJSON('/www/data/nepal-shakemap/cont-mi.json')
            .then(function (response) {
                var center = computeBoxCenter(response.bbox);
                map.setView(new L.LatLng(center[0], center[1]), 8);
                drawFeatures(map, response.features);
                // map.setView(new L.LatLng(84.8645, 28.19270), 5);
            });
    }

    function drawFeatures(map, features) {
        console.log(features, features.length, 't-t-');

        features.map(function (feature) {

        return map;
    }

    $(function () {
        var map = initMap();


        var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
        var osm = new L.TileLayer(osmUrl, {
            minZoom: 5, maxZoom: 12, attribution: osmAttrib
        });

        map.addLayer(osm);

        getData(map);
    });
}());
