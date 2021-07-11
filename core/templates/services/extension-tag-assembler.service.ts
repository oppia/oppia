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
 * @fileoverview Utility services for explorations which may be shared by both
 * the learner and editor views.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { HtmlEscaperService } from 'services/html-escaper.service';
import {
  InteractionCustomizationArgs,
  InteractionCustomizationArgsBackendDict
} from
  'interactions/customization-args-defs';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';

// Service for assembling extension tags (for interactions).
@Injectable({
  providedIn: 'root'
})
export class ExtensionTagAssemblerService {
  constructor(
    private htmlEscaperService: HtmlEscaperService,
    private camelCaseToHyphens: CamelCaseToHyphensPipe) {}
  _convertCustomizationArgsToBackendDict(
      customizationArgs: InteractionCustomizationArgs
  ): InteractionCustomizationArgsBackendDict {
    // Because of issues with circular dependencies, we cannot import
    // Interaction from InteractionObjectFactory in this file.
    // The convertCustomizationArgsToBackendDict function is repeated
    // here to avoid the circular dependency.

    const traverseSchemaAndConvertSubtitledToDicts = (
        value: Object[] | Object
    ): Object[] | Object => {
      let result: Object[] | Object | undefined = undefined;

      if (value instanceof SubtitledUnicode || value instanceof SubtitledHtml) {
        result = value.toBackendDict();
      } else if (value instanceof Array) {
        result = value.map(
          element => traverseSchemaAndConvertSubtitledToDicts(element));
      } else if (value instanceof Object) {
        type KeyOfValue = keyof typeof value;
        let _result: Record<KeyOfValue, Object> = {};
        result = {};
        let keys = <KeyOfValue[]>Object.keys(value);
        keys.forEach(key => {
          _result[key] = traverseSchemaAndConvertSubtitledToDicts(value[key]);
        });
        result = _result as Object;
      }

      return result || value;
    };

    const customizationArgsBackendDict: Record<string, Object> = {};
    Object.entries(customizationArgs).forEach(([caName, caValue]) => {
      customizationArgsBackendDict[caName] = {
        value: traverseSchemaAndConvertSubtitledToDicts(
          caValue.value)
      };
    });

    return customizationArgsBackendDict;
  }

  formatCustomizationArgAttrs(
      element: JQuery,
      customizationArgs: InteractionCustomizationArgs
  ): JQuery {
    const caBackendDict = <Record<string, {value: Object}>> (
      this._convertCustomizationArgsToBackendDict(customizationArgs));
    for (const caName in customizationArgs) {
      if ('value' in caBackendDict[caName]) {
        let caBackendDictValue = caBackendDict[caName].value;
        element.attr(
          this.camelCaseToHyphens.transform(caName) + '-with-value',
          this.htmlEscaperService.objToEscapedJson(caBackendDictValue));
      }
    }
    return element;
  }
}

angular.module('oppia').factory(
  'ExtensionTagAssemblerService',
  downgradeInjectable(ExtensionTagAssemblerService));
