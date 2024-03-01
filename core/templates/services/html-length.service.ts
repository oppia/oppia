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

export const CALCULATION_TYPE_WORD = 'word';
export const CALCULATION_TYPE_CHARACTER = 'character';

// eslint-disable-next-line max-len
const CUSTOM_TAG_REGEX = /<oppia-noninteractive-(?:math|image|link|collapsible|video|skillreview|tabs)[^>]*>/g;

type CalculationType =
  typeof CALCULATION_TYPE_WORD | typeof CALCULATION_TYPE_CHARACTER;

import { Injectable, SecurityContext } from '@angular/core';
import { LoggerService } from './contextual/logger.service';
import { DomSanitizer } from '@angular/platform-browser';
import { HtmlEscaperService } from './html-escaper.service';

@Injectable({
  providedIn: 'root'
})
export class HtmlLengthService {
  constructor(
    private loggerService: LoggerService,
    private sanitizer: DomSanitizer,
    private htmlEscaperService: HtmlEscaperService
  ) {}

  /**
    * The below tags constitutes for non text nodes.
    */
  nonTextTags = [
    'oppia-noninteractive-math',
    'oppia-noninteractive-image',
    'oppia-noninteractive-link',
    'oppia-noninteractive-collapsible',
    'oppia-noninteractive-video',
    'oppia-noninteractive-tabs',
    'oppia-noninteractive-skillreview'];

  /**
    * This function calculates the length of a given HTML
    * string. The length can be calculated in two ways,
    * depending on the 'calculationType' parameter:
    * 1. If 'calculationType' is 'word', the function will
    *    count the number of words in the HTML string. A
    *    word is typically defined as a sequence of
    *    characters separated by spaces.
    * 2. If 'calculationType' is 'character', the function
    *    will count the number of characters in the HTML
    *    string. This includes all visible characters,
    *    punctuation, and whitespace.
    * @param {string} htmlString - The HTML string for
    *    which the length is to be calculated.
    * @param {CalculationType} calculationType - The type
    *    of calculation to be performed. It can be either
    *    'word' or 'character'.
    * @returns {number} The calculated length of the HTML
    *    string according to the specified 'calculationType'.
    */
  computeHtmlLength(
      htmlString: string,
      calculationType: CalculationType): number {
    if (!htmlString) {
      this.loggerService.error('Empty string was passed to compute length');
      return 0;
    }

    const sanitizedHtml = this.sanitizer.sanitize(
      SecurityContext.HTML, htmlString) as string;

    // Identify custom tags using regex on the original HTML string.
    const customTags = htmlString.match(CUSTOM_TAG_REGEX);

    let totalLength = this.calculateBaselineLength(
      sanitizedHtml, calculationType);

    if (customTags) {
      for (const customTag of customTags) {
        totalLength += this.getLengthForNonTextNodes(
          customTag, calculationType);
      }
    }
    return totalLength;
  }

  /**
    * This function calculates the baseline length of a
    * sanitized HTML string. The length can be calculated
    * in two ways, depending on the 'calculationType'
    * parameter:
    * 1. If 'calculationType' is 'word'
    * 2. If 'calculationType' is 'character'
    *
    * @param {string} sanitizedHtml - The sanitized HTML
    *    string for which the length is to be calculated.
    *    It can also process normal strings.
    * @param {CalculationType} calculationType - The type
    *    of calculation to be performed. It can be either
    *    'word' or 'character'.
    * @returns {number} The calculated length of the HTML
    *    string according to the specified 'calculationType'.
    */

  calculateBaselineLength(
      sanitizedHtml: string, calculationType: CalculationType): number {
    let domparser = new DOMParser();
    let dom: Document;
    dom = domparser.parseFromString(sanitizedHtml, 'text/html');

    let totalLength = 0;
    for (let tag of Array.from(dom.body.children)) {
    /**
      * Guarding against tag.textContent === null, which can
      * arise in special cases as explained in the following reference:
      * (https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)
      */
      const textContent = tag.textContent || '';
      totalLength += this.calculateTextLength(
        textContent, calculationType);
    }
    return totalLength;
  }

  /**
    * This function calculates the length of a given text content
    * based on the specified calculation type.
    *
    * @param {string} textContent - The text content for which the
    *    length is to be calculated. This is typically a string of
    *    text that may include words, spaces, punctuation, and other
    *    characters.
    * @param {CalculationType} calculationType - The method used to
    *    calculate the length. It can be either 'word' or 'character'.
    *    If 'word', the function counts the number of words in the
    *    text content. If 'character', it counts the number of
    *    characters.
    * @returns {number} The length of the text content. This is
    *    calculated as the number of words or characters in the text
    *    content, depending on the calculation type.
    */

  private calculateTextLength(
      textContent: string, calculationType: CalculationType): number {
    let trimmedTextContent = textContent.trim();
    let totalLength = 0;
    if (calculationType === CALCULATION_TYPE_WORD && trimmedTextContent) {
      const words = trimmedTextContent.split(' ');
      totalLength = words.length;
    } else {
      totalLength = trimmedTextContent.length;
    }
    return totalLength;
  }

  /**
    * This function calculates the length of a given non-text
    * node based on the specified calculation type.
    *
    * @param {string} nonTextNode - The non-text node for which
    *    the length is to be calculated. This is typically an HTML
    *    string that represents a non-text element in the DOM,
    *    such as an image or a video element.
    * @param {CalculationType} calculationType - The method used
    *    to calculate the length. It can be either 'word' or
    *    'character'. If 'word', the function counts the number
    *    of words in the non-text node. If 'character', it counts
    *    the number of characters.
    * @returns {number} The length of the non-text node. This is
    *    calculated as the number of words or characters in the
    *    non-text node, depending on the calculation type.
    */

  // TODO(#19729): Create RTE-component-specific logic
  // for calculating the lengths of RTE-components.
  getLengthForNonTextNodes(
      nonTextNode: string, calculationType: CalculationType): number {
    let domparser = new DOMParser();
    let dom: Document;
    dom = domparser.parseFromString(nonTextNode, 'text/html');
    let domTag = dom.body.children[0];
    let domId = domTag.tagName.toLowerCase();
    switch (domId) {
      case 'oppia-noninteractive-math':
        return 1;
      case 'oppia-noninteractive-collapsible':
      case 'oppia-noninteractive-tabs':
        return 1000;
      case 'oppia-noninteractive-video':
        return 0;
      case 'oppia-noninteractive-link':
      case 'oppia-noninteractive-skillreview': {
        const textValueAttr = domTag.getAttribute('text-with-value') || '';
        const textValue = this.htmlEscaperService.escapedJsonToObj(
          textValueAttr) as string;
        const length = this.calculateTextLength(textValue, calculationType);
        return length;
      }
      case 'oppia-noninteractive-image': {
        const altTextAttr = domTag.getAttribute('alt-with-value') || '';
        const altTextValue = this.htmlEscaperService.escapedJsonToObj(
          altTextAttr) as string;
        const length = this.calculateTextLength(altTextValue, calculationType);
        return length + 10;
      }
      default:
        throw new Error(`Invalid non-text node: ${domId}`);
    }
  }
}
