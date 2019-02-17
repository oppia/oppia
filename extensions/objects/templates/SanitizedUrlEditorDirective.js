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

// This directive is based on the unicodeStringEditor one.

oppia.directive('sanitizedUrlEditor', [
  'UrlInterpolationService', 'OBJECT_EDITOR_URL_PREFIX',
  function(UrlInterpolationService, OBJECT_EDITOR_URL_PREFIX) {
    // Editable URL directive.
    return {
      restrict: 'E',
      scope: {
        getInitArgs: '&',
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/unicode_string_editor_directive.html'),
      controller: ['$scope', function($scope) {
        $scope.initArgs = $scope.getInitArgs();
        $scope.$watch('initArgs', function(newValue) {
          $scope.largeInput = false;
          if (newValue && newValue.largeInput) {
            $scope.largeInput = newValue.largeInput;
          }
        });

        $scope.$watch('value', function(newValue) {
          $scope.localValue = {
            label: String(newValue) || ''
          };
        }, true);

        $scope.alwaysEditable = true;

        $scope.$watch('localValue.label', function(newValue) {
          $scope.value = newValue;
        });

        $scope.$on('externalSave', function() {
          var currentValue = String($scope.localValue.label);
          if ($scope.active) {
            $scope.replaceValue(currentValue);
            // The $scope.$apply() call is needed to propagate the replaced
            // value.
            $scope.$apply();
          }
        });
      }]
    };
  }]);
