// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service for handling contribution opportunities in different
 * fields.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import {
  StateNamesToContentIdMappingBackendDict,
  TranslateTextBackendApiService
} from 'services/translate-text-backend-api.service';
import { ImagesData } from 'services/image-local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class TranslateTextService {
  constructor(
    private _translatableTextBackedApiService:
    TranslateTextBackendApiService) {}

  stateWiseContents: StateNamesToContentIdMappingBackendDict = null;
  stateWiseContentIds: {[key: string]: string[]} = {};
  activeStateName: string = null;
  activeContentId: string = null;
  stateNamesList: string[] = [];
  activeExpId: string = null;
  activeExpVersion: string = null;

  private getNextContentId(): string {
    return this.stateWiseContentIds[this.activeStateName].pop();
  }

  private getNextState(): string {
    const currentIndex = this.stateNamesList.indexOf(this.activeStateName);
    return this.stateNamesList[currentIndex + 1];
  }

  private getNextText(): string {
    if (this.stateNamesList.length === 0) {
      return null;
    }
    this.activeContentId = this.getNextContentId();
    if (!this.activeContentId) {
      this.activeStateName = this.getNextState();
      if (!this.activeStateName) {
        return null;
      }
      this.activeContentId = this.getNextContentId();
    }
    return this.stateWiseContents[this.activeStateName][this.activeContentId];
  }

  private isMoreTextAvailableForTranslation(): boolean {
    if (this.stateNamesList.length === 0) {
      return false;
    }
    return !(
      this.stateNamesList.indexOf(this.activeStateName) + 1 ===
      this.stateNamesList.length &&
      this.stateWiseContentIds[this.activeStateName].length === 0);
  }

  init(expId: string, languageCode: string, successCallback: ()=>void): void {
    this.stateWiseContents = null;
    this.stateWiseContentIds = {};
    this.activeStateName = null;
    this.activeContentId = null;
    this.stateNamesList = [];
    this.activeExpId = expId;
    this.activeExpVersion = null;

    this._translatableTextBackedApiService.getTranslatableTextsAsync(
      expId, languageCode).then((response) => {
      this.stateWiseContents = response.state_names_to_content_id_mapping;
      this.activeExpVersion = response.version;
      for (const stateName in this.stateWiseContents) {
        let stateHasText = false;
        const contentIds = [];
        for (const [contentId, text] of Object.entries(
          this.stateWiseContents[stateName])) {
          if (text !== '') {
            contentIds.push(contentId);
            stateHasText = true;
          }
        }
        // If none of the state's texts are non-empty, then don't consider
        // the state for processing.
        if (stateHasText) {
          this.stateNamesList.push(stateName);
          this.stateWiseContentIds[stateName] = contentIds;
        }
      }
      if (this.stateNamesList.length > 0) {
        this.activeStateName = this.stateNamesList[0];
      }
      successCallback();
    });
  }
  getTextToTranslate(): {text: string, more: boolean} {
    return {
      text: this.getNextText(),
      more: this.isMoreTextAvailableForTranslation()
    };
  }
  suggestTranslatedText(
      translationHtml: string, languageCode: string, imagesData:ImagesData[],
      successCallback: ()=>void): void {
    this._translatableTextBackedApiService.putTranslatedTextSuggestion(
      this.activeExpId, this.activeExpVersion, this.activeContentId,
      this.activeStateName, languageCode, this.stateWiseContents,
      translationHtml, imagesData).then(successCallback);
  }
}

angular.module('oppia').factory(
  'TranslateTextService', downgradeInjectable(TranslateTextService));
