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

var VALUE_GENERATOR_TEMPLATES_URL = '/value_generator_handler/';
var GENERATOR_ID_TO_DIRECTIVE_MAPPING = {};

// Individual value generator directives can be found in
// extensions/value_generators/templates. They should be registered in the
// GENERATOR_ID_TO_DIRECTIVE_MAPPING object above.

oppia.directive('valueGeneratorEditor', function($compile, $http, warningsData) {
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
