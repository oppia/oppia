'use strict';
(function () {
  var app = angular.module('ui.map', ['ui.event']);
  function bindMapEvents(scope, eventsStr, googleObject, element) {
    angular.forEach(eventsStr.split(' '), function (eventName) {
      window.google.maps.event.addListener(googleObject, eventName, function (event) {
        element.triggerHandler('map-' + eventName, event);
        if (!scope.$$phase) {
          scope.$apply();
        }
      });
    });
  }
  app.value('uiMapConfig', {}).directive('uiMap', [
    'uiMapConfig',
    '$parse',
    function (uiMapConfig, $parse) {
      var mapEvents = 'bounds_changed center_changed click dblclick drag dragend ' + 'dragstart heading_changed idle maptypeid_changed mousemove mouseout ' + 'mouseover projection_changed resize rightclick tilesloaded tilt_changed ' + 'zoom_changed';
      var options = uiMapConfig || {};
      return {
        restrict: 'A',
        link: function (scope, elm, attrs) {
          var opts = angular.extend({}, options, scope.$eval(attrs.uiOptions));
          var map = new window.google.maps.Map(elm[0], opts);
          var model = $parse(attrs.uiMap);
          model.assign(scope, map);
          bindMapEvents(scope, mapEvents, map, elm);
        }
      };
    }
  ]);
  app.value('uiMapInfoWindowConfig', {}).directive('uiMapInfoWindow', [
    'uiMapInfoWindowConfig',
    '$parse',
    '$compile',
    function (uiMapInfoWindowConfig, $parse, $compile) {
      var infoWindowEvents = 'closeclick content_change domready ' + 'position_changed zindex_changed';
      var options = uiMapInfoWindowConfig || {};
      return {
        link: function (scope, elm, attrs) {
          var opts = angular.extend({}, options, scope.$eval(attrs.uiOptions));
          opts.content = elm[0];
          var model = $parse(attrs.uiMapInfoWindow);
          var infoWindow = model(scope);
          if (!infoWindow) {
            infoWindow = new window.google.maps.InfoWindow(opts);
            model.assign(scope, infoWindow);
          }
          bindMapEvents(scope, infoWindowEvents, infoWindow, elm);
          elm.replaceWith('<div></div>');
          var _open = infoWindow.open;
          infoWindow.open = function open(a1, a2, a3, a4, a5, a6) {
            $compile(elm.contents())(scope);
            _open.call(infoWindow, a1, a2, a3, a4, a5, a6);
          };
        }
      };
    }
  ]);
  function mapOverlayDirective(directiveName, events) {
    app.directive(directiveName, [function () {
        return {
          restrict: 'A',
          link: function (scope, elm, attrs) {
            scope.$watch(attrs[directiveName], function (newObject) {
              if (newObject) {
                bindMapEvents(scope, events, newObject, elm);
              }
            });
          }
        };
      }]);
  }
  mapOverlayDirective('uiMapMarker', 'animation_changed click clickable_changed cursor_changed ' + 'dblclick drag dragend draggable_changed dragstart flat_changed icon_changed ' + 'mousedown mouseout mouseover mouseup position_changed rightclick ' + 'shadow_changed shape_changed title_changed visible_changed zindex_changed');
  mapOverlayDirective('uiMapPolyline', 'click dblclick mousedown mousemove mouseout mouseover mouseup rightclick');
  mapOverlayDirective('uiMapPolygon', 'click dblclick mousedown mousemove mouseout mouseover mouseup rightclick');
  mapOverlayDirective('uiMapRectangle', 'bounds_changed click dblclick mousedown mousemove mouseout mouseover ' + 'mouseup rightclick');
  mapOverlayDirective('uiMapCircle', 'center_changed click dblclick mousedown mousemove ' + 'mouseout mouseover mouseup radius_changed rightclick');
  mapOverlayDirective('uiMapGroundOverlay', 'click dblclick');
}());