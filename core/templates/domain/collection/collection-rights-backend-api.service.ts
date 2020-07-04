// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to change the rights of collections in the backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { CollectionEditorPageConstants } from
  'pages/collection-editor-page/collection-editor-page.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { CollectionRights, CollectionRightsObjectFactory } from
  'domain/collection/CollectionRightsObjectFactory';
import { ICollectionRightsBackendDict } from
  'domain/collection/CollectionRightsObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class CollectionRightsBackendApiService {
  // Maps previously loaded collection rights to their IDs.
  collectionRightsCache: Object = {};
  collectionRightsObjectFactory = new CollectionRightsObjectFactory();

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) { }

  private _fetchCollectionRights(collectionId: string,
      successCallback: (value?: CollectionRights) => void,
      errorCallback: (reason?: any) => void): void {
    let collectionRightsUrl = this.urlInterpolationService
      .interpolateUrl(
        CollectionEditorPageConstants.COLLECTION_RIGHTS_URL_TEMPLATE, {
          collection_id: collectionId
        });

    this.http.get(collectionRightsUrl, { observe: 'response' }).toPromise()
      .then((response) => {
        if (successCallback) {
          successCallback(
            this.collectionRightsObjectFactory
              .create(response.body as ICollectionRightsBackendDict)
          );
        }
      },
      (error) => {
        if (errorCallback) {
          errorCallback(error.statusText);
        }
      });
  }

  private _setCollectionStatus(collectionId: string,
      collectionVersion: number,
      isPublic: boolean,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    let collectionPublishUrl = this.urlInterpolationService
      .interpolateUrl('/collection_editor_handler/publish/<collection_id>', {
        collection_id: collectionId
      });

    let collectionUnpublishUrl = this.urlInterpolationService
      .interpolateUrl('/collection_editor_handler/unpublish/<collection_id>', {
        collection_id: collectionId
      });

    let putParams = {
      version: collectionVersion
    };

    let requestUrl = (
      isPublic ? collectionPublishUrl : collectionUnpublishUrl);

    this.http.put(requestUrl, putParams).toPromise().then((response: any) => {
      let collectionRights =
        this.collectionRightsObjectFactory.create(response);
      this.collectionRightsCache[collectionId] = collectionRights;

      if (successCallback) {
        successCallback(collectionRights);
      }
    },
    (error) => {
      if (errorCallback) {
        errorCallback(error);
      }
    });
  }

  private _isCached(collectionId: string): Boolean {
    return this.collectionRightsCache.hasOwnProperty(collectionId);
  }

  /**
   * Gets a collection's rights, given its ID.
   */
  fetchCollectionRights(collectionId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchCollectionRights(collectionId, resolve, reject);
    });
  }

  /**
   * Behaves exactly as fetchCollectionRights (including callback
   * behavior and returning a promise object), except this function will
   * attempt to see whether the given collection rights has been
   * cached. If it has not yet been cached, it will fetch the collection
   * rights from the backend. If it successfully retrieves the collection
   * rights from the backend, it will store it in the cache to avoid
   * requests from the backend in further function calls.
   */
  loadCollectionRights(collectionId: string): Promise<object> {
    return new Promise((resolve, reject) => {
      if (this._isCached(collectionId)) {
        if (resolve) {
          resolve(this.collectionRightsCache[collectionId]);
        }
      } else {
        this._fetchCollectionRights(collectionId,
          (collectionRights) => {
            // Save the fetched collection rights to avoid future fetches.
            this.collectionRightsCache[collectionId] = collectionRights;
            if (resolve) {
              resolve(this.collectionRightsCache[collectionId]);
            }
          }, reject);
      }
    });
  }

  /**
   * Returns whether the given collection rights is stored within the
   * local data cache or if it needs to be retrieved from the backend
   * upon a laod.
   */
  isCached(collectionId: string): Boolean {
    return this._isCached(collectionId);
  }

  /**
   * Replaces the current collection rights in the cache given by the
   * specified collection ID with a new collection rights object.
   */
  cacheCollectionRights(collectionId: string,
      collectionRights: CollectionRights): void {
    this.collectionRightsCache[collectionId] = collectionRights;
  }
  /**
   * Updates a collection's rights to be have public learner access, given
   * its ID and version.
   */
  setCollectionPublic(collectionId: string,
      collectionVersion: number): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._setCollectionStatus(
        collectionId, collectionVersion, true, resolve, reject);
    });
  }

  /**
   * Updates a collection's rights to be have private learner access,
   * given its ID and version.
   */
  setCollectionPrivate(collectionId: string,
      collectionVersion: number): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._setCollectionStatus(
        collectionId, collectionVersion, false, resolve, reject);
    });
  }
}

angular.module('oppia')
  .factory('CollectionRightsBackendApiService',
    downgradeInjectable(CollectionRightsBackendApiService));
