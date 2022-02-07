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
 * @fileoverview Service containing all i18n logic.
 */

import { EventEmitter, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppConstants } from 'app.constants';
import { TranslateCacheService } from 'ngx-translate-cache';
import { DocumentAttributeCustomizationService } from 'services/contextual/document-attribute-customization.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { UserBackendApiService } from 'services/user-backend-api.service';
import { UserService } from 'services/user.service';

interface LanguageInfo {
  id: string;
  text: string;
  direction: string;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private _directionChangeEventEmitter: EventEmitter<string> = (
    new EventEmitter<string>());
  url!: URL;
  // Check that local storage exists and works as expected.
  // If it does storage stores the localStorage object,
  // else storage is undefined or false.
  localStorage = (function() {
    let test = 'test';
    let result;
    try {
      localStorage.setItem(test, test);
      result = localStorage.getItem(test) === test;
      localStorage.removeItem(test);
      return result && localStorage;
    } catch (exception) {}
  }());

  constructor(
    private documentAttributeCustomizationService:
    DocumentAttributeCustomizationService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private userBackendApiService: UserBackendApiService,
    private userService: UserService,
    private translateCacheService: TranslateCacheService,
    private translateService: TranslateService,
    private windowRef: WindowRef
  ) {}

  initialize(): void {
    this.i18nLanguageCodeService.onI18nLanguageCodeChange.subscribe(
      (code) => {
        this.translateService.use(code);
        for (let i = 0; i < AppConstants.SUPPORTED_SITE_LANGUAGES.length; i++) {
          if (AppConstants.SUPPORTED_SITE_LANGUAGES[i].id === code) {
            this._updateDirection(
              AppConstants.SUPPORTED_SITE_LANGUAGES[i].direction);
            break;
          }
        }
        this.documentAttributeCustomizationService.addAttribute('lang', code);
      }
    );

    // Loads site language according to the language parameter in URL
    // if present.
    this.url = new URL(this.windowRef.nativeWindow.location.toString());
    const searchParams = this.url.searchParams;

    if (searchParams.has('lang')) {
      let supportedSiteLanguageCodes: string[] = (
        AppConstants.SUPPORTED_SITE_LANGUAGES.map(
          (languageInfo: LanguageInfo) => {
            return languageInfo.id;
          }
        )
      );
      let siteLanguageCode = searchParams.get('lang') || '';
      if (supportedSiteLanguageCodes.includes(siteLanguageCode)) {
        // When translation cache is initialized, language code stored in local
        // storage is used to set the site language. To have a single source of
        // truth, we first directly update the language code in local storage
        // before intializing the translation cache, so that we always read the
        // language code from the local storage to set site language.
        // This removes the need of continously syncing URL lang param and
        // cache, and avoids race conditions.
        if (this.localStorage) {
          this.localStorage.setItem('lang', siteLanguageCode);
        }
      } else {
        // In the case where the URL contains an invalid language code, we
        // load the site using last cached language code and remove the language
        // param from the URL.
        this.url.searchParams.delete('lang');
        this.windowRef.nativeWindow.history.pushState(
          {}, '', this.url.toString());
      }
    }

    // The translateCacheService should only be initialized after the
    // translation cache is set according to the URL language parameter (if
    // present).This avoids race conditions between the URL language parameter
    // and the language code stored in the local storage.
    this.translateCacheService.init();

    const cachedLanguageCode = (
      this.translateCacheService.getCachedLanguage());
    if (cachedLanguageCode) {
      this.i18nLanguageCodeService.setI18nLanguageCode(cachedLanguageCode);
    }
  }

  removeUrlLangParam(): void {
    if (this.url.searchParams.has('lang')) {
      this.url.searchParams.delete('lang');
      this.windowRef.nativeWindow.history.pushState(
        {}, '', this.url.toString());
    }
  }


  updateUserPreferredLanguage(newLangCode: string): void {
    this.i18nLanguageCodeService.setI18nLanguageCode(newLangCode);
    this.userService.getUserInfoAsync().then((userInfo) => {
      if (userInfo.isLoggedIn()) {
        this.userBackendApiService.updatePreferredSiteLanguageAsync(
          newLangCode);
      }
    });
    // When user changes site language, it will override the lang parameter in
    // the URL and render it invalid, so we remove it (if it's present) to avoid
    // confusion.
    this.removeUrlLangParam();
  }

  updateViewToUserPreferredSiteLanguage(): void {
    this.userService.getUserInfoAsync().then((userInfo) => {
      let preferredLangCode = userInfo.getPreferredSiteLanguageCode() || '';

      if (preferredLangCode) {
        this.i18nLanguageCodeService.setI18nLanguageCode(preferredLangCode);

        // This removes the language parameter from the URL if it is present,
        // since, when the user is logged in and has a preferred site language,
        // we always choose the language code based on their preferred site
        // language to load the webpage, overriding the URL language parameter.
        this.removeUrlLangParam();
      }
    });
  }

  private _updateDirection(newDirection: string): void {
    this._directionChangeEventEmitter.emit(newDirection);
  }

  get directionChangeEventEmitter(): EventEmitter<string> {
    return this._directionChangeEventEmitter;
  }
}
