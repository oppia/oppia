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
 * @fileoverview Unit tests for the navbar breadcrumb of the skill editor.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {Skill, SkillObjectFactory} from 'domain/skill/SkillObjectFactory';
import {SkillEditorStateService} from '../services/skill-editor-state.service';
import {SkillEditorNavbarBreadcrumbComponent} from './skill-editor-navbar-breadcrumb.component';

describe('SkillEditorNavbarBreadcrumbComponent', () => {
  let component: SkillEditorNavbarBreadcrumbComponent;
  let fixture: ComponentFixture<SkillEditorNavbarBreadcrumbComponent>;
  let skillObjectFactory: SkillObjectFactory;
  let skillObject: Skill;
  let skillEditorStateService: SkillEditorStateService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SkillEditorNavbarBreadcrumbComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillEditorNavbarBreadcrumbComponent);
    component = fixture.componentInstance;
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    let misconceptionDict1 = {
      id: 2,
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true,
    };

    let rubricDict = {
      difficulty: 'Easy',
      explanations: ['explanation'],
    };

    let skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [],
      recorded_voiceovers: {
        voiceovers_mapping: {},
      },
    };

    skillObject = skillObjectFactory.createFromBackendDict({
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
      all_questions_merged: true,
    });
  });

  it('should not truncate skill descirption when skill editor navbar loads', () => {
    spyOn(skillEditorStateService, 'getSkill').and.returnValue(skillObject);

    expect(component.getTruncatedDescription()).toBe('test description 1');
  });

  it('should truncate skill descirption when skill editor navbar loads', () => {
    skillObject.setDescription(Array(40).join('a'));
    spyOn(skillEditorStateService, 'getSkill').and.returnValue(skillObject);

    expect(component.getTruncatedDescription()).toBe(
      Array(36).join('a') + '...'
    );
  });
});
