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
 * @fileoverview Unit tests for SkillRubricsEditorComponent
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {EventEmitter} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {SkillUpdateService} from 'domain/skill/skill-update.service';
import {Skill, SkillObjectFactory} from 'domain/skill/SkillObjectFactory';
import {SkillEditorStateService} from 'pages/skill-editor-page/services/skill-editor-state.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {SkillRubricsEditorComponent} from './skill-rubrics-editor.component';
import {Rubric} from 'domain/skill/rubric.model';
import {of} from 'rxjs';

describe('Skill Rubrics Editor Component', () => {
  let component: SkillRubricsEditorComponent;
  let fixture: ComponentFixture<SkillRubricsEditorComponent>;
  let skillEditorStateService: SkillEditorStateService;
  let skillObjectFactory: SkillObjectFactory;
  let skillUpdateService: SkillUpdateService;
  let windowDimensionsService: WindowDimensionsService;
  let mockEventEmitter = new EventEmitter();
  let sampleSkill: Skill;
  let resizeEvent = new Event('resize');

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SkillRubricsEditorComponent],
      providers: [
        SkillUpdateService,
        SkillEditorStateService,
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => of(resizeEvent),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillRubricsEditorComponent);
    component = fixture.componentInstance;
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    skillUpdateService = TestBed.inject(SkillUpdateService);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);

    const skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [],
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
          worked_example_1: {},
          worked_example_2: {},
        },
      },
    };

    sampleSkill = skillObjectFactory.createFromBackendDict({
      id: '1',
      description: 'test description',
      misconceptions: [],
      rubrics: [],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      next_misconception_id: 6,
      superseding_skill_id: '2',
      all_questions_merged: false,
      prerequisite_skill_ids: ['skill_1'],
    });

    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe("when user's window is narrow", () => {
    beforeEach(() => {
      spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
      spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
      spyOnProperty(skillEditorStateService, 'onSkillChange').and.returnValue(
        mockEventEmitter
      );

      component.ngOnInit();
    });

    it('should initialise component when user open skill rubrics editor', () => {
      expect(component.skill).toEqual(sampleSkill);
      expect(component.rubricsListIsShown).toBeFalse();
    });

    it('should fetch rubrics when skill changes', () => {
      component.skill._rubrics = [
        Rubric.createFromBackendDict({
          difficulty: 'Easy',
          explanations: ['explanation'],
        }),
      ];

      expect(component.rubrics).toBeUndefined();

      mockEventEmitter.emit();

      expect(component.rubrics).toEqual([
        Rubric.createFromBackendDict({
          difficulty: 'Easy',
          explanations: ['explanation'],
        }),
      ]);
    });

    it("should show toggle rubrics list when user's window is narrow", () => {
      expect(component.rubricsListIsShown).toBeFalse();

      component.toggleRubricsList();

      expect(component.rubricsListIsShown).toBeTrue();

      component.toggleRubricsList();

      expect(component.rubricsListIsShown).toBeFalse();
    });

    it('should update skill rubrics when user saves', () => {
      spyOn(skillUpdateService, 'updateRubricForDifficulty');

      component.onSaveRubric('Easy', [
        'new explanation 1',
        'new explanation 2',
      ]);

      expect(skillUpdateService.updateRubricForDifficulty).toHaveBeenCalledWith(
        sampleSkill,
        'Easy',
        ['new explanation 1', 'new explanation 2']
      );
    });
  });

  describe("when user's window is not narrow", () => {
    beforeEach(() => {
      spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
      spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);

      component.ngOnInit();
    });

    it('should display rubrics list when editor loads', () => {
      expect(component.skill).toEqual(sampleSkill);
      expect(component.rubricsListIsShown).toBeTrue();
    });

    it('should not display toggle option when user has a wide screen', () => {
      expect(component.rubricsListIsShown).toBeTrue();

      component.toggleRubricsList();

      expect(component.rubricsListIsShown).toBeTrue();
    });
  });

  it('should toggle skill editor card on clicking', () => {
    component.skillEditorCardIsShown = true;
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);

    component.toggleSkillEditorCard();

    expect(component.skillEditorCardIsShown).toBeFalse();

    component.toggleSkillEditorCard();

    expect(component.skillEditorCardIsShown).toBeTrue();
  });

  it('should show Rubrics list when the window is narrow', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      mockEventEmitter
    );
    component.windowIsNarrow = false;

    expect(component.rubricsListIsShown).toBe(false);

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(component.rubricsListIsShown).toBe(false);
    expect(component.windowIsNarrow).toBe(true);
  });

  it('should show Rubrics list when the window is wide', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    component.windowIsNarrow = true;

    expect(component.rubricsListIsShown).toBe(false);

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(component.rubricsListIsShown).toBe(true);
    expect(component.windowIsNarrow).toBe(false);
  });

  it('should not toggle Rubrics list when window is wide', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

    component.rubricsListIsShown = true;

    component.toggleRubricsList();

    expect(component.rubricsListIsShown).toBe(true);
  });

  it('should not toggle skill card editor when window is wide', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

    component.skillEditorCardIsShown = true;

    component.toggleRubricsList();

    expect(component.skillEditorCardIsShown).toBe(true);
  });
});
