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


oppia.directive('sanitizedUrlEditor', function($compile, warningsData) {
  // Editable URL directive.
  return {
    link: function(scope, element, attrs) {
      scope.getTemplateUrl = function() {
        return OBJECT_EDITOR_TEMPLATES_URL + scope.$parent.objType;
      };
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    scope: true,
    template: '<span ng-include="getTemplateUrl()"></span>',
    controller: function ($scope, $attrs) {
      $scope.$watch('$parent.initArgs', function(newValue, oldValue) {
        $scope.largeInput = false;
        if ($scope.$parent.initArgs && $scope.$parent.initArgs.largeInput) {
          $scope.largeInput = $scope.$parent.initArgs.largeInput;
        }
      });

      // Reset the component each time the value changes.
      $scope.$watch('$parent.value', function(newValue, oldValue) {
        // Maintain a local copy of 'value'.
        $scope.localValue = {label: $scope.value || ''};
        $scope.active = false;
      });

      $scope.openEditor = function() {
        $scope.active = true;
      };

      $scope.closeEditor = function() {
        $scope.active = false;
      };

      $scope.replaceValue = function(newValue) {
        if (!newValue) {
          warningsData.addWarning('Please enter a non-empty value.');
          return;
        }
        if (newValue.indexOf('http://') !== 0 && newValue.indexOf('https://') !== 0) {
          warningsData.addWarning(
              'Please enter a value that starts with http:// or https://');
          return;
        }
        newValue = encodeURI(newValue);
        warningsData.clear();
        $scope.localValue = {label: newValue};
        $scope.$parent.value = newValue;
        $scope.closeEditor();
      };

      $scope.$on('externalSave', function() {
        if ($scope.active) {
          $scope.replaceValue($scope.localValue.label);
          // The $scope.$apply() call is needed to propagate the replaced value.
          $scope.$apply();
        }
      });
    }
  };
});
