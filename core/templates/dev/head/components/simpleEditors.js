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

/**
 * @fileoverview Directives for reusable simple editor components.
 *
 * @author sll@google.com (Sean Lip)
 */

 // TODO(sll): Combine all of these into a single directive.

oppia.directive('list', function(warningsData) {
  // Directive that implements an editable list.
  return {
    restrict: 'E',
    scope: {items: '=', largeInput: '@'},
    templateUrl: '/templates/list',
    controller: function($scope, $attrs) {
      $scope.largeInput = ($scope.largeInput || false);

      // Reset the component each time the item list changes.
      $scope.$watch('items', function(newValue, oldValue) {
        // Maintain a local copy of 'items'. This is needed because it is not
        // possible to modify 'item' directly when using "for item in items";
        // we need a 'constant key'. So we represent each item as {label: ...}
        // instead, and manipulate item.label.
        $scope.localItems = [];
        if ($scope.items) {
          for (var i = 0; i < $scope.items.length; i++) {
            $scope.localItems.push({'label': angular.copy($scope.items[i])});
          }
        }
        $scope.activeItem = null;
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
    }
  };
});

oppia.directive('string', function (warningsData) {
  // Editable string directive.
  return {
    restrict: 'E',
    scope: {item: '='},
    templateUrl: '/templates/string',
    controller: function ($scope, $attrs) {
      // Reset the component each time the item changes.
      $scope.$watch('item', function(newValue, oldValue) {
        // Maintain a local copy of 'item'.
        $scope.localItem = {label: $scope.item || ''};
        $scope.active = false;
      });

      $scope.openItemEditor = function() {
        $scope.active = true;
      };

      $scope.closeItemEditor = function() {
        $scope.active = false;
      };

      $scope.replaceItem = function(newItem) {
        if (!newItem) {
          warningsData.addWarning('Please enter a non-empty item.');
          return;
        }
        warningsData.clear();
        $scope.localItem = {label: newItem};
        $scope.item = newItem;
        $scope.closeItemEditor();
      };
    }
  };
});

oppia.directive('real', function (warningsData) {
  // Editable real number directive.
  return {
    restrict: 'E',
    scope: {item: '='},
    templateUrl: '/templates/real',
    controller: function ($scope, $attrs) {
      // Reset the component each time the item changes.
      $scope.$watch('item', function(newValue, oldValue) {
        // Maintain a local copy of 'item'.
        $scope.localItem = {label: $scope.item || 0.0};
        $scope.active = false;
      });

      $scope.openItemEditor = function() {
        $scope.active = true;
      };

      $scope.closeItemEditor = function() {
        $scope.active = false;
      };

      $scope.replaceItem = function(newItem) {
        if (!newItem || !angular.isNumber(newItem)) {
          warningsData.addWarning('Please enter a number.');
          return;
        }
        warningsData.clear();
        $scope.localItem = {label: (newItem || 0.0)};
        $scope.item = newItem;
        $scope.closeItemEditor();
      };
    }
  };
});

oppia.directive('int', function (warningsData) {
  // Editable integer directive.
  return {
    restrict: 'E',
    scope: {item: '='},
    templateUrl: '/templates/int',
    controller: function ($scope, $attrs) {
      // Reset the component each time the item changes.
      $scope.$watch('item', function(newValue, oldValue) {
        // Maintain a local copy of 'item'.
        $scope.localItem = {label: $scope.item || 0};
        $scope.active = false;
      });

      $scope.openItemEditor = function() {
        $scope.active = true;
      };

      $scope.closeItemEditor = function() {
        $scope.active = false;
      };

      $scope.isInteger = function(value) {
        return (!isNaN(parseInt(value,10)) &&
                (parseFloat(value,10) == parseInt(value,10)));
      };

      $scope.replaceItem = function(newItem) {
        if (!newItem || !$scope.isInteger(newItem)) {
          warningsData.addWarning('Please enter an integer.');
          return;
        }
        warningsData.clear();
        $scope.localItem = {label: (newItem || 0)};
        $scope.item = newItem;
        $scope.closeItemEditor();
      };
    }
  };
});
