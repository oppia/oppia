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
 * @fileoverview Unit tests for FeatureGatingService.
 */

import { TestBed, fakeAsync, flushMicrotasks, tick } from
  '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { WindowRef } from 'services/contextual/window-ref.service';
import { FeatureGatingService, FeatureNames } from
  'services/feature-gating.service';
import { FeatureGatingBackendApiService } from
  'domain/feature_gating/feature-gating-backend-api.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { FeatureFlagResultsObjectFactory } from
  'domain/feature_gating/FeatureFlagResultsObjectFactory';

describe('FeatureGatingService', () => {
  let windowRef: WindowRef;
  let i18n: I18nLanguageCodeService;
  let apiService: FeatureGatingBackendApiService;
  let resultFactory: FeatureFlagResultsObjectFactory;
  let featureGatingService: FeatureGatingService;

  let mockSessionStore: (obj: object) => void;
  let mockCookie: (cookieStr: string) => void;
  let mockUserAgent: (ua: string) => void;

  let apiSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    windowRef = TestBed.get(WindowRef);
    i18n = TestBed.get(I18nLanguageCodeService);
    resultFactory = TestBed.get(FeatureFlagResultsObjectFactory);
    apiService = TestBed.get(FeatureGatingBackendApiService);

    const store = {};
    let cookie = '';
    let userAgent = '';
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      sessionStorage: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => store[key] = value,
        removeItem: (key: string) => delete store[key]
      },
      document: {
        get cookie() {
          return cookie;
        }
      },
      navigator: {
        get userAgent() {
          return userAgent;
        }
      }
    });
    mockSessionStore = (obj: object) => {
      Object.assign(store, obj);
    };
    mockCookie = (cookieStr: string) => cookie = cookieStr;
    mockUserAgent = ua => userAgent = ua;

    spyOn(i18n, 'getCurrentI18nLanguageCode').and.returnValue('en');
    apiSpy = spyOn(apiService, 'fetchFeatureFlags').and.resolveTo(
      resultFactory.createFromBackendDict({
        feature_name_a: true,
        feature_name_b: false
      })
    );
  });

  afterEach(() => {
    // TODO(#9154): Remove the following resetting code when migration is
    // complete.
    // Currently these two properties are static, which are not after each
    // test, so we need to manually clear the state of FeatureGatingService.
    FeatureGatingService.featureFlagResults = null;
    FeatureGatingService._initializedWithError = false;
    FeatureGatingService.initializationPromise = null;
  });

  describe('.initialize', () => {
    it('should load from server when storage is clean.', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');
      featureGatingService = TestBed.get(FeatureGatingService);
      featureGatingService.initialize()
        .then(successHandler, failHandler);

      flushMicrotasks();

      expect(apiService.fetchFeatureFlags).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
      expect(featureGatingService.initialzedWithError).toBeFalse();
    }));

    it('should save results in sessionStorage after loading.', fakeAsync(() => {
      const sessionId = 'session_id';
      mockCookie(`SACSID=${sessionId}`);
      featureGatingService = TestBed.get(FeatureGatingService);

      const timestamp = Date.now();

      flushMicrotasks();

      expect(apiService.fetchFeatureFlags).toHaveBeenCalled();
      expect(
        windowRef.nativeWindow.sessionStorage.getItem('SAVED_FEATURE_FLAGS')
      ).not.toBeNull();
      expect(
        JSON.parse(windowRef.nativeWindow.sessionStorage.getItem(
          'SAVED_FEATURE_FLAGS'))
      ).toEqual({
        timestamp: timestamp,
        sessionId: sessionId,
        featureFlagResults: {
          feature_name_a: true,
          feature_name_b: false
        }
      });
      expect(featureGatingService.initialzedWithError).toBeFalse();
    }));

    it(
      'should use SACSID instead of dev_appserver_login as sessionId when' +
      ' saving results.', fakeAsync(() => {
        const sessionId = 'session_id';
        mockCookie(`SACSID=${sessionId}; dev_appserver_login=should_not_use`);

        featureGatingService = TestBed.get(FeatureGatingService);

        flushMicrotasks();

        expect(
          JSON.parse(windowRef.nativeWindow.sessionStorage.getItem(
            'SAVED_FEATURE_FLAGS'))
            .sessionId
        ).toEqual(sessionId);
      })
    );

    it(
      'should use dev_app_server_login as sessionId when no SACSID is set',
      fakeAsync(() => {
        const sessionId = 'session_id';
        mockCookie(`dev_appserver_login=${sessionId}`);

        featureGatingService = TestBed.get(FeatureGatingService);

        flushMicrotasks();

        expect(
          JSON.parse(windowRef.nativeWindow.sessionStorage.getItem(
            'SAVED_FEATURE_FLAGS'))
            .sessionId
        ).toEqual(sessionId);
      })
    );

    it('should load from sessionStorage if there\'s valid results.', fakeAsync(
      () => {
        const sessionId = 'session_id';
        mockCookie(`SACSID=${sessionId}`);
        mockSessionStore({
          SAVED_FEATURE_FLAGS: JSON.stringify({
            sessionId: sessionId,
            timestamp: Date.now(),
            featureFlagResults: {
              feature_name_a: true,
              feature_name_b: false
            }
          })
        });

        tick(60 * 1000);
        featureGatingService = TestBed.get(FeatureGatingService);

        flushMicrotasks();

        expect(apiService.fetchFeatureFlags).not.toHaveBeenCalled();
        expect(featureGatingService.initialzedWithError).toBeFalse();
      })
    );

    it('should load from server if saved results have expired.',
      fakeAsync(() => {
        const sessionId = 'session_id';
        mockCookie(`SACSID=${sessionId}`);
        mockSessionStore({
          SAVED_FEATURE_FLAGS: JSON.stringify({
            sessionId: sessionId,
            timestamp: Date.now(),
            featureFlagResults: {
              feature_name_a: true,
              feature_name_b: true
            }
          })
        });

        tick(13 * 3600 * 1000); // 13 hours later.
        featureGatingService = TestBed.get(FeatureGatingService);

        flushMicrotasks();

        expect(apiService.fetchFeatureFlags).toHaveBeenCalled();
        expect(featureGatingService.initialzedWithError).toBeFalse();
      })
    );

    it(
      'should load from server if sessionId of saved result does not match.',
      fakeAsync(() => {
        const sessionId = 'session_id';
        mockCookie(`SACSID=${sessionId}`);
        mockSessionStore({
          SAVED_FEATURE_FLAGS: JSON.stringify({
            sessionId: 'different session id',
            timestamp: Date.now(),
            featureFlagResults: {
              feature_name_a: true,
              feature_name_b: true
            }
          })
        });

        featureGatingService = TestBed.get(FeatureGatingService);

        flushMicrotasks();

        expect(apiService.fetchFeatureFlags).toHaveBeenCalled();
        expect(
          JSON.parse(windowRef.nativeWindow.sessionStorage.getItem(
            'SAVED_FEATURE_FLAGS'))
            .sessionId
        ).toEqual(sessionId);
        expect(featureGatingService.initialzedWithError).toBeFalse();
      })
    );

    it('should request only once if there are more than one calls to ' +
      '.initialize.', fakeAsync(() => {
      featureGatingService = TestBed.get(FeatureGatingService);

      featureGatingService.initialize();
      featureGatingService.initialize();

      flushMicrotasks();

      expect(apiService.fetchFeatureFlags).toHaveBeenCalledTimes(1);
      expect(featureGatingService.initialzedWithError).toBeFalse();
    }));

    it('should disable all features when loading fails.', fakeAsync(() => {
      apiSpy.and.throwError('mock error');

      featureGatingService = TestBed.get(FeatureGatingService);

      flushMicrotasks();

      expect(
        featureGatingService.isFeatureEnabled(<FeatureNames>'feature_name_a')
      ).toBeFalse();
      expect(
        featureGatingService.isFeatureEnabled(<FeatureNames>'feature_name_b')
      ).toBeFalse();
      expect(featureGatingService.initialzedWithError).toBeTrue();
    }));

    describe('.detectBrowserType', () => {
      beforeEach(() => {
        featureGatingService = TestBed.get(FeatureGatingService);
      });

      it('should correctly detect Edge browser.', () => {
        mockUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246');

        expect(featureGatingService.detectBrowserType()).toEqual('Edge');
      });

      it('should correctly detect Chrome browser.', () => {
        mockUserAgent(
          'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, ' +
          'like Gecko) Chrome/47.0.2526.111 Safari/537.36');

        expect(featureGatingService.detectBrowserType()).toEqual('Chrome');
      });

      it('should correctly detect Firefox browser.', () => {
        mockUserAgent(
          'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101' +
          ' Firefox/15.0.1');

        expect(featureGatingService.detectBrowserType()).toEqual('Firefox');
      });

      it('should correctly detect Safari browser.', () => {
        mockUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/' +
          '601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9');

        expect(featureGatingService.detectBrowserType()).toEqual('Safari');
      });
    });
  });

  describe('.isFeatureEnabled', () => {
    it('should return correct values of feature flags', fakeAsync(() => {
      featureGatingService = TestBed.get(FeatureGatingService);

      flushMicrotasks();

      expect(
        featureGatingService.isFeatureEnabled(<FeatureNames>'feature_name_a')
      ).toBeTrue();
      expect(
        featureGatingService.isFeatureEnabled(<FeatureNames>'feature_name_b')
      ).toBeFalse();
      expect(featureGatingService.initialzedWithError).toBeFalse();
    }));

    it('should throw error when accessed before initialization.', fakeAsync(
      () => {
        featureGatingService = TestBed.get(FeatureGatingService);
        expect(
          () => featureGatingService.isFeatureEnabled(<FeatureNames>'name')
        ).toThrowError('The feature gating service has not been initialized.');
      })
    );
  });
});
