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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter} from '@angular/core';
import {
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {UserInfo} from 'domain/user/user-info.model';
import {CookieModule, CookieService} from 'ngx-cookie';
import {TranslateCacheService} from 'ngx-translate-cache';
import {WindowRef} from 'services/contextual/window-ref.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {UserBackendApiService} from 'services/user-backend-api.service';
import {UserService} from 'services/user.service';
import {I18nService} from './i18n.service';

describe('I18n service', () => {
  let i18nService: I18nService;
  let windowRef: WindowRef;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let userService: UserService;
  let userBackendApiService: UserBackendApiService;
  const CACHE_KEY_LANG = 'lang';
  const CACHE_KEY_DIRECTION = 'direction';

  class MockWindowRef {
    nativeWindow = {
      document: {
        documentElement: {
          setAttribute: () => {},
        },
      },
      location: {
        toString: () => {
          return 'http://localhost:8181/';
        },
        reload: () => {},
        href: 'http://localhost:8181',
      },
      history: {
        pushState: () => {},
      },
      gtag: () => {},
    };
  }

  class MockTranslateCacheService {
    init(): void {}
    getCachedLanguage(): string {
      return 'cached_lang';
    }
  }
  class MockTranslateService {
    use(langCode: string): void {}
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, CookieModule.forRoot()],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: TranslateCacheService,
          useClass: MockTranslateCacheService,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    i18nService = TestBed.inject(I18nService);
    windowRef = TestBed.inject(WindowRef);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    userService = TestBed.inject(UserService);
    userBackendApiService = TestBed.inject(UserBackendApiService);
  });

  it('should set cache language according to URL lang param', fakeAsync(() => {
    // Setting 'en' as cache language code.
    if (i18nService.localStorage) {
      i18nService.localStorage.setItem(CACHE_KEY_LANG, 'en');
      i18nService.localStorage.setItem(CACHE_KEY_DIRECTION, 'ltr');
    }
    // This sets the url to 'http://localhost:8181/?lang=es'
    // when initialized.
    windowRef.nativeWindow.location.href = 'http://localhost:8181/?lang=es';
    expect(
      i18nService.localStorage
        ? i18nService.localStorage.getItem(CACHE_KEY_LANG)
        : null
    ).toBe('en');
    i18nService.initialize();

    expect(
      i18nService.localStorage
        ? i18nService.localStorage.getItem(CACHE_KEY_LANG)
        : null
    ).toBe('es');
    flushMicrotasks();
  }));

  it('should remove language param from URL if it is invalid', fakeAsync(() => {
    if (i18nService.localStorage) {
      i18nService.localStorage.setItem(CACHE_KEY_LANG, 'en');
    }
    // This sets the url to 'http://localhost:8181/?lang=invalid'
    // when initialized.
    windowRef.nativeWindow.location.href =
      'http://localhost:8181/?lang=invalid';
    i18nService.initialize();

    // Translation cache should not be updated as the language param
    // is invalid.
    expect(
      i18nService.localStorage
        ? i18nService.localStorage.getItem(CACHE_KEY_LANG)
        : null
    ).toBe('en');
    flushMicrotasks();
  }));

  it(
    'should not update translation cache if no language param is present in' +
      ' URL',
    fakeAsync(() => {
      if (i18nService.localStorage) {
        i18nService.localStorage.setItem(CACHE_KEY_LANG, 'en');
        i18nService.localStorage.setItem(CACHE_KEY_DIRECTION, 'ltr');
      }
      expect(
        i18nService.localStorage
          ? i18nService.localStorage.getItem(CACHE_KEY_LANG)
          : null
      ).toBe('en');
      i18nService.initialize();
      tick();

      expect(
        i18nService.localStorage
          ? i18nService.localStorage.getItem(CACHE_KEY_LANG)
          : null
      ).toBe('en');
      flushMicrotasks();
    })
  );

  it('should remove url lang param', fakeAsync(() => {
    i18nService.url = new URL('http://localhost/about?lang=es');
    spyOn(windowRef.nativeWindow.history, 'pushState');

    i18nService.removeUrlLangParam();

    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalledWith(
      {},
      '',
      'http://localhost/about'
    );
    flushMicrotasks();
  }));

  it('should update user preferred language', fakeAsync(() => {
    let userInfo = new UserInfo(
      [],
      true,
      true,
      true,
      true,
      true,
      'es',
      '',
      '',
      true
    );
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo)
    );
    spyOn(
      userBackendApiService,
      'updatePreferredSiteLanguageAsync'
    ).and.returnValue(
      Promise.resolve({
        site_language_code: 'es',
      })
    );
    spyOn(i18nService, 'removeUrlLangParam');

    let newLangCode = 'en';
    i18nLanguageCodeService.setI18nLanguageCode('es');
    expect(userInfo.getPreferredSiteLanguageCode()).toBe('es');
    i18nService.updateUserPreferredLanguage(newLangCode);
    tick();
    expect(
      userBackendApiService.updatePreferredSiteLanguageAsync
    ).toHaveBeenCalledWith(newLangCode);
    expect(i18nService.removeUrlLangParam).toHaveBeenCalled();
    flushMicrotasks();
  }));

  it('should set the new language code when language changes', fakeAsync(() => {
    let userInfo = new UserInfo(
      [],
      true,
      true,
      true,
      true,
      true,
      'es',
      '',
      '',
      false
    );
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo)
    );
    spyOn(i18nLanguageCodeService, 'setI18nLanguageCode');
    spyOn(i18nService, 'removeUrlLangParam');

    let newLangCode = 'ar';

    i18nLanguageCodeService.setI18nLanguageCode('es');
    i18nService.updateUserPreferredLanguage(newLangCode);
    tick();
    expect(i18nLanguageCodeService.setI18nLanguageCode).toHaveBeenCalledWith(
      newLangCode
    );
    expect(i18nService.removeUrlLangParam).toHaveBeenCalled();
    flushMicrotasks();
  }));

  it('should update view to user preferred site language', fakeAsync(() => {
    let preferredLanguage = 'es';
    let userInfo = new UserInfo(
      [],
      true,
      true,
      true,
      true,
      true,
      preferredLanguage,
      '',
      '',
      false
    );
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo)
    );
    spyOn(i18nLanguageCodeService, 'setI18nLanguageCode').and.callFake(
      () => {}
    );
    spyOn(i18nService, 'removeUrlLangParam');

    i18nService.updateViewToUserPreferredSiteLanguage();
    tick();

    expect(userService.getUserInfoAsync).toHaveBeenCalled();
    expect(i18nLanguageCodeService.setI18nLanguageCode).toHaveBeenCalledWith(
      preferredLanguage
    );
    expect(i18nService.removeUrlLangParam).toHaveBeenCalled();
    flushMicrotasks();
  }));

  it(
    'should not update site language if user does not have' +
      ' a preferred language',
    fakeAsync(() => {
      let preferredLanguage = null;
      let userInfo = new UserInfo(
        [],
        true,
        true,
        true,
        true,
        true,
        preferredLanguage,
        '',
        '',
        false
      );
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(userInfo)
      );
      spyOn(i18nLanguageCodeService, 'setI18nLanguageCode');
      spyOn(i18nService, 'removeUrlLangParam');

      i18nService.updateViewToUserPreferredSiteLanguage();
      tick();

      expect(userService.getUserInfoAsync).toHaveBeenCalled();
      expect(
        i18nLanguageCodeService.setI18nLanguageCode
      ).not.toHaveBeenCalledWith(preferredLanguage);
      expect(i18nService.removeUrlLangParam).not.toHaveBeenCalled();
      flushMicrotasks();
    })
  );

  it('should update site language', fakeAsync(() => {
    let mockI18nLanguageCodeService = new EventEmitter<string>();
    spyOn(windowRef.nativeWindow.location, 'toString').and.returnValue(
      'http://localhost:8181'
    );
    spyOnProperty(
      i18nLanguageCodeService,
      'onI18nLanguageCodeChange'
    ).and.returnValue(mockI18nLanguageCodeService);
    i18nService.initialize();
    mockI18nLanguageCodeService.emit('en');
    tick();
    flushMicrotasks();
  }));

  it(
    'should reload the website if language direction changes with lang param' +
      ' when cookies are not acknowledged',
    fakeAsync(() => {
      let mockI18nLanguageCodeServiceSubject = new EventEmitter<string>();
      spyOn(windowRef.nativeWindow.location, 'toString').and.returnValue(
        'http://localhost:8181'
      );
      spyOnProperty(
        i18nLanguageCodeService,
        'onI18nLanguageCodeChange'
      ).and.returnValue(mockI18nLanguageCodeServiceSubject);
      const prevLangCode = I18nLanguageCodeService.prevLangCode;
      I18nLanguageCodeService.prevLangCode = 'en';
      spyOn(windowRef.nativeWindow.location, 'reload');
      i18nService.initialize();
      mockI18nLanguageCodeServiceSubject.emit('ar');
      tick();
      expect(windowRef.nativeWindow.location.href).toBe(
        'http://localhost:8181/?dir=rtl'
      );
      mockI18nLanguageCodeServiceSubject.emit('en');
      tick();
      expect(windowRef.nativeWindow.location.href).toBe(
        'http://localhost:8181/?dir=ltr'
      );
      mockI18nLanguageCodeServiceSubject.emit('es');
      tick();
      expect(windowRef.nativeWindow.location.href).toBe(
        'http://localhost:8181/?dir=ltr'
      );
      I18nLanguageCodeService.prevLangCode = prevLangCode;
      flushMicrotasks();
    })
  );

  it(
    'should reload the website if language direction changes when cookies ' +
      'acknowledged',
    fakeAsync(() => {
      let currentDateInUnixTimeMsecs = new Date().valueOf();
      spyOn(windowRef.nativeWindow.location, 'toString').and.returnValue(
        'http://localhost:8181'
      );
      let cookieOptions = {
        expires: new Date(currentDateInUnixTimeMsecs + 360000),
        secure: true,
        sameSite: 'none' as const,
      };
      const cookieService = TestBed.inject(CookieService);
      cookieService.put(
        i18nService.COOKIE_NAME_COOKIES_ACKNOWLEDGED,
        String(currentDateInUnixTimeMsecs),
        cookieOptions
      );
      let mockI18nLanguageCodeServiceSubject = new EventEmitter<string>();
      spyOnProperty(
        i18nLanguageCodeService,
        'onI18nLanguageCodeChange'
      ).and.returnValue(mockI18nLanguageCodeServiceSubject);
      const prevLangCode = I18nLanguageCodeService.prevLangCode;
      I18nLanguageCodeService.prevLangCode = 'en';
      spyOn(windowRef.nativeWindow.location, 'reload');
      i18nService.initialize();
      // In our code, we check if the dir cookie is set and use it to determine
      // the window reload. If this test is run after a test that emits a rtl
      // language in the end, we get a failed expectation. The failed expect is
      // because we emit 'ar' which is also a 'rtl' language and hence we don't
      // reload. To get around this in the short term we emit 'en' first and
      // then 'ar' so that the dir value in cookie changes.
      mockI18nLanguageCodeServiceSubject.emit('en');
      expect(windowRef.nativeWindow.location.href).toBe(
        'http://localhost:8181'
      );
      mockI18nLanguageCodeServiceSubject.emit('ar');
      I18nLanguageCodeService.prevLangCode = prevLangCode;
      expect(windowRef.nativeWindow.location.reload).toHaveBeenCalled();
      expect(windowRef.nativeWindow.location.href).toBe(
        'http://localhost:8181'
      );
      cookieService.removeAll();
      flushMicrotasks();
    })
  );

  it('should test getters', () => {
    expect(i18nService.directionChangeEventEmitter).toBeDefined();
  });
});
