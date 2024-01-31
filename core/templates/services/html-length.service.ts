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

const CALCULATION_TYPE_WORD = 'word';
const CALCULATION_TYPE_CHARACTER = 'character';

// eslint-disable-next-line max-len
const CUSTOM_TAG_REGEX = /<oppia-noninteractive-(?:math|image|link|collapsible|video|skillreview|tabs)[^>]*>/g;

type CalculationType =
 typeof CALCULATION_TYPE_WORD | typeof CALCULATION_TYPE_CHARACTER;

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
  nonTextTags = ['oppia-noninteractive-math',
    'oppia-noninteractive-image',
    'oppia-noninteractive-link',
    'oppia-noninteractive-collapsible',
    'oppia-noninteractive-video',
    'oppia-noninteractive-tabs',
    'oppia-noninteractive-skillreview'];

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
    let totalWords = this.calculateBaselineLength(
      sanitizedHtml, CALCULATION_TYPE_WORD);
    // Identify custom tags using regex on the original HTML string.
    const customTags = htmlString.match(CUSTOM_TAG_REGEX);

    if (customTags) {
      for (const customTag of customTags) {
        totalWords += this.getWeightForNonTextNodes(
          customTag, CALCULATION_TYPE_WORD);
      }
    }
    return totalWords;
  }

  computeHtmlLengthInCharacters(htmlString: string): number {
    if (!htmlString) {
      this.loggerService.error('Empty string was passed to compute length');
      return 0;
    }
    const sanitizedHtml = this.sanitizer.sanitize(
      SecurityContext.HTML, htmlString) as string;
    let totalCharacters =
    this.calculateBaselineLength(sanitizedHtml, CALCULATION_TYPE_CHARACTER);
    // Identify custom tags using regex on the original HTML string.
    const customTags = htmlString.match(CUSTOM_TAG_REGEX);

    if (customTags) {
      for (const customTag of customTags) {
        totalCharacters += this.getWeightForNonTextNodes(
          customTag, CALCULATION_TYPE_CHARACTER);
      }
    }
    return totalCharacters;
  }

  private calculateBaselineLength(
      sanitizedHtml: string, calculationType: CalculationType): number {
    let domparser = new DOMParser();
    let dom: Document;
    try {
      dom = domparser.parseFromString(sanitizedHtml, 'text/html');
    } catch (error) {
      throw new Error(
        'Failed to parse HTML string.' +
        'Ensure valid HTML tags string is provided.');
    }
    let totalWeight = 0;
    for (let tag of Array.from(dom.body.children)) {
      const ltag = tag.tagName.toLowerCase();
      if (this.textTags.includes(ltag)) {
        totalWeight +=
        this.getWeightForTextNodes(tag as HTMLElement, calculationType);
      }
    }
    return totalWeight;
  }

  private getWeightForTextNodes(
      textNode: HTMLElement, calculationType: CalculationType): number {
    const textContent = (textNode.textContent || '').trim();
    return (textContent === '') ? 0 :
        this.textWeightCalculation(textContent, calculationType);
  }

  private textWeightCalculation(
      textContent: string, calculationType: CalculationType): number {
    let trimmedTextContent = textContent.trim();
    let textContentCount = 0;
    if (calculationType === CALCULATION_TYPE_WORD) {
      const words = trimmedTextContent.split('\n').join('').split(' ');
      textContentCount = words.length;
    } else if (calculationType === CALCULATION_TYPE_CHARACTER) {
      const characters = trimmedTextContent.split('\n').join('').split('');
      textContentCount = characters.length;
    }
    return textContentCount;
  }

  private getWeightForNonTextNodes(
      nonTextNode: string, calculationType: CalculationType): number {
    if (nonTextNode.includes('oppia-noninteractive-math')) {
      return 1;
    } else if (nonTextNode.includes(
      'oppia-noninteractive-collapsible') || nonTextNode.includes(
      'oppia-noninteractive-tabs')) {
      return 1000;
    } else if (nonTextNode.includes('oppia-noninteractive-video')) {
      return 0;
    } else {
      const textMatch = nonTextNode.match(
        /(text-with-value|alt-with-value)="&amp;quot;([^&]*)&amp;quot;"/);
      if (textMatch && textMatch[2]) {
        const text = textMatch[2];
        const weight = this.textWeightCalculation(text, calculationType);
        return nonTextNode.includes(
          'oppia-noninteractive-image') ? weight + 10 : weight;
      } else {
        throw new Error('Unable to determine weight for non-text node.');
      }
    }
  }
}
