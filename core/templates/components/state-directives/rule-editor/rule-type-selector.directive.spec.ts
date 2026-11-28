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
 * @fileoverview Unit tests for the rule type selector component.
 */

import {TestBed} from '@angular/core/testing';
import {MatSelect} from '@angular/material/select';
import {By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {StateCustomizationArgsService} from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {ReplaceInputsWithEllipsesPipe} from 'filters/string-utility-filters/replace-inputs-with-ellipses.pipe';
import {DragAndDropSortInputCustomizationArgs} from 'interactions/customization-args-defs';
import {MaterialModule} from 'modules/material.module';
import {RuleTypeSelector} from './rule-type-selector.directive';

describe('Rule Type Selector', () => {
  const incorrectPositionRule =
    'IsEqualToOrderingWithOneItemAtIncorrectPosition';
  let component: RuleTypeSelector;
  let interactionIdService: StateInteractionIdService;
  let customizationArgsService: StateCustomizationArgsService;
  let customizationArgs: DragAndDropSortInputCustomizationArgs;

  beforeEach(async () => {
    customizationArgs = {
      choices: {value: []},
      allowMultipleItemsInSamePosition: {value: false},
    };
    await TestBed.configureTestingModule({
      imports: [MaterialModule, NoopAnimationsModule],
      declarations: [RuleTypeSelector],
      providers: [
        ReplaceInputsWithEllipsesPipe,
        {
          provide: StateInteractionIdService,
          useValue: {savedMemento: 'DragAndDropSortInput'},
        },
        {
          provide: StateCustomizationArgsService,
          useValue: {savedMemento: customizationArgs},
        },
      ],
    }).compileComponents();
    interactionIdService = TestBed.inject(StateInteractionIdService);
    customizationArgsService = TestBed.inject(StateCustomizationArgsService);
    component = new RuleTypeSelector(
      interactionIdService,
      new ReplaceInputsWithEllipsesPipe(),
      customizationArgsService
    );
  });

  it('should disable the rule when multiple items cannot share a position', () => {
    expect(component.isRuleTypeDisabled(incorrectPositionRule)).toBe(true);
  });

  it('should enable the rule when multiple items can share a position', () => {
    customizationArgs.allowMultipleItemsInSamePosition.value = true;

    expect(component.isRuleTypeDisabled(incorrectPositionRule)).toBe(false);
  });

  it('should leave other ordering rules enabled', () => {
    expect(component.isRuleTypeDisabled('IsEqualToOrdering')).toBe(false);
    expect(component.isRuleTypeDisabled('HasElementXAtPositionY')).toBe(false);
    expect(component.isRuleTypeDisabled('HasElementXBeforeElementY')).toBe(
      false
    );
  });

  it('should not disable rules for other interactions', () => {
    interactionIdService.savedMemento = 'TextInput';

    expect(component.isRuleTypeDisabled(incorrectPositionRule)).toBe(false);
    expect(component.isRuleTypeDisabled('Equals')).toBe(false);
  });

  it('should allow the rule when the customization argument is absent', () => {
    customizationArgsService.savedMemento = {};

    expect(component.isRuleTypeDisabled(incorrectPositionRule)).toBe(false);
  });

  it('should use updated saved settings after initialization', () => {
    component.ngOnInit();
    expect(component.isRuleTypeDisabled(incorrectPositionRule)).toBe(true);

    customizationArgsService.savedMemento = {
      choices: {value: []},
      allowMultipleItemsInSamePosition: {value: true},
    };

    expect(component.isRuleTypeDisabled(incorrectPositionRule)).toBe(false);
  });

  it('should default to exact ordering when multiple items are disallowed', () => {
    const selectionSpy = spyOn(component.onSelectionChange, 'emit');

    component.ngOnInit();

    expect(component.localValue).toBe('IsEqualToOrdering');
    expect(component.choices[0].id).toBe('IsEqualToOrdering');
    expect(selectionSpy).toHaveBeenCalledWith('IsEqualToOrdering');
  });

  it('should default to exact ordering when multiple items are allowed', () => {
    customizationArgs.allowMultipleItemsInSamePosition.value = true;

    component.ngOnInit();

    expect(component.localValue).toBe('IsEqualToOrdering');
    expect(component.choices[0].id).toBe('IsEqualToOrdering');
  });

  it('should preserve an existing selection even when it is disabled', () => {
    component.localValue = incorrectPositionRule;
    const selectionSpy = spyOn(component.onSelectionChange, 'emit');

    component.ngOnInit();

    expect(component.localValue).toBe(incorrectPositionRule);
    expect(selectionSpy).toHaveBeenCalledWith(incorrectPositionRule);
  });

  it('should default a null selection to exact ordering', () => {
    // Simulate the null input supplied by the parent for a new rule.
    Object.assign(component, {localValue: null});

    component.ngOnInit();

    expect(component.localValue).toBe('IsEqualToOrdering');
  });

  it('should preserve default selection for other interactions', () => {
    interactionIdService.savedMemento = 'NumericExpressionInput';

    component.ngOnInit();

    expect(component.localValue).toBe('MatchesExactlyWith');
    expect(component.choices[0].id).toBe('MatchesExactlyWith');
  });

  it('should emit the selected rule', () => {
    component.localValue = 'HasElementXAtPositionY';
    const selectionSpy = spyOn(component.onSelectionChange, 'emit');

    component.selectedRule(new Event('click'));

    expect(selectionSpy).toHaveBeenCalledWith('HasElementXAtPositionY');
  });

  it('should update the dropdown option when saved settings change', async () => {
    const fixture = TestBed.createComponent(RuleTypeSelector);
    fixture.detectChanges();
    await fixture.whenStable();

    const select: MatSelect = fixture.debugElement.query(
      By.directive(MatSelect)
    ).componentInstance;
    const option = select.options.find(
      item => item.value === incorrectPositionRule
    );
    expect(option?.disabled).toBe(true);

    customizationArgs.allowMultipleItemsInSamePosition.value = true;
    fixture.detectChanges();

    expect(option?.disabled).toBe(false);
    expect(fixture.componentInstance.localValue).toBe('IsEqualToOrdering');

    customizationArgs.allowMultipleItemsInSamePosition.value = false;
    fixture.detectChanges();

    expect(option?.disabled).toBe(true);
  });
});
