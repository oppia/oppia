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
      controller: ['$scope', '$timeout', function($scope, $timeout) {
        angular.extend($scope, {
          center: {
            lat: $scope.value[0],
            lng: $scope.value[1],
            zoom: 0
          },
          markers: {
            markersmarkers: {
              lat: $scope.value[0],
              lng: $scope.value[1],
              focus: true,
              draggable: true,
              icon: {
                iconUrl: UrlInterpolationService.getExtensionResourceUrl(
                  '/interactions/InteractiveMap/static/marker-icon.png'),
                shadowUrl: UrlInterpolationService.getExtensionResourceUrl(
                  '/interactions/InteractiveMap/static/marker-shadow.png'),
                iconAnchor: [12, 41],
                shadowAnchor: [13, 41],
                shadowSize: [41, 41],
                iconSize: [25, 41]
              },
            }
          },
          events: {
            map: {
              enable: ['click'],
              logic: 'emit'
            },
            markers: {
              enable: ['dragend']
            }
          }
        });

        $scope.$on('leafletDirectiveMap.click', function(event, args) {
          var newLat = args.leafletEvent.latlng.lat;
          var newLng = args.leafletEvent.latlng.lng;
          $scope.value = [newLat, newLng];
          updateMarker(newLat, newLng);
        });
        $scope.$on('leafletDirectiveMarker.dragend', function(event, args) {
          $scope.value = [args.model.lat, args.model.lng];
        });

        var updateMarker = function(lat, lng) {
          $scope.markers.markersmarkers.lat = lat;
          $scope.markers.markersmarkers.lng = lng;
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
