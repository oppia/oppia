// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Data service for keeping track of the exploration's states.
 * Note that this is unlike the other exploration property services, in that it
 * keeps no mementos.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { EventEmitter, Injectable } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';

import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { ConfirmDeleteStateModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/confirm-delete-state-modal.component';
import { ContextService } from 'services/context.service';
import { ChangeListService, StatePropertyNames, StatePropertyValues } from 'pages/exploration-editor-page/services/change-list.service';
import { StateObjectsBackendDict, States, StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { SolutionValidityService } from 'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { AnswerClassificationService } from 'pages/exploration-player-page/services/answer-classification.service';
import { AngularNameService } from 'pages/exploration-editor-page/services/angular-name.service';
import { AlertsService } from 'services/alerts.service';
import { ValidatorsService } from 'services/validators.service';
import { ExplorationInitStateNameService } from 'pages/exploration-editor-page/services/exploration-init-state-name.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateEditorRefreshService } from 'pages/exploration-editor-page/services/state-editor-refresh.service';
import { State } from 'domain/state/StateObjectFactory';
import { NormalizeWhitespacePipe } from 'filters/string-utility-filters/normalize-whitespace.pipe';
import { WrittenTranslations } from 'domain/exploration/WrittenTranslationsObjectFactory';
import { DataFormatToDefaultValuesKey } from 'domain/exploration/WrittenTranslationObjectFactory';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { Hint } from 'domain/exploration/HintObjectFactory';
import { Solution } from 'domain/exploration/SolutionObjectFactory';
import { InteractionCustomizationArgs, NumberWithUnitsCustomizationArgsBackendDict } from 'interactions/customization-args-defs';
import { ParamSpecs } from 'domain/exploration/ParamSpecsObjectFactory';
import { ParamChange } from 'domain/exploration/ParamChangeObjectFactory';
import { SubtitledHtml, SubtitledHtmlBackendDict } from 'domain/exploration/subtitled-html.model';
import { InteractionRulesRegistryService } from 'services/interaction-rules-registry.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { BaseTranslatableObject } from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root'
})
export class ExplorationStatesService {
  stateAddedCallbacks: ((addedStateName: string) => void)[] = [];
  stateDeletedCallbacks: ((deletedStateName: string) => void)[] = [];
  stateRenamedCallbacks: (
    (oldStateName: string, newStateName: string) => void
  )[] = [];

  stateInteractionSavedCallbacks: ((state: State) => void)[] = [];
  private _states!: States;
  private _refreshGraphEventEmitter: EventEmitter<unknown> = new EventEmitter();

  constructor(
    private angularNameService: AngularNameService,
    private alertsService: AlertsService,
    private answerClassificationService: AnswerClassificationService,
    private changeListService: ChangeListService,
    private contextService: ContextService,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private interactionRulesRegistryService: InteractionRulesRegistryService,
    private windowRef: WindowRef,
    private ngbModal: NgbModal,
    private normalizeWhitespacePipe: NormalizeWhitespacePipe,
    private solutionValidityService: SolutionValidityService,
    private stateEditorService: StateEditorService,
    private stateEditorRefreshService: StateEditorRefreshService,
    private statesObjectFactory: StatesObjectFactory,
    private validatorsService: ValidatorsService,
  ) {}

  // Properties that have a different backend representation from the
  // frontend and must be converted.
  private _BACKEND_CONVERSIONS = {
    answer_groups: (answerGroups: AnswerGroup[]) => {
      return answerGroups.map((answerGroup) => {
        return answerGroup.toBackendDict();
      });
    },
    content: (content: SubtitledHtml): SubtitledHtmlBackendDict => {
      return content.toBackendDict();
    },
    recorded_voiceovers: (recordedVoiceovers: RecordedVoiceovers) => {
      return recordedVoiceovers.toBackendDict();
    },
    default_outcome: (defaultOutcome: Outcome | null) => {
      if (defaultOutcome) {
        return defaultOutcome.toBackendDict();
      } else {
        return null;
      }
    },
    hints: (hints: Hint[]) => {
      return hints.map((hint) => {
        return hint.toBackendDict();
      });
    },
    param_changes: (paramChanges: ParamChange[]) => {
      return paramChanges.map((paramChange) => {
        return paramChange.toBackendDict();
      });
    },
    param_specs: (paramSpecs: ParamSpecs) => {
      return paramSpecs.toBackendDict();
    },
    solution: (solution: Solution) => {
      if (solution) {
        return solution.toBackendDict();
      } else {
        return null;
      }
    },
    written_translations: (writtenTranslations: WrittenTranslations) => {
      return writtenTranslations.toBackendDict();
    },
    widget_customization_args: (
        customizationArgs: InteractionCustomizationArgs
    ) => {
      return Interaction.convertCustomizationArgsToBackendDict(
        customizationArgs);
    }
  };

  // Maps backend names to the corresponding frontend dict accessor lists.
  PROPERTY_REF_DATA = {
    answer_groups: ['interaction', 'answerGroups'],
    confirmed_unclassified_answers: [
      'interaction', 'confirmedUnclassifiedAnswers'],
    content: ['content'],
    recorded_voiceovers: ['recordedVoiceovers'],
    linked_skill_id: ['linkedSkillId'],
    default_outcome: ['interaction', 'defaultOutcome'],
    param_changes: ['paramChanges'],
    param_specs: ['paramSpecs'],
    hints: ['interaction', 'hints'],
    next_content_id_index: ['nextContentIdIndex'],
    solicit_answer_details: ['solicitAnswerDetails'],
    card_is_checkpoint: ['cardIsCheckpoint'],
    solution: ['interaction', 'solution'],
    widget_id: ['interaction', 'id'],
    widget_customization_args: ['interaction', 'customizationArgs'],
    written_translations: ['writtenTranslations']
  };

  private _CONTENT_ID_EXTRACTORS = {
    answer_groups: (answerGroups: AnswerGroup[]) => {
      let contentIds: Set<string> = new Set();
      answerGroups.forEach((answerGroup) => {
        let contentId = answerGroup.outcome.feedback.contentId;
        if (contentId !== null) {
          contentIds.add(contentId);
        }
        answerGroup.rules.forEach((rule) => {
          Object.keys(rule.inputs).forEach(inputName => {
            const ruleInput = rule.inputs[inputName];
            // All rules input types which are translatable are subclasses of
            // BaseTranslatableObject having dict structure with contentId
            // as a key.
            if (ruleInput && ruleInput.hasOwnProperty('contentId')) {
              let input = ruleInput as BaseTranslatableObject;
              let contentId = input.contentId;
              if (contentId !== null) {
                contentIds.add(contentId);
              }
            }
          });
        });
      });
      return contentIds;
    },
    default_outcome: (defaultOutcome: Outcome) => {
      let contentIds: Set<string> = new Set();
      if (defaultOutcome) {
        let contentId = defaultOutcome.feedback.contentId;
        if (contentId !== null) {
          contentIds.add(contentId);
        }
      }
      return contentIds;
    },
    hints: (hints: Hint[]) => {
      let contentIds: Set<string> = new Set();
      hints.forEach((hint) => {
        let contentId = hint.hintContent.contentId;
        if (contentId !== null) {
          contentIds.add(contentId);
        }
      });
      return contentIds;
    },
    solution: (solution: Solution) => {
      let contentIds: Set<string> = new Set();
      let contentId = solution.explanation.contentId;
      if (solution && contentId !== null) {
        contentIds.add(contentId);
      }
      return contentIds;
    },
    widget_customization_args: (
        customizationArgs: InteractionCustomizationArgs
    ) => {
      return new Set(
        Interaction.getCustomizationArgContentIds(customizationArgs)
      ) as Set<string>;
    }
  };

  private _getElementsInFirstSetButNotInSecond(
      setA: Set<string>, setB: Set<string>
  ): string[] {
    let diffList = Array.from(setA).filter((element) => {
      return !setB.has(element);
    });
    return diffList as string[];
  }

  private _setState(
      stateName: string, stateData: State, refreshGraph: boolean
  ): void {
    this._states.setState(stateName, cloneDeep(stateData));
    if (refreshGraph) {
      this._refreshGraphEventEmitter.emit();
    }
  }

  getStatePropertyMemento(
     stateName: string, backendName: 'content'
  ): SubtitledHtml;
  getStatePropertyMemento(
      stateName: string, backendName: 'param_changes'
  ): ParamChange[];
  getStatePropertyMemento(stateName: string, backendName: 'widget_id'): string;
  getStatePropertyMemento(
      stateName: string, backendName: 'widget_customization_args'
  ): InteractionCustomizationArgs;
  getStatePropertyMemento(
      stateName: string, backendName: 'answer_groups'
  ): AnswerGroup[];
  getStatePropertyMemento(
      stateName: string, backendName: 'confirmed_unclassified_answers'
  ): AnswerGroup[];
  getStatePropertyMemento(
      stateName: string, backendName: 'default_outcome'
  ): Outcome;
  getStatePropertyMemento(stateName: string, backendName: 'hints'): Hint[];
  getStatePropertyMemento(
      stateName: string, backendName: 'solution'
  ): SubtitledHtml;
  getStatePropertyMemento(
      stateName: string, backendName: 'recorded_voiceovers'
  ): RecordedVoiceovers;
  getStatePropertyMemento(
      stateName: string, backendName: 'solicit_answer_details'
  ): boolean;
  getStatePropertyMemento(
      stateName: string, backendName: 'card_is_checkpoint'
  ): boolean;
  getStatePropertyMemento(
      stateName: string, backendName: StatePropertyNames
  ): StatePropertyValues;
  getStatePropertyMemento(
      stateName: string, backendName: StatePropertyNames
  ): StatePropertyValues {
    let accessorList = this.PROPERTY_REF_DATA[
      backendName as keyof typeof this.PROPERTY_REF_DATA
    ];
    let propertyRef: State | string;
    propertyRef = this._states.getState(stateName);
    try {
      accessorList.forEach((key: string) => {
        propertyRef = propertyRef[key as keyof typeof propertyRef];
      });
    } catch (e) {
      let additionalInfo = (
        '\nUndefined states error debug logs:' +
        '\nRequested state name: ' + stateName +
        '\nExploration ID: ' + this.contextService.getExplorationId() +
        '\nChange list: ' + JSON.stringify(
          this.changeListService.getChangeList()) +
        '\nAll states names: ' + this._states.getStateNames());
      if (e instanceof Error) {
        e.message += additionalInfo;
      }
      throw e;
    }

    return cloneDeep(propertyRef);
  }

  saveStateProperty(
      stateName: string, backendName: 'content', newValue: SubtitledHtml
  ): void;
  saveStateProperty(
      stateName: string, backendName: 'param_changes', newValue: ParamChange[]
  ): void;
  saveStateProperty(
      stateName: string, backendName: 'widget_id', newValue: string
  ): void;
  saveStateProperty(
      stateName: string,
      backendName: 'widget_customization_args',
      newValue: InteractionCustomizationArgs
  ): void;
  saveStateProperty(
      stateName: string, backendName: 'answer_groups', newValue: AnswerGroup[]
  ): void;
  saveStateProperty(
      stateName: string,
      backendName: 'confirmed_unclassified_answers',
      newValue: AnswerGroup[]
  ): void;
  saveStateProperty(
      stateName: string, backendName: 'default_outcome', newValue: Outcome
  ): void;
  saveStateProperty(
      stateName: string, backendName: 'hints', newValue: Hint[]
  ): void;
  saveStateProperty(
      stateName: string, backendName: 'solution', newValue: SubtitledHtml
  ): void;
  saveStateProperty(
      stateName: string,
      backendName: 'recorded_voiceovers',
      newValue: RecordedVoiceovers
  ): void;
  saveStateProperty(
      stateName: string,
      backendName: 'solicit_answer_details',
      newValue: boolean
  ): void;
  saveStateProperty(
      stateName: string, backendName: 'card_is_checkpoint', newValue: boolean
  ): void;
  saveStateProperty(
      stateName: string, backendName: 'linked_skill_id', newValue: string
  ): void;
  saveStateProperty(
      stateName: string, backendName: 'next_content_id_index', newValue: number
  ): void;
  saveStateProperty(
      stateName: string,
      backendName: StatePropertyNames,
      newValue: StatePropertyValues
  ): void {
    let oldValue = (
      this.getStatePropertyMemento(stateName, backendName));
    let newBackendValue = cloneDeep(newValue);
    let oldBackendValue = cloneDeep(oldValue);

    if (this._BACKEND_CONVERSIONS.hasOwnProperty(backendName)) {
      newBackendValue = (
        this.convertToBackendRepresentation(newValue, backendName)
      ) as StatePropertyValues;
      oldBackendValue = (
        this.convertToBackendRepresentation(oldValue, backendName)
      ) as StatePropertyValues;
    }

    if (!isEqual(oldValue, newValue)) {
      this.changeListService.editStateProperty(
        stateName, backendName, newBackendValue, oldBackendValue);

      let newStateData = this._states.getState(stateName);
      let accessorList = this.PROPERTY_REF_DATA[
        backendName as keyof typeof this.PROPERTY_REF_DATA
      ];

      if (this._CONTENT_ID_EXTRACTORS.hasOwnProperty(backendName)) {
        let contentIds = this._CONTENT_ID_EXTRACTORS[
          backendName as keyof typeof this._CONTENT_ID_EXTRACTORS
        ];
        let oldContentIds = contentIds(oldValue as keyof typeof contentIds);
        let newContentIds = contentIds(newValue as keyof typeof contentIds);
        let contentIdsToDelete = this._getElementsInFirstSetButNotInSecond(
          oldContentIds, newContentIds);
        let contentIdsToAdd = this._getElementsInFirstSetButNotInSecond(
          newContentIds, oldContentIds);
        contentIdsToDelete.forEach((contentId) => {
          newStateData.recordedVoiceovers.deleteContentId(contentId);
          newStateData.writtenTranslations.deleteContentId(contentId);
        });
        contentIdsToAdd.forEach((contentId) => {
          newStateData.recordedVoiceovers.addContentId(contentId);
          newStateData.writtenTranslations.addContentId(contentId);
        });
      }
      let propertyRef: Record<string, string> | State;
      propertyRef = newStateData;
      for (let i = 0; i < accessorList.length - 1; i++) {
        propertyRef = propertyRef[accessorList[i]];
      }

      propertyRef[accessorList[accessorList.length - 1]] = cloneDeep(
        newValue);

      // We do not refresh the state editor immediately after the interaction
      // id alone is saved, because the customization args dict will be
      // temporarily invalid. A change in interaction id will always entail
      // a change in the customization args dict anyway, so the graph will
      // get refreshed after both properties have been updated.
      let refreshGraph = (backendName !== 'widget_id');
      this._setState(stateName, newStateData, refreshGraph);
    }
  }

  convertToBackendRepresentation(
      frontendValue: StatePropertyValues, backendName: string
  ): NumberWithUnitsCustomizationArgsBackendDict | null {
    let conversionFunction = this._BACKEND_CONVERSIONS[
      backendName as keyof typeof this._BACKEND_CONVERSIONS
    ];
    return conversionFunction(frontendValue as keyof typeof conversionFunction);
  }

  init(statesBackendDict: StateObjectsBackendDict): void {
    this._states = (
      this.statesObjectFactory.createFromBackendDict(statesBackendDict));
    // Initialize the solutionValidityService.
    this.solutionValidityService.init(this._states.getStateNames());
    this._states.getStateNames().forEach((stateName: string) => {
      let solution = this._states.getState(stateName).interaction.solution;
      if (solution) {
        let interactionId = this._states.getState(stateName).interaction.id;
        if (interactionId === null) {
          throw new Error(
            'Cannot save a solution for an interaction with no ID.');
        }
        let result = (
          this.answerClassificationService.getMatchingClassificationResult(
            stateName,
            this._states.getState(stateName).interaction,
            solution.correctAnswer,
            this.interactionRulesRegistryService.getRulesServiceByInteractionId(
              interactionId
            )
          )
        );
        let solutionIsValid = stateName !== result.outcome.dest;
        this.solutionValidityService.updateValidity(
          stateName, solutionIsValid);
      }
    });
  }

  getStates(): States {
    return cloneDeep(this._states);
  }

  getStateNames(): string[] {
    return this._states.getStateNames();
  }

  hasState(stateName: string): boolean {
    return this._states.hasState(stateName);
  }

  getState(stateName: string): State {
    return cloneDeep(this._states.getState(stateName));
  }

  setState(stateName: string, stateData: State): void {
    this._setState(stateName, stateData, true);
  }

  getCheckpointCount(): number {
    let count: number = 0;
    if (this._states) {
      this._states.getStateNames().forEach((stateName) => {
        if (this._states.getState(stateName).cardIsCheckpoint) {
          count++;
        }
      });
    }
    return count;
  }

  isNewStateNameValid(newStateName: string, showWarnings: boolean): boolean {
    if (this._states.hasState(newStateName)) {
      if (showWarnings) {
        this.alertsService.addWarning('A state with this name already exists.');
      }
      return false;
    }
    return (
      this.validatorsService.isValidStateName(newStateName, showWarnings));
  }

  getStateContentMemento(stateName: string): SubtitledHtml {
    return this.getStatePropertyMemento(stateName, 'content');
  }

  saveStateContent(stateName: string, newContent: SubtitledHtml): void {
    this.saveStateProperty(stateName, 'content', newContent);
  }

  getStateParamChangesMemento(stateName: string): ParamChange[] {
    return this.getStatePropertyMemento(stateName, 'param_changes');
  }

  saveStateParamChanges(
      stateName: string, newParamChanges: ParamChange[]
  ): void {
    this.saveStateProperty(stateName, 'param_changes', newParamChanges);
  }

  getInteractionIdMemento(stateName: string): string {
    return this.getStatePropertyMemento(stateName, 'widget_id');
  }

  saveInteractionId(stateName: string, newInteractionId: string): void {
    this.saveStateProperty(stateName, 'widget_id', newInteractionId);
    this.stateInteractionSavedCallbacks.forEach((callback) => {
      callback(this._states.getState(stateName));
    });
  }

  saveLinkedSkillId(stateName: string, newLinkedSkillId: string): void {
    this.saveStateProperty(stateName, 'linked_skill_id', newLinkedSkillId);
  }

  saveNextContentIdIndex(
      stateName: string, newNextContentIdIndex: number
  ): void {
    this.saveStateProperty(
      stateName, 'next_content_id_index', newNextContentIdIndex);
  }

  getInteractionCustomizationArgsMemento(
      stateName: string
  ): InteractionCustomizationArgs {
    return this.getStatePropertyMemento(stateName, 'widget_customization_args');
  }

  saveInteractionCustomizationArgs(
      stateName: string, newCustomizationArgs: InteractionCustomizationArgs
  ): void {
    this.saveStateProperty(
      stateName, 'widget_customization_args', newCustomizationArgs);
    this.stateInteractionSavedCallbacks.forEach((callback) => {
      callback(this._states.getState(stateName));
    });
  }

  getInteractionAnswerGroupsMemento(stateName: string): AnswerGroup[] {
    return this.getStatePropertyMemento(stateName, 'answer_groups');
  }

  saveInteractionAnswerGroups(
      stateName: string, newAnswerGroups: AnswerGroup[]
  ): void {
    this.saveStateProperty(stateName, 'answer_groups', newAnswerGroups);
    this.stateInteractionSavedCallbacks.forEach((callback) => {
      callback(this._states.getState(stateName));
    });
  }

  getConfirmedUnclassifiedAnswersMemento(stateName: string): AnswerGroup[] {
    return this.getStatePropertyMemento(
      stateName, 'confirmed_unclassified_answers');
  }

  saveConfirmedUnclassifiedAnswers(
      stateName: string, newAnswers: AnswerGroup[]
  ): void {
    this.saveStateProperty(
      stateName, 'confirmed_unclassified_answers', newAnswers);
    this.stateInteractionSavedCallbacks.forEach((callback) => {
      callback(this._states.getState(stateName));
    });
  }

  getInteractionDefaultOutcomeMemento(stateName: string): Outcome {
    return this.getStatePropertyMemento(stateName, 'default_outcome');
  }

  saveInteractionDefaultOutcome(
      stateName: string, newDefaultOutcome: Outcome
  ): void {
    this.saveStateProperty(stateName, 'default_outcome', newDefaultOutcome);
  }

  getHintsMemento(stateName: string): Hint[] {
    return this.getStatePropertyMemento(stateName, 'hints');
  }

  saveHints(stateName: string, newHints: Hint[]): void {
    this.saveStateProperty(stateName, 'hints', newHints);
  }

  getSolutionMemento(stateName: string): SubtitledHtml {
    return this.getStatePropertyMemento(stateName, 'solution');
  }

  saveSolution(stateName: string, newSolution: SubtitledHtml): void {
    this.saveStateProperty(stateName, 'solution', newSolution);
  }

  getRecordedVoiceoversMemento(stateName: string): RecordedVoiceovers {
    return this.getStatePropertyMemento(stateName, 'recorded_voiceovers');
  }

  saveRecordedVoiceovers(
      stateName: string, newRecordedVoiceovers: RecordedVoiceovers): void {
    this.saveStateProperty(
      stateName, 'recorded_voiceovers', newRecordedVoiceovers);
  }

  getSolicitAnswerDetailsMemento(stateName: string): boolean {
    return this.getStatePropertyMemento(stateName, 'solicit_answer_details');
  }

  saveSolicitAnswerDetails(
      stateName: string, newSolicitAnswerDetails: boolean): void {
    this.saveStateProperty(
      stateName, 'solicit_answer_details', newSolicitAnswerDetails);
  }

  getCardIsCheckpointMemento(stateName: string): boolean {
    return this.getStatePropertyMemento(stateName, 'card_is_checkpoint');
  }

  saveCardIsCheckpoint(stateName: string, newCardIsCheckpoint: boolean): void {
    this.saveStateProperty(
      stateName, 'card_is_checkpoint', newCardIsCheckpoint);
  }

  getWrittenTranslationsMemento(stateName: string): WrittenTranslations {
    return this._states.getState(stateName).writtenTranslations;
  }

  saveWrittenTranslation(
      contentId: string,
      dataFormat: DataFormatToDefaultValuesKey,
      languageCode: string,
      stateName: string,
      translationHtml: string
  ): void {
    this.changeListService.addWrittenTranslation(
      contentId, dataFormat, languageCode, stateName, translationHtml);
    let stateData = this._states.getState(stateName);
    if (
      stateData.writtenTranslations.hasWrittenTranslation(
        contentId, languageCode)
    ) {
      stateData.writtenTranslations.updateWrittenTranslation(
        contentId, languageCode, translationHtml);
    } else {
      stateData.writtenTranslations.addWrittenTranslation(
        contentId, languageCode, dataFormat, translationHtml);
    }
    this._states.setState(stateName, cloneDeep(stateData));
  }

  markWrittenTranslationAsNeedingUpdate(
      contentId: string, languageCode: string, stateName: string
  ): void {
    this.changeListService.markTranslationAsNeedingUpdate(
      contentId, languageCode, stateName);
    let stateData = this._states.getState(stateName);
    stateData.writtenTranslations.translationsMapping[contentId][
      languageCode].markAsNeedingUpdate();
    this._states.setState(stateName, cloneDeep(stateData));
  }

  markWrittenTranslationsAsNeedingUpdate(
      contentId: string, stateName: string
  ): void {
    this.changeListService.markTranslationsAsNeedingUpdate(
      contentId, stateName);
    let stateData = this._states.getState(stateName);
    const translationMapping = (
      stateData.writtenTranslations.translationsMapping[contentId]);
    for (const languageCode in translationMapping) {
      stateData.writtenTranslations.translationsMapping[contentId][
        languageCode].markAsNeedingUpdate();
    }
    this._states.setState(stateName, cloneDeep(stateData));
  }

  isInitialized(): boolean {
    return this._states !== null;
  }

  addState(
      newStateName: string, successCallback: (arg0: string) => void
  ): void {
    newStateName = this.normalizeWhitespacePipe.transform(newStateName);
    if (!this.validatorsService.isValidStateName(newStateName, true)) {
      return;
    }
    if (this._states.hasState(newStateName)) {
      this.alertsService.addWarning('A state with this name already exists.');
      return;
    }
    this.alertsService.clearWarnings();

    this._states.addState(newStateName);

    this.changeListService.addState(newStateName);
    this.stateAddedCallbacks.forEach((callback) => {
      callback(newStateName);
    });
    this._refreshGraphEventEmitter.emit();
    if (successCallback) {
      successCallback(newStateName);
    }
  }

  deleteState(deleteStateName: string): Promise<never> {
    this.alertsService.clearWarnings();

    let initStateName = this.explorationInitStateNameService.displayed;
    if (deleteStateName === initStateName) {
      return Promise.reject('The initial state can not be deleted.');
    }
    if (!this._states.hasState(deleteStateName)) {
      let message = 'No state with name ' + deleteStateName + ' exists.';
      this.alertsService.addWarning(message);
      return Promise.reject(message);
    }

    const modalRef = this.ngbModal.open(ConfirmDeleteStateModalComponent, {
      backdrop: true,
    });
    modalRef.componentInstance.deleteStateName = deleteStateName;
    modalRef.result.then(() => {
      this._states.deleteState(deleteStateName);

      this.changeListService.deleteState(deleteStateName);

      if (this.stateEditorService.getActiveStateName() === deleteStateName) {
        this.stateEditorService.setActiveStateName(
          this.explorationInitStateNameService.savedMemento);
      }

      this.stateDeletedCallbacks.forEach((callback) => {
        callback(deleteStateName);
      });
      this.windowRef.nativeWindow.location.hash = (
        '/gui/' + this.stateEditorService.getActiveStateName());
      this._refreshGraphEventEmitter.emit();
      // This ensures that if the deletion changes rules in the current
      // state, they get updated in the view.
      this.stateEditorRefreshService.onRefreshStateEditor.emit();
    }, () => {
      this.alertsService.clearWarnings();
    });
  }

  renameState(oldStateName: string, newStateName: string): void {
    newStateName = this.normalizeWhitespacePipe.transform(newStateName);
    if (!this.validatorsService.isValidStateName(newStateName, true)) {
      return;
    }
    if (this._states.hasState(newStateName)) {
      this.alertsService.addWarning('A state with this name already exists.');
      return;
    }
    this.alertsService.clearWarnings();

    this._states.renameState(oldStateName, newStateName);

    this.stateEditorService.setActiveStateName(newStateName);
    this.stateEditorService.setStateNames(this._states.getStateNames());
    // The 'rename state' command must come before the 'change
    // init_state_name' command in the change list, otherwise the backend
    // will raise an error because the new initial state name does not
    // exist.
    this.changeListService.renameState(newStateName, oldStateName);
    this.solutionValidityService.onRenameState(newStateName, oldStateName);
    // Amend initStateName appropriately, if necessary. Note that this
    // must come after the state renaming, otherwise saving will lead to
    // a complaint that the new name is not a valid state name.
    if (this.explorationInitStateNameService.displayed === oldStateName) {
      this.explorationInitStateNameService.displayed = newStateName;
      this.explorationInitStateNameService.saveDisplayedValue();
    }
    this.stateRenamedCallbacks.forEach((callback) => {
      callback(oldStateName, newStateName);
    });
    this._refreshGraphEventEmitter.emit();
  }

  registerOnStateAddedCallback(
      callback: (addedStateName: string) => void): void {
    this.stateAddedCallbacks.push(callback);
  }

  registerOnStateDeletedCallback(
      callback: (deletedStateName: string) => void): void {
    this.stateDeletedCallbacks.push(callback);
  }

  registerOnStateRenamedCallback(
      callback: (oldStateName: string, newStateName: string) => void): void {
    this.stateRenamedCallbacks.push(callback);
  }

  registerOnStatesChangedCallback(callback: () => void): void {
    this.stateAddedCallbacks.push(callback);
    this.stateRenamedCallbacks.push(callback);
    this.stateAddedCallbacks.push(callback);
  }

  registerOnStateInteractionSavedCallback(
      callback: (state: State) => void): void {
    this.stateInteractionSavedCallbacks.push(callback);
  }

  get onRefreshGraph(): EventEmitter<unknown> {
    return this._refreshGraphEventEmitter;
  }
}

angular.module('oppia').factory(
  'ExplorationStatesService',
  downgradeInjectable(ExplorationStatesService));
