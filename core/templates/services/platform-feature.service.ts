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
 * @fileoverview A service for retriving feature flags.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ClientContext, ClientContextObjectFactory } from
  'domain/platform_feature/client-context-object.factory';
import {
  FeatureStatusSummary,
  FeatureStatusSummaryObjectFactory,
  FeatureSummaryDict
} from 'domain/platform_feature/feature-status-summary-object.factory';
import { PlatformFeatureBackendApiService } from
  'domain/platform_feature/platform-feature-backend-api.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
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
  private static SESSION_STORAGE_CACHE_TTL = 12 * 3600 * 1000; // 12 hours

  private static COOKIE_NAME_FOR_SESSION_ID = 'SACSID';
  private static COOKIE_NAME_FOR_SESSION_ID_IN_DEV = 'dev_appserver_login';

  // TODO(#9154): Remove static when migration is complete.
  static featureStatusSummary: FeatureStatusSummary = null;

  // TODO(#9154): Remove static when migration is complete.
  static _initializedWithError = false;

  // TODO(#9154): Remove static when migration is complete.
  static initializationPromise: Promise<void> = null;

  constructor(
      private clientContextObjectFactory: ClientContextObjectFactory,
      private platformFeatureBackendApiService:
        PlatformFeatureBackendApiService,
      private featureStatusSummaryObjectFactory:
        FeatureStatusSummaryObjectFactory,
      private i18nLanguageCodeService: I18nLanguageCodeService,
      private windowRef: WindowRef) {
    this.initialize();
  }

  /**
   * Inializes the PlatformFeatureService, it's guaranteed that it's only
   * inialized once.
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
   * Returns the summary object of feature flags, which can be used to get the
   * value of feature flags.
   * Example:
   *   platformFeatureService.featureSummary.DummyFeature.isEnabled === true.
   *
   * @returns {FeatureSummaryDict} - Summary object of feature flags.
   * @throws {Error} - If this method is called before inialization.
   */
  get featureSummary(): FeatureSummaryDict {
    if (PlatformFeatureService.featureStatusSummary) {
      return PlatformFeatureService.featureStatusSummary.toSummaryDict();
    } else {
      throw new Error('The platform feature service has not been initialized.');
    }
  }

  /**
   * Checks if there's any error, e.g. request timeout, during initialization.
   *
   * @returns {boolean} - True if there is any error during initialization.
   */
  get initialzedWithError(): boolean {
    return PlatformFeatureService._initializedWithError;
  }

  /**
   * Detects the type of browser from it's userAgent.
   *
   * @returns {string} - The name of the browser that is being used.
   */
  detectBrowserType(): string {
    const ua = this.windowRef.nativeWindow.navigator.userAgent;

    if (ua.includes('edg') || ua.includes('Edge')) {
      return 'Edge';
    }
    if (ua.includes('Chrome')) {
      return 'Chrome';
    }
    if (ua.includes('Firefox')) {
      return 'Firefox';
    }
    if (ua.includes('Safari')) {
      return 'Safari';
    }

    return 'Unknown';
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
      } else {
        this.clearSavedResults();
      }

      if (!PlatformFeatureService.featureStatusSummary) {
        PlatformFeatureService.featureStatusSummary = await this
          .loadFeatureFlagsFromServer();
        this.saveResults();
      }
    } catch (err) {
      // If any error, just disable all features.
      PlatformFeatureService.featureStatusSummary = this
        .featureStatusSummaryObjectFactory.createDefault();
      PlatformFeatureService._initializedWithError = true;
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
      featureStatusSummary: PlatformFeatureService.featureStatusSummary
        .toBackendDict(),
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
   * Reads and parse feature flag results from the sessionStorage.
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
          this.featureStatusSummaryObjectFactory.createFromBackendDict(
            savedObj.featureStatusSummary))
      };
    }
    return null;
  }

  /**
   * Validates the result saved in sessionStorage.
   *
   * @param {FeatureFlagsCacheItem} item - The result item loaded from
   * sessionStorage.
   *
   * @returns {boolean} - True if the result is valid and can be directly used.
   */
  private validateSavedResults(item: FeatureFlagsCacheItem): boolean {
    if (this.getCurrentTimestamp() - item.timestamp >
        PlatformFeatureService.SESSION_STORAGE_CACHE_TTL) {
      return false;
    }
    if (this.getSessionIdFromCookie() !== item.sessionId) {
      return false;
    }
    return true;
  }

  /**
   * Generates context containing the client side information required to
   * request feature flag values.
   *
   * @returns {ClientContext} - The ClientContext instance containing required
   * client information.
   */
  private generateClientContext(): ClientContext {
    const clientType = 'Web';
    const broswerType = this.detectBrowserType();
    const userLocale = (
      this.i18nLanguageCodeService.getCurrentI18nLanguageCode());

    return this.clientContextObjectFactory.create(
      clientType, broswerType, userLocale);
  }

  /**
   * Parse session id from cookies.
   *
   * @returns {string|null} - The value of the cookie representing session id.
   */
  private getSessionIdFromCookie(): string | null {
    const cookieStrs = this.windowRef.nativeWindow.document.cookie.split('; ');
    const cookieMap = new Map(
      cookieStrs.map(cookieStr => <[string, string]>cookieStr.split('=')));

    if (cookieMap.has(PlatformFeatureService.COOKIE_NAME_FOR_SESSION_ID)) {
      return cookieMap.get(PlatformFeatureService.COOKIE_NAME_FOR_SESSION_ID);
    }
    if (cookieMap.has(
      PlatformFeatureService.COOKIE_NAME_FOR_SESSION_ID_IN_DEV)) {
      return cookieMap.get(
        PlatformFeatureService.COOKIE_NAME_FOR_SESSION_ID_IN_DEV);
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

angular.module('oppia').factory(
  'PlatformFeatureService', downgradeInjectable(PlatformFeatureService));
