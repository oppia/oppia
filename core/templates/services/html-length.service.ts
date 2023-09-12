// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for Computing length of HTML strings.
 */

import { Injectable, SecurityContext } from '@angular/core';
import { LoggerService } from './contextual/logger.service';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class HtmlLengthService {
  constructor(
    private loggerService: LoggerService,
    private sanitizer: DomSanitizer
  ) {}

  /**
    * ['oppia-noninteractive-image', 'oppia-noninteractive-math']
    * The above tags constitutes for non text nodes.
    */
  nonTextTags = ['oppia-noninteractive-math', 'oppia-noninteractive-image'];

  /**
    * ['li','blockquote','em','strong', 'p', 'a']
    * The above tags serve as the tags for text content. Blockquote,
    * em, a, strong occur as descendants of p tag. li tags are
    * descendants of ol/ul tags.
    */
  textTags = ['p', 'ul', 'ol'];

  computeHtmlLengthInWords(htmlString: string): number {
    if (!htmlString) {
      this.loggerService.error('Empty string was passed to compute length');
      return 0;
    }
    const sanitizedHtml = this.sanitizer.sanitize(
      SecurityContext.HTML, htmlString) as string;
    let totalWeight = this.calculateBaselineLength(sanitizedHtml);

    // Identify custom tags using regex on the original HTML string.
    const customTagRegex = /<oppia-noninteractive-(?:math|image)[^>]*>/g;
    const customTags = htmlString.match(customTagRegex);

    if (customTags) {
      for (const customTag of customTags) {
        totalWeight += this.getWeightForNonTextNodes(customTag);
      }
    }
    return totalWeight;
  }

  private calculateBaselineLength(sanitizedHtml: string): number {
    let domparser = new DOMParser();
    let dom = domparser.parseFromString(sanitizedHtml, 'text/html');
    let totalWeight = 0;
    for (let tag of Array.from(dom.body.children)) {
      const ltag = tag.tagName.toLowerCase();
      if (this.textTags.includes(ltag)) {
        totalWeight += this.getWeightForTextNodes(tag as HTMLElement);
      }
    }
    return totalWeight;
  }

  private getWeightForTextNodes(textNode: HTMLElement): number {
    const textContent = textNode.textContent || '';
    const words = textContent.trim().split(' ');
    const wordCount = words.length;

    return wordCount;
  }

  private getWeightForNonTextNodes(nonTextNode: string): number {
    if (nonTextNode.includes('oppia-noninteractive-math')) {
      return 1;
    }
    const altTextMatch = nonTextNode.match(/alt-with-value=["']([^"']*)["']/);
    let words = [];
    if (altTextMatch && altTextMatch[1]) {
      const altText = altTextMatch[1];
      words = altText.trim().split(' ');
    }
    return words.length + 2; // +2 as a bonus for images with text.
  }
}
