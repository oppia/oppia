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
    // Identify custom tags using regex on the original HTML string.
    const customTags = htmlString.match(CUSTOM_TAG_REGEX);
    let customTagsLength = (customTags) ? customTags.length : 0;

    /* CustomTagsLength is being passed to calculateBaselineLength()
    method to ensure try-catch block should not raise error if
    we use non-interactive RTE */
    let totalWords = this.calculateBaselineLength(
      sanitizedHtml, CALCULATION_TYPE_WORD, customTagsLength);

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
    // Identify custom tags using regex on the original HTML string.
    const customTags = htmlString.match(CUSTOM_TAG_REGEX);
    let customTagsLength = (customTags) ? customTags.length : 0;

    /* CustomTagsLength is being passed to calculateBaselineLength()
    method to ensure try-catch block should not raise error if
    we use non-interactive RTE */
    let totalCharacters = this.calculateBaselineLength(
      sanitizedHtml, CALCULATION_TYPE_CHARACTER, customTagsLength);

    if (customTags) {
      for (const customTag of customTags) {
        totalCharacters += this.getWeightForNonTextNodes(
          customTag, CALCULATION_TYPE_CHARACTER);
      }
    }
    return totalCharacters;
  }

  calculateBaselineLength(
      sanitizedHtml: string,
      calculationType: CalculationType, CustomTagsLength: number): number {
    let domparser = new DOMParser();
    let dom: Document;
    try {
      dom = domparser.parseFromString(sanitizedHtml, 'text/html');
      if (dom.body.children.length === 0 && !CustomTagsLength) {
        throw new Error(
          'No HTML tags found. Ensure ' +
          'that a valid string that includes HTML tags is provided.');
      }
    } catch (error) {
      throw new Error(
        'Failed to parse HTML string.' +
        ' Ensure that a valid string that includes HTML tags is provided.');
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
    const textContent = textNode.textContent || '';
    return this.calculateTextWeight(textContent, calculationType);
  }

  private calculateTextWeight(
      textContent: string, calculationType: CalculationType): number {
    let trimmedTextContent = textContent.trim();
    let textContentCount = 0;
    if (calculationType === CALCULATION_TYPE_WORD && trimmedTextContent) {
      const words = trimmedTextContent.split(' ');
      textContentCount = words.length;
    } else {
      textContentCount = trimmedTextContent.length;
    }
    return textContentCount;
  }

  /* TODO(#19729): Create RTE-component-specific logic
  for calculating the lengths of RTE-components */
  getWeightForNonTextNodes(
      nonTextNode: string, calculationType: CalculationType): number {
    let domparser = new DOMParser();
    let dom: Document;
    dom = domparser.parseFromString(nonTextNode, 'text/html');
    let domTag = dom.body.children[0];
    let domId = domTag.tagName.toLowerCase();
    if (domId === 'oppia-noninteractive-math') {
      return 1;
    } else if ((domId === 'oppia-noninteractive-collapsible') ||
     (domId === 'oppia-noninteractive-tabs')) {
      return 1000;
    } else if (domId === 'oppia-noninteractive-video') {
      return 0;
    } else if ((domId === 'oppia-noninteractive-link') ||
    (domId === 'oppia-noninteractive-skillreview') ||
    (domId === 'oppia-noninteractive-image')) {
      const textMatch = nonTextNode.match(
        /(text-with-value|alt-with-value)="&amp;quot;([^&]*)&amp;quot;"/);
      if (textMatch && textMatch[2]) {
        const text = textMatch[2];
        const weight = this.calculateTextWeight(text, calculationType);
        return (domId === 'oppia-noninteractive-image') ? weight + 10 : weight;
      }
    } else {
      throw new Error('Unable to determine weight for non-text node.');
    }
    /* istanbul ignore next */
    throw new Error('Unable to determine weight for non-text node.');
  }
}
