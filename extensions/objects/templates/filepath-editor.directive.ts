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
 * @fileoverview Directive for filepath editor.
 */

// This directive can only be used in the context of an exploration.
require('components/forms/custom-forms-directives/image-uploader.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-player-page/services/image-preloader.service.ts');
require('services/alerts.service.ts');
require('services/assets-backend-api.service.ts');
require('services/context.service.ts');
require('services/csrf-token.service.ts');
require('services/image-local-storage.service.ts');
require('services/image-upload-helper.service.ts');
require('services/svg-sanitizer.service.ts');

var gifFrames = require('gif-frames');
var gifshot = require('gifshot');

angular.module('oppia').directive('filepathEditor', [
  '$sce', 'AlertsService', 'AssetsBackendApiService', 'ContextService',
  'CsrfTokenService', 'ImageLocalStorageService', 'ImagePreloaderService',
  'ImageUploadHelperService', 'SvgSanitizerService',
  'UrlInterpolationService', 'ALLOWED_IMAGE_FORMATS',
  'IMAGE_SAVE_DESTINATION_LOCAL_STORAGE',
  function(
      $sce, AlertsService, AssetsBackendApiService, ContextService,
      CsrfTokenService, ImageLocalStorageService, ImagePreloaderService,
      ImageUploadHelperService, SvgSanitizerService, UrlInterpolationService,
      ALLOWED_IMAGE_FORMATS, IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      template: require('./filepath-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$scope', function($scope) {
        var ctrl = this;
        var MODE_EMPTY = 1;
        var MODE_UPLOADED = 2;
        var MODE_SAVED = 3;

        // We only use PNG format since that is what canvas can export to in
        // all browsers.
        // TODO(sll): See if we can add support for other image formats.
        var OUTPUT_IMAGE_FORMAT = {
          png: 'png',
          gif: 'gif'
        };

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
        ctrl.imageContainerStyle = {};
        ctrl.allowedImageFormats = ALLOWED_IMAGE_FORMATS;
        const HUNDRED_KB_IN_BYTES: number = 100 * 1024;

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
          return canvas.toDataURL('image/' + OUTPUT_IMAGE_FORMAT.png, 1);
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
          return cropCanvas.toDataURL('image/' + OUTPUT_IMAGE_FORMAT.png, 1);
        };


        var getCroppedGIFDataAsync = async function(
            imageDataURI, x, y, width, height) {
          return new Promise((resolve, reject) => {
            // Put the original image in a canvas.
            var img = new Image();
            img.src = imageDataURI;
            img.addEventListener('load', () => {
              // If the image loads,
              // fulfill the promise with the cropped dataURL.
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
              resolve(cropCanvas.toDataURL('image/png'));
            }, false);
            img.addEventListener('error', () => {
              reject(new Error('Image could not be loaded.'));
            }, false);
          });
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
          return { x: x, y: y };
        };

        var clamp = function(value, min, max) {
          return Math.min(Math.max(min, value), max);
        };

        var handleMouseMoveWhileDraggingCropArea = function(x, y) {
          var xDown = ctrl.lastMouseDownEventCoordinates.x;
          var yDown = ctrl.lastMouseDownEventCoordinates.y;
          var x1WhenDown = ctrl.cropAreaXWhenLastDown;
          var y1WhenDown = ctrl.cropAreaYWhenLastDown;

          // Calculate new position of the crop area.
          var x1 = x1WhenDown + (x - xDown);
          var y1 = y1WhenDown + (y - yDown);

          // Correct for boundaries.
          var dimensions = ctrl.calculateTargetImageDimensions();
          var cropWidth = ctrl.cropArea.x2 - ctrl.cropArea.x1;
          var cropHeight = ctrl.cropArea.y2 - ctrl.cropArea.y1;
          x1 = clamp(x1, 0, dimensions.width - cropWidth);
          y1 = clamp(y1, 0, dimensions.height - cropHeight);

          // Update crop area coordinates.
          ctrl.cropArea.x1 = x1;
          ctrl.cropArea.y1 = y1;
          ctrl.cropArea.x2 = x1 + cropWidth;
          ctrl.cropArea.y2 = y1 + cropHeight;
        };

        var handleMouseMoveWhileResizingCropArea = function(x, y) {
          var dimensions = ctrl.calculateTargetImageDimensions();
          var direction = ctrl.cropAreaResizeDirection;

          var adjustResizeLeft = function(x) {
            // Update crop area x1 value, correcting for boundaries.
            ctrl.cropArea.x1 = clamp(
              x, 0, ctrl.cropArea.x2 - CROP_AREA_MIN_WIDTH_PX);
          };

          var adjustResizeRight = function(x) {
            // Update crop area x2 value, correcting for boundaries.
            ctrl.cropArea.x2 = clamp(
              x,
              CROP_AREA_MIN_WIDTH_PX + ctrl.cropArea.x1,
              dimensions.width);
          };

          var adjustResizeTop = function(y) {
            // Update crop area y1 value, correcting for boundaries.
            ctrl.cropArea.y1 = clamp(
              y, 0, ctrl.cropArea.y2 - CROP_AREA_MIN_HEIGHT_PX);
          };

          var adjustResizeBottom = function(y) {
            // Update crop area y2 value, correcting for boundaries.
            ctrl.cropArea.y2 = clamp(
              y,
              CROP_AREA_MIN_HEIGHT_PX + ctrl.cropArea.y1,
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
          var cx1 = ctrl.cropArea.x1;
          var cy1 = ctrl.cropArea.y1;
          var cx2 = ctrl.cropArea.x2;
          var cy2 = ctrl.cropArea.y2;

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
            ctrl.mousePositionWithinCropArea = MOUSE_TOP_LEFT;
          } else if (xOnRightBorder && yOnTopBorder) {
            // Upper right corner.
            ctrl.mousePositionWithinCropArea = MOUSE_TOP_RIGHT;
          } else if (xOnLeftBorder && yOnBottomBorder) {
            // Lower left corner.
            ctrl.mousePositionWithinCropArea = MOUSE_BOTTOM_LEFT;
          } else if (xOnRightBorder && yOnBottomBorder) {
            // Lower right corner.
            ctrl.mousePositionWithinCropArea = MOUSE_BOTTOM_RIGHT;
          } else if (yOnTopBorder) {
            // Top border.
            ctrl.mousePositionWithinCropArea = MOUSE_TOP;
          } else if (xOnLeftBorder) {
            // Left border.
            ctrl.mousePositionWithinCropArea = MOUSE_LEFT;
          } else if (xOnRightBorder) {
            // Right border.
            ctrl.mousePositionWithinCropArea = MOUSE_RIGHT;
          } else if (yOnBottomBorder) {
            // Bottom border.
            ctrl.mousePositionWithinCropArea = MOUSE_BOTTOM;
          } else if (xInside && yInside) {
            // Inside the crop area.
            ctrl.mousePositionWithinCropArea = MOUSE_INSIDE;
          } else {
            ctrl.mousePositionWithinCropArea = null;
          }
        };

        var getTrustedResourceUrlForImageFileName = function(imageFileName) {
          if (
            ContextService.getImageSaveDestination() ===
            IMAGE_SAVE_DESTINATION_LOCAL_STORAGE &&
            ImageLocalStorageService.isInStorage(imageFileName)) {
            var imageUrl = ImageLocalStorageService.getObjectUrlForImage(
              imageFileName);
            return $sce.trustAsResourceUrl(imageUrl);
          }
          var encodedFilepath = window.encodeURIComponent(imageFileName);
          return $sce.trustAsResourceUrl(
            AssetsBackendApiService.getImageUrlForPreview(
              ctrl.entityType, ctrl.entityId, encodedFilepath));
        };

        ctrl.resetFilePathEditor = function() {
          if (
            ctrl.data.metadata.savedImageFilename && (
              ContextService.getImageSaveDestination() ===
              IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) &&
            ImageLocalStorageService.isInStorage(
              ctrl.data.metadata.savedImageFilename)
          ) {
            ImageLocalStorageService.deleteImage(
              ctrl.data.metadata.savedImageFilename);
          }
          ctrl.data = {
            mode: MODE_EMPTY,
            metadata: {},
            crop: true
          };
          ctrl.imageResizeRatio = 1;
          ctrl.invalidTagsAndAttributes = {
            tags: [],
            attrs: []
          };
        };

        ctrl.validate = function(data) {
          return data.mode === MODE_SAVED &&
            data.metadata.savedImageFilename &&
            data.metadata.savedImageFilename.length > 0;
        };

        ctrl.isUserCropping = function() {
          var dimensions = ctrl.calculateTargetImageDimensions();
          var cropWidth = ctrl.cropArea.x2 - ctrl.cropArea.x1;
          var cropHeight = ctrl.cropArea.y2 - ctrl.cropArea.y1;
          return cropWidth < dimensions.width || cropHeight < dimensions.height;
        };

        ctrl.onMouseMoveOnImageArea = function(e) {
          e.preventDefault();

          var coords = getEventCoorindatesRelativeToImageContainer(e);

          if (ctrl.userIsDraggingCropArea) {
            handleMouseMoveWhileDraggingCropArea(coords.x, coords.y);
          } else if (ctrl.userIsResizingCropArea) {
            handleMouseMoveWhileResizingCropArea(coords.x, coords.y);
          } else {
            updatePositionWithinCropArea(coords.x, coords.y);
          }

          ctrl.mouseLastKnownCoordinates = { x: coords.x, y: coords.y };
        };

        ctrl.onMouseDownOnCropArea = function(e) {
          e.preventDefault();
          var coords = getEventCoorindatesRelativeToImageContainer(e);
          var position = ctrl.mousePositionWithinCropArea;

          if (position === MOUSE_INSIDE) {
            ctrl.lastMouseDownEventCoordinates = { x: coords.x, y: coords.y };
            ctrl.cropAreaXWhenLastDown = ctrl.cropArea.x1;
            ctrl.cropAreaYWhenLastDown = ctrl.cropArea.y1;
            ctrl.userIsDraggingCropArea = true;
          } else if (position !== null) {
            ctrl.lastMouseDownEventCoordinates = { x: coords.x, y: coords.y };
            ctrl.userIsResizingCropArea = true;
            ctrl.cropAreaResizeDirection = position;
          }
        };

        ctrl.onMouseUpOnCropArea = function(e) {
          e.preventDefault();
          ctrl.userIsDraggingCropArea = false;
          ctrl.userIsResizingCropArea = false;
        };

        ctrl.getMainContainerDynamicStyles = function() {
          var width = OUTPUT_IMAGE_MAX_WIDTH_PX;
          return 'width: ' + width + 'px';
        };

        ctrl.getImageContainerDynamicStyles = function() {
          if (ctrl.data.mode === MODE_EMPTY) {
            return 'border: 1px dotted #888';
          } else {
            return 'border: none';
          }
        };

        ctrl.getToolbarDynamicStyles = function() {
          if (ctrl.isUserCropping()) {
            return 'visibility: hidden';
          } else {
            return 'visibility: visible';
          }
        };

        ctrl.getCropButtonBarDynamicStyles = function() {
          return 'left: ' + ctrl.cropArea.x2 + 'px;' +
            'top: ' + ctrl.cropArea.y1 + 'px;';
        };

        ctrl.getCropAreaDynamicStyles = function() {
          var cropWidth = ctrl.cropArea.x2 - ctrl.cropArea.x1;
          var cropHeight = ctrl.cropArea.y2 - ctrl.cropArea.y1;
          var position = ctrl.mousePositionWithinCropArea;

          // Position, size, cursor and background.
          var styles = {
            left: ctrl.cropArea.x1 + 'px',
            top: ctrl.cropArea.y1 + 'px',
            width: cropWidth + 'px',
            height: cropHeight + 'px',
            cursor: CROP_CURSORS[position],
            background: null
          };

          if (!styles.cursor) {
            styles.cursor = 'default';
          }

          // Translucent background layer.
          if (ctrl.isUserCropping()) {
            var data = 'url(' + ctrl.data.metadata.uploadedImageData + ')';
            styles.background = data + ' no-repeat';

            var x = ctrl.cropArea.x1 + 3; // Add crop area border.
            var y = ctrl.cropArea.y1 + 3; // Add crop area border.
            styles['background-position'] = '-' + x + 'px -' + y + 'px';

            var dimensions = ctrl.calculateTargetImageDimensions();
            styles['background-size'] = dimensions.width + 'px ' +
              dimensions.height + 'px';
          }

          return Object.keys(styles).map(
            function(key) {
              return key + ': ' + styles[key];
            }).join('; ');
        };

        ctrl.getUploadedImageDynamicStyles = function() {
          var dimensions = ctrl.calculateTargetImageDimensions();
          var w = dimensions.width;
          var h = dimensions.height;
          return 'width: ' + w + 'px; height: ' + h + 'px;';
        };

        ctrl.confirmCropImage = function() {
          // Find coordinates of the cropped area within original image scale.
          var dimensions = ctrl.calculateTargetImageDimensions();
          var r = ctrl.data.metadata.originalWidth / dimensions.width;
          var x1 = ctrl.cropArea.x1 * r;
          var y1 = ctrl.cropArea.y1 * r;
          var width = (ctrl.cropArea.x2 - ctrl.cropArea.x1) * r;
          var height = (ctrl.cropArea.y2 - ctrl.cropArea.y1) * r;

          const imageDataURI = ctrl.data.metadata.uploadedImageData;
          const mimeType = imageDataURI.split(';')[0];

          let newImageFile;

          if (mimeType === 'data:image/gif') {
            // Looping through individual gif frames can take a while
            // especially if there are a lot. Changing the cursor will let the
            // user know that something is happening.
            document.body.style.cursor = 'wait';
            gifFrames({
              url: imageDataURI,
              frames: 'all',
              outputType: 'canvas',
            }).then(async function(frameData) {
              let frames = [];
              for (let i = 0; i < frameData.length; i += 1) {
                let canvas = frameData[i].getImage();
                frames.push(
                  await getCroppedGIFDataAsync(
                    canvas.toDataURL('image/png'), x1, y1, width, height
                  ));
              }
              gifshot.createGIF({
                gifWidth: width,
                gifHeight: height,
                images: frames
              }, function(obj) {
                newImageFile = (
                  ImageUploadHelperService.convertImageDataToImageFile(
                    obj.image));
                ctrl.updateDimensions(newImageFile, obj.image, width, height);
                document.body.style.cursor = 'default';
              });
            });
          } else if (mimeType === 'data:image/svg+xml') {
            var imageData = ctrl.data.metadata.uploadedImageData;
            newImageFile = (
              ImageUploadHelperService.convertImageDataToImageFile(
                ctrl.data.metadata.uploadedImageData));
            ctrl.updateDimensions(newImageFile, imageData, width, height);
          } else {
            // Generate new image data and file.
            var newImageData = getCroppedImageData(
              ctrl.data.metadata.uploadedImageData,
              x1, y1, width, height);
            validateProcessedFilesize(newImageData);

            newImageFile = (
              ImageUploadHelperService.convertImageDataToImageFile(
                newImageData));
            ctrl.updateDimensions(newImageFile, newImageData, width, height);
          }
        };


        ctrl.updateDimensions = function(
            newImageFile, newImageData, width, height) {
          // Update image data.
          ctrl.data.metadata.uploadedFile = newImageFile;
          ctrl.data.metadata.uploadedImageData = newImageData;
          ctrl.data.metadata.originalWidth = width;
          ctrl.data.metadata.originalHeight = height;

          // Re-calculate the dimensions of the base image and reset the
          // coordinates of the crop area to the boundaries of the image.
          var dimensions = ctrl.calculateTargetImageDimensions();
          ctrl.cropArea = {
            x1: 0,
            y1: 0,
            x2: dimensions.width,
            y2: dimensions.height
          };
        };
        ctrl.cancelCropImage = function() {
          var dimensions = ctrl.calculateTargetImageDimensions();
          ctrl.cropArea.x1 = 0;
          ctrl.cropArea.y1 = 0;
          ctrl.cropArea.x2 = dimensions.width;
          ctrl.cropArea.y2 = dimensions.height;
        };

        ctrl.getImageSizeHelp = function() {
          var imageWidth = ctrl.data.metadata.originalWidth;
          if (ctrl.imageResizeRatio === 1 &&
            imageWidth > OUTPUT_IMAGE_MAX_WIDTH_PX) {
            return 'This image has been automatically downsized to ensure ' +
              'that it will fit in the card.';
          }
          return null;
        };

        ctrl.isCropAllowed = function() {
          return ctrl.data.crop;
        };

        ctrl.isNoImageUploaded = function() {
          return ctrl.data.mode === MODE_EMPTY;
        };

        ctrl.isImageUploaded = function() {
          return ctrl.data.mode === MODE_UPLOADED;
        };

        ctrl.isImageSaved = function() {
          return ctrl.data.mode === MODE_SAVED;
        };

        ctrl.getCurrentResizePercent = function() {
          return Math.round(100 * ctrl.imageResizeRatio);
        };

        ctrl.decreaseResizePercent = function(amount) {
          // Do not allow to decrease size below 10%.
          ctrl.imageResizeRatio = Math.max(
            0.1, ctrl.imageResizeRatio - amount / 100);
          const dimensions = ctrl.calculateTargetImageDimensions();
          const imageDataURI = ctrl.data.metadata.uploadedImageData;
          const resampledImageData = getResampledImageData(
            imageDataURI, dimensions.width, dimensions.height);
          validateProcessedFilesize(resampledImageData);
        };

        ctrl.increaseResizePercent = function(amount) {
          // Do not allow to increase size above 100% (only downsize allowed).
          ctrl.imageResizeRatio = Math.min(
            1, ctrl.imageResizeRatio + amount / 100);
          const dimensions = ctrl.calculateTargetImageDimensions();
          const imageDataURI = ctrl.data.metadata.uploadedImageData;
          const resampledImageData = getResampledImageData(
            imageDataURI, dimensions.width, dimensions.height);
          validateProcessedFilesize(resampledImageData);
        };

        ctrl.calculateTargetImageDimensions = function() {
          var width = ctrl.data.metadata.originalWidth;
          var height = ctrl.data.metadata.originalHeight;
          if (width > OUTPUT_IMAGE_MAX_WIDTH_PX) {
            var aspectRatio = width / height;
            width = OUTPUT_IMAGE_MAX_WIDTH_PX;
            height = width / aspectRatio;
          }
          return {
            width: Math.round(width * ctrl.imageResizeRatio),
            height: Math.round(height * ctrl.imageResizeRatio)
          };
        };

        const setUploadedFile = function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
              ctrl.data = {
                mode: MODE_UPLOADED,
                metadata: {
                  uploadedFile: file,
                  uploadedImageData: (<FileReader>e.target).result,
                  originalWidth: img.naturalWidth || 300,
                  originalHeight: img.naturalHeight || 150
                },
                crop: file.type !== 'image/svg+xml'
              };
              var dimensions = ctrl.calculateTargetImageDimensions();
              ctrl.cropArea = {
                x1: 0,
                y1: 0,
                x2: dimensions.width,
                y2: dimensions.height
              };
              const imageDataURI = ctrl.data.metadata.uploadedImageData;
              const resampledImageData = getResampledImageData(
                imageDataURI, dimensions.width, dimensions.height);
              validateProcessedFilesize(resampledImageData);
              $scope.$apply();
            };
            img.src = <string>((<FileReader>e.target).result);
          };
          reader.readAsDataURL(file);
        };

        ctrl.setSavedImageFilename = function(filename, updateParent) {
          ctrl.data = {
            mode: MODE_SAVED,
            metadata: {
              savedImageFilename: filename,
              savedImageUrl: getTrustedResourceUrlForImageFileName(filename)
            },
            crop: true
          };
          if (updateParent) {
            AlertsService.clearWarnings();
            ctrl.value = filename;
          }
        };

        ctrl.onFileChanged = function(file, filename) {
          setUploadedFile(file);
          $scope.$apply();
        };

        ctrl.discardUploadedFile = function() {
          ctrl.resetFilePathEditor();
        };

        const validateProcessedFilesize = function(resampledImageData) {
          const imageSize = atob(
            resampledImageData.replace('data:image/png;base64,', '')).length;
          // The processed image can sometimes be larger than 100 KB. This is
          // because the output of HTMLCanvasElement.toDataURL() operation in
          // getResampledImageData() is browser specific and can vary in size.
          // See https://stackoverflow.com/a/9777037.
          ctrl.processedImageIsTooLarge = imageSize > HUNDRED_KB_IN_BYTES;
        };

        ctrl.saveUploadedFile = function() {
          AlertsService.clearWarnings();
          ctrl.processedImageIsTooLarge = false;

          if (!ctrl.data.metadata.uploadedFile) {
            AlertsService.addWarning('No image file detected.');
            return;
          }

          var dimensions = ctrl.calculateTargetImageDimensions();


          // Check mime type from imageDataURI.
          const imageDataURI = ctrl.data.metadata.uploadedImageData;
          const mimeType = imageDataURI.split(';')[0];
          let resampledFile;

          if (mimeType === 'data:image/gif') {
            // Looping through individual gif frames can take a while
            // especially if there are a lot. Changing the cursor will let the
            // user know that something is happening.
            document.body.style.cursor = 'wait';
            gifFrames({
              url: imageDataURI,
              frames: 'all',
              outputType: 'canvas',
            }).then(function(frameData) {
              let frames = [];
              for (let i = 0; i < frameData.length; i += 1) {
                let canvas = frameData[i].getImage();
                frames.push(
                  canvas.toDataURL('image/png')
                );
              }
              gifshot.createGIF({
                gifWidth: dimensions.width,
                gifHeight: dimensions.height,
                images: frames
              }, function(obj) {
                if (!obj.error) {
                  resampledFile = (
                    ImageUploadHelperService.convertImageDataToImageFile(
                      obj.image));
                  if (resampledFile === null) {
                    AlertsService.addWarning('Could not get resampled file.');
                    return;
                  }
                  ctrl.saveImage(dimensions, resampledFile, 'gif');
                  document.body.style.cursor = 'default';
                }
              });
            });
          } else if (mimeType === 'data:image/svg+xml') {
            ctrl.invalidTagsAndAttributes = (
              SvgSanitizerService.getInvalidSvgTagsAndAttrsFromDataUri(
                imageDataURI));
            var tags = ctrl.invalidTagsAndAttributes.tags;
            var attrs = ctrl.invalidTagsAndAttributes.attrs;
            if (tags.length === 0 && attrs.length === 0) {
              resampledFile = (
                ImageUploadHelperService.convertImageDataToImageFile(
                  imageDataURI));
              ctrl.saveImage(dimensions, resampledFile, 'svg');
              ctrl.data.crop = false;
            }
          } else {
            const resampledImageData = getResampledImageData(
              imageDataURI, dimensions.width, dimensions.height);
            validateProcessedFilesize(resampledImageData);
            if (ctrl.processedImageIsTooLarge) {
              return;
            }
            resampledFile = (
              ImageUploadHelperService.convertImageDataToImageFile(
                resampledImageData));
            if (resampledFile === null) {
              AlertsService.addWarning('Could not get resampled file.');
              return;
            }
            ctrl.saveImage(dimensions, resampledFile, 'png');
          }
        };

        ctrl.saveImageToLocalStorage = function(
            dimensions, resampledFile, imageType) {
          var filename = ImageUploadHelperService.generateImageFilename(
            dimensions.height, dimensions.width, imageType);
          var reader = new FileReader();
          reader.onload = function() {
            var imageData = reader.result;
            ImageLocalStorageService.saveImage(filename, imageData);
            var img = new Image();
            img.onload = function() {
              ctrl.setSavedImageFilename(filename, true);
              var dimensions = (
                ImagePreloaderService.getDimensionsOfImage(filename));
              ctrl.imageContainerStyle = {
                height: dimensions.height + 'px',
                width: dimensions.width + 'px'
              };
              $scope.$apply();
            };
            img.src = getTrustedResourceUrlForImageFileName(filename);
          };
          reader.readAsDataURL(resampledFile);
        };

        ctrl.saveImage = function(
            dimensions, resampledFile, imageType) {
          if (
            ContextService.getImageSaveDestination() ===
            IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
            ctrl.saveImageToLocalStorage(dimensions, resampledFile, imageType);
          } else {
            ctrl.postImageToServer(dimensions, resampledFile, imageType);
          }
        };

        ctrl.postImageToServer = function(
            dimensions, resampledFile, imageType = 'png') {
          let form = new FormData();
          form.append('image', resampledFile);
          form.append('payload', JSON.stringify({
            filename: ImageUploadHelperService.generateImageFilename(
              dimensions.height, dimensions.width, imageType)
          }));
          var imageUploadUrlTemplate = '/createhandler/imageupload/' +
            '<entity_type>/<entity_id>';
          CsrfTokenService.getTokenAsync().then(function(token) {
            form.append('csrf_token', token);
            $.ajax({
              url: UrlInterpolationService.interpolateUrl(
                imageUploadUrlTemplate, {
                  entity_type: ctrl.entityType,
                  entity_id: ctrl.entityId
                }
              ),
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
                ctrl.setSavedImageFilename(data.filename, true);
                var dimensions = (
                  ImagePreloaderService.getDimensionsOfImage(data.filename));
                ctrl.imageContainerStyle = {
                  height: dimensions.height + 'px',
                  width: dimensions.width + 'px'
                };
                $scope.$apply();
              };
              img.src = getTrustedResourceUrlForImageFileName(data.filename);
            }).fail(function(data) {
              // Remove the XSSI prefix.
              var transformedData = data.responseText.substring(5);
              var parsedResponse = JSON.parse(transformedData);
              AlertsService.addWarning(
                parsedResponse.error || 'Error communicating with server.');
              $scope.$apply();
            });
          });
        };
        ctrl.$onInit = function() {
          /** Scope variables and functions (visibles to the view) */

          // Reset the component each time the value changes
          // (e.g. if this is part of an editable list).
          $scope.$watch('$ctrl.value', function(newValue) {
            if (newValue) {
              ctrl.setSavedImageFilename(newValue, false);
              var dimensions = (
                ImagePreloaderService.getDimensionsOfImage(newValue));
              ctrl.imageContainerStyle = {
                height: dimensions.height + 'px',
                width: dimensions.width + 'px'
              };
            }
          });
          // This variable holds information about the image upload flow.
          // It's always guaranteed to have the 'mode' and 'metadata'
          // properties.
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
          //     }.
          ctrl.data = { mode: MODE_EMPTY, metadata: {}, crop: true };

          // Resizing properties.
          ctrl.imageResizeRatio = 1;

          // Cropping properties.
          ctrl.cropArea = { x1: 0, y1: 0, x2: 0, y2: 0 };
          ctrl.mousePositionWithinCropArea = null;
          ctrl.mouseLastKnownCoordinates = { x: 0, y: 0 };
          ctrl.lastMouseDownEventCoordinates = { x: 0, y: 0 };
          ctrl.userIsDraggingCropArea = false;
          ctrl.userIsResizingCropArea = false;
          ctrl.cropAreaResizeDirection = null;
          ctrl.invalidTagsAndAttributes = {
            tags: [],
            attrs: []
          };
          ctrl.processedImageIsTooLarge = false;

          ctrl.entityId = ContextService.getEntityId();
          ctrl.entityType = ContextService.getEntityType();

          window.addEventListener('mouseup', function(e) {
            e.preventDefault();
            ctrl.userIsDraggingCropArea = false;
            ctrl.userIsResizingCropArea = false;
          }, false);
        };
      }]
    };
  }
]);
