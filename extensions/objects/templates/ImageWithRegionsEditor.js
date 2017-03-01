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
  '$sce', '$compile', 'alertsService', '$document', 'explorationContextService',
  'OBJECT_EDITOR_URL_PREFIX',
  function($sce, $compile, alertsService, $document, explorationContextService,
           OBJECT_EDITOR_URL_PREFIX) {
    return {
      link: function(scope, element) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_URL_PREFIX + 'ImageWithRegions';
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: true,
      template: '<div ng-include="getTemplateUrl()"></div>',
      controller: ['$scope', '$element', function($scope, $element) {
        $scope.alwaysEditable = true;

        $scope.REGION_LABEL_OFFSET_X = 6;
        $scope.REGION_LABEL_OFFSET_Y = 18;
        $scope.REGION_LABEL_STYLE = (
          'fill: white; font-size: large; pointer-events: none;');
        $scope.SELECTED_REGION_STYLE = 'fill: orange; opacity: 0.5;';
        $scope.UNSELECTED_REGION_STYLE = 'fill: blue; opacity: 0.5;';
        $scope.getRegionStyle = function(index) {
          if (index === $scope.selectedRegion) {
            return $scope.SELECTED_REGION_STYLE;
          } else {
            return $scope.UNSELECTED_REGION_STYLE;
          }
        };

        // All coordinates have origin at top-left,
        // increasing in x to the right and increasing in y down
        // Current mouse position in SVG coordinates
        $scope.mouseX = 0;
        $scope.mouseY = 0;
        // Original mouse click position for rectangle drawing
        $scope.originalMouseX = 0;
        $scope.originalMouseY = 0;
        // Original position and dimensions for dragged rectangle
        $scope.originalRectArea = {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
        // Coordinates for currently drawn rectangle (when user is dragging)
        $scope.rectX = 0;
        $scope.rectY = 0;
        $scope.rectWidth = 0;
        $scope.rectHeight = 0;
        // Flags for the cursor direction in which region is to be resized
        $scope.nResize = false;
        $scope.sResize = false;
        $scope.eResize = false;
        $scope.wResize = false;
        $scope.neResize = false;
        $scope.nwResize = false;
        $scope.seResize = false;
        $scope.nwResize = false;
        // A flag to check direction change while resizing
        $scope.flag = 0;
        // Is user currently drawing a new region?
        $scope.userIsCurrentlyDrawing = false;
        // Is user currently dragging an existing region?
        $scope.userIsCurrentlyDragging = false;
        // Is user currently resizing an existing region?
        $scope.userIsCurrentlyResizing = false;
        // The region is being resized along which direction?
        $scope.resizeDirection = '';
        // The region along borders which when hovered provides resize cursor
        $scope.resizeRegionBorder = 10;
        // Dimensions of original image
        $scope.originalImageWidth = 0;
        $scope.originalImageHeight = 0;
        // Is the user preparing to draw a rectangle?
        $scope.regionDrawMode = false;
        // Index of region currently hovered over
        $scope.hoveredRegion = null;
        // Index of region currently moved over
        $scope.moveRegion = null;
        // Index of region currently selected
        $scope.selectedRegion = null;

        // Temporary label list
        var labelList = $scope.$parent.value.labeledRegions.map(
          function(region) {
            return region.label;
          }
        );

        // Calculates the dimensions of the image, assuming that the width
        // of the image is scaled down to fit the svg element if necessary
        var _calculateImageDimensions = function() {
          var svgElement = $($element).find(
            '.oppia-image-with-regions-editor-svg');
          var displayedImageWidth = Math.min(
            svgElement.width(), $scope.originalImageWidth);
          var scalingRatio = displayedImageWidth / $scope.originalImageWidth;
          // Note that scalingRatio may be NaN if $scope.originalImageWidth is
          // zero.
          var displayedImageHeight = (
            $scope.originalImageWidth === 0 ? 0.0 :
            $scope.originalImageHeight * scalingRatio);
          return {
            width: displayedImageWidth,
            height: displayedImageHeight
          };
        };
        // Use these two functions to get the calculated image width and height
        $scope.getImageWidth = function() {
          return _calculateImageDimensions().width;
        };
        $scope.getImageHeight = function() {
          return _calculateImageDimensions().height;
        };

        $scope.getPreviewUrl = function(imageUrl) {
          return $sce.trustAsResourceUrl(
            '/imagehandler/' + explorationContextService.getExplorationId() +
            '/' + encodeURIComponent(imageUrl)
          );
        };

        // Called when the image is changed to calculate the required
        // width and height, especially for large images
        $scope.$watch('$parent.value.imagePath', function(newVal) {
          if (newVal !== '') {
            // Loads the image in hanging <img> tag so as to get the
            // width and height
            $('<img/>').attr('src', $scope.getPreviewUrl(newVal)).on(
              'load', function() {
                $scope.originalImageWidth = this.width;
                $scope.originalImageHeight = this.height;
                $scope.$apply();
              }
            );
          }
        });

        var hasDuplicates = function(originalArray) {
          var array = originalArray.slice(0).sort();
          for (var i = 1; i < array.length; i++) {
            if (array[i - 1] === array[i]) {
              return true;
            }
          }
          return false;
        };

        // Called whenever the direction cursor is to be hidden
        $scope.hideDirectionCursor = function() {
          $scope.nResize = false;
          $scope.eResize = false;
          $scope.wResize = false;
          $scope.sResize = false;
          $scope.neResize = false;
          $scope.nwResize = false;
          $scope.seResize = false;
          $scope.swResize = false;
        };

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

        var convertCoordsToFraction = function(coords, dimensions) {
          return [coords[0] / dimensions[0], coords[1] / dimensions[1]];
        };
        // Convert to and from region area (which is stored as a fraction of
        // image width and height) and actual width and height
        var regionAreaFromCornerAndDimensions = function(x, y, width, height) {
          height = Math.abs(height);
          width = Math.abs(width);
          return [
            convertCoordsToFraction(
              [x, y],
              [$scope.getImageWidth(), $scope.getImageHeight()]
            ),
            convertCoordsToFraction(
              [x + width, y + height],
              [$scope.getImageWidth(), $scope.getImageHeight()]
            )
          ];
        };
        var cornerAndDimensionsFromRegionArea = function(area) {
          return {
            x: area[0][0] * $scope.getImageWidth(),
            y: area[0][1] * $scope.getImageHeight(),
            width: (area[1][0] - area[0][0]) * $scope.getImageWidth(),
            height: (area[1][1] - area[0][1]) * $scope.getImageHeight()
          };
        };

        var resizeRegion = function() {
          var labeledRegions = $scope.$parent.value.labeledRegions;
          var resizedRegion = labeledRegions[$scope.selectedRegion].region;
          var deltaX = $scope.mouseX - $scope.originalMouseX;
          var deltaY = $scope.mouseY - $scope.originalMouseY;
          if ($scope.resizeDirection === 'n') {
            if ($scope.originalRectArea.height - deltaY <= 0) {
              $scope.flag = 1;
              $scope.sResize = true;
              $scope.nResize = false;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x,
                $scope.originalMouseY + $scope.originalRectArea.height,
                $scope.originalRectArea.width,
                $scope.originalRectArea.height - deltaY
              );
            } else {
              $scope.flag = 0;
              $scope.sResize = false;
              $scope.nResize = true;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x,
                $scope.originalRectArea.y + deltaY,
                $scope.originalRectArea.width,
                $scope.originalRectArea.height - deltaY
              );
            }
          } else if ($scope.resizeDirection === 's') {
            if ($scope.originalRectArea.height + deltaY <= 0) {
              $scope.sResize = false;
              $scope.nResize = true;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x,
                $scope.originalRectArea.y + deltaY +
                  $scope.originalRectArea.height,
                $scope.originalRectArea.width,
                $scope.originalRectArea.height + deltaY
              );
            } else {
              $scope.sResize = true;
              $scope.nResize = false;
              $scope.flag = 0;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x,
                $scope.originalRectArea.y,
                $scope.originalRectArea.width,
                $scope.originalRectArea.height + deltaY
              );
            }
          } else if ($scope.resizeDirection === 'e') {
            if ($scope.originalRectArea.width + deltaX <= 0) {
              $scope.eResize = false;
              $scope.wResize = true;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + deltaX +
                  $scope.originalRectArea.width,
                $scope.originalRectArea.y,
                $scope.originalRectArea.width + deltaX,
                $scope.originalRectArea.height
              );
            } else {
              $scope.eResize = true;
              $scope.wResize = false;
              $scope.flag = 0;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x,
                $scope.originalRectArea.y,
                $scope.originalRectArea.width + deltaX,
                $scope.originalRectArea.height
              );
            }
          } else if ($scope.resizeDirection === 'w') {
            if ($scope.originalRectArea.width - deltaX <= 0) {
              $scope.eResize = true;
              $scope.wResize = false;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + $scope.originalRectArea.width,
                $scope.originalRectArea.y,
                $scope.originalRectArea.width - deltaX,
                $scope.originalRectArea.height
              );
            } else {
              $scope.eResize = false;
              $scope.wResize = true;
              $scope.flag = 0;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + deltaX,
                $scope.originalRectArea.y,
                $scope.originalRectArea.width - deltaX,
                $scope.originalRectArea.height
              );
            }
          } else if ($scope.resizeDirection === 'ne') {
            if ($scope.originalRectArea.height - deltaY <= 0 &&
                $scope.originalRectArea.width + deltaX <= 0) {
              $scope.swResize = true;
              $scope.neResize = false;
              $scope.nwResize = false;
              $scope.seResize = false;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + deltaX +
                  $scope.originalRectArea.width,
                $scope.originalRectArea.y + $scope.originalRectArea.height,
                $scope.originalRectArea.width + deltaX,
                $scope.originalRectArea.height - deltaY
              );
            } else if ($scope.originalRectArea.width + deltaX <= 0) {
              $scope.swResize = false;
              $scope.neResize = false;
              $scope.nwResize = true;
              $scope.seResize = false;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + deltaX +
                  $scope.originalRectArea.width,
                $scope.originalRectArea.y + deltaY,
                $scope.originalRectArea.width + deltaX,
                $scope.originalRectArea.height - deltaY
              );
            } else if ($scope.originalRectArea.height - deltaY <= 0) {
              $scope.swResize = false;
              $scope.neResize = false;
              $scope.nwResize = false;
              $scope.seResize = true;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x,
                $scope.originalMouseY + $scope.originalRectArea.height,
                $scope.originalRectArea.width + deltaX,
                $scope.originalRectArea.height - deltaY
              );
            } else {
              $scope.swResize = false;
              $scope.neResize = true;
              $scope.nwResize = false;
              $scope.seResize = false;
              $scope.flag = 0;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x,
                $scope.originalRectArea.y + deltaY,
                $scope.originalRectArea.width + deltaX,
                $scope.originalRectArea.height - deltaY
              );
            }
          } else if ($scope.resizeDirection === 'nw') {
            if ($scope.originalRectArea.height - deltaY <= 0 &&
                $scope.originalRectArea.width - deltaX <= 0) {
              $scope.swResize = false;
              $scope.neResize = false;
              $scope.nwResize = false;
              $scope.seResize = true;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + $scope.originalRectArea.width,
                $scope.originalRectArea.y + $scope.originalRectArea.height,
                $scope.originalRectArea.width - deltaX,
                $scope.originalRectArea.height - deltaY
              );
            } else if ($scope.originalRectArea.width - deltaX <= 0) {
              $scope.swResize = false;
              $scope.neResize = true;
              $scope.nwResize = false;
              $scope.seResize = false;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + $scope.originalRectArea.width,
                $scope.originalRectArea.y + deltaY,
                $scope.originalRectArea.width - deltaX,
                $scope.originalRectArea.height - deltaY
              );
            } else if ($scope.originalRectArea.height - deltaY <= 0) {
              $scope.swResize = true;
              $scope.neResize = false;
              $scope.nwResize = false;
              $scope.seResize = false;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + deltaX,
                $scope.originalRectArea.y + $scope.originalRectArea.height,
                $scope.originalRectArea.width - deltaX,
                $scope.originalRectArea.height - deltaY
              );
            } else {
              $scope.swResize = false;
              $scope.neResize = false;
              $scope.nwResize = true;
              $scope.seResize = false;
              $scope.flag = 0;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + deltaX,
                $scope.originalRectArea.y + deltaY,
                $scope.originalRectArea.width - deltaX,
                $scope.originalRectArea.height - deltaY
              );
            }
          } else if ($scope.resizeDirection === 'se') {
            if ($scope.originalRectArea.height + deltaY <= 0 &&
                $scope.originalRectArea.width + deltaX <= 0) {
              $scope.swResize = false;
              $scope.neResize = false;
              $scope.nwResize = true;
              $scope.seResize = false;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + deltaX +
                  $scope.originalRectArea.width,
                $scope.originalRectArea.y + deltaY +
                  $scope.originalRectArea.height,
                $scope.originalRectArea.width + deltaX,
                $scope.originalRectArea.height + deltaY
              );
            } else if ($scope.originalRectArea.width + deltaX <= 0) {
              $scope.swResize = true;
              $scope.neResize = false;
              $scope.nwResize = false;
              $scope.seResize = false;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + deltaX +
                  $scope.originalRectArea.width,
                $scope.originalRectArea.y,
                $scope.originalRectArea.width + deltaX,
                $scope.originalRectArea.height + deltaY
              );
            } else if ($scope.originalRectArea.height + deltaY <= 0) {
              $scope.swResize = false;
              $scope.neResize = true;
              $scope.nwResize = false;
              $scope.seResize = false;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x,
                $scope.originalRectArea.y + deltaY +
                  $scope.originalRectArea.height,
                $scope.originalRectArea.width + deltaX,
                $scope.originalRectArea.height + deltaY
              );
            } else {
              $scope.swResize = false;
              $scope.neResize = false;
              $scope.nwResize = false;
              $scope.seResize = true;
              $scope.flag = 0;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x,
                $scope.originalRectArea.y,
                $scope.originalRectArea.width + deltaX,
                $scope.originalRectArea.height + deltaY
              );
            }
          } else if ($scope.resizeDirection === 'sw') {
            if ($scope.originalRectArea.height + deltaY <= 0 &&
                $scope.originalRectArea.width - deltaX <= 0) {
              $scope.swResize = false;
              $scope.neResize = true;
              $scope.nwResize = false;
              $scope.seResize = false;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + $scope.originalRectArea.width,
                $scope.originalRectArea.y + deltaY +
                  $scope.originalRectArea.height,
                $scope.originalRectArea.width - deltaX,
                $scope.originalRectArea.height + deltaY
              );
            } else if ($scope.originalRectArea.width - deltaX <= 0) {
              $scope.swResize = false;
              $scope.neResize = false;
              $scope.nwResize = false;
              $scope.seResize = true;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + $scope.originalRectArea.width,
                $scope.originalRectArea.y,
                $scope.originalRectArea.width - deltaX,
                $scope.originalRectArea.height + deltaY
              );
            } else if ($scope.originalRectArea.height + deltaY <= 0) {
              $scope.swResize = false;
              $scope.neResize = false;
              $scope.nwResize = true;
              $scope.seResize = false;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + deltaX,
                $scope.originalRectArea.y + deltaY +
                  $scope.originalRectArea.height,
                $scope.originalRectArea.width - deltaX,
                $scope.originalRectArea.height + deltaY
              );
            } else {
              $scope.swResize = true;
              $scope.neResize = false;
              $scope.nwResize = false;
              $scope.seResize = false;
              $scope.flag = 1;
              resizedRegion.area = regionAreaFromCornerAndDimensions(
                $scope.originalRectArea.x + deltaX,
                $scope.originalRectArea.y,
                $scope.originalRectArea.width - deltaX,
                $scope.originalRectArea.height + deltaY
              );
            }
          } else {
            $scope.resizeDirection = '';
            $scope.userIsCurrentlyResizing = false;
          }
        };

        $scope.onSvgMouseMove = function(evt) {
          var svgElement = $($element).find(
            '.oppia-image-with-regions-editor-svg');
          $scope.mouseX = evt.pageX - svgElement.offset().left;
          $scope.mouseY = evt.pageY - svgElement.offset().top;
          if ($scope.userIsCurrentlyDrawing) {
            $scope.rectX = Math.min($scope.originalMouseX, $scope.mouseX);
            $scope.rectY = Math.min($scope.originalMouseY, $scope.mouseY);
            $scope.rectWidth = Math.abs($scope.originalMouseX - $scope.mouseX);
            $scope.rectHeight = Math.abs($scope.originalMouseY - $scope.mouseY);
          } else if ($scope.userIsCurrentlyDragging) {
            var labeledRegions = $scope.$parent.value.labeledRegions;
            var draggedRegion = labeledRegions[$scope.selectedRegion].region;
            var deltaX = $scope.mouseX - $scope.originalMouseX;
            var deltaY = $scope.mouseY - $scope.originalMouseY;
            draggedRegion.area = regionAreaFromCornerAndDimensions(
              $scope.originalRectArea.x + deltaX,
              $scope.originalRectArea.y + deltaY,
              $scope.originalRectArea.width,
              $scope.originalRectArea.height
            );
          } else if ($scope.userIsCurrentlyResizing) {
            resizeRegion();
          }
        };

        $scope.onSvgMouseDown = function(evt) {
          evt.preventDefault();
          $scope.originalMouseX = $scope.mouseX;
          $scope.originalMouseY = $scope.mouseY;
          if ($scope.regionDrawMode) {
            $scope.rectWidth = $scope.rectHeight = 0;
            $scope.userIsCurrentlyDrawing = true;
          }
        };

        $scope.onSvgMouseUp = function() {
          if ($scope.hoveredRegion === null) {
            $scope.selectedRegion = null;
          }
          $scope.userIsCurrentlyDrawing = false;
          $scope.userIsCurrentlyDragging = false;
          $scope.userIsCurrentlyResizing = false;
          $scope.flag = 0;
          $scope.hideDirectionCursor();
          if ($scope.regionDrawMode) {
            $scope.regionDrawMode = false;
            if ($scope.rectWidth !== 0 && $scope.rectHeight !== 0) {
              var labels = $scope.$parent.value.labeledRegions.map(
                function(region) {
                  return region.label;
                }
              );
              // Searches numbers starting from 1 to find a valid label
              // that doesn't overlap with currently existing labels
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
                  area: regionAreaFromCornerAndDimensions(
                    $scope.rectX,
                    $scope.rectY,
                    $scope.rectWidth,
                    $scope.rectHeight
                  )
                }
              };
              $scope.$parent.value.labeledRegions.push(newRegion);
              labelList.push(newLabel);
              $scope.selectedRegion = (
                $scope.$parent.value.labeledRegions.length - 1);
            }
          }
        };
        $scope.onMouseoverRegion = function(index) {
          if ($scope.hoveredRegion === null) {
            $scope.hoveredRegion = index;
            $scope.moveRegion = index;
          }
        };
        $scope.onMouseMoveRegion = function(index) {
          if ($scope.moveRegion !== index) {
            hideDirectionCursor();
          }
          region = reg = cornerAndDimensionsFromRegionArea(
            $scope.$parent.value.labeledRegions[
              $scope.hoveredRegion].region.area);
          if ($scope.mouseY <= region.y + $scope.resizeRegionBorder &&
                $scope.mouseX >= region.width + region.x -
                $scope.resizeRegionBorder && $scope.flag === 0 &&
                $scope.resizeDirection !== 'nw' &&
                $scope.resizeDirection !== 'se') {
            $scope.resizeDirection = 'ne';
            $scope.nResize = false;
            $scope.eResize = false;
            $scope.neResize = true;
          } else if ($scope.mouseY <= region.y + $scope.resizeRegionBorder &&
              $scope.mouseX <= region.x + $scope.resizeRegionBorder &&
              $scope.flag === 0 && $scope.resizeDirection !== 'se') {
            $scope.resizeDirection = 'nw';
            $scope.nResize = false;
            $scope.wResize = false;
            $scope.nwResize = true;
          } else if ($scope.mouseY >= region.height + region.y -
              $scope.resizeRegionBorder && $scope.mouseX >= region.width +
              region.x - $scope.resizeRegionBorder && $scope.flag === 0) {
            $scope.resizeDirection = 'se';
            $scope.sResize = false;
            $scope.eResize = false;
            $scope.seResize = true;
          } else if ($scope.mouseY >= region.height + region.y -
              $scope.resizeRegionBorder && $scope.mouseX <= region.x +
              $scope.resizeRegionBorder && $scope.flag === 0) {
            $scope.resizeDirection = 'sw';
            $scope.sResize = false;
            $scope.wResize = false;
            $scope.swResize = true;
          } else if ($scope.mouseY <= region.y + $scope.resizeRegionBorder &&
              $scope.flag === 0 && $scope.resizeDirection !== 's' &&
              $scope.resizeDirection !== 'se') {
            $scope.resizeDirection = 'n';
            $scope.nResize = true;
          } else if ($scope.mouseX <= region.x + $scope.resizeRegionBorder &&
              $scope.flag === 0 && $scope.resizeDirection !== 'e') {
            $scope.resizeDirection = 'w';
            $scope.wResize = true;
          } else if ($scope.mouseX >= region.width + region.x -
              $scope.resizeRegionBorder && $scope.flag === 0 &&
              $scope.resizeDirection !== 'se') {
            $scope.resizeDirection = 'e';
            $scope.eResize = true;
          } else if ($scope.mouseY >= region.height + region.y -
              $scope.resizeRegionBorder && $scope.flag === 0) {
            $scope.resizeDirection = 's';
            $scope.sResize = true;
          } else {
            $scope.hideDirectionCursor();
            if ($scope.flag === 0) {
              $scope.resizeDirection = '';
            }
          }
        };
        $scope.onMouseoutRegion = function(index) {
          if ($scope.hoveredRegion === index) {
            $scope.hoveredRegion = null;
          }
          $scope.hideDirectionCursor();
        };
        $scope.onMousedownRegion = function() {
          $scope.userIsCurrentlyDragging = true;
          if ($scope.resizeDirection !== '') {
            $scope.userIsCurrentlyDragging = false;
            $scope.userIsCurrentlyResizing = true;
          }
          $scope.selectedRegion = $scope.hoveredRegion;
          $scope.originalRectArea = cornerAndDimensionsFromRegionArea(
            $scope.$parent.value.labeledRegions[
              $scope.hoveredRegion].region.area
          );
        };
        $scope.onDocumentMouseUp = function() {
          if ($scope.regionDrawMode && !$scope.userIsCurrentlyDrawing) {
            $scope.regionDrawMode = false;
          }
        };
        $document.on('mouseup', $scope.onDocumentMouseUp);
        $scope.setDrawMode = function() {
          $scope.regionDrawMode = true;
        };
        $scope.getCursorStyle = function() {
          if ($scope.nResize) {
            return 'n-resize';
          } else if ($scope.eResize) {
            return 'e-resize';
          } else if ($scope.wResize) {
            return 'w-resize';
          } else if ($scope.sResize) {
            return 's-resize';
          } else if ($scope.neResize) {
            return 'ne-resize';
          } else if ($scope.seResize) {
            return 'se-resize';
          } else if ($scope.nwResize) {
            return 'nw-resize';
          } else if ($scope.swResize) {
            return 'sw-resize';
          }
          return ($scope.regionDrawMode) ? 'crosshair' : 'default';
        };

        $scope.resetEditor = function() {
          $scope.$parent.value.imagePath = '';
          $scope.$parent.value.labeledRegions = [];
        };
        $scope.deleteRegion = function(index) {
          if ($scope.selectedRegion === index) {
            $scope.selectedRegion = null;
          } else if ($scope.selectedRegion > index) {
            $scope.selectedRegion--;
          }
          if ($scope.hoveredRegion === index) {
            $scope.hoveredRegion = null;
          } else if ($scope.hoveredRegion > index) {
            $scope.hoveredRegion--;
          }
          $scope.$parent.value.labeledRegions.splice(index, 1);
          labelList.splice(index, 1);
        };
      }]
    };
  }
]);
