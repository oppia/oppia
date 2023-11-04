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

import cloneDeep from 'lodash/cloneDeep';

import { EventEmitter } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AlertsService } from 'services/alerts.service';
import { AnswerChoice, StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { AppConstants } from 'app.constants';
import { ExplorationEditorPageConstants } from 'pages/exploration-editor-page/exploration-editor-page.constants';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { InteractionAnswer } from 'interactions/answer-defs';
import { ItemSelectionInputCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionRuleInputs } from 'interactions/rule-input-defs';
import { LoggerService } from 'services/contextual/logger.service';
import { Outcome, OutcomeObjectFactory, } from 'domain/exploration/OutcomeObjectFactory';
import { SolutionValidityService } from 'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { SolutionVerificationService } from 'pages/exploration-editor-page/editor-tab/services/solution-verification.service';
import { StateCustomizationArgsService } from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';
import { Rule } from 'domain/exploration/rule.model';
import { InitializeAnswerGroups } from 'components/state-editor/state-interaction-editor/state-interaction-editor.component';

interface UpdateActiveAnswerGroupDest {
  dest: string;
  // Below property is null if no refresher exploration is available for
  // the current state.
  refresherExplorationId: string | null;
  // Below property is null if no missing prerequisite skill is available
  // for the current state.
  missingPrerequisiteSkillId: string | null;
}

interface UpdateAnswerGroupCorrectnessLabel {
  labelledAsCorrect: boolean;
}

interface UpdateAnswerGroupFeedback {
  feedback: SubtitledHtml;
}

interface DestIfReallyStuck {
  destIfReallyStuck: string | null;
}

interface UpdateRule {
  rules: Rule[];
}

export type UpdateActiveAnswerGroup = (
  AnswerGroup |
  DestIfReallyStuck |
  UpdateAnswerGroupFeedback |
  UpdateAnswerGroupCorrectnessLabel |
  UpdateActiveAnswerGroupDest |
  UpdateRule
);

@Injectable({
  providedIn: 'root',
})
export class ResponsesService {
  // These properties are initialized using private method and we need to do
  // non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private _answerGroupsMemento!: AnswerGroup[];
  // If the interaction is terminal, then the default outcome is null.
  private _defaultOutcomeMemento!: Outcome | null;
  private _confirmedUnclassifiedAnswersMemento!: readonly InteractionAnswer[];

  // Represents the current selected answer group, starting at index 0. If the
  // index equal to the number of answer groups (answerGroups.length), then it
  // is referring to the default outcome.
  private _activeAnswerGroupIndex!: number;
  private _answerGroups!: AnswerGroup[];
  // If the interaction is terminal, then the default outcome is null.
  private _defaultOutcome!: Outcome | null;
  private _confirmedUnclassifiedAnswers!: readonly InteractionAnswer[];
  private _answerChoices!: AnswerChoice[];
  private _activeRuleIndex: number = -1;
  private _answerGroupsChangedEventEmitter = new EventEmitter();
  private _initializeAnswerGroupsEventEmitter = new EventEmitter();

  constructor(
    private alertsService: AlertsService,
    private loggerService: LoggerService,
    private outcomeObjectFactory: OutcomeObjectFactory,
    private solutionValidityService: SolutionValidityService,
    private solutionVerificationService: SolutionVerificationService,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
    private stateSolutionService: StateSolutionService
  ) {}

  private _verifySolution = () => {
    // This checks if the solution is valid once a rule has been changed or
    // added.
    const currentInteractionId = this.stateInteractionIdService.savedMemento;
    const interactionCanHaveSolution = (
      currentInteractionId &&
      INTERACTION_SPECS[
        currentInteractionId as InteractionSpecsKey
      ].can_have_solution);
    const stateSolutionSavedMemento = (
      this.stateSolutionService.savedMemento);
    const solutionExists = (
      stateSolutionSavedMemento &&
      stateSolutionSavedMemento.correctAnswer !== null);

    const activeStateName = this.stateEditorService.getActiveStateName();
    if (
      interactionCanHaveSolution &&
      stateSolutionSavedMemento &&
      solutionExists &&
      activeStateName
    ) {
      const interaction = this.stateEditorService.getInteraction();
      interaction.answerGroups = cloneDeep(this._answerGroups);
      interaction.defaultOutcome = cloneDeep(this._defaultOutcome);
      const solutionIsValid = this.solutionVerificationService.verifySolution(
        activeStateName, interaction, stateSolutionSavedMemento.correctAnswer
      );


      const solutionWasPreviouslyValid = (
        this.solutionValidityService.isSolutionValid(activeStateName));
      this.solutionValidityService.updateValidity(
        activeStateName, solutionIsValid);

      if (solutionIsValid && !solutionWasPreviouslyValid) {
        this.alertsService.addInfoMessage(
          ExplorationEditorPageConstants.INFO_MESSAGE_SOLUTION_IS_VALID);
      } else if (!solutionIsValid && solutionWasPreviouslyValid) {
        this.alertsService.addInfoMessage(
          ExplorationEditorPageConstants.
            INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE
        );
      } else if (!solutionIsValid && !solutionWasPreviouslyValid) {
        this.alertsService.addInfoMessage(
          AppConstants.INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION
        );
      }
    }
  };

  private _saveAnswerGroups = (newAnswerGroups: AnswerGroup[]) => {
    const oldAnswerGroups = this._answerGroupsMemento;
    if (
      newAnswerGroups &&
      oldAnswerGroups &&
      !angular.equals(newAnswerGroups, oldAnswerGroups)
    ) {
      this._answerGroups = newAnswerGroups;
      this._answerGroupsChangedEventEmitter.emit();
      this._verifySolution();
      this._answerGroupsMemento = cloneDeep(newAnswerGroups);
    }
  };

  private _updateAnswerGroup = (
      index: number,
      updates: UpdateActiveAnswerGroup,
      callback: (value: AnswerGroup[]) => void
  ) => {
    const answerGroup = this._answerGroups[index];

    if (answerGroup) {
      if (updates.hasOwnProperty('rules')) {
        let ruleUpdates = updates as { rules: Rule[] };
        answerGroup.rules = ruleUpdates.rules;
      }
      if (updates.hasOwnProperty('taggedSkillMisconceptionId')) {
        let taggedSkillMisconceptionIdUpdates = updates as {
          taggedSkillMisconceptionId: string;
        };
        answerGroup.taggedSkillMisconceptionId = (
          taggedSkillMisconceptionIdUpdates.taggedSkillMisconceptionId);
      }
      if (updates.hasOwnProperty('feedback')) {
        let feedbackUpdates = updates as { feedback: SubtitledHtml };
        answerGroup.outcome.feedback = feedbackUpdates.feedback;
      }
      if (updates.hasOwnProperty('dest')) {
        let destUpdates = updates as UpdateActiveAnswerGroupDest;
        answerGroup.outcome.dest = destUpdates.dest;
      }
      if (updates.hasOwnProperty('refresherExplorationId')) {
        let refresherExplorationIdUpdates = updates as {
          refresherExplorationId: string;
        };
        answerGroup.outcome.refresherExplorationId = (
          refresherExplorationIdUpdates.refresherExplorationId);
      }
      if (updates.hasOwnProperty('missingPrerequisiteSkillId')) {
        let missingPrerequisiteSkillIdUpdates = updates as {
          missingPrerequisiteSkillId: string;
        };
        answerGroup.outcome.missingPrerequisiteSkillId = (
          missingPrerequisiteSkillIdUpdates.missingPrerequisiteSkillId);
      }
      if (updates.hasOwnProperty('labelledAsCorrect')) {
        let labelledAsCorrectUpdates = updates as {
          labelledAsCorrect: boolean;
        };
        answerGroup.outcome.labelledAsCorrect = (
          labelledAsCorrectUpdates.labelledAsCorrect);
      }
      if (updates.hasOwnProperty('destIfReallyStuck')) {
        let destIfReallyStuckUpdates = updates as {
          destIfReallyStuck: string | null;
        };
        answerGroup.outcome.destIfReallyStuck = (
          destIfReallyStuckUpdates.destIfReallyStuck);
      }
      if (updates.hasOwnProperty('trainingData')) {
        let trainingDataUpdates = updates as AnswerGroup;
        answerGroup.trainingData = trainingDataUpdates.trainingData;
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

  private _saveDefaultOutcome = (newDefaultOutcome: Outcome | null) => {
    const oldDefaultOutcome = this._defaultOutcomeMemento;
    if (!angular.equals(newDefaultOutcome, oldDefaultOutcome)) {
      this._defaultOutcome = newDefaultOutcome;
      this._verifySolution();
      this._defaultOutcomeMemento = cloneDeep(newDefaultOutcome);
    }
  };

  private _saveConfirmedUnclassifiedAnswers = (
      newConfirmedUnclassifiedAnswers: readonly InteractionAnswer[]
  ) => {
    const oldConfirmedUnclassifiedAnswers = this
      ._confirmedUnclassifiedAnswersMemento;
    if (
      !angular.equals(
        newConfirmedUnclassifiedAnswers,
        oldConfirmedUnclassifiedAnswers
      )
    ) {
      this._confirmedUnclassifiedAnswers = newConfirmedUnclassifiedAnswers;

      this._confirmedUnclassifiedAnswersMemento = (
        cloneDeep(newConfirmedUnclassifiedAnswers)
      );
    }
  };

  private _updateAnswerChoices = (newAnswerChoices: AnswerChoice[]) => {
    const oldAnswerChoices = cloneDeep(this._answerChoices);
    this._answerChoices = newAnswerChoices;
    return oldAnswerChoices;
  };

  // The 'data' arg is a list of interaction handlers for the
  // currently-active state.
  init(data: Interaction | string): void {
    let interactionData = data as Interaction;
    this._answerGroups = cloneDeep(interactionData.answerGroups);
    this._defaultOutcome = cloneDeep(interactionData.defaultOutcome);
    this._confirmedUnclassifiedAnswers = cloneDeep(
      interactionData.confirmedUnclassifiedAnswers
    );

    this._answerGroupsMemento = cloneDeep(this._answerGroups);
    this._defaultOutcomeMemento = cloneDeep(this._defaultOutcome);
    this._confirmedUnclassifiedAnswersMemento = cloneDeep(
      this._confirmedUnclassifiedAnswers
    );
    this._activeAnswerGroupIndex = -1;
    this._activeRuleIndex = 0;
  }

  getAnswerGroups(): AnswerGroup[] {
    return cloneDeep(this._answerGroups);
  }

  getAnswerGroup(index: number): AnswerGroup {
    return cloneDeep(this._answerGroups[index]);
  }

  getAnswerGroupCount(): number {
    return this._answerGroups.length;
  }

  getDefaultOutcome(): Outcome | null {
    return cloneDeep(this._defaultOutcome);
  }

  getConfirmedUnclassifiedAnswers(): readonly InteractionAnswer[] {
    return cloneDeep(this._confirmedUnclassifiedAnswers);
  }

  getAnswerChoices(): AnswerChoice[] {
    return cloneDeep(this._answerChoices);
  }

  getActiveRuleIndex(): number {
    return this._activeRuleIndex;
  }

  getActiveAnswerGroupIndex(): number {
    return this._activeAnswerGroupIndex;
  }

  onInteractionIdChanged(
      newInteractionId: string,
      callback: (value: AnswerGroup[], value2: Outcome | null) => void
  ): void {
    this._answerGroups = [];

    // Preserve the default outcome unless the interaction is terminal.
    // Recreate the default outcome if switching away from a terminal
    // interaction.
    if (newInteractionId) {
      if (INTERACTION_SPECS[
        newInteractionId as InteractionSpecsKey
      ].is_terminal) {
        this._defaultOutcome = null;
      } else if (!this._defaultOutcome) {
        const stateName = this.stateEditorService.getActiveStateName();
        if (stateName) {
          this._defaultOutcome = this.outcomeObjectFactory.createNew(
            stateName,
            ExplorationEditorPageConstants.COMPONENT_NAME_DEFAULT_OUTCOME,
            '',
            []
          );
        }
      }
    }

    this._confirmedUnclassifiedAnswers = [];

    this._saveAnswerGroups(this._answerGroups);
    this._saveDefaultOutcome(this._defaultOutcome);
    this._saveConfirmedUnclassifiedAnswers(this._confirmedUnclassifiedAnswers);

    this._answerGroupsMemento = cloneDeep(this._answerGroups);
    this._defaultOutcomeMemento = cloneDeep(this._defaultOutcome);
    this._confirmedUnclassifiedAnswersMemento = cloneDeep(
      this._confirmedUnclassifiedAnswers
    );
    this._activeAnswerGroupIndex = -1;
    this._activeRuleIndex = 0;

    if (callback) {
      callback(this._answerGroupsMemento, this._defaultOutcomeMemento);
    }
  }

  changeActiveAnswerGroupIndex(newIndex: number): void {
    // If the current group is being clicked on again, close it.
    if (newIndex === this._activeAnswerGroupIndex) {
      this._activeAnswerGroupIndex = -1;
    } else {
      this._activeAnswerGroupIndex = newIndex;
    }

    this._activeRuleIndex = -1;
  }

  changeActiveRuleIndex(newIndex: number): void {
    this._activeRuleIndex = newIndex;
  }

  shouldHideDefaultAnswerGroup(): boolean {
    let interactionId = this.stateInteractionIdService.savedMemento;
    let answerGroups = this.getAnswerGroups();
    // This array contains the text of each of the possible answers
    // for the interaction.
    let answerChoices = [];
    let customizationArgs = (
      this.stateCustomizationArgsService.savedMemento);
    let handledAnswersArray: InteractionRuleInputs[] = [];

    if (interactionId === 'MultipleChoiceInput') {
      let numChoices = this.getAnswerChoices().length;
      let choiceIndices = [];
      // Collect all answers which have been handled by at least one
      // answer group.
      for (let i = 0; i < answerGroups.length; i++) {
        for (let j = 0; j < answerGroups[i].rules.length; j++) {
          handledAnswersArray.push(answerGroups[i].rules[j].inputs.x);
        }
      }
      for (let i = 0; i < numChoices; i++) {
        choiceIndices.push(i);
      }
      // We only suppress the default warning if each choice index has
      // been handled by at least one answer group.
      return choiceIndices.every((choiceIndex) => {
        return handledAnswersArray.indexOf(choiceIndex) !== -1;
      });
    } else if (interactionId === 'ItemSelectionInput') {
      let maxSelectionCount = (
        (customizationArgs as ItemSelectionInputCustomizationArgs)
          .maxAllowableSelectionCount.value);
      if (maxSelectionCount === 1) {
        let numChoices = this.getAnswerChoices().length;
        // This array contains a list of booleans, one for each answer
        // choice. Each boolean is true if the corresponding answer has
        // been covered by at least one rule, and false otherwise.
        handledAnswersArray = [];
        for (let i = 0; i < numChoices; i++) {
          handledAnswersArray.push(false);
          answerChoices.push(this.getAnswerChoices()[i].val);
        }

        let answerChoiceToIndex:
         Record<string, number> = {};
        answerChoices.forEach((answerChoice, choiceIndex) => {
          answerChoiceToIndex[answerChoice as string] = choiceIndex;
        });

        answerGroups.forEach((answerGroup) => {
          let rules = answerGroup.rules;
          rules.forEach((rule) => {
            let ruleInputs = rule.inputs.x;
            Object.keys(ruleInputs).forEach((ruleInput) => {
              let choiceIndex = answerChoiceToIndex[ruleInput];
              if (rule.type === 'Equals' ||
                  rule.type === 'ContainsAtLeastOneOf') {
                handledAnswersArray[choiceIndex] = true;
              } else if (rule.type === 'DoesNotContainAtLeastOneOf') {
                for (let i = 0; i < handledAnswersArray.length; i++) {
                  if (i !== choiceIndex) {
                    handledAnswersArray[i] = true;
                  }
                }
              }
            });
          });
        });

        let areAllChoicesCovered = handledAnswersArray.every(
          (handledAnswer) => {
            return handledAnswer;
          });
        // We only suppress the default warning if each choice text has
        // been handled by at least one answer group, based on rule
        // type.
        return areAllChoicesCovered;
      }
    }
    return false;
  }

  updateAnswerGroup(
      index: number,
      updates: AnswerGroup,
      callback: (value: AnswerGroup[]) => void
  ): void {
    this._updateAnswerGroup(index, updates, callback);
  }

  deleteAnswerGroup(
      index: number,
      callback: (value: AnswerGroup[]) => void
  ): void {
    this._answerGroupsMemento = cloneDeep(this._answerGroups);
    this._answerGroups.splice(index, 1);
    this._activeAnswerGroupIndex = -1;
    this._saveAnswerGroups(this._answerGroups);
    callback(this._answerGroupsMemento);
  }

  updateActiveAnswerGroup(
      updates: UpdateActiveAnswerGroup,
      callback: (value: AnswerGroup[]) => void
  ): void {
    this._updateAnswerGroup(this._activeAnswerGroupIndex, updates, callback);
  }

  updateDefaultOutcome(
      updates: Outcome,
      callback: (value: Outcome | null) => void
  ): void {
    const outcome = this._defaultOutcome;
    if (!outcome) {
      return;
    }
    if (updates.hasOwnProperty('feedback')) {
      outcome.feedback = updates.feedback;
    }
    if (updates.hasOwnProperty('dest')) {
      outcome.dest = updates.dest;
    }
    if (updates.hasOwnProperty('destIfReallyStuck')) {
      outcome.destIfReallyStuck = updates.destIfReallyStuck;
    }
    if (updates.hasOwnProperty('refresherExplorationId')) {
      outcome.refresherExplorationId = updates.refresherExplorationId;
    }
    if (updates.hasOwnProperty('missingPrerequisiteSkillId')) {
      outcome.missingPrerequisiteSkillId = updates.missingPrerequisiteSkillId;
    }
    if (updates.hasOwnProperty('labelledAsCorrect')) {
      outcome.labelledAsCorrect = updates.labelledAsCorrect;
    }
    this._saveDefaultOutcome(outcome);
    callback(this._defaultOutcomeMemento);
  }

  updateConfirmedUnclassifiedAnswers(
      confirmedUnclassifiedAnswers: InteractionAnswer[]
  ): void {
    this._saveConfirmedUnclassifiedAnswers(confirmedUnclassifiedAnswers);
  }

  // Updates answer choices when the interaction is initialized or deleted.
  // For example, the rules for multiple choice need to refer to the
  // multiple choice interaction's customization arguments.
  updateAnswerChoices(newAnswerChoices: AnswerChoice[]): void {
    this._updateAnswerChoices(newAnswerChoices);
  }

  // Handles changes to custom args by updating the answer choices
  // accordingly.
  handleCustomArgsUpdate(
      newAnswerChoices: AnswerChoice[],
      callback: (value: AnswerGroup[]) => void
  ): void {
    const oldAnswerChoices = this._updateAnswerChoices(newAnswerChoices);
    // If the interaction is ItemSelectionInput, update the answer groups
    // to refer to the new answer options.
    if (
      this.stateInteractionIdService.savedMemento === 'ItemSelectionInput' &&
      oldAnswerChoices
    ) {
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
      let onlyEditsHappened = false;
      if (oldAnswerChoices.length === newAnswerChoices.length) {
        onlyEditsHappened = true;

        // Check that no answer choice appears to have been moved.
        const numAnswerChoices = oldAnswerChoices.length;
        for (let i = 0; i < numAnswerChoices; i++) {
          for (let j = 0; j < numAnswerChoices; j++) {
            if (
              i !== j &&
              oldAnswerChoices[i].val === newAnswerChoices[j].val
            ) {
              onlyEditsHappened = false;
              break;
            }
          }
        }
      }

      const oldChoiceStrings = oldAnswerChoices.map((choice) => {
        return choice.val;
      });
      const newChoiceStrings = newAnswerChoices.map((choice) => {
        return choice.val;
      });

      let key: string, newInputValue: (string | number | SubtitledHtml)[];
      this._answerGroups.forEach((answerGroup, answerGroupIndex) => {
        const newRules = cloneDeep(answerGroup.rules);
        newRules.forEach((rule) => {
          for (key in rule.inputs) {
            newInputValue = [];
            let inputValue = rule.inputs[key] as string[];
            inputValue.forEach((item: string) => {
              const newIndex = newChoiceStrings.indexOf(item);
              if (newIndex !== -1) {
                newInputValue.push(item);
              } else if (onlyEditsHappened) {
                const oldIndex = oldChoiceStrings.indexOf(item);
                if (oldIndex !== -1) {
                  newInputValue.push(newAnswerChoices[oldIndex].val);
                }
              }
            });
            rule.inputs[key] = newInputValue;
          }
        });

        this._updateAnswerGroup(
          answerGroupIndex,
          {
            rules: newRules,
          },
          callback
        );
      });
    }

    // If the interaction is DragAndDropSortInput, update the answer groups
    // to refer to the new answer options.
    if (
      this.stateInteractionIdService.savedMemento === 'DragAndDropSortInput' &&
      oldAnswerChoices
    ) {
      // If the length of the answer choices array changes, then there is
      // surely any deletion or modification or addition in the array. We
      // simply set answer groups to refer to default value. If the length
      // of the answer choices array remains the same and all the choices in
      // the previous array are present, then no change is required.
      // However, if any of the choices is not present, we set answer groups
      // to refer to the default value containing new answer choices.
      let anyChangesHappened = false;
      if (oldAnswerChoices.length !== newAnswerChoices.length) {
        anyChangesHappened = true;
      } else {
        // Check if any modification happened in answer choices.
        const numAnswerChoices = oldAnswerChoices.length;
        for (let i = 0; i < numAnswerChoices; i++) {
          let choiceIsPresent = false;
          for (let j = 0; j < numAnswerChoices; j++) {
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
          const newRules = cloneDeep(answerGroup.rules);
          newRules.forEach((rule) => {
            if (rule.type === 'HasElementXAtPositionY') {
              rule.inputs.x = newAnswerChoices[0].val;
              rule.inputs.y = 1;
            } else if (rule.type === 'HasElementXBeforeElementY') {
              rule.inputs.x = newAnswerChoices[0].val;
              rule.inputs.y = newAnswerChoices[1].val;
            } else {
              rule.inputs.x = newAnswerChoices.map(({ val }) => [val]);
            }
          });

          this._updateAnswerGroup(
            answerGroupIndex,
            {
              rules: newRules,
            },
            callback
          );
        });
      }
    }
  }

  // This registers the change to the handlers in the list of changes.
  save(
      newAnswerGroups: AnswerGroup[],
      defaultOutcome: Outcome | null,
      callback: (value: AnswerGroup[], value2: Outcome | null) => void
  ): void {
    this._saveAnswerGroups(newAnswerGroups);
    this._saveDefaultOutcome(defaultOutcome);
    callback(this._answerGroupsMemento, this._defaultOutcomeMemento);
  }

  get onAnswerGroupsChanged(): EventEmitter<string> {
    return this._answerGroupsChangedEventEmitter;
  }

  get onInitializeAnswerGroups(): (
    EventEmitter<string | Interaction | InitializeAnswerGroups>
  ) {
    return this._initializeAnswerGroupsEventEmitter;
  }
}

angular.module('oppia').factory('ResponsesService',
  downgradeInjectable(ResponsesService));
