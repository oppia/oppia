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
        // Reset the component each time the value changes
        // (e.g. if this is part of an editable list).
        $scope.$watch('$parent.value', function(newValue) {
          if (newValue) {
            $scope.setSavedImageUrl(newValue, false);
          }
        });

        $scope.validate = function(state) {
          return state.state === 'saved' &&
                 state.savedUrl &&
                 state.savedUrl.length > 0;
        };

        $scope.isNoImageUploaded = function() {
          return !$scope.state || $scope.state.state === 'empty';
        };

        $scope.isImageUploaded = function() {
          return $scope.state && $scope.state.state === 'uploaded';
        };

        $scope.isImageSaved = function() {
          return $scope.state && $scope.state.state === 'saved';
        };

        $scope.setEmptyState = function() {
          $scope.state = {state: 'empty'};
        };

        $scope.setUploadedFile = function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
              $scope.state = {
                state: 'uploaded',
                uploadedFile: file,
                uploadedImageData: e.target.result,
                originalWidth: this.naturalWidth,
                originalHeight: this.naturalHeight
              };
              $scope.$apply();
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        };

        $scope.setSavedImageUrl = function(url, updateParent) {
          $scope.state = {state: 'saved', savedUrl: url};
          if (updateParent) {
            alertsService.clearWarnings();
            $scope.$parent.value = url;
          }
        };

        $scope.getPreviewUrl = function(filepath) {
          var encodedFilepath = window.encodeURIComponent(filepath);
          return $sce.trustAsResourceUrl(
            '/imagehandler/' + $scope.explorationId + '/' + encodedFilepath);
        };

        $scope.onFileChanged = function(file, filename) {
          if (!file || !file.size || !file.type.match('image.*')) {
            $scope.uploadWarning = 'This file is not recognized as an image.';
            $scope.setEmptyState();
            $scope.$apply();
            return;
          }

          if (!file.type.match('image.jpeg') &&
              !file.type.match('image.gif') &&
              !file.type.match('image.jpg') &&
              !file.type.match('image.png')) {
            $scope.uploadWarning = 'This image format is not supported.';
            $scope.setEmptyState();
            $scope.$apply();
            return;
          }

          if (file.size / 1048576 > 1) {
            var currentSize = parseInt(file.size / 1048576) + ' MB';
            $scope.uploadWarning = 
                'The maximum allowed file size is 1 MB' +
                ' (' + currentSize+ ' given).';
            $scope.setEmptyState();
            $scope.$apply();
            return;
          }

          $scope.uploadWarning = null;
          $scope.setUploadedFile(file);
          $scope.$apply();
        };

        $scope.discardUploadedFile = function() {
          $scope.setEmptyState();
        };

        $scope.saveUploadedFile = function() {
          alertsService.clearWarnings();

          if (!$scope.state.uploadedFile) {
            alertsService.addWarning('No image file detected.');
            return;
          }

          var form = new FormData();
          form.append('image', $scope.state.uploadedFile);
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
          var chunks = $scope.state.uploadedFile.name.split('.');
          if (chunks.length > 1) {
            format = '.' + chunks.pop();
          }
          var date = new Date();
          return 'img_' +
              date.getFullYear() +
              ('0' + (date.getMonth() + 1)).slice(-2) +
              ('0' + date.getDate()).slice(-2) +
              ('0' + date.getHours()).slice(-2) +
              ('0' + date.getMinutes()).slice(-2) +
              ('0' + date.getSeconds()).slice(-2) +
              '_' +
              Math.random().toString(36).substr(2, 10) +
              format;
        };

        $scope.explorationId = explorationContextService.getExplorationId();
        $scope.uploadWarning = null;
        $scope.setEmptyState();
      }]
    };
  }
]);
