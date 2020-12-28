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

import {
  TranslatableSetOfNormalizedString, TranslatableSetOfUnicodeString
} from 'interactions/rule-input-defs';

/**
 * @fileoverview Filter that formats objects that subclass
 * BaseTranslatableObject for display.
 */

type TranslatableObjectValue<T> = Omit<T, 'contentId'>;

type TranslatableSetOfNormalizedStringValue = (
  TranslatableObjectValue<TranslatableSetOfNormalizedString>);
type TranslatableSetOfUnicodeStringValue = (
  TranslatableObjectValue<TranslatableSetOfUnicodeString>);

type TranslatableObjectValues = (
  TranslatableSetOfNormalizedStringValue |
  TranslatableSetOfUnicodeStringValue);

angular.module('oppia').filter('formatBaseTranslatableObjectValues', [
  function() {
    return function(value: TranslatableObjectValues, type: string): string {
      let result;
      switch (type) {
        case 'TranslatableSetOfNormalizedString':
          value = <TranslatableSetOfNormalizedStringValue>value;
          result = '[';
          for (var i = 0; i < value.normalizedStrSet.length; i++) {
            if (i !== 0) {
              result += ', ';
            }
            result += value.normalizedStrSet[i];
          }
          result += ']';
          return result;
        case 'TranslatableSetOfUnicodeString':
          value = <TranslatableSetOfUnicodeStringValue>value;
          result = '[';
          for (var i = 0; i < value.unicodeStrSet.length; i++) {
            if (i !== 0) {
              result += ', ';
            }
            result += value.unicodeStrSet[i];
          }
          result += ']';
          return result;
        default:
          throw new Error(`The ${type} type is not implemented.`);
      }
    };
  }
]);
