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

angular.module('oppia').directive('skillSelectorEditor', [
  'UrlInterpolationService',
  function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/skill-selector-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$http', 'SKILL_DATA_URL_TEMPLATE',
        function($http, SKILL_DATA_URL_TEMPLATE) {
          var ctrl = this;
          ctrl.skills = [];

          ctrl.selectSkill = function(skillId, skillDescription) {
            ctrl.value = {
              id: skillId,
              description: skillDescription
            };
          };
          var skillDataUrl = UrlInterpolationService.interpolateUrl(
            SKILL_DATA_URL_TEMPLATE, {
              action: 'fetch_all',
              // When action is fetch_all, the second parameter is ignored, so
              // a placeholder value is passed so that the correct handler is
              // called.
              comma_separated_skill_ids: 'None'
            });
          $http.get(skillDataUrl).then(function(response) {
            ctrl.skills = angular.copy(response.data.skills);
          });
        }
      ]
    };
  }]);
