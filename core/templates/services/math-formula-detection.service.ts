// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for detecting plain-text math formulas in HTML strings.
 */

import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MathFormulaDetectionService {
  /**
   * Checks if a given HTML string contains plain-text math formulas.
   *
   * @param htmlString The HTML string (or array of strings) to check.
   * @returns boolean True if plain-text math formulas are found.
   */
  isFormulaAsText(htmlString: string | string[]): boolean {
    if (Array.isArray(htmlString)) {
      return htmlString.some(s => this.isFormulaAsText(s));
    }

    if (!htmlString) {
      return false;
    }

    const stringWithoutMathComponents = htmlString.replace(
      /<oppia-noninteractive-math[\s\S]*?<\/oppia-noninteractive-math>/gi,
      ''
    );

    const textWithNewlines = stringWithoutMathComponents
      .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();

    const lines = textWithNewlines
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return lines.some(line =>
      /\b[a-zA-Z0-9]\s*[+\-*/=]\s*[a-zA-Z0-9]\b/.test(line)
    );
  }
}
