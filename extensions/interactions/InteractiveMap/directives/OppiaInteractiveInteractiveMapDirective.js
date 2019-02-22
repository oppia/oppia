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
  'HtmlEscaperService', 'interactiveMapRulesService', 'UrlInterpolationService',
  'EVENT_NEW_CARD_AVAILABLE',
  function(
      HtmlEscaperService, interactiveMapRulesService, UrlInterpolationService,
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
          var coords = $scope.coords || [0, 0];
          var zoomLevel = parseInt($scope.zoom, 10) || 0;

          $scope.setOverlay = function() {
            $scope.overlayStyle = {
              'background-color': 'black'
            };
            $scope.mapStyle = {
              opacity: '0.8'
            };
          };
          var ICON = {
            iconUrl: UrlInterpolationService.getExtensionResourceUrl(
              '/interactions/InteractiveMap/static/marker-icon.png'),
            shadowUrl: UrlInterpolationService.getExtensionResourceUrl(
              '/interactions/InteractiveMap/static/marker-shadow.png'),
            iconRetinaUrl: UrlInterpolationService.getExtensionResourceUrl(
              '/interactions/InteractiveMap/static/marker-icon-2x.png'),
            shadowRetinaUrl: UrlInterpolationService.getExtensionResourceUrl(
              '/interactions/InteractiveMap/static/marker-shadow.png'),
            iconAnchor: [12, 41],
            shadowAnchor: [13, 41],
            shadowSize: [41, 41],
            iconSize: [25, 41]
          };

          $scope.hideOverlay = function() {
            $scope.overlayStyle = {
              'background-color': 'white'
            };
            $scope.mapStyle = {
              opacity: '1'
            };
          };

          var addNewMarker = function(lat, lng) {
            var newMarker = {
              lat: lat,
              lng: lng,
              icon: ICON
            };
            $scope.mapMarkers.push(angular.copy(newMarker));
          };

          $scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
            $scope.interactionIsActive = false;
            $scope.setOverlay();
          });

          $scope.$on('showInteraction', function() {
            refreshMap();
          });

          var refreshMap = function() {
            $scope.mapOptions = {
              center: {
                lat: coords[0],
                lng: coords[1],
                zoom: zoomLevel
              },
              events: {}
            };
            if (!$scope.interactionIsActive) {
              addNewMarker(scope.getLastAnswer()[0], $scope.getLastAnswer()[1]);
            }
          };

          $scope.$on('leafletDirectiveMap.mouseover', function(event) {
            if ($scope.interactionIsActive) {
              return;
            }
            $scope.setOverlay();
          });

          $scope.$on('leafletDirectiveMap.mouseout', function(event) {
            if ($scope.interactionIsActive) {
              return;
            }
            $scope.setOverlay();
          });

          $scope.$on('leafletDirectiveMap.click', function(event, args) {
            if (!$scope.interactionIsActive) {
              return;
            }
            var newLat = args.leafletEvent.latlng.lat;
            var newLng = args.leafletEvent.latlng.lng;
            addNewMarker(newLat, newLng);
            CurrentInteractionService.onSubmit(
              [newLat, newLng], interactiveMapRulesService);
          });

          refreshMap();
        }
      ]
    };
  }
]);
