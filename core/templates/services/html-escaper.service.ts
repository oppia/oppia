// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for HTML serialization and escaping.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { LoggerService } from 'services/contextual/logger.service';

@Injectable({
  providedIn: 'root'
})
export class HtmlEscaperService {
  constructor(private loggerService: LoggerService) {}

  /**
   * This function is used to convert an object to its JSON counterpart.
   * @param {object} graph - An object.
   * @return {string} An escaped JSON version of the original string object.
   */
  objToEscapedJson(obj: Object): string {
    return this.unescapedStrToEscapedStr(JSON.stringify(obj));
  }


  /**
   * This function is used to convert
   * a escaped JSON string to its object counterpart.
   * @param {string} json - A JSON string.
   * @return {object} an unescaped non-JSON version of the original string.
   * @throws Will throw error if empty string is passed to JSON decoder.
   */
  escapedJsonToObj(json: string): Object | string {
    if (!json) {
      this.loggerService.error('Empty string was passed to JSON decoder.');
      return '';
    }
    return JSON.parse(this.escapedStrToUnescapedStr(json));
  }

  /**
   * This function is used to convert an unescaped string to its HTML
   * escaped counterpart.
   * @param {string} str - An unescaped string.
   * @return {string} an escaped string derived from the previous string.
   */
  unescapedStrToEscapedStr(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * This file is used to convert an HTML escaped string to its
   * unescaped counterpart.
   * @param {string} value - An escaped string.
   * @return {string} an unescaped string derived from the previous string.
   */
  escapedStrToUnescapedStr(value: string): string {
    return String(value)
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, '\'')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
}

angular.module('oppia').factory(
  'HtmlEscaperService', downgradeInjectable(HtmlEscaperService));
