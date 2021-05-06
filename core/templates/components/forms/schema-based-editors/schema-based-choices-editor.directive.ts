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
 * @fileoverview Directive for a schema-based editor for multiple choice.
 */

require('services/nested-directives-recursion-timeout-prevention.service.ts');

angular.module('oppia').directive('schemaBasedChoicesEditor', [
  'NestedDirectivesRecursionTimeoutPreventionService',
  function(NestedDirectivesRecursionTimeoutPreventionService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        localValue: '=',
        // The choices for the object's value.
        choices: '&',
        // The schema for this object.
        // TODO(sll): Validate each choice against the schema.
        schema: '&',
        isDisabled: '&'
      },
      template: require('./schema-based-choices-editor.directive.html'),
      controllerAs: '$ctrl',
      compile: NestedDirectivesRecursionTimeoutPreventionService.compile,
      controller: [function() {
        var ctrl = this;
        ctrl.getReadonlySchema = function() {
          var readonlySchema = angular.copy(ctrl.schema());
          delete readonlySchema.choices;
          return readonlySchema;
        };
      }]
    };
  }
]);
