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
 * Directive for the ImageClickInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.directive('oppiaInteractiveImageClickInput', [
  '$sce', 'HtmlEscaperService', 'ExplorationContextService',
  'imageClickInputRulesService',
  function($sce, HtmlEscaperService, ExplorationContextService,
           imageClickInputRulesService) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&'
      },
      templateUrl: 'interaction/ImageClickInput',
      controller: [
        '$scope', '$element', '$attrs', function($scope, $element, $attrs) {
          var imageAndRegions = HtmlEscaperService.escapedJsonToObj(
            $attrs.imageAndRegionsWithValue);
          $scope.highlightRegionsOnHover =
            ($attrs.highlightRegionsOnHoverWithValue === 'true');
          $scope.filepath = imageAndRegions.imagePath;
          $scope.imageUrl = (
            $scope.filepath ?
            $sce.trustAsResourceUrl(
              '/imagehandler/' + ExplorationContextService.getExplorationId() +
              '/' + encodeURIComponent($scope.filepath)) : null);
          $scope.mouseX = 0;
          $scope.mouseY = 0;
          $scope.currentlyHoveredRegions = [];
          $scope.allRegions = imageAndRegions.labeledRegions;
          $scope.getRegionDimensions = function(index) {
            var image = $($element).find('.oppia-image-click-img');
            var labeledRegion = imageAndRegions.labeledRegions[index];
            var regionArea = labeledRegion.region.area;
            var leftDelta = image.offset().left - image.parent().offset().left;
            var topDelta = image.offset().top - image.parent().offset().top;
            return {
              left: regionArea[0][0] * image.width() + leftDelta,
              top: regionArea[0][1] * image.height() + topDelta,
              width: (regionArea[1][0] - regionArea[0][0]) * image.width(),
              height: (regionArea[1][1] - regionArea[0][1]) * image.height()
            };
          };
          $scope.getRegionDisplay = function(label) {
            if ($scope.currentlyHoveredRegions.indexOf(label) === -1) {
              return 'none';
            } else {
              return 'inline';
            }
          };
          $scope.onMousemoveImage = function(event) {
            var image = $($element).find('.oppia-image-click-img');
            $scope.mouseX = (event.pageX - image.offset().left) / image.width();
            $scope.mouseY = (event.pageY - image.offset().top) / image.height();
            $scope.currentlyHoveredRegions = [];
            for (var i = 0; i < imageAndRegions.labeledRegions.length; i++) {
              var labeledRegion = imageAndRegions.labeledRegions[i];
              var regionArea = labeledRegion.region.area;
              if (regionArea[0][0] <= $scope.mouseX &&
                  $scope.mouseX <= regionArea[1][0] &&
                  regionArea[0][1] <= $scope.mouseY &&
                  $scope.mouseY <= regionArea[1][1]) {
                $scope.currentlyHoveredRegions.push(labeledRegion.label);
              }
            }
          };
          $scope.onClickImage = function() {
            $scope.onSubmit({
              answer: {
                clickPosition: [$scope.mouseX, $scope.mouseY],
                clickedRegions: $scope.currentlyHoveredRegions
              },
              rulesService: imageClickInputRulesService
            });
          };
        }
      ]
    };
  }
]);

oppia.directive('oppiaResponseImageClickInput', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'response/ImageClickInput',
    controller: [
      '$scope', '$attrs', 'HtmlEscaperService',
      function($scope, $attrs, HtmlEscaperService) {
        var _answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);

        $scope.clickRegionLabel = '(Clicks on ' + (
          _answer.clickedRegions.length > 0 ?
          '\'' + _answer.clickedRegions[0] + '\'' : 'image') + ')';
      }]
  };
}]);

oppia.directive('oppiaShortResponseImageClickInput', [
  'HtmlEscaperService', function(HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/ImageClickInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var _answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        $scope.clickRegionLabel = (
          _answer.clickedRegions.length > 0 ? _answer.clickedRegions[0] :
          'Clicked on image');
      }]
    };
  }
]);

oppia.factory('imageClickInputRulesService', [function() {
  return {
    IsInRegion: function(answer, inputs) {
      return answer.clickedRegions.indexOf(inputs.x) !== -1;
    }
  };
}]);
