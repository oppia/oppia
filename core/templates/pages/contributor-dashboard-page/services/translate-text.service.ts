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
 * @fileoverview A service for handling contribution opportunities in different
 * fields.
 */

<<<<<<< HEAD
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { ImagesData } from 'services/image-local-storage.service';

import { TranslateTextBackendApiService } from './translate-text-backend-api.service';
import { StateNamesToContentIdMapping, TranslatableTexts } from 'domain/opportunity/translatable-texts.model';

@Injectable({
  providedIn: 'root'
})
export class TranslateTextService {
  constructor(
    private translatableTextBackedApiService:
    TranslateTextBackendApiService) {}

  stateWiseContents: StateNamesToContentIdMapping = null;
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
    this.translatableTextBackedApiService.getTranslatableTextsAsync(
      expId, languageCode).then((translatableTexts: TranslatableTexts) => {
      this.stateWiseContents = translatableTexts.getStateWiseContents();
      this.activeExpVersion = translatableTexts.getExplorationVersion();
      for (const stateName in this.stateWiseContents) {
        let stateHasText = false;
        const contentIds = [];
        for (const [contentId, text] of Object.entries(
          this.stateWiseContents[stateName])) {
          if (text !== '') {
            contentIds.push(contentId);
            stateHasText = true;
          }
=======
export class StateAndContent {
  constructor(
    private _stateName: string,
    private _contentID: string,
    private _contentText: string) {}

  get stateName(): string {
    return this._stateName;
  }

  set stateName(newStateName: string) {
    this._stateName = newStateName;
  }

  get contentID(): string {
    return this._contentID;
  }

  set contentID(newContentID: string) {
    this._contentID = newContentID;
  }

  get contentText(): string {
    return this._contentText;
  }

  set contentText(newContentText: string) {
    this._contentText = newContentText;
  }
}

angular.module('oppia').factory('TranslateTextService', [
  '$http', function($http) {
    const STARTING_INDEX = -1;
    var stateWiseContents = null;
    var stateWiseContentIds = {};
    var stateAndContent = [];
    var stateNamesList = [];
    var activeExpId = null;
    var activeExpVersion = null;
    var activeIndex = STARTING_INDEX;
    var activeStateName = null;
    var activeContentId = null;
    var activeContentText = null;

    const getNextText = function() {
      if (stateAndContent.length === 0) {
        return null;
      }
      activeIndex += 1;
      activeStateName = stateAndContent[activeIndex].stateName;
      activeContentId = stateAndContent[activeIndex].contentID;
      activeContentText =
       stateAndContent[activeIndex].contentText;
      return activeContentText;
    };

    const getPreviousText = function() {
      if (stateAndContent.length === 0 || activeIndex <= 0) {
        return null;
      }
      activeIndex -= 1;
      activeStateName = stateAndContent[activeIndex].stateName;
      activeContentId = stateAndContent[activeIndex].contentID;
      activeContentText =
        stateAndContent[activeIndex].contentText;
      return activeContentText;
    };

    const isPreviousTextAvailableForTranslation = function() {
      return activeIndex > 0;
    };

    const isMoreTextAvailableForTranslation = function() {
      if (stateAndContent.length === 0) {
        return false;
      }
      return (activeIndex + 1 < stateAndContent.length);
    };

    return {
      init: function(expId, languageCode, successCallback) {
        stateWiseContents = null;
        stateWiseContentIds = {};
        stateNamesList = [];
        stateAndContent = [];
        activeIndex = STARTING_INDEX;

        activeExpId = expId;
        activeExpVersion = null;

        $http.get('/gettranslatabletexthandler', {
          params: {
            exp_id: expId,
            language_code: languageCode
          }
        }).then(function(response) {
          stateWiseContents = response.data.state_names_to_content_id_mapping;
          activeExpVersion = response.data.version;
          for (const stateName in stateWiseContents) {
            let stateHasText = false;
            const contentIds = [];
            for (const [contentId, text] of Object.entries(
              stateWiseContents[stateName])) {
              if (text !== '') {
                contentIds.push(contentId);
                // Text needs to be cast as string or else it is recognized
                // as unknown.
                stateAndContent.push(
                  new StateAndContent(
                    stateName, contentId, text as string));
                stateHasText = true;
              }
            }
            // If none of the state's texts are non-empty, then don't consider
            // the state for processing.
            if (stateHasText) {
              stateNamesList.push(stateName);
              stateWiseContentIds[stateName] = contentIds;
            }
          }
          successCallback();
        });
      },
      getTextToTranslate: function() {
        return {
          text: getNextText(),
          more: isMoreTextAvailableForTranslation()
        };
      },
      getPreviousTextToTranslate: function() {
        return {
          text: getPreviousText(),
          more: isPreviousTextAvailableForTranslation()
        };
      },
      suggestTranslatedText: function(
          translationHtml, languageCode, imagesData,
          successCallback, errorCallback) {
        const url = '/suggestionhandler/';
        const postData = {
          suggestion_type: 'translate_content',
          target_type: 'exploration',
          description: 'Adds translation',
          target_id: activeExpId,
          target_version_at_submission: activeExpVersion,
          change: {
            cmd: 'add_translation',
            content_id: activeContentId,
            state_name: activeStateName,
            language_code: languageCode,
            content_html: activeContentText,
            translation_html: translationHtml
          }
        };
        let body = new FormData();
        body.append('payload', JSON.stringify(postData));
        let filenames = imagesData.map(obj => obj.filename);
        let imageBlobs = imagesData.map(obj => obj.imageBlob);
        for (let idx in imageBlobs) {
          body.append(filenames[idx], imageBlobs[idx]);
>>>>>>> upstream/develop
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
    this.translatableTextBackedApiService.suggestTranslatedTextAsync(
      this.activeExpId,
      this.activeExpVersion,
      this.activeContentId,
      this.activeStateName,
      languageCode,
      this.stateWiseContents[this.activeStateName][this.activeContentId],
      translationHtml,
      imagesData).then(successCallback);
  }
}

angular.module('oppia').factory(
  'TranslateTextService', downgradeInjectable(TranslateTextService));
