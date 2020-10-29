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
 * @fileoverview Translations backend api service.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface TranslationsDict {
  [translation: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationsBackendApiService {
  private prefix = '/assets/i18n/';
  private suffix = '.json';

  constructor(private http: HttpClient) {}

  fetchTranslations(languageCode: string): Promise<TranslationsDict> {
    return this.http.get<TranslationsDict>(
      `${this.prefix}${languageCode}${this.suffix}`).toPromise();
  }
}

angular.module('oppia').factory(
  'TranslationsBackendApiService',
  downgradeInjectable(TranslationsBackendApiService));
