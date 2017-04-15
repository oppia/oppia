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
 * Directive for the LabelingInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.directive('oppiaInteractiveLabelingInput', [
  '$sce', 'oppiaHtmlEscaper', 'explorationContextService',
  'imageClickInputRulesService',
  function($sce, oppiaHtmlEscaper, explorationContextService,
           imageClickInputRulesService) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&'
      },
      templateUrl: 'interaction/LabelingInput',
      controller: [
        '$scope', '$element', '$attrs', function($scope, $element, $attrs) {
          var imageAndLabels = oppiaHtmlEscaper.escapedJsonToObj(
            $attrs.imageAndLabelsWithValue);
          $scope.highlightRegionsOnHover =
            ($attrs.highlightRegionsOnHoverWithValue === 'true');
          $scope.alwaysShowRegions =
            ($attrs.alwaysShowRegionsWithValue === 'true');
          if ($scope.alwaysShowRegions) {$scope.highlightRegionsOnHover = false;}
          $scope.filepath = imageAndLabels.imagePath;
          $scope.imageUrl = (
            $scope.filepath ?
            $sce.trustAsResourceUrl(
              '/imagehandler/' + explorationContextService.getExplorationId() +
              '/' + encodeURIComponent($scope.filepath)) : null);
          $scope.mouseX = 0;
          $scope.mouseY = 0;
          $scope.currentlyHoveredRegions = [];
          $scope.allRegions = imageAndLabels.labeledRegions;
          console.log($scope.allRegions);
          $scope.getRegionDimensions = function(index) {
            var image = $($element).find('.oppia-image-click-img');
            var labeledRegion = imageAndLabels.labeledRegions[index];
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
          $scope.inlineRegionDisplay = function(){
            return 'inline';
          }
          $scope.onMousemoveImage = function(event) {
            var image = $($element).find('.oppia-image-click-img');
            $scope.mouseX = (event.pageX - image.offset().left) / image.width();
            $scope.mouseY = (event.pageY - image.offset().top) / image.height();
            $scope.currentlyHoveredRegions = [];
            for (var i = 0; i < imageAndLabels.labeledRegions.length; i++) {
              var labeledRegion = imageAndLabels.labeledRegions[i];
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

oppia.directive('oppiaResponseLabelingInput', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'response/LabelingInput',
    controller: [
        '$scope', '$attrs', 'oppiaHtmlEscaper',
        function($scope, $attrs, oppiaHtmlEscaper) {
      var _answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);

      $scope.clickRegionLabel = '(Clicks on ' + (
        _answer.clickedRegions.length > 0 ?
        '\'' + _answer.clickedRegions[0] + '\'' : 'image') + ')';
    }]
  };
}]);

oppia.directive('oppiaShortResponseLabelingInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/LabelingInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var _answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
        $scope.clickRegionLabel = (
          _answer.clickedRegions.length > 0 ? _answer.clickedRegions[0] :
          'Clicked on image');
      }]
    };
  }
]);

oppia.factory('imageClickInputRulesService', [function() {
  return {
    /*
    Answer has clicked regions, check that the label of the clicked
    region matches that of the dropped label
    */
    IsInRegion: function(answer, inputs) {
      return answer.clickedRegions.indexOf(inputs.x) !== -1;
    },
    IsNotInRegion: function(answer, inputs){
      console.log(answer)
      console.log(inputs)
      return answer.clickedRegions.indexOf(inputs.x) === -1;
    }
  };
}]);

/*
  Guide for revamping the image drag and drop
  1st, on a click, if is on button
    - check via mousedown
    - on mouseup run the onSubmit function with the answer being the button's text
*/
