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

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';
import { EventBusGroup, EventBusService } from 'app-events/event-bus.service';
import { AppConstants } from 'app.constants';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { SkillBackendDict } from 'domain/skill/SkillObjectFactory';
import { ContextService } from 'services/context.service';

@Component({
  selector: 'skill-selector-editor',
  templateUrl: './skill-selector-editor.component.html'
})
export class SkillSelectorEditorComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() modalId!: symbol;
  @Input() value!: string;
  @Output() valueChanged = new EventEmitter();
  initialEntityId!: string;
  initialEntityType?: string;
  skills: SkillBackendDict[] = [];
  showLoading = false;
  skillsToShow: SkillBackendDict[] = [];
  eventBusGroup: EventBusGroup;
  skillFilterText: string = '';
  constructor(
    private contextService: ContextService,
    private eventBusService: EventBusService,
    private skillBackendApiService: SkillBackendApiService
  ) {
    this.eventBusGroup = new EventBusGroup(this.eventBusService);
  }

  filterSkills(skillSelector: string): void {
    if (skillSelector === '') {
      this.skillsToShow = this.skills;
    }

    skillSelector = skillSelector.toLowerCase();

    this.skillsToShow = this.skills.filter(
      option => (option.description.toLowerCase().indexOf(skillSelector) >= 0)
    );
  }

  selectSkill(skillId: string, skillDescription: string): void {
    this.contextService.setCustomEntityContext(
      AppConstants.ENTITY_TYPE.SKILL, skillId);
    this.value = skillId;
    this.valueChanged.emit(this.value);
    this.eventBusGroup.emit(new ObjectFormValidityChangeEvent({
      modalId: this.modalId,
      value: false
    }));
  }

  ngOnInit(): void {
    this.showLoading = true;
    this.skills = [];
    this.initialEntityId = this.contextService.getEntityId();
    this.initialEntityType = this.contextService.getEntityType();
    if (this.value) {
      this.contextService.setCustomEntityContext(
        AppConstants.ENTITY_TYPE.SKILL, this.value);
      this.eventBusGroup.emit(new ObjectFormValidityChangeEvent({
        modalId: this.modalId,
        value: false
      }));
    }
    this.skillBackendApiService.fetchAllSkills().subscribe(
      (response) => {
        this.skills = response.skills;
        this.filterSkills('');
        // If a skill was previously selected, show that as the first entry in
        // the list.
        this.skillsToShow.sort(
          (x, y) => x.id === this.value ? -1 : y.id === this.value ? 1 : 0);
        this.showLoading = false;
      }
    );
  }

  ngOnDestroy(): void {
    this.contextService.removeCustomEntityContext();
    /**
     * Restore the entity context to that of the state before the skill selector
     * editor was initialized. This prevents change of context issues in calling
     * components once the editor is closed, e.g. uploading images in the
     * question editor.
     * See issue #16985 for detailed discussion.
     */
    if (this.initialEntityId && this.initialEntityType) {
      this.contextService.setCustomEntityContext(
        this.initialEntityType, this.initialEntityId);
    }
  }
}

angular.module('oppia').directive('skillSelectorEditor', downgradeComponent({
  component: SkillSelectorEditorComponent
}));
