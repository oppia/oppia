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


oppia.directive('listEditor', function($compile, warningsData) {
  // Directive that implements an editable list.
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
    controller: function($scope, $attrs) {
      $scope.$watch('$parent.initArgs', function(newValue, oldValue) {
        $scope.initArgs = $scope.$parent.initArgs;
      });

      $scope.activeItem = null;

      // Reset the component each time the value changes.
      $scope.$watch('$parent.value', function(newValue, oldValue) {
        // Maintain a local copy of 'value'. This is needed because it is not
        // possible to modify 'item' directly when using "for item in value";
        // we need a 'constant key'. So we represent each item as {label: ...}
        // instead, and manipulate item.label.
        // TODO(sll): Check that $scope.value is a list.
        $scope.localValue = [];
        if ($scope.value) {
          for (var i = 0; i < $scope.value.length; i++) {
            $scope.localValue.push({'label': angular.copy($scope.value[i])});
          }
        }
      });

      $scope.getAddItemText = function() {
        if ($scope.initArgs && $scope.initArgs.addItemText) {
          return $scope.initArgs.addItemText;
        } else {
          return 'Add List Element';
        }
      };

      $scope.addItem = function() {
        $scope.localValue.push({label: ''});
        $scope.activeItem = $scope.localValue.length - 1;
        $scope.$parent.value.push('');
      };

      $scope.$watch('localValue', function(newValue, oldValue) {
        if (newValue && oldValue) {
          var valuesOnly = [];
          for (var i = 0; i < newValue.length; i++) {
            valuesOnly.push(newValue[i].label);
          }
          $scope.$parent.value = valuesOnly;
        }
      }, true);

      $scope.deleteItem = function(index) {
        $scope.activeItem = null;
        $scope.localValue.splice(index, 1);
        $scope.value.splice(index, 1);
      };

      $scope.$on('externalSave', function() {
        if ($scope.activeItem !== null) {
          $scope.replaceItem(
              $scope.activeItem, $scope.localValue[$scope.activeItem].label);
          // The $scope.$apply() call is needed to propagate the replaced item.
          $scope.$apply();
        }
      });
    }
  };
});
