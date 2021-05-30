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
 * @fileoverview Component for changing translation language.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { UserBackendApiService } from 'services/user-backend-api.service';
import { UserService } from 'services/user.service';

interface SiteLanguage {
  readonly id: string,
  readonly text: string,
  readonly direction: string
}

@Component({
  selector: 'oppia-i18n-language-selector',
  templateUrl: './i18n-language-selector.component.html'
})
export class I18nLanguageSelectorComponent {
  currentLanguageCode: string;
  supportedSiteLanguages: readonly SiteLanguage[];

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private userService: UserService,
    private userBackendApiService: UserBackendApiService
  ) {}

  ngOnInit(): void {
    this.currentLanguageCode = this.i18nLanguageCodeService
      .getCurrentI18nLanguageCode();
    this.supportedSiteLanguages = AppConstants.SUPPORTED_SITE_LANGUAGES;
  }

  changeLanguage(): void {
    this.i18nLanguageCodeService.setI18nLanguageCode(this.currentLanguageCode);
    this.userService.getUserInfoAsync().then((userInfo) => {
      if (userInfo.isLoggedIn()) {
        this.userBackendApiService.submitSiteLanguageAsync(
          this.currentLanguageCode);
      }
    });
  }
}

angular.module('oppia').directive('oppiaI18nLanguageSelector',
  downgradeComponent({
    component: I18nLanguageSelectorComponent
  }) as angular.IDirectiveFactory);
