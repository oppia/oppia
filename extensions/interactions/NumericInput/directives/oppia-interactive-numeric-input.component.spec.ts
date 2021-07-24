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
import { InteractiveNumericInput } from './oppia-interactive-numeric-input.component';

describe('InteractiveNumericInput', () => {
  let component: InteractiveNumericInput;
  let fixture: ComponentFixture<InteractiveNumericInput>;
  let currentInteractionService: CurrentInteractionService;

  let mockCurrentInteractionService = {
    onSubmit: (answer, rulesService) => {},
    registerCurrentInteraction: (submitAnswerFn, validateExpressionFn) => {
      submitAnswerFn();
      validateExpressionFn();
    }
  };


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveNumericInput],
      providers: [
        {
          provide: CurrentInteractionService,
          useValue: mockCurrentInteractionService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    currentInteractionService = TestBed.get(CurrentInteractionService);
    fixture = TestBed.createComponent(InteractiveNumericInput);
    component = fixture.componentInstance;
  });

  it('should initialise component when user adds interaction', () => {
    spyOn(currentInteractionService, 'registerCurrentInteraction').and
      .callThrough();

    component.ngOnInit();

    expect(component.answer).toBe('');
    expect(component.labelForFocusTarget).toBeNull();
    expect(component.NUMERIC_INPUT_FORM_SCHEMA).toEqual({
      type: 'float',
      ui_config: {}
    });
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
    expect(component.NUMERIC_INPUT_FORM_SCHEMA).toEqual({
      type: 'float',
      ui_config: {}
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

    expect(component.getSchema()).toEqual({
      type: 'float',
      ui_config: {}
    });
  });

  it('should update answer when user enter a new answer', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    component.answer = 20;

    component.onAnswerChange(25);

    expect(component.answer).toBe(25);
    expect(detectChangesSpy).toHaveBeenCalled();
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
});
