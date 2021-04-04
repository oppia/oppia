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
 * @fileoverview A service for getting the completed translations from backend
 *
 */
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface ITranslationsAndContentDict {
  'content_list': string[],
  'translations_list': string[]
}

@Injectable({
  providedIn: 'root'
})

export class TranslatedTextBackendApiService {
  constructor(
    private http: HttpClient
  ) {}
  recievedTranslationsList = [];
  recievedContentList = [];
  getTranslationsAndContent(
      expId: string, languageCode: string): Promise<any> {
    return this.http.get<ITranslationsAndContentDict>(
      '/getcompletedtranslationshandler', {
        params: {
          exp_id: expId,
          language_code: languageCode
        },
        observe: 'response'
      }).toPromise().then((response) => {
      this.recievedTranslationsList = response.body.translations_list;
      this.recievedContentList = response.body.content_list;
      return {
        translations_list: this.recievedTranslationsList,
        content_list: this.recievedContentList
      };
    }, (errorResponse) => {
      throw new Error(errorResponse.error.error);
    });
  }
  getTranslationsAndContentLists(): <any> {
    return {
      translationsList : this.recievedTranslationsList,
      contentList : this.recievedContentList
    }
  }
}
angular.module('oppia').factory('TranslatedTextBackendApiService', 
  downgradeInjectable(TranslatedTextBackendApiService));   

  