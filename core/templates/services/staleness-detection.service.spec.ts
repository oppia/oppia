// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for staleness detection service.
 */

import {TestBed} from '@angular/core/testing';
import {StalenessDetectionService} from './staleness-detection.service';
import {EntityEditorBrowserTabsInfoDomainConstants} from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info-domain.constants';
import {LocalStorageService} from './local-storage.service';
import {EntityEditorBrowserTabsInfo} from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';

describe('Staleness Detection Service', () => {
  let stalenessDetectionService: StalenessDetectionService;
  let localStorageService: LocalStorageService;

  beforeEach(() => {
    stalenessDetectionService = TestBed.inject(StalenessDetectionService);
    localStorageService = TestBed.inject(LocalStorageService);
  });

  it('should find whether an entity editor tab is stale', () => {
    localStorageService.updateEntityEditorBrowserTabsInfo(
      EntityEditorBrowserTabsInfo.create('topic', 'topic_1', 2, 1, false),
      EntityEditorBrowserTabsInfoDomainConstants.OPENED_TOPIC_EDITOR_BROWSER_TABS
    );

    expect(
      stalenessDetectionService.isEntityEditorTabStale(
        EntityEditorBrowserTabsInfoDomainConstants.OPENED_TOPIC_EDITOR_BROWSER_TABS,
        'topic_1',
        1
      )
    ).toBeTrue();
    expect(
      stalenessDetectionService.isEntityEditorTabStale(
        EntityEditorBrowserTabsInfoDomainConstants.OPENED_TOPIC_EDITOR_BROWSER_TABS,
        'topic_1',
        2
      )
    ).toBeFalse();
    expect(
      stalenessDetectionService.isEntityEditorTabStale(
        EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS,
        'skill_2',
        1
      )
    ).toBeFalse();
  });

  it(
    'should find whether some other editor tab of the same url has ' +
      'unsaved changes',
    () => {
      localStorageService.updateEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfo.create('skill', 'skill_1', 2, 2, true),
        EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS
      );

      expect(
        stalenessDetectionService.doesSomeOtherEntityEditorPageHaveUnsavedChanges(
          EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS,
          'skill_1'
        )
      ).toBeTrue();
      expect(
        stalenessDetectionService.doesSomeOtherEntityEditorPageHaveUnsavedChanges(
          EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS,
          'skill_2'
        )
      ).toBeFalse();
    }
  );
});
