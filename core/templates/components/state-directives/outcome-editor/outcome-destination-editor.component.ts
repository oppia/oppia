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

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Subscription } from 'rxjs';
import { StateGraphLayoutService } from 'components/graph-services/graph-layout.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { EditorFirstTimeEventsService } from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { UserService } from 'services/user.service';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { AppConstants } from 'app.constants';

@Component({
  selector: 'oppia-outcome-destination-editor',
  templateUrl: './outcome-destination-editor.component.html'
})
export class OutcomeDestinationEditorComponent implements
  OnInit, OnDestroy {
  @Input() outcome: Outcome;
  @Input() outcomeHasFeedback: boolean;
  @Input() addState;
  directiveSubscriptions = new Subscription();
  PLACEHOLDER_OUTCOME_DEST = AppConstants.PLACEHOLDER_OUTCOME_DEST;
  ENABLE_PREREQUISITE_SKILLS = AppConstants.ENABLE_PREREQUISITE_SKILLS;
  MAX_STATE_NAME_LENGTH = AppConstants.MAX_STATE_NAME_LENGTH;
  canAddPrerequisiteSkill;
  canEditRefresherExplorationId;
  EXPLORATION_AND_SKILL_ID_PATTERN = (
    AppConstants.EXPLORATION_AND_SKILL_ID_PATTERN);
  explorationAndSkillIdPattern;
  newStateNamePattern;
  destChoices;
  currentStateName;
  maxLen;

  constructor(
    private editorFirstTimeEventsService: EditorFirstTimeEventsService,
    private focusManagerService: FocusManagerService,
    private stateEditorService: StateEditorService,
    private stateGraphLayoutService: StateGraphLayoutService,
    private userService: UserService,
  ) {}

  isSelfLoop(): boolean {
    return this.outcome.dest === this.currentStateName;
  }

  onDestSelectorChange(): void {
    if (this.outcome.dest === this.PLACEHOLDER_OUTCOME_DEST) {
      this.focusManagerService.setFocus('newStateNameInputField');
    }
  }

  isCreatingNewState(outcome: Outcome): boolean {
    this.maxLen = this.MAX_STATE_NAME_LENGTH;
    return outcome.dest === this.PLACEHOLDER_OUTCOME_DEST;
  }


  updateOptionNames(): void {
    this.currentStateName = this.stateEditorService.getActiveStateName();

    let questionModeEnabled = this.stateEditorService.isInQuestionMode();
    // This is a list of objects, each with an ID and name. These
    // represent all states, as well as an option to create a
    // new state.
    this.destChoices = [{
      id: (questionModeEnabled ? null : this.currentStateName),
      text: '(try again)'
    }];

    // Arrange the remaining states based on their order in the state
    // graph.
    let lastComputedArrangement = (
      this.stateGraphLayoutService.getLastComputedArrangement());
    let allStateNames = this.stateEditorService.getStateNames();

    // It is possible that lastComputedArrangement is null if the
    // graph has never been rendered at the time this computation is
    // being carried out.
    let stateNames = angular.copy(allStateNames);
    let stateName = null;
    if (lastComputedArrangement) {
      let maxDepth = 0;
      let maxOffset = 0;
      for (stateName in lastComputedArrangement) {
        maxDepth = Math.max(
          maxDepth, lastComputedArrangement[stateName].depth);
        maxOffset = Math.max(
          maxOffset, lastComputedArrangement[stateName].offset);
      }

      // Higher scores come later.
      let allStateScores = {};
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

      stateNames = allStateNames.sort(function(a, b) {
        return allStateScores[a] - allStateScores[b];
      });
    }

    for (let i = 0; i < stateNames.length; i++) {
      if (stateNames[i] !== this.currentStateName) {
        this.destChoices.push({
          id: stateNames[i],
          text: stateNames[i]
        });
      }
    }

    if (!questionModeEnabled) {
      this.destChoices.push({
        id: this.PLACEHOLDER_OUTCOME_DEST,
        text: 'A New Card Called...'
      });
    }
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.stateEditorService.onSaveOutcomeDestDetails.subscribe(() => {
        if (this.isSelfLoop()) {
          this.outcome.dest = this.stateEditorService.getActiveStateName();
        }
        // Create new state if specified.
        if (this.outcome.dest === this.PLACEHOLDER_OUTCOME_DEST) {
          this.editorFirstTimeEventsService
            .registerFirstCreateSecondStateEvent();

          let newStateName = this.stateEditorService.getActiveStateName();
          this.outcome.dest = newStateName;

          this.addState(newStateName);
        }
      }));
    this.updateOptionNames();
    this.directiveSubscriptions.add(
      this.stateEditorService.onStateNamesChanged.subscribe(() => {
        this.updateOptionNames();
      }));
    this.canAddPrerequisiteSkill = (
      this.ENABLE_PREREQUISITE_SKILLS &&
      this.stateEditorService.isExplorationWhitelisted());
    this.canEditRefresherExplorationId = null;
    this.userService.getUserInfoAsync().then((userInfo) => {
      // We restrict editing of refresher exploration IDs to
      // admins/moderators for now, since the feature is still in
      // development.
      this.canEditRefresherExplorationId = (
        userInfo.isCurriculumAdmin() || userInfo.isModerator());
    });

    this.explorationAndSkillIdPattern =
      this.EXPLORATION_AND_SKILL_ID_PATTERN;
    this.newStateNamePattern = /^[a-zA-Z0-9.\s-]+$/;
    this.destChoices = [];
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaOutcomeDestinstionEditor',
  downgradeComponent({component: OutcomeDestinationEditorComponent}));
