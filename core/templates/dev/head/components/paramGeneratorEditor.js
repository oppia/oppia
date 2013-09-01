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
 * @fileoverview Directive for the parameter generator editors.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.directive('paramGeneratorEditor', function ($compile, $http, warningsData) {
  var valueGeneratorTemplatesUrl = '/value_generator_templates/';

  var linker = function(scope, element, attrs) {
    // TODO(sll): This is a bit clumsy. It is possible to specify a dynamic
    // templateUrl in AngularJS 1.1.4, so update this when we upgrade the
    // Angular dependency.
    scope.getTemplateUrl = function(generatorId) {
      return valueGeneratorTemplatesUrl + generatorId;
    };

    $compile(element.contents())(scope);
  };

  return {
    link: linker,
    restrict: 'E',
    scope: {generatorId: '=', initArgs: '=', customizationArgs: '=', objType: '='},
    template: '<div ng-include="getTemplateUrl(generatorId)"></div>'
  };
});
