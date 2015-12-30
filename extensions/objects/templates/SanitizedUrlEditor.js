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
    '$compile', 'OBJECT_EDITOR_URL_PREFIX', 'warningsData',
    function($compile, OBJECT_EDITOR_URL_PREFIX, warningsData) {
  // Editable URL directive.
  return {
    link: function(scope, element) {
      scope.getTemplateUrl = function() {
        return OBJECT_EDITOR_URL_PREFIX + 'SanitizedUrl';
      };
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    scope: true,
    template: '<span ng-include="getTemplateUrl()"></span>',
    controller: function($scope) {
      $scope.$watch('$parent.initArgs', function(newValue) {
        $scope.largeInput = false;
        if (newValue && newValue.largeInput) {
          $scope.largeInput = newValue.largeInput;
        }
      });

      $scope.$watch('$parent.value', function(newValue) {
        $scope.localValue = {
          label: String(newValue) || ''
        };
      }, true);

      $scope.getWarningText = function() {
        if ($scope.localValue.label.indexOf('http://') !== 0 &&
            $scope.localValue.label.indexOf('https://') !== 0) {
          return 'URLs should start with http:// or https://';
        } else {
          return '';
        }
      };

      $scope.alwaysEditable = true;

      $scope.$watch('localValue.label', function(newValue) {
        if (newValue.indexOf('http://') === 0 ||
            newValue.indexOf('https://') === 0) {
          $scope.$parent.value = encodeURI(newValue);
        }
      });

      $scope.$on('externalSave', function() {
        var currentValue = String($scope.localValue.label);
        if (currentValue.indexOf('http://') !== 0 &&
            currentValue.indexOf('https://') !== 0) {
          warningsData.addWarning(
              'Please enter a URL that starts with http:// or https://. ' +
              'Your changes to the URL were not saved.');
        } else {
          if ($scope.active) {
            $scope.replaceValue(currentValue);
            // The $scope.$apply() call is needed to propagate the replaced
            // value.
            $scope.$apply();
          }
        }
      });
    }
  };
}]);
