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

// require('components/skills-mastery-list/skills-mastery-list.constants.ajs.ts');
// require('domain/skill/skill-mastery-backend-api.service.ts');

// angular.module('oppia').directive('skillMasteryViewer', [
//   'UrlInterpolationService', function(UrlInterpolationService) {
//     return {
//       restrict: 'E',
//       scope: {},
//       bindToController: {
//         skillId: '=',
//         masteryChange: '='
//       },
//       templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
//         '/components/skill-mastery/skill-mastery.directive.html'),
//       controllerAs: '$ctrl',
//       controller: [
//         '$scope', 'SkillMasteryBackendApiService',
//         'MASTERY_CUTOFF',
//         function(
//             $scope, SkillMasteryBackendApiService,
//             MASTERY_CUTOFF) {
//           var ctrl = this;
//           ctrl.getSkillMasteryPercentage = function() {
            // return Math.round(ctrl.skillMasteryDegree * 100);
//           };

//           ctrl.getMasteryChangePercentage = function() {
            // if (ctrl.masteryChange >= 0) {
            //   return '+' + Math.round(ctrl.masteryChange * 100);
            // } else {
            //   return Math.round(ctrl.masteryChange * 100);
            // }
//           };

//           ctrl.getLearningTips = function() {
            // if (ctrl.masteryChange > 0) {
            //   if (ctrl.skillMasteryDegree >= MASTERY_CUTOFF.GOOD_CUTOFF) {
            //     return 'You have mastered this skill very well! ' +
            //       'You can work on other skills or learn new skills.';
            //   } else {
            //     return 'You have made progress! You can increase your ' +
            //       'mastery level by doing more practice sessions.';
            //   }
            // } else {
            //   return 'Looks like your mastery of this skill has dropped. ' +
            //       'To improve it, try reviewing the concept card below and ' +
            //       'then practicing more questions for the skill.';
            // }
//           };
//           ctrl.$onInit = function() {
//             ctrl.skillMasteryDegree = 0.0;

//             SkillMasteryBackendApiService.fetchSkillMasteryDegrees(
//               [ctrl.skillId]).then(function(degreesOfMastery) {
//               ctrl.skillMasteryDegree = degreesOfMastery[ctrl.skillId];
//             });
//           };
//         }
//       ]
//     };
//   }]);

/*
Migration steps
1. Done
2. Done
3. Done
4. Doubt with '='
*/


import { SkillMasteryListConstants } from 'components/skills-mastery-list/skills-mastery-list.constants';

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { SkillMasteryBackendApiService } from 'domain/skill/skill-mastery-backend-api.service';

@Component({
  selector: 'skill-mastery-viewer',
  templateUrl: './skill-mastery.directive.html',
  styleUrls: []
})
export class SkillMasteryViewerComponent implements OnInit {
  @Input() skillId: string;
  @Input() masteryChange: number;

  skillMasteryDegree: number = 0;

  constructor(
    private skillMasteryBackendApiService: SkillMasteryBackendApiService
  ) {}

  ngOnInit() {
    this.skillMasteryDegree = 0.0;

    this.skillMasteryBackendApiService.fetchSkillMasteryDegrees(
      [this.skillId]).then(function(degreesOfMastery) {
      this.skillMasteryDegree = degreesOfMastery[this.skillId];
    });
  }

  getSkillMasteryPercentage() {
    return Math.round(this.skillMasteryDegree * 100);
  }

  getMasteryChangePercentage() {
    if (this.masteryChange >= 0) {
      return '+' + Math.round(this.masteryChange * 100);
    } else {
      return Math.round(this.masteryChange * 100);
    }
  }

  getLearningTips() {
    if (this.masteryChange > 0) {
      if (this.skillMasteryDegree >= SkillMasteryListConstants.MASTERY_CUTOFF.GOOD_CUTOFF) {
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
  }
}

angular.module('oppia').directive(
  'skillMasteryViewer', downgradeComponent(
    {component: SkillMasteryViewerComponent}));