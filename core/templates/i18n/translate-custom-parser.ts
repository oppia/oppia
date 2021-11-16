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
import { AppConstants } from 'app.constants';
import MessageFormat from 'messageformat';

export class TranslateCustomParser extends TranslateParser {
  private _messageFormat: MessageFormat;
  constructor(
    private translateDefaultParser: TranslateDefaultParser
  ) {
    super();
    /**
     * The default parser expects {{}} as delimiters.
     * but we use <[ ]> delimiters for interpolation in our translations.
     * So, here templateMatcher is modified to look for <[ ]> instead.
     */
    this.translateDefaultParser.templateMatcher = /<\[\s?([^{}\s]*)\s?\]>/g;
    this._messageFormat = new MessageFormat(AppConstants.DEFAULT_LANGUAGE_CODE);
  }

  interpolate(
      expr: string | Function,
      params?: { [key: string]: number | string | boolean }): string {
    let interpolatedValue = this.translateDefaultParser.interpolate(
      expr, params);

    if (!(params && interpolatedValue !== undefined)) {
      return interpolatedValue;
    }

    if (!params.hasOwnProperty('messageFormat')) {
      return interpolatedValue;
    }

    if (params.messageFormat !== true) {
      return interpolatedValue;
    }

    return this._messageFormat.compile(interpolatedValue)(params);
  }

  getValue(target: Object, key: string): string {
    return this.translateDefaultParser.getValue(target, key);
  }

  get messageFormat(): MessageFormat {
    return this._messageFormat;
  }
}
