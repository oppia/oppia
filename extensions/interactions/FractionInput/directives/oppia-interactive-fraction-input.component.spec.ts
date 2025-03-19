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
    updateAnswerIsValid(isValid: boolean) {},
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
    'should update the current answer with debounce' +
      'when user types valid input',
    fakeAsync(() => {
      const updateCurrentAnswerSpy = spyOn(
        currentInteractionService,
        'updateCurrentAnswer'
      );
      component.answer = '2';
      component.answerValueChanged();
      component.answer = '2/3';
      component.answerValueChanged();
      tick(150);

      expect(updateCurrentAnswerSpy).toHaveBeenCalledWith('2/3');
    })
  );

  it(
    'should display invalid format error when' +
      'empty answer after user submits.',
    () => {
      component.answer = '';
      spyOn(currentInteractionService, 'updateAnswerIsValid');

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe(
        'I18N_INTERACTIONS_FRACTIONS_INVALID_FORMAT'
      );
      expect(
        currentInteractionService.updateAnswerIsValid
      ).toHaveBeenCalledWith(false);
    }
  );

  it(
    'should display invalid characters error when' +
      ' invalid character are submitted and not allowed',
    () => {
      component.answer = '3a/4';
      spyOn(currentInteractionService, 'updateAnswerIsValid');

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe(
        ObjectsDomainConstants.FRACTION_PARSING_ERROR_I18N_KEYS.INVALID_CHARS
      );
      expect(component.isValid).toBeFalse();
    }
  );

  it(
    'should display invalid format error when' +
      'double slashes are submitted and not allowed',
    () => {
      component.answer = '2//3';
      spyOn(currentInteractionService, 'updateAnswerIsValid');

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe(
        ObjectsDomainConstants.FRACTION_PARSING_ERROR_I18N_KEYS.INVALID_FORMAT
      );
      expect(component.isValid).toBeFalse();
    }
  );

  it(
    'should not display error message when negative' +
      ' input fraction is valid after user submits',
    () => {
      component.answer = '-1 2/3';
      spyOn(currentInteractionService, 'onSubmit');

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe('');
      expect(currentInteractionService.onSubmit).toHaveBeenCalled();
    }
  );

  it(
    'should correctly initialize answer' +
      'when saved solution contains negative mixed number',
    () => {
      component.savedSolution = {
        isNegative: true,
        wholeNumber: 1,
        numerator: 2,
        denominator: 3,
      };

      component.ngOnInit();

      expect(component.answer).toBe('-1 2/3');
    }
  );

  it('should reset validity status when user modifies answer input', fakeAsync(() => {
    component.answer = 'invalid';
    component.answerValueChanged();
    tick(150);

    expect(component.isValid).toBeTrue();
  }));

  it(
    'should display proper fraction error' +
      'when improper fraction is submitted and not allowed',
    () => {
      component.allowImproperFraction = false;
      component.answer = '4/3';

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe(
        'I18N_INTERACTIONS_FRACTIONS_PROPER_FRACTION'
      );
    }
  );

  it(
    'should display non-mixed error' +
      'when mixed number is submitted and integer parts are disallowed',
    () => {
      component.allowNonzeroIntegerPart = false;
      component.answer = '1 1/2';

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe(
        'I18N_INTERACTIONS_FRACTIONS_NON_MIXED'
      );
    }
  );

  it('should display invalid length error when number exceeds 7 digits', () => {
    component.answer = '12345678/1';

    component.submitAnswer();

    expect(component.errorMessageI18nKey).toBe(
      ObjectsDomainConstants.FRACTION_PARSING_ERROR_I18N_KEYS
        .INVALID_CHARS_LENGTH
    );
  });

  it(
    'should display simplest form error message when input' +
      ' fraction is not in its simplest form after user submits',
    () => {
      component.requireSimplestForm = true;
      component.answer = '2/6';

      spyOn(currentInteractionService, 'updateAnswerIsValid');

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe(
        'I18N_INTERACTIONS_FRACTIONS_SIMPLEST_FORM'
      );
      expect(component.isValid).toBe(false);
      expect(
        currentInteractionService.updateAnswerIsValid
      ).toHaveBeenCalledWith(false);
    }
  );

  it(
    'should display improper fraction error message when input' +
      ' fraction is not a proper fraction after user submits',
    () => {
      component.allowImproperFraction = false;
      component.answer = '5/3';

      spyOn(currentInteractionService, 'updateAnswerIsValid');

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe(
        'I18N_INTERACTIONS_FRACTIONS_PROPER_FRACTION'
      );
      expect(component.isValid).toBe(false);
      expect(
        currentInteractionService.updateAnswerIsValid
      ).toHaveBeenCalledWith(false);
    }
  );

  it(
    'should display fraction error message when input' +
      ' fraction has a non zero integer part after user submits',
    () => {
      component.allowNonzeroIntegerPart = false;
      component.answer = '1 1/3';

      spyOn(currentInteractionService, 'updateAnswerIsValid');

      component.submitAnswer();

      expect(component.errorMessageI18nKey).toBe(
        'I18N_INTERACTIONS_FRACTIONS_NON_MIXED'
      );
      expect(component.isValid).toBe(false);
      expect(
        currentInteractionService.updateAnswerIsValid
      ).toHaveBeenCalledWith(false);
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
