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
import { TranslatableTexts } from 'domain/opportunity/translatable-texts.model';

/**
 * @fileoverview A service for handling contribution opportunities in different
 * fields.
 */

interface TranslatableObject {
  translation: string,
  status: Status,
  text: string,
  more: boolean
  dataFormat: string
}

export type Status = 'pending' | 'submitted';

export class StateAndContent {
  constructor(
    private _stateName: string,
    private _contentID: string,
    private _contentText: string,
    private _status: Status,
    private _translation: string,
    private _dataFormat: string
  ) { }

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

  get status(): Status {
    return this._status;
  }

  set status(newStatus: Status) {
    this._status = newStatus;
  }

  get translation(): string {
    return this._translation;
  }

  set translation(newTranslation: string) {
    this._translation = newTranslation;
  }

  get dataFormat(): string {
    return this._dataFormat;
  }
}


@Injectable({
  providedIn: 'root'
})
export class TranslateTextService {
  STARTING_INDEX = -1;
  PENDING = 'pending';
  SUBMITTED = 'submitted';
  stateWiseContents = {};
  stateWiseContentIds = {};
  stateNamesList = [];
  stateAndContent = [];
  activeIndex = this.STARTING_INDEX;
  activeExpId;
  activeExpVersion;
  activeContentId;
  activeStateName: string;
  activeContentText: string;
  activeContentStatus: Status;

  constructor(
    private translateTextBackedApiService:
      TranslateTextBackendApiService
  ) {}

  private _getNextText(): string {
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

  private _getPreviousText(): string {
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

  private _isMoreTextAvailabelForTranslation(): boolean {
    if (this.stateAndContent.length === 0) {
      return false;
    }
    return (this.activeIndex + 1 < this.stateAndContent.length);
  }

  init(expId: string, languageCode: string, successCallback: () => void): void {
    this.stateWiseContentIds = {};
    this.stateNamesList = [];
    this.stateAndContent = [];
    this.activeIndex = this.STARTING_INDEX;
    this.activeContentId = null;
    this.activeStateName = null;
    this.activeContentText = null;
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
          let translatableItem = contentIdToContentMapping[contentId];
          if (translatableItem.content !== '') {
            contentIds.push(contentId);

            this.stateAndContent.push(
              new StateAndContent(
                stateName, contentId,
                translatableItem.content,
                this.PENDING as Status, '',
                translatableItem.dataFormat
              )
            );
            stateHasText = true;
          }
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

  getTextToTranslate(): TranslatableObject {
    let {
      status = this.PENDING,
      translation = ''
    } = { ...this.stateAndContent[this.activeIndex] };
    return {
      text: this._getNextText(),
      more: this._isMoreTextAvailabelForTranslation(),
      status: status,
      translation: translation,
      dataFormat: (
        this.stateAndContent[this.activeIndex] &&
        this.stateAndContent[this.activeIndex].dataFormat)
    };
  }

  getPreviousTextToTranslate(): TranslatableObject {
    let {
      status = this.PENDING,
      translation = ''
    } = { ...this.stateAndContent[this.activeIndex] };
    return {
      text: this._getPreviousText(),
      more: this._isPreviousTextAvailableForTranslation(),
      status: status,
      translation: translation,
      dataFormat: (
        this.stateAndContent[this.activeIndex] &&
        this.stateAndContent[this.activeIndex].dataFormat)
    };
  }

  suggestTranslatedText(
      translation: string, languageCode: string, imagesData:
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
  'TranslateTextService', downgradeInjectable(TranslateTextService));
