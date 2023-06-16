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
import { DomSanitizer} from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class HtmlLengthService {
  constructor(
    private loggerService: LoggerService,
    private _sanitizer: DomSanitizer
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
    const sanitizedHtml = this._sanitizer.sanitize(
      SecurityContext.HTML, htmlString) as string;
    let domparser = new DOMParser();
    let dom = domparser.parseFromString(sanitizedHtml, 'text/html');

    const tagList = Array.from(dom.body.querySelectorAll(
      'p,ul,ol,oppia-noninteractive-image,oppia-noninteractive-math'));
    let totalWeight = 0;
    for (let tag of tagList) {
      const ltag = tag.tagName.toLowerCase();
      if (this.textTags.includes(ltag)) {
        totalWeight += this.getWeightForTextNodes(tag as HTMLElement);
      }
      if (this.nonTextTags.includes(ltag)) {
        totalWeight += this.getWeightForNonTextNodes(tag as HTMLElement);
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

  private getWeightForNonTextNodes(nonTextNode: HTMLElement): number {
    if (nonTextNode.tagName.toLowerCase() === 'oppia-noninteractive-math') {
      return 1;
    }
    // <oppia-noninteractive-image>
    const altText = nonTextNode.getAttribute('alt-with-value');
    let wordCount = 0;
    if (altText) {
      wordCount = altText.trim().split(' ').length;
    }
    // +2 is a bonus for images as sometimes images have text
    // which needs to be translated as well.
    return wordCount + 2;
  }
}
