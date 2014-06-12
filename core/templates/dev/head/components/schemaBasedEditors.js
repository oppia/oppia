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

/**
 * @fileoverview Directives for schema-based object editors.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.factory('schemaDefaultValueService', [function() {
  return {
    getDefaultValue: function(schema) {
      if (schema.type === 'bool') {
        return false;
      } else if (schema.type === 'unicode' || schema.type === 'html') {
        return '';
      } else if (schema.type === 'list') {
        return [];
      } else if (schema.type === 'dict') {
        return {};
      } else {
        console.error('Invalid schema type: ' + schema.type);
      }
    }
  };
}]);

// Prevents timeouts due to recursion in nested directives. See:
//
//   http://stackoverflow.com/questions/14430655/recursion-in-angular-directives
oppia.factory('recursionHelper', ['$compile', function($compile){
  return {
    /**
     * Manually compiles the element, fixing the recursion loop.
     * @param element
     * @param [link] A post-link function, or an object with function(s)
     *     registered via pre and post properties.
     * @returns An object containing the linking functions.
     */
    compile: function(element, link){
      // Normalize the link parameter
      if (angular.isFunction(link)) {
        link = {post: link};
      }

      // Break the recursion loop by removing the contents,
      var contents = element.contents().remove();
      var compiledContents;
      return {
        pre: (link && link.pre) ? link.pre : null,
        post: function(scope, element){
          // Compile the contents.
          if (!compiledContents) {
              compiledContents = $compile(contents);
          }
          // Re-add the compiled contents to the element.
          compiledContents(scope, function(clone) {
              element.append(clone);
          });

          // Call the post-linking function, if any.
          if (link && link.post) {
            link.post.apply(null, arguments);
          }
        }
      };
    }
  };
}]);

oppia.directive('schemaBasedEditor', ['recursionHelper', function(recursionHelper) {
  return {
    scope: {
      definition: '=',
      isEditable: '&',
      savedValue: '='
    },
    templateUrl: 'schemaBasedEditor/entryPoint',
    restrict: 'E',
    compile: recursionHelper.compile,
    controller: function($scope, $attrs) {
      $scope.$watch('savedValue', function(newValue, oldValue) {
        $scope.localValue = angular.copy($scope.savedValue);
      });

      $scope.submitValue = function(value) {
        $scope.savedValue = angular.copy($scope.localValue);
        alert($scope.savedValue);
      };
      $scope.cancelEdit = function() {
        $scope.localValue = angular.copy($scope.savedValue);
      };
    }
  };
}]);

oppia.directive('schemaBuilder', [function() {
  return {
    scope: {
      schema: '&',
      isEditable: '&',
      localValue: '='
    },
    templateUrl: 'schemaBasedEditor/master',
    restrict: 'E'
  };
}]);

oppia.directive('boolEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&'
    },
    templateUrl: 'schemaBasedEditor/bool',
    restrict: 'E'
  };
}]);

oppia.directive('unicodeEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&'
    },
    templateUrl: 'schemaBasedEditor/unicode',
    restrict: 'E'
  };
}]);

// TODO(sll): The 'Cancel' button should revert the text in the HTML box to its
// original state.
// TODO(sll): The noninteractive widgets in the RTE do not work.
// TODO(sll): This duplicates an existing object editor directive; remove
// the other one.
oppia.directive('htmlEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&'
    },
    templateUrl: 'schemaBasedEditor/html',
    restrict: 'E'
  };
}]);

// TODO(sll): This duplicates an existing object editor directive; remove
// the other one.
oppia.directive('listEditor', [
    'schemaDefaultValueService', 'recursionHelper',
    function(schemaDefaultValueService, recursionHelper) {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      // Read-only property. The schema definition for each item in the list.
      itemSchema: '&'
    },
    templateUrl: 'schemaBasedEditor/list',
    restrict: 'E',
    compile: recursionHelper.compile,
    controller: function($scope, $attrs, $sce) {
      $scope.addElement = function() {
        $scope.localValue.push(
          schemaDefaultValueService.getDefaultValue($scope.itemSchema()));
      };

      $scope.deleteElement = function(index) {
        $scope.localValue.splice(index, 1);
      };
    }
  };
}]);

// TODO(sll): This duplicates an existing object editor directive; remove
// the other one.
oppia.directive('dictEditor', ['recursionHelper', function(recursionHelper) {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      // Read-only property. An object whose keys and values are the dict
      // properties and the corresponding schemas.
      propertySchemas: '&'
    },
    templateUrl: 'schemaBasedEditor/dict',
    restrict: 'E',
    compile: recursionHelper.compile
  };
}]);
