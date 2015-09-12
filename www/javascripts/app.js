/*global $, window, L, fullscreen */

import io from 'socket.io-client';

(function (L) {
    'use strict';

    var doc = $(document),
        featureRenderer;

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

    function reverseCoordinates(point) {
        return [point[1], point[0]];
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

    function getData(map) {
        return $.getJSON('/www/data/nepal-shakemap/cont-mi.json')
            .then(function (response) {
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

    function showErrorModal(message) {
        var modal = $('<div />', {
            class: 'error-modal',
            html: message.join('<br />')
        });

        mui.overlay('on', modal[0]);
    }

    function hideErrorModal() {
        $('.error-modal').each(function () {
            mui.overlay('off', this);
        });
    };

    function initSocketConnection(url, options) {
        var socket = io(url, options);

        socket.on('connect_error', function () {
            showErrorModal(['Unable to receive data from server.', 'Trying reconnect..']);
        });

        socket.on('reconnect_failed', function () {
            showErrorModal(['Receiving data and reconnecting failed.', 'Please try again later.']);
        });

        socket.on('connect', function () {
            hideErrorModal();
        });

        return socket;
    }


    function drawDrones(drones) {
        return drones.map(function (drone) {
            return L.marker(drone);
        })
    }

    function bindDronesEvents(socket, map) {
        var drones_layer;

        socket.on('drones', function (data) {
            if (drones_layer) {
                map.removeLayer(drones_layer);
            }

            setTimeout(function () {
                drones_layer = L.layerGroup();

                drawDrones(data)
                    .map(function (marker) {
                        return marker.addTo(drones_layer);
                    });

                map.addLayer(drones_layer);
            }, 1500);
        });

        return socket;
    }


    $(function () {
        var map = initMap(),
        socket_url = 'http://localhost:3001',
        socket_options = {
            reconnectionDelay: 5000,
            reconnectionAttempts: 3
        };

        getData(map)
            .then(function () {
                var socket = initSocketConnection(socket_url, socket_options);

                bindDronesEvents(socket, map);
            });
    });
}(L));
