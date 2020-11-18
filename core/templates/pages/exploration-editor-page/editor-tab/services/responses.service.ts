// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service responses corresponding to a state's interaction and
 * answer groups.
 */

import { EventEmitter } from '@angular/core';
import { Injectable } from '@angular/core';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { AnswerGroupsCacheService } from 'pages/exploration-editor-page/editor-tab/services/answer-groups-cache.service';
import { AlertsService } from 'services/alerts.service';
import { LoggerService } from 'services/contextual/logger.service';
import {
  Outcome,
  OutcomeObjectFactory,
} from 'domain/exploration/OutcomeObjectFactory';
import {
  AnswerChoice,
  StateEditorService,
  // eslint-disable-next-line max-len
} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { SolutionValidityService } from 'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { SolutionVerificationService } from 'pages/exploration-editor-page/editor-tab/services/solution-verification.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';
import { InteractionAnswer } from 'interactions/answer-defs';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');
require('pages/exploration-editor-page/editor-tab/services/' +
  'solution-verification.service.ts');

// Require('domain/exploration/OutcomeObjectFactory.ts');
// require(
//   'pages/exploration-editor-page/editor-tab/services/' +
//   'answer-groups-cache.service.ts');
// require(
//   'pages/exploration-editor-page/editor-tab/services/' +
//   'solution-validity.service.ts');
// require(
//   'pages/exploration-editor-page/editor-tab/services/' +
//   'solution-verification.service.ts');
// require(
//   'components/state-editor/state-editor-properties-services/' +
//   'state-editor.service.ts');
// require(
//   'components/state-editor/state-editor-properties-services/' +
//   'state-property.service.ts');
// require('services/alerts.service.ts');
// require('services/context.service.ts');

// require(
//   'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

@Injectable({
  providedIn: 'root',
})
export class ResponsesService {
  private _answerGroupsMemento: AnswerGroup[] = null;
  private _defaultOutcomeMemento: Outcome = null;
  private _confirmedUnclassifiedAnswersMemento: InteractionAnswer[] = null;
  // Represents the current selected answer group, starting at index 0. If the
  // index equal to the number of answer groups (answerGroups.length), then it
  // is referring to the default outcome.
  private _activeAnswerGroupIndex: number = null;
  private _activeRuleIndex: number = -1;
  private _answerGroups = null;
  private _defaultOutcome: Outcome = null;
  private _confirmedUnclassifiedAnswers: InteractionAnswer[] = null;
  private _answerChoices: AnswerChoice[] = null;
  private _answerGroupsChangedEventEmitter = new EventEmitter();
  private _initializeAnswerGroupsEventEmitter = new EventEmitter();

  constructor(
    private alertsService: AlertsService,
    private answerGroupsCacheService: AnswerGroupsCacheService,
    private loggerService: LoggerService,
    private outcomeObjectFactory: OutcomeObjectFactory,
    private solutionValidityService: SolutionValidityService,
    private solutionVerificationService: SolutionVerificationService,
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
    private stateSolutionService: StateSolutionService
  ) {}

  private _verifySolution = () => {
    // This checks if the solution is valid once a rule has been changed or
    // added.
    var currentInteractionId = this.stateInteractionIdService.savedMemento;
    var interactionCanHaveSolution =
      currentInteractionId &&
      INTERACTION_SPECS[currentInteractionId].can_have_solution;
    var solutionExists =
      this.stateSolutionService.savedMemento &&
      this.stateSolutionService.savedMemento.correctAnswer !== null;

    if (interactionCanHaveSolution && solutionExists) {
      var interaction = this.stateEditorService.getInteraction();

      interaction.answerGroups = angular.copy(this._answerGroups);
      interaction.defaultOutcome = angular.copy(this._defaultOutcome);
      var solutionIsValid = this.solutionVerificationService.verifySolution(
        this.stateEditorService.getActiveStateName(),
        interaction,
        this.stateSolutionService.savedMemento.correctAnswer
      );

      var solutionWasPreviouslyValid = this.solutionValidityService.isSolutionValid(
        this.stateEditorService.getActiveStateName()
      );
      this.solutionValidityService.updateValidity(
        this.stateEditorService.getActiveStateName(),
        solutionIsValid
      );
      if (solutionIsValid && !solutionWasPreviouslyValid) {
        this.alertsService.addInfoMessage(INFO_MESSAGE_SOLUTION_IS_VALID);
      } else if (!solutionIsValid && solutionWasPreviouslyValid) {
        this.alertsService.addInfoMessage(
          INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE
        );
      } else if (!solutionIsValid && !solutionWasPreviouslyValid) {
        this.alertsService.addInfoMessage(
          INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION
        );
      }
    }
  };

  private _saveAnswerGroups = (newAnswerGroups) => {
    var oldAnswerGroups = this._answerGroupsMemento;
    if (
      newAnswerGroups &&
      oldAnswerGroups &&
      !angular.equals(newAnswerGroups, oldAnswerGroups)
    ) {
      this._answerGroups = newAnswerGroups;
      this._answerGroupsChangedEventEmitter.emit();
      this._verifySolution();
      this._answerGroupsMemento = angular.copy(newAnswerGroups);
    }
  };

  private _updateAnswerGroup = (index, updates, callback) => {
    var answerGroup = this._answerGroups[index];

    if (answerGroup) {
      if (updates.hasOwnProperty('rules')) {
        answerGroup.rules = updates.rules;
      }
      if (updates.hasOwnProperty('taggedSkillMisconceptionId')) {
        answerGroup.taggedSkillMisconceptionId =
          updates.taggedSkillMisconceptionId;
      }
      if (updates.hasOwnProperty('feedback')) {
        answerGroup.outcome.feedback = updates.feedback;
      }
      if (updates.hasOwnProperty('dest')) {
        answerGroup.outcome.dest = updates.dest;
      }
      if (updates.hasOwnProperty('refresherExplorationId')) {
        answerGroup.outcome.refresherExplorationId =
          updates.refresherExplorationId;
      }
      if (updates.hasOwnProperty('missingPrerequisiteSkillId')) {
        answerGroup.outcome.missingPrerequisiteSkillId =
          updates.missingPrerequisiteSkillId;
      }
      if (updates.hasOwnProperty('labelledAsCorrect')) {
        answerGroup.outcome.labelledAsCorrect = updates.labelledAsCorrect;
      }
      if (updates.hasOwnProperty('trainingData')) {
        answerGroup.trainingData = updates.trainingData;
      }
      this._saveAnswerGroups(this._answerGroups);
      callback(this._answerGroupsMemento);
    } else {
      this._activeAnswerGroupIndex = -1;

      this.loggerService.error(
        'The index provided does not exist in _answerGroups array.'
      );
    }
  };

  private _saveDefaultOutcome = (newDefaultOutcome) => {
    var oldDefaultOutcome = this._defaultOutcomeMemento;
    if (!angular.equals(newDefaultOutcome, oldDefaultOutcome)) {
      this._defaultOutcome = newDefaultOutcome;
      this._verifySolution();
      this._defaultOutcomeMemento = angular.copy(newDefaultOutcome);
    }
  };

  private _saveConfirmedUnclassifiedAnswers = (
      newConfirmedUnclassifiedAnswers
  ) => {
    var oldConfirmedUnclassifiedAnswers = this
      ._confirmedUnclassifiedAnswersMemento;
    if (
      !angular.equals(
        newConfirmedUnclassifiedAnswers,
        oldConfirmedUnclassifiedAnswers
      )
    ) {
      this._confirmedUnclassifiedAnswers = newConfirmedUnclassifiedAnswers;

      this._confirmedUnclassifiedAnswersMemento = angular.copy(
        newConfirmedUnclassifiedAnswers
      );
    }
  };

  private _updateAnswerChoices = (newAnswerChoices) => {
    var oldAnswerChoices = angular.copy(this._answerChoices);
    this._answerChoices = newAnswerChoices;
    return oldAnswerChoices;
  };

  // The 'data' arg is a list of interaction handlers for the
  // currently-active state.
  init(data): void {
    this.answerGroupsCacheService.reset();

    this._answerGroups = angular.copy(data.answerGroups);
    this._defaultOutcome = angular.copy(data.defaultOutcome);
    this._confirmedUnclassifiedAnswers = angular.copy(
      data.confirmedUnclassifiedAnswers);
    if (this.stateInteractionIdService.savedMemento !== null) {
      this.answerGroupsCacheService.set(
        this.stateInteractionIdService.savedMemento, this._answerGroups);
    }

    this._answerGroupsMemento = angular.copy(this._answerGroups);
    this._defaultOutcomeMemento = angular.copy(this._defaultOutcome);
    this._confirmedUnclassifiedAnswersMemento = angular.copy(
      this._confirmedUnclassifiedAnswers);
    this._activeAnswerGroupIndex = -1;
    this._activeRuleIndex = 0;
  }
  getAnswerGroups() {
    return angular.copy(_answerGroups);
  }

  getAnswerGroup(index) {
    return angular.copy(this._answerGroups[index]);
  }
  getAnswerGroupCount() {
    return this._answerGroups.length;
  }
  getDefaultOutcome() {
    return angular.copy(this._defaultOutcome);
  }
  getConfirmedUnclassifiedAnswers() {
    return angular.copy(this._confirmedUnclassifiedAnswers);
  }
  getAnswerChoices() {
    return angular.copy(this._answerChoices);
  }
  getActiveRuleIndex() {
    return this._activeRuleIndex;
  }
  getActiveAnswerGroupIndex() {
    return this._activeAnswerGroupIndex;
  }
  onInteractionIdChanged(newInteractionId, callback) {
    if (this.answerGroupsCacheService.contains(newInteractionId)) {
      this._answerGroups = this.answerGroupsCacheService.get(newInteractionId);
    } else {
      this._answerGroups = [];
    }

    // Preserve the default outcome unless the interaction is terminal.
    // Recreate the default outcome if switching away from a terminal
    // interaction.
    if (newInteractionId) {
      if (INTERACTION_SPECS[newInteractionId].is_terminal) {
        this._defaultOutcome = null;
      } else if (!this._defaultOutcome) {
        this._defaultOutcome = this.outcomeObjectFactory.createNew(
          this.stateEditorService.getActiveStateName(),
          COMPONENT_NAME_DEFAULT_OUTCOME, '', []);
      }
    }

    this._confirmedUnclassifiedAnswers = [];

    this._saveAnswerGroups(this._answerGroups);
    this._saveDefaultOutcome(this._defaultOutcome);
    this._saveConfirmedUnclassifiedAnswers(this._confirmedUnclassifiedAnswers);
    if (newInteractionId) {
      this.answerGroupsCacheService.set(newInteractionId, this._answerGroups);
    }

    this._answerGroupsMemento = angular.copy(this._answerGroups);
    this._defaultOutcomeMemento = angular.copy(this._defaultOutcome);
    this._confirmedUnclassifiedAnswersMemento = angular.copy(
      this._confirmedUnclassifiedAnswers);
    this._activeAnswerGroupIndex = -1;
    this._activeRuleIndex = 0;

    if (callback) {
      callback(this._answerGroupsMemento, this._defaultOutcomeMemento);
    }
  }
  changeActiveAnswerGroupIndex(newIndex) {
    // If the current group is being clicked on again, close it.
    if (newIndex === this._activeAnswerGroupIndex) {
      this._activeAnswerGroupIndex = -1;
    } else {
      this._activeAnswerGroupIndex = newIndex;
    }

    this._activeRuleIndex = -1;
  }
  changeActiveRuleIndex(newIndex) {
    this._activeRuleIndex = newIndex;
  }
  updateAnswerGroup(index, updates, callback) {
    this._updateAnswerGroup(index, updates, callback);
  }
  deleteAnswerGroup(index, callback) {
    this._answerGroupsMemento = angular.copy(this._answerGroups);
    this._answerGroups.splice(index, 1);
    this._activeAnswerGroupIndex = -1;
    this._saveAnswerGroups(this._answerGroups);
    callback(this._answerGroupsMemento);
  }
      updateActiveAnswerGroup: (updates, callback) => {
        _updateAnswerGroup(_activeAnswerGroupIndex, updates, callback);
      };
      updateDefaultOutcome(updates, callback) {
        var outcome = this._defaultOutcome;
        if (updates.hasOwnProperty('feedback')) {
          outcome.feedback = updates.feedback;
        }
        if (updates.hasOwnProperty('dest')) {
          outcome.dest = updates.dest;
        }
        if (updates.hasOwnProperty('refresherExplorationId')) {
          outcome.refresherExplorationId = updates.refresherExplorationId;
        }
        if (updates.hasOwnProperty('missingPrerequisiteSkillId')) {
          outcome.missingPrerequisiteSkillId =
            updates.missingPrerequisiteSkillId;
        }
        if (updates.hasOwnProperty('labelledAsCorrect')) {
          outcome.labelledAsCorrect = updates.labelledAsCorrect;
        }
        this._saveDefaultOutcome(outcome);
        callback(this._defaultOutcomeMemento);
      }
      updateConfirmedUnclassifiedAnswers: (
          confirmedUnclassifiedAnswers) => {
        _saveConfirmedUnclassifiedAnswers(confirmedUnclassifiedAnswers);
      };
      // Updates answer choices when the interaction is initialized or deleted.
      // For example, the rules for multiple choice need to refer to the
      // multiple choice interaction's customization arguments.
      updateAnswerChoices: (newAnswerChoices) => {
        _updateAnswerChoices(newAnswerChoices);
      };
      // Handles changes to custom args by updating the answer choices
      // accordingly.
      handleCustomArgsUpdate(newAnswerChoices, callback) {
        var oldAnswerChoices = this._updateAnswerChoices(newAnswerChoices);
        // If the interaction is ItemSelectionInput, update the answer groups
        // to refer to the new answer options.
        if (this.stateInteractionIdService.savedMemento === 'ItemSelectionInput' &&
            oldAnswerChoices) {
          // We use an approximate algorithm here. If the length of the answer
          // choices array remains the same, and no choice is replicated at
          // different indices in both arrays (which indicates that some
          // moving-around happened), then replace any old choice with its
          // corresponding new choice. Otherwise, we simply remove any answer
          // that has not been changed. This is not foolproof, but it should
          // cover most cases.
          //
          // TODO(sll): Find a way to make this fully deterministic. This can
          // probably only occur after we support custom editors for
          // interactions.
          var onlyEditsHappened = false;
          if (oldAnswerChoices.length === newAnswerChoices.length) {
            onlyEditsHappened = true;

            // Check that no answer choice appears to have been moved.
            var numAnswerChoices = oldAnswerChoices.length;
            for (var i = 0; i < numAnswerChoices; i++) {
              for (var j = 0; j < numAnswerChoices; j++) {
                if (i !== j &&
                    oldAnswerChoices[i].val === newAnswerChoices[j].val) {
                  onlyEditsHappened = false;
                  break;
                }
              }
            }
          }

          var oldChoiceStrings = oldAnswerChoices.map((choice) => {
            return choice.val;
          });
          var newChoiceStrings = newAnswerChoices.map((choice) => {
            return choice.val;
          });

          var key, newInputValue;
          this._answerGroups.forEach((answerGroup, answerGroupIndex) => {
            var newRules = angular.copy(answerGroup.rules);
            newRules.forEach((rule) => {
              for (key in rule.inputs) {
                newInputValue = [];
                rule.inputs[key].forEach((item) => {
                  var newIndex = newChoiceStrings.indexOf(item);
                  if (newIndex !== -1) {
                    newInputValue.push(item);
                  } else if (onlyEditsHappened) {
                    var oldIndex = oldChoiceStrings.indexOf(item);
                    if (oldIndex !== -1) {
                      newInputValue.push(newAnswerChoices[oldIndex].val);
                    }
                  }
                });
                rule.inputs[key] = newInputValue;
              }
            });

            this._updateAnswerGroup(answerGroupIndex, {
              rules: newRules
            }, callback);
          });
        }

        // If the interaction is DragAndDropSortInput, update the answer groups
        // to refer to the new answer options.
        if (this.stateInteractionIdService.savedMemento ===
          'DragAndDropSortInput' && oldAnswerChoices) {
          // If the length of the answer choices array changes, then there is
          // surely any deletion or modification or addition in the array. We
          // simply set answer groups to refer to default value. If the length
          // of the answer choices array remains the same and all the choices in
          // the previous array are present, then no change is required.
          // However, if any of the choices is not present, we set answer groups
          // to refer to the default value containing new answer choices.
          var anyChangesHappened = false;
          if (oldAnswerChoices.length !== newAnswerChoices.length) {
            anyChangesHappened = true;
          } else {
            // Check if any modification happened in answer choices.
            var numAnswerChoices = oldAnswerChoices.length;
            for (var i = 0; i < numAnswerChoices; i++) {
              var choiceIsPresent = false;
              for (var j = 0; j < numAnswerChoices; j++) {
                if (oldAnswerChoices[i].val === newAnswerChoices[j].val) {
                  choiceIsPresent = true;
                  break;
                }
              }
              if (choiceIsPresent === false) {
                anyChangesHappened = true;
                break;
              }
            }
          }

          if (anyChangesHappened) {
            this._answerGroups.forEach((answerGroup, answerGroupIndex) => {
              var newRules = angular.copy(answerGroup.rules);
              newRules.forEach((rule) => {
                if (rule.type === 'HasElementXAtPositionY') {
                  rule.inputs.x = newAnswerChoices[0].val;
                  rule.inputs.y = 1;
                } else if (rule.type === 'HasElementXBeforeElementY') {
                  rule.inputs.x = newAnswerChoices[0].val;
                  rule.inputs.y = newAnswerChoices[1].val;
                } else {
                  rule.inputs.x = newAnswerChoices.map(({val}) => [val]);
                }
              });

              this._updateAnswerGroup(answerGroupIndex, {
                rules: newRules
              }, callback);
            });
          }
        }
      }
      // This registers the change to the handlers in the list of changes.
      save: (newAnswerGroups, defaultOutcome, callback) => {
        _saveAnswerGroups(newAnswerGroups);
        _saveDefaultOutcome(defaultOutcome);
        callback(_answerGroupsMemento, _defaultOutcomeMemento);
      };

      get onAnswerGroupsChanged(): EventEmitter<unknown> {
        return this._answerGroupsChangedEventEmitter;
      }

      get onInitializeAnswerGroups(): EventEmitter<unknown> {
        return this._initializeAnswerGroupsEventEmitter;
      }
}
