// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the skill mastery viewer.
 */

require('components/skills-mastery-list/skills-mastery-list.constants.ajs.ts');
require('domain/skill/SkillMasteryBackendApiService.ts');

angular.module('oppia').directive('skillMasteryViewer', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        skillId: '=',
        masteryChange: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/skill-mastery/skill-mastery.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', 'SkillMasteryBackendApiService',
        'MASTERY_CUTOFF',
        function(
            $scope, SkillMasteryBackendApiService,
            MASTERY_CUTOFF) {
          var ctrl = this;
          ctrl.skillMasteryDegree = 0.0;

          SkillMasteryBackendApiService.fetchSkillMasteryDegrees(
            [ctrl.skillId]).then(function(degreesOfMastery) {
            ctrl.skillMasteryDegree = degreesOfMastery[ctrl.skillId];
          });

          ctrl.getSkillMasteryPercentage = function() {
            return Math.round(ctrl.skillMasteryDegree * 100);
          };

          ctrl.getMasteryChangePercentage = function() {
            if (ctrl.masteryChange >= 0) {
              return '+' + Math.round(ctrl.masteryChange * 100);
            } else {
              return Math.round(ctrl.masteryChange * 100);
            }
          };

          ctrl.getLearningTips = function() {
            if (ctrl.masteryChange > 0) {
              if (ctrl.skillMasteryDegree >= MASTERY_CUTOFF.GOOD_CUTOFF) {
                return 'You have mastered this skill very well! ' +
                  'You can work on other skills or learn new skills.';
              } else {
                return 'You have made progress! You can increase your ' +
                  'mastery level by doing more practice sessions.';
              }
            } else {
              return 'Looks like your mastery of this skill has dropped. ' +
                  'To improve it, try reviewing the concept card below and ' +
                  'then practicing more questions for the skill.';
            }
          };
        }
      ]
    };
  }]);
