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


oppia.directive('paramGeneratorEditor', function ($compile, warningsData) {
  var paramGeneratorTemplates = {
    'Copier': '<[generatorId]>: make a copy of <[generatorArgs]>',
    'RestrictedCopier': '<[generatorId]>: pick a value in <[initArgs.choices]>; current value is <[generatorArgs.value]>',
    'InclusiveIntRangePicker': '<[generatorId]>: currently picks a value between <[generatorArgs.lower_bound]> and <[generatorArgs.upper_bound]>, inclusive'
  }

  // TODO(sll): This function should make a call to the backend resource instead.
  var getTemplate = function(generatorId) {
    return paramGeneratorTemplates[generatorId];
  }

  var linker = function(scope, element, attrs) {
    element.html(getTemplate(scope.generatorId));
    $compile(element.contents())(scope);
  }

  return {
    link: linker,
    restrict: 'E',
    scope: {generatorId: '=', initArgs: '=', generatorArgs: '='}
  };
});


// USAGE: In a controller scope which contains a 'parameters' attr, write HTML
// code similar to the following:
//
//  <div>
//    <div ng-repeat="param in parameters">
//      Param NAME: <[param.name]>
//      Param GENERATOR:
//      <param-generator-editor generator-id="param.generator" generator-args="param.customization_args" init-args="param.init_args"></param-generator-editor>
//    </div>
//  </div>
//
// This is an example of how to define $scope.parameters in the controller:
//
// $scope.parameters = [{
//   'name': 'Language',
//   'generator': 'RestrictedCopier',
//   'init_args': {
//     'choices': ['Coffeescript', 'Python']
//   },
//   // NB: these are CURRENT args, not the default ones
//   'customization_args': {'value': 'Python'},
//   'expected_type': 'UnicodeString'
// }, {
//   'name': 'Width',
//   'generator': 'InclusiveIntRangePicker',
//   'init_args': [],
//   'customization_args': {'lower_bound': 100, 'upper_bound': 100},
//   'expected_type': 'Int'
// }];
