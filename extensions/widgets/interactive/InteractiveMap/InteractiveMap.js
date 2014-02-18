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
 * Directive for the InteractiveMap interactive widget.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveInteractiveMap', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interactiveWidget/InteractiveMap',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.coords = [
          oppiaHtmlEscaper.escapedJsonToObj($attrs.latitudeWithValue),
          oppiaHtmlEscaper.escapedJsonToObj($attrs.longitudeWithValue)];
        $scope.zoom = oppiaHtmlEscaper.escapedJsonToObj($attrs.zoomWithValue);

        $scope.mapMarkers = [];

        var coords = $scope.coords || [0, 0];
        var zoom_level = parseInt($scope.zoom, 10) || 0;
        $scope.mapOptions = {
          center: new google.maps.LatLng(coords[0], coords[1]),
          zoom: zoom_level,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        $scope.registerClick = function($event, $params) {
          var ll = $params[0].latLng;
          $scope.mapMarkers.push(new google.maps.Marker({
            map: $scope.map,
            position: ll
          }));

          $scope.$parent.$parent.submitAnswer(ll.lat() + ',' + ll.lng(), 'submit');
        };
      }]
    };
  }
]);
