// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for i18n service.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { UserInfo } from 'domain/user/user-info.model';
import { CookieModule, CookieService } from 'ngx-cookie';
import { TranslateCacheService, TranslateCacheSettings } from 'ngx-translate-cache';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { UserBackendApiService } from 'services/user-backend-api.service';
import { UserService } from 'services/user.service';
import { I18nService } from './i18n.service';

describe('I18n service', () => {
  let i18nService: I18nService;
  let cookieService: CookieService;
  let windowRef: WindowRef;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let userService: UserService;
  let userBackendApiService: UserBackendApiService;
  const CACHE_KEY_FOR_TESTS: string = 'CACHED_LANG_KEY';

  class MockWindowRef {
    nativeWindow = {
      document: {
        documentElement: {
          setAttribute: () => {}
        }
      },
      location: {
        toString: () => {
          return '';
        }
      },
      history: {
        pushState: () => {}
      }
    };
  }

  class MockTranslateCacheService {
    init(): void {}
    getCachedLanguage(): string {
      return 'cached_lang';
    }
  }

  class MockTranslateCacheSettings {
    cacheName = CACHE_KEY_FOR_TESTS;
  }

  class MockTranslateService {
    use(langCode: string): void {}
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        CookieModule.forRoot()
      ],
      providers: [
        {
          provide: TranslateCacheService,
          useClass: MockTranslateCacheService
        },
        {
          provide: TranslateCacheSettings,
          useClass: MockTranslateCacheSettings
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    i18nService = TestBed.inject(I18nService);
    cookieService = TestBed.inject(CookieService);
    windowRef = TestBed.inject(WindowRef);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    userService = TestBed.inject(UserService);
    userBackendApiService = TestBed.inject(UserBackendApiService);
  });

  it('should set cache language according to URL lang param', () => {
    // Setting 'en' as cache language code.
    cookieService.put(CACHE_KEY_FOR_TESTS, 'en');
    // This sets the url to 'http://localhost:8181/?lang=es'
    // when initialized.
    spyOn(windowRef.nativeWindow.location, 'toString')
      .and.returnValue('http://localhost:8181/?lang=es');
    expect(cookieService.get(CACHE_KEY_FOR_TESTS)).toBe('en');

    i18nService.initialize();

    expect(cookieService.get(CACHE_KEY_FOR_TESTS)).toBe('es');
  });

  it('should remove language param from URL if it is invalid', () => {
    cookieService.put(CACHE_KEY_FOR_TESTS, 'en');
    spyOn(cookieService, 'put');
    // This sets the url to 'http://localhost:8181/?lang=invalid'
    // when initialized.
    spyOn(windowRef.nativeWindow.location, 'toString')
      .and.returnValue('http://localhost:8181/?lang=invalid');

    i18nService.initialize();

    // Translation cache should not be updated as the language param
    // is invalid.
    expect(cookieService.put).not.toHaveBeenCalledWith();
    expect(cookieService.get(CACHE_KEY_FOR_TESTS)).toBe('en');
  });

  it('should not update translation cache if no language param is present in' +
  ' URL', () => {
    cookieService.put(CACHE_KEY_FOR_TESTS, 'en');
    // This sets the url to 'http://localhost:8181/' when initialized.
    spyOn(windowRef.nativeWindow.location, 'toString')
      .and.returnValue('http://localhost:8181/');
    spyOn(cookieService, 'put');

    expect(cookieService.get(CACHE_KEY_FOR_TESTS)).toBe('en');

    i18nService.initialize();

    expect(cookieService.put).not.toHaveBeenCalledWith();
    expect(cookieService.get(CACHE_KEY_FOR_TESTS)).toBe('en');
  });

  it('should remove url lang param', () => {
    i18nService.url = new URL('http://localhost/about?lang=es');
    spyOn(windowRef.nativeWindow.history, 'pushState');

    i18nService.removeUrlLangParam();

    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalledWith(
      {}, '', 'http://localhost/about');
  });

  it('should update user preferred language', fakeAsync(() => {
    spyOn(i18nLanguageCodeService, 'setI18nLanguageCode');
    let userInfo = new UserInfo(
      [], true, true, true, true, true, 'es', '', '', true);
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo));
    spyOn(userBackendApiService, 'updatePreferredSiteLanguageAsync');
    spyOn(i18nService, 'removeUrlLangParam');

    let newLangCode = 'en';

    expect(userInfo.getPreferredSiteLanguageCode()).toBe('es');

    i18nService.updateUserPreferredLanguage(newLangCode);
    tick();

    expect(i18nLanguageCodeService.setI18nLanguageCode).toHaveBeenCalledWith(
      newLangCode);
    expect(userBackendApiService.updatePreferredSiteLanguageAsync)
      .toHaveBeenCalledWith(newLangCode);
    expect(i18nService.removeUrlLangParam).toHaveBeenCalled();
  }));

  it('should update view to user preferred site language', fakeAsync(() => {
    let preferredLanguage = 'es';
    let userInfo = new UserInfo(
      [], true, true, true, true, true, preferredLanguage, '', '', false);
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo));
    spyOn(i18nLanguageCodeService, 'setI18nLanguageCode');
    spyOn(i18nService, 'removeUrlLangParam');

    i18nService.updateViewToUserPreferredSiteLanguage();
    tick();

    expect(userService.getUserInfoAsync).toHaveBeenCalled();
    expect(i18nLanguageCodeService.setI18nLanguageCode).toHaveBeenCalledWith(
      preferredLanguage);
    expect(i18nService.removeUrlLangParam).toHaveBeenCalled();
  }));

  it('should not update site language if user doesnot have' +
    ' a preferred language', fakeAsync(() => {
    let preferredLanguage = null;
    let userInfo = new UserInfo(
      [], true, true, true, true, true, preferredLanguage, '', '', false);
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo));
    spyOn(i18nLanguageCodeService, 'setI18nLanguageCode');
    spyOn(i18nService, 'removeUrlLangParam');

    i18nService.updateViewToUserPreferredSiteLanguage();
    tick();

    expect(userService.getUserInfoAsync).toHaveBeenCalled();
    expect(i18nLanguageCodeService.setI18nLanguageCode).not.
      toHaveBeenCalledWith(preferredLanguage);
    expect(i18nService.removeUrlLangParam).not.toHaveBeenCalled();
  }));

  it('should update site language', fakeAsync(() => {
    let mockI18nLanguageCodeService = new EventEmitter<string>();
    spyOn(windowRef.nativeWindow.location, 'toString')
      .and.returnValue('http://localhost:8181');
    spyOnProperty(i18nLanguageCodeService, 'onI18nLanguageCodeChange')
      .and.returnValue(mockI18nLanguageCodeService);
    i18nService.initialize();
    mockI18nLanguageCodeService.emit('en');
    tick();
  }));

  it('should test getters', () => {
    expect(i18nService.directionChangeEventEmitter).toBeDefined();
  });
});
