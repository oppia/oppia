// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for HTML.
 */

oppia.directive('schemaBasedHtmlEditor', [
  'UrlInterpolationService', '$sce', 'AlertsService',
  'ExplorationContextService', function(UrlInterpolationService, $sce,
      AlertsService, ExplorationContextService) {
    return {
      scope: {
        localValue: '=',
        isDisabled: '&',
        labelForFocusTarget: '&',
        uiConfig: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/schema_editors/' +
        'schema_based_html_editor_directive.html'),
      restrict: 'E',
      link: function($scope, element, attrs) {
        // A mutation observer to detect changes in the RTE Editor
        var observer = new MutationObserver(function(mutations) {
          // A condition to detect if mutation involves addition of node by
          // drag and drop method.
          if (mutations[mutations.length - 1].addedNodes[0]) {
            // This condition checks if added node is image type.
            if (mutations[mutations.length - 1]
              .addedNodes[0].nodeName === 'IMG'){
              // Gets the added image node
              var addedImgNode = mutations[mutations.length - 1].addedNodes[0];
              addedImgNode.classList.add('oppia-noninteractive-image');
              addedImgNode.classList.add('block-element');

              var MODE_EMPTY = 1;
              var MODE_SAVED = 3;

              var SOURCE_SEPARATOR = 21;
              var FILEPATH_SAPERATOR = 48;

              var OUTPUT_IMAGE_FORMAT = 'png';
              var OUTPUT_IMAGE_MAX_WIDTH_PX = 490;

              $scope.data = {mode: MODE_EMPTY, metadata: {}};

              var getResampledImageData = function(
                  imageDataURI, width, height) {
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

              var getTrustedResourceUrlForImageFileName = function(
                  imageFileName) {
                var encodedFilepath = window.encodeURIComponent(imageFileName);
                return $sce.trustAsResourceUrl(
                  '/imagehandler/' + $scope.explorationId +
                  '/' + encodedFilepath);
              };

              $scope.calculateTargetImageDimensions = function() {
                var width = $scope.data.metadata.actualWidth;
                var height = $scope.data.metadata.actualHeight;
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

              $scope.setSavedImageFilename = function(filename, updateParent) {
                $scope.data = {
                  mode: MODE_SAVED,
                  metadata: {
                    savedImageFilename: filename,
                    savedImageUrl: getTrustedResourceUrlForImageFileName(
                      filename)
                  }
                };
                if (updateParent) {
                  AlertsService.clearWarnings();
                  $scope.$parent.value = filename;
                }
              };

              $scope.saveDroppedImage = function() {
                newImageFile = convertImageDataToImageFile(addedImgNode.src);

                $scope.data.metadata.uploadedFile = newImageFile;
                $scope.data.metadata.uploadedImageData = addedImgNode.src;
                $scope.data.metadata.actualWidth = addedImgNode.naturalWidth;
                $scope.data.metadata.actualHeight = addedImgNode.naturalHeight;

                var dimensions = $scope.calculateTargetImageDimensions();
                var resampledImageData = getResampledImageData(
                  $scope.data.metadata.uploadedImageData,
                  dimensions.width,
                  dimensions.height);

                var form = new FormData();
                form.append('image', newImageFile);
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
                  img.src = getTrustedResourceUrlForImageFileName(
                    data.filepath);

                  addedImgNode.src = img.src.substring(
                    SOURCE_SEPARATOR, img.src.length);

                  addedImgNode.setAttribute(
                    'exploration-id-with-value',
                    '&quot;' + $scope.explorationId + '&quot;');
                  addedImgNode.setAttribute(
                    'filepath-with-value',
                    '&quot;' + img.src.substring(
                      FILEPATH_SAPERATOR, img.src.length) + '&quot;');
                  // Triggering add image modal after the image has been
                  // uploaded.
                  addedImgNode.click();
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

              $scope.explorationId = ExplorationContextService.getExplorationId(
              );

              $scope.saveDroppedImage();
            }
          }
        });

        observer.observe(element[0], {
          childList: true,
          subtree: true
        });
      }
    };
  }]);
