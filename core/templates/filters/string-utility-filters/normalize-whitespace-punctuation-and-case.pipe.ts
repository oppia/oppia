// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview NormalizeWhitespacePunctuationAndCase pipe for Oppia.
 */

import {Injectable, Pipe, PipeTransform} from '@angular/core';

// Filter that takes a string, trims and normalizes spaces within each
// line, and removes blank lines. Note that any spaces whose removal does not
// result in two alphanumeric "words" being joined together are also removed,
// so "hello ? " becomes "hello?".
@Injectable({
  providedIn: 'root',
})
@Pipe({name: 'normalizeWhitespacePunctuationAndCase'})
export class NormalizeWhitespacePunctuationAndCasePipe
  implements PipeTransform
{
  transform(input: string): string {
    let isAlphanumeric = function (character: string): boolean {
      return (
        'qwertyuiopasdfghjklzxcvbnm0123456789'.indexOf(
          character.toLowerCase()
        ) !== -1
      );
    };

    input = input.trim();
    let inputLines = input.split('\n');
    let resultLines: string[] = [];
    for (let line of inputLines) {
      let processedLine = line.trim().replace(/\s{2,}/g, ' ');
      let result = '';
      for (let j = 0; j < processedLine.length; j++) {
        let currentChar = processedLine.charAt(j).toLowerCase();
        if (currentChar === ' ') {
          // Keep the space if the next character is alphanumeric.
          if (
            j < processedLine.length - 1 &&
            isAlphanumeric(processedLine.charAt(j + 1))
          ) {
            result += currentChar;
          }
        } else {
          result += currentChar;
          // If current character is punctuation (i.e. not alphanumeric) and the next character exists,
          // and if the next character is alphanumeric and not a space,
          // then insert a space after the punctuation.
          if (!isAlphanumeric(currentChar) && j < processedLine.length - 1) {
            if (
              processedLine.charAt(j + 1) !== ' ' &&
              isAlphanumeric(processedLine.charAt(j + 1))
            ) {
              result += ' ';
            }
          }
        }
      }
      if (result) {
        resultLines.push(result);
      }
    }
    return resultLines.join('\n');
  }
}
