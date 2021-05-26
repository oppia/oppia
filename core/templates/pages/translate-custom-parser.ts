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
 * @fileoverview Custom parser for translations.
 */

import { TranslateDefaultParser, TranslateParser } from '@ngx-translate/core';
import constants from 'assets/constants';
import MessageFormat from 'messageformat';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

export class TranslateCustomParser extends TranslateParser {
  private _messageFormat: MessageFormat;
  constructor(
    private translateDefaultParser: TranslateDefaultParser,
    private i18nLanguageCodeService: I18nLanguageCodeService
  ) {
    super();
    /**
     * The default parser by default expects {{}} as delimiters.
     * but we use <[ ]> delimiters for interpolation in our translations.
     * So, here templateMatcher is modified to look for <[ ]> instead.
     */
    this.translateDefaultParser.templateMatcher = /<\[\s?([^{}\s]*)\s?\]>/g;
    this._messageFormat = new MessageFormat();
  }

  interpolate(
      expr: string | Function,
      params?: { [key: string]: number | string | boolean }): string {
    let interpolatedValue = this.translateDefaultParser.interpolate(
      expr, params);

    if (!(params &&
         interpolatedValue !== undefined)) {
      return interpolatedValue;
    }

    if (!params.hasOwnProperty('messageFormat')) {
      return interpolatedValue;
    }

    if (params.messageFormat !== true) {
      return interpolatedValue;
    }

    /**
     * The interpolated value by the default parser and the language
     * code passed to messageFormat.compile should be compatible.
     * But there is no way to tell whether the default parser used the primary
     * language or the default language.
     * So, here we first try with the primary language, if messageformat throws
     * an error, we try with the default language.
     */
    try {
      interpolatedValue = this._messageFormat.compile(
        interpolatedValue, this.i18nLanguageCodeService
          .getCurrentI18nLanguageCode())(params);
    } catch (e) {
      interpolatedValue = this._messageFormat.compile(
        interpolatedValue, constants.DEFAULT_LANGUAGE_CODE)(params);
    }
    return interpolatedValue;
  }

  getValue(target: Object, key: string): string {
    return this.translateDefaultParser.getValue(target, key);
  }

  get messageFormat(): MessageFormat {
    return this._messageFormat;
  }
}
