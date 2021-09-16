// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Backend Api Service for the Collection Player Page
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CollectionHandler, CollectionSummary } from '../collection-player-page.component';

@Injectable({
  providedIn: 'root'
})
export class CollectionPlayerBackendApiService {
  constructor(
    private http: HttpClient,
  ) {}

  async fetchCollectionSummariesAsync(
      collectionId: string
  ): Promise<void | CollectionSummary> {
    return this.http.get('/collectionsummarieshandler/data', {
      params: {
        stringified_collection_ids: JSON.stringify([collectionId])
      }
    }).toPromise().then((response: CollectionSummary) => {
      return response;
    });
  }

  bindAttr(collectionId: string): void {
    this.http.get(
      '/collection_handler/data/' + collectionId).toPromise().then(
      (response: CollectionHandler) => {
        angular.element('meta[itemprop="name"]').attr(
          'content', response.meta_name);
        angular.element('meta[itemprop="description"]').attr(
          'content', response.meta_description);
        angular.element('meta[property="og:title"]').attr(
          'content', response.meta_name);
        angular.element('meta[property="og:description"]').attr(
          'content', response.meta_description);
      }
    );
  }
}

angular.module('oppia').factory(
  'CollectionPlayerBackendApiService',
  downgradeInjectable(CollectionPlayerBackendApiService));
