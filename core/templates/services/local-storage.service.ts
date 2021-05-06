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

// Service for saving exploration draft changes to local storage.
//
// Note that the draft is only saved if localStorage exists and works
// (i.e. has storage capacity).

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import {
  ExplorationChange,
  ExplorationDraft
} from 'domain/exploration/exploration-draft.model';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  constructor() {}

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
      this.storage.setItem(localSaveKey, JSON.stringify(draftDict));
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
      let draftDict = JSON.parse(
        this.storage.getItem(this._createExplorationDraftKey(explorationId)));
      if (draftDict) {
        return ExplorationDraft.createFromLocalStorageDict(draftDict);
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
      this.storage.removeItem(this._createExplorationDraftKey(explorationId));
    }
  }

  /**
   * Save the given language code to localStorage along.
   * @param languageCode
   */
  updateLastSelectedTranslationLanguageCode(languageCode: string): void {
    if (this.isStorageAvailable()) {
      this.storage.setItem(
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
        this.storage.getItem(this.LAST_SELECTED_TRANSLATION_LANGUAGE_KEY));
    }
    return null;
  }
}

angular.module('oppia').factory(
  'LocalStorageService',
  downgradeInjectable(LocalStorageService));
