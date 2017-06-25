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
  '$compile', '$http', '$sce', 'alertsService', 'explorationContextService',
  'OBJECT_EDITOR_URL_PREFIX',
  function(
      $compile, $http, $sce, alertsService, explorationContextService,
      OBJECT_EDITOR_URL_PREFIX) {
    return {
      link: function(scope, element) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_URL_PREFIX + 'Filepath';
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: true,
      template: '<div ng-include="getTemplateUrl()"></div>',
      controller: ['$scope', function($scope) {
        $scope.MODE_EMPTY = 1;
        $scope.MODE_UPLOADED = 2;
        $scope.MODE_SAVED = 3;
        $scope.MAX_OUTPUT_IMAGE_WIDTH_PX = 490;

        // This variable holds all the data needed for the image upload flow.
        // It's always guaranteed to have the 'mode' and 'metadata' properties.
        //
        // See below a description of the metadata field for each mode.
        //
        // If mode is MODE_EMPTY, metadata is:
        //   {}
        // If mode is MODE_UPLOADED, metadata is:
        //   {
        //     uploadedFile: <a File object>,
        //     uploadedImageData: <binary data corresponding to the image>
        //   }
        // If mode is MODE_SAVED, metadata is:
        //   {
        //     savedUrl: <File name of the Oppia resource for the image>
        //   }
        $scope.clearScopeData = function() {
          $scope.data = {
            mode: $scope.MODE_EMPTY,
            metadata: {}
          };
          $scope.resizeRatio = 1;
        };
        $scope.clearScopeData();

        // Reset the component each time the value changes
        // (e.g. if this is part of an editable list).
        $scope.$watch('$parent.value', function(newValue) {
          if (newValue) {
            $scope.setSavedImageUrl(newValue, false);
          }
        });

        $scope.validate = function(data) {
          return data.mode === $scope.MODE_SAVED &&
                 data.metadata.savedUrl &&
                 data.metadata.savedUrl.length > 0;
        };

        $scope.getImageSizeHelp = function() {
          var imageWidth = $scope.data.metadata.originalWidth;
          if ($scope.resizeRatio === 1 &&
              imageWidth > $scope.MAX_OUTPUT_IMAGE_WIDTH_PX) {
            return 'This image has been automatically downsized to ensure ' +
                   'that it will fit in the card.';
          }
          return null;
        };

        $scope.getMainContainerStyles = function() {
          var width = $scope.MAX_OUTPUT_IMAGE_WIDTH_PX;
          return 'margin: 0 auto; width: ' + width + 'px';
        };

        $scope.isNoImageUploaded = function() {
          return $scope.data.mode === $scope.MODE_EMPTY;
        };

        $scope.isImageUploaded = function() {
          return $scope.data.mode === $scope.MODE_UPLOADED;
        };

        $scope.isImageSaved = function() {
          return $scope.data.mode === $scope.MODE_SAVED;
        };

        $scope.getCurrentResizePercent = function() {
          return Math.round(100 * $scope.resizeRatio);
        };

        $scope.decreaseResizePercent = function(amount) {
          // Do not allow to decrease size below 10%.
          $scope.resizeRatio = Math.max(0.1, $scope.resizeRatio - amount / 100);
        };

        $scope.increaseResizePercent = function(amount) {
          // Do not allow to increase size above 100% (only downsize allowed).
          $scope.resizeRatio = Math.min(1, $scope.resizeRatio + amount / 100);
        };

        $scope.calculateTargetImageDimensions = function() {
          var width = $scope.data.metadata.originalWidth;
          var height = $scope.data.metadata.originalHeight;
          if (width > $scope.MAX_OUTPUT_IMAGE_WIDTH_PX) {
            var aspectRatio = width / height;
            width = $scope.MAX_OUTPUT_IMAGE_WIDTH_PX;
            height = width / aspectRatio;
          }
          return {
            width: Math.round(width * $scope.resizeRatio),
            height: Math.round(height * $scope.resizeRatio)
          };
        };

        $scope.getUploadedImageStyles = function() {
          var dimensions = $scope.calculateTargetImageDimensions();
          var w = dimensions.width;
          var h = dimensions.height;
          return 'width: ' + w + 'px; height: ' + h + 'px;';
        }

        $scope.setUploadedFile = function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
              $scope.data = {
                mode: $scope.MODE_UPLOADED,
                metadata: {
                  uploadedFile: file,
                  uploadedImageData: e.target.result,
                  originalWidth: this.naturalWidth,
                  originalHeight: this.naturalHeight
                }
              };
              $scope.$apply();
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        };

        $scope.setSavedImageUrl = function(url, updateParent) {
          $scope.data = {
            mode: $scope.MODE_SAVED,
            metadata: {savedUrl: url}
          };
          if (updateParent) {
            alertsService.clearWarnings();
            $scope.$parent.value = url;
          }
        };

        $scope.getSavedImageTrustedResourceUrl = function() {
          if ($scope.data.mode === $scope.MODE_SAVED) {
            var encodedFilepath = window.encodeURIComponent(
              $scope.data.metadata.savedUrl);
            return $sce.trustAsResourceUrl(
              '/imagehandler/' + $scope.explorationId + '/' + encodedFilepath);
          }
          return null;
        };

        $scope.onFileChanged = function(file, filename) {
          $scope.setUploadedFile(file);
          $scope.$apply();
        };

        $scope.discardUploadedFile = function() {
          $scope.clearScopeData();
        };

        $scope.generateResampledImageFile = function() {
          var dataURIToBlob = function(dataURI) {
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
            return new Blob([ia], {type: mime});
          };

          // Create an Image object with the original data.
          var img = new Image();
          img.src = $scope.data.metadata.uploadedImageData;

          // Create a Canvas and draw the image on it, resampled.
          var canvas = document.createElement('canvas');
          var dimensions = $scope.calculateTargetImageDimensions();
          canvas.width = dimensions.width;
          canvas.height = dimensions.height;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

          // Return a File object obtained from the data in the canvas.
          var file = $scope.data.metadata.uploadedFile;
          var blob = dataURIToBlob(canvas.toDataURL(file.type, 1));

          if (blob instanceof Blob &&
              blob.type.match('image') &&
              blob.size > 0) {
            return blob;
          } else {
            return null;
          }
        };

        $scope.saveUploadedFile = function() {
          alertsService.clearWarnings();

          if (!$scope.data.metadata.uploadedFile) {
            alertsService.addWarning('No image file detected.');
            return;
          }

          var resampledFile = $scope.generateResampledImageFile();
          if (resampledFile === null) {
            alertsService.addWarning('Could not get resampled file.');
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
            $scope.setSavedImageUrl(data.filepath, true);
            $scope.$apply();
          }).fail(function(data) {
            // Remove the XSSI prefix.
            var transformedData = data.responseText.substring(5);
            var parsedResponse = JSON.parse(transformedData);
            alertsService.addWarning(
              parsedResponse.error || 'Error communicating with server.');
            $scope.$apply();
          });
        };

        $scope.generateImageFilename = function() {
          var format = '';
          var chunks = $scope.data.metadata.uploadedFile.name.split('.');
          if (chunks.length > 1) {
            format = '.' + chunks.pop();
          }
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
              format;
        };

        $scope.resizeRatio = 1;
        $scope.explorationId = explorationContextService.getExplorationId();
        $scope.clearScopeData();
      }]
    };
  }
]);
