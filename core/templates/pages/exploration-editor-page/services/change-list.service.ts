// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service that maintains a provisional list of changes to be
 * committed to the server.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { EventEmitter, Output } from '@angular/core';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AutosaveInfoModalsService } from 'pages/exploration-editor-page/services/autosave-info-modals.service';
import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';
import { AlertsService } from 'services/alerts.service';
import { LoaderService } from 'services/loader.service';
import { LoggerService } from 'services/contextual/logger.service';
import { ExplorationChange, ExplorationChangeEditExplorationProperty } from 'domain/exploration/exploration-draft.model';
import { WindowRef } from 'services/contextual/window-ref.service';
import { InternetConnectivityService } from 'services/internet-connectivity.service';
import { SubtitledHtml, SubtitledHtmlBackendDict } from 'domain/exploration/subtitled-html.model';
import { ParamChange, ParamChangeBackendDict } from 'domain/exploration/ParamChangeObjectFactory';
import { InteractionCustomizationArgs, InteractionCustomizationArgsBackendDict } from 'interactions/customization-args-defs';
import { AnswerGroup, AnswerGroupBackendDict } from 'domain/exploration/AnswerGroupObjectFactory';
import { Hint, HintBackendDict } from 'domain/exploration/hint-object.model';
import { Outcome, OutcomeBackendDict } from 'domain/exploration/OutcomeObjectFactory';
import { RecordedVoiceOverBackendDict, RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { LostChange } from 'domain/exploration/LostChangeObjectFactory';
import { BaseTranslatableObject } from 'domain/objects/BaseTranslatableObject.model';
import { TranslatedContent } from 'domain/exploration/TranslatedContentObjectFactory';

export type StatePropertyValues = (
  AnswerGroup[] |
  boolean |
  Hint[] |
  InteractionCustomizationArgs |
  Outcome |
  ParamChange[] |
  RecordedVoiceovers |
  string |
  SubtitledHtml |
  BaseTranslatableObject
);
export type StatePropertyDictValues = (
  AnswerGroupBackendDict[] |
  boolean |
  HintBackendDict[] |
  InteractionCustomizationArgsBackendDict |
  OutcomeBackendDict |
  ParamChangeBackendDict[] |
  RecordedVoiceOverBackendDict |
  string |
  SubtitledHtmlBackendDict
);
export type StatePropertyNames = (
  'answer_groups' |
  'card_is_checkpoint' |
  'confirmed_unclassified_answers' |
  'content' |
  'default_outcome' |
  'hints' |
  'linked_skill_id' |
  'param_changes' |
  'param_specs' |
  'recorded_voiceovers' |
  'solicit_answer_details' |
  'solution' |
  'state_name' |
  'widget_customization_args' |
  'widget_id'
);

@Injectable({
  providedIn: 'root'
})
export class ChangeListService {
  // Temporary buffer for changes made to the exploration.
  explorationChangeList: ExplorationChange[] = [];

  // Stack for storing undone changes. The last element is the most recently
  // undone change.
  undoneChangeStack: ExplorationChange[] = [];
  loadingMessage: string = '';
  // Temporary list of the changes made to the exploration when offline.
  temporaryListOfChanges: ExplorationChange[] = [];

  @Output() autosaveInProgressEventEmitter: EventEmitter<boolean> = (
    new EventEmitter<boolean>());

  ALLOWED_EXPLORATION_BACKEND_NAMES = {
    category: true,
    init_state_name: true,
    language_code: true,
    objective: true,
    param_changes: true,
    param_specs: true,
    tags: true,
    title: true,
    auto_tts_enabled: true,
    next_content_id_index: true,
  };

  ALLOWED_STATE_BACKEND_NAMES: Record<StatePropertyNames, boolean> = {
    answer_groups: true,
    confirmed_unclassified_answers: true,
    content: true,
    recorded_voiceovers: true,
    default_outcome: true,
    hints: true,
    linked_skill_id: true,
    param_changes: true,
    param_specs: true,
    solicit_answer_details: true,
    card_is_checkpoint: true,
    solution: true,
    state_name: true,
    widget_customization_args: true,
    widget_id: true
  };

  // This property is initialized using private methods and we need to do
  // non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  changeListAddedTimeoutId!: ReturnType<typeof setTimeout>;
  DEFAULT_WAIT_FOR_AUTOSAVE_MSEC = 200;

  constructor(
    private windowRef: WindowRef,
    private alertsService: AlertsService,
    private autosaveInfoModalsService: AutosaveInfoModalsService,
    private explorationDataService: ExplorationDataService,
    private loaderService: LoaderService,
    private loggerService: LoggerService,
    private internetConnectivityService: InternetConnectivityService,
  ) {
    // We have added subscriptions in the constructor.
    // Since, ngOnInit does not work in angular services.
    // Ref: https://github.com/angular/angular/issues/23235.
    this.loaderService.onLoadingMessageChange.subscribe(
      (message: string) => this.loadingMessage = message
    );
    this.internetConnectivityService.onInternetStateChange.subscribe(
      internetAccessible => {
        if (internetAccessible && this.temporaryListOfChanges.length > 0) {
          for (let change of this.temporaryListOfChanges) {
            this.addChange(change);
          }
          this.temporaryListOfChanges = [];
        }
      });
  }

  private autosaveChangeListOnChange(
      explorationChangeList: ExplorationChange[] | LostChange[]) {
    // Asynchronously send an autosave request, and check for errors in the
    // response:
    // If error is present -> Check for the type of error occurred
    // (Display the corresponding modals in both cases, if not already
    // opened):
    // - Changes are not mergeable when a version mismatch occurs.
    // - Non-strict Validation Fail.
    this.explorationDataService.autosaveChangeListAsync(
      explorationChangeList as ExplorationChange[],
      response => {
        if (!response.changes_are_mergeable) {
          if (!this.autosaveInfoModalsService.isModalOpen()) {
            this.autosaveInfoModalsService.showVersionMismatchModal(
              explorationChangeList as LostChange[]);
          }
        }
        this.autosaveInProgressEventEmitter.emit(false);
        if (!response.is_version_of_draft_valid &&
          response.changes_are_mergeable) {
          this.windowRef.nativeWindow.location.reload();
        }
      },
      () => {
        this.alertsService.clearWarnings();
        this.loggerService.error(
          'nonStrictValidationFailure: ' +
          JSON.stringify(explorationChangeList));
        if (!this.autosaveInfoModalsService.isModalOpen()) {
          this.autosaveInfoModalsService.showNonStrictValidationFailModal();
        }
        this.autosaveInProgressEventEmitter.emit(false);
      }
    );
  }

  private addChange(changeDict: ExplorationChange) {
    if (this.loadingMessage) {
      return;
    }
    if (!this.internetConnectivityService.isOnline()) {
      this.temporaryListOfChanges.push(changeDict);
      return;
    }
    this.explorationChangeList.push(changeDict);
    this.undoneChangeStack = [];
    this.autosaveInProgressEventEmitter.emit(true);
    if (this.changeListAddedTimeoutId) {
      clearTimeout(this.changeListAddedTimeoutId);
    }
    this.changeListAddedTimeoutId = setTimeout(() => {
      this.autosaveChangeListOnChange(this.explorationChangeList);
    }, this.DEFAULT_WAIT_FOR_AUTOSAVE_MSEC);
  }

  /**
   * Saves a change dict that represents adding a new state. It is the
   * responsbility of the caller to check that the new state name is valid.
   *
   * @param {string} stateName - The name of the newly-added state
   */
  addState(
      stateName: string,
      contentIdForContent: string,
      contentIdForDefaultOutcome: string): void {
    this.addChange({
      cmd: 'add_state',
      state_name: stateName,
      content_id_for_state_content: contentIdForContent,
      content_id_for_default_outcome: contentIdForDefaultOutcome
    });
  }

  /**
   * Saves a change dict that represents deleting a new state. It is the
   * responsbility of the caller to check that the deleted state name
   * corresponds to an existing state.
   *
   * @param {string} stateName - The name of the deleted state.
   */
  deleteState(stateName: string): void {
    this.addChange({
      cmd: 'delete_state',
      state_name: stateName
    });
  }

  discardAllChanges(): Promise<void> {
    this.explorationChangeList = [];
    this.undoneChangeStack = [];
    return this.explorationDataService.discardDraftAsync();
  }

  /**
   * Saves a change dict that represents a change to an exploration
   * property (such as its title, category, ...). It is the responsibility
   * of the caller to check that the old and new values are not equal.
   *
   * @param {string} backendName - The backend name of the property
   *   (e.g. title, category)
   * @param {string} newValue - The new value of the property
   * @param {string} oldValue - The previous value of the property
   */
  editExplorationProperty(
      backendName: string,
      newValue: string,
      oldValue: string
  ): void {
    if (!this.ALLOWED_EXPLORATION_BACKEND_NAMES.hasOwnProperty(backendName)) {
      this.alertsService.addWarning(
        'Invalid exploration property: ' + backendName);
      return;
    }
    this.addChange({
      cmd: 'edit_exploration_property',
      new_value: angular.copy(newValue),
      old_value: angular.copy(oldValue),
      property_name: backendName
    } as ExplorationChangeEditExplorationProperty);
  }

  /**
   * Saves a change dict that represents a change to a state property. It
   * is the responsibility of the caller to check that the old and new
   * values are not equal.
   *
   * @param {string} stateName - The name of the state that is being edited
   * @param {string} backendName - The backend name of the edited property
   * @param {string} newValue - The new value of the property
   * @param {string} oldValue - The previous value of the property
   */
  editStateProperty(
      stateName: string, backendName: StatePropertyNames,
      newValue: StatePropertyDictValues, oldValue: StatePropertyDictValues
  ): void {
    if (!this.ALLOWED_STATE_BACKEND_NAMES.hasOwnProperty(backendName)) {
      this.alertsService.addWarning('Invalid state property: ' + backendName);
      return;
    }
    this.addChange({
      cmd: 'edit_state_property',
      new_value: angular.copy(newValue),
      old_value: angular.copy(oldValue),
      property_name: backendName,
      state_name: stateName
    });
  }

  getChangeList(): ExplorationChange[] {
    return angular.copy(this.explorationChangeList);
  }

  getTranslationChangeList(): ExplorationChange[] {
    return angular.copy(this.explorationChangeList.filter((change) => {
      return [
        'edit_translation',
        'remove_translations',
        'mark_translations_needs_update'
      ].includes(change.cmd);
    }));
  }

  isExplorationLockedForEditing(): boolean {
    return this.explorationChangeList.length > 0;
  }

  /**
   * Initializes the current changeList with the one received from backend.
   * This behavior exists only in case of an autosave.
   *
   * @param {object} changeList - Autosaved changeList data
   */
  loadAutosavedChangeList(changeList: ExplorationChange[]): void {
    this.explorationChangeList = changeList;
  }

  /**
   * Saves a change dict that represents the renaming of a state. This
   * is also intended to change the initial state name if necessary
   * (that is, the latter change is implied and does not have to be
   * recorded separately in another change dict). It is the responsibility
   * of the caller to check that the two names are not equal.
   *
   * @param {string} newStateName - The new name of the state
   * @param {string} oldStateName - The previous name of the state
   */
  renameState(newStateName: string, oldStateName: string): void {
    this.addChange({
      cmd: 'rename_state',
      new_state_name: newStateName,
      old_state_name: oldStateName
    });
  }

  addWrittenTranslation(
      contentId: string, dataFormat: string, languageCode: string,
      stateName: string, translationHtml: string): void {
  // Written translations submitted via the translation tab in the
  // exploration editor need not pass content_html because
  // translations submitted via this method do not undergo a review. The
  // content_html is only required when submitting translations via
  // the contributor dashboard because such translation suggestions
  // undergo a manual review process where the reviewer will need to look
  // at the corresponding original content at the time of submission.
    this.addChange({
      cmd: 'add_written_translation',
      content_id: contentId,
      data_format: dataFormat,
      language_code: languageCode,
      state_name: stateName,
      content_html: 'N/A',
      translation_html: translationHtml
    });
  }

  /**
   * Saves a change dict that represents marking a translation as needing
   * update in all languages.
   *
   * @param {string} contentId - The content id of the translated content.
   */
  markTranslationsAsNeedingUpdate(contentId: string): void {
    this.addChange({
      cmd: 'mark_translations_needs_update',
      content_id: contentId
    });
  }

  /**
   * Saves a change dict that represents editing translations.
   */
  editTranslation(
      contentId: string,
      languageCode: string,
      translatedContent: TranslatedContent,
  ): void {
    this.addChange({
      cmd: 'edit_translation',
      language_code: languageCode,
      content_id: contentId,
      translation: translatedContent.toBackendDict()
    });
  }

  /**
   * Saves a change dict that represents removing translations in all languages
   * for the given content id.
   *
   * @param {string} contentId - The content id of the translated content.
   */
  removeTranslations(contentId: string): void {
    this.addChange({
      cmd: 'remove_translations',
      content_id: contentId
    });
  }

  undoLastChange(): void {
    if (this.explorationChangeList.length === 0) {
      this.alertsService.addWarning('There are no changes to undo.');
      return;
    }
    let lastChange = this.explorationChangeList.pop() as ExplorationChange;
    this.undoneChangeStack.push(lastChange);
    this.autosaveChangeListOnChange(this.explorationChangeList);
  }

  get autosaveIsInProgress$(): Observable<boolean> {
    return this.autosaveInProgressEventEmitter.asObservable();
  }
}

angular.module('oppia').factory(
  'ChangeListService', downgradeInjectable(
    ChangeListService));
