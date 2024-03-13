// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the FractionInput interaction.
 */

import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {InteractiveFractionInputComponent} from './oppia-interactive-fraction-input.component';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {TranslateModule} from '@ngx-translate/core';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ObjectsDomainConstants} from 'domain/objects/objects-domain.constants';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';
import {FractionAnswer, InteractionAnswer} from 'interactions/answer-defs';
import {Fraction} from 'domain/objects/fraction.model';

describe('InteractiveFractionInputComponent', () => {
  let component: InteractiveFractionInputComponent;
  let fixture: ComponentFixture<InteractiveFractionInputComponent>;
  let currentInteractionService: CurrentInteractionService;

  class mockInteractionAttributesExtractorService {
    getValuesFromAttributes(
      interactionId: InteractionSpecsKey,
      attributes: Record<string, string>
    ) {
      return {
        requireSimplestForm: {
          value: JSON.parse(attributes.requireSimplestFormWithValue),
        },
        allowImproperFraction: {
          value: JSON.parse(attributes.allowImproperFractionWithValue),
        },
        allowNonzeroIntegerPart: {
          value: JSON.parse(attributes.allowNonzeroIntegerPartWithValue),
        },
        customPlaceholder: {
          value: {
            unicode: attributes.customPlaceholderWithValue,
          },
        },
      };
    }
  }

  let mockCurrentInteractionService = {
    updateViewWithNewAnswer: () => {},
    onSubmit: (
      answer: FractionAnswer,
      rulesService: CurrentInteractionService
    ) => {},
    updateCurrentAnswer: (answer: InteractionAnswer | null): void => {},
    registerCurrentInteraction: (
      submitAnswerFn: Function,
      validateExpressionFn: Function
    ) => {
      submitAnswerFn();
      validateExpressionFn();
    },
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveFractionInputComponent],
      imports: [
        TranslateModule.forRoot({
          useDefaultLang: true,
          isolate: false,
          extend: false,
          defaultLanguage: 'en',
        }),
      ],
      providers: [
        {
          provide: InteractionAttributesExtractorService,
          useClass: mockInteractionAttributesExtractorService,
        },
        {
          provide: CurrentInteractionService,
          useValue: mockCurrentInteractionService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    fixture = TestBed.createComponent(InteractiveFractionInputComponent);
    component = fixture.componentInstance;
    component.requireSimplestFormWithValue = 'true';
    component.allowImproperFractionWithValue = 'true';
    component.allowNonzeroIntegerPartWithValue = 'true';
    component.customPlaceholderWithValue = 'Custom Placeholder';
  });

  it(
    'should initialize component when fraction input interaction is' +
      ' added in the exploration editor',
    () => {
      component.requireSimplestForm = false;
      component.allowImproperFraction = false;
      component.allowNonzeroIntegerPart = false;
      component.customPlaceholder = '';

      component.ngOnInit();

      expect(component.requireSimplestForm).toBe(true);
      expect(component.allowImproperFraction).toBe(true);
      expect(component.allowNonzeroIntegerPart).toBe(true);
      expect(component.customPlaceholder).toBe('Custom Placeholder');
    }
  );

  it(
    'should initialize component when fraction input interaction is' +
      ' added in the exploration editor',
    () => {
      component.savedSolution = {
        isNegative: false,
        wholeNumber: 0,
        numerator: 1,
        denominator: 3,
      };

      expect(component.answer).toBe('');

      component.ngOnInit();

      expect(component.answer).toBe('1/3');
    }
  );

  it(
    'should display INVALID_CHARS_LENGTH error message when input' +
      ' fraction has more than 7 charaters in a number while user is typing',
    fakeAsync(() => {
      const updateCurrentAnswerSpy = spyOn(
        currentInteractionService,
        'updateCurrentAnswer'
      );
      component.answer = '123';
      component.answerValueChanged();
      component.answer = '12345678';

      expect(component.errorMessageI18nKey).toBe('');
      expect(component.isValid).toBe(true);
      component.answerValueChanged();
      tick(150);

      expect(component.errorMessageI18nKey).toBe(
        ObjectsDomainConstants.FRACTION_PARSING_ERROR_I18N_KEYS
          .INVALID_CHARS_LENGTH
      );
      expect(component.isValid).toBe(false);
      expect(updateCurrentAnswerSpy.calls.allArgs()).toEqual([
        ['123'],
        ['12345678'],
      ]);
    })
  );

  it(
    'should display INVALID_CHARS error message when input' +
      ' fraction has invalid characters while user is typing',
    fakeAsync(() => {
      const updateCurrentAnswerSpy = spyOn(
        currentInteractionService,
        'updateCurrentAnswer'
      );
      component.answer = '?2';
      component.answerValueChanged();
      component.answer = '??2';

      expect(component.errorMessageI18nKey).toBe('');
      expect(component.isValid).toBe(true);
      component.answerValueChanged();
      tick(150);

      expect(component.errorMessageI18nKey).toBe(
        ObjectsDomainConstants.FRACTION_PARSING_ERROR_I18N_KEYS.INVALID_CHARS
      );
      expect(component.isValid).toBe(false);
      expect(updateCurrentAnswerSpy.calls.allArgs()).toEqual([['?2'], ['??2']]);
    })
  );

  it(
    'should display INVALID_FORMAT error message when input' +
      ' fraction is in a incorrect format while user is typing',
    fakeAsync(() => {
      const updateCurrentAnswerSpy = spyOn(
        currentInteractionService,
        'updateCurrentAnswer'
      );
      component.answer = '2';

      component.answerValueChanged();

      expect(component.errorMessageI18nKey).toBe('');
      expect(component.isValid).toBe(true);

      component.answer = '2 / 4 / 5';
      component.answerValueChanged();
      tick(150);
      expect(component.errorMessageI18nKey).toBe(
        ObjectsDomainConstants.FRACTION_PARSING_ERROR_I18N_KEYS.INVALID_FORMAT
      );
      expect(component.isValid).toBe(false);
      expect(updateCurrentAnswerSpy.calls.allArgs()).toEqual([
        ['2'],
        ['2 / 4 / 5'],
      ]);
    })
  );

  it(
    'should not display error message when input' +
      ' fraction is correct while user is typing',
    fakeAsync(() => {
      const updateCurrentAnswerSpy = spyOn(
        currentInteractionService,
        'updateCurrentAnswer'
      );
      component.answer = '2';
      component.answerValueChanged();
      component.answer = '2/3';
      component.isValid = false;
      component.errorMessageI18nKey = 'error';

      component.answerValueChanged();
      tick(150);

      expect(component.errorMessageI18nKey).toBe('');
      expect(component.isValid).toBe(true);
      expect(updateCurrentAnswerSpy.calls.allArgs()).toEqual([['2'], ['2/3']]);
    })
  );

  it(
    'should display simplest form error message when input' +
      ' fraction is not in its simplest form after user submits',
    () => {
      component.requireSimplestForm = true;
      component.answer = '2/6';

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe(
        'I18N_INTERACTIONS_FRACTIONS_SIMPLEST_FORM'
      );
      expect(component.isValid).toBe(false);
    }
  );

  it(
    'should display improper fraction error message when input' +
      ' fraction is not a proper fraction after user submits',
    () => {
      component.allowImproperFraction = false;
      component.answer = '5/3';

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe(
        'I18N_INTERACTIONS_FRACTIONS_PROPER_FRACTION'
      );
      expect(component.isValid).toBe(false);
    }
  );

  it(
    'should display fraction error message when input' +
      ' fraction has a non zero integer part after user submits',
    () => {
      component.allowNonzeroIntegerPart = false;
      component.answer = '1 1/3';

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe(
        'I18N_INTERACTIONS_FRACTIONS_NON_MIXED'
      );
      expect(component.isValid).toBe(false);
    }
  );

  it(
    'should not display error message when input' +
      ' fraction is valid after user submits.',
    () => {
      component.answer = '1/3';
      spyOn(currentInteractionService, 'onSubmit');

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe('');
      expect(currentInteractionService.onSubmit).toHaveBeenCalled();
      expect(component.isValid).toBe(true);
    }
  );

  it('should throw uncaught errors that are not Error type', waitForAsync(() => {
    spyOn(Fraction, 'fromRawInputString').and.callFake(() => {
      throw TypeError;
    });

    expect(() => {
      component.submitAnswer();
      // The eslint error is suppressed since we need to test if
      // just a string was thrown.
      // eslint-disable-next-line oppia/no-to-throw
    }).toThrow(TypeError);
  }));

  it('should get no integer placeholder text when interaction loads', () => {
    component.allowNonzeroIntegerPart = false;

    expect(component.getPlaceholderText()).toEqual(
      'I18N_INTERACTIONS_FRACTIONS_INPUT_PLACEHOLDER_NO_INTEGER'
    );
  });

  it(
    'should get fraction input placeholder text when interaction' + ' loads',
    () => {
      expect(component.allowNonzeroIntegerPart).toBe(true);

      expect(component.getPlaceholderText()).toEqual(
        'I18N_INTERACTIONS_FRACTIONS_INPUT_PLACEHOLDER'
      );
    }
  );

  // This is to test the isAnswerValid function which is passed
  // to currentInteractionService.registerCurrentInteraction.
  it('should return true if answer is valid', () => {
    expect(component.allowNonzeroIntegerPart).toBe(true);
    component.isValid = true;
    component.answer = '1/3';

    expect(component.isAnswerValid()).toBe(true);
  });

  // This is to test the isAnswerValid function which is passed
  // to currentInteractionService.registerCurrentInteraction.
  it('should return false if answer is invalid', () => {
    expect(component.allowNonzeroIntegerPart).toBe(true);
    component.isValid = false;
    component.answer = '1/3';

    expect(component.isAnswerValid()).toBe(false);
  });

  it('should return false if answer is empty', () => {
    expect(component.allowNonzeroIntegerPart).toBe(true);
    component.isValid = false;
    component.answer = '';

    expect(component.isAnswerValid()).toBe(false);
  });

  it('should unsubscribe when component is destroyed', function () {
    spyOn(component.componentSubscriptions, 'unsubscribe').and.callThrough();

    expect(component.componentSubscriptions.closed).toBe(false);

    component.ngOnDestroy();

    expect(component.componentSubscriptions.unsubscribe).toHaveBeenCalled();
    expect(component.componentSubscriptions.closed).toBe(true);
  });
});
