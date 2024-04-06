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
 * @fileoverview Service that handles routing for the collection editor page.
 */

import {Injectable, EventEmitter} from '@angular/core';
import {WindowRef} from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root',
})
export class CollectionEditorRoutingService {
  // These properties are initialized using private functions
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private _activeTabName!: string;
  private _EDIT_TAB = 'edit';
  private _HISTORY_TAB = 'history';
  private _SETTINGS_TAB = 'settings';
  private _STATS_TAB = 'stats';
  private _updateViewEventEmitter: EventEmitter<void> = new EventEmitter();

  constructor(private windowRef: WindowRef) {
    let currentHash: string = this.windowRef.nativeWindow.location.hash;
    this._changeTab(currentHash.substring(1, currentHash.length));
  }

  private _changeTab(newHash: string) {
    if (newHash === '/settings') {
      this._activeTabName = this._SETTINGS_TAB;
    } else if (newHash === '/history') {
      this._activeTabName = this._HISTORY_TAB;
    } else if (newHash === '/stats') {
      this._activeTabName = this._STATS_TAB;
    } else {
      this._activeTabName = this._EDIT_TAB;
    }

    this.windowRef.nativeWindow.location.hash = newHash;
    this._updateViewEventEmitter.emit();
  }

  getActiveTabName(): string {
    return this._activeTabName;
  }

  navigateToEditTab(): void {
    this._changeTab('/edit');
  }

  navigateToSettingsTab(): void {
    this._changeTab('/settings');
  }

  navigateToHistoryTab(): void {
    this._changeTab('/history');
  }

  navigateToStatsTab(): void {
    this._changeTab('/stats');
  }

  get updateViewEventEmitter(): EventEmitter<void> {
    return this._updateViewEventEmitter;
  }
}
