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
 * Directive for the InteractiveMap interaction.
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
      templateUrl: 'interaction/InteractiveMap',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.coords = [
          oppiaHtmlEscaper.escapedJsonToObj($attrs.latitudeWithValue),
          oppiaHtmlEscaper.escapedJsonToObj($attrs.longitudeWithValue)];
        $scope.zoom = oppiaHtmlEscaper.escapedJsonToObj($attrs.zoomWithValue);

        // This is required in order to avoid the following bug:
        //   http://stackoverflow.com/questions/18769287
        window.setTimeout(function() {
          google.maps.event.trigger($scope.map, 'resize');
        }, 100);

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

          $scope.$parent.$parent.submitAnswer([ll.lat(), ll.lng()]);
        };
      }]
    };
  }
]);

oppia.directive('oppiaResponseInteractiveMap', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/InteractiveMap',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var _answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);

        var latLongPair = _answer[0] + ',' + _answer[1];
        $scope.staticMapUrl =
          'https://maps.googleapis.com/maps/api/staticmap?' +
          'center=' + latLongPair + '&zoom=4&size=500x400' +
          '&maptype=roadmap&visual_refresh=true&markers=color:red|' +
          latLongPair + '&sensor=false';
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseInteractiveMap', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/InteractiveMap',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var _answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
        $scope.formattedCoords = Math.abs(_answer[0]).toFixed(3) + '° ';
        $scope.formattedCoords += (_answer[0] >= 0 ? 'N' : 'S');
        $scope.formattedCoords += ', ';
        $scope.formattedCoords += Math.abs(_answer[1]).toFixed(3) + '° ';
        $scope.formattedCoords += (_answer[1] >= 0 ? 'E' : 'W');
      }]
    };
  }
]);
