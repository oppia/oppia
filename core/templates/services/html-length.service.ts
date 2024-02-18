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
    * ['oppia-noninteractive-image', 'oppia-noninteractive-math']
    * The above tags constitutes for non text nodes.
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
   * Computes the length of an HTML string based on
   * the specified calculation type.
   * @param {string} htmlString - The HTML string.
   * @param {CalculationType} calculationType - The calculation
   *  type ('word' or 'character').
   * @returns {number} The computed length of the HTML string.
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
        totalLength += this.getWeightForNonTextNodes(
          customTag, calculationType);
      }
    }
    return totalLength;
  }

  /**
   * Calculates the baseline length of sanitized HTML.
   * @param {string} sanitizedHtml - The sanitized HTML string and
   *  can also process normal string.
   * @param {CalculationType} calculationType - The calculation
   *  type ('word' or 'character').
   * @returns {number} The baseline length of the HTML.
   */

  calculateBaselineLength(
      sanitizedHtml: string, calculationType: CalculationType): number {
    let domparser = new DOMParser();
    let dom: Document;
    dom = domparser.parseFromString(sanitizedHtml, 'text/html');

    let totalWeight = 0;
    for (let tag of Array.from(dom.body.children)) {
      const textContent = tag.textContent || '';
      totalWeight += this.calculateTextWeight(
        textContent, calculationType);
    }
    return totalWeight;
  }

  /**
   * Calculates the weight of text content based on the calculation type.
   * @param {string} textContent - The text content to calculate weight for.
   * @param {CalculationType} calculationType - The calculation
   * type ('word' or 'character').
   * @returns {number} The weight of the text content.
   */

  private calculateTextWeight(
      textContent: string, calculationType: CalculationType): number {
    let trimmedTextContent = textContent.trim();
    let totalWeight = 0;
    if (calculationType === CALCULATION_TYPE_WORD && trimmedTextContent) {
      const words = trimmedTextContent.split(' ');
      totalWeight = words.length;
    } else {
      totalWeight = trimmedTextContent.length;
    }
    return totalWeight;
  }


  /**
   * Calculates the weight for non-text nodes.
   * @param {string} nonTextNode - The non-text node HTML string.
   * @param {CalculationType} calculationType - The calculation
   *  type ('word' or 'character').
   * @returns {number} The weight of the non-text node.
   */

  /* TODO(#19729): Create RTE-component-specific logic
  for calculating the lengths of RTE-components */
  getWeightForNonTextNodes(
      nonTextNode: string, calculationType: CalculationType): number {
    nonTextNode = this.htmlEscaperService.escapedStrToUnescapedStr(nonTextNode);
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
        const textValueAttr = domTag.getAttribute('text-with-value');
        const textValue = textValueAttr ? textValueAttr.slice(1, -1) : '';
        const weight = this.calculateTextWeight(textValue, calculationType);
        return weight;
      }
      case 'oppia-noninteractive-image': {
        const altTextAttr = domTag.getAttribute('alt-with-value');
        const altTextValue = altTextAttr ? altTextAttr.slice(1, -1) : '';
        const weight = this.calculateTextWeight(altTextValue, calculationType);
        return weight + 10;
      }
      default:
        throw new Error(`Invalid non-text node: ${domId}`);
    }
  }
}
