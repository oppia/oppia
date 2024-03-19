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
 * @fileoverview Unit tests for the SetInput interaction.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {InteractiveSetInputComponent} from './oppia-interactive-set-input.component';
import {TranslateModule} from '@ngx-translate/core';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';
import {SetInputAnswer} from 'interactions/answer-defs';

describe('InteractiveSetInputComponent', () => {
  let component: InteractiveSetInputComponent;
  let fixture: ComponentFixture<InteractiveSetInputComponent>;
  let currentInteractionService: CurrentInteractionService;

  class mockInteractionAttributesExtractorService {
    getValuesFromAttributes(
      interactionId: InteractionSpecsKey,
      attributes: Record<string, string>
    ) {
      return {
        buttonText: {
          value: {
            unicode: attributes.buttonTextWithValue,
          },
        },
      };
    }
  }

  let mockCurrentInteractionService = {
    onSubmit: (
      answer: SetInputAnswer,
      rulesService: CurrentInteractionService
    ) => {},
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
      imports: [
        TranslateModule.forRoot({
          useDefaultLang: true,
          isolate: false,
          extend: false,
          defaultLanguage: 'en',
        }),
      ],
      declarations: [InteractiveSetInputComponent],
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
    fixture = TestBed.createComponent(InteractiveSetInputComponent);
    component = fixture.componentInstance;

    component.buttonTextWithValue = 'Add New Item';
  });

  it('should update answer and set error message if duplicates', () => {
    component.errorMessage = '';

    component.updateAnswer(['duplicate', 'duplicate']);
    expect(component.answer).toEqual(['duplicate', 'duplicate']);
    expect(component.errorMessage).toBe(
      'I18N_INTERACTIONS_SET_INPUT_DUPLICATES_ERROR'
    );
  });

  it('should update answer and clear error message if no duplicates', () => {
    component.errorMessage = 'I18N_INTERACTIONS_SET_INPUT_DUPLICATES_ERROR';

    component.updateAnswer(['unique1', 'unique2']);

    expect(component.answer).toEqual(['unique1', 'unique2']);
    expect(component.errorMessage).toBe('');
  });

  it('should initialise component when user adds interaction', () => {
    spyOn(
      currentInteractionService,
      'registerCurrentInteraction'
    ).and.callThrough();
    component.ngOnInit();

    expect(component.buttonText).toBe('Add New Item');
    expect(component.schema).toEqual({
      type: 'list',
      items: {
        type: 'unicode',
      },
      ui_config: {
        // TODO(mili): Translate this in the HTML.
        add_element_text: 'Add New Item',
      },
    });
    expect(component.answer).toEqual(['']);
    expect(
      currentInteractionService.registerCurrentInteraction
    ).toHaveBeenCalled();
  });

  it(
    'should initialise component when user saves solution for' + ' interaction',
    () => {
      spyOn(
        currentInteractionService,
        'registerCurrentInteraction'
      ).and.callThrough();
      component.savedSolution = ['Solution'];
      component.ngOnInit();

      expect(component.buttonText).toBe('Add New Item');
      expect(component.schema).toEqual({
        type: 'list',
        items: {
          type: 'unicode',
        },
        ui_config: {
          // TODO(mili): Translate this in the HTML.
          add_element_text: 'Add New Item',
        },
      });
      expect(component.answer).toEqual(['Solution']);
      expect(
        currentInteractionService.registerCurrentInteraction
      ).toHaveBeenCalled();
    }
  );

  it('should show error message when user enters duplicate items', () => {
    component.errorMessage = '';

    component.submitAnswer(['test', 'test']);

    expect(component.errorMessage).toBe(
      'I18N_INTERACTIONS_SET_INPUT_DUPLICATES_ERROR'
    );
  });

  it('should return SCHEMa when called', () => {
    component.ngOnInit();

    expect(component.getSchema()).toEqual({
      type: 'list',
      items: {
        type: 'unicode',
      },
      ui_config: {
        // TODO(mili): Translate this in the HTML.
        add_element_text: 'Add New Item',
      },
    });
  });

  it('should update answer when user edits saved solution', () => {
    component.answer = ['test1'];

    component.updateAnswer(['test1', 'test2']);

    expect(component.answer).toEqual(['test1', 'test2']);
  });

  it('should not update answer when user does not edit saved solution', () => {
    component.answer = ['test1'];

    component.updateAnswer(['test1']);

    expect(component.answer).toEqual(['test1']);
  });
});
