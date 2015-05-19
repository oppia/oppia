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


oppia.directive('coordTwoDimEditor', function() {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: '/object_editor_template/CoordTwoDim',
    controller: function($scope) {
      console.log($scope);
      $scope.schemaLatitude = {
        type: 'float',
        validators: [{
          id: 'is_at_least',
          min_value: -90.0
        }, {
          id: 'is_at_most',
          max_value: 90.0
        }]
      };

      $scope.schemaLongitude = {
        type: 'float',
        validators: [{
          id: 'is_at_least',
          min_value: -180.0
        }, {
          id: 'is_at_most',
          max_value: 180.0
        }]
      };

      if ($scope.$parent.value === '') {  // A new rule
        $scope.$parent.value = [0.0, 0.0];
      } else {
        $scope.hasMarker = true;
      }

      // This is required in order to avoid the following bug:
      //   http://stackoverflow.com/questions/18769287/how-to-trigger-map-resize-event-after-the-angular-js-ui-map-directive-is-rendere
      window.setTimeout(function() {
        if ($scope.hasMarker) {
          $scope.mapMarker = new google.maps.Marker({
            map: $scope.map,
            position: new google.maps.LatLng(
              $scope.$parent.value[0],
              $scope.$parent.value[1]
            )
          });
        }
        google.maps.event.trigger($scope.map, 'resize');
      }, 100);

      $scope.mapOptions = {
        center: new google.maps.LatLng(
          $scope.$parent.value[0],
          $scope.$parent.value[1]
        ),
        zoom: 0,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      $scope.registerClick = function($event, $params) {
        var latLng = $params[0].latLng;
        if ($scope.mapMarker) {
          $scope.mapMarker.setPosition(latLng);
        } else {
          $scope.mapMarker = new google.maps.Marker({
            map: $scope.map,
            position: latLng
          });
        }

        $scope.$parent.value = [latLng.lat(), latLng.lng()];
      };
    }
  };
});
