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
 * @fileoverview Directive for the skill selector editor.
 */
require(
  'components/skill-selector/skill-selector.directive.ts');
require('domain/skill/skill-domain.constants.ajs.ts');
require('services/context.service.ts');

angular.module('oppia').directive('skillSelectorEditor', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      template: require('./skill-selector-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$scope', 'ContextService', 'ENTITY_TYPE',
        'FETCH_SKILLS_URL_TEMPLATE',
        function(
            $http, $scope, ContextService, ENTITY_TYPE,
            FETCH_SKILLS_URL_TEMPLATE) {
          var ctrl = this;
          ctrl.selectSkill = function(skillId, skillDescription) {
            ContextService.setCustomEntityContext(ENTITY_TYPE.SKILL, skillId);
            ctrl.value = {
              id: skillId,
              description: skillDescription
            };
          };
          ctrl.$onInit = function() {
            $scope.$on('$destroy', function() {
              ContextService.removeCustomEntityContext();
            });
            ctrl.skills = [];
            if (ctrl.value) {
              ContextService.setCustomEntityContext(
                ENTITY_TYPE.SKILL, ctrl.value.id);
            }
            $http.get(FETCH_SKILLS_URL_TEMPLATE).then(function(response) {
              ctrl.skills = angular.copy(response.data.skills);
            });
          };
        }
      ]
    };
  }]);
