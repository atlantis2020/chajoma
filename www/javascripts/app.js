/*global $, window, rotate, fullscreen */

(function () {
    'use strict';

    var doc = $(document);

    doc.on('click', '.fullscreen-anchor', function (e) {
        e.preventDefault();
        e.stopPropagation();

        fullscreen(
            document.getElementById($(this).data('fullscreen'))
        );
    });

    doc.on('click', '.rotate-anchor', function () {
        rotate($('.scene'));
    });

}());
