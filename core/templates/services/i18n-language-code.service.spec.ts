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
 * @fileoverview Unit tests for I18nLanguageCodeService.
 */

import { EventEmitter } from '@angular/core';

import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { AlertsService } from './alerts.service';
import { WindowRef } from './contextual/window-ref.service';
import { Subscription } from 'rxjs';
import { LoggerService } from './contextual/logger.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/',
      href: '',
      toString() {
        return 'http://localhost/community';
      }
    },
    history: {
      pushState(data, title: string, url?: string | null) {}
    }
  };
}

class MockAlertsService extends AlertsService {
  addWarning() {
    return null;
  }
}

describe('I18nLanguageCodeService', () => {
  let loggerService = new LoggerService();
  let alertsService = new MockAlertsService(loggerService);
  let mockWindowRef = new MockWindowRef();
  const i18nLanguageCodeService = new I18nLanguageCodeService (
    mockWindowRef as WindowRef, alertsService as AlertsService);
  let languageCode: string = '';
  let testSubscriptions: Subscription;
  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(
      i18nLanguageCodeService.onI18nLanguageCodeChange
        .subscribe((code: string) => languageCode = code));
    spyOn(alertsService, 'addWarning');
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should set the language code', () => {
    i18nLanguageCodeService.setI18nLanguageCode('pt-br');
    expect(languageCode).toBe('pt-br');
  });

  it('should get the latest language code', () => {
    i18nLanguageCodeService.setI18nLanguageCode('es');
    const latestCode = i18nLanguageCodeService.getCurrentI18nLanguageCode();
    expect(latestCode).toBe('es');
  });

  it('should set the url lang parameter', () => {
    spyOn(mockWindowRef.nativeWindow.history, 'pushState');
    mockWindowRef.nativeWindow.location = new URL('http://localhost/community?lang=en');
    i18nLanguageCodeService.setUrlLanguageParam('es');

    expect(mockWindowRef.nativeWindow.history.pushState).toHaveBeenCalled();
  });

  it('should raise warning if lang code is invalid' +
  ' and load in current lang', () => {
    spyOn(mockWindowRef.nativeWindow.history, 'pushState');
    spyOn(i18nLanguageCodeService, 'getCurrentI18nLanguageCode')
      .and.returnValue('en');
    mockWindowRef.nativeWindow.location = new URL('http://localhost/community?lang=es');
    i18nLanguageCodeService.setI18nLanguageCode('invalid');

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Loading in "English" because the language code ' +
      'given in the URL is invalid.');
    expect(mockWindowRef.nativeWindow.history.pushState).toHaveBeenCalled();
  });

  it('should get event emitter for loading of preferred language codes', () => {
    let mockPreferredLanguageCodesLoadedEventEmitter = new EventEmitter();
    expect(i18nLanguageCodeService.onPreferredLanguageCodesLoaded).toEqual(
      mockPreferredLanguageCodesLoadedEventEmitter);
  });
});
