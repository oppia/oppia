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

export interface ReadOnlyExplorationBackendDict {
  'init_state_name': string;
  'param_changes': ParamChangeBackendDict[];
  'param_specs': ParamSpecsBackendDict;
  'states': StateObjectsBackendDict;
  'title': string;
  'language_code': string;
  'objective': string;
  'correctness_feedback_enabled': boolean;
}

export interface FetchExplorationBackendResponse {
  'can_edit': boolean;
  'exploration': ReadOnlyExplorationBackendDict;
  'exploration_id': string;
  'is_logged_in': boolean;
  'session_id': string;
  'version': number;
  'preferred_audio_language_code': string;
  'preferred_language_codes': string[];
  'auto_tts_enabled': boolean;
  'correctness_feedback_enabled': boolean;
  'record_playthrough_probability': number;
}

@Injectable({
  providedIn: 'root'
})
export class ReadOnlyExplorationBackendApiService {
  private _explorationCache:
    Record<string, FetchExplorationBackendResponse> = {};

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  private _fetchExploration(
      explorationId: string, version: number | null
  ): Promise<FetchExplorationBackendResponse> {
    return new Promise((resolve, reject) => {
      const explorationDataUrl = this._getExplorationUrl(
        explorationId, version);

      this.http.get<FetchExplorationBackendResponse>(
        explorationDataUrl).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  private _isCached(explorationId: string): boolean {
    return this._explorationCache.hasOwnProperty(explorationId);
  }

  private _getExplorationUrl(explorationId: string, version: number): string {
    if (version) {
      return this.urlInterpolationService.interpolateUrl(
        AppConstants.EXPLORATION_VERSION_DATA_URL_TEMPLATE, {
          exploration_id: explorationId,
          version: String(version)
        });
    }

    return this.urlInterpolationService.interpolateUrl(
      AppConstants.EXPLORATION_DATA_URL_TEMPLATE, {
        exploration_id: explorationId
      }
    );
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
  fetchExploration(explorationId: string, version: number):
    Promise<FetchExplorationBackendResponse> {
    return this._fetchExploration(explorationId, version);
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
  loadLatestExploration(explorationId: string):
    Promise<FetchExplorationBackendResponse> {
    return new Promise((resolve, reject) => {
      if (this._isCached(explorationId)) {
        if (resolve) {
          resolve(this._explorationCache[explorationId]);
        }
      } else {
        this._fetchExploration(explorationId, null).then(exploration => {
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
  loadExploration(explorationId: string, version: number):
    Promise<FetchExplorationBackendResponse> {
    return new Promise((resolve, reject) => {
      this._fetchExploration(explorationId, version).then(exploration => {
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
