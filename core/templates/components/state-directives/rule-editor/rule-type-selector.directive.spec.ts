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
 * @fileoverview Unit tests for the rule type selector.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {RuleTypeSelectorDirectiveModule} from 'components/shared_parts/rule-type-selector-directive.module';
import {RuleTypeSelector} from './rule-type-selector.directive';

describe('Rule Type Selector', () => {
  let component: RuleTypeSelector;
  let fixture: ComponentFixture<RuleTypeSelector>;
  let stateInteractionIdService: StateInteractionIdService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RuleTypeSelectorDirectiveModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RuleTypeSelector);
    component = fixture.componentInstance;
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    stateInteractionIdService.savedMemento = 'MultipleChoiceInput';
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should build the rule type choices on init', () => {
    component.ngOnInit();

    expect(component.choices.length).toBeGreaterThan(0);
    component.choices.forEach(choice => {
      expect(choice.id).toBeDefined();
      expect(choice.text).toBeDefined();
    });
  });

  it('should keep an existing rule type selection', () => {
    component.localValue = 'Equals';
    spyOn(component.onSelectionChange, 'emit');

    component.ngOnInit();

    expect(component.localValue).toBe('Equals');
    expect(component.onSelectionChange.emit).toHaveBeenCalledWith('Equals');
  });

  it('should emit the selected rule type', () => {
    component.localValue = 'Equals';
    spyOn(component.onSelectionChange, 'emit');

    component.selectedRule(new Event('click'));

    expect(component.onSelectionChange.emit).toHaveBeenCalledWith('Equals');
  });
});
