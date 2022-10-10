// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the questions tab.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { Subscription } from 'rxjs';
import { GroupedSkillSummaries, SkillEditorStateService } from '../services/skill-editor-state.service';

@Component({
  selector: 'oppia-questions-tab',
  templateUrl: './skill-questions-tab.component.html'
})
export class SkillQuestionsTabComponent implements OnInit, OnDestroy {
  skill: Skill;
  groupedSkillSummaries: GroupedSkillSummaries;
  skillIdToRubricsObject = {};

  constructor(
    private skillEditorStateService: SkillEditorStateService
  ) {}

  directiveSubscriptions = new Subscription();
  _init(): void {
    this.skill = this.skillEditorStateService.getSkill();
    this.groupedSkillSummaries = (
      this.skillEditorStateService.getGroupedSkillSummaries());
    this.skillIdToRubricsObject = {};
    this.skillIdToRubricsObject[this.skill.getId()] =
      this.skill.getRubrics();
  }

  ngOnInit(): void {
    if (this.skillEditorStateService.getSkill() !== undefined) {
      this._init();
    }
    this.directiveSubscriptions.add(
      this.skillEditorStateService.onSkillChange.subscribe(
        () => this._init())
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaQuestionsTab',
  downgradeComponent({
    component: SkillQuestionsTabComponent
  }) as angular.IDirectiveFactory);
