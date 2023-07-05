// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the skill description editor.
 */

import { Subscription } from 'rxjs';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { Skill, SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { SkillRights } from 'domain/skill/skill-rights.model';

@Component({
  selector: 'oppia-skill-description-editor',
  templateUrl: './skill-description-editor.component.html'
})
export class SkillDescriptionEditorComponent implements OnInit, OnDestroy {
  @Output() onSaveDescription = new EventEmitter<void>();
  errorMsg: string = '';
  directiveSubscriptions = new Subscription();
  MAX_CHARS_IN_SKILL_DESCRIPTION = (
    AppConstants.MAX_CHARS_IN_SKILL_DESCRIPTION);

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  skillRights!: SkillRights;
  skill!: Skill;
  tmpSkillDescription!: string;
  skillDescriptionEditorIsShown: boolean = false;
  constructor(
    private skillUpdateService: SkillUpdateService,
    private skillEditorStateService: SkillEditorStateService,
    private skillObjectFactory: SkillObjectFactory
  ) {}

  canEditSkillDescription(): boolean {
    return this.skillRights.canEditSkillDescription();
  }

  resetErrorMsg(): void {
    this.errorMsg = '';
  }

  saveSkillDescription(newSkillDescription: string): void {
    if (newSkillDescription === this.skill.getDescription()) {
      return;
    }
    if (this.skillObjectFactory.hasValidDescription(
      newSkillDescription)) {
      this.skillDescriptionEditorIsShown = false;
      this.skillUpdateService.setSkillDescription(
        this.skill,
        newSkillDescription);
      this.onSaveDescription.emit();
    } else {
      this.errorMsg = (
        'Please use a non-empty description consisting of ' +
        'alphanumeric characters, spaces and/or hyphens.');
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  ngOnInit(): void {
    this.skill = this.skillEditorStateService.getSkill();
    this.tmpSkillDescription = this.skill.getDescription();
    this.skillRights = this.skillEditorStateService.getSkillRights();
    this.errorMsg = '';
    this.directiveSubscriptions.add(
      this.skillEditorStateService.onSkillChange.subscribe(
        () => this.tmpSkillDescription = this.skill.getDescription()
      )
    );
  }
}

angular.module('oppia').directive(
  'oppiaSkillDescriptionEditor', downgradeComponent(
    {component: SkillDescriptionEditorComponent}));
