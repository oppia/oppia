// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Directive for coord two dim editor.
 */

angular.module('oppia').directive('coordTwoDimEditor', [
  'UrlInterpolationService',
  function(UrlInterpolationService) {
    return {
      controllerAs: '$ctrl',
      controller: ['$scope', function($scope) {
        var ctrl = this;
        ctrl.mapCenter = {
          lat: ctrl.value[0],
          lng: ctrl.value[1],
          zoom: 0
        };
        ctrl.mapMarkers = {
          mainMarker: {
            lat: ctrl.value[0],
            lng: ctrl.value[1],
            focus: true,
            draggable: true,
            icon: {
              iconUrl: UrlInterpolationService.getExtensionResourceUrl(
                '/interactions/InteractiveMap/static/marker-icon.png'),
              // The size of the icon image in pixels.
              iconSize: [25, 41],
              // The coordinates of the "tip" of the icon.
              iconAnchor: [12, 41],
              shadowUrl: UrlInterpolationService.getExtensionResourceUrl(
                '/interactions/InteractiveMap/static/marker-shadow.png'),
              // The size of the shadow image in pixels.
              shadowSize: [41, 41],
              // The coordinates of the "tip" of the shadow.
              shadowAnchor: [13, 41],
              // The URL to a retina sized version of the icon image.
              // Used for Retina screen devices.
              iconRetinaUrl: UrlInterpolationService.getExtensionResourceUrl(
                '/interactions/InteractiveMap/static/marker-icon-2x.png'),
              shadowRetinaUrl: UrlInterpolationService.getExtensionResourceUrl(
                '/interactions/InteractiveMap/static/marker-shadow.png')
            }
          }
        };
        ctrl.mapEvents = {
          map: {
            enable: ['click'],
            logic: 'emit'
          },
          markers: {
            enable: ['dragend'],
            logic: 'emit'
          }
        };

        $scope.$on('leafletDirectiveMap.coordTwoDimEditor.click',
          function(evt, args) {
            var newLat = args.leafletEvent.latlng.lat;
            var newLng = args.leafletEvent.latlng.lng;
            ctrl.value = [newLat, newLng];
            updateMarker(newLat, newLng);
          });

        $scope.$on('leafletDirectiveMarker.coordTwoDimEditor.dragend',
          function(evt, args) {
            ctrl.value = [args.model.lat, args.model.lng];
          });

        var updateMarker = function(lat, lng) {
          ctrl.mapMarkers.mainMarker.lat = lat;
          ctrl.mapMarkers.mainMarker.lng = lng;
        };
      }],
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/coord_two_dim_editor_directive.html'),
    };
  }]);
