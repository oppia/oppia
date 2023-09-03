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
 * @fileoverview Service to get and set active content id in translation tab.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { EventEmitter } from '@angular/core';
import { Injectable } from '@angular/core';

import { StateRecordedVoiceoversService } from 'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';


@Injectable({
  providedIn: 'root'
})
export class TranslationTabActiveContentIdService {
  constructor(
    private _stateRecordedVoiceoversService: StateRecordedVoiceoversService) {}

  // 'activeContentId' and 'activeDataFormat' will be 'null' if active content
  // has not been set.
  activeContentId: string | null = null;
  activeDataFormat: string | null = null;
  _activeContentIdChangedEventEmitter = new EventEmitter<string>();

  getActiveContentId(): string | null {
    return this.activeContentId;
  }

  getActiveDataFormat(): string | null {
    return this.activeDataFormat;
  }

  setActiveContent(contentId: string, dataFormat: string): void {
    const displayStateRecordedVoiceovers = (
      this._stateRecordedVoiceoversService.displayed);
    let allContentIds = displayStateRecordedVoiceovers.getAllContentIds();
    if (allContentIds.indexOf(contentId) === -1) {
      throw new Error('Invalid active content id: ' + contentId);
    }
    this.activeContentId = contentId;
    this.activeDataFormat = dataFormat;
    this._activeContentIdChangedEventEmitter.emit(dataFormat);
  }

  get onActiveContentIdChanged(): EventEmitter<string> {
    return this._activeContentIdChangedEventEmitter;
  }
}

angular.module('oppia').factory(
  'TranslationTabActiveContentIdService', downgradeInjectable(
    TranslationTabActiveContentIdService));
