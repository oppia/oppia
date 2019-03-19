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

oppia.directive('coordTwoDimEditor', [
  'UrlInterpolationService', 'OBJECT_EDITOR_URL_PREFIX',
  function(UrlInterpolationService, OBJECT_EDITOR_URL_PREFIX) {
    return {
      controller: ['$scope', function($scope) {
        $scope.mapCenter = {
          lat: $scope.value[0],
          lng: $scope.value[1],
          zoom: 0
        };
        $scope.mapMarkers = {
          mainMarker: {
            lat: $scope.value[0],
            lng: $scope.value[1],
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
        $scope.mapEvents = {
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
            $scope.value = [newLat, newLng];
            updateMarker(newLat, newLng);
          });

        $scope.$on('leafletDirectiveMarker.coordTwoDimEditor.dragend',
          function(evt, args) {
            $scope.value = [args.model.lat, args.model.lng];
          });

        var updateMarker = function(lat, lng) {
          $scope.mapMarkers.mainMarker.lat = lat;
          $scope.mapMarkers.mainMarker.lng = lng;
        };
      }],
      restrict: 'E',
      scope: {
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/coord_two_dim_editor_directive.html'),
    };
  }]);
