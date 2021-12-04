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
 * @fileoverview The custom handler to handle the missing translations.
 */

import { MissingTranslationHandler, MissingTranslationHandlerParams } from '@ngx-translate/core';
import { AppConstants } from 'app.constants';

type DefaultTranslationsKey = keyof typeof AppConstants.DEFAULT_TRANSLATIONS;

export class MissingTranslationCustomHandler implements
  MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    if (params.key in AppConstants.DEFAULT_TRANSLATIONS) {
      return (
        AppConstants.DEFAULT_TRANSLATIONS[params.key as
           DefaultTranslationsKey]);
    }
    return params.key;
  }
}
