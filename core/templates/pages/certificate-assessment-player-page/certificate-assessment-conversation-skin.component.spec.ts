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
 * @fileoverview Unit tests for CertificateAssessmentConversationSkinComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {CertificateAssessmentConversationSkinComponent} from './certificate-assessment-conversation-skin.component';

describe('CertificateAssessmentConversationSkinComponent', () => {
  let component: CertificateAssessmentConversationSkinComponent;
  let fixture: ComponentFixture<CertificateAssessmentConversationSkinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CertificateAssessmentConversationSkinComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(
      CertificateAssessmentConversationSkinComponent
    );
    component = fixture.componentInstance;
    component.currentQuestion = {
      prompt: 'What is 2 + 2?',
      choices: ['3', '4', '5'],
    };
    fixture.detectChanges();
  });

  it('should default currentQuestionIndex to 0', () => {
    expect(component.currentQuestionIndex).toBe(0);
  });

  it('should default totalQuestions to 0', () => {
    expect(component.totalQuestions).toBe(0);
  });

  it('should default progressPercentage to 0', () => {
    expect(component.progressPercentage).toBe(0);
  });

  it('should default isLastQuestion to false', () => {
    expect(component.isLastQuestion).toBe(false);
  });

  it('should accept a provided currentQuestion', () => {
    expect(component.currentQuestion).toEqual({
      prompt: 'What is 2 + 2?',
      choices: ['3', '4', '5'],
    });
  });

  it('should accept provided currentQuestionIndex, totalQuestions, progressPercentage and isLastQuestion', () => {
    component.currentQuestionIndex = 2;
    component.totalQuestions = 5;
    component.progressPercentage = 40;
    component.isLastQuestion = true;
    fixture.detectChanges();

    expect(component.currentQuestionIndex).toBe(2);
    expect(component.totalQuestions).toBe(5);
    expect(component.progressPercentage).toBe(40);
    expect(component.isLastQuestion).toBe(true);
  });

  it('should emit nextQuestion when onNextQuestion is called', () => {
    spyOn(component.nextQuestion, 'emit');

    component.onNextQuestion();

    expect(component.nextQuestion.emit).toHaveBeenCalled();
  });

  it('should emit submitAssessment when onSubmitAssessment is called', () => {
    spyOn(component.submitAssessment, 'emit');

    component.onSubmitAssessment();

    expect(component.submitAssessment.emit).toHaveBeenCalled();
  });
});
