// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for dicts.
 */

oppia.directive('schemaBasedDictEditor', [
  'recursionHelper', function(recursionHelper) {
    return {
      scope: {
        localValue: '=',
        isDisabled: '&',
        // Read-only property. An object whose keys and values are the dict
        // properties and the corresponding schemas.
        propertySchemas: '&',
        allowExpressions: '&',
        labelForFocusTarget: '&'
      },
      templateUrl: 'schemaBasedEditor/dict',
      restrict: 'E',
      compile: recursionHelper.compile,
      controller: [
        '$scope', 'IdGenerationService',
        function($scope, IdGenerationService) {
          $scope.getHumanReadablePropertyDescription = function(property) {
            return property.description || '[' + property.name + ']';
          };

          $scope.fieldIds = {};
          for (var i = 0; i < $scope.propertySchemas().length; i++) {
            // Generate random IDs for each field.
            $scope.fieldIds[$scope.propertySchemas()[i].name] = (
              IdGenerationService.generateNewId());
          }
        }
      ]
    };
  }
]);
