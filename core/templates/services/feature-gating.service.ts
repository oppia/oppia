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
 * @fileoverview  TODO A service for generating random and unique content_id for
 * SubtitledHtml domain objects.
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
import { I18nLanguageCodeService } from './i18n-language-code.service';
import { WindowRef } from './contextual/window-ref.service';

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

  private featureFlagResults: FeatureFlagResults = null;

  private currentSessionId: string | null;

  constructor(
      private clientContextObjectFactory: ClientContextObjectFactory,
      private featureGatingBackendApiService: FeatureGatingBackendApiService,
      private featureFlagResultsObjectFactory: FeatureFlagResultsObjectFactory,
      private i18nLanguageCodeService: I18nLanguageCodeService,
      private windowRef: WindowRef) {
    this.currentSessionId = this.getSessionIdFromCookie();
  }

  async initialize(): Promise<void> {
    try {
      const item = this.loadSavedResults();
      if (item && this.validateSavedResults(item)) {
        this.featureFlagResults = item.featureFlagResults;
        console('used results from session storage');
      } else {
        this.clearSavedResults();
      }

      if (!this.featureFlagResults) {
        this.featureFlagResults = await this.loadFeatureFlagsFromServer();
        this.saveResults(this.featureFlagResults);
        console('used results from server');
      }

      console.log(
        'initialization done, results:' +
        JSON.stringify(this.featureFlagResults.toBackendDict()));
    } catch (err) {
      // If any error, just disable all features.
      // TODO
      console.log('loading error!');
      console.error(err);
      this.clearSavedResults();
    }
  }

  isFeatureEnabled(name: FeatureNames): boolean {
    if (this.featureFlagResults) {
      return this.featureFlagResults.isFeatureEnabled(name);
    } else {
      throw new Error('TODO not initialized.');
    }
  }

  private async loadFeatureFlagsFromServer(): Promise<FeatureFlagResults> {
    const context = this.generateClientContext();
    return this.featureGatingBackendApiService.fetchFeatureFlags(context);
  }

  private saveResults(results: FeatureFlagResults) {
    // TODO: May be useful (mock local storage in test):
    // https://gist.github.com/wzr1337/b3fe4abcc46588aa8fcb
    // this.windowRef.sessionStorage
    const item = {
      timestamp: this.getCurrentTimestamp(),
      sessionId: this.currentSessionId,
      featureFlagResults: results.toBackendDict(),
    };
    this.windowRef.nativeWindow.sessionStorage.setItem(
      FeatureGatingService.SESSION_STORAGE_KEY, JSON.stringify(item));
  }

  private clearSavedResults() {
    this.windowRef.nativeWindow.sessionStorage.removeItem(
      FeatureGatingService.SESSION_STORAGE_KEY);
  }

  private loadSavedResults():
    FeatureFlagsCacheItem | null {
    const savedStr = this.windowRef.nativeWindow.sessionStorage.getItem(
      FeatureGatingService.SESSION_STORAGE_KEY);
    if (savedStr) {
      const savedObj = JSON.parse(savedStr);
      return {
        timestamp: savedObj.timestamp,
        sessionId: savedObj.sessionId,
        featureFlagResults: (
          this.featureFlagResultsObjectFactory.createFromBackendDict(
            savedObj.featureFlags))
      };
    }
    return null;
  }

  private validateSavedResults(cache: FeatureFlagsCacheItem): boolean {
    if (this.getCurrentTimestamp() - cache.timestamp >
        FeatureGatingService.SESSION_STORAGE_CACHE_TTL) {
      return false;
    }
    if (this.currentSessionId !== cache.sessionId) {
      return false;
    }
    return true;
  }

  private generateClientContext(): ClientContext {
    const clientType = 'Web';
    const appVersion = null;
    const broswerType = this.detectBrowserType();
    const userLocale = (
      this.i18nLanguageCodeService.getCurrentI18nLanguageCode());

    return this.clientContextObjectFactory.create(
      clientType, broswerType, appVersion, userLocale);
  }

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

  private getCurrentTimestamp(): number {
    return new Date().valueOf();
  }

  private detectBrowserType(): string {
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
}

angular.module('oppia').factory(
  'FeatureGatingService', downgradeInjectable(FeatureGatingService));
