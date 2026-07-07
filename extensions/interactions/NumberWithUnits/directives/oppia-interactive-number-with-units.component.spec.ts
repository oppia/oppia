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
 * @fileoverview Unit tests for the NumberWithUnits interaction.
 */

import {
  waitForAsync,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {InteractiveNumberWithUnitsComponent} from './oppia-interactive-number-with-units.component';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {NumberConversionService} from 'services/number-conversion.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {NumberWithUnits} from 'domain/objects/number-with-units.model';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  InteractionAnswer,
  NumberWithUnitsAnswer,
} from 'interactions/answer-defs';

describe('Number with units interaction component', () => {
  let component: InteractiveNumberWithUnitsComponent;
  let fixture: ComponentFixture<InteractiveNumberWithUnitsComponent>;
  let currentInteractionService: CurrentInteractionService;
  let ngbModal: NgbModal;

  let mockCurrentInteractionService = {
    updateViewWithNewAnswer: () => {},
    onSubmit: (
      answer: NumberWithUnitsAnswer,
      rulesService: CurrentInteractionService
    ) => {},
    showNoResponseError: (): boolean => false,
    updateCurrentAnswer: (answer: InteractionAnswer) => {},
    updateAnswerIsValid: (answer: boolean) => {},
    registerCurrentInteraction: (
      submitAnswerFn: Function,
      validateExpressionFn: Function
    ) => {
      submitAnswerFn();
      validateExpressionFn();
    },
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveNumberWithUnitsComponent],
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
          provide: CurrentInteractionService,
          useValue: mockCurrentInteractionService,
        },
        NumberConversionService,
        I18nLanguageCodeService,
        NgbModal,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    ngbModal = TestBed.inject(NgbModal);
    fixture = TestBed.createComponent(InteractiveNumberWithUnitsComponent);
    component = fixture.componentInstance;
  });

  it('should initialise component when user adds or plays interaction', () => {
    spyOn(NumberWithUnits, 'createCurrencyUnits');
    spyOn(currentInteractionService, 'registerCurrentInteraction');

    component.ngOnInit();

    expect(component.answer).toBe('');
    expect(NumberWithUnits.createCurrencyUnits).toHaveBeenCalled();
    expect(
      currentInteractionService.registerCurrentInteraction
    ).toHaveBeenCalled();
  });

  it('should not display warning when the answer format is correct', fakeAsync(() => {
    spyOn(currentInteractionService, 'updateCurrentAnswer');
    component.errorMessageI18nKey = 'Unit "xyz" not found';
    component.isValid = false;

    // PreChecks.
    expect(component.errorMessageI18nKey).toBe('Unit "xyz" not found');
    expect(component.isValid).toBe(false);

    // Test: Correct answer.
    component.answer = '24 km';

    component.answerValueChanged();
    tick(150);

    // PostChecks: The format of the answer '24 km' is correct,
    // Therefore we verify that the value of errorMessage is ''.
    expect(component.errorMessageI18nKey).toBe('');
    expect(component.isValid).toBe(true);
    expect(currentInteractionService.updateCurrentAnswer).toHaveBeenCalledWith(
      '24 km'
    );
    expect(currentInteractionService.updateCurrentAnswer).toHaveBeenCalledTimes(
      1
    );
  }));

  it("should close help modal when user clicks the 'close' button", () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject('close'),
    } as NgbModalRef);

    component.showHelp();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it("should display help modal when user clicks the 'help' button", () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve('confirm'),
    } as NgbModalRef);

    component.showHelp();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should return false if the answer is invalid', () => {
    component.answer = '';
    component.isValid = false;

    expect(component.isAnswerValid()).toBe(false);
  });

  it('should save solution when user saves solution', () => {
    component.savedSolution = {
      type: 'real',
      real: 24,
      fraction: {
        isNegative: false,
        wholeNumber: 0,
        numerator: 0,
        denominator: 1,
      },
      units: [
        {
          unit: 'km',
          exponent: 1,
        },
      ],
    };
    component.answer = '';

    component.ngOnInit();

    expect(component.answer).toBe('24 km');
  });

  it('should show error when user submits answer in incorrect format', () => {
    component.answer = '24 k';
    spyOn(currentInteractionService, 'showNoResponseError');
    spyOn(currentInteractionService, 'updateAnswerIsValid');

    expect(component.errorMessageI18nKey).toBe('');

    component.submitAnswer();

    expect(component.errorMessageI18nKey).toBe('Unit "k" not found.');
    expect(currentInteractionService.updateAnswerIsValid).toHaveBeenCalledWith(
      false
    );
    expect(
      currentInteractionService.showNoResponseError
    ).not.toHaveBeenCalled();
  });

  it('should show no response error when answer is empty', () => {
    component.answer = '';
    spyOn(currentInteractionService, 'showNoResponseError').and.returnValue(
      true
    );
    spyOn(currentInteractionService, 'updateAnswerIsValid');
    expect(component.errorMessageI18nKey).toBe('');

    component.submitAnswer();

    expect(component.errorMessageI18nKey).toBe(
      'I18N_INTERACTIONS_INPUT_NO_RESPONSE'
    );
    expect(currentInteractionService.updateAnswerIsValid).toHaveBeenCalledWith(
      false
    );
    expect(currentInteractionService.showNoResponseError).toHaveBeenCalledTimes(
      1
    );
  });

  it('should submit answer if answer is correct', () => {
    component.answer = '24 km';
    spyOn(currentInteractionService, 'showNoResponseError');
    spyOn(NumberWithUnits, 'fromRawInputString');
    spyOn(currentInteractionService, 'onSubmit');

    component.submitAnswer();

    expect(component.errorMessageI18nKey).toBe('');
    expect(
      currentInteractionService.showNoResponseError
    ).not.toHaveBeenCalled();
    expect(NumberWithUnits.fromRawInputString).toHaveBeenCalled();
    expect(currentInteractionService.onSubmit).toHaveBeenCalled();
  });

  it('should throw uncaught errors that are not Error type', waitForAsync(() => {
    spyOn(NumberWithUnits, 'fromRawInputString').and.callFake(() => {
      throw TypeError;
    });

    expect(() => {
      component.submitAnswer();
      // The eslint error is suppressed since we need to test if
      // just a string was thrown.
      // eslint-disable-next-line oppia/no-to-throw
    }).toThrow(TypeError);
  }));

  it('should unsubscribe when component is destroyed', function () {
    spyOn(component.componentSubscriptions, 'unsubscribe').and.callThrough();

    expect(component.componentSubscriptions.closed).toBe(false);

    component.ngOnDestroy();

    expect(component.componentSubscriptions.unsubscribe).toHaveBeenCalled();
    expect(component.componentSubscriptions.closed).toBe(true);
  });

  it('should correctly parse number with comma as decimal separator', () => {
    const i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    i18nLanguageCodeService.setI18nLanguageCode('pt-br');

    component.answer = '1,2 hr';
    spyOn(currentInteractionService, 'onSubmit');

    component.submitAnswer();

    expect(component.errorMessageI18nKey).toBe('');
    expect(currentInteractionService.onSubmit).toHaveBeenCalled();
  });
});
