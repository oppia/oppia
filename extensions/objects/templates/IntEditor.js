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


// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

oppia.directive('intEditor', function($compile, warningsData) {
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
      // Reset the component each time the value changes (e.g. if this is part
      // of an editable list).
      $scope.$watch('$parent.value', function(newValue, oldValue) {
        $scope.localValue = {label: newValue || 0};
      }, true);

      $scope.isInteger = function(value) {
        return (!isNaN(parseInt(value,10)) &&
                (parseFloat(value,10) == parseInt(value,10)));
      };

      $scope.alwaysEditable = $scope.$parent.alwaysEditable;
      if ($scope.alwaysEditable) {
        $scope.isCorrection = false;
        $scope.$watch('localValue.label', function(newValue, oldValue) {
          if (newValue === null || !$scope.isInteger(newValue)) {
            warningsData.clear();
            warningsData.addWarning('Please enter an integer.');
            $scope.isCorrection = true;
            if (angular.isNumber(newValue)) {
              $scope.localValue = {label: Math.floor(newValue)};
            } else {
              $scope.localValue = {label: (oldValue || 0)};
            }
            return;
          }
          if (!$scope.isCorrection) {
            warningsData.clear();
          } else {
            $scope.isCorrection = false;
          }
          $scope.$parent.value = newValue;
        });
      } else {
        $scope.openEditor = function() {
          $scope.active = true;
        };

        $scope.closeEditor = function() {
          $scope.active = false;
        };

        $scope.replaceValue = function(newValue) {
          if (newValue === null || !$scope.isInteger(newValue)) {
            warningsData.addWarning('Please enter an integer.');
            return;
          }
          warningsData.clear();
          $scope.localValue = {label: (newValue || 0)};
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

        $scope.closeEditor();
      }
    }
  };
});
