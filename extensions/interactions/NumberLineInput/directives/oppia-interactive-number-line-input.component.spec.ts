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
 * @fileoverview Tests for oppia interactive number line input.component.spec.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {InteractiveNumberLineInput} from './oppia-interactive-number-line-input.component';

describe('InteractiveNumberLineInput', () => {
  let fixture: ComponentFixture<InteractiveNumberLineInput>;
  let component: InteractiveNumberLineInput;
  let currentInteractionService: jasmine.SpyObj<CurrentInteractionService>;
  let attributesExtractor: jasmine.SpyObj<InteractionAttributesExtractorService>;

  beforeEach(async () => {
    currentInteractionService = jasmine.createSpyObj(
      'CurrentInteractionService',
      [
        'registerCurrentInteraction',
        'updateAnswerIsValid',
        'updateCurrentAnswer',
        'updateViewWithNewAnswer',
        'onSubmit',
      ]
    );
    attributesExtractor = jasmine.createSpyObj(
      'InteractionAttributesExtractorService',
      ['getValuesFromAttributes']
    );
    attributesExtractor.getValuesFromAttributes.and.returnValue({
      startValue: {value: -2},
      endValue: {value: 6},
      interval: {value: 2},
    });

    await TestBed.configureTestingModule({
      declarations: [InteractiveNumberLineInput],
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: CurrentInteractionService,
          useValue: currentInteractionService,
        },
        {
          provide: InteractionAttributesExtractorService,
          useValue: attributesExtractor,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InteractiveNumberLineInput);
    component = fixture.componentInstance;
    component.startValueWithValue = '-2';
    component.endValueWithValue = '6';
    component.intervalWithValue = '2';
  });

  it('should render the configured points and registers submission', () => {
    fixture.detectChanges();
    expect(component.points).toEqual([-2, 0, 2, 4, 6]);
    expect(component.selectedIndex).toBeNull();
    expect(
      currentInteractionService.registerCurrentInteraction
    ).toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelectorAll('[role="radio"]').length
    ).toBe(5);
  });

  it('should submit the numeric value of the selected point', () => {
    fixture.detectChanges();
    component.selectPoint(3);
    expect(currentInteractionService.updateCurrentAnswer).toHaveBeenCalledWith(
      4
    );
    expect(currentInteractionService.updateAnswerIsValid).toHaveBeenCalledWith(
      true
    );
    expect(
      currentInteractionService.updateViewWithNewAnswer
    ).toHaveBeenCalled();
    component.submitAnswer();
    expect(currentInteractionService.onSubmit).toHaveBeenCalledWith(
      4,
      jasmine.anything()
    );
  });

  it('should not submit before a point is selected', () => {
    fixture.detectChanges();
    component.submitAnswer();
    expect(currentInteractionService.onSubmit).not.toHaveBeenCalled();
    expect(currentInteractionService.updateAnswerIsValid).toHaveBeenCalledWith(
      false
    );
  });

  it('should restore a previous answer and ignores invalid indexes', () => {
    component.lastAnswer = 2;
    fixture.detectChanges();
    expect(component.selectedIndex).toBe(2);
    component.selectPoint(-1);
    component.selectPoint(20);
    expect(component.selectedIndex).toBe(2);
  });

  it('should snap pointer dragging to the closest point', () => {
    fixture.detectChanges();
    const track = fixture.nativeElement.querySelector(
      '.oppia-number-line-track'
    ) as HTMLElement;
    spyOn(track, 'getBoundingClientRect').and.returnValue(
      new DOMRect(0, 0, 100, 50)
    );
    spyOn(track, 'setPointerCapture');

    track.dispatchEvent(new PointerEvent('pointerdown', {clientX: 52}));
    expect(component.selectedIndex).toBe(2);
    track.dispatchEvent(new PointerEvent('pointermove', {clientX: 90}));
    expect(component.selectedIndex).toBe(4);
    track.dispatchEvent(new PointerEvent('pointerup'));
    track.dispatchEvent(new PointerEvent('pointermove', {clientX: 0}));
    expect(component.selectedIndex).toBe(4);
  });

  it('should support arrow, Home and End keys', () => {
    fixture.detectChanges();
    const firstPoint = fixture.nativeElement.querySelector(
      '[role="radio"]'
    ) as HTMLButtonElement;
    firstPoint.dispatchEvent(new KeyboardEvent('keydown', {key: 'End'}));
    expect(component.selectedIndex).toBe(4);
    firstPoint.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft'}));
    expect(component.selectedIndex).toBe(3);
    firstPoint.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home'}));
    expect(component.selectedIndex).toBe(0);
  });
});
