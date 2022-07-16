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
 * @fileoverview Unit tests for the question misconception selector component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { MisconceptionSkillMap, MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { QuestionMisconceptionSelectorComponent } from './question-misconception-selector.component';

describe('Question Misconception Selector Component', () => {
  let component: QuestionMisconceptionSelectorComponent;
  let fixture: ComponentFixture<QuestionMisconceptionSelectorComponent>;
  let stateEditorService: StateEditorService;

  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let mockMisconceptionObject: MisconceptionSkillMap;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        QuestionMisconceptionSelectorComponent
      ],
      providers: [
        StateEditorService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionMisconceptionSelectorComponent);
    component = fixture.componentInstance;
    stateEditorService = TestBed.inject(StateEditorService);
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);

    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);
    stateEditorService = TestBed.inject(StateEditorService);

    mockMisconceptionObject = {
      abc: [
        misconceptionObjectFactory.create(
          1, 'misc1', 'notes1', 'feedback1', true)
      ],
      def: [
        misconceptionObjectFactory.create(
          2, 'misc2', 'notes2', 'feedback1', true)
      ]
    };
    spyOn(stateEditorService, 'getMisconceptionsBySkill').and.callFake(() => {
      return mockMisconceptionObject;
    });

    component.selectedMisconception = mockMisconceptionObject.abc[0];
    component.selectedMisconceptionSkillId = 'abc';
    fixture.detectChanges();
  });

  it('should initialize the properties correctly', () => {
    expect(component.misconceptionFeedbackIsUsed).toBeTrue();
    expect(component.misconceptionsBySkill).toEqual(mockMisconceptionObject);
  });

  it('should toggle feedback usage boolean correctly', () => {
    expect(component.misconceptionFeedbackIsUsed).toBeTrue();

    component.toggleMisconceptionFeedbackUsage();

    expect(component.misconceptionFeedbackIsUsed).toBeFalse();
  });

  it('should set selected misconception correctly', () => {
    expect(component.selectedMisconception).toEqual(
      mockMisconceptionObject.abc[0]);
    expect(component.selectedMisconceptionSkillId).toEqual('abc');

    component.selectMisconception(mockMisconceptionObject.def[0], 'def');

    expect(component.selectedMisconception).toEqual(
      mockMisconceptionObject.def[0]);
    expect(component.selectedMisconceptionSkillId).toEqual('def');
  });
});
