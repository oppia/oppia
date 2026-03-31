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

import {TestBed} from '@angular/core/testing';
import {
  EntityEditorBrowserTabsInfo,
  EntityEditorBrowserTabsInfoLocalStorageDict,
} from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import {EntityEditorBrowserTabsInfoDomainConstants} from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info-domain.constants';
import {
  ExplorationChange,
  ExplorationDraft,
  ExplorationDraftDict,
} from 'domain/exploration/exploration-draft.model';
import {LocalStorageService} from 'services/local-storage.service';
import {WindowRef} from './contextual/window-ref.service';

describe('LocalStorageService', () => {
  describe('behavior in editor', () => {
    let localStorageService: LocalStorageService;
    const explorationIdOne = '100';
    const draftChangeListIdOne = 2;
    const changeList: ExplorationChange[] = [];
    const explorationIdTwo = '101';
    const draftChangeListIdTwo = 1;
    const draftDictOne: ExplorationDraftDict = {
      draftChanges: changeList,
      draftChangeListId: draftChangeListIdOne,
    };
    const draftDictTwo: ExplorationDraftDict = {
      draftChanges: changeList,
      draftChangeListId: draftChangeListIdTwo,
    };
    let draftOne: ExplorationDraft;
    let draftTwo: ExplorationDraft;
    let windowRef: WindowRef;

    beforeEach(() => {
      localStorageService = TestBed.inject(LocalStorageService);
      windowRef = TestBed.inject(WindowRef);

      draftOne = ExplorationDraft.createFromLocalStorageDict(draftDictOne);
      draftTwo = ExplorationDraft.createFromLocalStorageDict(draftDictTwo);
    });

    it('should verify that storage is available', () => {
      expect(localStorageService.isStorageAvailable()).toBe(true);
    });

    it('should correctly save the draft', () => {
      localStorageService.saveExplorationDraft(
        explorationIdOne,
        changeList,
        draftChangeListIdOne
      );
      localStorageService.saveExplorationDraft(
        explorationIdTwo,
        changeList,
        draftChangeListIdTwo
      );

      expect(localStorageService.getExplorationDraft(explorationIdOne)).toEqual(
        draftOne
      );
      expect(localStorageService.getExplorationDraft(explorationIdTwo)).toEqual(
        draftTwo
      );
    });

    it('should correctly change and save a draft', () => {
      localStorageService.saveExplorationDraft(
        explorationIdOne,
        changeList,
        draftChangeListIdOne
      );

      expect(localStorageService.getExplorationDraft(explorationIdOne)).toEqual(
        draftOne
      );

      const draftChangeListIdOneChanged = 3;
      const draftOneChanged = ExplorationDraft.createFromLocalStorageDict({
        draftChanges: changeList,
        draftChangeListId: draftChangeListIdOneChanged,
      });
      localStorageService.saveExplorationDraft(
        explorationIdOne,
        changeList,
        draftChangeListIdOneChanged
      );

      expect(localStorageService.getExplorationDraft(explorationIdOne)).toEqual(
        draftOneChanged
      );
    });

    it('should correctly remove the draft', () => {
      localStorageService.saveExplorationDraft(
        explorationIdTwo,
        changeList,
        draftChangeListIdTwo
      );
      localStorageService.removeExplorationDraft(explorationIdTwo);

      expect(
        localStorageService.getExplorationDraft(explorationIdTwo)
      ).toBeNull();
    });

    it('should correctly save a language code', () => {
      localStorageService.updateLastSelectedTranslationLanguageCode('en');

      expect(localStorageService.getLastSelectedTranslationLanguageCode()).toBe(
        'en'
      );

      localStorageService.updateLastSelectedTranslationLanguageCode('hi');

      expect(localStorageService.getLastSelectedTranslationLanguageCode()).toBe(
        'hi'
      );
    });

    it('should correctly save language accent code', () => {
      localStorageService.setLastSelectedLanguageAccentCode('en-US');

      expect(localStorageService.getLastSelectedLanguageAccentCode()).toEqual(
        'en-US'
      );

      localStorageService.setLastSelectedLanguageAccentCode('en-IN');

      expect(localStorageService.getLastSelectedLanguageAccentCode()).toBe(
        'en-IN'
      );
    });

    it('should not save a language accent code when storage is not available', () => {
      spyOn(localStorageService, 'isStorageAvailable').and.returnValue(false);

      localStorageService.setLastSelectedLanguageAccentCode('en-IN');

      expect(
        localStorageService.getLastSelectedLanguageAccentCode()
      ).toBeNull();
    });

    it('should not save a language code when storage is not available', () => {
      spyOn(localStorageService, 'isStorageAvailable').and.returnValue(false);

      localStorageService.updateLastSelectedTranslationLanguageCode('en');

      expect(
        localStorageService.getLastSelectedTranslationLanguageCode()
      ).toBeNull();
    });

    it('should correctly save a topic name', () => {
      localStorageService.updateLastSelectedTranslationTopicName('Topic 1');
      expect(localStorageService.getLastSelectedTranslationTopicName()).toBe(
        'Topic 1'
      );

      localStorageService.updateLastSelectedTranslationTopicName('Topic 1');
      expect(localStorageService.getLastSelectedTranslationTopicName()).toBe(
        'Topic 1'
      );
    });

    it('should not save a topic name when storage is not available', () => {
      spyOn(localStorageService, 'isStorageAvailable').and.returnValue(false);

      localStorageService.updateLastSelectedTranslationTopicName('Topic 1');

      expect(
        localStorageService.getLastSelectedTranslationTopicName()
      ).toBeNull();
    });

    it('should correctly save and retrieve sign up section preference', () => {
      expect(
        localStorageService.getEndChapterSignUpSectionHiddenPreference()
      ).toBeNull();

      localStorageService.updateEndChapterSignUpSectionHiddenPreference('true');

      expect(
        localStorageService.getEndChapterSignUpSectionHiddenPreference()
      ).toBe('true');
    });

    it(
      "should not save sign up section preference when local storage isn't " +
        'available',
      () => {
        spyOn(localStorageService, 'isStorageAvailable').and.returnValue(false);

        localStorageService.updateEndChapterSignUpSectionHiddenPreference(
          'true'
        );

        expect(
          localStorageService.getEndChapterSignUpSectionHiddenPreference()
        ).toBeNull();
      }
    );

    it(
      'should not get entity editor browser tabs info from local ' +
        'storage when storage is not available',
      () => {
        spyOn(localStorageService, 'isStorageAvailable').and.returnValue(false);

        expect(
          localStorageService.getEntityEditorBrowserTabsInfo(
            EntityEditorBrowserTabsInfoDomainConstants.OPENED_TOPIC_EDITOR_BROWSER_TABS,
            'topic_1'
          )
        ).toBeNull();
      }
    );

    it('should add entity editor browser tabs info', () => {
      const entityEditorBrowserTabsInfoLocalStorageDict: EntityEditorBrowserTabsInfoLocalStorageDict =
        {
          entityType: 'topic',
          latestVersion: 1,
          numberOfOpenedTabs: 1,
          someTabHasUnsavedChanges: false,
        };
      localStorageService.updateEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfo.fromLocalStorageDict(
          entityEditorBrowserTabsInfoLocalStorageDict,
          'topic_1'
        ),
        EntityEditorBrowserTabsInfoDomainConstants.OPENED_TOPIC_EDITOR_BROWSER_TABS
      );

      const topicEditorBrowserTabsInfo =
        localStorageService.getEntityEditorBrowserTabsInfo(
          EntityEditorBrowserTabsInfoDomainConstants.OPENED_TOPIC_EDITOR_BROWSER_TABS,
          'topic_1'
        );

      expect(topicEditorBrowserTabsInfo).not.toBeNull();
      // The "?" in the below assertion is to avoid typescript errors because
      // localStorageService.getEntityEditorBrowserTabsInfo can either return
      // null or an instance of EntityEditorBrowserTabsInfo.
      expect(topicEditorBrowserTabsInfo?.toLocalStorageDict()).toEqual(
        entityEditorBrowserTabsInfoLocalStorageDict
      );
    });

    it('should update entity editor browser tabs info', () => {
      const entityEditorBrowserTabsInfoLocalStorageDict: EntityEditorBrowserTabsInfoLocalStorageDict =
        {
          entityType: 'skill',
          latestVersion: 1,
          numberOfOpenedTabs: 1,
          someTabHasUnsavedChanges: false,
        };
      const entityEditorBrowserTabsInfo =
        EntityEditorBrowserTabsInfo.fromLocalStorageDict(
          entityEditorBrowserTabsInfoLocalStorageDict,
          'skill_1'
        );
      localStorageService.updateEntityEditorBrowserTabsInfo(
        entityEditorBrowserTabsInfo,
        EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS
      );

      entityEditorBrowserTabsInfo.setLatestVersion(2);
      localStorageService.updateEntityEditorBrowserTabsInfo(
        entityEditorBrowserTabsInfo,
        EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS
      );

      entityEditorBrowserTabsInfo.decrementNumberOfOpenedTabs();
      localStorageService.updateEntityEditorBrowserTabsInfo(
        entityEditorBrowserTabsInfo,
        EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS
      );
    });

    it('should register new callback for storage event listener', () => {
      const callbackFnSpy = jasmine.createSpy('callbackFn', event => {});
      localStorageService.registerNewStorageEventListener(callbackFnSpy);
      windowRef.nativeWindow.dispatchEvent(new StorageEvent('storage'));

      expect(callbackFnSpy).toHaveBeenCalled();
    });

    it('should correctly save unique progress URL ID', () => {
      expect(
        localStorageService.getUniqueProgressIdOfLoggedOutLearner()
      ).toBeNull();

      localStorageService.updateUniqueProgressIdOfLoggedOutLearner('abcdef');

      expect(
        localStorageService.getUniqueProgressIdOfLoggedOutLearner()
      ).toEqual('abcdef');
    });

    it(
      'should not save unique progress URL ID when storage is not ' +
        'available',
      () => {
        spyOn(localStorageService, 'isStorageAvailable').and.returnValue(false);

        localStorageService.updateUniqueProgressIdOfLoggedOutLearner('abcdef');

        expect(
          localStorageService.getUniqueProgressIdOfLoggedOutLearner()
        ).toBeNull();
      }
    );

    it('should correctly remove unique progress URL ID', () => {
      localStorageService.updateUniqueProgressIdOfLoggedOutLearner('abcdef');

      expect(
        localStorageService.getUniqueProgressIdOfLoggedOutLearner()
      ).toEqual('abcdef');

      localStorageService.removeUniqueProgressIdOfLoggedOutLearner();

      expect(
        localStorageService.getUniqueProgressIdOfLoggedOutLearner()
      ).toBeNull();
    });

    it('should set Last Page View Time of a page correctly', () => {
      const key = 'lastAboutPageViewTime';
      const currentTime = new Date().getTime();
      localStorageService.setLastPageViewTime(key);

      expect(
        localStorageService.getLastPageViewTime(key)
      ).toBeGreaterThanOrEqual(currentTime);
    });

    it('should not save Last Page View Time of a page when storage is not available', () => {
      spyOn(localStorageService, 'isStorageAvailable').and.returnValue(false);

      const key = 'lastAboutPageViewTime';
      localStorageService.setLastPageViewTime(key);

      expect(localStorageService.getLastPageViewTime()).toBeNull();
    });
  });
});
