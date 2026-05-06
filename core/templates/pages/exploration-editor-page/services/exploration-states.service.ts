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

import {EventEmitter, Injectable} from '@angular/core';

import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import set from 'lodash/set';

import {Interaction} from 'domain/exploration/interaction.model';
import {ConfirmDeleteStateModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/confirm-delete-state-modal.component';
import {PageContextService} from 'services/page-context.service';
import {
  ChangeListService,
  StatePropertyDictValues,
  StatePropertyNames,
  StatePropertyValues,
} from 'pages/exploration-editor-page/services/change-list.service';
import {StateObjectsBackendDict, States} from 'domain/exploration/states.model';
import {SolutionValidityService} from 'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import {AnswerClassificationService} from 'pages/exploration-player-page/services/answer-classification.service';
import {AngularNameService} from 'pages/exploration-editor-page/services/angular-name.service';
import {AlertsService} from 'services/alerts.service';
import {ValidatorsService} from 'services/validators.service';
import {ExplorationInitStateNameService} from 'pages/exploration-editor-page/services/exploration-init-state-name.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateEditorRefreshService} from 'pages/exploration-editor-page/services/state-editor-refresh.service';
import {State} from 'domain/state/state.model';
import {NormalizeWhitespacePipe} from 'filters/string-utility-filters/normalize-whitespace.pipe';
import {WrittenTranslations} from 'domain/exploration/written-translations.model';
import {AnswerGroup} from 'domain/exploration/answer-group.model';
import {Outcome} from 'domain/exploration/outcome.model';
import {Hint} from 'domain/exploration/hint-object.model';
import {Solution} from 'domain/exploration/solution.model';
import {InteractionCustomizationArgs} from 'interactions/customization-args-defs';
import {ParamSpecs} from 'domain/exploration/param-specs.model';
import {ParamChange} from 'domain/exploration/param-change.model';
import {
  SubtitledHtml,
  SubtitledHtmlBackendDict,
} from 'domain/exploration/subtitled-html.model';
import {InteractionRulesRegistryService} from 'services/interaction-rules-registry.service';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {ExplorationNextContentIdIndexService} from 'pages/exploration-editor-page/services/exploration-next-content-id-index.service';
import {MarkTranslationsAsNeedingUpdateModalComponent} from 'components/forms/forms-templates/mark-translations-as-needing-update-modal.component';
import {WindowRef} from 'services/contextual/window-ref.service';
import {
  BaseTranslatableObject,
  TranslatableField,
} from 'domain/objects/BaseTranslatableObject.model';
import {InteractionAnswer} from 'interactions/answer-defs';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {AppConstants} from 'app.constants';

interface ContentsMapping {
  [contentId: string]: TranslatableField;
}

interface ContentExtractors {
  [fieldName: string]: (
    x: TranslatableField | BaseTranslatableObject | BaseTranslatableObject[]
  ) => TranslatableField[];
}

@Injectable({
  providedIn: 'root',
})
export class ExplorationStatesService {
  stateAddedCallbacks: ((addedStateName: string) => void)[] = [];
  stateDeletedCallbacks: ((deletedStateName: string) => void)[] = [];
  stateRenamedCallbacks: ((
    oldStateName: string,
    newStateName: string
  ) => void)[] = [];

  initalContentsMapping: ContentsMapping = {};
  contentChangesCanAffectTranslations: boolean = true;

  stateInteractionSavedCallbacks: ((state: State) => void)[] = [];
  private _states: States | null = null;
  private _refreshGraphEventEmitter: EventEmitter<string> = new EventEmitter();

  constructor(
    private angularNameService: AngularNameService,
    private alertsService: AlertsService,
    private answerClassificationService: AnswerClassificationService,
    private changeListService: ChangeListService,
    private pageContextService: PageContextService,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private interactionRulesRegistryService: InteractionRulesRegistryService,
    private windowRef: WindowRef,
    private ngbModal: NgbModal,
    private normalizeWhitespacePipe: NormalizeWhitespacePipe,
    private solutionValidityService: SolutionValidityService,
    private stateEditorService: StateEditorService,
    private stateEditorRefreshService: StateEditorRefreshService,
    private validatorsService: ValidatorsService,
    private generateContentIdService: GenerateContentIdService,
    private explorationNextContentIdIndexService: ExplorationNextContentIdIndexService,
    private entityTranslationsService: EntityTranslationsService,
    private entityVoiceoversService: EntityVoiceoversService
  ) {}

  // Properties that have a different backend representation from the
  // frontend and must be converted.
  private _BACKEND_CONVERSIONS = {
    answer_groups: (answerGroups: AnswerGroup[]) => {
      return answerGroups.map(answerGroup => {
        return answerGroup.toBackendDict();
      });
    },
    content: (content: SubtitledHtml): SubtitledHtmlBackendDict => {
      return content.toBackendDict();
    },
    default_outcome: (defaultOutcome: Outcome | null) => {
      if (defaultOutcome) {
        return defaultOutcome.toBackendDict();
      } else {
        return null;
      }
    },
    hints: (hints: Hint[]) => {
      return hints.map(hint => {
        return hint.toBackendDict();
      });
    },
    param_changes: (paramChanges: ParamChange[]) => {
      return paramChanges.map(paramChange => {
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
        customizationArgs
      );
    },
  };

  // Maps backend names to the corresponding frontend dict accessor lists.
  PROPERTY_REF_DATA = {
    answer_groups: ['interaction', 'answerGroups'],
    confirmed_unclassified_answers: [
      'interaction',
      'confirmedUnclassifiedAnswers',
    ],
    content: ['content'],
    linked_skill_id: ['linkedSkillId'],
    default_outcome: ['interaction', 'defaultOutcome'],
    param_changes: ['paramChanges'],
    param_specs: ['paramSpecs'],
    hints: ['interaction', 'hints'],
    solicit_answer_details: ['solicitAnswerDetails'],
    card_is_checkpoint: ['cardIsCheckpoint'],
    solution: ['interaction', 'solution'],
    widget_id: ['interaction', 'id'],
    widget_customization_args: ['interaction', 'customizationArgs'],
    inapplicable_skill_misconception_ids: ['inapplicableSkillMisconceptionIds'],
    state_name: ['name'],
  };

  private _CONTENT_EXTRACTORS = {
    answer_groups: (answerGroups: BaseTranslatableObject[]) => {
      let contents: TranslatableField[] = [];
      answerGroups.forEach(answerGroup => {
        contents = contents.concat(answerGroup.getAllContents());
      });
      return contents;
    },
    default_outcome: (defaultOutcome: BaseTranslatableObject) => {
      return defaultOutcome ? defaultOutcome.getAllContents() : [];
    },
    hints: (hints: BaseTranslatableObject[]) => {
      let contents: TranslatableField[] = [];
      hints.forEach(hint => {
        contents = contents.concat(hint.getAllContents());
      });
      return contents;
    },
    solution: (solution: BaseTranslatableObject) => {
      return solution ? solution.getAllContents() : [];
    },
    widget_customization_args: (
      customizationArgs: InteractionCustomizationArgs
    ) => {
      return customizationArgs
        ? Interaction.getCustomizationArgContents(customizationArgs)
        : [];
    },
  } as ContentExtractors;

  _extractContentIds(
    backendName: string,
    value: StatePropertyValues
  ): Set<string> {
    let contents: TranslatableField[] = this._CONTENT_EXTRACTORS[backendName](
      value as BaseTranslatableObject | BaseTranslatableObject[]
    );
    return new Set(contents.map(content => content.contentId as string));
  }

  _verifyChangesInitialContents(
    backendName: string,
    value: StatePropertyValues
  ): void {
    let contents: TranslatableField[];

    if (backendName === 'content') {
      contents = [value as SubtitledHtml];
    } else if (this._CONTENT_EXTRACTORS.hasOwnProperty(backendName)) {
      contents = this._CONTENT_EXTRACTORS[backendName](
        value as BaseTranslatableObject | BaseTranslatableObject[]
      );
    } else {
      return;
    }

    for (const content of contents) {
      const contentId = content.contentId as string;
      if (!this.initalContentsMapping.hasOwnProperty(contentId)) {
        continue;
      }

      let intialContent = this.initalContentsMapping[contentId];
      if (
        JSON.stringify(BaseTranslatableObject.getContentValue(content)) ===
        JSON.stringify(BaseTranslatableObject.getContentValue(intialContent))
      ) {
        continue;
      }

      const modalRef = this.ngbModal.open(
        MarkTranslationsAsNeedingUpdateModalComponent,
        {
          size: 'lg',
          backdrop: 'static',
          // TODO(#12768): Remove the backdropClass & windowClass once the
          // rte-component-modal is migrated to Angular. Currently, the custom
          // class is used for correctly stacking AngularJS modal on top of
          // Angular modal.
          backdropClass: 'forced-modal-stack',
          windowClass: 'forced-modal-stack',
        }
      );
      modalRef.componentInstance.contentId = contentId;
      modalRef.componentInstance.contentValue =
        BaseTranslatableObject.getContentValue(content);
      modalRef.componentInstance.markNeedsUpdateHandler =
        this.markTranslationAndVoiceoverNeedsUpdate.bind(this);
      modalRef.componentInstance.removeHandler =
        this.removeTranslationAndVoiceover.bind(this);
      this.initalContentsMapping[contentId] = content;
    }
  }

  markTranslationAndVoiceoverNeedsUpdate(contentId: string): void {
    this.changeListService.markTranslationsAsNeedingUpdate(contentId);
    this.changeListService.markVoiceoversAsNeedingUpdate(
      contentId,
      AppConstants.DEFAULT_LANGUAGE_CODE
    );
  }

  removeTranslationAndVoiceover(contentId: string): void {
    this.changeListService.removeTranslations(contentId);
    this.entityTranslationsService.removeAllTranslationsForContent(contentId);

    this.changeListService.removeVoiceovers(
      contentId,
      AppConstants.DEFAULT_LANGUAGE_CODE
    );
    this.entityVoiceoversService.removeAllVoiceoversForContent(contentId);
  }

  private _getElementsInFirstSetButNotInSecond(
    setA: Set<string>,
    setB: Set<string>
  ): string[] {
    let diffList = Array.from(setA).filter(element => {
      return !setB.has(element);
    });
    return diffList as string[];
  }

  private _getStates(): States {
    if (this._states === null) {
      throw new Error('Exploration states are not initialized.');
    }
    return this._states;
  }

  private _setState(
    stateName: string,
    stateData: State,
    refreshGraph: boolean
  ): void {
    this._getStates().setState(stateName, cloneDeep(stateData));
    if (refreshGraph) {
      this._refreshGraphEventEmitter.emit();
    }
  }

  getStatePropertyMemento(
    stateName: string,
    backendName: 'content'
  ): SubtitledHtml;
  getStatePropertyMemento(
    stateName: string,
    backendName: 'param_changes'
  ): ParamChange[];
  getStatePropertyMemento(stateName: string, backendName: 'widget_id'): string;
  getStatePropertyMemento(
    stateName: string,
    backendName: 'widget_customization_args'
  ): InteractionCustomizationArgs;
  getStatePropertyMemento(
    stateName: string,
    backendName: 'answer_groups'
  ): AnswerGroup[];
  getStatePropertyMemento(
    stateName: string,
    backendName: 'confirmed_unclassified_answers'
  ): AnswerGroup[];
  getStatePropertyMemento(
    stateName: string,
    backendName: 'default_outcome'
  ): Outcome;
  getStatePropertyMemento(stateName: string, backendName: 'hints'): Hint[];
  getStatePropertyMemento(
    stateName: string,
    backendName: 'solution'
  ): SubtitledHtml;
  getStatePropertyMemento(
    stateName: string,
    backendName: 'solicit_answer_details'
  ): boolean;
  getStatePropertyMemento(
    stateName: string,
    backendName: 'card_is_checkpoint'
  ): boolean;
  getStatePropertyMemento(
    stateName: string,
    backendName: StatePropertyNames
  ): StatePropertyValues;
  getStatePropertyMemento(
    stateName: string,
    backendName: StatePropertyNames
  ): StatePropertyValues {
    let accessorList: string[] = this.PROPERTY_REF_DATA[backendName];
    let propertyRef: StatePropertyValues | State =
      this._getStates().getState(stateName);
    try {
      accessorList.forEach((key: string) => {
        if (typeof propertyRef !== 'object' || propertyRef === null) {
          throw new Error(
            `Cannot read key "${key}" from non-object state property value.`
          );
        }
        propertyRef = Reflect.get(propertyRef, key);
      });
    } catch (e) {
      let additionalInfo =
        '\nUndefined states error debug logs:' +
        '\nRequested state name: ' +
        stateName +
        '\nExploration ID: ' +
        this.pageContextService.getExplorationId() +
        '\nChange list: ' +
        JSON.stringify(this.changeListService.getChangeList()) +
        '\nAll states names: ' +
        this._getStates().getStateNames();
      e.message += additionalInfo;
      throw e;
    }

    return cloneDeep(propertyRef);
  }

  saveStateProperty(
    stateName: string,
    backendName: 'content',
    newValue: SubtitledHtml
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: 'param_changes',
    newValue: ParamChange[]
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: 'widget_id',
    newValue: string | null
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: 'widget_customization_args',
    newValue: InteractionCustomizationArgs
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: 'answer_groups',
    newValue: AnswerGroup[]
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: 'confirmed_unclassified_answers',
    newValue: AnswerGroup[]
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: 'default_outcome',
    newValue: Outcome
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: 'hints',
    newValue: Hint[]
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: 'solution',
    newValue: SubtitledHtml
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: 'solicit_answer_details',
    newValue: boolean
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: 'card_is_checkpoint',
    newValue: boolean
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: 'linked_skill_id',
    newValue: string
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: 'inapplicable_skill_misconception_ids',
    newValue: string[]
  ): void;
  saveStateProperty(
    stateName: string,
    backendName: StatePropertyNames,
    newValue: StatePropertyValues
  ): void {
    let oldValue = this.getStatePropertyMemento(stateName, backendName);
    let newBackendValue = this._getBackendValue(backendName, newValue);
    let oldBackendValue = this._getBackendValue(backendName, oldValue);
    if (!isEqual(oldValue, newValue)) {
      this.changeListService.editStateProperty(
        stateName,
        backendName,
        newBackendValue,
        oldBackendValue
      );

      let newStateData = this._getStates().getState(stateName);
      let accessorList = this.PROPERTY_REF_DATA[backendName];
      if (this.contentChangesCanAffectTranslations) {
        this._verifyChangesInitialContents(backendName, newValue);
      }

      set(newStateData, accessorList, cloneDeep(newValue));

      // We do not refresh the state editor immediately after the interaction
      // id alone is saved, because the customization args dict will be
      // temporarily invalid. A change in interaction id will always entail
      // a change in the customization args dict anyway, so the graph will
      // get refreshed after both properties have been updated.
      let refreshGraph = backendName !== 'widget_id';
      this._setState(stateName, newStateData, refreshGraph);
    }
  }

  private _getBackendValue(
    backendName: StatePropertyNames,
    value: StatePropertyValues
  ): StatePropertyDictValues {
    if (this._isBackendConversionName(backendName)) {
      return this.convertToBackendRepresentation(value, backendName);
    }

    if (
      typeof value === 'boolean' ||
      typeof value === 'string' ||
      value === null ||
      Array.isArray(value)
    ) {
      return cloneDeep(value) as StatePropertyDictValues;
    }

    throw new Error(
      `Unsupported non-converted state property value for ${backendName}.`
    );
  }

  private _isBackendConversionName(
    backendName: StatePropertyNames
  ): backendName is Exclude<
    keyof ExplorationStatesService['_BACKEND_CONVERSIONS'],
    'written_translations'
  > {
    return this._BACKEND_CONVERSIONS.hasOwnProperty(backendName);
  }

  convertToBackendRepresentation(
    frontendValue: StatePropertyValues,
    backendName: Exclude<
      keyof ExplorationStatesService['_BACKEND_CONVERSIONS'],
      'written_translations'
    >
  ): StatePropertyDictValues {
    let conversionFunction = this._BACKEND_CONVERSIONS[backendName] as (
      value: StatePropertyValues
    ) => StatePropertyDictValues;
    return conversionFunction(frontendValue);
  }

  init(
    statesBackendDict: StateObjectsBackendDict,
    contentChangesCanAffectTranslations: boolean
  ): void {
    this._states = States.createFromBackendDict(statesBackendDict);
    this.contentChangesCanAffectTranslations =
      contentChangesCanAffectTranslations;
    const states = this._getStates();
    // Initialize the solutionValidityService.
    this.solutionValidityService.init(states.getStateNames());
    states.getStateNames().forEach((stateName: string) => {
      const state = states.getState(stateName);
      let solution = state.interaction.solution;
      if (solution) {
        let interactionId = state.interaction.id;
        if (interactionId === null) {
          return;
        }
        let result =
          this.answerClassificationService.getMatchingClassificationResult(
            stateName,
            state.interaction,
            solution.correctAnswer,
            this.interactionRulesRegistryService.getRulesServiceByInteractionId(
              interactionId
            )
          );
        let solutionIsValid = stateName !== result.outcome.dest;
        this.solutionValidityService.updateValidity(stateName, solutionIsValid);
      }

      state.getAllContents().forEach(content => {
        if (content.contentId === null) {
          return;
        }
        this.initalContentsMapping[content.contentId] = content;
      });
    });
  }

  getStates(): States {
    return cloneDeep(this._getStates());
  }

  getStateNames(): string[] {
    return this._getStates().getStateNames();
  }

  hasState(stateName: string): boolean {
    return this._getStates().hasState(stateName);
  }

  getState(stateName: string): State {
    return cloneDeep(this._getStates().getState(stateName));
  }

  setState(stateName: string, stateData: State): void {
    this._setState(stateName, stateData, true);
  }

  getAllContentIdsByStateName(stateName: string): string[] {
    let allContentIds = this._getStates()
      .getState(stateName)
      .getAllContentIds();
    return allContentIds.filter(contentId => contentId !== undefined);
  }

  getCheckpointCount(): number {
    let count: number = 0;
    if (this._states) {
      const states = this._getStates();
      states.getStateNames().forEach(stateName => {
        if (states.getState(stateName).cardIsCheckpoint) {
          count++;
        }
      });
    }
    return count;
  }

  isNewStateNameDuplicate(newStateName: string): boolean {
    return this._getStates().hasState(newStateName);
  }

  isNewStateNameValid(newStateName: string, showWarnings: boolean): boolean {
    if (this._getStates().hasState(newStateName)) {
      if (showWarnings) {
        this.alertsService.addWarning('A state with this name already exists.');
      }
      return false;
    }
    return this.validatorsService.isValidStateName(newStateName, showWarnings);
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
    stateName: string,
    newParamChanges: ParamChange[]
  ): void {
    this.saveStateProperty(stateName, 'param_changes', newParamChanges);
  }

  getInteractionIdMemento(stateName: string): string {
    return this.getStatePropertyMemento(stateName, 'widget_id');
  }

  saveInteractionId(stateName: string, newInteractionId: string | null): void {
    this.saveStateProperty(stateName, 'widget_id', newInteractionId);
    this.stateInteractionSavedCallbacks.forEach(callback => {
      callback(this._getStates().getState(stateName));
    });
  }

  saveLinkedSkillId(stateName: string, newLinkedSkillId: string): void {
    this.saveStateProperty(stateName, 'linked_skill_id', newLinkedSkillId);
  }

  saveInapplicableSkillMisconceptionIds(
    stateName: string,
    newInapplicableSkillMisconceptionIds: string[]
  ): void {
    this.saveStateProperty(
      stateName,
      'inapplicable_skill_misconception_ids',
      newInapplicableSkillMisconceptionIds
    );
  }

  getInteractionCustomizationArgsMemento(
    stateName: string
  ): InteractionCustomizationArgs {
    return this.getStatePropertyMemento(stateName, 'widget_customization_args');
  }

  saveInteractionCustomizationArgs(
    stateName: string,
    newCustomizationArgs: InteractionCustomizationArgs
  ): void {
    this.saveStateProperty(
      stateName,
      'widget_customization_args',
      newCustomizationArgs
    );
    this.stateInteractionSavedCallbacks.forEach(callback => {
      callback(this._getStates().getState(stateName));
    });
  }

  getInteractionAnswerGroupsMemento(stateName: string): AnswerGroup[] {
    return this.getStatePropertyMemento(stateName, 'answer_groups');
  }

  saveInteractionAnswerGroups(
    stateName: string,
    newAnswerGroups: AnswerGroup[]
  ): void {
    this.saveStateProperty(stateName, 'answer_groups', newAnswerGroups);
    this.stateInteractionSavedCallbacks.forEach(callback => {
      callback(this._getStates().getState(stateName));
    });
  }

  getConfirmedUnclassifiedAnswersMemento(stateName: string): AnswerGroup[] {
    return this.getStatePropertyMemento(
      stateName,
      'confirmed_unclassified_answers'
    );
  }

  saveConfirmedUnclassifiedAnswers(
    stateName: string,
    newAnswers: AnswerGroup[] | InteractionAnswer[]
  ): void {
    this.saveStateProperty(
      stateName,
      'confirmed_unclassified_answers',
      newAnswers as AnswerGroup[]
    );
    this.stateInteractionSavedCallbacks.forEach(callback => {
      callback(this._getStates().getState(stateName));
    });
  }

  getInteractionDefaultOutcomeMemento(stateName: string): Outcome {
    return this.getStatePropertyMemento(stateName, 'default_outcome');
  }

  saveInteractionDefaultOutcome(
    stateName: string,
    newDefaultOutcome: Outcome
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

  getSolicitAnswerDetailsMemento(stateName: string): boolean {
    return this.getStatePropertyMemento(stateName, 'solicit_answer_details');
  }

  saveSolicitAnswerDetails(
    stateName: string,
    newSolicitAnswerDetails: boolean
  ): void {
    this.saveStateProperty(
      stateName,
      'solicit_answer_details',
      newSolicitAnswerDetails
    );
  }

  getCardIsCheckpointMemento(stateName: string): boolean {
    return this.getStatePropertyMemento(stateName, 'card_is_checkpoint');
  }

  saveCardIsCheckpoint(stateName: string, newCardIsCheckpoint: boolean): void {
    this.saveStateProperty(
      stateName,
      'card_is_checkpoint',
      newCardIsCheckpoint
    );
  }

  isInitialized(): boolean {
    return this._states !== null;
  }

  addState(
    newStateName: string,
    successCallback: (arg0: string) => void
  ): void {
    newStateName = this.normalizeWhitespacePipe.transform(newStateName);
    if (!this.validatorsService.isValidStateName(newStateName, true)) {
      return;
    }
    if (this._getStates().hasState(newStateName)) {
      this.alertsService.addWarning('A state with this name already exists.');
      return;
    }
    this.alertsService.clearWarnings();

    let contentIdForContent =
      this.generateContentIdService.getNextStateId('content');
    let contentIdForDefaultOutcome =
      this.generateContentIdService.getNextStateId('default_outcome');

    this._getStates().addState(
      newStateName,
      contentIdForContent,
      contentIdForDefaultOutcome
    );

    this.changeListService.addState(
      newStateName,
      contentIdForContent,
      contentIdForDefaultOutcome
    );
    this.explorationNextContentIdIndexService.saveDisplayedValue();
    this.stateAddedCallbacks.forEach(callback => {
      callback(newStateName);
    });
    this._refreshGraphEventEmitter.emit();
    if (successCallback) {
      successCallback(newStateName);
    }
  }

  deleteState(deleteStateName: string): Promise<void> {
    this.alertsService.clearWarnings();

    let initStateName = this.explorationInitStateNameService.displayed;
    if (deleteStateName === initStateName) {
      return Promise.reject('The initial state can not be deleted.');
    }
    if (!this._getStates().hasState(deleteStateName)) {
      let message = 'No state with name ' + deleteStateName + ' exists.';
      this.alertsService.addWarning(message);
      return Promise.reject(message);
    }

    const modalRef = this.ngbModal.open(ConfirmDeleteStateModalComponent, {
      backdrop: true,
    });
    modalRef.componentInstance.deleteStateName = deleteStateName;
    return modalRef.result.then(
      () => {
        this._getStates().deleteState(deleteStateName);

        this.changeListService.deleteState(deleteStateName);

        if (this.stateEditorService.getActiveStateName() === deleteStateName) {
          this.stateEditorService.setActiveStateName(
            this.explorationInitStateNameService.savedMemento
          );
        }

        this.stateDeletedCallbacks.forEach(callback => {
          callback(deleteStateName);
        });
        this.windowRef.nativeWindow.location.hash =
          '/gui/' + this.stateEditorService.getActiveStateName();
        this._refreshGraphEventEmitter.emit();
        // This ensures that if the deletion changes rules in the current
        // state, they get updated in the view.
        this.stateEditorRefreshService.onRefreshStateEditor.emit();
      },
      () => {
        this.alertsService.clearWarnings();
      }
    );
  }

  renameState(oldStateName: string, newStateName: string): void {
    newStateName = this.normalizeWhitespacePipe.transform(newStateName);
    if (!this.validatorsService.isValidStateName(newStateName, true)) {
      return;
    }
    if (this._getStates().hasState(newStateName)) {
      this.alertsService.addWarning('A state with this name already exists.');
      return;
    }
    this.alertsService.clearWarnings();

    this._getStates().renameState(oldStateName, newStateName);

    this.stateEditorService.setActiveStateName(newStateName);
    this.stateEditorService.setStateNames(this._getStates().getStateNames());
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
    this.stateRenamedCallbacks.forEach(callback => {
      callback(oldStateName, newStateName);
    });
    this._refreshGraphEventEmitter.emit();
  }

  registerOnStateAddedCallback(
    callback: (addedStateName: string) => void
  ): void {
    this.stateAddedCallbacks.push(callback);
  }

  registerOnStateDeletedCallback(
    callback: (deletedStateName: string) => void
  ): void {
    this.stateDeletedCallbacks.push(callback);
  }

  registerOnStateRenamedCallback(
    callback: (oldStateName: string, newStateName: string) => void
  ): void {
    this.stateRenamedCallbacks.push(callback);
  }

  registerOnStatesChangedCallback(callback: () => void): void {
    this.stateAddedCallbacks.push(callback);
    this.stateRenamedCallbacks.push(callback);
    this.stateAddedCallbacks.push(callback);
  }

  registerOnStateInteractionSavedCallback(
    callback: (state: State) => void
  ): void {
    this.stateInteractionSavedCallbacks.push(callback);
  }

  get onRefreshGraph(): EventEmitter<string> {
    return this._refreshGraphEventEmitter;
  }
}
