// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to cache fetched versioned exploration data.
 * This service makes the version comparison in the history tab more efficient
 * as due to caching, there will be less backend calls to fetch the specific
 * exploration versions.
 */

import {Injectable} from '@angular/core';
import {FetchExplorationBackendResponse} from 'domain/exploration/read-only-exploration-backend-api.service';

export interface VersionedExplorationData {
  [explorationId: string]: {
    [version: number]: FetchExplorationBackendResponse;
  };
}

@Injectable({
  providedIn: 'root',
})
export class VersionedExplorationCachingService {
  _versionedExplorationDataCache: VersionedExplorationData = {};

  constructor() {}

  /**
   * Checks whether the exploration data for the given version and id is
   * already cached.
   */
  isCached(explorationId: string, version: number): boolean {
    return (
      this._versionedExplorationDataCache.hasOwnProperty(explorationId) &&
      this._versionedExplorationDataCache[explorationId].hasOwnProperty(version)
    );
  }

  /**
   * Retrieves the cached exploration data for the given id and version.
   */
  retrieveCachedVersionedExplorationData(
    explorationId: string,
    version: number
  ): FetchExplorationBackendResponse {
    return this._versionedExplorationDataCache[explorationId][version];
  }

  /**
   * Adds the fetched exploration data into the cache for the given id and
   * version.
   */
  cacheVersionedExplorationData(
    explorationId: string,
    version: number,
    explorationData: FetchExplorationBackendResponse
  ): void {
    if (this._versionedExplorationDataCache.hasOwnProperty(explorationId)) {
      this._versionedExplorationDataCache[explorationId][version] =
        explorationData;
    } else {
      this._versionedExplorationDataCache[explorationId] = {
        [version]: explorationData,
      };
    }
  }

  /**
   * Removes the cached exploration data for the given id and version.
   */
  removeCachedVersionedExplorationData(
    explorationId: string,
    version: number
  ): void {
    if (this.isCached(explorationId, version)) {
      delete this._versionedExplorationDataCache[explorationId][version];
    }
  }

  /**
   * Clears all data from the cache.
   */
  clearCache(): void {
    this._versionedExplorationDataCache = {};
  }
}
