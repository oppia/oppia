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
 * @fileoverview unit tests for the local save services.
 */

import { TestBed } from '@angular/core/testing';

import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { LocalStorageService } from 'services/local-storage.service';

describe('LocalStorageService', () => {
  describe('behavior in editor', () => {
    let localStorageService = null;
    let explorationDraftObjectFactory = null;
    const explorationIdOne = '100';
    const draftChangeListIdOne = 2;
    const changeList = [];
    const explorationIdTwo = '101';
    const draftChangeListIdTwo = 1;
    const draftDictOne = {
      draftChanges: changeList,
      draftChangeListId: draftChangeListIdOne
    };
    const draftDictTwo = {
      draftChanges: changeList,
      draftChangeListId: draftChangeListIdTwo
    };
    let draftOne = null;
    let draftTwo = null;

    beforeEach(() => {
      localStorageService = TestBed.get(LocalStorageService);
      explorationDraftObjectFactory = TestBed.get(
        ExplorationDraftObjectFactory);

      draftOne = explorationDraftObjectFactory.createFromLocalStorageDict(
        draftDictOne);
      draftTwo = explorationDraftObjectFactory.createFromLocalStorageDict(
        draftDictTwo);
    });

    it('should verify that storage is available', () => {
      expect(localStorageService.isStorageAvailable()).toBe(true);
    });

    it('should correctly save the draft', () => {
      localStorageService.saveExplorationDraft(explorationIdOne,
        changeList, draftChangeListIdOne);
      localStorageService.saveExplorationDraft(explorationIdTwo,
        changeList, draftChangeListIdTwo);
      expect(localStorageService.getExplorationDraft(
        explorationIdOne)).toEqual(draftOne);
      expect(localStorageService.getExplorationDraft(
        explorationIdTwo)).toEqual(draftTwo);
    });

    it('should correctly change and save a draft', () => {
      localStorageService.saveExplorationDraft(explorationIdOne,
        changeList, draftChangeListIdOne);
      expect(localStorageService.getExplorationDraft(
        explorationIdOne)).toEqual(draftOne);

      const draftChangeListIdOneChanged = 3;
      const draftOneChanged = explorationDraftObjectFactory
        .createFromLocalStorageDict({
          draftChanges: changeList,
          draftChangeListId: draftChangeListIdOneChanged
        });
      localStorageService.saveExplorationDraft(explorationIdOne,
        changeList, draftChangeListIdOneChanged);
      expect(localStorageService.getExplorationDraft(
        explorationIdOne)).toEqual(draftOneChanged);
    });

    it('should correctly remove the draft', () => {
      localStorageService.saveExplorationDraft(explorationIdTwo,
        changeList, draftChangeListIdTwo);
      localStorageService.removeExplorationDraft(explorationIdTwo);
      expect(localStorageService.getExplorationDraft(
        explorationIdTwo)).toBeNull();
    });

    it('should correctly save a language code', () => {
      localStorageService.updateLastSelectedTranslationLanguageCode('en');
      expect(localStorageService.getLastSelectedTranslationLanguageCode())
        .toBe('en');

      localStorageService.updateLastSelectedTranslationLanguageCode('hi');
      expect(localStorageService.getLastSelectedTranslationLanguageCode())
        .toBe('hi');
    });

    it('should not save a language code when storage is not available', () => {
      spyOn(localStorageService, 'isStorageAvailable').and.returnValue(false);
      localStorageService.updateLastSelectedTranslationLanguageCode('en');
      expect(localStorageService.getLastSelectedTranslationLanguageCode())
        .toBeNull();
    });
  });
});
