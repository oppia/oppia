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
 * @fileoverview Component for the skill mastery viewer.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { SkillMasteryListConstants } from
  'components/skills-mastery-list/skills-mastery-list.constants';
import { SkillMasteryBackendApiService } from
  'domain/skill/skill-mastery-backend-api.service';

@Component({
  selector: 'skill-mastery-viewer',
  templateUrl: './skill-mastery.component.html',
  styleUrls: []
})
export class SkillMasteryViewerComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() skillId!: string;
  @Input() masteryChange!: number;

  skillMasteryDegree: number = 0;

  constructor(
    private skillMasteryBackendApiService: SkillMasteryBackendApiService
  ) {}

  ngOnInit(): void {
    this.skillMasteryDegree = 0.0;

    this.skillMasteryBackendApiService.fetchSkillMasteryDegreesAsync(
      [this.skillId]).then(degreesOfMastery => this.skillMasteryDegree = (
      degreesOfMastery.getMasteryDegree(this.skillId)));
  }

  getSkillMasteryPercentage(): number {
    return Math.round(this.skillMasteryDegree * 100);
  }

  getMasteryChangePercentage(): string | number {
    if (this.masteryChange >= 0) {
      return '+' + Math.round(this.masteryChange * 100);
    } else {
      return Math.round(this.masteryChange * 100);
    }
  }

  getLearningTips(): string {
    if (this.masteryChange <= 0) {
      return (
        'Looks like your mastery of this skill has dropped. ' +
        'To improve it, try reviewing the concept card below and ' +
        'then practicing more questions for the skill.');
    }
    if (this.skillMasteryDegree >=
      SkillMasteryListConstants.MASTERY_CUTOFF.GOOD_CUTOFF) {
      return (
        'You have mastered this skill very well! ' +
        'You can work on other skills or learn new skills.');
    }
    return (
      'You have made progress! You can increase your ' +
      'mastery level by doing more practice sessions.');
  }
}

angular.module('oppia').directive(
  'skillMasteryViewer', downgradeComponent(
    {component: SkillMasteryViewerComponent}));
