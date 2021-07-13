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

import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { InteractiveTextInputComponent } from './oppia-interactive-text-input.component';

describe('InteractiveTextInputComponent', () => {
  let component: InteractiveTextInputComponent;
  let fixture: ComponentFixture<InteractiveTextInputComponent>;
  let currentInteractionService: CurrentInteractionService;

  class mockInteractionAttributesExtractorService {
    getValuesFromAttributes(interactionId, attributes) {
      return {
        placeholder: {
          value: {
            unicode: attributes.placeholderWithValue
          }
        },
        rows: {
          value: attributes.rowsWithValue
        }
      };
    }
  }

  let mockCurrentInteractionService = {
    onSubmit: (answer, rulesService) => {
    },
    registerCurrentInteraction: (submitAnswer, validateExpressionFn) => {
      submitAnswer();
      validateExpressionFn();
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveTextInputComponent],
      providers: [
        {
          provide: InteractionAttributesExtractorService,
          useClass: mockInteractionAttributesExtractorService
        },
        {
          provide: CurrentInteractionService,
          useValue: mockCurrentInteractionService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    fixture = TestBed.createComponent(InteractiveTextInputComponent);
    component = fixture.componentInstance;

    component.placeholderWithValue = 'Placeholder text';
    component.rowsWithValue = 2;
  });

  it('should initialise when the user saves the interaction', () => {
    spyOn(currentInteractionService, 'registerCurrentInteraction')
      .and.callThrough();
    component.labelForFocusTarget = 'label';

    component.ngOnInit();

    expect(component.placeholder).toBe('Placeholder text');
    expect(component.rows).toBe(2);
    expect(component.answer).toBe('');
    expect(component.labelForFocusTarget).toBe('label');
    expect(component.schema).toEqual({
      type: 'unicode',
      ui_config: {
        rows: 2,
        placeholder: 'Placeholder text',
      }
    });
    // We cannot test what functions are exactly passed since anonymous
    // functions are passed as arguments in registerCurrentInteraction.
    expect(currentInteractionService.registerCurrentInteraction)
      .toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function));
  });

  it('should save solution when user saves solution for the interaction',
    () => {
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
      }
    };

    expect(component.getSchema()).toEqual({
      type: 'unicode',
      ui_config: {
        rows: 2,
        placeholder: 'Placeholder text',
      }
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

    component.submitAnswer('');

    expect(currentInteractionService.onSubmit).not.toHaveBeenCalled();
  });

  it('should update answer when user types answer', () => {
    const changeDetectorRef =
    fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    component.answer = '';

    component.updateAnswer('answers');

    expect(component.answer).toBe('answers');
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should not update answer if the users answer does not change', () => {
    const changeDetectorRef =
    fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    component.answer = 'answers';

    component.updateAnswer('answers');

    expect(component.answer).toBe('answers');
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });
});
