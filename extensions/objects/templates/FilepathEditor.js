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

// This directive can only be used in the context of an exploration.

oppia.directive('filepathEditor', [
  '$compile', '$http', '$sce', 'AlertsService', 'ExplorationContextService',
  'OBJECT_EDITOR_URL_PREFIX',
  function(
      $compile, $http, $sce, AlertsService, ExplorationContextService,
      OBJECT_EDITOR_URL_PREFIX) {
    return {
      link: function(scope, element) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_URL_PREFIX + 'Filepath';
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: {
        value: '='
      },
      template: '<div ng-include="getTemplateUrl()"></div>',
      controller: ['$scope', function($scope) {
        var MODE_EMPTY = 1;
        var MODE_UPLOADED = 2;
        var MODE_SAVED = 3;

        // We only use PNG format since that is what canvas can export to in
        // all browsers.
        // TODO(sll): See if we can add support for other image formats.
        var OUTPUT_IMAGE_FORMAT = 'png';
        var OUTPUT_IMAGE_MAX_WIDTH_PX = 490;

        var CROP_BORDER_MARGIN_PX = 10;
        var CROP_AREA_MIN_WIDTH_PX = 40;
        var CROP_AREA_MIN_HEIGHT_PX = 40;

        // Categorize mouse positions with respect to the crop area.
        var MOUSE_TOP_LEFT = 1;
        var MOUSE_TOP = 2;
        var MOUSE_TOP_RIGHT = 3;
        var MOUSE_RIGHT = 4;
        var MOUSE_BOTTOM_RIGHT = 5;
        var MOUSE_BOTTOM = 6;
        var MOUSE_BOTTOM_LEFT = 7;
        var MOUSE_LEFT = 8;
        var MOUSE_INSIDE = 9;

        // Define the cursors for the crop area.
        var CROP_CURSORS = {};
        CROP_CURSORS[MOUSE_TOP_LEFT] = 'nwse-resize';
        CROP_CURSORS[MOUSE_TOP] = 'ns-resize';
        CROP_CURSORS[MOUSE_TOP_RIGHT] = 'nesw-resize';
        CROP_CURSORS[MOUSE_RIGHT] = 'ew-resize';
        CROP_CURSORS[MOUSE_BOTTOM_RIGHT] = 'nwse-resize';
        CROP_CURSORS[MOUSE_BOTTOM] = 'ns-resize';
        CROP_CURSORS[MOUSE_BOTTOM_LEFT] = 'nesw-resize';
        CROP_CURSORS[MOUSE_LEFT] = 'ew-resize';
        CROP_CURSORS[MOUSE_INSIDE] = 'move';

        /** Internal functions (not visible in the view) */

        /**
         * Resamples an image to the specified dimension.
         *
         * @param imageDataURI A DOMString containing the input image data URI.
         * @param width The desired output width.
         * @param height The desired output height.
         * @return A DOMString containing the output image data URI.
         */
        var getResampledImageData = function(imageDataURI, width, height) {
          // Create an Image object with the original data.
          var img = new Image();
          img.src = imageDataURI;

          // Create a Canvas and draw the image on it, resampled.
          var canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          return canvas.toDataURL('image/' + OUTPUT_IMAGE_FORMAT, 1);
        };

        /**
         * Crops an image to the specified rectangular region.
         *
         * @param imageDataURI A DOMString containing the input image data URI.
         * @param x The x coorinate of the top-left corner of the crop region.
         * @param y The y coorinate of the top-left corner of the crop region.
         * @param width The width of the crop region.
         * @param height The height of the crop region.
         * @return A DOMString containing the output image data URI.
         */
        var getCroppedImageData = function(imageDataURI, x, y, width, height) {
          // Put the original image in a canvas.
          var img = new Image();
          img.src = imageDataURI;
          var canvas = document.createElement('canvas');
          canvas.width = x + width;
          canvas.height = y + height;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          // Get image data for a cropped selection.
          var data = ctx.getImageData(x, y, width, height);

          // Draw on a separate canvas and return the dataURL.
          var cropCanvas = document.createElement('canvas');
          cropCanvas.width = width;
          cropCanvas.height = height;
          var cropCtx = cropCanvas.getContext('2d');
          cropCtx.putImageData(data, 0, 0);
          return cropCanvas.toDataURL('image/' + OUTPUT_IMAGE_FORMAT, 1);
        };

        var convertImageDataToImageFile = function(dataURI) {
          // Convert base64/URLEncoded data component to raw binary data
          // held in a string.
          var byteString = atob(dataURI.split(',')[1]);

          // Separate out the mime component.
          var mime = dataURI.split(',')[0].split(':')[1].split(';')[0];

          // Write the bytes of the string to a typed array.
          var ia = new Uint8Array(byteString.length);
          for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }

          var blob = new Blob([ia], {type: mime});
          if (blob.type.match('image') &&
              blob.size > 0) {
            return blob;
          } else {
            return null;
          }
        };

        var getEventCoorindatesRelativeToImageContainer = function(e) {
          // Even though the event listeners are added to the image container,
          // the events seem to be reported with 'target' set to the deepest
          // element where the event occurred. In other words, if the event
          // occurred outside of the crop area, then the (x, y) reported will be
          // the one with respect to the image container, but if the event
          // occurs inside the crop area, then the (x, y) reported will be the
          // one with respect to the crop area itself. So this function does
          // normalization on the (x, y) values so that they are always reported
          // with respect to the image container (makes calculations easier).
          var x = e.offsetX;
          var y = e.offsetY;
          var containerClass = 'filepath-editor-image-crop-container';
          var node = e.target;
          while (!node.classList.contains(containerClass)) {
            x += node.offsetLeft;
            y += node.offsetTop;
            node = node.offsetParent;
          }
          return {x: x, y: y};
        };

        var clamp = function(value, min, max) {
          return Math.min(Math.max(min, value), max);
        };

        var handleMouseMoveWhileDraggingCropArea = function(x, y) {
          var xDown = $scope.lastMouseDownEventCoordinates.x;
          var yDown = $scope.lastMouseDownEventCoordinates.y;
          var x1WhenDown = $scope.cropAreaXWhenLastDown;
          var y1WhenDown = $scope.cropAreaYWhenLastDown;

          // Calculate new position of the crop area.
          var x1 = x1WhenDown + (x - xDown);
          var y1 = y1WhenDown + (y - yDown);

          // Correct for boundaries.
          var dimensions = $scope.calculateTargetImageDimensions();
          var cropWidth = $scope.cropArea.x2 - $scope.cropArea.x1;
          var cropHeight = $scope.cropArea.y2 - $scope.cropArea.y1;
          x1 = clamp(x1, 0, dimensions.width - cropWidth);
          y1 = clamp(y1, 0, dimensions.height - cropHeight);

          // Update crop area coordinates.
          $scope.cropArea.x1 = x1;
          $scope.cropArea.y1 = y1;
          $scope.cropArea.x2 = x1 + cropWidth;
          $scope.cropArea.y2 = y1 + cropHeight;
        };

        var handleMouseMoveWhileResizingCropArea = function(x, y) {
          var dimensions = $scope.calculateTargetImageDimensions();
          var direction = $scope.cropAreaResizeDirection;

          var adjustResizeLeft = function(x) {
            // Update crop area x1 value, correcting for boundaries.
            $scope.cropArea.x1 = clamp(
              x, 0, $scope.cropArea.x2 - CROP_AREA_MIN_WIDTH_PX);
          };

          var adjustResizeRight = function(x) {
            // Update crop area x2 value, correcting for boundaries.
            $scope.cropArea.x2 = clamp(
              x,
              CROP_AREA_MIN_WIDTH_PX + $scope.cropArea.x1,
              dimensions.width);
          };

          var adjustResizeTop = function(y) {
            // Update crop area y1 value, correcting for boundaries.
            $scope.cropArea.y1 = clamp(
              y, 0, $scope.cropArea.y2 - CROP_AREA_MIN_HEIGHT_PX);
          };

          var adjustResizeBottom = function(y) {
            // Update crop area y2 value, correcting for boundaries.
            $scope.cropArea.y2 = clamp(
              y,
              CROP_AREA_MIN_HEIGHT_PX + $scope.cropArea.y1,
              dimensions.height);
          };

          switch (direction) {
            case MOUSE_TOP_LEFT:
              adjustResizeTop(y);
              adjustResizeLeft(x);
              break;
            case MOUSE_TOP:
              adjustResizeTop(y);
              break;
            case MOUSE_TOP_RIGHT:
              adjustResizeTop(y);
              adjustResizeRight(x);
              break;
            case MOUSE_RIGHT:
              adjustResizeRight(x);
              break;
            case MOUSE_BOTTOM_RIGHT:
              adjustResizeBottom(y);
              adjustResizeRight(x);
              break;
            case MOUSE_BOTTOM:
              adjustResizeBottom(y);
              break;
            case MOUSE_BOTTOM_LEFT:
              adjustResizeBottom(y);
              adjustResizeLeft(x);
              break;
            case MOUSE_LEFT:
              adjustResizeLeft(x);
              break;
          }
        };

        var updatePositionWithinCropArea = function(x, y) {
          var margin = CROP_BORDER_MARGIN_PX;
          var cx1 = $scope.cropArea.x1;
          var cy1 = $scope.cropArea.y1;
          var cx2 = $scope.cropArea.x2;
          var cy2 = $scope.cropArea.y2;

          var xOnLeftBorder = x > cx1 - margin && x < cx1 + margin;
          var xOnRightBorder = x > cx2 - margin && x < cx2 + margin;
          var yOnTopBorder = y > cy1 - margin && y < cy1 + margin;
          var yOnBottomBorder = y > cy2 - margin && y < cy2 + margin;
          var xInside = x > cx1 && x < cx2;
          var yInside = y > cy1 && y < cy2;

          // It is important to check the pointer position for corners first,
          // since the conditions overlap. In other words, the pointer can be
          // at the top border and at the top-right corner at the same time, in
          // which case we want to recognize the corner.
          if (xOnLeftBorder && yOnTopBorder) {
            // Upper left corner.
            $scope.mousePositionWithinCropArea = MOUSE_TOP_LEFT;
          } else if (xOnRightBorder && yOnTopBorder) {
            // Upper right corner.
            $scope.mousePositionWithinCropArea = MOUSE_TOP_RIGHT;
          } else if (xOnLeftBorder && yOnBottomBorder) {
            // Lower left corner.
            $scope.mousePositionWithinCropArea = MOUSE_BOTTOM_LEFT;
          } else if (xOnRightBorder && yOnBottomBorder) {
            // Lower right corner.
            $scope.mousePositionWithinCropArea = MOUSE_BOTTOM_RIGHT;
          } else if (yOnTopBorder) {
            // Top border.
            $scope.mousePositionWithinCropArea = MOUSE_TOP;
          } else if (xOnLeftBorder) {
            // Left border.
            $scope.mousePositionWithinCropArea = MOUSE_LEFT;
          } else if (xOnRightBorder) {
            // Right border.
            $scope.mousePositionWithinCropArea = MOUSE_RIGHT;
          } else if (yOnBottomBorder) {
            // Bottom border.
            $scope.mousePositionWithinCropArea = MOUSE_BOTTOM;
          } else if (xInside && yInside) {
            // Inside the crop area.
            $scope.mousePositionWithinCropArea = MOUSE_INSIDE;
          } else {
            $scope.mousePositionWithinCropArea = null;
          }
        };

        var getTrustedResourceUrlForImageFileName = function(imageFileName) {
          var encodedFilepath = window.encodeURIComponent(imageFileName);
          return $sce.trustAsResourceUrl(
            '/imagehandler/' + $scope.explorationId + '/' + encodedFilepath);
        };

        /** Scope variables and functions (visibles to the view) */

        // Reset the component each time the value changes
        // (e.g. if this is part of an editable list).
        $scope.$watch('value', function(newValue) {
          if (newValue) {
            $scope.setSavedImageFilename(newValue, false);
          }
        });

        $scope.resetFilePathEditor = function() {
          $scope.data = {
            mode: MODE_EMPTY,
            metadata: {}
          };
          $scope.imageResizeRatio = 1;
        };

        $scope.validate = function(data) {
          return data.mode === MODE_SAVED &&
                 data.metadata.savedImageFilename &&
                 data.metadata.savedImageFilename.length > 0;
        };

        $scope.isUserCropping = function() {
          var dimensions = $scope.calculateTargetImageDimensions();
          var cropWidth = $scope.cropArea.x2 - $scope.cropArea.x1;
          var cropHeight = $scope.cropArea.y2 - $scope.cropArea.y1;
          return cropWidth < dimensions.width || cropHeight < dimensions.height;
        };

        $scope.onMouseMoveOnImageArea = function(e) {
          e.preventDefault();

          var coords = getEventCoorindatesRelativeToImageContainer(e);

          if ($scope.userIsDraggingCropArea) {
            handleMouseMoveWhileDraggingCropArea(coords.x, coords.y);
          } else if ($scope.userIsResizingCropArea) {
            handleMouseMoveWhileResizingCropArea(coords.x, coords.y);
          } else {
            updatePositionWithinCropArea(coords.x, coords.y);
          }

          $scope.mouseLastKnownCoordinates = {x: coords.x, y: coords.y};
        };

        $scope.onMouseDownOnCropArea = function(e) {
          e.preventDefault();
          var coords = getEventCoorindatesRelativeToImageContainer(e);
          var position = $scope.mousePositionWithinCropArea;

          if (position === MOUSE_INSIDE) {
            $scope.lastMouseDownEventCoordinates = {x: coords.x, y: coords.y};
            $scope.cropAreaXWhenLastDown = $scope.cropArea.x1;
            $scope.cropAreaYWhenLastDown = $scope.cropArea.y1;
            $scope.userIsDraggingCropArea = true;
          } else if (position !== null) {
            $scope.lastMouseDownEventCoordinates = {x: coords.x, y: coords.y};
            $scope.userIsResizingCropArea = true;
            $scope.cropAreaResizeDirection = position;
          }
        };

        $scope.onMouseUpOnCropArea = function(e) {
          e.preventDefault();
          $scope.userIsDraggingCropArea = false;
          $scope.userIsResizingCropArea = false;
        };

        $scope.getMainContainerDynamicStyles = function() {
          var width = OUTPUT_IMAGE_MAX_WIDTH_PX;
          return 'width: ' + width + 'px';
        };

        $scope.getImageContainerDynamicStyles = function() {
          if ($scope.data.mode === MODE_EMPTY) {
            return 'border: 1px dotted #888';
          } else {
            return 'border: none';
          }
        };

        $scope.getToolbarDynamicStyles = function() {
          if ($scope.isUserCropping()) {
            return 'visibility: hidden';
          } else {
            return 'visibility: visible';
          }
        };

        $scope.getCropButtonBarDynamicStyles = function() {
          return 'left: ' + $scope.cropArea.x2 + 'px;' +
                 'top: ' + $scope.cropArea.y1 + 'px;';
        };

        $scope.getCropAreaDynamicStyles = function() {
          var styles = {};

          // Position and size.
          styles.left = $scope.cropArea.x1 + 'px';
          styles.top = $scope.cropArea.y1 + 'px';

          var cropWidth = $scope.cropArea.x2 - $scope.cropArea.x1;
          var cropHeight = $scope.cropArea.y2 - $scope.cropArea.y1;
          styles.width = cropWidth + 'px';
          styles.height = cropHeight + 'px';

          // Cursor.
          var position = $scope.mousePositionWithinCropArea;
          styles.cursor = CROP_CURSORS[position];
          if (!styles.cursor) {
            styles.cursor = 'default';
          }

          // Translucent background layer.
          if ($scope.isUserCropping()) {
            var data = 'url(' + $scope.data.metadata.uploadedImageData + ')';
            styles.background = data + ' no-repeat';

            var x = $scope.cropArea.x1 + 3; // Add crop area border.
            var y = $scope.cropArea.y1 + 3; // Add crop area border.
            styles['background-position'] = '-' + x + 'px -' + y + 'px';

            var dimensions = $scope.calculateTargetImageDimensions();
            styles['background-size'] = dimensions.width + 'px ' +
                                        dimensions.height + 'px';
          }

          return Object.keys(styles).map(
            function(key) {
              return key + ': ' + styles[key];
            }).join('; ');
        };

        $scope.getUploadedImageDynamicStyles = function() {
          var dimensions = $scope.calculateTargetImageDimensions();
          var w = dimensions.width;
          var h = dimensions.height;
          return 'width: ' + w + 'px; height: ' + h + 'px;';
        };

        $scope.confirmCropImage = function() {
          // Find coordinates of the cropped area within original image scale.
          var dimensions = $scope.calculateTargetImageDimensions();
          var r = $scope.data.metadata.originalWidth / dimensions.width;
          var x1 = $scope.cropArea.x1 * r;
          var y1 = $scope.cropArea.y1 * r;
          var width = ($scope.cropArea.x2 - $scope.cropArea.x1) * r;
          var height = ($scope.cropArea.y2 - $scope.cropArea.y1) * r;

          // Generate new image data and file.
          var newImageData = getCroppedImageData(
            $scope.data.metadata.uploadedImageData,
            x1, y1, width, height);

          var newImageFile = convertImageDataToImageFile(newImageData);

          // Update image data.
          $scope.data.metadata.uploadedFile = newImageFile;
          $scope.data.metadata.uploadedImageData = newImageData;
          $scope.data.metadata.originalWidth = width;
          $scope.data.metadata.originalHeight = height;

          // Re-calculate the dimensions of the base image and reset the
          // coordinates of the crop area to the boundaries of the image.
          var dimensions = $scope.calculateTargetImageDimensions();
          $scope.cropArea = {
            x1: 0,
            y1: 0,
            x2: dimensions.width,
            y2: dimensions.height
          };
        };

        $scope.cancelCropImage = function() {
          var dimensions = $scope.calculateTargetImageDimensions();
          $scope.cropArea.x1 = 0;
          $scope.cropArea.y1 = 0;
          $scope.cropArea.x2 = dimensions.width;
          $scope.cropArea.y2 = dimensions.height;
        };

        $scope.getImageSizeHelp = function() {
          var imageWidth = $scope.data.metadata.originalWidth;
          if ($scope.imageResizeRatio === 1 &&
              imageWidth > OUTPUT_IMAGE_MAX_WIDTH_PX) {
            return 'This image has been automatically downsized to ensure ' +
                   'that it will fit in the card.';
          }
          return null;
        };

        $scope.isNoImageUploaded = function() {
          return $scope.data.mode === MODE_EMPTY;
        };

        $scope.isImageUploaded = function() {
          return $scope.data.mode === MODE_UPLOADED;
        };

        $scope.isImageSaved = function() {
          return $scope.data.mode === MODE_SAVED;
        };

        $scope.getCurrentResizePercent = function() {
          return Math.round(100 * $scope.imageResizeRatio);
        };

        $scope.decreaseResizePercent = function(amount) {
          // Do not allow to decrease size below 10%.
          $scope.imageResizeRatio = Math.max(
            0.1, $scope.imageResizeRatio - amount / 100);
        };

        $scope.increaseResizePercent = function(amount) {
          // Do not allow to increase size above 100% (only downsize allowed).
          $scope.imageResizeRatio = Math.min(
            1, $scope.imageResizeRatio + amount / 100);
        };

        $scope.calculateTargetImageDimensions = function() {
          var width = $scope.data.metadata.originalWidth;
          var height = $scope.data.metadata.originalHeight;
          if (width > OUTPUT_IMAGE_MAX_WIDTH_PX) {
            var aspectRatio = width / height;
            width = OUTPUT_IMAGE_MAX_WIDTH_PX;
            height = width / aspectRatio;
          }
          return {
            width: Math.round(width * $scope.imageResizeRatio),
            height: Math.round(height * $scope.imageResizeRatio)
          };
        };

        $scope.setUploadedFile = function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
              $scope.data = {
                mode: MODE_UPLOADED,
                metadata: {
                  uploadedFile: file,
                  uploadedImageData: e.target.result,
                  originalWidth: this.naturalWidth,
                  originalHeight: this.naturalHeight
                }
              };
              var dimensions = $scope.calculateTargetImageDimensions();
              $scope.cropArea = {
                x1: 0,
                y1: 0,
                x2: dimensions.width,
                y2: dimensions.height
              };
              $scope.$apply();
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        };

        $scope.setSavedImageFilename = function(filename, updateParent) {
          $scope.data = {
            mode: MODE_SAVED,
            metadata: {
              savedImageFilename: filename,
              savedImageUrl: getTrustedResourceUrlForImageFileName(filename)
            }
          };
          if (updateParent) {
            AlertsService.clearWarnings();
            $scope.value = filename;
          }
        };

        $scope.onFileChanged = function(file, filename) {
          $scope.setUploadedFile(file);
          $scope.$apply();
        };

        $scope.discardUploadedFile = function() {
          $scope.resetFilePathEditor();
        };

        $scope.saveUploadedFile = function() {
          AlertsService.clearWarnings();

          if (!$scope.data.metadata.uploadedFile) {
            AlertsService.addWarning('No image file detected.');
            return;
          }

          var dimensions = $scope.calculateTargetImageDimensions();
          var resampledImageData = getResampledImageData(
            $scope.data.metadata.uploadedImageData,
            dimensions.width,
            dimensions.height);

          var resampledFile = convertImageDataToImageFile(resampledImageData);
          if (resampledFile === null) {
            AlertsService.addWarning('Could not get resampled file.');
            return;
          }

          var form = new FormData();
          form.append('image', resampledFile);
          form.append('payload', JSON.stringify({
            filename: $scope.generateImageFilename()
          }));
          form.append('csrf_token', GLOBALS.csrf_token);

          $.ajax({
            url: '/createhandler/imageupload/' + $scope.explorationId,
            data: form,
            processData: false,
            contentType: false,
            type: 'POST',
            dataFilter: function(data) {
              // Remove the XSSI prefix.
              var transformedData = data.substring(5);
              return JSON.parse(transformedData);
            },
            dataType: 'text'
          }).done(function(data) {
            // Pre-load image before marking the image as saved.
            var img = new Image();
            img.onload = function() {
              $scope.setSavedImageFilename(data.filepath, true);
              $scope.$apply();
            };
            img.src = getTrustedResourceUrlForImageFileName(data.filepath);
          }).fail(function(data) {
            // Remove the XSSI prefix.
            var transformedData = data.responseText.substring(5);
            var parsedResponse = JSON.parse(transformedData);
            AlertsService.addWarning(
              parsedResponse.error || 'Error communicating with server.');
            $scope.$apply();
          });
        };

        $scope.generateImageFilename = function() {
          var date = new Date();
          return 'img_' +
              date.getFullYear() +
              ('0' + (date.getMonth() + 1)).slice(-2) +
              ('0' + date.getDate()).slice(-2) +
              '_' +
              ('0' + date.getHours()).slice(-2) +
              ('0' + date.getMinutes()).slice(-2) +
              ('0' + date.getSeconds()).slice(-2) +
              '_' +
              Math.random().toString(36).substr(2, 10) +
              '.' + OUTPUT_IMAGE_FORMAT;
        };

        // This variable holds information about the image upload flow.
        // It's always guaranteed to have the 'mode' and 'metadata' properties.
        //
        // See below a description of each mode.
        //
        // MODE_EMPTY:
        //   The user has not uploaded an image yet.
        //   In this mode, data.metadata will be an empty object:
        //     {}
        //
        // MODE_UPLOADED:
        //   The user has uploaded an image but it is not yet saved.
        //   All the crop and resizing happens at this stage.
        //   In this mode, data.metadata will contain the following info:
        //     {
        //       uploadedFile: <a File object>,
        //       uploadedImageData: <binary data corresponding to the image>,
        //       originalWidth: <original width of the uploaded image>,
        //       originalHeight: <original height of the uploaded image>
        //     }
        //
        // MODE_SAVED:
        //   The user has saved the final image for use in Oppia.
        //   At this stage, the user can click on the trash to start over.
        //   In this mode, data.metadata will contain the following info:
        //     {
        //       savedImageFilename: <File name of the resource for the image>
        //       savedImageUrl: <Trusted resource Url for the image>
        //     }
        $scope.data = {mode: MODE_EMPTY, metadata: {}};

        // Resizing properties.
        $scope.imageResizeRatio = 1;

        // Cropping properties.
        $scope.cropArea = {x1: 0, y1: 0, x2: 0, y2: 0};
        $scope.mousePositionWithinCropArea = null;
        $scope.mouseLastKnownCoordinates = {x: 0, y: 0};
        $scope.lastMouseDownEventCoordinates = {x: 0, y: 0};
        $scope.userIsDraggingCropArea = false;
        $scope.userIsResizingCropArea = false;
        $scope.cropAreaResizeDirection = null;

        $scope.explorationId = ExplorationContextService.getExplorationId();
        $scope.resetFilePathEditor();

        window.addEventListener('mouseup', function(e) {
          e.preventDefault();
          $scope.userIsDraggingCropArea = false;
          $scope.userIsResizingCropArea = false;
        }, false);
      }]
    };
  }
]);
