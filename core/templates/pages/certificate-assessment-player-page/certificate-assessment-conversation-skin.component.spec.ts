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
import {MockTranslatePipe} from 'tests/unit-test-utils';

import {CertificateAssessmentConversationSkinComponent} from './certificate-assessment-conversation-skin.component';

describe('CertificateAssessmentConversationSkinComponent', () => {
  let component: CertificateAssessmentConversationSkinComponent;
  let fixture: ComponentFixture<CertificateAssessmentConversationSkinComponent>;
  let urlInterpolationServiceSpy: jasmine.SpyObj<UrlInterpolationService>;

  const multipleChoiceQuestion = {
    id: 'q1',
    type: 'multiple_choice' as const,
    prompt: 'What is 2 + 2?',
    hint: 'Choose one option.',
    options: [
      {id: 'a', text: '3'},
      {id: 'b', text: '4'},
    ],
    correctAnswerText: '4',
  };

  const numericQuestion = {
    id: 'q2',
    type: 'numeric_input' as const,
    prompt: 'What is 6 + 6?',
    hint: 'Enter a number.',
    options: [],
    placeholder: '0',
    correctAnswerText: '12',
  };

  beforeEach(async () => {
    urlInterpolationServiceSpy = jasmine.createSpyObj(
      'UrlInterpolationService',
      ['getStaticCopyrightedImageUrl']
    );
    urlInterpolationServiceSpy.getStaticCopyrightedImageUrl.and.returnValue(
      '/static/avatar.svg'
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
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(
      CertificateAssessmentConversationSkinComponent
    );
    component = fixture.componentInstance;
    component.currentQuestion = multipleChoiceQuestion;
  });

  it('should initialize the avatar URL and hydrate multiple-choice responses on init', () => {
    component.savedResponse = 'a,b';

    component.ngOnInit();

    expect(
      urlInterpolationServiceSpy.getStaticCopyrightedImageUrl
    ).toHaveBeenCalledWith('/avatar/oppia_avatar_100px.svg');
    expect(component.OPPIA_AVATAR_IMAGE_URL).toBe('/static/avatar.svg');
    expect(component.isOptionSelected('a')).toBeTrue();
    expect(component.isOptionSelected('b')).toBeTrue();
    expect(component.isOptionSelected('c')).toBeFalse();
  });

  it('should clear response state when savedResponse is empty during ngOnChanges', () => {
    component.selectedOptionIds = ['a'];
    component.freeResponse = 'old value';

    component.ngOnChanges({
      savedResponse: {
        currentValue: '',
        previousValue: 'a',
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.selectedOptionIds).toEqual([]);
    expect(component.freeResponse).toBe('');
  });

  it('should hydrate free response values for non-choice questions', () => {
    component.currentQuestion = numericQuestion;
    component.savedResponse = '12';

    component.ngOnChanges({
      currentQuestion: {
        currentValue: numericQuestion,
        previousValue: multipleChoiceQuestion,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.freeResponse).toBe('12');
    expect(component.selectedOptionIds).toEqual([]);
  });

  it('should hydrate multiple-select responses on init', () => {
    component.currentQuestion = {
      id: 'q3',
      type: 'multiple_select',
      prompt: 'Select all prime numbers.',
      hint: 'Choose all that apply.',
      options: [
        {id: 'a', text: '2'},
        {id: 'b', text: '3'},
        {id: 'c', text: '4'},
      ],
      correctAnswerText: '2,3',
    };
    component.savedResponse = 'a,b';

    component.ngOnInit();

    expect(component.isOptionSelected('a')).toBeTrue();
    expect(component.isOptionSelected('b')).toBeTrue();
    expect(component.isOptionSelected('c')).toBeFalse();
  });

  it('should bind the free-response label to a stable input id', () => {
    component.currentQuestion = numericQuestion;
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector(
      '.certificate-assessment-free-response-label'
    ) as HTMLLabelElement;
    const input = fixture.nativeElement.querySelector(
      '.certificate-assessment-free-response-input'
    ) as HTMLInputElement;

    expect(label.getAttribute('for')).toBe(
      'certificate-assessment-free-response-input-q2'
    );
    expect(input.getAttribute('id')).toBe(
      'certificate-assessment-free-response-input-q2'
    );
  });

  it('should return the expected input type for each question type', () => {
    component.currentQuestion = numericQuestion;
    expect(component.getQuestionInputType()).toBe('number');

    component.currentQuestion = multipleChoiceQuestion;
    expect(component.getQuestionInputType()).toBe('text');
  });

  it('should emit selection changes for single-choice answers', () => {
    spyOn(component.responseChange, 'emit');

    component.selectSingleChoice('b');

    expect(component.selectedOptionIds).toEqual(['b']);
    expect(component.responseChange.emit).toHaveBeenCalledWith('b');
  });

  it('should add and remove options for multiple select answers', () => {
    spyOn(component.responseChange, 'emit');

    component.selectedOptionIds = ['a'];
    component.toggleMultipleSelect('b');

    expect(component.selectedOptionIds).toEqual(['a', 'b']);
    expect(component.responseChange.emit).toHaveBeenCalledWith('a,b');

    component.toggleMultipleSelect('a');

    expect(component.selectedOptionIds).toEqual(['b']);
    expect(component.responseChange.emit).toHaveBeenCalledWith('b');
  });

  it('should emit free response updates and navigation events', () => {
    spyOn(component.responseChange, 'emit');
    spyOn(component.previousQuestion, 'emit');
    spyOn(component.nextQuestion, 'emit');
    spyOn(component.submitAssessment, 'emit');

    component.updateFreeResponse('Triangle');
    component.onPreviousQuestion();
    component.onNextQuestion();
    component.onSubmitAssessment();

    expect(component.freeResponse).toBe('Triangle');
    expect(component.responseChange.emit).toHaveBeenCalledWith('Triangle');
    expect(component.previousQuestion.emit).toHaveBeenCalled();
    expect(component.nextQuestion.emit).toHaveBeenCalled();
    expect(component.submitAssessment.emit).toHaveBeenCalled();
  });
});
