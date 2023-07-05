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
 * @fileoverview Unit tests for RubricsEditorComponent.
 */

import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SkillCreationService } from 'components/entity-creation-services/skill-creation.service';
import { Rubric } from 'domain/skill/rubric.model';
import { RubricsEditorComponent } from './rubrics-editor.component';

describe('Rubrics Editor Component', () => {
  let fixture: ComponentFixture<RubricsEditorComponent>;
  let componentInstance: RubricsEditorComponent;
  let difficulty: string = 'medium';
  let rubrics: Rubric[] = [
    new Rubric('easy', []),
    new Rubric(difficulty, []),
    new Rubric('hard', [])
  ];
  let skillCreationService: SkillCreationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule
      ],
      declarations: [
        RubricsEditorComponent
      ],
      providers: [
        SkillCreationService,
        ChangeDetectorRef
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RubricsEditorComponent);
    componentInstance = fixture.componentInstance;
    componentInstance.rubrics = rubrics;
    componentInstance.newSkillBeingCreated = false;
    skillCreationService = TestBed.inject(SkillCreationService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should be editable', () => {
    expect(componentInstance.isEditable()).toBeTrue();
  });

  it('should get schema', () => {
    expect(componentInstance.getSchema())
      .toEqual(componentInstance.EXPLANATION_FORM_SCHEMA);
  });

  it('should get explanation status', () => {
    expect(componentInstance.isExplanationEmpty('')).toBeTrue();
    expect(componentInstance.isExplanationEmpty('<p></p>')).toBeTrue();
  });

  it('should open explanation editor', () => {
    let index: number = 2;
    componentInstance.ngOnInit();
    componentInstance.openExplanationEditor(difficulty, index);
    expect(componentInstance.explanationEditorIsOpen[difficulty][index])
      .toBeTrue();
  });

  it('should get explanation validation status', () => {
    let index: number = 2;
    componentInstance.ngOnInit();
    componentInstance.editableExplanations[difficulty][index] = 'not_empty';
    expect(componentInstance.isExplanationValid(difficulty, index))
      .toBeTrue();
  });

  it('should check if explanations are at most 300 characters long', () => {
    let index: number = 2;
    componentInstance.ngOnInit();
    componentInstance.editableExplanations[difficulty][index] = 'a'.repeat(300);
    expect(componentInstance.isExplanationLengthValid(difficulty, index))
      .toBeTrue();
    componentInstance.editableExplanations[difficulty][index] = 'a'.repeat(301);
    expect(componentInstance.isExplanationLengthValid(difficulty, index))
      .toBeFalse();
  });

  it('should check if medium level rubrics' +
      ' have atleast one explantion',
  () => {
    let index: number = 0;
    expect(componentInstance.isMediumLevelExplanationValid()).toBeFalse;
    componentInstance.ngOnInit();
    componentInstance.editableExplanations[difficulty][index] = 'not_empty';
    expect(componentInstance.isMediumLevelExplanationValid()).toBeTrue;
  });

  it('should check if total number of explanations' +
      ' have reached the limit',
  () => {
    let index: number = 0;
    componentInstance.ngOnInit();
    componentInstance.editableExplanations[difficulty][index] =
      'not_empty';
    expect(componentInstance.hasReachedExplanationCountLimit())
      .toBeFalse();
    for (let index = 0; index < 11; index++) {
      componentInstance.editableExplanations[difficulty].push('not_empty');
    }
    expect(componentInstance.hasReachedExplanationCountLimit())
      .toBeTrue();
  });

  it('should update explanation', () => {
    let index: number = 0;
    let newExplanation: string = 'new';
    componentInstance.ngOnInit();
    componentInstance.editableExplanations[difficulty][index] = '';
    componentInstance.rubric = rubrics[1];
    componentInstance.updateExplanation(newExplanation, index);
    expect(componentInstance.editableExplanations[difficulty][index])
      .toEqual(newExplanation);
  });

  it('should change rubric', () => {
    componentInstance.selectedRubricIndex = 0;
    componentInstance.onRubricSelectionChange();
    expect(componentInstance.rubric).toEqual(componentInstance.rubrics[0]);
  });

  it('should save exploration', () => {
    spyOn(skillCreationService, 'disableSkillDescriptionStatusMarker');
    componentInstance.skillDifficultyMedium = difficulty;
    componentInstance.ngOnInit();
    spyOn(componentInstance.saveRubric, 'emit');
    componentInstance.explanationsMemento[difficulty] = [];
    componentInstance.explanationsMemento[difficulty][0] = 'different';
    componentInstance
      .saveExplanation(componentInstance.skillDifficultyMedium, 0);
    expect(skillCreationService.disableSkillDescriptionStatusMarker)
      .toHaveBeenCalled();
    expect(componentInstance.explanationEditorIsOpen[difficulty][0])
      .toBeFalse();
    expect(componentInstance.saveRubric.emit).toHaveBeenCalledWith({
      difficulty: difficulty,
      data: componentInstance.editableExplanations[difficulty]
    });
    expect(componentInstance.explanationsMemento[difficulty][0]).toEqual(
      componentInstance.editableExplanations[difficulty][0]);
  });

  it('should cancel edit explanation', () => {
    spyOn(componentInstance, 'deleteExplanation');
    componentInstance.ngOnInit();
    componentInstance.explanationsMemento[difficulty][0] = '';
    componentInstance.cancelEditExplanation(difficulty, 0);
    expect(componentInstance.deleteExplanation).toHaveBeenCalled();
    expect(componentInstance.explanationEditorIsOpen[difficulty][0])
      .toBeFalse();
  });

  it('should add explanation for difficulty', () => {
    spyOn(componentInstance.saveRubric, 'emit');
    componentInstance.ngOnInit();
    componentInstance.addExplanationForDifficulty(difficulty);
    expect(componentInstance.saveRubric.emit).toHaveBeenCalledWith({
      difficulty,
      data: componentInstance.editableExplanations[difficulty]
    });
    expect(componentInstance.explanationsMemento)
      .toEqual(componentInstance.editableExplanations);
  });

  it('should delete explanation', () => {
    spyOn(componentInstance.saveRubric, 'emit');
    componentInstance.ngOnInit();
    componentInstance.skillDifficultyMedium = difficulty;
    componentInstance.deleteExplanation(difficulty, 0);
    expect(componentInstance.explanationEditorIsOpen[difficulty][0])
      .toBeFalse();
    expect(componentInstance.saveRubric.emit).toHaveBeenCalledWith({
      difficulty,
      data: componentInstance.editableExplanations[difficulty]
    });
    expect(componentInstance.explanationsMemento[difficulty])
      .toEqual(componentInstance.editableExplanations[difficulty]);
  });

  it('should give status of empty explanation', () => {
    spyOn(componentInstance, 'isExplanationEmpty').and.returnValue(true);
    componentInstance.explanationsMemento[difficulty] = [''];
    expect(componentInstance.isAnyExplanationEmptyForDifficulty(difficulty))
      .toBeTrue();
  });

  it('should give false when explanation is not empty', () => {
    spyOn(componentInstance, 'isExplanationEmpty').and.returnValue(false);
    expect(componentInstance.isAnyExplanationEmptyForDifficulty(difficulty))
      .toBeFalse();
  });
});
