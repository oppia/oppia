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
 * @fileoverview Service to revert/change admin-misc-tab properties
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminPageConstants } from 'pages/admin-page/admin-page.constants';

 @Injectable({
   providedIn: 'root'
 })
export class AdminMiscTabBackendApiService {
  constructor(private http: HttpClient) {}

  private _flushCache ():Promise<void> {
    return this.http.post<void>(
        AdminPageConstants.MEMORY_CACHE_HANDLER_URL,{}
    ).toPromise();
  }

  private _clearSearchIndex ():Promise<void> {
    return this.http.post<void>(
        AdminPageConstants.ADMIN_HANDLER_URL,{}
    ).toPromise();
  }

  private  _regenerateTopicRelatedOpportunities(topicId:string):Promise<void> {
    return this.http.post<void>(
        AdminPageConstants.ADMIN_HANDLER_URL, {
            action: 'regenerate_topic_related_opportunities',
            topic_id: topicId
          }
    ).toPromise();
  }

  flushCache(): Promise<void> {
    return this._flushCache();
  }

  clearSearchIndex():Promise<void> {
    return this._clearSearchIndex();
  }

  regenerateTopicRelatedOpportunities(topicId:string){
    return this._regenerateTopicRelatedOpportunities(topicId);
  }

}

angular.module('oppia').factory(
  'AdminMiscTabBackendApiService', downgradeInjectable(
    AdminMiscTabBackendApiService));
