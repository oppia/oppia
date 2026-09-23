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
import {LoggerService} from 'services/contextual/logger.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';

/**
 * The id of the HTML element that carries the feature flag evaluations. The
 * server injects the evaluated flags into this element on the initial page
 * load, so that they are available without an extra blocking network request.
 */
const OPPIA_FEATURE_FLAGS_ELEMENT_ID = 'oppia-feature-flags';

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
   * Checks if there's any error, e.g. missing injected data, during
   * initialization.
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
   * Initializes the PlatformFeatureService by reading the feature flag
   * evaluations that the server injected into the initial page load.
   *
   * @returns {Promise} - A promise that is resolved when the initialization
   * is done.
   */
  private async _initialize(): Promise<void> {
    try {
      this.clearSavedResults();

      // The user is 'partially logged-in' at the signup page, we need to skip
      // the loading otherwise the injected flag values may not reflect the
      // account after the registration session is completed, leading to the
      // 'Registration session expired' error.
      if (this.urlService.getPathname() === '/signup') {
        PlatformFeatureService._isSkipped = true;
        PlatformFeatureService.featureStatusSummary =
          FeatureStatusSummary.createDefault();
        return;
      }

      PlatformFeatureService.featureStatusSummary =
        this.getFeatureFlagsFromHtml();
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

  /**
   * Reads the feature flag evaluations that the server injected into the
   * initial page load.
   *
   * @returns {FeatureStatusSummary} - The parsed feature status summary.
   */
  private getFeatureFlagsFromHtml(): FeatureStatusSummary {
    const document = this.windowRef.nativeWindow.document;
    const element = document.getElementById(OPPIA_FEATURE_FLAGS_ELEMENT_ID);
    if (!element || !element.textContent) {
      throw new Error('Feature flags data not found in the HTML.');
    }
    const backendDict = JSON.parse(element.textContent);
    return FeatureStatusSummary.createFromBackendDict(backendDict);
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
  return (): Promise<void> => service.initialize();
};
