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
  'labelingInputRulesService',
  function($sce, oppiaHtmlEscaper, explorationContextService,
           labelingInputRulesService) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&'
      },
      templateUrl: 'interaction/LabelingInput',
      controller: [
        '$scope', '$element', '$attrs', function($scope, $element, $attrs) {
          let imageAndLabels = oppiaHtmlEscaper.escapedJsonToObj(
            $attrs.imageAndLabelsWithValue);

          $scope.imageTitle = $attrs.imageTitleWithValue;
          var unicodeStripCount = 6;
          $scope.bonusWords = $attrs.bonusWordsWithValue.slice(unicodeStripCount);
          $scope.bonusWords = $scope.bonusWords.slice(0, -unicodeStripCount);
          $scope.bonusWords = $scope.bonusWords.split(',');

          // Remove white spaces
          $scope.bonusWords.map(function (word) {word.trim();});
          $scope.drawLines = ($attrs.showLinesWithValue == 'true');

          // Need to strip unicode off of inputs
          $scope.imageTitle = $scope.imageTitle.slice(unicodeStripCount);
          $scope.imageTitle = $scope.imageTitle.slice(0, -unicodeStripCount);
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

          // Initializing constants
          $scope.mouseX = 0;
          $scope.mouseY = 0;
          $scope.submitted = 0;
          $scope.maxRGBValue = 255;
          $scope.correctElements = [];
          $scope.incorrectElements = [];
          $scope.incorrectBoxes = [];
          $scope.currentDraggedElement = '';
          $scope.currentlyHoveredRegions = [];
          $scope.occupiedRegions = [];
          $scope.warningRValue = 248;
          $scope.warningGValue = 148;
          $scope.warningBValue = 6;
          $scope.allRegions = imageAndLabels.labeledRegions;

          /* Shuffle function to shuffle array to ensure random word bank
          Borrowed from:
          stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array */
          $scope.shuffle = function(a) {
              let j, x, i;
              for (i = a.length; i; i--) {
                  j = Math.floor(Math.random() * i);
                  x = a[i - 1];
                  a[i - 1] = a[j];
                  a[j] = x;
              }
          };

          $scope.regionsAndBonus = $scope.allRegions.map(
            function(x) {return x.label;}).concat($scope.bonusWords);

          $scope.regionsAndBonus = $scope.regionsAndBonus.filter(
            function(x) {return x != '';});

          $scope.shuffle($scope.allRegions);
          $scope.shuffle($scope.regionsAndBonus);
          $scope.numRegions = $scope.allRegions.length;

          // Ensure no duplicates of elements in our element tracking arrays
          $scope.checkAndRemoveElement = function(name){
            let index = $scope.correctElements.indexOf(name);
            if (index > -1){
              $scope.correctElements.splice(index, 1);
            }
            index = $scope.incorrectElements.indexOf(name);
            if (index > -1){
              $scope.incorrectElements.splice(index, 1);
              $scope.incorrectBoxes.splice(index, 1);
            }
            return;
          };

          // Change the button color based on whether or not it is correct
          $scope.getButtonColor = function(name){
            if (name === $scope.currentDraggedElement){
              return 'warning';
            }
            if (!$scope.submitted){
              return 'primary';
            }
            if ($scope.incorrectElements.indexOf(name) > -1){
              return 'danger';              
            }
            return 'primary';
          };

          // Get the current element label
          $scope.getThisName = function(event, ui, name){
            $scope.checkAndRemoveElement(name);
            $scope.currentDraggedElement = name;
            $scope.$apply();
            return;
          };

          // If all labels have been placed, run a correctness check
          $scope.runSubmitCheck = function(){
            $scope.submitted = 1;
            if ($scope.numRegions == 0){
              $scope.numRegions = $scope.incorrectElements.length;
              $scope.onSubmit({
                answer: {
                  clickPosition: [$scope.mouseX, $scope.mouseY],
                  clickedRegions: $scope.currentlyHoveredRegions,
                  incorrectElements: $scope.incorrectElements
                },
                rulesService: labelingInputRulesService
              });
            }
          };

          // Check if our value is the one of the region, and handle
          $scope.checkTheValues = function(event, ui, correctName){
            let correctLen, incorrectLen;
            $scope.occupiedRegions.push(correctName);
            $scope.numRegions--;
            if ($scope.numRegions < 0){
              $scope.numRegions = 0;
            }
            if (correctName == $scope.currentDraggedElement){
              $scope.correctElements.push($scope.currentDraggedElement);
            } else {
              $scope.incorrectElements.push($scope.currentDraggedElement);
              $scope.incorrectBoxes.push(correctName);
            }
            correctLen = $scope.correctElements.length;
            incorrectLen = $scope.incorrectElements.length;
            if ((correctLen + incorrectLen) === $scope.allRegions.length){
              $scope.runSubmitCheck();
            }
            $scope.currentDraggedElement = '';
          };

          // Find where the drop region should be placed
          $scope.getRegionDimensions = function(index) {
            const image = $($element).find('.oppia-image-click-img');
            const labeledRegion = imageAndLabels.labeledRegions[index];
            const regionArea = labeledRegion.region.area;
            const leftDelta = image.offset().left - image.parent().offset().left;
            const topDelta = image.offset().top - image.parent().offset().top;
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

          // Get the dimensions of the image
          $scope.getImageWidth = function(){
            const image = $($element).find('.oppia-image-click-img');
            return image.width();
          };

          $scope.getImageHeight = function(){
            const image = $($element).find('.oppia-image-click-img');
            return image.height();
          };

          // Get offset to draw image lines
          $scope.getLeftDelta = function(){
            const image = $($element).find('.oppia-image-click-img');
            return image.offset().left - image.parent().offset().left;
          };

          $scope.getTopDelta = function(){
            const image = $($element).find('.oppia-image-click-img');
            return image.offset().top - image.parent().offset().top;
          };

          // Draw line on canvas, no line HTML class is available due to div
          $scope.getLineDistance = function(x1, x2, y1, y2){
            const xDiff = Math.pow((x2 - x1), 2);
            const yDiff = Math.pow((y2 - y1), 2);
            return Math.sqrt(xDiff + yDiff);
          };

          $scope.convertArctan = function(x1, x2, y1, y2){
            if (x2 < x1) {
              return Math.atan((y2 - y1) / (x2 - x1)) + Math.PI;
            }
            return Math.atan((y2 - y1) / (x2 - x1));
          };

          // Find any regions we are hovering over and update logic accordingly
          $scope.onMousemoveImage = function(event) {
            const image = $($element).find('.oppia-image-click-img');
            let i, labeledRegion, regionArea;
            $scope.mouseX = (event.pageX - image.offset().left) / image.width();
            $scope.mouseY = (event.pageY - image.offset().top) / image.height();
            $scope.currentlyHoveredRegions = [];
            for (i = 0; i < imageAndLabels.labeledRegions.length; i++) {
              labeledRegion = imageAndLabels.labeledRegions[i];
              regionArea = labeledRegion.region.area;
              if (regionArea[0][0] <= $scope.mouseX &&
                  $scope.mouseX <= regionArea[1][0] &&
                  regionArea[0][1] <= $scope.mouseY &&
                  $scope.mouseY <= regionArea[1][1]) {
                    $scope.currentlyHoveredRegions.push(labeledRegion.label);
              }
            }
          };

          // Callback when we scroll over a highlighted region
          $scope.isInRegion = function(event, ui, region){
            $scope.currentlyHoveredRegions.push(region.label);
            $scope.$apply();
          };

          // Callback when we scroll out of a region
          $scope.outOfRegion = function(event, ui, region){
            const name = region.label;
            let index = $scope.currentlyHoveredRegions.indexOf(name);
            if (index > -1){
              $scope.currentlyHoveredRegions.splice(index, 1);
            }
            index = $scope.occupiedRegions.indexOf(name);
            if (index > -1){
              $scope.occupiedRegions.splice(index, 1);
            }            
            $scope.$apply();
          };

          // Callback to evict a label if a region is full (not supported)
          $scope.checkRevertBounce = function(){
            //TODO fix implementation to work dynamically
            return 'invalid';
          }

          // Callback for releasing a draggable element
          $scope.dropHovered = function(){
            if ($scope.currentlyHoveredRegions.length == 0){
              $scope.currentDraggedElement = '';
              $scope.$apply();              
            }
          };

          // Change to red if the input is not correct
          $scope.getRValue = function(region){
            if ($scope.currentlyHoveredRegions.indexOf(region.label) != -1){
              return $scope.warningRValue;
            }
            if (!$scope.submitted){
              return 0;
            }
            return $scope.maxRGBValue * 
                        ($scope.incorrectBoxes.indexOf(region.label) !== -1);
          };

          // Change to blue if the input is correct
          $scope.getBValue = function(region){
            if ($scope.currentlyHoveredRegions.indexOf(region.label) != -1){
              return $scope.warningBValue;
            }
            if (!$scope.submitted){
              return $scope.maxRGBValue;
            }
            return $scope.maxRGBValue * 
                        ($scope.incorrectBoxes.indexOf(region.label) === -1);
          };

          // Provide some green coloring if the label is being hovered over
          $scope.getGValue = function(region){
            if ($scope.currentlyHoveredRegions.indexOf(region.label) != -1){
              return $scope.warningGValue;
            }
            return 0;
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

oppia.factory('labelingInputRulesService', [function() {
  return {
    /*
    Answer has clicked regions, check that the label of the clicked
    region matches that of the dropped label
    */
    GetsAllCorrect: function(answer, inputs){
      return answer.incorrectElements.length === 0;
    },
    HasMultipleMisses: function(answer, inputs){
      if (!(inputs.x)){
        //Backwards compatability, consider removing
        return answer.incorrectElements.length >= 2;
      }
      return answer.incorrectElements.length >= (inputs.x);
    },
    Misses: function(answer, inputs){
      return answer.incorrectElements.indexOf(inputs.x) !== -1;
    }

  };
}]);
