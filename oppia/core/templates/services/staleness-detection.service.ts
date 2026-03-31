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
 * @fileoverview Service for checking if an editor page is stale.
 *
 * Here, 'stale' refers to a particular entity editor tab haivng version
 * less than the latest version of the entity stored in the backend. It happens
 * when another tab of the same url saves some data. It is essential to identify
 * stale tabs and inform the user about the same so that they can reload the tab
 * before working further and avoid unnecessary data loss.
 */

import {Injectable} from '@angular/core';
import {LocalStorageService} from './local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class StalenessDetectionService {
  constructor(private localStorageService: LocalStorageService) {}

  /**
   * Checks if an entity editor tab with a particular url is stale.
   * @param entityEditorBrowserTabsInfoConstant The key of the data stored on
   *  local storage. It determines the type of the entity
   * (topic, story, exploration, skill) for which we are retrieving data.
   * @param entityId The id of the entity.
   * @param currentVersion The current version of the entity.
   * @returns {boolean} Whether the particular tab is stale.
   */
  isEntityEditorTabStale(
    entityEditorBrowserTabsInfoConstant: string,
    entityId: string,
    currentVersion: number
  ): boolean {
    const entityEditorBrowserTabsInfo =
      this.localStorageService.getEntityEditorBrowserTabsInfo(
        entityEditorBrowserTabsInfoConstant,
        entityId
      );

    if (entityEditorBrowserTabsInfo) {
      return entityEditorBrowserTabsInfo.getLatestVersion() !== currentVersion;
    }
    return false;
  }

  /**
   * Checks if some other entity editor tab of the same url has some unsaved
   * changes on them.
   * @param entityEditorBrowserTabsInfoConstant The key of the data stored on
   *  local storage.
   * @param entityId The id of the entity.
   * @returns {boolean} Whether some other entity editor tab of the same url
   * has some unsaved changes on them.
   */
  doesSomeOtherEntityEditorPageHaveUnsavedChanges(
    entityEditorBrowserTabsInfoConstant: string,
    entityId: string
  ): boolean {
    const entityEditorBrowserTabsInfo =
      this.localStorageService.getEntityEditorBrowserTabsInfo(
        entityEditorBrowserTabsInfoConstant,
        entityId
      );

    if (entityEditorBrowserTabsInfo) {
      return entityEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges();
    }
    return false;
  }
}
