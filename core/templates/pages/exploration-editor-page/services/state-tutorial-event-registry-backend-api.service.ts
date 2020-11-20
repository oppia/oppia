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
 * @fileoverview A backend API service to register tutorial events.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ServicesConstants } from 'services/services.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class StateTutorialEventRegistryBackendApiService {

  constructor(
      private http: HttpClient,
      private urlInterpolationService: UrlInterpolationService) {}

  recordEditorTutorialStartEvent(expId: string): Promise<void> {
    const url = this.urlInterpolationService.interpolateUrl(
      ServicesConstants.STARTED_EDITOR_TUTORIAL_EVENT_URL, {
        exp_id: expId
      });       
    return this.http.post<void>(url, {}).toPromise();
  }

  recordTranslationsTutorialStartEvent(expId: string): Promise<void> {
    const url = this.urlInterpolationService.interpolateUrl(
      ServicesConstants.STARTED_TRANSLATION_TUTORIAL_EVENT_URL, {
        exp_id: expId
      });       
    return this.http.post<void>(url, {}).toPromise();
  }  
}

angular.module('oppia').factory(
  'StateTutorialEventRegistryBackendApiService',
  downgradeInjectable(StateTutorialEventRegistryBackendApiService));
