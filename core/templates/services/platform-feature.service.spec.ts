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
 * @fileoverview Unit tests for PlatformFeatureService.
 */

import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {WindowRef} from 'services/contextual/window-ref.service';
import {
  PlatformFeatureService,
  platformFeatureInitFactory,
} from 'services/platform-feature.service';
import {FeatureNames} from 'domain/feature-flag/feature-status-summary.model';
import {UrlService} from 'services/contextual/url.service';

describe('PlatformFeatureService', () => {
  let windowRef: WindowRef;
  let platformFeatureService: PlatformFeatureService;
  let urlService: UrlService;

  let mockFeatureFlagsInHtml: (flags: Record<string, boolean>) => void;
  let mockPathName: (pathName: string) => void;

  const FEATURE_FLAGS_ELEMENT_ID = 'oppia-feature-flags';

  // These properties are static, which are not automatically cleared after
  // each test, so we need to manually clear the state of
  // PlatformFeatureService.
  const clearStaticProperties = () => {
    // This throws "Type 'null' is not assignable to type 'FeatureStatusSummary'
    // ." We need to suppress this error because of the need to manually clear
    // the state of PlatformFeatureService after each test. This is because
    // PlatformFeatureService is a singleton service.
    // @ts-ignore
    PlatformFeatureService.featureStatusSummary = null;
    PlatformFeatureService._isInitializedWithError = false;
    // This throws "Type 'null' is not assignable to type 'Promise<void>'."
    // We need to suppress this error because of the need to manually clear the
    // state of PlatformFeatureService after each test. This is because
    // PlatformFeatureService is a singleton service.
    // @ts-ignore
    PlatformFeatureService.initializationPromise = null;
    PlatformFeatureService._isSkipped = false;
  };

  // Resets the static summary and initialization promise so that a subsequent
  // TestBed.inject call triggers a fresh initialization. The @ts-ignore
  // directives are placed here (rather than at each call site) so that the
  // suppression rationale is documented exactly once.
  const forceReinitialization = () => {
    // This throws "Type 'null' is not assignable to type 'FeatureStatusSummary'
    // ." We need to suppress this error because of the need to manually reset
    // the singleton state between tests.
    // @ts-ignore
    PlatformFeatureService.featureStatusSummary = null;
    // This throws "Type 'null' is not assignable to type 'Promise<void>'." We
    // need to suppress this error because of the need to manually reset the
    // singleton state between tests.
    // @ts-ignore
    PlatformFeatureService.initializationPromise = null;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    windowRef = TestBed.inject(WindowRef);
    urlService = TestBed.inject(UrlService);

    clearStaticProperties();

    const store: Record<string, string> = {};
    let cookie = '';
    let featureFlagsJson = JSON.stringify({});
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      sessionStorage: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => (store[key] = value),
        removeItem: (key: string) => delete store[key],
      },
      document: {
        get cookie() {
          return cookie;
        },
        getElementById: (id: string) =>
          id === FEATURE_FLAGS_ELEMENT_ID
            ? {
                textContent: featureFlagsJson,
              }
            : null,
      },
      navigator: {
        get userAgent() {
          return '';
        },
      },
    } as unknown as Window);

    let pathName = '/';
    spyOn(urlService, 'getPathname').and.callFake(() => pathName);
    mockPathName = path => (pathName = path);

    mockFeatureFlagsInHtml = (flags: Record<string, boolean>) => {
      featureFlagsJson = JSON.stringify(flags);
    };

    mockFeatureFlagsInHtml({
      [FeatureNames.DummyFeatureFlagForE2ETests]: true,
    });
  });

  describe('.initialize', () => {
    it('should read feature flags from the injected HTML.', fakeAsync(() => {
      platformFeatureService = TestBed.inject(PlatformFeatureService);

      flushMicrotasks();

      expect(
        platformFeatureService.status.DummyFeatureFlagForE2ETests.isEnabled
      ).toBeTrue();
      expect(platformFeatureService.isInitializedWithError).toBeFalse();
    }));

    it('should initialize only once for multiple calls to .initialize.', fakeAsync(() => {
      platformFeatureService = TestBed.inject(PlatformFeatureService);

      platformFeatureService.initialize();
      platformFeatureService.initialize();

      flushMicrotasks();

      expect(
        platformFeatureService.status.DummyFeatureFlagForE2ETests.isEnabled
      ).toBeTrue();
      expect(platformFeatureService.isInitializedWithError).toBeFalse();
    }));

    it('should disable all features when the injected data is invalid.', fakeAsync(() => {
      // Make the injected JSON invalid.
      spyOn(windowRef.nativeWindow.document, 'getElementById').and.returnValue({
        textContent: 'not valid json',
      } as unknown as HTMLElement);

      forceReinitialization();

      platformFeatureService = TestBed.inject(PlatformFeatureService);

      flushMicrotasks();

      expect(
        platformFeatureService.status.DummyFeatureFlagForE2ETests.isEnabled
      ).toBeFalse();
      expect(platformFeatureService.isInitializedWithError).toBeTrue();
    }));

    it('should disable all features when the injected element is missing.', fakeAsync(() => {
      spyOn(windowRef.nativeWindow.document, 'getElementById').and.returnValue(
        null
      );

      forceReinitialization();

      platformFeatureService = TestBed.inject(PlatformFeatureService);

      flushMicrotasks();

      expect(
        platformFeatureService.status.DummyFeatureFlagForE2ETests.isEnabled
      ).toBeFalse();
      expect(platformFeatureService.isInitializedWithError).toBeTrue();
    }));

    it('should skip on the signup page', fakeAsync(() => {
      mockPathName('/signup');

      platformFeatureService = TestBed.inject(PlatformFeatureService);

      flushMicrotasks();

      expect(platformFeatureService.isSkipped).toBeTrue();
      expect(
        platformFeatureService.status.DummyFeatureFlagForE2ETests.isEnabled
      ).toBeFalse();
    }));
  });

  describe('.featureSummary', () => {
    it('should return correct values of feature flags', fakeAsync(() => {
      platformFeatureService = TestBed.inject(PlatformFeatureService);

      flushMicrotasks();

      expect(
        platformFeatureService.status.DummyFeatureFlagForE2ETests.isEnabled
      ).toBeTrue();
      expect(platformFeatureService.isInitializedWithError).toBeFalse();
    }));

    it('should throw error when accessed before initialization.', fakeAsync(() => {
      platformFeatureService = TestBed.inject(PlatformFeatureService);
      // This throws "Type 'null' is not assignable to type 'FeatureStatusSummary'
      // ." We need to suppress this error because we want to clear the static
      // summary to simulate an uninitialized state for this test.
      // @ts-ignore
      PlatformFeatureService.featureStatusSummary = null;
      expect(
        () =>
          platformFeatureService.status.DummyFeatureFlagForE2ETests.isEnabled
      ).toThrowError('The platform feature service has not been initialized.');
    }));
  });

  describe('platformFeatureInitFactory', () => {
    let factoryFn = (service: PlatformFeatureService) => {
      return (): Promise<void> => service.initialize();
    };

    beforeEach(() => {
      factoryFn = platformFeatureInitFactory;
      platformFeatureService = TestBed.inject(PlatformFeatureService);
    });

    it('should return a function that calls initialize', async () => {
      const mockPromise = Promise.resolve();
      const spy = spyOn(platformFeatureService, 'initialize').and.returnValue(
        mockPromise
      );

      const returnedFn = factoryFn(platformFeatureService);
      const returnedPromise = returnedFn();

      expect(spy).toHaveBeenCalled();
      await expectAsync(returnedPromise).toBeResolvedTo();
    });
  });
});
