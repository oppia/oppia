// Copyright 2023 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
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
  ) { }

  nonTextTags = ['oppia-noninteractive-math', 'oppia-noninteractive-image'];
  textTags = ['p', 'ul', 'ol'];

  computeHtmlLengthInWords(htmlString: string): number {
    if (!htmlString) {
      this.loggerService.error('Empty string was passed to compute length');
      return 0;
    }

    const sanitizedHtml = this.sanitizer.sanitize(
      SecurityContext.HTML, htmlString) as string;
    let totalWords = this.calculateBaselineLength(sanitizedHtml);

    const customTags = this.extractCustomTags(htmlString);
    for (const customTag of customTags) {
      totalWords += this.getWeightForNonTextNodes(customTag, false);
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
    let totalCharacters = this.calculateBaselineLength(sanitizedHtml, true);

    const customTags = this.extractCustomTags(htmlString);
    for (const customTag of customTags) {
      totalCharacters += this.getWeightForNonTextNodes(customTag, true);
    }

    return totalCharacters;
  }

  private calculateBaselineLength(
      sanitizedHtml: string, countCharacters: boolean = false): number {
    const domparser = new DOMParser();
    const dom = domparser.parseFromString(sanitizedHtml, 'text/html');
    let totalWeight = 0;

    for (const node of Array.from(dom.body.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        totalWeight += this.getWeightForTextNodes(
          node as Text, countCharacters);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const ltag = (node as HTMLElement).tagName.toLowerCase();
        if (this.textTags.includes(ltag)) {
          totalWeight += this.getWeightForTextNodes(
            node as HTMLElement, countCharacters);
        }
      }
    }

    return totalWeight;
  }


  private getWeightForTextNodes(
      textNode: HTMLElement, countCharacters: boolean): number {
    const textContent = textNode.textContent || '';
    return countCharacters ? textContent.length :
      textContent.trim().split(' ').length;
  }

  private getWeightForNonTextNodes(
      nonTextNode: string, countCharacters: boolean): number {
    if (nonTextNode.includes('oppia-noninteractive-math')) {
      return 1;
    }

    const altTextMatch = nonTextNode.match(/alt-with-value=["']([^"']*)["']/);
    const altText = altTextMatch && altTextMatch[1] ? altTextMatch[1] : '';
    const words = altText.trim().split(' ');

    return countCharacters ? altText.length :
      words.length + 2; // +2 as a bonus for images with text.
  }

  private extractCustomTags(htmlString: string): string[] {
    const domparser = new DOMParser();
    const dom = domparser.parseFromString(htmlString, 'text/html');
    const customTags: string[] = [];

    for (const tag of Array.from(
      dom.querySelectorAll(this.nonTextTags.join(',')))) {
      const sanitizedTag = tag.outerHTML.replace(/"/g, "'");
      customTags.push(sanitizedTag);
    }

    return customTags;
  }
}
