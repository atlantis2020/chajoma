/*global $, window, L, fullscreen */

import io from 'socket.io-client';
import React from 'react';
import Navigation from './components/Navigation.js';


(function (L) {
    'use strict';


    var doc = $(document),
        featureRenderer,
        views,
        map,
        drones_layer,
        socket,
        features_layer,
        active_view;

    featureRenderer = {
        drawMultiLineString: function (layer, feature) {
            var coordinates = feature.geometry.coordinates.map(
                function(line) {
                    return line.map(reverseCoordinates);
                });

            L.polygon(coordinates, feature.properties).addTo(layer);
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
        var osmUrl, osmAttrib, osm;

        if (typeof map == 'undefined') {
            map = L.map('map');

            osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            osmAttrib = '© <a href="http://openstreetmap.org">OpenStreetMap</a>';
            osm = new L.TileLayer(osmUrl, {
                minZoom: 5, maxZoom: 16, attribution: osmAttrib
            });

            map.addLayer(osm);
        }

        return map;
    }

    function getData() {
        return $.getJSON('/www/data/nepal-shakemap/cont-mi.json');
    }

    function drawFeatures(map, features) {
        var fr = featureRenderer;

        removeFeaturesLayer(map);

        features_layer = L.layerGroup();

        features.map(function (feature) {
            fr['draw' + feature.geometry.type](features_layer, feature);
        });

        features_layer.addTo(map);

        return map;
    }

    function showErrorModal(message) {
        var modal = $('<div />', {
            class: 'error-modal',
            html: message.join('<br />')
        });

        modal.hide();

        mui.overlay('on', modal[0]);
        modal.fadeIn();
    }

    function hideErrorModal() {
        $('.error-modal').each(function () {
            mui.overlay('off', this);
        });
    };

    function initSocketConnection(url, options) {
        socket = io(url, options);

        socket.on('connect_error', function () {
            showErrorModal(['Unable to receive data from server.', '(' + url + ')', 'Trying reconnect..']);
        });

        socket.on('reconnect_failed', function () {
            showErrorModal(['<b>Receiving data and reconnecting failed.</b>', '(' + url + ')', 'Please try again later.']);
        });

        socket.on('connect', function () {
            hideErrorModal();
        });

        return socket;
    }

    function removeFeaturesLayer(map) {
        if (features_layer) {
            map.removeLayer(features_layer);
        }
    }

    function removeDrones(map) {
        if (drones_layer) {
            map.removeLayer(drones_layer);
        }
    }

    function clearRealtime() {
        removeFeaturesLayer(map);
        removeDrones(map);
        if (socket) {
            socket.disconnect();
        }
    }

    function clearPlanning() {
        removeFeaturesLayer(map);
        $('#planning-form').hide();

    }

    function drawDrones(drones) {
        return drones.map(function (drone) {
            var opacity = drone.battery > 50 ? 1 : 0.5;
            console.log('drone data: ', drone, drone.battery, opacity);
            return L.marker(drone.coords, {
                opacity: opacity,
                title: 'Id: ' + drone.id + ', Battery: ' + drone.battery + '%'
            });
        })
    }

    function bindDronesEvents(socket, map) {
        removeDrones(map);

        socket.on('drones', function (data) {
            removeDrones(map);

            setTimeout(function () {
                removeDrones(map);

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

    function socketUrl() {
        var re = /drones=(http(s)?\:\/\/[^&]+)/,
            search = window.location.search;

        return re.test(search) ? search.match(re)[1] : '127.0.0.1:3001'
    }

    window.views = {
        realtime: function () {
            if (active_view === 'realtime') {
                return;
            }
            active_view = 'realtime';
            console.log('realtime view');
            var map = initMap(),
                socket_url = socketUrl(),
                socket_options = {
                    reconnectionDelay: 5000,
                    reconnectionAttempts: 3
                },
                socket;

            clearPlanning();

            getData().then(function (response) {
                map.setView(
                    new L.LatLng(
                        response.metadata.latitude,
                        response.metadata.longitude
                    ), 7);

                drawFeatures(map, response.features);

                socket = initSocketConnection(socket_url, socket_options);
                bindDronesEvents(socket, map);
            });
        },

        planning: function () {
            if (active_view === 'planning') {
                return;
            }
            active_view = 'planning';
            console.log('planning view');
            var map = initMap();

            clearRealtime(map);

            getData()
                .then(function (response) {
                    map.setView(
                        new L.LatLng(
                            response.metadata.latitude,
                            response.metadata.longitude
                        ), 7);
                    drawFeatures(map, response.features);
                });

            $('#planning-form').show();
        },

        map: function () {
            if (active_view === 'map') {
                return;
            }
            active_view = 'map';
            console.log('map view');
            var map = initMap();

            clearRealtime(map);
            clearPlanning(map);

            getData()
                .then(function (response) {
                    map.setView(
                        new L.LatLng(
                            response.metadata.latitude,
                            response.metadata.longitude
                        ), 7);
                    // drawFeatures(map, response.features);
                })
        }
    };

    React.render(<Navigation />, document.getElementById('views-nav'));
}(L));
