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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TranslateTextService {
  constructor(private httpClient: HttpClient) {}

    stateWiseContents = null;
    stateWiseContentIds = {};
    activeStateName = null;
    activeContentId = null;
    stateNamesList = [];
    activeExpId = null;
    activeExpVersion = null;

    getNextContentId(): string {
      return this.stateWiseContentIds[this.activeStateName].pop();
    }

    getNextState(): string {
      let currentIndex = this.stateNamesList.indexOf(this.activeStateName);
      return this.stateNamesList[currentIndex + 1];
    }

    getNextText(): any {
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

    isMoreTextAvailableForTranslation(): boolean {
      return !(
        this.stateNamesList.indexOf(this.activeStateName) + 1 ===
          this.stateNamesList.length &&
          this.stateWiseContentIds[this.activeStateName].length === 0);
    }

    init(expId: string, languageCode: string, successCallback: Function) {
      this.stateWiseContents = null;
      this.stateWiseContentIds = {};
      this.activeStateName = null;
      this.activeContentId = null;
      this.stateNamesList = [];
      this.activeExpId = expId;
      this.activeExpVersion = null;
      this.httpClient.get(
        '/gettranslatabletexthandler', {
          params: {
            exp_id: expId,
            language_code: languageCode
          }
        }).toPromise().then((response: any) => {
        this.stateWiseContents =
            response.data.state_names_to_content_id_mapping;
        this.activeExpVersion = response.data.version;
        for (let stateName in this.stateWiseContents) {
          this.stateNamesList.push(stateName);
          let contentIds = [];
          for (let contentId in this.stateWiseContents[stateName]) {
            contentIds.push(contentId);
          }
          this.stateWiseContentIds[stateName] = contentIds;
        }
        this.activeStateName = this.stateNamesList[0];
        successCallback();
      });
    }
    // TODO(#7176): Replace 'any' with the exact type.
    getTextToTranslate(): {text: any, more: boolean} {
      return {
        text: this.getNextText(),
        more: this.isMoreTextAvailableForTranslation()
      };
    }
    suggestTranslatedText(
        translationHtml: any, languageCode: string,
        successCallback: Function): void {
      let url = '/suggestionhandler/';
      let data = {
        suggestion_type: 'translate_content',
        target_type: 'exploration',
        description: 'Adds translation',
        target_id: this.activeExpId,
        target_version_at_submission: this.activeExpVersion,
        assigned_reviewer_id: null,
        final_reviewer_id: null,
        change: {
          cmd: 'add_translation',
          content_id: this.activeContentId,
          state_name: this.activeStateName,
          language_code: languageCode,
          // eslint-disable-next-line max-len
          content_html: this.stateWiseContents[this.activeStateName][this.activeContentId],
          translation_html: translationHtml
        }
      };
      this.httpClient.post(url, data).toPromise().then(successCallback());
    }
}
angular.module('oppia').factory(
  'TranslateTextService',
  downgradeInjectable(TranslateTextService));
