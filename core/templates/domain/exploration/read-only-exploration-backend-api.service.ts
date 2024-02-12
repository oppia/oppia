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
 * @fileoverview Service to retrieve read only information
 * about explorations from the backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AppConstants } from 'app.constants';
import { ParamChangeBackendDict } from 'domain/exploration/ParamChangeObjectFactory';
import { ParamSpecsBackendDict } from 'domain/exploration/ParamSpecsObjectFactory';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ExplorationMetadataBackendDict } from './ExplorationMetadataObjectFactory';
import { VersionedExplorationCachingService } from 'pages/exploration-editor-page/services/versioned-exploration-caching.service';
import { UrlService } from 'services/contextual/url.service';

export interface ReadOnlyExplorationBackendDict {
  'init_state_name': string;
  'param_changes': ParamChangeBackendDict[];
  'param_specs': ParamSpecsBackendDict;
  'states': StateObjectsBackendDict;
  'title': string;
  'language_code': string;
  'objective': string;
  'next_content_id_index': number;
}

export interface FetchExplorationBackendResponse {
  'can_edit': boolean;
  'exploration': ReadOnlyExplorationBackendDict;
  'exploration_metadata': ExplorationMetadataBackendDict;
  'exploration_id': string;
  'is_logged_in': boolean;
  'session_id': string;
  'version': number;
  'preferred_audio_language_code': string;
  'preferred_language_codes': string[];
  'auto_tts_enabled': boolean;
  'record_playthrough_probability': number;
  'draft_change_list_id': number;
  'has_viewed_lesson_info_modal_once': boolean;
  'furthest_reached_checkpoint_exp_version': number;
  'furthest_reached_checkpoint_state_name': string;
  'most_recently_reached_checkpoint_state_name': string;
  'most_recently_reached_checkpoint_exp_version': number;
  'displayable_language_codes': string[];
}

@Injectable({
  providedIn: 'root'
})
export class ReadOnlyExplorationBackendApiService {
  private _explorationCache:
    Record<string, FetchExplorationBackendResponse> = {};

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService,
    private versionedExplorationCachingService:
      VersionedExplorationCachingService,
    private urlService: UrlService
  ) {}

  private async _fetchExplorationAsync(
      explorationId: string,
      version: number | null,
      uniqueProgressUrlId: string | null = null
  ): Promise<FetchExplorationBackendResponse> {
    return new Promise((resolve, reject) => {
      const explorationDataUrl = this._getExplorationUrl(
        explorationId, version, uniqueProgressUrlId);

      // If version is not null, then check whether the exploration data for
      // the given version is already cached. If so, then resolve the Promise
      // with the cached exploration data.
      if (
        version && this.versionedExplorationCachingService.isCached(
          explorationId, version
        )) {
        resolve(
          this.versionedExplorationCachingService
            .retrieveCachedVersionedExplorationData(explorationId, version));
      } else {
        this.http.get<FetchExplorationBackendResponse>(
          explorationDataUrl).toPromise().then(response => {
          // If version is not null, then cache the fetched
          // exploration data (response) for the given version.
          if (version) {
            this.versionedExplorationCachingService
              .cacheVersionedExplorationData(explorationId, version, response);
          }
          resolve(response);
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
      }
    });
  }

  private _isCached(explorationId: string): boolean {
    return this._explorationCache.hasOwnProperty(explorationId);
  }

  private _getExplorationUrl(
      explorationId: string,
      version: number | null,
      uniqueProgressUrlId: string | null = null): string {
    if (version) {
      return this.urlInterpolationService.interpolateUrl(
        AppConstants.EXPLORATION_VERSION_DATA_URL_TEMPLATE, {
          exploration_id: explorationId,
          version: String(version)
        });
    } else if (uniqueProgressUrlId) {
      return this.urlInterpolationService.interpolateUrl(
        AppConstants.EXPLORATION_PROGRESS_PID_URL_TEMPLATE, {
          exploration_id: explorationId,
          pid: uniqueProgressUrlId
        });
    }
    return this.urlInterpolationService.interpolateUrl(
      AppConstants.EXPLORATION_DATA_URL_TEMPLATE, {
        exploration_id: explorationId
      });
  }

  /**
   * Retrieves an exploration from the backend given an exploration ID
   * and version number (or none). This returns a promise object that
   * allows success and rejection callbacks to be registered. If the
   * exploration is successfully loaded and a success callback function
   * is provided to the promise object, the success callback is called
   * with the exploration passed in as a parameter. If something goes
   * wrong while trying to fetch the exploration, the rejection callback
   * is called instead, if present. The rejection callback function is
   * passed any data returned by the backend in the case of an error.
   */
  async fetchExplorationAsync(
      explorationId: string,
      version: number | null,
      uniqueProgressUrlId: string | null = null):
     Promise<FetchExplorationBackendResponse> {
    return this._fetchExplorationAsync(
      explorationId, version, uniqueProgressUrlId);
  }

  /**
   * Behaves in the exact same way as fetchExploration (including
   * callback behavior and returning a promise object),
   * except this function will attempt to see whether the latest version
   * of the given exploration has already been loaded. If it has not yet
   * been loaded, it will fetch the exploration from the backend. If it
   * successfully retrieves the exploration from the backend, this method
   * will store the exploration in the cache to avoid requests from the
   * backend in further function calls.
   */
  async loadLatestExplorationAsync(
      explorationId: string, uniqueProgressUrlId: string | null = null):
    Promise<FetchExplorationBackendResponse> {
    return new Promise((resolve, reject) => {
      if (this._isCached(explorationId)) {
        if (resolve) {
          resolve(this._explorationCache[explorationId]);
        }
      } else {
        this._fetchExplorationAsync(
          explorationId, null, uniqueProgressUrlId)
          .then(exploration => {
          // Save the fetched exploration to avoid future fetches.
            this._explorationCache[explorationId] = exploration;
            if (resolve) {
              resolve(exploration);
            }
          }, reject);
      }
    });
  }

  /**
   * Retrieves an exploration from the backend given an exploration ID
   * and version number. This method does not interact with any cache
   * and using this method will not overwrite or touch the state of the
   * cache. All previous data in the cache will still be retained after
   * this call.
   */
  async loadExplorationAsync(explorationId: string, version: number):
    Promise<FetchExplorationBackendResponse> {
    return new Promise((resolve, reject) => {
      this._fetchExplorationAsync(explorationId, version).then(exploration => {
        resolve(exploration);
      }, reject);
    });
  }

  /**
   * Returns whether the given exploration is stored within the local
   * data cache or if it needs to be retrieved from the backend upon a
   * load.
   */
  isCached(explorationId: string): boolean {
    return this._isCached(explorationId);
  }

  /**
   * Replaces the current exploration in the cache given by the specified
   * exploration ID with a new exploration object.
   */
  cacheExploration(
      explorationId: string,
      exploration: FetchExplorationBackendResponse): void {
    this._explorationCache[explorationId] = exploration;
  }

  /**
   * Clears the local exploration data cache, forcing all future loads to
   * re-request the previously loaded explorations from the backend.
   */
  clearExplorationCache(): void {
    this._explorationCache = {};
  }

  /**
   * Deletes a specific exploration from the local cache
   */
  deleteExplorationFromCache(explorationId: string): void {
    if (this._isCached(explorationId)) {
      delete this._explorationCache[explorationId];
    }
  }
}

angular.module('oppia').factory(
  'ReadOnlyExplorationBackendApiService',
  downgradeInjectable(ReadOnlyExplorationBackendApiService));
