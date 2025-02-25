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
 * @fileoverview Component for the header of the response tiles.
 */

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {EditabilityService} from 'services/editability.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {AppConstants} from 'app.constants';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';
interface DeleteValue {
  index: number;
  evt: Event;
}
@Component({
  selector: 'oppia-response-header',
  templateUrl: './response-header.component.html',
})
export class ResponseHeaderComponent {
  @Output() delete = new EventEmitter<DeleteValue>();
  @Output() navigateToState = new EventEmitter<string>();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() index!: number;
  @Input() summary!: string;
  @Input() shortSummary!: string;
  @Input() isActive!: boolean;
  @Input() outcome!: Outcome;
  @Input() numRules!: number;
  @Input() isResponse!: boolean;
  @Input() showWarning!: boolean;
  @Input() defaultOutcome!: boolean;

  constructor(
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
    public editabilityService: EditabilityService
  ) {}

  returnToState(): void {
    this.navigateToState.emit(this.outcome.dest);
  }

  isInQuestionMode(): boolean {
    return this.stateEditorService.isInQuestionMode();
  }

  getCurrentInteractionId(): InteractionSpecsKey {
    return this.stateInteractionIdService.savedMemento as InteractionSpecsKey;
  }

  isCurrentInteractionLinear(): boolean {
    let interactionId = this.getCurrentInteractionId();
    return (
      Boolean(interactionId) &&
      INTERACTION_SPECS[interactionId as InteractionSpecsKey].is_linear
    );
  }

  isCorrect(): boolean {
    return this.outcome && this.outcome.labelledAsCorrect;
  }

  isOutcomeLooping(): boolean {
    const outcome = this.outcome;
    const activeStateName = this.stateEditorService.getActiveStateName();
    return outcome && outcome.dest === activeStateName;
  }

  isCreatingNewState(): boolean {
    const outcome = this.outcome;
    return outcome && outcome.dest === AppConstants.PLACEHOLDER_OUTCOME_DEST;
  }

  deleteResponse(evt: Event): void {
    const value: DeleteValue = {
      index: this.index,
      evt: evt,
    };

    this.delete.emit(value);
  }
}
