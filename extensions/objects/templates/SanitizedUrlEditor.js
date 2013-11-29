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


// This directive is based on the unicodeStringEditor one.
//
// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

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

      $scope.localValue = {label: String($scope.$parent.value) || ''};

      $scope.alwaysEditable = $scope.$parent.alwaysEditable;
      if ($scope.alwaysEditable) {
        $scope.$watch('localValue.label', function(newValue, oldValue) {
          if (newValue.indexOf('http://') === 0 || newValue.indexOf('https://') === 0) {
            $scope.$parent.value = encodeURI(newValue);
          }
        });
      } else {
        $scope.openEditor = function() {
          $scope.active = true;
        };
  
        $scope.closeEditor = function() {
          $scope.active = false;
        };

        $scope.replaceValue = function(newValue) {
          if (newValue.indexOf('http://') !== 0 && newValue.indexOf('https://') !== 0) {
            warningsData.addWarning(
                'Please enter a URL that starts with http:// or https://');
            return;
          }
          newValue = encodeURI(newValue);
          warningsData.clear();

          $scope.localValue = {label: newValue};
          $scope.$parent.value = newValue;
          $scope.closeEditor();
        };

        $scope.closeEditor();
      }

      $scope.$on('externalSave', function() {
        var currentValue = String($scope.localValue.label);
        if (currentValue.indexOf('http://') !== 0 && currentValue.indexOf('https://') !== 0) {
          warningsData.addWarning(
              'Please enter a URL that starts with http:// or https://. ' +
              'Your changes were not saved.');
        } else {
          if ($scope.active) {
            $scope.replaceValue(currentValue);
            // The $scope.$apply() call is needed to propagate the replaced value.
            $scope.$apply();
          }
        }
      });
    }
  };
});
