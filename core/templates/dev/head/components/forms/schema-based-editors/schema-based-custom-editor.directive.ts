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
 * @fileoverview Directive for a schema-based editor for custom values.
 */

require('components/forms/custom-forms-directives/object-editor.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/nested-directives-recursion-timeout-prevention.service.ts');

angular.module('oppia').directive('schemaBasedCustomEditor', [
  'NestedDirectivesRecursionTimeoutPreventionService',
  'UrlInterpolationService',
  function(
      NestedDirectivesRecursionTimeoutPreventionService,
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        localValue: '=',
        // The class of the object being edited.
        objType: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/schema-based-editors/' +
        'schema-based-custom-editor.directive.html'),
      controllerAs: '$ctrl',
      compile: NestedDirectivesRecursionTimeoutPreventionService.compile,
      controller: [function() {}]
    };
  }
]);
