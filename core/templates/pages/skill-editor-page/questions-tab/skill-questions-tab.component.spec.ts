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
 * @fileoverview Unit tests for the Skill question tab Component.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SkillEditorStateService } from '../services/skill-editor-state.service';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { Skill, SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { SkillQuestionsTabComponent } from './skill-questions-tab.component';

describe('Skill question tab component', () => {
  let component: SkillQuestionsTabComponent;
  let fixture: ComponentFixture<SkillQuestionsTabComponent>;
  let skillEditorStateService: SkillEditorStateService;
  let initEventEmitter = new EventEmitter();
  let skillObjectFactory: SkillObjectFactory;
  let sampleSkill: Skill;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SkillQuestionsTabComponent],
      providers: [
        SkillEditorStateService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillQuestionsTabComponent);
    component = fixture.componentInstance;
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);

    let misconceptionDict1 = {
      id: 2,
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true
    };

    const rubricDict = {
      difficulty: 'medium',
      explanations: ['explanation']
    };

    const skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [],
      recorded_voiceovers: {
        voiceovers_mapping: {}
      }
    };

    sampleSkill = skillObjectFactory.createFromBackendDict({
      id: 'skill1',
      description: 'test description 1',
      misconceptions: [misconceptionDict1],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      next_misconception_id: 3,
      prerequisite_skill_ids: ['skill_1'],
      superseding_skill_id: 'skill0',
      all_questions_merged: true
    });

    spyOnProperty(skillEditorStateService, 'onSkillChange')
      .and.returnValue(initEventEmitter);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should fetch skill when initialized', () => {
    const fetchSkillSpy = spyOn(
      skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
    spyOn(skillEditorStateService, 'getGroupedSkillSummaries');
    component.ngOnInit();
    initEventEmitter.emit();

    expect(fetchSkillSpy).toHaveBeenCalled();
    expect(
      skillEditorStateService.getGroupedSkillSummaries).toHaveBeenCalled();
  });

  it('should not initialize when skill is not available', () => {
    const fetchSkillSpy = spyOn(
      skillEditorStateService, 'getSkill').and.returnValue(undefined);
    spyOn(skillEditorStateService, 'getGroupedSkillSummaries');

    component.ngOnInit();

    expect(fetchSkillSpy).toHaveBeenCalled();
    expect(
      skillEditorStateService.getGroupedSkillSummaries).not.toHaveBeenCalled();
  });

  it('should initialize when skill is available', () => {
    const fetchSkillSpy = spyOn(
      skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
    spyOn(skillEditorStateService, 'getGroupedSkillSummaries');

    component.ngOnInit();

    expect(fetchSkillSpy).toHaveBeenCalled();
    expect(
      skillEditorStateService.getGroupedSkillSummaries).toHaveBeenCalled();
  });
});
