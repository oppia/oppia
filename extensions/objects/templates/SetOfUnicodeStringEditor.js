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


// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

oppia.directive('setOfUnicodeStringEditor', function($compile, warningsData) {
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
      $scope.initArgs = {'objType': 'UnicodeString'};
      $scope.$watch('$parent.initArgs', function(newValue, oldValue) {
        if (newValue) {
          $scope.initArgs = newValue;
          $scope.initArgs.objType = 'UnicodeString';
          $scope.isEditable = (
            newValue.isEditable !== undefined ? newValue.isEditable : true);
        }
      }, true);

      $scope.alwaysEditable = ($scope.$parent.alwaysEditable || '');

      // Get the text for the 'Add Item' button.
      $scope.getAddItemText = function() {
        if ($scope.initArgs && $scope.initArgs.addItemText) {
          return $scope.initArgs.addItemText;
        } else {
          return 'Add List Element';
        }
      };

      // Reset the component each time the value changes (e.g. if this is part
      // of an editable list).
      $scope.$watch('$parent.value', function(newValue, oldValue) {
        // Maintain a local copy of 'value'. This is needed because it is not
        // possible to modify 'item' directly when using "for item in value";
        // we need a 'constant key'. So we represent each item as {label: ...}
        // instead, and manipulate item.label.
        // TODO(sll): Check that $scope.$parent.value is a list.
        $scope.localValue = [];
        if (newValue) {
          for (var i = 0; i < newValue.length; i++) {
            $scope.localValue.push({'label': angular.copy(newValue[i])});
          }
        }
      }, true);

      $scope.addItem = function() {
        $scope.localValue.push({label: ''});
        if (!$scope.alwaysEditable) {
          $scope.activeItem = $scope.localValue.length - 1;
        }
      };

      $scope.deleteItem = function(index) {
        $scope.localValue.splice(index, 1);
        $scope.$parent.value.splice(index, 1);
        if (!$scope.alwaysEditable) {
          $scope.activeItem = null;
        }
      };

      if (!$scope.alwaysEditable) {
        $scope.activeItem = null;
      }

      $scope.$watch('localValue', function(newValue, oldValue) {
        if (newValue && oldValue) {
          var valuesOnly = [];
          for (var i = 0; i < newValue.length; i++) {
            valuesOnly.push(newValue[i].label);
          }
          $scope.$parent.value = valuesOnly;
        }
      }, true);
    }
  };
});
