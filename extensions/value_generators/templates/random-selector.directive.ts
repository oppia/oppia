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
 * @fileoverview Directive for random selector value generator.
 */

interface RandomSelectorCustomScope extends ng.IScope {
  $ctrl?: {
    generatorId?: string;
  }
  getTemplateUrl?: (() => string);
}

angular.module('oppia').directive('randomSelector', [
  '$compile', function($compile) {
    return {
      link: function(scope: RandomSelectorCustomScope, element) {
        scope.getTemplateUrl = function() {
          return '/value_generator_handler/' + scope.$ctrl.generatorId;
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: {},
      bindToController: {
        customizationArgs: '=',
        getGeneratorId: '&'
      },
      template: '<div ng-include="getTemplateUrl()"></div>',
      controllerAs: '$ctrl',
      controller: function() {
        var ctrl = this;
        ctrl.$onInit = function() {
          ctrl.SCHEMA = {
            type: 'list',
            items: {
              type: 'unicode'
            },
            ui_config: {
              add_element_text: 'Add New Choice'
            }
          };
          ctrl.generatorId = ctrl.getGeneratorId();
          if (!ctrl.customizationArgs.list_of_values) {
            ctrl.customizationArgs.list_of_values = [];
          }
        };
      }
    };
  }]);
