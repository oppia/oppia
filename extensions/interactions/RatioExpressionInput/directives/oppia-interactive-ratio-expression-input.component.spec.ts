// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the RatioExpressionInput interactive
 * component.
 */

import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { InteractiveRatioExpressionInputComponent } from './oppia-interactive-ratio-expression-input.component';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';
import { RatioInputAnswer } from 'interactions/answer-defs';

describe('InteractiveRatioExpressionInput', () => {
  let component: InteractiveRatioExpressionInputComponent;
  let fixture: ComponentFixture<InteractiveRatioExpressionInputComponent>;
  let currentInteractionService: CurrentInteractionService;

  class MockInteractionAttributesExtractorService {
    getValuesFromAttributes(
        interactionId: InteractionSpecsKey, attributes: Record<string, string>
    ) {
      return {
        numberOfTerms: {
          value: JSON.parse(attributes.numberOfTermsWithValue)
        },
        placeholder: {
          value: {
            unicode: attributes.placeholderWithValue}
        },
      };
    }
  }

  let mockCurrentInteractionService = {
    updateViewWithNewAnswer: () => {},
    onSubmit: (
        answer: RatioInputAnswer, rulesService: CurrentInteractionService
    ) => {},
    updateCurrentAnswer: (): boolean => false,
    registerCurrentInteraction: (
        submitAnswerFn: Function, validateExpressionFn: Function) => {
      submitAnswerFn();
      validateExpressionFn();
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        InteractiveRatioExpressionInputComponent,
        MockTranslatePipe
      ],
      imports: [],
      providers: [
        {
          provide: InteractionAttributesExtractorService,
          useClass: MockInteractionAttributesExtractorService
        },
        {
          provide: CurrentInteractionService,
          useValue: mockCurrentInteractionService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  describe('without saved solution', function() {
    beforeEach(() => {
      currentInteractionService = TestBed.inject(CurrentInteractionService);
      fixture = (
        TestBed.createComponent(InteractiveRatioExpressionInputComponent));
      component = fixture.componentInstance;
      component.numberOfTermsWithValue = '3';
      component.placeholderWithValue = 'Enter ratio here';
      component.errorMessageI18nKey = '';
      component.labelForFocusTarget = 'label';
      component.answer = '';
      component.isValid = true;
    });

    it('should init the component', function() {
      spyOn(currentInteractionService, 'registerCurrentInteraction');

      component.ngOnInit();

      expect(component.answer).toEqual('');
      expect(component.placeholder).toEqual('Enter ratio here');
      expect(component.expectedNumberOfTerms).toEqual(3);
      expect(
        currentInteractionService.registerCurrentInteraction
      ).toHaveBeenCalled();
    });

    it('should raise error if invalid answer is submitted', function() {
      component.ngOnInit();
      component.answer = '2:3';
      component.isValid = false;
      spyOn(currentInteractionService, 'onSubmit');
      component.submitAnswer();
      expect(component.errorMessageI18nKey).toEqual(
        'I18N_INTERACTIONS_TERMS_LIMIT');
      expect(currentInteractionService.onSubmit).not.toHaveBeenCalled();
      expect(component.isAnswerValid()).toBe(false);
    });

    it('should submit the answer if valid', function() {
      component.ngOnInit();
      component.answer = '2:3:4';
      spyOn(currentInteractionService, 'onSubmit');
      component.submitAnswer();
      expect(
        currentInteractionService.onSubmit).toHaveBeenCalled();
      expect(component.isAnswerValid()).toBe(true);
    });
  });

  describe('with saved solution', function() {
    beforeEach(() => {
      currentInteractionService = TestBed.inject(CurrentInteractionService);
      fixture = (
        TestBed.createComponent(InteractiveRatioExpressionInputComponent));
      component = fixture.componentInstance;
      component.numberOfTermsWithValue = '3';
      component.placeholderWithValue = 'Enter ratio here';
      component.errorMessageI18nKey = '';
      component.labelForFocusTarget = 'label';
      component.answer = '';
      component.savedSolution = [1, 2, 3];
      component.isValid = true;
    });

    it('should populate answer with solution if provided', function() {
      component.ngOnInit();
      expect(component.answer).toEqual('1:2:3');
    });

    it('should not display error message before user' +
    ' submit answer', fakeAsync(() => {
      const updateCurrentAnswerSpy = spyOn(
        currentInteractionService, 'updateCurrentAnswer');
      component.answer = '1';
      component.answerValueChanged();
      component.answer = '1:2:3';
      component.isValid = false;
      component.errorMessageI18nKey = 'error';

      component.answerValueChanged();
      tick(150);

      expect(component.errorMessageI18nKey).toBe('');
      expect(component.isValid).toBe(true);
      expect(
        updateCurrentAnswerSpy.calls.allArgs()).toEqual([['1'], ['1:2:3']]);
    }));

    it('should unsubscribe when component is destroyed', function() {
      spyOn(component.componentSubscriptions, 'unsubscribe').and.callThrough();

      expect(component.componentSubscriptions.closed).toBe(false);

      component.ngOnDestroy();

      expect(component.componentSubscriptions.unsubscribe).toHaveBeenCalled();
      expect(component.componentSubscriptions.closed).toBe(true);
    });
  });
});
