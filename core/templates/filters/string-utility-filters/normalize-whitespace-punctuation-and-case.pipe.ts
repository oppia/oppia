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
    // A helper to decide if a character is alphanumeric.
    const isAlphanumeric = (character: string): boolean =>
      'qwertyuiopasdfghjklzxcvbnm0123456789'.indexOf(
        character.toLowerCase()
      ) !== -1;

    // Process each line separately.
    input = input.trim();
    const inputLines = input.split('\n');
    const resultLines = [];

    for (const line of inputLines) {
      // Replace multiple spaces with a single space and split into tokens.
      const tokens = line
        .trim()
        .replace(/\s{2,}/g, ' ')
        .split(' ');

      // Process tokens to decide on case.
      const processedTokens = tokens.map((token, index) => {
        // For the first token, always lower-case.
        if (index === 0) {
          return token.toLowerCase();
        }
        // Determine if the previous token ends with punctuation.
        // We treat a character as punctuation if it is not alphanumeric.
        const previousToken = tokens[index - 1];
        const lastChar = previousToken.slice(-1);
        if (!isAlphanumeric(lastChar)) {
          // If the previous token ended with punctuation,
          // preserve the token's original case.
          return token;
        } else {
          // Otherwise, lower-case it.
          return token.toLowerCase();
        }
      });

      // Merge tokens that are purely punctuation with the previous token.
      const mergedTokens: string[] = [];
      for (const token of processedTokens) {
        // A token that consists solely of non-alphanumeric characters is punctuation.
        if (/^[^a-z0-9]+$/i.test(token) && mergedTokens.length > 0) {
          mergedTokens[mergedTokens.length - 1] += token;
        } else {
          mergedTokens.push(token);
        }
      }

      resultLines.push(mergedTokens.join(' '));
    }
    return resultLines.join('\n');
  }
}
