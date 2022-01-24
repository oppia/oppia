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
 * @fileoverview Module for the Internationalization.
 */

import { NgModule } from '@angular/core';
// eslint-disable-next-line oppia/disallow-httpclient
import { HttpClient } from '@angular/common/http';
import { TranslateCacheModule, TranslateCacheService,
  TranslateCacheSettings } from 'ngx-translate-cache';
import { MissingTranslationHandler, TranslateDefaultParser,
  TranslateLoader, TranslateModule, TranslateParser,
  TranslateService } from '@ngx-translate/core';

import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { TranslateLoaderFactory } from 'i18n/translate-loader.factory';
import { TranslateCacheFactory } from 'i18n/translate-cache.factory';
import { TranslateCustomParser } from 'i18n/translate-custom-parser';
import { MissingTranslationCustomHandler } from 'i18n/missing-translation-custom-handler';
import { AppConstants } from 'app.constants';
import { I18nService } from './i18n.service';

/**
 * The Translate Module will look for translations in the following order:
 * 1. Look for translation in primary language (fetched from backend)
 * 2. Look for translation in default language (fetched from backend)
 * 3. Look for translation present in AppConstants.ts (
 *    used until translations are fetched from backend)
 * 4. shows the key, if the translation is not found.
 */

@NgModule({
  imports: [
    TranslateModule.forRoot({
      defaultLanguage: AppConstants.DEFAULT_LANGUAGE_CODE,
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: MissingTranslationCustomHandler
      },
      loader: {
        provide: TranslateLoader,
        useFactory: TranslateLoaderFactory.createHttpLoader,
        deps: [HttpClient],
      },
      parser: {
        provide: TranslateParser,
        useClass: TranslateCustomParser,
        deps: [TranslateDefaultParser, I18nLanguageCodeService]
      }
    }),
    TranslateCacheModule.forRoot({
      cacheService: {
        provide: TranslateCacheService,
        useFactory: TranslateCacheFactory.createTranslateCacheService,
        deps: [TranslateService, TranslateCacheSettings]
      }
    })
  ],

  providers: [
    TranslateDefaultParser,
    I18nService
  ],

  exports: [
    TranslateModule,
    TranslateCacheModule
  ]
})
export class I18nModule {}
