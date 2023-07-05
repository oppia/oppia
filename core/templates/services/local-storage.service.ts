// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility service for saving data locally on the client machine.
 */

// Includes methods for saving exploration draft changes to local storage.
//
// Note that the draft is only saved if localStorage exists and works
// (i.e. has storage capacity).

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import {
  ExplorationChange,
  ExplorationDraft
} from 'domain/exploration/exploration-draft.model';
import { EntityEditorBrowserTabsInfo, EntityEditorBrowserTabsInfoDict } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { WindowRef } from './contextual/window-ref.service';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  constructor(
    private windowRef: WindowRef
  ) {}

  // Check that local storage exists and works as expected.
  // If it does storage stores the localStorage object,
  // else storage is undefined or false.
  storage = (function() {
    let test = 'test';
    let result;
    try {
      localStorage.setItem(test, test);
      result = localStorage.getItem(test) === test;
      localStorage.removeItem(test);
      return result && localStorage;
    } catch (exception) {}
  }());

  LAST_SELECTED_TRANSLATION_LANGUAGE_KEY = ('last_selected_translation_lang');

  LAST_SELECTED_TRANSLATION_TOPIC_NAME = ('last_selected_translation_topic');

  HIDE_SIGN_UP_SECTION_PREFERENCE = ('hide_sign_up_section');

  /**
   * Create the key to access the changeList in localStorage
   * @param {String} explorationId - The exploration id of the changeList
   *   to be accessed.
   */
  _createExplorationDraftKey(explorationId: string): string {
    return 'draft_' + explorationId;
  }

  /**
   * Check that localStorage is available to the client.
   * @returns {boolean} true iff the client has access to localStorage.
   */
  isStorageAvailable(): boolean {
    return Boolean(this.storage);
  }

  /**
   * Save the given changeList to localStorage along with its
   * draftChangeListId
   * @param {String} explorationId - The id of the exploration
   *   associated with the changeList to be saved.
   * @param {List} changeList - The exploration change list to be saved.
   * @param {Integer} draftChangeListId - The id of the draft to be saved.
   */
  saveExplorationDraft(
      explorationId: string, changeList: ExplorationChange[],
      draftChangeListId: number): void {
    let localSaveKey = this._createExplorationDraftKey(explorationId);
    if (this.isStorageAvailable()) {
      let draftDict = ExplorationDraft.toLocalStorageDict(
        changeList, draftChangeListId);
      // It is possible that storage does not exist or the user does not have
      // permission to access it but this condition is already being checked by
      // calling 'isStorageAvailable()' so the typecast is safe.
      (this.storage as Storage).setItem(
        localSaveKey,
        JSON.stringify(draftDict));
    }
  }

  /**
   * Retrieve the local save of the changeList associated with the given
   * exploration id.
   * @param {String} explorationId - The exploration id of the change list
   *   to be retrieved.
   * @returns {Object} The local save draft object if it exists,
   *   else null.
   */
  getExplorationDraft(explorationId: string): ExplorationDraft | null {
    if (this.isStorageAvailable()) {
      // It is possible that storage does not exist or the user does not have
      // permission to access it but this condition is already being checked by
      // calling 'isStorageAvailable()' so the typecast is safe.
      let draftDict = (this.storage as Storage).getItem(
        this._createExplorationDraftKey(explorationId));
      if (draftDict) {
        return (
          ExplorationDraft.createFromLocalStorageDict(JSON.parse(draftDict))
        );
      }
    }
    return null;
  }

  /**
   * Remove the local save of the changeList associated with the given
   * exploration id.
   * @param {String} explorationId - The exploration id of the change list
   *   to be removed.
   */
  removeExplorationDraft(explorationId: string): void {
    if (this.isStorageAvailable()) {
      // It is possible that storage does not exist or the user does not have
      // permission to access it but this condition is already being checked by
      // calling 'isStorageAvailable()' so the typecast is safe.
      (this.storage as Storage).removeItem(
        this._createExplorationDraftKey(explorationId));
    }
  }

  /**
   * Save the given language code to localStorage along.
   * @param languageCode
   */
  updateLastSelectedTranslationLanguageCode(languageCode: string): void {
    if (this.isStorageAvailable()) {
      // It is possible that storage does not exist or the user does not have
      // permission to access it but this condition is already being checked by
      // calling 'isStorageAvailable()' so the typecast is safe.
      (this.storage as Storage).setItem(
        this.LAST_SELECTED_TRANSLATION_LANGUAGE_KEY, languageCode);
    }
  }

  /**
   * Retrieve the local save of the last selected language for translation.
   * @returns {String} The local save of the last selected language for
   *   translation if it exists, else null.
   */
  getLastSelectedTranslationLanguageCode(): string | null {
    if (this.isStorageAvailable()) {
      return (
        // It is possible that storage does not exist or the user does not have
        // permission to access it but this condition is already being checked
        // by calling 'isStorageAvailable()' so the typecast is safe.
        (this.storage as Storage).getItem(
          this.LAST_SELECTED_TRANSLATION_LANGUAGE_KEY));
    }
    return null;
  }

  /**
   * Save the given active topic name to localStorage.
   * @param topicName
   */
  updateLastSelectedTranslationTopicName(topicName: string): void {
    if (this.isStorageAvailable()) {
      // It is possible that storage does not exist or the user does not have
      // permission to access it but this condition is already being checked by
      // calling 'isStorageAvailable()' so the typecast is safe.
      (this.storage as Storage).setItem(
        this.LAST_SELECTED_TRANSLATION_TOPIC_NAME, topicName);
    }
  }

  /**
   * Retrieve the local save of the last selected topic for translation.
   * @returns {String} The local save of the last selected topic for
   *   translation if it exists, else null.
   */
  getLastSelectedTranslationTopicName(): string | null {
    if (this.isStorageAvailable()) {
      return (
        // It is possible that storage does not exist or the user does not have
        // permission to access it but this condition is already being checked
        // by calling 'isStorageAvailable()' so the typecast is safe.
        (this.storage as Storage).getItem(
          this.LAST_SELECTED_TRANSLATION_TOPIC_NAME));
    }
    return null;
  }

  updateUniqueProgressIdOfLoggedOutLearner(uniqueProgressUrlId: string): void {
    if (this.isStorageAvailable()) {
      (this.storage as Storage).setItem(
        'unique_progress_id', uniqueProgressUrlId);
    }
  }

  getUniqueProgressIdOfLoggedOutLearner(): string | null {
    if (this.isStorageAvailable()) {
      return (this.storage as Storage).getItem('unique_progress_id');
    }
    return null;
  }

  removeUniqueProgressIdOfLoggedOutLearner(): void {
    if (this.isStorageAvailable()) {
      (this.storage as Storage).removeItem('unique_progress_id');
    }
  }

  /**
   * Save the given sign up section hidden preference to localStorage.
   * @param isSectionHidden
   */
  updateEndChapterSignUpSectionHiddenPreference(isSectionHidden: string): void {
    if (this.isStorageAvailable()) {
      // It is possible that storage does not exist or the user does not have
      // permission to access it but this condition is already being checked by
      // calling 'isStorageAvailable()' so the typecast is safe.
      (this.storage as Storage).setItem(
        this.HIDE_SIGN_UP_SECTION_PREFERENCE, isSectionHidden);
    }
  }

  /**
   * Retrieve the local save of the sign up section preference.
   * @returns {String} The local save of the preference for
   *   hiding the end chapter sign up section.
   */
  getEndChapterSignUpSectionHiddenPreference(): string | null {
    if (this.isStorageAvailable()) {
      return (
        // It is possible that storage does not exist or the user does not have
        // permission to access it but this condition is already being checked
        // by calling 'isStorageAvailable()' so the typecast is safe.
        (this.storage as Storage).getItem(
          this.HIDE_SIGN_UP_SECTION_PREFERENCE));
    }
    return null;
  }

  /**
   * Retrieves the entity editor browser tabs info stored in the local storage
   * for opened tabs of a particular entity type depending upon the
   * browser tabs info constant.
   * @param entityEditorBrowserTabsInfoConstant The key of the data stored on
   * the local storage. It determines the type of the entity
   * (topic, story, exploration, skill) for which we are retrieving data.
   * @param entityId The id of the entity.
   * @returns EntityEditorBrowserTabsInfo if the data is found on the local
   * storage. Otherwise, returns null.
   */
  getEntityEditorBrowserTabsInfo(
      entityEditorBrowserTabsInfoConstant: string, entityId: string
  ): EntityEditorBrowserTabsInfo | null {
    if (this.isStorageAvailable()) {
      let allEntityEditorBrowserTabsInfoDicts:
        EntityEditorBrowserTabsInfoDict = {};

      const stringifiedEntityEditorBrowserTabsInfo = (this.storage as Storage)
        .getItem(entityEditorBrowserTabsInfoConstant);
      if (stringifiedEntityEditorBrowserTabsInfo) {
        allEntityEditorBrowserTabsInfoDicts = JSON.parse(
          stringifiedEntityEditorBrowserTabsInfo);
      }

      const requiredEntityEditorBrowserTabsInfoDict = (
        allEntityEditorBrowserTabsInfoDicts[entityId]);

      if (requiredEntityEditorBrowserTabsInfoDict) {
        return EntityEditorBrowserTabsInfo.fromLocalStorageDict(
          requiredEntityEditorBrowserTabsInfoDict, entityId);
      }
    }
    return null;
  }

  /**
   * Updates the entity editor browser tabs info stored on the local storage.
   * @param entityEditorBrowserTabsInfo The updated entity editor browser
   * tabs info.
   * @param entityEditorBrowserTabsInfoConstant The key of the data stored on
   * the local storage.
   */
  updateEntityEditorBrowserTabsInfo(
      entityEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo,
      entityEditorBrowserTabsInfoConstant: string
  ): void {
    if (this.isStorageAvailable()) {
      const updatedEntityEditorBrowserTabsInfoDict = (
        entityEditorBrowserTabsInfo.toLocalStorageDict()
      );
      const entityId = entityEditorBrowserTabsInfo.getId();

      let allEntityEditorBrowserTabsInfoDicts:
        EntityEditorBrowserTabsInfoDict = {};

      const stringifiedEntityEditorBrowserTabsInfo = (this.storage as Storage)
        .getItem(entityEditorBrowserTabsInfoConstant);
      if (stringifiedEntityEditorBrowserTabsInfo) {
        allEntityEditorBrowserTabsInfoDicts = JSON.parse(
          stringifiedEntityEditorBrowserTabsInfo);
      }

      if (allEntityEditorBrowserTabsInfoDicts[entityId]) {
        if (entityEditorBrowserTabsInfo.getNumberOfOpenedTabs() === 0) {
          // If number of opened tabs for a particular entity editor becomes
          // 0, then we should free the local storage by removing its info.
          delete allEntityEditorBrowserTabsInfoDicts[entityId];
          // If all the editor tabs of a particular entity are closed, then
          // remove the whole list from the local storage since its length
          // has become zero.
          if (Object.keys(allEntityEditorBrowserTabsInfoDicts).length === 0) {
            this.removeOpenedEntityEditorBrowserTabsInfo(
              entityEditorBrowserTabsInfoConstant);
          }
        } else {
          // If none of the above mentioned edge cases are present, then just
          // update the local storage with the updated info.
          allEntityEditorBrowserTabsInfoDicts[entityId] = (
            updatedEntityEditorBrowserTabsInfoDict);
        }
      } else {
        allEntityEditorBrowserTabsInfoDicts[entityId] = (
          updatedEntityEditorBrowserTabsInfoDict);
      }

      (this.storage as Storage).setItem(
        entityEditorBrowserTabsInfoConstant,
        JSON.stringify(allEntityEditorBrowserTabsInfoDicts));
    }
  }

  /**
   * Removes the entity editor browser tabs info for a particular type of
   * entity.
   * @param entityEditorBrowserTabsInfoConstant The key of the data stored on
   * the local storage.
   */
  removeOpenedEntityEditorBrowserTabsInfo(
      entityEditorBrowserTabsInfoConstant: string
  ): void {
    if (this.isStorageAvailable()) {
      (this.storage as Storage).removeItem(entityEditorBrowserTabsInfoConstant);
    }
  }

  /**
   * Registers a new callback for 'storage' event.
   * @param callbackFn The callback function to be called when the 'storage'
   * event is triggered.
   */
  registerNewStorageEventListener(callbackFn: Function): void {
    this.windowRef.nativeWindow.addEventListener('storage', (event) => {
      callbackFn(event);
    });
  }
}

angular.module('oppia').factory(
  'LocalStorageService',
  downgradeInjectable(LocalStorageService));
