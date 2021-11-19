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
import { ImagesData } from 'services/image-local-storage.service';

import { TranslateTextBackendApiService } from './translate-text-backend-api.service';
import { StateNamesToContentIdMapping, TranslatableTexts } from 'domain/opportunity/translatable-texts.model';
import {
  TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING,
  TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING
} from 'domain/exploration/WrittenTranslationObjectFactory';

export interface TranslatableItem {
  translation: string | string[],
  status: Status,
  more: boolean
  dataFormat: string,
  contentType: string,
  text: string | string[] | null,
  // The following two properties are set to null
  // when interaction and ruletype is not selected.
  interactionId: string | null,
  ruleType: string | null
}

export type Status = 'pending' | 'submitted';

export class StateAndContent {
  constructor(
    public stateName: string,
    public contentID: string,
    public contentText: string | string[],
    public status: Status,
    public translation: string | string[],
    public dataFormat: string,
    public contentType: string,
    // The following two properties are set to null
    // when interaction and ruletype is not selected.
    public interactionId: string | null,
    public ruleType: string | null
  ) {}
}

@Injectable({
  providedIn: 'root'
})
export class TranslateTextService {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  activeExpId!: string;
  activeExpVersion!: number;
  activeContentId!: string;
  activeStateName!: string;
  activeContentText!: string | string[];
  activeContentStatus!: Status;
  STARTING_INDEX = -1;
  PENDING: Status = 'pending';
  SUBMITTED: Status = 'submitted';
  stateWiseContents: StateNamesToContentIdMapping = {};
  stateWiseContentIds: Record<string, string[]> = {};
  stateNamesList: string[] = [];
  stateAndContent: StateAndContent[] = [];
  activeIndex = this.STARTING_INDEX;


  constructor(
    private translateTextBackedApiService:
      TranslateTextBackendApiService
  ) { }

  private _getNextText(): string | string[] | null {
    if (this.stateAndContent.length === 0) {
      return null;
    }
    this.activeIndex += 1;
    this.activeStateName = this.stateAndContent[this.activeIndex].stateName;
    this.activeContentId = this.stateAndContent[this.activeIndex].contentID;
    this.activeContentText = (
      this.stateAndContent[this.activeIndex].contentText);
    return this.activeContentText;
  }

  private _getPreviousText(): string | string[] | null {
    if (this.stateAndContent.length === 0 || this.activeIndex <= 0) {
      return null;
    }
    this.activeIndex -= 1;
    this.activeStateName = this.stateAndContent[this.activeIndex].stateName;
    this.activeContentId = this.stateAndContent[this.activeIndex].contentID;
    this.activeContentText = this.stateAndContent[this.activeIndex].contentText;
    return this.activeContentText;
  }

  private _isPreviousTextAvailableForTranslation(): boolean {
    return this.activeIndex > 0;
  }

  private _isMoreTextAvailableForTranslation(): boolean {
    if (this.stateAndContent.length === 0) {
      return false;
    }
    return (this.activeIndex + 1 < this.stateAndContent.length);
  }

  private _isSetDataFormat(dataFormat: string): boolean {
    return (
      dataFormat === TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING ||
      dataFormat === TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING
    );
  }

  // The following property is set to null
  // when there is no text to translate.
  private _getUpdatedTextToTranslate(
      text: string | string[] | null,
      more: boolean,
      status: Status,
      translation: string | string[]
  ): TranslatableItem {
    const {
      dataFormat,
      contentType,
      interactionId,
      ruleType
    }: {
      dataFormat: string,
      contentType: string,
      // The following two properties are set to null
      // when interaction and ruletype is not selected.
      interactionId: string | null,
      ruleType: string | null
    } = this.stateAndContent[this.activeIndex];
    return {
      text: text,
      more: more,
      status: status,
      translation: this._isSetDataFormat(dataFormat) ? [] : translation,
      dataFormat: dataFormat,
      contentType: contentType,
      interactionId: interactionId,
      ruleType: ruleType
    };
  }

  init(expId: string, languageCode: string, successCallback: () => void): void {
    this.stateWiseContentIds = {};
    this.stateNamesList = [];
    this.stateAndContent = [];
    this.activeIndex = this.STARTING_INDEX;
    this.activeContentStatus = this.PENDING;
    this.activeExpId = expId;
    this.translateTextBackedApiService.getTranslatableTextsAsync(
      expId, languageCode).then((translatableTexts: TranslatableTexts) => {
      this.stateWiseContents = translatableTexts.stateWiseContents;
      this.activeExpVersion = translatableTexts.explorationVersion;
      for (const stateName in this.stateWiseContents) {
        let stateHasText: boolean = false;
        const contentIds = [];
        const contentIdToContentMapping = this.stateWiseContents[stateName];
        for (const contentId in contentIdToContentMapping) {
          const translatableItem = contentIdToContentMapping[contentId];
          if (translatableItem.content === '') {
            continue;
          }
          contentIds.push(contentId);
          this.stateAndContent.push(
            new StateAndContent(
              stateName, contentId,
              translatableItem.content,
              this.PENDING,
              this._isSetDataFormat(translatableItem.dataFormat) ? [] : '',
              translatableItem.dataFormat,
              translatableItem.contentType,
              translatableItem.interactionId,
              translatableItem.ruleType
            )
          );
          stateHasText = true;
        }

        if (stateHasText) {
          this.stateNamesList.push(stateName);
          this.stateWiseContentIds[stateName] = contentIds;
        }
      }
      successCallback();
    });
  }

  getActiveIndex(): number {
    return this.activeIndex;
  }

  getTextToTranslate(): TranslatableItem {
    const text = this._getNextText();
    const {
      status = this.PENDING,
      translation = ''
    } = { ...this.stateAndContent[this.activeIndex] };
    return this._getUpdatedTextToTranslate(
      text, this._isMoreTextAvailableForTranslation(), status, translation);
  }

  getPreviousTextToTranslate(): TranslatableItem {
    const text = this._getPreviousText();
    const {
      status = this.PENDING,
      translation = ''
    } = { ...this.stateAndContent[this.activeIndex] };
    return this._getUpdatedTextToTranslate(
      text, this._isPreviousTextAvailableForTranslation(), status, translation);
  }

  suggestTranslatedText(
      translation: string | string[], languageCode: string, imagesData:
      ImagesData[], dataFormat: string, successCallback: () => void,
      errorCallback: () => void): void {
    this.translateTextBackedApiService.suggestTranslatedTextAsync(
      this.activeExpId,
      this.activeExpVersion,
      this.activeContentId,
      this.activeStateName,
      languageCode,
      this.stateWiseContents[
        this.activeStateName][this.activeContentId].content,
      translation,
      imagesData,
      dataFormat
    ).then(() => {
      this.stateAndContent[this.activeIndex].status = this.SUBMITTED;
      this.stateAndContent[this.activeIndex].translation = (
        translation);
      successCallback();
    }, errorCallback);
  }
}

angular.module('oppia').factory(
  'TranslateTextService', downgradeInjectable(TranslateTextService)
);
