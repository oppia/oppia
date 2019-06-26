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
 * @fileoverview Directive for image with regions editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

// TODO(czx): Uniquify the labels of image regions
var oppia = require('AppInit.ts').module;

oppia.directive('imageWithRegionsEditor', [
  '$document', '$sce', 'AlertsService', 'AssetsBackendApiService',
  'ContextService', 'UrlInterpolationService',
  'OBJECT_EDITOR_URL_PREFIX',
  function($document, $sce, AlertsService, AssetsBackendApiService,
      ContextService, UrlInterpolationService,
      OBJECT_EDITOR_URL_PREFIX) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/image_with_regions_editor_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$element', '$uibModal',
        function($scope, $element, $uibModal) {
          var ctrl = this;
          ctrl.alwaysEditable = true;
          // Dynamically defines the CSS style for the region rectangle.
          ctrl.getRegionStyle = function(index) {
            if (index === ctrl.selectedRegion) {
              return 'fill: #00f; opacity: 0.5; stroke: #00d';
            } else {
              return 'fill: white; opacity: 0.5; stroke: #ddd';
            }
          };

          // Dynamically defines the CSS style for the region trash icon.
          ctrl.getRegionTrashStyle = function(index) {
            if (index === ctrl.selectedRegion) {
              return 'fill: #eee; opacity: 0.7';
            } else {
              return 'fill: #333; opacity: 0.7';
            }
          };

          // Dynamically defines the CSS style for the region label.
          ctrl.getRegionLabelStyle = function(index) {
            var commonStyles = 'font-size: 14px; pointer-events: none;';
            if (index === ctrl.selectedRegion) {
              return commonStyles + ' fill: #eee; visibility: hidden;';
            } else {
              return commonStyles + ' fill: #333; visibility: visible;';
            }
          };

          // Dynamically defines the CSS style for the region label text input.
          ctrl.getRegionLabelEditorStyle = function() {
            if (ctrl.selectedRegion === null) {
              return 'display: none';
            }
            var area = cornerAndDimensionsFromRegionArea(
              ctrl.value.labeledRegions[
                ctrl.selectedRegion].region.area);
            return 'left: ' + (area.x + 6) + 'px; ' +
              'top: ' + (area.y + 26) + 'px; ' +
              'width: ' + (area.width - 12) + 'px;';
          };

          ctrl.initializeEditor = function() {
            // All coordinates have origin at top-left,
            // increasing in x to the right and increasing in y down
            // Current mouse position in SVG coordinates
            ctrl.mouseX = 0;
            ctrl.mouseY = 0;
            // Original mouse click position for rectangle drawing.
            ctrl.originalMouseX = 0;
            ctrl.originalMouseY = 0;
            // Original position and dimensions for dragged rectangle.
            ctrl.originalRectArea = {
              x: 0,
              y: 0,
              width: 0,
              height: 0
            };
            // Coordinates for currently drawn rectangle (when user is dragging)
            ctrl.rectX = 0;
            ctrl.rectY = 0;
            ctrl.rectWidth = 0;
            ctrl.rectHeight = 0;
            // Is user currently drawing a new region?
            ctrl.userIsCurrentlyDrawing = false;
            // Is user currently dragging an existing region?
            ctrl.userIsCurrentlyDragging = false;
            // Is user currently resizing an existing region?
            ctrl.userIsCurrentlyResizing = false;
            // The horizontal direction along which user resize occurs.
            // 1 -> Left     -1 -> Right     0 -> No resize
            ctrl.xDirection = 0;
            // The vertical direction along which user resize occurs.
            // 1 -> Top     -1 -> Bottom     0 -> No resize
            ctrl.yDirection = 0;
            // Flags to check whether the direction changes while resizing.
            ctrl.yDirectionToggled = false;
            ctrl.xDirectionToggled = false;
            // A boolean that is set whenever the cursor moves out of the
            // rectangular region while resizing.
            ctrl.movedOutOfRegion = false;
            // The region along borders that will display the resize cursor.
            ctrl.resizableBorderWidthPx = 10;
            // Dimensions of original image.
            ctrl.originalImageWidth = 0;
            ctrl.originalImageHeight = 0;
            // Index of region currently hovered over.
            ctrl.hoveredRegion = null;
            // Index of region currently selected.
            ctrl.selectedRegion = null;
            // Message to displaye when there is an error.
            ctrl.errorText = '';
          };

          ctrl.initializeEditor();

          // Calculates the dimensions of the image, assuming that the width
          // of the image is scaled down to fit the svg element if necessary.
          var _calculateImageDimensions = function() {
            var svgElement = $($element).find(
              '.oppia-image-with-regions-editor-svg');
            var displayedImageWidth = Math.min(
              svgElement.width(), ctrl.originalImageWidth);
            var scalingRatio = displayedImageWidth / ctrl.originalImageWidth;
            // Note that scalingRatio may be NaN if ctrl.originalImageWidth is
            // zero.
            var displayedImageHeight = (
              ctrl.originalImageWidth === 0 ? 0.0 :
              ctrl.originalImageHeight * scalingRatio);
            return {
              width: displayedImageWidth,
              height: displayedImageHeight
            };
          };
          // Use these two functions to get the calculated image width and
          // height.
          ctrl.getImageWidth = function() {
            return _calculateImageDimensions().width;
          };
          ctrl.getImageHeight = function() {
            return _calculateImageDimensions().height;
          };

          ctrl.getPreviewUrl = function(imageUrl) {
            return AssetsBackendApiService.getImageUrlForPreview(
              ContextService.getExplorationId(),
              encodeURIComponent(imageUrl));
          };

          // Called when the image is changed to calculate the required
          // width and height, especially for large images.
          $scope.$watch('$ctrl.value.imagePath', function(newVal) {
            if (newVal !== '') {
              // Loads the image in hanging <img> tag so as to get the
              // width and height.
              $('<img/>').attr('src', ctrl.getPreviewUrl(newVal)).on(
                'load', function() {
                  ctrl.originalImageWidth = (
                    <HTMLCanvasElement><any> this).width;
                  ctrl.originalImageHeight = (
                    <HTMLCanvasElement><any> this).height;
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

          ctrl.regionLabelGetterSetter = function(index) {
            return function(label) {
              if (angular.isDefined(label)) {
                ctrl.value.labeledRegions[index].label = label;
                var labels = ctrl.value.labeledRegions.map(
                  function(region) {
                    return region.label;
                  }
                );
                if (hasDuplicates(labels)) {
                  ctrl.errorText = 'Warning: Label "' + label + '" already ' +
                    'exists! Please use a different label.';
                } else {
                  ctrl.errorText = '';
                }
              }
              return ctrl.value.labeledRegions[index].label;
            };
          };

          var convertCoordsToFraction = function(coords, dimensions) {
            return [coords[0] / dimensions[0], coords[1] / dimensions[1]];
          };
          // Convert to and from region area (which is stored as a fraction of
          // image width and height) and actual width and height.
          var regionAreaFromCornerAndDimensions = function(
              x, y, width, height) {
            return [
              convertCoordsToFraction(
                [x, y],
                [ctrl.getImageWidth(), ctrl.getImageHeight()]
              ),
              convertCoordsToFraction(
                [x + width, y + height],
                [ctrl.getImageWidth(), ctrl.getImageHeight()]
              )
            ];
          };
          var cornerAndDimensionsFromRegionArea = function(area) {
            return {
              x: area[0][0] * ctrl.getImageWidth(),
              y: area[0][1] * ctrl.getImageHeight(),
              width: (area[1][0] - area[0][0]) * ctrl.getImageWidth(),
              height: (area[1][1] - area[0][1]) * ctrl.getImageHeight()
            };
          };
          var resizeRegion = function() {
            var labeledRegions = ctrl.value.labeledRegions;
            var resizedRegion = labeledRegions[ctrl.selectedRegion].region;
            var deltaX = ctrl.mouseX - ctrl.originalMouseX;
            var deltaY = ctrl.mouseY - ctrl.originalMouseY;
            var x = ctrl.originalRectArea.x;
            var y = ctrl.originalRectArea.y;
            var width = ctrl.originalRectArea.width;
            var height = ctrl.originalRectArea.height;
            var newWidth = width - ctrl.xDirection * deltaX;
            var newHeight = height - ctrl.yDirection * deltaY;
            // The distance between where the mouse was first clicked to
            // initiate the resize action and the left-most x co-ordinate of
            // rectangle.
            var marginX = Math.abs(
              ctrl.originalRectArea.x - ctrl.originalMouseX);
            // The distance between where the mouse was first clicked to
            // initiate the resize action and the top-most y co-ordinate of
            // rectangle.
            var marginY = Math.abs(
              ctrl.originalRectArea.y - ctrl.originalMouseY);
            if (newHeight <= 0 && !ctrl.yDirectionToggled) {
              ctrl.yDirectionToggled = true;
            } else if (newHeight >= 0 && ctrl.yDirectionToggled) {
              ctrl.yDirectionToggled = false;
            }
            if (ctrl.yDirection === 1) {
              y += ctrl.yDirectionToggled ? (height + marginY) : deltaY;
            } else if (ctrl.yDirection === -1) {
              y += ctrl.yDirectionToggled * (deltaY + marginY);
            }
            if (newWidth <= 0 && !ctrl.xDirectionToggled) {
              ctrl.xDirectionToggled = true;
            } else if (newWidth >= 0 && ctrl.xDirectionToggled) {
              ctrl.xDirectionToggled = false;
            }
            if (ctrl.xDirection === 1) {
              x += ctrl.xDirectionToggled ? (width + marginX) : deltaX;
            } else if (ctrl.xDirection === -1) {
              x += ctrl.xDirectionToggled * (deltaX + marginX);
            }
            // Whenever the direction changes the value of newHeight and
            // newWidth computed is negative, hence the absolute value is taken.
            resizedRegion.area = regionAreaFromCornerAndDimensions(
              x, y, Math.abs(newWidth), Math.abs(newHeight));
          };

          ctrl.onSvgMouseMove = function(evt) {
            var svgElement = $($element).find(
              '.oppia-image-with-regions-editor-svg');
            ctrl.mouseX = evt.pageX - svgElement.offset().left;
            ctrl.mouseY = evt.pageY - svgElement.offset().top;
            if (ctrl.userIsCurrentlyDrawing) {
              ctrl.rectX = Math.min(ctrl.originalMouseX, ctrl.mouseX);
              ctrl.rectY = Math.min(ctrl.originalMouseY, ctrl.mouseY);
              ctrl.rectWidth = Math.abs(
                ctrl.originalMouseX - ctrl.mouseX);
              ctrl.rectHeight = Math.abs(
                ctrl.originalMouseY - ctrl.mouseY);
            } else if (ctrl.userIsCurrentlyDragging) {
              var labeledRegions = ctrl.value.labeledRegions;
              var draggedRegion = labeledRegions[ctrl.selectedRegion].region;
              var deltaX = ctrl.mouseX - ctrl.originalMouseX;
              var deltaY = ctrl.mouseY - ctrl.originalMouseY;
              var newX1 = ctrl.originalRectArea.x + deltaX;
              var newY1 = ctrl.originalRectArea.y + deltaY;
              var newX2 = newX1 + ctrl.originalRectArea.width;
              var newY2 = newY1 + ctrl.originalRectArea.height;
              if (newX1 < 0) {
                newX1 = 0;
                newX2 = ctrl.originalRectArea.width;
              }
              if (newY1 < 0) {
                newY1 = 0;
                newY2 = ctrl.originalRectArea.height;
              }
              if (newX2 > ctrl.getImageWidth()) {
                newX2 = ctrl.getImageWidth();
                newX1 = newX2 - ctrl.originalRectArea.width;
              }
              if (newY2 > ctrl.getImageHeight()) {
                newY2 = ctrl.getImageHeight();
                newY1 = newY2 - ctrl.originalRectArea.height;
              }
              draggedRegion.area = regionAreaFromCornerAndDimensions(
                newX1,
                newY1,
                ctrl.originalRectArea.width,
                ctrl.originalRectArea.height
              );
            } else if (ctrl.userIsCurrentlyResizing) {
              resizeRegion();
            }
          };
          ctrl.onSvgMouseDown = function(evt) {
            evt.preventDefault();
            ctrl.originalMouseX = ctrl.mouseX;
            ctrl.originalMouseY = ctrl.mouseY;
            if (ctrl.hoveredRegion === null) {
              ctrl.rectWidth = ctrl.rectHeight = 0;
              ctrl.userIsCurrentlyDrawing = true;
            }
          };
          ctrl.onSvgMouseUp = function() {
            if (ctrl.hoveredRegion === null) {
              ctrl.selectedRegion = null;
            }
            if (ctrl.yDirectionToggled) {
              ctrl.yDirection = (ctrl.yDirection === 1) ? -1 : 1;
            }
            if (ctrl.xDirectionToggled) {
              ctrl.xDirection = (ctrl.xDirection === 1) ? -1 : 1;
            }
            if (ctrl.movedOutOfRegion) {
              ctrl.xDirection = 0;
              ctrl.yDirection = 0;
            }
            if (ctrl.userIsCurrentlyDrawing) {
              if (ctrl.rectWidth !== 0 && ctrl.rectHeight !== 0) {
                var labels = ctrl.value.labeledRegions.map(
                  function(region) {
                    return region.label;
                  }
                );
                // Searches numbers starting from 1 to find a valid label
                // that doesn't overlap with currently existing labels.
                var newLabel = null;
                for (var i = 1; i <= labels.length + 1; i++) {
                  var candidateLabel = 'Region' + i.toString();
                  if (labels.indexOf(candidateLabel) === -1) {
                    newLabel = candidateLabel;
                    break;
                  }
                }
                var newRegion = {
                  label: newLabel,
                  region: {
                    regionType: 'Rectangle',
                    area: regionAreaFromCornerAndDimensions(
                      ctrl.rectX,
                      ctrl.rectY,
                      ctrl.rectWidth,
                      ctrl.rectHeight
                    )
                  }
                };
                ctrl.value.labeledRegions.push(newRegion);
                ctrl.selectedRegion = (
                  ctrl.value.labeledRegions.length - 1);
              }
            }
            ctrl.userIsCurrentlyDrawing = false;
            ctrl.userIsCurrentlyDragging = false;
            ctrl.userIsCurrentlyResizing = false;
            ctrl.movedOutOfRegion = false;
            ctrl.yDirectionToggled = false;
            ctrl.xDirectionToggled = false;
          };
          ctrl.onMouseoverRegion = function(index) {
            if (ctrl.hoveredRegion === null) {
              ctrl.hoveredRegion = index;
            }
            ctrl.movedOutOfRegion = false;
          };
          ctrl.onMouseMoveRegion = function() {
            if (
              ctrl.userIsCurrentlyDragging ||
              ctrl.userIsCurrentlyResizing) {
              return;
            }
            var region = cornerAndDimensionsFromRegionArea(
              ctrl.value.labeledRegions[
                ctrl.hoveredRegion].region.area);
            if (!ctrl.xDirectionToggled && !ctrl.yDirectionToggled) {
              if (ctrl.mouseY <= region.y + ctrl.resizableBorderWidthPx) {
                ctrl.yDirection = 1;
              } else if (
                ctrl.mouseY >= region.height + region.y -
                ctrl.resizableBorderWidthPx) {
                ctrl.yDirection = -1;
              } else {
                ctrl.yDirection = 0;
              }
              if (ctrl.mouseX <= region.x + ctrl.resizableBorderWidthPx) {
                ctrl.xDirection = 1;
              } else if (
                ctrl.mouseX >= region.width + region.x -
                ctrl.resizableBorderWidthPx) {
                ctrl.xDirection = -1;
              } else {
                ctrl.xDirection = 0;
              }
            }
          };
          ctrl.onMouseoutRegion = function(index) {
            if (ctrl.hoveredRegion === index) {
              ctrl.hoveredRegion = null;
            }
            if (!ctrl.userIsCurrentlyResizing) {
              ctrl.xDirection = 0;
              ctrl.yDirection = 0;
            }
            ctrl.movedOutOfRegion = true;
          };
          ctrl.onMousedownRegion = function() {
            if (ctrl.xDirection || ctrl.yDirection) {
              ctrl.userIsCurrentlyResizing = true;
            } else {
              ctrl.userIsCurrentlyDragging = true;
            }
            ctrl.selectedRegion = ctrl.hoveredRegion;
            ctrl.originalRectArea = cornerAndDimensionsFromRegionArea(
              ctrl.value.labeledRegions[
                ctrl.hoveredRegion].region.area
            );
          };
          ctrl.regionLabelEditorMouseUp = function() {
            ctrl.userIsCurrentlyDragging = false;
            ctrl.userIsCurrentlyResizing = false;
          };
          ctrl.getCursorStyle = function() {
            var xDirectionCursor = '';
            var yDirectionCursor = '';
            if (ctrl.xDirection || ctrl.yDirection) {
              // User is resizing, so we figure out the direction.
              if (
                (ctrl.xDirection === 1 && !ctrl.xDirectionToggled) ||
                  (ctrl.xDirection === -1 && ctrl.xDirectionToggled)) {
                xDirectionCursor = 'w';
              } else if (
                (ctrl.xDirection === -1 && !ctrl.xDirectionToggled) ||
                (ctrl.xDirection === 1 && ctrl.xDirectionToggled)) {
                xDirectionCursor = 'e';
              } else {
                xDirectionCursor = '';
              }
              if (
                (ctrl.yDirection === 1 && !ctrl.yDirectionToggled) ||
                (ctrl.yDirection === -1 && ctrl.yDirectionToggled)) {
                yDirectionCursor = 'n';
              } else if (
                (ctrl.yDirection === -1 && !ctrl.yDirectionToggled) ||
                (ctrl.yDirection === 1 && ctrl.yDirectionToggled)) {
                yDirectionCursor = 's';
              } else {
                yDirectionCursor = '';
              }
              return yDirectionCursor + xDirectionCursor + '-resize';
            } else if (ctrl.hoveredRegion !== null) {
              // User is not resizing but cursor is over a region.
              return 'pointer';
            }
            return 'crosshair';
          };
          ctrl.resetEditor = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getExtensionResourceUrl(
                '/objects/templates/' +
                'image_with_regions_reset_confirmation_directive.html'),
              backdrop: 'static',
              keyboard: false,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss();
                  };

                  $scope.confirmClear = function() {
                    $uibModalInstance.close();
                  };
                }]
            }).result.then(function() {
              ctrl.value.imagePath = '';
              ctrl.value.labeledRegions = [];
              ctrl.initializeEditor();
            });
          };
          ctrl.deleteRegion = function(index) {
            if (ctrl.selectedRegion === index) {
              ctrl.selectedRegion = null;
            } else if (ctrl.selectedRegion > index) {
              ctrl.selectedRegion--;
            }
            if (ctrl.hoveredRegion === index) {
              ctrl.hoveredRegion = null;
            } else if (ctrl.hoveredRegion > index) {
              ctrl.hoveredRegion--;
            }
            ctrl.value.labeledRegions.splice(index, 1);
          };
        }
      ]
    };
  }
]);
