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

        $scope.isNoImageUploaded = function() {
          return $scope.data.mode === $scope.MODE_EMPTY;
        };

        $scope.isImageUploaded = function() {
          return $scope.data.mode === $scope.MODE_UPLOADED;
        };

        $scope.isImageSaved = function() {
          return $scope.data.mode === $scope.MODE_SAVED;
        };

        $scope.setUploadedFile = function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
              $scope.data = {
                mode: $scope.MODE_UPLOADED,
                metadata: {
                  uploadedFile: file,
                  uploadedImageData: e.target.result
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
          if (!file || !file.size || !file.type.match('image.*')) {
            $scope.uploadWarning = 'This file is not recognized as an image.';
            $scope.clearScopeData();
            $scope.$apply();
            return;
          }

          if (!file.type.match('image.jpeg') &&
              !file.type.match('image.gif') &&
              !file.type.match('image.jpg') &&
              !file.type.match('image.png')) {
            $scope.uploadWarning = 'This image format is not supported.';
            $scope.clearScopeData();
            $scope.$apply();
            return;
          }

          var ONE_MB_IN_BYTES = 1048576;
          if (file.size / ONE_MB_IN_BYTES > 1) {
            var currentSize = parseInt(file.size / ONE_MB_IN_BYTES) + ' MB';
            $scope.uploadWarning = 
                'The maximum allowed file size is 1 MB' +
                ' (' + currentSize + ' given).';
            $scope.clearScopeData();
            $scope.$apply();
            return;
          }

          $scope.uploadWarning = null;
          $scope.setUploadedFile(file);
          $scope.$apply();
        };

        $scope.discardUploadedFile = function() {
          $scope.clearScopeData();
        };

        $scope.saveUploadedFile = function() {
          alertsService.clearWarnings();

          if (!$scope.data.metadata.uploadedFile) {
            alertsService.addWarning('No image file detected.');
            return;
          }

          var form = new FormData();
          form.append('image', $scope.data.metadata.uploadedFile);
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

        $scope.explorationId = explorationContextService.getExplorationId();
        $scope.uploadWarning = null;
        $scope.clearScopeData();
      }]
    };
  }
]);
