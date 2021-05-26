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
 * @fileoverview Service to update site language.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SiteLanguageBackendApiService {
  private _siteLanguageUrl: string = '/save_site_language';

  constructor(
      private httpClient: HttpClient
  ) {}

  async submitSiteLanguageAsync(currentLanguageCode: string): Promise<Object> {
    return this.httpClient.put(this._siteLanguageUrl, {
      site_language_code: currentLanguageCode
    }).toPromise();
  }
}
