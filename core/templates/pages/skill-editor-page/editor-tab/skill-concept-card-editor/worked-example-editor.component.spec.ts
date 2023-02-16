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
 * @fileoverview Unit tests for WorkedExampleEditorComponent
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ConceptCard } from 'domain/skill/concept-card.model';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { WorkedExample } from 'domain/skill/worked-example.model';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { WorkedExampleEditorComponent } from './worked-example-editor.component';

describe('Worked example editor component', () => {
  let component: WorkedExampleEditorComponent;
  let fixture: ComponentFixture<WorkedExampleEditorComponent>;
  let skillEditorStateService: SkillEditorStateService;
  let skillUpdateService: SkillUpdateService;
  let sampleSkill: Skill;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        WorkedExampleEditorComponent
      ],
      providers: [
        ChangeDetectorRef,
        SkillEditorStateService,
        SkillUpdateService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkedExampleEditorComponent);
    component = fixture.componentInstance;
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillUpdateService = TestBed.inject(SkillUpdateService);

    sampleSkill = new Skill(
      'id1', 'description', [], [], {} as ConceptCard, 'en',
      1, 0, 'id1', false, []);
    spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);

    component.isEditable = true;
    component.index = 2;
    component.workedExample = {
      getQuestion(): object {
        return {
          html: 'worked example question 1',
          content_id: 'worked_example_q_1',
        };
      },

      getExplanation(): object {
        return {
          html: 'worked example explanation 1',
          content_id: 'worked_example_e_1',
        };
      }
    } as WorkedExample;
    component.ngOnInit();
  });

  it('should set properties when initialized', () => {
    expect(component.questionEditorIsOpen).toBe(false);
    expect(component.explanationEditorIsOpen).toBe(false);
    expect(component.WORKED_EXAMPLE_FORM_SCHEMA).toEqual({
      type: 'html',
      ui_config: {}
    });
  });

  it('should open question editor when clicking on edit button', () => {
    expect(component.questionEditorIsOpen).toBe(false);

    component.openQuestionEditor();

    expect(component.questionEditorIsOpen).toBe(true);
  });

  it('should open explanation editor wclicking on edit button', () => {
    expect(component.explanationEditorIsOpen).toBe(false);

    component.openExplanationEditor();

    expect(component.explanationEditorIsOpen).toBe(true);
  });

  it('should close question editor when clicking on cancel button', () => {
    expect(component.questionEditorIsOpen).toBe(false);

    component.openQuestionEditor();

    expect(component.questionEditorIsOpen).toBe(true);

    component.cancelEditQuestion();

    expect(component.questionEditorIsOpen).toBe(false);

    component.questionEditorIsOpen = true;
    component.workedExampleQuestionMemento = null;
    component.cancelEditQuestion();

    expect(component.questionEditorIsOpen).toBe(true);
  });

  it('should close explanation editor when clicking on cancel button', () => {
    expect(component.explanationEditorIsOpen).toBe(false);

    component.openExplanationEditor();

    expect(component.explanationEditorIsOpen).toBe(true);

    component.cancelEditExplanation();

    expect(component.explanationEditorIsOpen).toBe(false);

    component.explanationEditorIsOpen = true;
    component.workedExampleQuestionMemento = null;
    component.cancelEditExplanation();

    expect(component.explanationEditorIsOpen).toBe(true);
  });

  it('should save worked example when clicking on save button', () => {
    let skillUpdateSpy = spyOn(skillUpdateService, 'updateWorkedExample')
      .and.returnValue();

    component.saveWorkedExample(true);

    expect(skillUpdateSpy).toHaveBeenCalledWith(
      sampleSkill,
      2,
      'worked example question 1',
      'worked example explanation 1');
  });

  it('should save worked example when clicking on save button', () => {
    let skillUpdateSpy = spyOn(skillUpdateService, 'updateWorkedExample')
      .and.returnValue();

    component.saveWorkedExample(false);

    expect(skillUpdateSpy).toHaveBeenCalledWith(
      sampleSkill,
      2,
      'worked example question 1',
      'worked example explanation 1');
  });

  it('should get schema', () => {
    expect(component.getSchema())
      .toEqual(component.WORKED_EXAMPLE_FORM_SCHEMA);
  });

  it('should update tmpWorkedExampleQuestionHtml', () => {
    component.container.workedExampleQuestionHtml = 'ques';

    let ques = 'new ques';
    component.updateLocalQues(ques);

    expect(component.container.workedExampleQuestionHtml).toEqual(ques);
  });

  it('should update tmpWorkedExampleExplanationHtml', () => {
    component.container.workedExampleExplanationHtml = 'exp';

    let exp = 'new exp';
    component.updateLocalExp(exp);

    expect(component.container.workedExampleExplanationHtml).toEqual(exp);
  });
});
