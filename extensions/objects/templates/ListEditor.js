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
    restrict: 'E',
    scope: {items: '=', largeInput: '@', addItemText: '@'},
    templateUrl: '/templates/list',
    controller: function($scope, $attrs) {
      $scope.largeInput = ($scope.largeInput || false);

      $scope.getAddItemText = function() {
        return ($scope.addItemText || 'Add List Element');
      };

      // Reset the component each time the item list changes.
      $scope.$watch('items', function(newValue, oldValue) {
        // Maintain a local copy of 'items'. This is needed because it is not
        // possible to modify 'item' directly when using "for item in items";
        // we need a 'constant key'. So we represent each item as {label: ...}
        // instead, and manipulate item.label.
        // TODO(sll): Check that $scope.items is a list.
        $scope.localItems = [];
        if ($scope.items) {
          for (var i = 0; i < $scope.items.length; i++) {
            $scope.localItems.push({'label': angular.copy($scope.items[i])});
          }
        }
        if ($scope.localItems.length === 0) {
          $scope.addItem();
        } else {
          $scope.activeItem = null;
        }
      });

      $scope.openItemEditor = function(index) {
        $scope.activeItem = index;
      };

      $scope.closeItemEditor = function() {
        $scope.activeItem = null;
      };

      $scope.addItem = function() {
        $scope.localItems.push({label: ''});
        $scope.activeItem = $scope.localItems.length - 1;
        if ($scope.items) {
          $scope.items.push('');
        } else {
          $scope.items = [''];
        }
      };

      $scope.replaceItem = function(index, newItem) {
        if (!newItem) {
          warningsData.addWarning('Please enter a non-empty item.');
          return;
        }
        $scope.index = '';
        $scope.replacementItem = '';
        if (index < $scope.items.length && index >= 0) {
          $scope.localItems[index] = {label: newItem};
          $scope.items[index] = newItem;
        }
        $scope.closeItemEditor();
      };

      $scope.deleteItem = function(index) {
        $scope.activeItem = null;
        $scope.localItems.splice(index, 1);
        $scope.items.splice(index, 1);
      };

      $scope.$on('externalSave', function() {
        if ($scope.activeItem !== null) {
          $scope.replaceItem(
              $scope.activeItem, $scope.localItems[$scope.activeItem].label);
          // The $scope.$apply() call is needed to propagate the replaced item.
          $scope.$apply();
        }
      });
    }
  };
});
