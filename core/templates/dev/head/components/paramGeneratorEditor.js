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
 * @fileoverview Directives for the parameter generator editors.
 *
 * @author sll@google.com (Sean Lip)
 */

var VALUE_GENERATOR_TEMPLATES_URL = '/value_generator_templates/';
var GENERATOR_ID_TO_DIRECTIVE_MAPPING = {};

// TODO(sll): Migrate these individual directives to the
// extensions/value_generators folder so that they are near their
// corresponding templates.
GENERATOR_ID_TO_DIRECTIVE_MAPPING['Copier'] = 'copier';
oppia.directive('copier', function($compile) {
  return {
    link: function(scope, element, attrs) {
      scope.getTemplateUrl = function() {
        return VALUE_GENERATOR_TEMPLATES_URL + 'Copier';// scope.generatorId;
      };
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    scope: true,
    template: '<div ng-include="getTemplateUrl()"></div>',
    controller: function($scope, $attrs) {
      console.log('Insert controller logic here.');
      $scope.generatorId = $scope.$parent.generatorId;
      $scope.initArgs = $scope.$parent.initArgs;
      $scope.customizationArgs = $scope.$parent.customizationArgs;
      $scope.objType = $scope.$parent.objType;

      console.log($scope);
      console.log($scope.$parent);

      // Reset the component each time the item changes.
      $scope.$watch('customizationArgs.value', function(newValue, oldValue) {
        // Maintain a local copy of 'item'.
        $scope.localItem = {label: $scope.customizationArgs.value};
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
        $scope.localItem = {label: newItem};
        $scope.customizationArgs.value = newItem;
        $scope.closeItemEditor();
      };
    }
  };
});

oppia.directive('paramGeneratorEditor', function($compile, $http, warningsData) {
  return {
    link: function(scope, element, attrs) {
      var directiveName = GENERATOR_ID_TO_DIRECTIVE_MAPPING[scope.generatorId];
      element.html('<' + directiveName + '></' + directiveName + '>');
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    scope: {generatorId: '=', initArgs: '=', customizationArgs: '=', objType: '='}
  };
});
