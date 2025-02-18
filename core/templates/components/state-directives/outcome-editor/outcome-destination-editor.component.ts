// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the outcome destination editor.
 */

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Subscription} from 'rxjs';
import cloneDeep from 'lodash/cloneDeep';
import {StateGraphLayoutService} from 'components/graph-services/graph-layout.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {EditorFirstTimeEventsService} from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {UserService} from 'services/user.service';
import {AppConstants} from 'app.constants';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';

interface DestinationChoice {
  id: string;
  text: string;
}

interface DestValidation {
  isCreatingNewState: boolean;
  value: string;
}
@Component({
  selector: 'oppia-outcome-destination-editor',
  templateUrl: './outcome-destination-editor.component.html',
})
export class OutcomeDestinationEditorComponent implements OnInit {
  @Output() addState: EventEmitter<string> = new EventEmitter<string>();
  @Output() getChanges: EventEmitter<DestValidation> = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() outcome!: Outcome;
  @Input() outcomeHasFeedback!: boolean;
  explorationAndSkillIdPattern!: RegExp;
  newStateNamePattern!: RegExp;
  destinationChoices!: DestinationChoice[];
  maxLen!: number;
  outcomeNewStateName!: string;
  currentStateName!: string;
  directiveSubscriptions: Subscription = new Subscription();
  canAddPrerequisiteSkill: boolean = false;
  canEditRefresherExplorationId: boolean = false;
  ENABLE_PREREQUISITE_SKILLS: boolean = AppConstants.ENABLE_PREREQUISITE_SKILLS;

  EXPLORATION_AND_SKILL_ID_PATTERN: RegExp =
    AppConstants.EXPLORATION_AND_SKILL_ID_PATTERN;

  MAX_STATE_NAME_LENGTH: number = AppConstants.MAX_STATE_NAME_LENGTH;

  PLACEHOLDER_OUTCOME_DEST: string = AppConstants.PLACEHOLDER_OUTCOME_DEST;

  constructor(
    private editorFirstTimeEventsService: EditorFirstTimeEventsService,
    private focusManagerService: FocusManagerService,
    private stateEditorService: StateEditorService,
    private stateGraphLayoutService: StateGraphLayoutService,
    private userService: UserService
  ) {}

  isSelfLoop(): boolean {
    return this.outcome.dest === this.currentStateName;
  }

  updateChanges($event: string): void {
    if ($event !== '') {
      this.outcomeNewStateName = $event;
    }

    let validation = {
      isCreatingNewState: this.isCreatingNewState(),
      value: $event,
    };
    this.getChanges.emit(validation);
  }

  onDestSelectorChange(): void {
    if (this.outcome.dest === this.PLACEHOLDER_OUTCOME_DEST) {
      this.focusManagerService.setFocus('newStateNameInputField');
    }

    let validation = {
      isCreatingNewState: this.isCreatingNewState(),
      value: this.outcomeNewStateName,
    };
    this.getChanges.emit(validation);
  }

  isCreatingNewState(): boolean {
    this.maxLen = this.MAX_STATE_NAME_LENGTH;
    return this.outcome.dest === this.PLACEHOLDER_OUTCOME_DEST;
  }

  updateOptionNames(): void {
    // The setTimeout is being used here to update the view.
    setTimeout(() => {
      let activeStateName = this.stateEditorService.getActiveStateName();
      if (activeStateName === null) {
        throw new Error('Active state name is null');
      }
      this.currentStateName = activeStateName;
      // This is a list of objects, each with an ID and name. These
      // represent all states, as well as an option to create a
      // new state.
      this.destinationChoices = [
        {
          id: this.currentStateName,
          text: '(try again)',
        },
      ];

      // Arrange the remaining states based on their order in the state
      // graph.
      let lastComputedArrangement =
        this.stateGraphLayoutService.getLastComputedArrangement();
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
            maxDepth,
            lastComputedArrangement[stateName].depth
          );
          maxOffset = Math.max(
            maxOffset,
            lastComputedArrangement[stateName].offset
          );
        }

        // Higher scores come later.
        let allStateScores: {[stateName: string]: number} = {};
        let unarrangedStateCount = 0;
        for (let i = 0; i < allStateNames.length; i++) {
          stateName = allStateNames[i];
          if (lastComputedArrangement.hasOwnProperty(stateName)) {
            allStateScores[stateName] =
              lastComputedArrangement[stateName].depth * (maxOffset + 1) +
              lastComputedArrangement[stateName].offset;
          } else {
            // States that have just been added in the rule 'create new'
            // modal are not yet included as part of
            // lastComputedArrangement so we account for them here.
            allStateScores[stateName] =
              (maxDepth + 1) * (maxOffset + 1) + unarrangedStateCount;
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
            text: stateNames[i],
          });
        }
      }

      this.destinationChoices.push({
        id: this.PLACEHOLDER_OUTCOME_DEST,
        text: 'A New Card Called...',
      });
      // This value of 10ms is arbitrary, it has no significance.
    }, 10);
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.stateEditorService.onSaveOutcomeDestDetails.subscribe(() => {
        // Create new state if specified.
        if (this.outcome.dest === this.PLACEHOLDER_OUTCOME_DEST) {
          this.editorFirstTimeEventsService.registerFirstCreateSecondStateEvent();

          let newStateName = this.outcomeNewStateName.trim();
          this.outcome.dest = newStateName;
          this.addState.emit(newStateName);
        }
      })
    );
    this.updateOptionNames();
    this.directiveSubscriptions.add(
      this.stateEditorService.onStateNamesChanged.subscribe(() => {
        this.updateOptionNames();
      })
    );
    this.canAddPrerequisiteSkill =
      this.ENABLE_PREREQUISITE_SKILLS &&
      this.stateEditorService.isExplorationCurated();
    this.canEditRefresherExplorationId = false;
    this.userService.getUserInfoAsync().then(userInfo => {
      // We restrict editing of refresher exploration IDs to
      // admins/moderators for now, since the feature is still in
      // development.
      this.canEditRefresherExplorationId =
        userInfo.isCurriculumAdmin() || userInfo.isModerator();
    });

    this.explorationAndSkillIdPattern = this.EXPLORATION_AND_SKILL_ID_PATTERN;
    this.newStateNamePattern = /^[a-zA-Z0-9.\s-]+$/;
    this.destinationChoices = [];
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
