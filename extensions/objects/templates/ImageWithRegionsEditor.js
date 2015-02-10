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

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

// TODO(czx): Uniquify the labels of image regions
oppia.directive('imageWithRegionsEditor', [
  '$rootScope', '$sce', '$compile', 'warningsData', '$document', function($rootScope, $sce, $compile, warningsData, $document) {
    return {
      link: function(scope, element, attrs) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_TEMPLATES_URL + scope.$parent.objType;
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: true,
      template: '<div ng-include="getTemplateUrl()"></div>',
      controller: function($scope, $element, $attrs) {
        $scope.alwaysEditable = true;

        $scope.REGION_LABEL_OFFSET_X = 6;
        $scope.REGION_LABEL_OFFSET_Y = 18;
        $scope.REGION_STYLE = 'fill: blue; opacity: 0.5;';
        $scope.REGION_LABEL_STYLE = 'fill: white; font-size: large;';

        // All coordinates have origin at top-left, 
        // increasing in x to the right and increasing in y down
        // Current mouse position in SVG coordinates
        $scope.mouseX = 0; 
        $scope.mouseY = 0;
        // Original mouse click position for rectangle drawing
        $scope.origX = 0; 
        $scope.origY = 0;
        // Coordinates for currently drawn rectangle (when user is dragging)
        $scope.rectX = 0; 
        $scope.rectY = 0;
        $scope.rectWidth = 0; 
        $scope.rectHeight = 0;

        // Is user currently dragging?
        $scope.userIsCurrentlyDragging = false;
        // Dimensions of original image
        var originalImageWidth = 0; 
        var originalImageHeight = 0;
        // We recalculate image dimensions when the image changes
        var needRecalculateImageDimensions = true;

        $scope.regionDrawMode = false;
        $scope.hoveredRegion = null;
        $scope.selectedRegion = null;

        // Temporary label list
        var labelList = $scope.$parent.value.labeledRegions.map(
          function(region) {
            return region.label;
          }
        );
        
        // Calculates the dimensions of the image, assuming that the width
        // of the image is scaled down to fit the svg element if necessary
        function calculateImageDimensions() {
          if (needRecalculateImageDimensions) {
            var svgElement = $($element).find('.oppia-image-with-regions-editor-svg');
            this.displayedImageWidth = Math.min(svgElement.width(), originalImageWidth);
            var scalingRatio = this.displayedImageWidth / originalImageWidth; 
            this.displayedImageHeight = originalImageHeight * scalingRatio;
            needRecalculateImageDimensions = false;
          }
          return {
            width: this.displayedImageWidth,
            height: this.displayedImageHeight 
          };
        };
        // Previously calculated image width and height
        calculateImageDimensions.displayedImageWidth = 0;
        calculateImageDimensions.displayedImageHeight = 0;
        // Use these two functions to get the calculated image width and height
        $scope.getImageWidth = function() {
          return calculateImageDimensions().width;
        };
        $scope.getImageHeight = function() {
          return calculateImageDimensions().height;
        };

        $scope.getPreviewUrl = function(imageUrl) {
          return $sce.trustAsResourceUrl(
            '/imagehandler/' + $rootScope.explorationId + '/' +
            encodeURIComponent(imageUrl)
          );
        };

        $scope.$watch('$parent.value.imagePath', function(newVal) {
          if (newVal === '') {
            return;
          }
          // Loads the image in hanging <img> tag so as to get the
          // width and height
          $('<img/>').attr('src', $scope.getPreviewUrl(newVal)).load(
            function() {
              originalImageWidth = this.width;
              originalImageHeight = this.height;
              needRecalculateImageDimensions = true;
              $scope.$apply();
            }
          );
        });

        function hasDuplicates(originalArray) {
          var array = originalArray.slice(0).sort();
          for (var i = 1; i < array.length; i++) {
            if (array[i - 1] === array[i]) {
              return true;
            }
          }
          return false;
        }

        $scope.regionLabelGetterSetter = function(index) {
          return function(label) {
            if (angular.isDefined(label)) {
              labelList[index] = label;
              if (hasDuplicates(labelList)) {
                $scope.errorText = 'ERROR: Duplicate labels!';
              } else {
                $scope.errorText = '';
                for (var i = 0; i < labelList.length; i++) {
                  $scope.$parent.value.labeledRegions[i].label = labelList[i];
                }
              }
            }
            return labelList[index];
          };
        };
        
        function convertCoordsToFraction(coords, dimensions) {
          return [coords[0] / dimensions[0], coords[1] / dimensions[1]];
        }

        $scope.onSvgMouseMove = function(evt) {
          var svgElement = $($element).find('.oppia-image-with-regions-editor-svg');
          $scope.mouseX = evt.pageX - svgElement.offset().left;
          $scope.mouseY = evt.pageY - svgElement.offset().top;
          $scope.rectX = Math.min($scope.origX, $scope.mouseX);
          $scope.rectY = Math.min($scope.origY, $scope.mouseY);
          $scope.rectWidth = Math.abs($scope.origX - $scope.mouseX);
          $scope.rectHeight = Math.abs($scope.origY - $scope.mouseY);
        };
        $scope.onSvgMouseDown = function(evt) {
          evt.preventDefault();
          if (!$scope.regionDrawMode) {
            return;
          }
          $scope.origX = $scope.mouseX;
          $scope.origY = $scope.mouseY;
          $scope.rectWidth = $scope.rectHeight = 0;
          $scope.userIsCurrentlyDragging = true;
        }
        $scope.onSvgMouseUp = function(evt) {
          if (!$scope.regionDrawMode) {
            return;
          }
          $scope.userIsCurrentlyDragging = false;
          $scope.regionDrawMode = false;
          if ($scope.rectWidth != 0 && $scope.rectHeight != 0) {
            var labels = $scope.$parent.value.labeledRegions.map(
              function(region) {
                return region.label;
              }
            );
            var newLabel = null;
            for (var i = 1; i <= labels.length + 1; i++) {
              if (labels.indexOf(i.toString()) === -1) {
                newLabel = i.toString();
                break;
              }
            }
            var newRegion = {
              label: newLabel,
              region: {
                regionType: 'Rectangle', 
                area: [
                  convertCoordsToFraction(
                    [$scope.rectX, $scope.rectY], 
                    [$scope.getImageWidth(), $scope.getImageHeight()]
                  ),
                  convertCoordsToFraction(
                    [$scope.rectX + $scope.rectWidth, $scope.rectY + $scope.rectHeight],
                    [$scope.getImageWidth(), $scope.getImageHeight()]
                  )
                ]
              }
            };
            $scope.$parent.value.labeledRegions.push(newRegion);
            labelList.push(newLabel);
          }
        };
        $scope.onMouseoverRegion = function(index) {
          if ($scope.hoveredRegion === null) {
            $scope.hoveredRegion = index;
          }
        };
        $scope.onMouseoutRegion = function(index) {
          if ($scope.hoveredRegion === index) {
            $scope.hoveredRegion = null;
          }
        };
        $scope.onMousedownRegion = function(index) {
          $scope.selectedRegion = $scope.hoveredRegion;
        };
        $scope.onDocumentMouseUp = function(evt) {
          if ($scope.regionDrawMode && !$scope.userIsCurrentlyDragging) {
            $scope.regionDrawMode = false;
          }
        }
        $document.on('mouseup', $scope.onDocumentMouseUp);

        $scope.setDrawMode = function() {
          $scope.regionDrawMode = true;
        };
        $scope.getCursorStyle = function() {
          if ($scope.regionDrawMode) {
            return 'crosshair';
          } else {
            return 'default';
          }
        };

        $scope.resetEditor = function() {
          $scope.$parent.value.imagePath = '';
          $scope.$parent.value.labeledRegions = [];
        };
        $scope.deleteRegion = function(index) {
          $scope.$parent.value.labeledRegions.splice(index, 1);
          labelList.splice(index, 1);
        };
      }
    };
  }
]);


