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
  status: Status | string,
  text: string | string[] | undefined,
  more: boolean
  dataFormat: string,
  contentType: string,
  interactionId: string,
  ruleType: string,
  stateName: string,
  contentID: string,
  contentText: string | string[],
  activeContentText: string,
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
    public interactionId: string | null,
    public ruleType: string | null
  ) {}
}

@Injectable({
  providedIn: 'root'
})
export class TranslateTextService {
  STARTING_INDEX = -1;
  PENDING = 'pending';
  SUBMITTED = 'submitted';
  stateWiseContents: StateNamesToContentIdMapping = {};
  stateWiseContentIds: Record<string, string[]> = {};
  stateNamesList!: string[];
  stateAndContent: StateAndContent[]=[];
  activeIndex = this.STARTING_INDEX;
  activeExpId!: string;
  activeExpVersion!: string;
  activeContentId!: string;
  activeStateName!: string;
  activeContentText?: string | string[];
  activeContentStatus?: Status;

  constructor(
    private translateTextBackedApiService:
      TranslateTextBackendApiService
  ) { }

  private _getNextText(): string | string[] | undefined {
    if (this.stateAndContent.length === 0) {
      return undefined;
    }
    this.activeIndex += 1;
    this.activeStateName = this.stateAndContent[this.activeIndex].stateName;
    this.activeContentId = this.stateAndContent[this.activeIndex].contentID;
    this.activeContentText = (
      this.stateAndContent[this.activeIndex].contentText);
    return this.activeContentText;
  }

  private _getPreviousText(): string | string[] | undefined {
    if (this.stateAndContent.length === 0 || this.activeIndex <= 0) {
      return undefined;
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

  private _getUpdatedTextToTranslate(
      text: string | string[] | undefined,
      more: boolean,
      status: Status | string,
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
    }as TranslatableItem;
  }

  init(expId: string, languageCode: string, successCallback: () => void): void {
    this.stateWiseContentIds = {};
    this.stateNamesList = [];
    this.stateAndContent = [];
    this.activeIndex = this.STARTING_INDEX;
    this.activeContentId;
    this.activeStateName;
    this.activeContentText;
    this.activeContentStatus = this.PENDING as Status;
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
              this.PENDING as Status,
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
    const {
      status = this.PENDING,
      translation = ''
    } = { ...this.stateAndContent[this.activeIndex] };
    const text = this._getNextText();
    return this._getUpdatedTextToTranslate(
      text, this._isMoreTextAvailableForTranslation(), status, translation);
  }

  getPreviousTextToTranslate(): TranslatableItem {
    const {
      status = this.PENDING,
      translation = ''
    } = { ...this.stateAndContent[this.activeIndex] };
    const text = this._getPreviousText();
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
      this.stateAndContent[this.activeIndex].status = this.SUBMITTED as Status;
      this.stateAndContent[this.activeIndex].translation = (
        translation);
      successCallback();
    }, errorCallback);
  }
}

angular.module('oppia').factory(
  'TranslateTextService', downgradeInjectable(TranslateTextService));
