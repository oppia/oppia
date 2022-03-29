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
 * @fileoverview Unit tests for entity editor browser tabs info.
 */

import { EntityEditorBrowserTabsInfo } from './entity-editor-browser-tabs-info.model';

describe('Entity Editor Browser Tabs Info', () => {
  let topicEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo;
  let skillEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo;
  const skillEditorBrowserTabsInfoLocalStorageDict = {
    entityType: 'skill',
    latestVersion: 1,
    numberOfOpenedTabs: 1,
    someTabHasUnsavedChanges: false
  };

  beforeEach(() => {
    skillEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo
      .fromLocalStorageDict(
        skillEditorBrowserTabsInfoLocalStorageDict, 'skill_1');
    topicEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'topic', 'topic_1', 1, 1, false);
  });

  it('should correctly get the various properties', () => {
    expect(skillEditorBrowserTabsInfo.getEntityType()).toEqual('skill');
    expect(topicEditorBrowserTabsInfo.getEntityType()).toEqual('topic');
    expect(skillEditorBrowserTabsInfo.getId()).toEqual('skill_1');
    expect(topicEditorBrowserTabsInfo.getId()).toEqual('topic_1');
    expect(skillEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(1);
    expect(topicEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(1);
    expect(skillEditorBrowserTabsInfo.getLatestVersion()).toEqual(1);
    expect(topicEditorBrowserTabsInfo.getLatestVersion()).toEqual(1);
    expect(
      skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeFalse();
    expect(
      topicEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeFalse();
  });

  it('should correctly convert into dict that can be stored in local storage',
    () => {
      expect(skillEditorBrowserTabsInfo.toLocalStorageDict()).toEqual(
        skillEditorBrowserTabsInfoLocalStorageDict);
    });

  it('should correctly set latest version to the given value', () => {
    expect(topicEditorBrowserTabsInfo.getLatestVersion()).toEqual(1);

    topicEditorBrowserTabsInfo.setLatestVersion(2);

    expect(topicEditorBrowserTabsInfo.getLatestVersion()).toEqual(2);
  });

  it('should correctly increment and decrement the value of ' +
      'number of opened tabs',
  () => {
    expect(skillEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(1);

    skillEditorBrowserTabsInfo.incrementNumberOfOpenedTabs();

    expect(skillEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(2);

    skillEditorBrowserTabsInfo.decrementNumberOfOpenedTabs();

    expect(skillEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(1);
  });

  it('should correctly set the value of \'someTabHasUnsavedChanges\' ' +
      'to the given value',
  () => {
    expect(
      skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeFalse();

    skillEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(true);

    expect(
      skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeTrue();
  });
});
