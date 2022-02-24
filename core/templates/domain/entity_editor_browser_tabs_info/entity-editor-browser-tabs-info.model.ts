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
 */

export interface EntityEditorBrowserTabsInfoObject {
  entityType: string;
  id: string;
  latestVersion: number;
  numberOfOpenedTabs: number;
  someTabHasUnsavedChanges: boolean;
}

export class EntityEditorBrowserTabsInfo {
  // Id of the entity whose editor page is opened.
  _entityType: string;
  _id: string;
  _latestVersion: number;
  _numberOfOpenedTabs: number;
  _someTabHasUnsavedChanges: boolean;

  constructor(
      entityType: string, id: string, latestVersion: number,
      numberOfOpenedTabs: number, someTabHasUnsavedChanges: boolean
  ) {
    this._entityType = entityType;
    this._id = id;
    this._latestVersion = latestVersion;
    this._numberOfOpenedTabs = numberOfOpenedTabs;
    this._someTabHasUnsavedChanges = someTabHasUnsavedChanges;
  }

  static create(
      entityType: string, id: string, latestVersion: number,
      numberOfOpenedTabs: number, someTabHasUnsavedChanges: boolean
  ): EntityEditorBrowserTabsInfo {
    return new EntityEditorBrowserTabsInfo(
      entityType, id, latestVersion,
      numberOfOpenedTabs, someTabHasUnsavedChanges
    );
  }

  static createFromDict(
      entityEditorBrowserTabsInfoObject: EntityEditorBrowserTabsInfoObject
  ): EntityEditorBrowserTabsInfo {
    return new EntityEditorBrowserTabsInfo(
      entityEditorBrowserTabsInfoObject.entityType,
      entityEditorBrowserTabsInfoObject.id,
      entityEditorBrowserTabsInfoObject.latestVersion,
      entityEditorBrowserTabsInfoObject.numberOfOpenedTabs,
      entityEditorBrowserTabsInfoObject.someTabHasUnsavedChanges
    );
  }

  toDict(): EntityEditorBrowserTabsInfoObject {
    return {
      entityType: this.getEntityType(),
      id: this.getId(),
      latestVersion: this.getLatestVersion(),
      numberOfOpenedTabs: this.getNumberOfOpenedTabs(),
      someTabHasUnsavedChanges: (
        this.doesSomeTabHaveUnsavedChanges())
    };
  }

  getEntityType(): string {
    return this._entityType;
  }

  getId(): string {
    return this._id;
  }

  getLatestVersion(): number {
    return this._latestVersion;
  }

  setLatestVersion(latestVersion: number): void {
    this._latestVersion = latestVersion;
  }

  getNumberOfOpenedTabs(): number {
    return this._numberOfOpenedTabs;
  }

  incrementNumberOfOpenedTabs(): void {
    this._numberOfOpenedTabs = this._numberOfOpenedTabs + 1;
  }

  decrementNumberOfOpenedTabs(): void {
    this._numberOfOpenedTabs = this._numberOfOpenedTabs - 1;
  }

  doesSomeTabHaveUnsavedChanges(): boolean {
    return this._someTabHasUnsavedChanges;
  }

  setSomeTabHasUnsavedChanges(someTabHasUnsavedChanges: boolean): void {
    this._someTabHasUnsavedChanges = someTabHasUnsavedChanges;
  }
}
