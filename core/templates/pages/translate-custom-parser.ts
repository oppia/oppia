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
 * @fileoverview Handler for the Missing translations.
 */


import { Injectable } from '@angular/core';
import { TranslateDefaultParser, TranslateParser } from '@ngx-translate/core';
import * as MessageFormat from 'messageformat';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

@Injectable({
  providedIn: 'root'
})
export class TranslateCustomParser extends TranslateParser {
  messageFormat;
  constructor(
    private translateDefaultParser: TranslateDefaultParser,
    private i18nLanguageCodeService: I18nLanguageCodeService
  ) {
    super();
    this.translateDefaultParser.templateMatcher = /<\[\s?([^{}\s]*)\s?\]>/g;
    this.messageFormat = new MessageFormat();
  }

  interpolate(expr: string | Function,
      params?: { [key: string]: number | string | boolean } ): string {
    let interpolate = this.translateDefaultParser.interpolate(expr, params);
    if (params) {
      if (params.hasOwnProperty('plural') && interpolate !== undefined) {
        if (params.plural) {
          try {
            interpolate = this.messageFormat.compile(
              interpolate, this.i18nLanguageCodeService
                .getCurrentI18nLanguageCode())(params);
          } catch (e) {
            interpolate = this.messageFormat.compile(
              interpolate, 'en')(params);
          }
        }
      }
    }

    return interpolate;
  }

  getValue(target: Object, key: string): string {
    return this.translateDefaultParser.getValue(target, key);
  }
}
