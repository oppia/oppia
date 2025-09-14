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
 * @fileoverview A service for retriving feature flags - boolean parameters
 * that are used to determine if features should be enabled.
 *
 * Once the initialization is done, the value of each feature flag is guaranteed
 * to be constant within the page.
 * The values are also cached in SessionStorage, so that even after page
 * refreshing, the values stay the same, unless:
 *   - the cache TTL of 12 hours has been reached, or
 *   - the current account is different than the account in use when the values
 *     are loaded, i.e. a different session id is present in the cookies.
 *   - there are new features defined in the code base while the cached
 *     summary is out-of-date.
 *   - the current account signed out and then signed back in, because session
 *     cookies are not consistent between separate login sessions.
 * In such cases, the values will be re-initialized and they may be changed.
 *
 * The values in SessionStorage is not shared between tabs, we don't want
 * sudden updates in the same tab but it's okay to always load the latest
 * values in a new tab.
 */

import {Injectable} from '@angular/core';

import {
  FeatureStatusChecker,
  FeatureStatusSummary,
} from 'domain/feature-flag/feature-status-summary.model';
import {FeatureFlagBackendApiService} from 'domain/feature-flag/feature-flag-backend-api.service';
import {LoggerService} from 'services/contextual/logger.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root',
})
export class PlatformFeatureService {
  private static SESSION_STORAGE_KEY = 'SAVED_FEATURE_FLAGS';

  // The following attributes are made static to avoid potential inconsistencies
  // caused by multi-instantiation of the service.
  static featureStatusSummary: FeatureStatusSummary;
  static initializationPromise: Promise<void>;
  static _isInitializedWithError = false;
  static _isSkipped = false;

  constructor(
    private featureFlagBackendApiService: FeatureFlagBackendApiService,
    private windowRef: WindowRef,
    private loggerService: LoggerService,
    private urlService: UrlService
  ) {
    this.initialize();
  }

  /**
   * Inializes the PlatformFeatureService. This function guarantees that the
   * service is initialized only once for subsequent calls.
   *
   * @returns {Promise} - A promise that is resolved when the initialization
   * is done.
   */
  async initialize(): Promise<void> {
    if (!PlatformFeatureService.initializationPromise) {
      PlatformFeatureService.initializationPromise = this._initialize();
    }
    return PlatformFeatureService.initializationPromise;
  }

  /**
   * Returns the status checker object for feature flags, which can be used
   * to get the value of feature flags.
   *
   * Example:
   *   platformFeatureService.status.DummyFeatureFlagForE2ETests.isEnabled === (
   *   true).
   *
   * @returns {FeatureStatusChecker} - Status checker object for feature flags.
   * @throws {Error} - If this method is called before inialization.
   */
  get status(): FeatureStatusChecker {
    if (PlatformFeatureService.featureStatusSummary) {
      return PlatformFeatureService.featureStatusSummary.toStatusChecker();
    } else {
      throw new Error('The platform feature service has not been initialized.');
    }
  }

  /**
   * Checks if there's any error, e.g. request timeout, during initialization.
   *
   * @returns {boolean} - True if there is any error during initialization.
   */
  get isInitializedWithError(): boolean {
    return PlatformFeatureService._isInitializedWithError;
  }

  /**
   * Checks if the loading is skipped.
   *
   * @returns {boolean} - True if the loading is skipped.
   */
  get isSkipped(): boolean {
    return PlatformFeatureService._isSkipped;
  }

  /**
   * Initializes the PlatformFeatureService by sending a request to the server
   * to get the feature flag result.
   *
   * @returns {Promise} - A promise that is resolved when the initialization
   * is done.
   */
  private async _initialize(): Promise<void> {
    try {
      this.clearSavedResults();

      // The user is 'partially logged-in' at the signup page, we need to skip
      // the loading from server otherwise the request will have the cookies
      // erased, leading to the 'Registration session expired' error.
      if (this.urlService.getPathname() === '/signup') {
        PlatformFeatureService._isSkipped = true;
        PlatformFeatureService.featureStatusSummary =
          FeatureStatusSummary.createDefault();
        return;
      }

      PlatformFeatureService.featureStatusSummary =
        await this.loadFeatureFlagsFromServer();
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.loggerService.error(
          'Error during initialization of PlatformFeatureService: ' +
            `${err.message ? err.message : err}`
        );
      }
      // If any error, just disable all features.
      PlatformFeatureService.featureStatusSummary =
        FeatureStatusSummary.createDefault();
      PlatformFeatureService._isInitializedWithError = true;
      this.clearSavedResults();
    }
  }

  private async loadFeatureFlagsFromServer(): Promise<FeatureStatusSummary> {
    return this.featureFlagBackendApiService.fetchFeatureFlags();
  }

  /**
   * Clears results from the sessionStorage, if any.
   */
  private clearSavedResults(): void {
    if (this.windowRef.nativeWindow.sessionStorage) {
      this.windowRef.nativeWindow.sessionStorage.removeItem(
        PlatformFeatureService.SESSION_STORAGE_KEY
      );
    }
  }
}

export const platformFeatureInitFactory = (service: PlatformFeatureService) => {
  return async (): Promise<void> => service.initialize();
};
