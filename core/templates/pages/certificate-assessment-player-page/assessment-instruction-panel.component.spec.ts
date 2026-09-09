// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AssessmentInstructionPanelComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {MockTranslatePipe} from 'tests/unit-test-utils';
import {AssessmentInstructionPanelComponent} from './assessment-instruction-panel.component';

describe('AssessmentInstructionPanelComponent', () => {
  let component: AssessmentInstructionPanelComponent;
  let fixture: ComponentFixture<AssessmentInstructionPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssessmentInstructionPanelComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentInstructionPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should default the certificate title to an empty string', () => {
    expect(component.certificateTitle).toBe('');
  });

  it('should default the assessment duration in minutes to zero', () => {
    expect(component.timeLimitInMinutes).toBe(0);
  });

  it('should default the total questions to zero', () => {
    expect(component.totalQuestions).toBe(0);
  });

  it('should allow values to be set via input bindings', () => {
    component.certificateTitle = 'Everyday Arithmetic & Number Confidence';
    component.timeLimitInMinutes = 60;
    component.totalQuestions = 12;

    expect(component.certificateTitle).toBe(
      'Everyday Arithmetic & Number Confidence'
    );
    expect(component.timeLimitInMinutes).toBe(60);
    expect(component.totalQuestions).toBe(12);
  });

  it('should have the correct i18n key for the instructions heading', () => {
    expect(component.instructionsHeadingI18nKey).toBe(
      'I18N_ASSESSMENT_INSTRUCTIONS_HEADING'
    );
  });

  it('should have the correct i18n key for the time limit instruction', () => {
    expect(component.timeLimitInstructionI18nKey).toBe(
      'I18N_ASSESSMENT_INSTRUCTION_TIME_LIMIT'
    );
  });

  it('should have the correct i18n key for the question count instruction', () => {
    expect(component.questionCountInstructionI18nKey).toBe(
      'I18N_ASSESSMENT_INSTRUCTION_QUESTION_COUNT'
    );
  });

  it('should list the correct i18n keys for the static instructions', () => {
    expect(component.staticInstructionI18nKeys).toEqual([
      'I18N_ASSESSMENT_INSTRUCTION_AUTO_SUBMIT',
      'I18N_ASSESSMENT_INSTRUCTION_ONE_QUESTION_AT_A_TIME',
      'I18N_ASSESSMENT_INSTRUCTION_NAVIGATION',
      'I18N_ASSESSMENT_INSTRUCTION_REVIEW_ANSWERS',
      'I18N_ASSESSMENT_INSTRUCTION_FINAL_SUBMISSION',
      'I18N_ASSESSMENT_INSTRUCTION_UNANSWERED_MARKED_INCORRECT',
      'I18N_ASSESSMENT_INSTRUCTION_MULTIPLE_ATTEMPTS',
      'I18N_ASSESSMENT_INSTRUCTION_PROGRESS_NOT_SAVED',
      'I18N_ASSESSMENT_INSTRUCTION_NEW_ATTEMPT',
    ]);
  });

  it('should emit startAssessment when onStartAssessment is called', () => {
    spyOn(component.startAssessment, 'emit');

    component.onStartAssessment();

    expect(component.startAssessment.emit).toHaveBeenCalled();
  });

  it('should emit back exactly once when onBack is called', () => {
    spyOn(component.back, 'emit');

    component.onBack();

    expect(component.back.emit).toHaveBeenCalledTimes(1);
  });

  it('should have the correct i18n key for the start assessment button', () => {
    expect(component.startAssessmentButtonI18nKey).toBe(
      'I18N_ASSESSMENT_START_BUTTON'
    );
  });
});
