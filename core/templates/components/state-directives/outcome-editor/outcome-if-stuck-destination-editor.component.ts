// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the outcome if stuck destination editor.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Subscription } from 'rxjs';
import cloneDeep from 'lodash/cloneDeep';
import { StateGraphLayoutService } from 'components/graph-services/graph-layout.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { EditorFirstTimeEventsService } from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { AppConstants } from 'app.constants';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';

interface DestinationChoice {
  id: string | null;
  text: string;
}

interface DestValidation {
  isCreatingNewState: boolean;
  value: string;
}

@Component({
  selector: 'oppia-outcome-if-stuck-destination-editor',
  templateUrl: './outcome-if-stuck-destination-editor.component.html'
})
export class OutcomeIfStuckDestinationEditorComponent implements OnInit {
  @Output() addState: EventEmitter<string> = new EventEmitter<string>();
  @Output() getChanges: EventEmitter<DestValidation> = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() outcome!: Outcome;
  explorationAndSkillIdPattern!: RegExp;
  newStateNamePattern!: RegExp;
  destinationChoices: DestinationChoice[] = [];
  maxLen!: number;
  outcomeNewStateName!: string;
  currentStateName: string | null = null;
  directiveSubscriptions: Subscription = new Subscription();

  MAX_STATE_NAME_LENGTH: number = (
    AppConstants.MAX_STATE_NAME_LENGTH);

  PLACEHOLDER_OUTCOME_DEST_IF_STUCK: string = (
    AppConstants.PLACEHOLDER_OUTCOME_DEST_IF_STUCK);

  constructor(
    private editorFirstTimeEventsService: EditorFirstTimeEventsService,
    private focusManagerService: FocusManagerService,
    private stateEditorService: StateEditorService,
    private stateGraphLayoutService: StateGraphLayoutService
  ) {}

  updateChanges($event: string): void {
    if ($event.length > 0) {
      this.outcomeNewStateName = $event;
      let validation = {
        isCreatingNewState: this.isCreatingNewState(),
        value: $event
      };
      this.getChanges.emit(validation);
    }
  }

  onDestIfStuckSelectorChange(): void {
    if (this.outcome.destIfReallyStuck ===
      this.PLACEHOLDER_OUTCOME_DEST_IF_STUCK) {
      this.focusManagerService.setFocus('newStateNameInputField');
    }

    let validation = {
      isCreatingNewState: this.isCreatingNewState(),
      value: this.outcomeNewStateName
    };
    this.getChanges.emit(validation);
  }

  isCreatingNewState(): boolean {
    this.maxLen = this.MAX_STATE_NAME_LENGTH;
    return (
      this.outcome.destIfReallyStuck ===
        this.PLACEHOLDER_OUTCOME_DEST_IF_STUCK);
  }

  updateOptionNames(): void {
    // The setTimeout is being used here to update the view.
    setTimeout(() => {
      this.currentStateName = this.stateEditorService.getActiveStateName();
      let questionModeEnabled = this.stateEditorService.isInQuestionMode();
      // This is a list of objects, each with an ID and name. These
      // represent all states, as well as an option to create a
      // new state.
      this.destinationChoices = [{
        id: null,
        text: 'None'
      }];

      // Arrange the remaining states based on their order in the state
      // graph.
      let lastComputedArrangement = (
        this.stateGraphLayoutService.getLastComputedArrangement());
      let allStateNames = this.stateEditorService.getStateNames();

      // It is possible that lastComputedArrangement is null if the
      // graph has never been rendered at the time this computation is
      // being carried out.
      let stateNames = cloneDeep(allStateNames);
      let stateName = null;
      if (lastComputedArrangement) {
        let maxDepth = 0;
        let maxOffset = 0;
        for (let stateName in lastComputedArrangement) {
          maxDepth = Math.max(
            maxDepth, lastComputedArrangement[stateName].depth);
          maxOffset = Math.max(
            maxOffset, lastComputedArrangement[stateName].offset);
        }

        // Higher scores come later.
        let allStateScores: {[stateName: string]: number} = {};
        let unarrangedStateCount = 0;
        for (let i = 0; i < allStateNames.length; i++) {
          stateName = allStateNames[i];
          if (lastComputedArrangement.hasOwnProperty(stateName)) {
            allStateScores[stateName] = (
              lastComputedArrangement[stateName].depth *
              (maxOffset + 1) +
              lastComputedArrangement[stateName].offset);
          } else {
            // States that have just been added in the rule 'create new'
            // modal are not yet included as part of
            // lastComputedArrangement so we account for them here.
            allStateScores[stateName] = (
              (maxDepth + 1) * (maxOffset + 1) + unarrangedStateCount);
            unarrangedStateCount++;
          }
        }

        stateNames = allStateNames.sort((a, b) => {
          return allStateScores[a] - allStateScores[b];
        });
      }

      for (let i = 0; i < stateNames.length; i++) {
        if (stateNames[i] !== this.currentStateName) {
          this.destinationChoices.push({
            id: stateNames[i],
            text: stateNames[i]
          });
        }
      }

      if (!questionModeEnabled) {
        this.destinationChoices.push({
          id: this.PLACEHOLDER_OUTCOME_DEST_IF_STUCK,
          text: 'A New Card Called...'
        });
      }
    // This value of 10ms is arbitrary, it has no significance.
    }, 10);
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.stateEditorService.onSaveOutcomeDestIfStuckDetails.
        subscribe(() => {
          // Create new state if specified.
          if (this.outcome.destIfReallyStuck ===
                this.PLACEHOLDER_OUTCOME_DEST_IF_STUCK) {
            this.editorFirstTimeEventsService
              .registerFirstCreateSecondStateEvent();

            let newStateName = this.outcomeNewStateName;
            this.outcome.destIfReallyStuck = newStateName;
            this.addState.emit(newStateName);
          }
        }));
    this.updateOptionNames();
    this.directiveSubscriptions.add(
      this.stateEditorService.onStateNamesChanged.subscribe(() => {
        this.updateOptionNames();
      }));

    this.newStateNamePattern = /^[a-zA-Z0-9.\s-]+$/;
    this.destinationChoices = [];
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaOutcomeIfStuckDestinationEditor',
  downgradeComponent({
    component: OutcomeIfStuckDestinationEditorComponent
  }) as angular.IDirectiveFactory);
