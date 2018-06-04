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
 * @fileoverview Directives for the object editors.
 */

// Individual object editor directives are in extensions/objects/templates.

oppia.directive('objectEditor', ['$compile', '$log', function($compile, $log) {
  return {
    scope: {
      alwaysEditable: '@',
      initArgs: '=',
      isEditable: '@',
      objType: '@',
      value: '='
    },
    link: function(scope, element) {
      // Converts a camel-cased string to a lower-case hyphen-separated string.
      var directiveName = scope.objType.replace(
        /([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      scope.getInitArgs = function() {
        return scope.initArgs;
      };
      scope.getAlwaysEditable = function() {
        return scope.alwaysEditable;
      };
      scope.getIsEditable = function() {
        return scope.isEditable;
      };
      if (directiveName) {
        element.html(
          '<' + directiveName +
          '-editor get-always-editable="getAlwaysEditable()"' +
          'get-init-args="getInitArgs()" get-is-editable="getIsEditable()"' +
          'obj-type="objType" value="value"></' +
          directiveName + '-editor>');
        $compile(element.contents())(scope);
      } else {
        $log.error('Error in objectEditor: no editor type supplied.');
      }
    },
    restrict: 'E'
  };
}]);
