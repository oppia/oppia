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
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';

import {CertificateAssessmentConversationSkinComponent} from './certificate-assessment-conversation-skin.component';

describe('CertificateAssessmentConversationSkinComponent', () => {
  let component: CertificateAssessmentConversationSkinComponent;
  let fixture: ComponentFixture<CertificateAssessmentConversationSkinComponent>;
  let urlInterpolationServiceSpy: jasmine.SpyObj<UrlInterpolationService>;
  let currentInteractionServiceSpy: jasmine.SpyObj<CurrentInteractionService>;

  beforeEach(async () => {
    urlInterpolationServiceSpy = jasmine.createSpyObj(
      'UrlInterpolationService',
      ['getStaticCopyrightedImageUrl']
    );
    urlInterpolationServiceSpy.getStaticCopyrightedImageUrl.and.returnValue(
      '/static/avatar.svg'
    );
    currentInteractionServiceSpy = jasmine.createSpyObj(
      'CurrentInteractionService',
      ['submitAnswer', 'isSubmitAnswerFnRegistered']
    );

    await TestBed.configureTestingModule({
      declarations: [
        CertificateAssessmentConversationSkinComponent,
        MockTranslatePipe,
      ],
      providers: [
        {
          provide: UrlInterpolationService,
          useValue: urlInterpolationServiceSpy,
        },
        {
          provide: CurrentInteractionService,
          useValue: currentInteractionServiceSpy,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(
      CertificateAssessmentConversationSkinComponent
    );
    component = fixture.componentInstance;
  });

  it('should initialize the avatar URL on init', () => {
    component.ngOnInit();

    expect(
      urlInterpolationServiceSpy.getStaticCopyrightedImageUrl
    ).toHaveBeenCalledWith('/avatar/oppia_avatar_100px.svg');
    expect(component.OPPIA_AVATAR_IMAGE_URL).toBe('/static/avatar.svg');
  });

  it('should emit previousQuestion on onPreviousQuestion', () => {
    spyOn(component.previousQuestion, 'emit');

    component.onPreviousQuestion();

    expect(component.previousQuestion.emit).toHaveBeenCalled();
  });

  it('should call submitAnswer and emit nextQuestion on onNextQuestion', () => {
    spyOn(component.nextQuestion, 'emit');
    currentInteractionServiceSpy.isSubmitAnswerFnRegistered.and.returnValue(
      true
    );

    component.onNextQuestion();

    expect(currentInteractionServiceSpy.submitAnswer).toHaveBeenCalled();
    expect(component.nextQuestion.emit).toHaveBeenCalled();
  });

  it('should not call submitAnswer when no submit function is registered', () => {
    spyOn(component.nextQuestion, 'emit');
    currentInteractionServiceSpy.isSubmitAnswerFnRegistered.and.returnValue(
      false
    );

    component.onNextQuestion();

    expect(currentInteractionServiceSpy.submitAnswer).not.toHaveBeenCalled();
    expect(component.nextQuestion.emit).toHaveBeenCalled();
  });

  it('should let submitAnswer errors propagate in onNextQuestion', () => {
    spyOn(component.nextQuestion, 'emit');
    currentInteractionServiceSpy.isSubmitAnswerFnRegistered.and.returnValue(
      true
    );
    currentInteractionServiceSpy.submitAnswer.and.throwError('submit failed');

    expect(() => component.onNextQuestion()).toThrowError('submit failed');
    expect(component.nextQuestion.emit).not.toHaveBeenCalled();
  });

  it('should call submitAnswer and emit submitAssessment on onSubmitAssessment', () => {
    spyOn(component.submitAssessment, 'emit');
    currentInteractionServiceSpy.isSubmitAnswerFnRegistered.and.returnValue(
      true
    );

    component.onSubmitAssessment();

    expect(currentInteractionServiceSpy.submitAnswer).toHaveBeenCalled();
    expect(component.submitAssessment.emit).toHaveBeenCalled();
  });

  it('should not call submitAnswer when no submit function is registered for assessment', () => {
    spyOn(component.submitAssessment, 'emit');
    currentInteractionServiceSpy.isSubmitAnswerFnRegistered.and.returnValue(
      false
    );

    component.onSubmitAssessment();

    expect(currentInteractionServiceSpy.submitAnswer).not.toHaveBeenCalled();
    expect(component.submitAssessment.emit).toHaveBeenCalled();
  });

  it('should let submitAnswer errors propagate in onSubmitAssessment', () => {
    spyOn(component.submitAssessment, 'emit');
    currentInteractionServiceSpy.isSubmitAnswerFnRegistered.and.returnValue(
      true
    );
    currentInteractionServiceSpy.submitAnswer.and.throwError('submit failed');

    expect(() => component.onSubmitAssessment()).toThrowError('submit failed');
    expect(component.submitAssessment.emit).not.toHaveBeenCalled();
  });
});
