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
      controller: function($scope) {
        // Reset the component each time the value changes (e.g. if this is part
        // of an editable list).
        $scope.$watch('$parent.value', function(newValue) {
          $scope.localValue = {
            label: newValue || ''
          };
          $scope.imageUploaderIsActive = false;
        });

        $scope.explorationId = explorationContextService.getExplorationId();

        $scope.validate = function(localValue) {
          return localValue.label && localValue.label.length > 0;
        };

        $scope.$watch('localValue.label', function(newValue) {
          if (newValue) {
            alertsService.clearWarnings();
            $scope.localValue = {
              label: newValue
            };
            $scope.$parent.value = newValue;
          }
        });

        $scope.getPreviewUrl = function(filepath) {
          var encodedFilepath = window.encodeURIComponent(filepath);
          return $sce.trustAsResourceUrl(
            '/imagehandler/' + $scope.explorationId + '/' + encodedFilepath);
        };

        $scope.resetImageUploader = function() {
          $scope.currentFile = null;
          $scope.currentFilename = null;
          $scope.imagePreview = null;
        };

        $scope.openImageUploader = function() {
          $scope.resetImageUploader();
          $scope.uploadWarning = null;
          $scope.imageUploaderIsActive = true;
        };

        $scope.closeImageUploader = function() {
          $scope.imageUploaderIsActive = false;
        };

        $scope.onFileChanged = function(file, filename) {
          if (!file || !file.size || !file.type.match('image.*')) {
            $scope.uploadWarning = 'This file is not recognized as an image.';
            $scope.resetImageUploader();
            $scope.$apply();
            return;
          }

          $scope.currentFile = file;
          $scope.currentFilename = filename;
          $scope.uploadWarning = null;

          var reader = new FileReader();
          reader.onload = function(e) {
            $scope.$apply(function() {
              $scope.imagePreview = e.target.result;
            });
          };
          reader.readAsDataURL(file);

          $scope.$apply();
        };

        $scope.saveUploadedFile = function(file, filename) {
          alertsService.clearWarnings();

          if (!file || !file.size) {
            alertsService.addWarning('Empty file detected.');
            return;
          }
          if (!file.type.match('image.*')) {
            alertsService.addWarning(
              'This file is not recognized as an image.');
            return;
          }

          if (!filename) {
            alertsService.addWarning('Filename must not be empty.');
            return;
          }

          var form = new FormData();
          form.append('image', file);
          form.append('payload', JSON.stringify({
            filename: filename
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
            var inputElement = $('#newImage');
            $scope.filepaths.push(data.filepath);
            $scope.closeImageUploader();
            $scope.localValue.label = data.filepath;
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

        $scope.filepathsLoaded = false;
        $http.get(
          '/createhandler/resource_list/' + $scope.explorationId
        ).then(function(response) {
          $scope.filepaths = response.data.filepaths;
          $scope.filepathsLoaded = true;
        });
      }
    };
  }
]);
