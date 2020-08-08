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
  'domain/feature_gating/ClientContextObjectFactory';
import {
  FeatureFlagResults,
  FeatureFlagResultsObjectFactory
} from 'domain/feature_gating/FeatureFlagResultsObjectFactory';
import { FeatureGatingBackendApiService } from
  'domain/feature_gating/feature-gating-backend-api.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { WindowRef } from 'services/contextual/window-ref.service';

export enum FeatureNames {
    DummyFeature = 'Dummy_Feature',
}

interface FeatureFlagsCacheItem {
  timestamp: number;
  sessionId: string;
  featureFlagResults: FeatureFlagResults;
}

@Injectable({
  providedIn: 'root'
})
export class FeatureGatingService {
  private static SESSION_STORAGE_KEY = 'SAVED_FEATURE_FLAGS';
  private static SESSION_STORAGE_CACHE_TTL = 12 * 3600 * 1000; // 12 hours

  private static COOKIE_NAME_FOR_SESSION_ID = 'SACSID';
  private static COOKIE_NAME_FOR_SESSION_ID_IN_DEV = 'dev_appserver_login';

  // TODO(#9154): Remove static when migration is complete.
  static featureFlagResults: FeatureFlagResults = null;

  // TODO(#9154): Remove static when migration is complete.
  static _initializedWithError = false;

  // TODO(#9154): Remove static when migration is complete.
  static initializationPromise: Promise<void> = null;

  constructor(
      private clientContextObjectFactory: ClientContextObjectFactory,
      private featureGatingBackendApiService: FeatureGatingBackendApiService,
      private featureFlagResultsObjectFactory: FeatureFlagResultsObjectFactory,
      private i18nLanguageCodeService: I18nLanguageCodeService,
      private windowRef: WindowRef) {
    this.initialize();
  }

  /**
   * Inializes the FeatureGatingService, it's guaranteed that it's only
   * inialized once.
   *
   * @returns {Promise} - A promise that is resolved when the initialization
   * is done.
   */
  async initialize(): Promise<void> {
    if (!FeatureGatingService.initializationPromise) {
      FeatureGatingService.initializationPromise = this._initialize();
    }
    return FeatureGatingService.initializationPromise;
  }

  /**
   * Gets the value of the feature flag.
   *
   * @param {FeatureNames} name - Name of the feature.
   *
   * @returns {boolean} - True if the feature is enabled.
   * @throws {Error} - If this method is called before inialization.
   */
  isFeatureEnabled(name: FeatureNames): boolean {
    if (FeatureGatingService.featureFlagResults) {
      return FeatureGatingService.featureFlagResults.isFeatureEnabled(name);
    } else if (FeatureGatingService._initializedWithError) {
      return false;
    } else {
      throw new Error('The feature gating service has not been initialized.');
    }
  }

  /**
   * Checks if there's any error, e.g. request timeout, during initialization.
   *
   * @returns {boolean} - True if there is any error during initialization.
   */
  get initialzedWithError(): boolean {
    return FeatureGatingService._initializedWithError;
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

    return 'Others';
  }

  /**
   * Initializes the FeatureGatingService. It first checks if there is
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
        FeatureGatingService.featureFlagResults = item.featureFlagResults;
        this.saveResults();
      } else {
        this.clearSavedResults();
      }

      if (!FeatureGatingService.featureFlagResults) {
        FeatureGatingService.featureFlagResults = await this
          .loadFeatureFlagsFromServer();
        this.saveResults();
      }
    } catch (err) {
      // If any error, just disable all features.
      FeatureGatingService._initializedWithError = true;
      this.clearSavedResults();
    }
  }

  private async loadFeatureFlagsFromServer(): Promise<FeatureFlagResults> {
    const context = this.generateClientContext();
    return this.featureGatingBackendApiService.fetchFeatureFlags(context);
  }

  /**
   * Saves the results in sessionStorage, along with current timestamp and
   * the current session id.
   */
  private saveResults(): void {
    const item = {
      timestamp: this.getCurrentTimestamp(),
      sessionId: this.getSessionIdFromCookie(),
      featureFlagResults: FeatureGatingService.featureFlagResults
        .toBackendDict(),
    };
    this.windowRef.nativeWindow.sessionStorage.setItem(
      FeatureGatingService.SESSION_STORAGE_KEY, JSON.stringify(item));
  }

  /**
   * Clears results from the sessionStorage, if any.
   */
  private clearSavedResults(): void {
    this.windowRef.nativeWindow.sessionStorage.removeItem(
      FeatureGatingService.SESSION_STORAGE_KEY);
  }

  /**
   * Reads and parse feature flag results from the sessionStorage.
   *
   * @returns {FeatureFlagsCacheItem|null} - Saved results along with timestamp
   * and session id. Null if there isn't any saved result.
   */
  private loadSavedResults(): FeatureFlagsCacheItem | null {
    const savedStr = this.windowRef.nativeWindow.sessionStorage.getItem(
      FeatureGatingService.SESSION_STORAGE_KEY);
    if (savedStr) {
      const savedObj = JSON.parse(savedStr);
      return {
        timestamp: savedObj.timestamp,
        sessionId: savedObj.sessionId,
        featureFlagResults: (
          this.featureFlagResultsObjectFactory.createFromBackendDict(
            savedObj.featureFlagResults))
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
        FeatureGatingService.SESSION_STORAGE_CACHE_TTL) {
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
    const appVersion = null;
    const broswerType = this.detectBrowserType();
    const userLocale = (
      this.i18nLanguageCodeService.getCurrentI18nLanguageCode());

    return this.clientContextObjectFactory.create(
      clientType, broswerType, appVersion, userLocale);
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

    if (cookieMap.has(FeatureGatingService.COOKIE_NAME_FOR_SESSION_ID)) {
      return cookieMap.get(FeatureGatingService.COOKIE_NAME_FOR_SESSION_ID);
    }
    if (cookieMap.has(FeatureGatingService.COOKIE_NAME_FOR_SESSION_ID_IN_DEV)) {
      return cookieMap.get(
        FeatureGatingService.COOKIE_NAME_FOR_SESSION_ID_IN_DEV);
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
  'FeatureGatingService', downgradeInjectable(FeatureGatingService));
