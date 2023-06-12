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
 * @fileoverview Unit tests for the skill selector editor.
 */

import { async, ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { SkillSelectorEditorComponent } from './skill-selector-editor.component';
import { FormsModule } from '@angular/forms';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { ContextService } from 'services/context.service';
import { AppConstants } from 'app.constants';

describe('SkillSelectorEditorComponent', () => {
  let component: SkillSelectorEditorComponent;
  let fixture: ComponentFixture<SkillSelectorEditorComponent>;
  let skillBackendApiService: SkillBackendApiService;
  let contextService: ContextService;
  let fetchAllSkillsEmitter = new EventEmitter();

  let skills = [{
    next_misconception_id: 0,
    description: 'skill 2',
    rubrics: [
      {
        difficulty: 'Easy',
        explanations: []
      },
      {
        difficulty: 'Medium',
        explanations: [
          'skill 2'
        ]
      },
      {
        difficulty: 'Hard',
        explanations: []
      }
    ],
    superseding_skill_id: '0',
    language_code: 'en',
    id: 'akS2GkSjaOVL',
    prerequisite_skill_ids: [],
    all_questions_merged: false,
    version: 1,
    misconceptions: [],
    skill_contents: {
      worked_examples: [],
      explanation: {
        content_id: 'explanation',
        html: '<p>Release Testing Dec 2020</p>'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {}
        }
      }
    }
  }, {
    next_misconception_id: 0,
    description: 'Derive a ratio from a description or a picture.',
    rubrics: [
      {
        difficulty: 'Easy',
        explanations: [
          'N/A'
        ]
      },
      {
        difficulty: 'Medium',
        explanations: [
          'Derive a ratio from a description or a picture.'
        ]
      },
      {
        difficulty: 'Hard',
        explanations: [
          '<p><span>Given a description of a change in a situation,</p>'
        ]
      }
    ],
    superseding_skill_id: '1',
    language_code: 'en',
    id: 'DABaIPpsHkTl',
    prerequisite_skill_ids: [],
    all_questions_merged: false,
    version: 3,
    misconceptions: [],
    skill_contents: {
      worked_examples: [],
      explanation: {
        content_id: 'explanation',
        html: '<p>A ratio represents...</p>'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {}
        }
      }
    }
  }];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [SkillSelectorEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    contextService = TestBed.get(ContextService);
    skillBackendApiService = TestBed.get(SkillBackendApiService);
    fixture = TestBed.createComponent(SkillSelectorEditorComponent);
    component = fixture.componentInstance;

    component.value = 'skillId';
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialise component when user has to select a skill', () => {
    spyOn(contextService, 'setCustomEntityContext');
    spyOn(component.eventBusGroup, 'emit');

    component.ngOnInit();

    expect(component.showLoading).toBeTrue();
    expect(component.skills).toEqual([]);
    expect(contextService.setCustomEntityContext).toHaveBeenCalledWith(
      AppConstants.ENTITY_TYPE.SKILL, 'skillId');
    expect(component.eventBusGroup.emit).toHaveBeenCalled();
  });

  it('should populate skill list when skills are fetched from the backend',
    fakeAsync(() => {
      spyOn(skillBackendApiService, 'fetchAllSkills').and.returnValue(
        fetchAllSkillsEmitter
      );
      component.skillsToShow = skills;
      component.ngOnInit();

      expect(component.skills).toEqual([]);
      expect(component.showLoading).toBeTrue();

      fetchAllSkillsEmitter.emit({
        skills: skills
      });

      expect(component.skills).toEqual(skills);
      expect(component.skillsToShow).toEqual(skills);
      expect(component.showLoading).toBeFalse();
    }));

  it('should remove custom entity when the component is destroyed', () => {
    spyOn(contextService, 'removeCustomEntityContext');

    component.ngOnDestroy();

    expect(contextService.removeCustomEntityContext).toHaveBeenCalled();
  });

  it('should restore custom entity for images of question-editor' +
  'when component is destroyed', () => {
    spyOn(contextService, 'setCustomEntityContext');

    component.initialEntityId = 'exampleEntityId';
    component.initialEntityType = 'exampleEntityType';
    component.ngOnDestroy();

    expect(contextService.setCustomEntityContext).toHaveBeenCalledWith(
      'exampleEntityType', 'exampleEntityId');
  });

  it('should select skill when user selects skill', () => {
    spyOn(contextService, 'setCustomEntityContext');
    spyOn(component.valueChanged, 'emit');
    component.value = '';

    component.selectSkill('akS2GkSjaOVL', 'skill 2');

    expect(component.value).toBe('akS2GkSjaOVL');
    expect(contextService.setCustomEntityContext).toHaveBeenCalledWith(
      AppConstants.ENTITY_TYPE.SKILL, 'akS2GkSjaOVL');
    expect(component.valueChanged.emit).toHaveBeenCalledWith('akS2GkSjaOVL');
  });
});
