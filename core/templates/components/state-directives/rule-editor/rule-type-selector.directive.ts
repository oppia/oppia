// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the rule type selector.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { ReplaceInputsWithEllipsesPipe } from 'filters/string-utility-filters/replace-inputs-with-ellipses.pipe';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';

interface Choice {
  id: unknown;
  text: string;
}

@Component({
  selector: 'oppia-rule-type-selector',
  templateUrl: './rule-type-selector.component.html'
})
export class RuleTypeSelector implements OnInit {
  @Input() localValue;
  @Output() onSelectionChange = new EventEmitter();
  choices: Choice[] = [];

  constructor(
    private stateInteractionIdService: StateInteractionIdService,
    private replaceInputsWithEllipsesPipe: ReplaceInputsWithEllipsesPipe,
  ) {}

  selectedRule($event: Event): void {
    this.onSelectionChange.emit(this.localValue);
  }

  ngOnInit(): void {
    let ruleTypesToDescriptions = INTERACTION_SPECS[
      this.stateInteractionIdService.savedMemento].rule_descriptions;

    let equalToIndex = null;
    let idx = 0;
    for (let ruleType in ruleTypesToDescriptions) {
      if (ruleType.includes('Equal') || ruleType.includes('Exactly')) {
        equalToIndex = idx;
      }

      this.choices.push({
        id: ruleType,
        text: this.replaceInputsWithEllipsesPipe.transform(
          ruleTypesToDescriptions[ruleType])
      });
      idx++;
    }
    // If the 'Equals' rule is not the first one, swap it with the first
    // rule, so the equals rule is always the default one selected in the
    // editor.
    if (equalToIndex) {
      [this.choices[0], this.choices[equalToIndex]] = [
        this.choices[equalToIndex], this.choices[0]];
    }

    if (this.localValue === null || this.localValue === undefined) {
      this.localValue = this.choices[0].id;
    }

    this.onSelectionChange.emit(this.localValue);
  }
}


angular.module('oppia').directive('oppiaRuleTypeSelector',
  downgradeComponent({
    component: RuleTypeSelector
  }) as angular.IDirectiveFactory);
