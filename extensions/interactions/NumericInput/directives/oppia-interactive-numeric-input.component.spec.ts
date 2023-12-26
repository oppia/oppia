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
 * @fileoverview Unit tests for the NumericInput interaction.
 */


import { ChangeDetectorRef } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { TranslateModule } from '@ngx-translate/core';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { InteractiveNumericInput } from './oppia-interactive-numeric-input.component';
import { TranslateService } from '@ngx-translate/core';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';
import { InteractionAnswer, NumericInputAnswer } from 'interactions/answer-defs';

class MockTranslateService {
  instant(key: string): string | undefined {
    if (key === 'I18N_INTERACTIONS_NUMERIC_INPUT_LESS_THAN_ZERO') {
      return (
        'The answer should be greater than or equal to zero. ' +
        'It should not contain minus symbol (-).'
      );
    } else if (
      key === 'I18N_INTERACTIONS_NUMERIC_INPUT_GREATER_THAN_15_DIGITS'
    ) {
      return (
        'The answer can contain at most 15 digits (0-9) ' +
        'excluding symbols (. or -).'
      );
    }
  }
}

describe('InteractiveNumericInput', () => {
  let component: InteractiveNumericInput;
  let fixture: ComponentFixture<InteractiveNumericInput>;
  let currentInteractionService: CurrentInteractionService;

  class mockInteractionAttributesExtractorService {
    getValuesFromAttributes(
        interactionId: InteractionSpecsKey, attributes: Record<string, string>
    ) {
      return {
        requireNonnegativeInput: {
          value: false
        }
      };
    }
  }

  let mockCurrentInteractionService = {
    onSubmit: (
        answer: NumericInputAnswer, rulesService: CurrentInteractionService
    ) => {},
    updateCurrentAnswer: (answer: InteractionAnswer) => {},
    showNoResponseError: (): boolean => false,
    registerCurrentInteraction: (
        submitAnswerFn: Function, validateExpressionFn: Function) => {
      submitAnswerFn();
      validateExpressionFn();
    }
  };


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveNumericInput],
      imports: [
        TranslateModule.forRoot({
          useDefaultLang: true,
          isolate: false,
          extend: false,
          defaultLanguage: 'en'
        })
      ],
      providers: [
        {
          provide: InteractionAttributesExtractorService,
          useClass: mockInteractionAttributesExtractorService
        },
        {
          provide: CurrentInteractionService,
          useValue: mockCurrentInteractionService
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    currentInteractionService = TestBed.get(CurrentInteractionService);
    fixture = TestBed.createComponent(InteractiveNumericInput);
    component = fixture.componentInstance;
    component.requireNonnegativeInputWithValue = 'false';
  });

  it('should initialise component when user adds interaction', () => {
    spyOn(currentInteractionService, 'registerCurrentInteraction').and
      .callThrough();

    component.ngOnInit();
    component.requireNonnegativeInput = false;

    expect(component.answer).toBe('');
    expect(component.labelForFocusTarget).toBeUndefined();
    expect(component.requireNonnegativeInput).toEqual(false);
    expect(component.NUMERIC_INPUT_FORM_SCHEMA).toEqual({
      type: 'float',
      ui_config: {
        checkRequireNonnegativeInput: false
      }
    });
    expect(component.errorMessageI18nKey).toBe('');
    expect(currentInteractionService.registerCurrentInteraction)
      .toHaveBeenCalled();
  });

  it('should initialise with values when user submits answer', () => {
    spyOn(currentInteractionService, 'registerCurrentInteraction').and
      .callThrough();
    component.savedSolution = 20;
    component.labelForFocusTarget = 'label';

    component.ngOnInit();

    expect(component.savedSolution).toBe(20);
    expect(component.labelForFocusTarget).toBe('label');
    expect(component.requireNonnegativeInput).toEqual(false);
    expect(component.requireNonnegativeInputWithValue).toEqual(
      'false');
    expect(component.NUMERIC_INPUT_FORM_SCHEMA).toEqual({
      type: 'float',
      ui_config: {
        checkRequireNonnegativeInput: false
      }
    });
    expect(currentInteractionService.registerCurrentInteraction)
      .toHaveBeenCalled();
  });

  it('should return label for focus target when called', () => {
    component.labelForFocusTarget = 'label';

    expect(component.getLabelForFocusTarget()).toBe('label');
  });

  it('should return SCHEMA when called', () => {
    component.ngOnInit();

    expect(component.requireNonnegativeInput).toEqual(false);
    expect(component.getSchema()).toEqual({
      type: 'float',
      ui_config: {
        checkRequireNonnegativeInput: false
      }
    });
  });

  it('should update answer when user enter a new answer', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    const updateCurrentAnswerSpy = spyOn(
      currentInteractionService, 'updateCurrentAnswer');
    component.answer = 20;

    component.onAnswerChange(25);

    expect(component.answer).toBe(25);
    expect(detectChangesSpy).toHaveBeenCalled();
    expect(updateCurrentAnswerSpy).toHaveBeenCalledOnceWith(25);
  });

  it('should not update answer when user does not update the answer', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    component.answer = 20;

    component.onAnswerChange(20);

    expect(component.answer).toBe(20);
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });

  it('should set an error when user submits with no response', () => {
    spyOn(
      currentInteractionService, 'showNoResponseError').and.returnValue(true);
    const onSubmitSpy = spyOn(currentInteractionService, 'onSubmit');

    component.ngOnInit();
    component.requireNonnegativeInput = false;
    component.submitAnswer('');

    expect(component.errorMessageI18nKey).toBe(
      'I18N_INTERACTIONS_NUMERIC_INPUT_NO_RESPONSE');
    expect(onSubmitSpy).not.toHaveBeenCalled();
  });
});
