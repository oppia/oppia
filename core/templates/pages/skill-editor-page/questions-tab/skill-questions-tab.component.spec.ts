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
import { EventEmitter } from '@angular/core';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { SkillQuestionsTabComponent } from './skill-questions-tab.component';

describe('Skill question tab component', () => {
  let component: SkillQuestionsTabComponent;
  let fixture: ComponentFixture<SkillQuestionsTabComponent>;
  let skillEditorStateService: SkillEditorStateService;
  let initEventEmitter = new EventEmitter();
  const sampleSkill = new Skill(
    null, 'Skill description loading',
    [], [], null, 'en', 1, 0, null, false, []);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],

    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillQuestionsTabComponent);
    component = fixture.componentInstance;
    skillEditorStateService = TestBed.inject(SkillEditorStateService);

    spyOnProperty(skillEditorStateService, 'onSkillChange')
      .and.returnValue(initEventEmitter);
    component.ngOnDestroy();
  });

  it('should fetch skill when initialized', () => {
    const fetchSkillSpy = spyOn(
      skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
    spyOn(skillEditorStateService, 'getGroupedSkillSummaries');
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
