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
          $scope.imageTitle = $attrs.imageTitleWithValue;
          //Need to strip unicode
          var unicodeStripCount = 6;
          $scope.imageTitle = $scope.imageTitle.slice(unicodeStripCount)
          $scope.imageTitle = $scope.imageTitle.slice(0, -unicodeStripCount);
          console.log($scope.imageTitle);
          $scope.alwaysShowRegions = 'true';
          if ($scope.alwaysShowRegions) {
            $scope.highlightRegionsOnHover = false;
          }
          $scope.filepath = imageAndLabels.imagePath;
          $scope.imageUrl = (
            $scope.filepath ?
            $sce.trustAsResourceUrl(
              '/imagehandler/' + explorationContextService.getExplorationId() +
              '/' + encodeURIComponent($scope.filepath)) : null);
          $scope.mouseX = 0;
          $scope.mouseY = 0;
          $scope.correctElements = [];
          $scope.incorrectElements = [];
          $scope.currentDraggedElement = "";
          $scope.currentlyHoveredRegions = [];
          $scope.allRegions = imageAndLabels.labeledRegions;
          //Ensure no duplicates of elements in our element tracking arrays
          $scope.checkAndRemoveElement = function(name){
            var index = $scope.correctElements.indexOf(name);
            if (index > -1){
              $scope.correctElements.splice(index, 1);
            }
            index = $scope.incorrectElements.indexOf(name);
            if (index > -1){
              $scope.incorrectElements.splice(index, 1);
            }
            return;
          }
          //Get the current element label
          $scope.getThisName = function(event, ui, name){
            $scope.checkAndRemoveElement(name);
            $scope.currentDraggedElement = name;
            return;
          }
          //If all labels have been placed, run a correctness check
          $scope.runSubmitCheck = function(){
            $scope.onSubmit({
              answer: {
                clickPosition: [$scope.mouseX, $scope.mouseY],
                clickedRegions: $scope.currentlyHoveredRegions,
                incorrectElements: $scope.incorrectElements
              },
              rulesService: imageClickInputRulesService
            });
          }
          //Check if our value is the one of the region, and handle acccordingly
          $scope.checkTheValues = function(event, ui, correctName){
            if (correctName == $scope.currentDraggedElement){
              $scope.correctElements.push($scope.currentDraggedElement);
            } else {
              $scope.incorrectElements.push($scope.currentDraggedElement);
            }
            var correctLen = $scope.correctElements.length;
            var incorrectLen = $scope.incorrectElements.length;
            if ((correctLen + incorrectLen) === $scope.allRegions.length){
              $scope.runSubmitCheck();
            }
          }
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
          $scope.getImageWidth = function(){
            var image = $($element).find('.oppia-image-click-img');
            return image.width();
          }
          $scope.getImageHeight = function(){
            var image = $($element).find('.oppia-image-click-img');
            return image.height();
          }
          $scope.getLeftDelta = function(){
            var image = $($element).find('.oppia-image-click-img');
            return image.offset().left - image.parent().offset().left;
          }
          $scope.getTopDelta = function(){
            var image = $($element).find('.oppia-image-click-img');
            return image.offset().top - image.parent().offset().top;
          }
          $scope.getLineDistance = function(x1, x2, y1, y2){
            var xDiff = Math.pow((x2 - x1), 2);
            var yDiff = Math.pow((y2 - y1), 2);
            return Math.sqrt(xDiff + yDiff);
          }
          $scope.convertArctan = function(x1, x2, y1, y2){
            if (x2 < x1) {
              return Math.atan((y2 - y1) / (x2 - x1)) + Math.PI;
            }
            return Math.atan((y2 - y1) / (x2 - x1));
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
          //TODO: Delete below
          $scope.onClickImage = function() {
            $scope.onSubmit({
              answer: {
                clickPosition: [$scope.mouseX, $scope.mouseY],
                clickedRegions: $scope.currentlyHoveredRegions,
                incorrectElements: $scope.incorrectElements
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
    GetsAllCorrect: function(answer, inputs){
      return answer.incorrectElements.length === 0;
    },
    Misses: function(answer, inputs){
      return answer.incorrectElements.indexOf(inputs.x) !== -1;      
    }
  };
}]);
