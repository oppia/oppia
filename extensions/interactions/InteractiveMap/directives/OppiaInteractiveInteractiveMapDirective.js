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
  'HtmlEscaperService', 'UrlInterpolationService', 'interactiveMapRulesService',
  'EVENT_NEW_CARD_AVAILABLE',
  function(
      HtmlEscaperService, UrlInterpolationService, interactiveMapRulesService,
      EVENT_NEW_CARD_AVAILABLE) {
    return {
      restrict: 'E',
      scope: {
        getLastAnswer: '&lastAnswer'
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/InteractiveMap/directives/' +
        'interactive_map_interaction_directive.html'),
      controller: [
        '$scope', '$attrs', '$timeout', 'CurrentInteractionService',
        function($scope, $attrs, $timeout, CurrentInteractionService) {
          $scope.coords = [
            HtmlEscaperService.escapedJsonToObj($attrs.latitudeWithValue),
            HtmlEscaperService.escapedJsonToObj($attrs.longitudeWithValue)];
          $scope.zoom = (
            HtmlEscaperService.escapedJsonToObj($attrs.zoomWithValue));
          $scope.interactionIsActive = ($scope.getLastAnswer() === null);
          $scope.mapMarkers = [];

          $scope.setOverlay = function() {
            $scope.overlayStyle = {
              'background-color': 'black'
            };
            $scope.mapStyle = {
              opacity: '0.8'
            };
          };

          $scope.hideOverlay = function() {
            $scope.overlayStyle = {
              'background-color': 'white'
            };
            $scope.mapStyle = {
              opacity: '1'
            };
          };


          $scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
            $scope.interactionIsActive = false;
            $scope.setOverlay();
          });

          $scope.$on('showInteraction', function() {
            refreshMap();
          });

          // This is required in order to avoid the following bug:
          //   http://stackoverflow.com/questions/18769287
          var refreshMap = function() {
            $timeout(function() {
              google.maps.event.trigger($scope.map, 'resize');
              $scope.map.setCenter({
                lat: coords[0],
                lng: coords[1]
              });
              if (!$scope.interactionIsActive) {
                $scope.mapMarkers.push(new google.maps.Marker({
                  map: $scope.map,
                  position: new google.maps.LatLng(
                    $scope.getLastAnswer()[0], $scope.getLastAnswer()[1])
                }));
              }
            }, 100);
          };

          var coords = $scope.coords || [0, 0];
          var zoomLevel = parseInt($scope.zoom, 10) || 0;
          $scope.mapOptions = {
            center: new google.maps.LatLng(coords[0], coords[1]),
            zoom: zoomLevel,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            draggable: $scope.interactionIsActive
          };

          $scope.onMouseOver = function() {
            if ($scope.interactionIsActive) {
              return;
            }
            $scope.setOverlay();
          };

          $scope.onMouseOut = function() {
            if ($scope.interactionIsActive) {
              return;
            }
            $scope.hideOverlay();
          };

          $scope.registerClick = function($event, $params) {
            if (!$scope.interactionIsActive) {
              return;
            }
            var ll = $params[0].latLng;
            $scope.mapMarkers.push(new google.maps.Marker({
              map: $scope.map,
              position: ll
            }));

            CurrentInteractionService.onSubmit(
              [ll.lat(), ll.lng()], InteractiveMapRulesService);
          };

          refreshMap();
        }
      ]
    };
  }
]);
