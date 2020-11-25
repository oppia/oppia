// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
import { Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core';

import { StateRecordedVoiceoversService } from
// eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';


@Injectable({
  providedIn: 'root'
})
export class TranslationTabActiveContentIdService {
  private _activeContentId: string = null;
  private _activeDataFormat: string = null;
  private _activeContentIdChangedEventEmitter = new EventEmitter();

  constructor(
    private stateRecordedVoiceoversService: StateRecordedVoiceoversService) {}

  get activeContentId() {
    return this._activeContentId;
  }

  set activeContentId(theActiveContentId: string) {
    this._activeContentId = theActiveContentId;
  }

  get activeDataFormat() {
    return this._activeDataFormat;
  }

  set activeDataFormat(theActiveDataFormat: string) {
    this._activeDataFormat = theActiveDataFormat;
  }

  setActiveContent(contentId: string, dataFormat: string): void {
    let allContentIds: string[];
    allContentIds =
      this.stateRecordedVoiceoversService.displayed.getAllContentId();
    if (allContentIds.indexOf(contentId) === -1) {
      throw new Error('Invalid active content id: ' + contentId);
    }
    this._activeContentId = contentId;
    this._activeDataFormat = dataFormat;
    this._activeContentIdChangedEventEmitter.emit(dataFormat);
  }

  get onActiveContentIdChanged() {
    return this._activeContentIdChangedEventEmitter;
  }
}

angular.module('oppia').factory(
  'TranslationTabActiveContentIdService',
  downgradeInjectable(TranslationTabActiveContentIdService));
