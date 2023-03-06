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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import isEqual from 'lodash/isEqual';

import { AppConstants } from 'app.constants';
import { ClientContext } from 'domain/platform_feature/client-context.model';
import { FeatureNames, FeatureNamesKeys, FeatureStatusChecker, FeatureStatusSummary } from 'domain/platform_feature/feature-status-summary.model';
import { PlatformFeatureBackendApiService } from 'domain/platform_feature/platform-feature-backend-api.service';
import { BrowserCheckerService } from 'domain/utilities/browser-checker.service';
import { LoggerService } from 'services/contextual/logger.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';

interface FeatureFlagsCacheItem {
  timestamp: number;
  sessionId: string;
  featureStatusSummary: FeatureStatusSummary;
}

@Injectable({
  providedIn: 'root'
})
export class PlatformFeatureService {
  private static SESSION_STORAGE_KEY = 'SAVED_FEATURE_FLAGS';
  // 12 hours.
  private static SESSION_STORAGE_CACHE_TTL_MSECS = 12 * 60 * 60 * 1000;

  // The following attributes are made static to avoid potential inconsistencies
  // caused by multi-instantiation of the service.
  static featureStatusSummary: FeatureStatusSummary;
  static initializationPromise: Promise<void>;
  static _isInitializedWithError = false;
  static _isSkipped = false;

  constructor(
      private platformFeatureBackendApiService:
        PlatformFeatureBackendApiService,
      private windowRef: WindowRef,
      private loggerService: LoggerService,
      private urlService: UrlService,
      private browserCheckerService: BrowserCheckerService) {
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
   *   platformFeatureService.status.DummyFeature.isEnabled === true.
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
  get isInitialzedWithError(): boolean {
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
   * Initializes the PlatformFeatureService. It first checks if there is
   * previously saved feature flag result in the sessionStorage, if there is
   * and the result is still valid, it will be loaded. Otherwise it sends
   * a request to the server to get the feature flag result.
   *
   * @returns {Promise} - A promise that is resolved when the initialization
   * is done.
   */
  private async _initialize(): Promise<void> {
    try {
      const item = this.loadSavedResults();
      if (item && this.validateSavedResults(item)) {
        PlatformFeatureService.featureStatusSummary = item.featureStatusSummary;
        this.saveResults();
        return;
      }
      this.clearSavedResults();

      // The user is 'partially logged-in' at the signup page, we need to skip
      // the loading from server otherwise the request will have the cookies
      // erased, leading to the 'Registration session expired' error.
      if (this.urlService.getPathname() === '/signup') {
        PlatformFeatureService._isSkipped = true;
        PlatformFeatureService.featureStatusSummary = (
          FeatureStatusSummary.createDefault());
        return;
      }

      PlatformFeatureService.featureStatusSummary = (
        await this.loadFeatureFlagsFromServer());

      this.saveResults();
    // We use unknown type because we are unsure of the type of error
    // that was thrown. Since the catch block cannot identify the
    // specific type of error, we are unable to further optimise the
    // code by introducing more types of errors.
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.loggerService.error(
          'Error during initialization of PlatformFeatureService: ' +
          `${err.message ? err.message : err}`);
      }
      // If any error, just disable all features.
      PlatformFeatureService.featureStatusSummary = (
        FeatureStatusSummary.createDefault());
      PlatformFeatureService._isInitializedWithError = true;
      this.clearSavedResults();
    }
  }

  private async loadFeatureFlagsFromServer(): Promise<FeatureStatusSummary> {
    const context = this.generateClientContext();
    return this.platformFeatureBackendApiService.fetchFeatureFlags(context);
  }

  /**
   * Saves the results in sessionStorage, along with current timestamp and
   * the current session id.
   */
  private saveResults(): void {
    const item = {
      timestamp: this.getCurrentTimestamp(),
      sessionId: this.getSessionIdFromCookie(),
      featureStatusSummary:
        PlatformFeatureService.featureStatusSummary.toBackendDict(),
    };
    this.windowRef.nativeWindow.sessionStorage.setItem(
      PlatformFeatureService.SESSION_STORAGE_KEY, JSON.stringify(item));
  }

  /**
   * Clears results from the sessionStorage, if any.
   */
  private clearSavedResults(): void {
    this.windowRef.nativeWindow.sessionStorage.removeItem(
      PlatformFeatureService.SESSION_STORAGE_KEY);
  }

  /**
   * Reads and parses feature flag results from the sessionStorage.
   *
   * @returns {FeatureFlagsCacheItem|null} - Saved results along with timestamp
   * and session id. Null if there isn't any saved result.
   */
  private loadSavedResults(): FeatureFlagsCacheItem | null {
    const savedStr = this.windowRef.nativeWindow.sessionStorage.getItem(
      PlatformFeatureService.SESSION_STORAGE_KEY);
    if (savedStr) {
      const savedObj = JSON.parse(savedStr);
      return {
        timestamp: savedObj.timestamp,
        sessionId: savedObj.sessionId,
        featureStatusSummary: (
          FeatureStatusSummary.createFromBackendDict(
            savedObj.featureStatusSummary))
      };
    }
    return null;
  }

  /**
   * Validates the result saved in sessionStorage. The result is valid only when
   * all following conditions hold:
   *   - it hasn't expired.
   *   - its session id matches the current session id.
   *   - there isn't any new feature defined in the code base that is not
   *     presented in the cached result.
   *
   * @param {FeatureFlagsCacheItem} item - The result item loaded from
   * sessionStorage.
   *
   * @returns {boolean} - True if the result is valid and can be directly used.
   */
  private validateSavedResults(item: FeatureFlagsCacheItem): boolean {
    if (this.getCurrentTimestamp() - item.timestamp >
        PlatformFeatureService.SESSION_STORAGE_CACHE_TTL_MSECS) {
      return false;
    }

    if (this.getSessionIdFromCookie() !== item.sessionId) {
      return false;
    }

    const storedFeatures: string[] = (
      Array.from(item.featureStatusSummary.featureNameToFlag.keys()));
    const featureNamesKeys = (

      Object.keys(FeatureNames) as FeatureNamesKeys);
    const requiredFeatures: string[] = (
      featureNamesKeys.map(name => FeatureNames[name]));
    return isEqual(storedFeatures.sort(), requiredFeatures.sort());
  }

  /**
   * Generates context containing the client side information required to
   * request feature flag values.
   *
   * @returns {ClientContext} - The ClientContext instance containing required
   * client information.
   */
  private generateClientContext(): ClientContext {
    const platformType = 'Web';
    const browserType = this.browserCheckerService.detectBrowserType();

    return ClientContext.create(platformType, browserType);
  }

  /**
   * Parse session id from cookies.
   *
   * @returns {string|null} - The value of the cookie representing session id.
   */
  private getSessionIdFromCookie(): string | null {
    const cookieStrs = this.windowRef.nativeWindow.document.cookie.split('; ');
    const cookieMap = new Map(
      cookieStrs.map(cookieStr => cookieStr.split('=') as [string, string]));
    const sessionId = (
      cookieMap.get(AppConstants.FIREBASE_AUTH_SESSION_COOKIE_NAME));
    if (sessionId !== undefined) {
      return sessionId;
    }
    return null;
  }

  /**
   * Gets the current timestamp.
   *
   * @returns {number} - The current timestamp.
   */
  private getCurrentTimestamp(): number {
    return Date.now();
  }
}

export const platformFeatureInitFactory = (service: PlatformFeatureService) => {
  return async(): Promise<void> => service.initialize();
};

angular.module('oppia').factory(
  'PlatformFeatureService', downgradeInjectable(PlatformFeatureService));
