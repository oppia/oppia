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
 * @fileoverview Model for creating and mutating instances of entity editor
 * browser tabs info.
 *
 * This domain object will store information about opened
 * entity editor tabs. This information will be stored in the local storage
 * and is required in order to sync between different entity editor
 * tabs with the same url and show some meaningful info to the user
 * when a tab becomes stale or some other tab with the same url has
 * unsaved changes. This will make the user take the necerssary actions
 * and avoid failure in the future while saving their work.
 */

export interface EntityEditorBrowserTabsInfoDict {
  [entityId: string]: EntityEditorBrowserTabsInfoLocalStorageDict;
}

export interface EntityEditorBrowserTabsInfoLocalStorageDict {
  entityType: string;
  latestVersion: number;
  numberOfOpenedTabs: number;
  someTabHasUnsavedChanges: boolean;
}

export class EntityEditorBrowserTabsInfo {
  /**
   * The type of the entity for a particular opened entity editor tab.
   * It can have values: 'topic', 'story', 'skill' and 'exploration'.
   * For example, if an editor tab with url '/topic_editor/topic_1' is opened,
   * then the value of '_entityType' will be 'topic'.
   */
  _entityType: string;
  /**
   * The ID of the entity for a particular opened entity editor tab.
   * For example, if an editor tab with url '/topic_editor/topic_1' is opened,
   * then the value of '_id' will be 'topic_1'.
   */
  _id: string;
  /**
   * The latest version for a particular entity with a particular id.
   * For example, if an editor tab with url '/topic_editor/topic_1' is
   * opened, then the value of '_latestVersion' will be the latest version of
   * the topic with id 'topic_1'.
   */
  _latestVersion: number;
  /**
   * The number of opened tabs for a particular entity editor tab url.
   * For example, if we open two topic editor tabs with url
   * '/topic_editor/topic_1', then the value of '_numberOfOpenedTabs' will be 2.
   */
  _numberOfOpenedTabs: number;
  /**
   * Whether some other entity editor tab with the same url
   * has unsaved changes on it. For example, if we open two topic editor tabs
   * with url '/topic_editor/topic_1'. At first, value of
   * '_someTabHasUnsavedChanges' will be false. Now, if we make some changes
   * on one of them then its value will be set to true until the changes are
   * saved or discarded. After that, it will be set to false again.
   */
  _someTabHasUnsavedChanges: boolean;

  constructor(
    entityType: string,
    id: string,
    latestVersion: number,
    numberOfOpenedTabs: number,
    someTabHasUnsavedChanges: boolean
  ) {
    this._entityType = entityType;
    this._id = id;
    this._latestVersion = latestVersion;
    this._numberOfOpenedTabs = numberOfOpenedTabs;
    this._someTabHasUnsavedChanges = someTabHasUnsavedChanges;
  }

  static create(
    entityType: string,
    id: string,
    latestVersion: number,
    numberOfOpenedTabs: number,
    someTabHasUnsavedChanges: boolean
  ): EntityEditorBrowserTabsInfo {
    return new EntityEditorBrowserTabsInfo(
      entityType,
      id,
      latestVersion,
      numberOfOpenedTabs,
      someTabHasUnsavedChanges
    );
  }

  static fromLocalStorageDict(
    entityEditorBrowserTabsInfoLocalStorageDict: EntityEditorBrowserTabsInfoLocalStorageDict,
    entityId: string
  ): EntityEditorBrowserTabsInfo {
    return new EntityEditorBrowserTabsInfo(
      entityEditorBrowserTabsInfoLocalStorageDict.entityType,
      entityId,
      entityEditorBrowserTabsInfoLocalStorageDict.latestVersion,
      entityEditorBrowserTabsInfoLocalStorageDict.numberOfOpenedTabs,
      entityEditorBrowserTabsInfoLocalStorageDict.someTabHasUnsavedChanges
    );
  }

  toLocalStorageDict(): EntityEditorBrowserTabsInfoLocalStorageDict {
    return {
      entityType: this.getEntityType(),
      latestVersion: this.getLatestVersion(),
      numberOfOpenedTabs: this.getNumberOfOpenedTabs(),
      someTabHasUnsavedChanges: this.doesSomeTabHaveUnsavedChanges(),
    };
  }

  /**
   * Gets the entity type.
   */
  getEntityType(): string {
    return this._entityType;
  }

  /**
   * Gets the id of the entity.
   */
  getId(): string {
    return this._id;
  }

  /**
   * Gets the latest version.
   */
  getLatestVersion(): number {
    return this._latestVersion;
  }

  /**
   * Sets the latest version to the given value.
   */
  setLatestVersion(latestVersion: number): void {
    this._latestVersion = latestVersion;
  }

  /**
   * Gets the number of opened tabs.
   */
  getNumberOfOpenedTabs(): number {
    return this._numberOfOpenedTabs;
  }

  /**
   * Increments the number of opened tabs by one.
   */
  incrementNumberOfOpenedTabs(): void {
    this._numberOfOpenedTabs = this._numberOfOpenedTabs + 1;
  }

  /**
   * Decrements the number of opened tabs by one.
   */
  decrementNumberOfOpenedTabs(): void {
    this._numberOfOpenedTabs = this._numberOfOpenedTabs - 1;
  }

  /**
   * Gets whether some other entity editor tab with the same url has unsaved
   * changes on it.
   */
  doesSomeTabHaveUnsavedChanges(): boolean {
    return this._someTabHasUnsavedChanges;
  }

  /**
   * Sets the value of 'presence of unsaved changs on some other tab with the
   * same url' status to the given value.
   */
  setSomeTabHasUnsavedChanges(someTabHasUnsavedChanges: boolean): void {
    this._someTabHasUnsavedChanges = someTabHasUnsavedChanges;
  }
}
