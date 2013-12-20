// Copyright 2012 Google Inc. All Rights Reserved.
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


// This directive is always editable. No 'save' button needs to be clicked.

oppia.directive('filepathEditor', function($compile, $http, $rootScope, $sce, warningsData) {
  // Editable filepath directive. This can only be used in the context of an
  // exploration.
  return {
    link: function(scope, element, attrs) {
      scope.getTemplateUrl = function() {
        return OBJECT_EDITOR_TEMPLATES_URL + scope.$parent.objType;
      };
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    scope: true,
    template: '<div ng-include="getTemplateUrl()"></div>',
    controller: function ($scope, $attrs) {
      // Reset the component each time the value changes (e.g. if this is part
      // of an editable list).
      $scope.$watch('$parent.value', function(newValue, oldValue) {
        $scope.localValue = {label: newValue || ''};
        $scope.imageUploaderIsActive = false;
      });

      $scope.explorationId = $rootScope.explorationId;

      $scope.hasExplorationId = function() {
        if ($scope.explorationId === null || $scope.explorationId === undefined) {
          return false;
        }
        return true;
      };

      if (!$scope.explorationId) {
        warningsData.addWarning(
          'Error: File picker widget called without being given an exploration.');
        return;
      }

      $scope.$watch('localValue.label', function(newValue, oldValue) {
        if (newValue) {
          warningsData.clear();
          $scope.localValue = {label: newValue};
          $scope.$parent.value = newValue;
        }
      });

      $scope.getPreviewUrl = function(filepath) {
        var encodedFilepath = window.encodeURIComponent(filepath);
        return $sce.trustAsResourceUrl(
            '/imagehandler/' + $scope.explorationId + '/' + encodedFilepath);
      };

      $scope.openImageUploader = function() {
        $scope.imageUploaderIsActive = true;

        // Set the filename to match the name of the uploaded file.
        document.getElementById('newImage').onchange = function(e) {
          $scope.newImageFilename = e.target.value.split(/(\\|\/)/g).pop();
          $scope.$apply();
        };
      };

      $scope.closeImageUploader = function() {
        $scope.imageUploaderIsActive = false;
      };

      $scope.uploadNewImage = function(filename) {
        var input = angular.element(document.getElementById('newImage'));

        var file = document.getElementById('newImage').files[0];
        if (!file || !file.size) {
          warningsData.addWarning('Empty file detected.');
          return;
        }
        if (!file.type.match('image.*')) {
          warningsData.addWarning('This file is not recognized as an image.');
          return;
        }

        if (!filename) {
          warningsData.addWarning('Filename must not be empty.');
          return;
        }

        warningsData.clear();

        var form = new FormData();
        form.append('image', file);
        form.append('filename', filename);

        var request = $.ajax({
          url: '/imagehandler/' + $scope.explorationId,
          data: form,
          processData: false,
          contentType: false,
          type: 'POST',
          dataFilter: function(data, type) {
            // Remove the XSSI prefix.
            var transformedData = data.substring(5);
            return JSON.parse(transformedData);
          },
          dataType: 'text'
        }).done(function(data) {
          var inputElement = $('#newImage');
          inputElement.wrap('<form>').closest('form').get(0).reset();
          inputElement.unwrap();
          $scope.filepaths.push(data.filepath);
          $scope.closeImageUploader();
          $scope.localValue.label = data.filepath;
          $scope.$apply();
        }).fail(function(data) {
          console.log(data);
          // Remove the XSSI prefix.
          var transformedData = data.responseText.substring(5);
          var parsedResponse = JSON.parse(transformedData);
          warningsData.addWarning(
              parsedResponse.error || 'Error communicating with server.');
          $scope.$apply();
        });
      };

      $scope.filepathsLoaded = false;
      $http.get('/createhandler/resource_list/' + $scope.explorationId).success(function(data) {
        $scope.filepaths = data.filepaths;
        $scope.filepathsLoaded = true;
      });
    }
  };
});
