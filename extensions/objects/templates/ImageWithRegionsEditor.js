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
  '$sce', 'UrlInterpolationService', 'AlertsService', '$document',
  'ExplorationContextService', 'AssetsBackendApiService',
  'OBJECT_EDITOR_URL_PREFIX',
  function($sce, UrlInterpolationService, AlertsService, $document,
      ExplorationContextService, AssetsBackendApiService,
      OBJECT_EDITOR_URL_PREFIX) {
    return {
      restrict: 'E',
      scope: {
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/image_with_regions_editor_directive.html'),
      controller: [
        '$scope', '$element', '$uibModal',
        function($scope, $element, $uibModal) {
          $scope.alwaysEditable = true;
          // Dynamically defines the CSS style for the region rectangle.
          $scope.getRegionStyle = function(index) {
            if (index === $scope.selectedRegion) {
              return 'fill: #00f; opacity: 0.5; stroke: #00d';
            } else {
              return 'fill: white; opacity: 0.5; stroke: #ddd';
            }
          };

          // Dynamically defines the CSS style for the region trash icon.
          $scope.getRegionTrashStyle = function(index) {
            if (index === $scope.selectedRegion) {
              return 'fill: #eee; opacity: 0.7';
            } else {
              return 'fill: #333; opacity: 0.7';
            }
          };

          // Dynamically defines the CSS style for the region label.
          $scope.getRegionLabelStyle = function(index) {
            var commonStyles = 'font-size: 14px; pointer-events: none;';
            if (index === $scope.selectedRegion) {
              return commonStyles + ' fill: #eee; visibility: hidden;';
            } else {
              return commonStyles + ' fill: #333; visibility: visible;';
            }
          };

          // Dynamically defines the CSS style for the region label text input.
          $scope.getRegionLabelEditorStyle = function() {
            if ($scope.selectedRegion === null) {
              return 'display: none';
            }
            var area = cornerAndDimensionsFromRegionArea(
              $scope.value.labeledRegions[
                $scope.selectedRegion].region.area);
            return 'left: ' + (area.x + 6) + 'px; ' +
              'top: ' + (area.y + 26) + 'px; ' +
              'width: ' + (area.width - 12) + 'px;';
          };

          $scope.initializeEditor = function() {
            // All coordinates have origin at top-left,
            // increasing in x to the right and increasing in y down
            // Current mouse position in SVG coordinates
            $scope.mouseX = 0;
            $scope.mouseY = 0;
            // Original mouse click position for rectangle drawing.
            $scope.originalMouseX = 0;
            $scope.originalMouseY = 0;
            // Original position and dimensions for dragged rectangle.
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
            // Is user currently drawing a new region?
            $scope.userIsCurrentlyDrawing = false;
            // Is user currently dragging an existing region?
            $scope.userIsCurrentlyDragging = false;
            // Is user currently resizing an existing region?
            $scope.userIsCurrentlyResizing = false;
            // The horizontal direction along which user resize occurs.
            // 1 -> Left     -1 -> Right     0 -> No resize
            $scope.xDirection = 0;
            // The vertical direction along which user resize occurs.
            // 1 -> Top     -1 -> Bottom     0 -> No resize
            $scope.yDirection = 0;
            // Flags to check whether the direction changes while resizing.
            $scope.yDirectionToggled = false;
            $scope.xDirectionToggled = false;
            // A boolean that is set whenever the cursor moves out of the
            // rectangular region while resizing.
            $scope.movedOutOfRegion = false;
            // The region along borders that will display the resize cursor.
            $scope.resizableBorderWidthPx = 10;
            // Dimensions of original image.
            $scope.originalImageWidth = 0;
            $scope.originalImageHeight = 0;
            // Index of region currently hovered over.
            $scope.hoveredRegion = null;
            // Index of region currently selected.
            $scope.selectedRegion = null;
            // Message to displaye when there is an error.
            $scope.errorText = '';
          };

          $scope.initializeEditor();

          // Calculates the dimensions of the image, assuming that the width
          // of the image is scaled down to fit the svg element if necessary.
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
          // Use these two functions to get the calculated image width and
          // height.
          $scope.getImageWidth = function() {
            return _calculateImageDimensions().width;
          };
          $scope.getImageHeight = function() {
            return _calculateImageDimensions().height;
          };

          $scope.getPreviewUrl = function(imageUrl) {
            var objectUrl = '';
            AssetsBackendApiService.loadImage(
              ExplorationContextService.getExplorationId(),
              encodeURIComponent(imageUrl))
              .then(function(loadedImageFile) {
                objectUrl = URL.createObjectURL(loadedImageFile.data);
              });
            return objectUrl;
          };

          // Called when the image is changed to calculate the required
          // width and height, especially for large images.
          $scope.$watch('value.imagePath', function(newVal) {
            if (newVal !== '') {
              // Loads the image in hanging <img> tag so as to get the
              // width and height.
              $('<img/>').attr('src', $scope.getPreviewUrl(newVal.name)).on(
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

          $scope.regionLabelGetterSetter = function(index) {
            return function(label) {
              if (angular.isDefined(label)) {
                $scope.value.labeledRegions[index].label = label;
                var labels = $scope.value.labeledRegions.map(
                  function(region) {
                    return region.label;
                  }
                );
                if (hasDuplicates(labels)) {
                  $scope.errorText = 'Warning: Label "' + label + '" already ' +
                    'exists! Please use a different label.';
                } else {
                  $scope.errorText = '';
                }
              }
              return $scope.value.labeledRegions[index].label;
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
            var labeledRegions = $scope.value.labeledRegions;
            var resizedRegion = labeledRegions[$scope.selectedRegion].region;
            var deltaX = $scope.mouseX - $scope.originalMouseX;
            var deltaY = $scope.mouseY - $scope.originalMouseY;
            var x = $scope.originalRectArea.x;
            var y = $scope.originalRectArea.y;
            var width = $scope.originalRectArea.width;
            var height = $scope.originalRectArea.height;
            var newWidth = width - $scope.xDirection * deltaX;
            var newHeight = height - $scope.yDirection * deltaY;
            // The distance between where the mouse was first clicked to
            // initiate the resize action and the left-most x co-ordinate of
            // rectangle.
            var marginX = Math.abs(
              $scope.originalRectArea.x - $scope.originalMouseX);
            // The distance between where the mouse was first clicked to
            // initiate the resize action and the top-most y co-ordinate of
            // rectangle.
            var marginY = Math.abs(
              $scope.originalRectArea.y - $scope.originalMouseY);
            if (newHeight <= 0 && !$scope.yDirectionToggled) {
              $scope.yDirectionToggled = true;
            } else if (newHeight >= 0 && $scope.yDirectionToggled) {
              $scope.yDirectionToggled = false;
            }
            if ($scope.yDirection === 1) {
              y += $scope.yDirectionToggled ? (height + marginY) : deltaY;
            } else if ($scope.yDirection === -1) {
              y += $scope.yDirectionToggled * (deltaY + marginY);
            }
            if (newWidth <= 0 && !$scope.xDirectionToggled) {
              $scope.xDirectionToggled = true;
            } else if (newWidth >= 0 && $scope.xDirectionToggled) {
              $scope.xDirectionToggled = false;
            }
            if ($scope.xDirection === 1) {
              x += $scope.xDirectionToggled ? (width + marginX) : deltaX;
            } else if ($scope.xDirection === -1) {
              x += $scope.xDirectionToggled * (deltaX + marginX);
            }
            // Whenever the direction changes the value of newHeight and
            // newWidth computed is negative, hence the absolute value is taken.
            resizedRegion.area = regionAreaFromCornerAndDimensions(
              x, y, Math.abs(newWidth), Math.abs(newHeight));
          };

          $scope.onSvgMouseMove = function(evt) {
            var svgElement = $($element).find(
              '.oppia-image-with-regions-editor-svg');
            $scope.mouseX = evt.pageX - svgElement.offset().left;
            $scope.mouseY = evt.pageY - svgElement.offset().top;
            if ($scope.userIsCurrentlyDrawing) {
              $scope.rectX = Math.min($scope.originalMouseX, $scope.mouseX);
              $scope.rectY = Math.min($scope.originalMouseY, $scope.mouseY);
              $scope.rectWidth = Math.abs(
                $scope.originalMouseX - $scope.mouseX);
              $scope.rectHeight = Math.abs(
                $scope.originalMouseY - $scope.mouseY);
            } else if ($scope.userIsCurrentlyDragging) {
              var labeledRegions = $scope.value.labeledRegions;
              var draggedRegion = labeledRegions[$scope.selectedRegion].region;
              var deltaX = $scope.mouseX - $scope.originalMouseX;
              var deltaY = $scope.mouseY - $scope.originalMouseY;
              var newX1 = $scope.originalRectArea.x + deltaX;
              var newY1 = $scope.originalRectArea.y + deltaY;
              var newX2 = newX1 + $scope.originalRectArea.width;
              var newY2 = newY1 + $scope.originalRectArea.height;
              if (newX1 < 0) {
                newX1 = 0;
                newX2 = $scope.originalRectArea.width;
              }
              if (newY1 < 0) {
                newY1 = 0;
                newY2 = $scope.originalRectArea.height;
              }
              if (newX2 > $scope.getImageWidth()) {
                newX2 = $scope.getImageWidth();
                newX1 = newX2 - $scope.originalRectArea.width;
              }
              if (newY2 > $scope.getImageHeight()) {
                newY2 = $scope.getImageHeight();
                newY1 = newY2 - $scope.originalRectArea.height;
              }
              draggedRegion.area = regionAreaFromCornerAndDimensions(
                newX1,
                newY1,
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
            if ($scope.hoveredRegion === null) {
              $scope.rectWidth = $scope.rectHeight = 0;
              $scope.userIsCurrentlyDrawing = true;
            }
          };
          $scope.onSvgMouseUp = function() {
            if ($scope.hoveredRegion === null) {
              $scope.selectedRegion = null;
            }
            if ($scope.yDirectionToggled) {
              $scope.yDirection = ($scope.yDirection === 1) ? -1 : 1;
            }
            if ($scope.xDirectionToggled) {
              $scope.xDirection = ($scope.xDirection === 1) ? -1 : 1;
            }
            if ($scope.movedOutOfRegion) {
              $scope.xDirection = 0;
              $scope.yDirection = 0;
            }
            if ($scope.userIsCurrentlyDrawing) {
              if ($scope.rectWidth !== 0 && $scope.rectHeight !== 0) {
                var labels = $scope.value.labeledRegions.map(
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
                      $scope.rectX,
                      $scope.rectY,
                      $scope.rectWidth,
                      $scope.rectHeight
                    )
                  }
                };
                $scope.value.labeledRegions.push(newRegion);
                $scope.selectedRegion = (
                  $scope.value.labeledRegions.length - 1);
              }
            }
            $scope.userIsCurrentlyDrawing = false;
            $scope.userIsCurrentlyDragging = false;
            $scope.userIsCurrentlyResizing = false;
            $scope.movedOutOfRegion = false;
            $scope.yDirectionToggled = false;
            $scope.xDirectionToggled = false;
          };
          $scope.onMouseoverRegion = function(index) {
            if ($scope.hoveredRegion === null) {
              $scope.hoveredRegion = index;
            }
            $scope.movedOutOfRegion = false;
          };
          $scope.onMouseMoveRegion = function() {
            if (
              $scope.userIsCurrentlyDragging ||
              $scope.userIsCurrentlyResizing) {
              return;
            }
            region = cornerAndDimensionsFromRegionArea(
              $scope.value.labeledRegions[
                $scope.hoveredRegion].region.area);
            if (!$scope.xDirectionToggled && !$scope.yDirectionToggled) {
              if ($scope.mouseY <= region.y + $scope.resizableBorderWidthPx) {
                $scope.yDirection = 1;
              } else if (
                $scope.mouseY >= region.height + region.y -
                $scope.resizableBorderWidthPx) {
                $scope.yDirection = -1;
              } else {
                $scope.yDirection = 0;
              }
              if ($scope.mouseX <= region.x + $scope.resizableBorderWidthPx) {
                $scope.xDirection = 1;
              } else if (
                $scope.mouseX >= region.width + region.x -
                $scope.resizableBorderWidthPx) {
                $scope.xDirection = -1;
              } else {
                $scope.xDirection = 0;
              }
            }
          };
          $scope.onMouseoutRegion = function(index) {
            if ($scope.hoveredRegion === index) {
              $scope.hoveredRegion = null;
            }
            if (!$scope.userIsCurrentlyResizing) {
              $scope.xDirection = 0;
              $scope.yDirection = 0;
            }
            $scope.movedOutOfRegion = true;
          };
          $scope.onMousedownRegion = function() {
            if ($scope.xDirection || $scope.yDirection) {
              $scope.userIsCurrentlyResizing = true;
            } else {
              $scope.userIsCurrentlyDragging = true;
            }
            $scope.selectedRegion = $scope.hoveredRegion;
            $scope.originalRectArea = cornerAndDimensionsFromRegionArea(
              $scope.value.labeledRegions[
                $scope.hoveredRegion].region.area
            );
          };
          $scope.regionLabelEditorMouseUp = function() {
            $scope.userIsCurrentlyDragging = false;
            $scope.userIsCurrentlyResizing = false;
          };
          $scope.getCursorStyle = function() {
            var xDirectionCursor = '';
            var yDirectionCursor = '';
            if ($scope.xDirection || $scope.yDirection) {
              // User is resizing, so we figure out the direction.
              if (
                ($scope.xDirection === 1 && !$scope.xDirectionToggled) ||
                  ($scope.xDirection === -1 && $scope.xDirectionToggled)) {
                xDirectionCursor = 'w';
              } else if (
                ($scope.xDirection === -1 && !$scope.xDirectionToggled) ||
                ($scope.xDirection === 1 && $scope.xDirectionToggled)) {
                xDirectionCursor = 'e';
              } else {
                xDirectionCursor = '';
              }
              if (
                ($scope.yDirection === 1 && !$scope.yDirectionToggled) ||
                ($scope.yDirection === -1 && $scope.yDirectionToggled)) {
                yDirectionCursor = 'n';
              } else if (
                ($scope.yDirection === -1 && !$scope.yDirectionToggled) ||
                ($scope.yDirection === 1 && $scope.yDirectionToggled)) {
                yDirectionCursor = 's';
              } else {
                yDirectionCursor = '';
              }
              return yDirectionCursor + xDirectionCursor + '-resize';
            } else if ($scope.hoveredRegion !== null) {
              // User is not resizing but cursor is over a region.
              return 'pointer';
            }
            return 'crosshair';
          };
          $scope.resetEditor = function() {
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
              $scope.value.imagePath = '';
              $scope.value.labeledRegions = [];
              $scope.initializeEditor();
            });
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
            $scope.value.labeledRegions.splice(index, 1);
          };
        }
      ]
    };
  }
]);
