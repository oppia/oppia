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
 * @fileoverview Directives for the parameter generator editors.
 */

// Individual value generator directives can be found in
// extensions/value_generators/templates.

oppia.directive('valueGeneratorEditor', ['$compile', function($compile) {
  return {
    restrict: 'E',
    scope: {
      customizationArgs: '=',
      generatorId: '=',
      initArgs: '=',
      objType: '='
    },
    link: function(scope, element) {
      scope.$watch('generatorId', function() {
        var directiveName = scope.generatorId.replace(
          /([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        scope.getGeneratorId = function() {
          return scope.generatorId;
        };
        scope.getInitArgs = function() {
          return scope.initArgs;
        };
        scope.getObjType = function() {
          return scope.objType;
        };
        element.html(
          '<' + directiveName +
          ' customization-args="customizationArgs"' +
          ' get-generator-id="getGeneratorId()"' +
          ' get-init-args="getInitArgs()"' +
          ' get-obj-type="getObjType()"' +
          '></' + directiveName + '>');
        $compile(element.contents())(scope);
      });
    }
  };
}]);
