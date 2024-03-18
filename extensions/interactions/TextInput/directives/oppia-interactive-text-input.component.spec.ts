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
 * @fileoverview Unit tests for the TextInput interaction.
 */

import {NO_ERRORS_SCHEMA, ChangeDetectorRef} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {InteractionAnswer, TextInputAnswer} from 'interactions/answer-defs';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';
import {InteractiveTextInputComponent} from './oppia-interactive-text-input.component';

describe('InteractiveTextInputComponent', () => {
  let component: InteractiveTextInputComponent;
  let fixture: ComponentFixture<InteractiveTextInputComponent>;
  let currentInteractionService: CurrentInteractionService;

  class mockInteractionAttributesExtractorService {
    getValuesFromAttributes(
      interactionId: InteractionSpecsKey,
      attributes: Record<string, string>
    ) {
      return {
        placeholder: {
          value: {
            unicode: attributes.placeholderWithValue,
          },
        },
        rows: {
          value: attributes.rowsWithValue,
        },
        catchMisspellings: {
          value: attributes.catchMisspellingsWithValue,
        },
      };
    }
  }

  let mockCurrentInteractionService = {
    onSubmit: (
      answer: TextInputAnswer,
      rulesService: CurrentInteractionService
    ) => {},
    updateCurrentAnswer: (answer: InteractionAnswer): void => {},
    showNoResponseError: (): boolean => false,
    registerCurrentInteraction: (
      submitAnswer: Function,
      validateExpressionFn: Function
    ) => {
      submitAnswer();
      validateExpressionFn();
    },
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveTextInputComponent],
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
    fixture = TestBed.createComponent(InteractiveTextInputComponent);
    component = fixture.componentInstance;

    component.placeholderWithValue = 'Placeholder text';
    component.rowsWithValue = '2';
    component.catchMisspellingsWithValue = 'false';
  });

  it('should initialise when the user saves the interaction', () => {
    spyOn(
      currentInteractionService,
      'registerCurrentInteraction'
    ).and.callThrough();
    component.labelForFocusTarget = 'label';

    component.ngOnInit();

    expect(component.placeholder).toBe('Placeholder text');
    expect(component.rows).toBe('2');
    expect(component.catchMisspellings).toBe('false');
    expect(component.answer).toBe('');
    expect(component.labelForFocusTarget).toBe('label');
    expect(component.schema).toEqual({
      type: 'unicode',
      ui_config: {
        rows: '2',
        placeholder: 'Placeholder text',
        catchMisspellings: 'false',
      },
    });
    // We cannot test what functions are exactly passed since anonymous
    // functions are passed as arguments in registerCurrentInteraction.
    expect(
      currentInteractionService.registerCurrentInteraction
    ).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function));
  });

  it('should save solution when user saves solution for the interaction', () => {
    component.savedSolution = 'saved solution';

    component.ngOnInit();

    expect(component.answer).toBe('saved solution');
  });

  it('should return schema when called', () => {
    component.schema = {
      type: 'unicode',
      ui_config: {
        rows: 2,
        placeholder: 'Placeholder text',
        catchMisspellings: false,
      },
    };

    expect(component.getSchema()).toEqual({
      type: 'unicode',
      ui_config: {
        rows: 2,
        placeholder: 'Placeholder text',
        catchMisspellings: false,
      },
    });
  });

  it('should return label for focus when called', () => {
    component.labelForFocusTarget = 'label';

    expect(component.getLabelForFocusTarget()).toBe('label');
  });

  it('should submit answer when user submits the answer', () => {
    spyOn(currentInteractionService, 'onSubmit');

    component.submitAnswer('answer');

    expect(currentInteractionService.onSubmit).toHaveBeenCalled();
  });

  it('should not submit answer when user does not submit any answer', () => {
    spyOn(currentInteractionService, 'onSubmit');
    spyOn(currentInteractionService, 'showNoResponseError').and.returnValue(
      false
    );

    component.submitAnswer('');

    expect(currentInteractionService.onSubmit).not.toHaveBeenCalled();
    expect(component.errorMessageI18nKey).toEqual('');
  });

  it('should not submit answer and display error when answer is empty', () => {
    spyOn(currentInteractionService, 'onSubmit');
    spyOn(currentInteractionService, 'showNoResponseError').and.returnValue(
      true
    );

    component.submitAnswer('');

    expect(currentInteractionService.onSubmit).not.toHaveBeenCalled();
    expect(component.errorMessageI18nKey).toEqual(
      'I18N_INTERACTIONS_INPUT_NO_RESPONSE'
    );
  });

  it('should update answer and reset error when user types answer', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = spyOn(
      changeDetectorRef.constructor.prototype,
      'detectChanges'
    );
    spyOn(currentInteractionService, 'updateCurrentAnswer');
    component.answer = '';
    component.errorMessageI18nKey = 'Some error';

    component.updateAnswer('answers');

    expect(component.answer).toBe('answers');
    expect(detectChangesSpy).toHaveBeenCalled();
    expect(
      currentInteractionService.updateCurrentAnswer
    ).toHaveBeenCalledOnceWith('answers');
    expect(component.errorMessageI18nKey).toEqual('');
  });

  it('should not update answer if the users answer does not change', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = spyOn(
      changeDetectorRef.constructor.prototype,
      'detectChanges'
    );
    component.answer = 'answers';

    component.updateAnswer('answers');

    expect(component.answer).toBe('answers');
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });
});
