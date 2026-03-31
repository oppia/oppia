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
 * @fileoverview Service for handling HTML parsing
 * operations focused on image tag detection and comparison.
 */

import isEqual from 'lodash/isEqual';

import {Injectable} from '@angular/core';

export interface ImageDetails {
  filePaths: string[];
  alts: string[];
  descriptions: string[];
}

export class TranslationError {
  constructor(
    private _hasDuplicateAltTexts: boolean,
    private _hasDuplicateDescriptions: boolean,
    private _hasUntranslatedElements: boolean
  ) {}

  get hasDuplicateDescriptions(): boolean {
    return this._hasDuplicateDescriptions;
  }

  get hasDuplicateAltTexts(): boolean {
    return this._hasDuplicateAltTexts;
  }

  get hasUntranslatedElements(): boolean {
    return this._hasUntranslatedElements;
  }
}

@Injectable({
  providedIn: 'root',
})
export class TranslationValidationService {
  private readonly ALLOWED_CUSTOM_TAGS_IN_TRANSLATION_SUGGESTION = [
    'oppia-noninteractive-image',
    'oppia-noninteractive-link',
    'oppia-noninteractive-math',
    'oppia-noninteractive-skillreview',
  ];

  constructor() {}

  getElementAttributeTexts(
    elements: HTMLCollectionOf<Element>,
    type: string
  ): string[] {
    const textWrapperLength = 6;
    const attributes = Array.from(elements, function (element: Element) {
      // A sample element would be as <oppia-noninteractive-image alt-with-value
      // ="&amp;quot;Image description&amp;quot;" caption-with-value=
      // "&amp;quot;Image caption&amp;quot;" filepath-with-value="&amp;quot;
      // img_2021029_210552_zbmdt94_height_54_width_490.png&amp;quot;">
      // </oppia-noninteractive-image>
      if (element.localName === 'oppia-noninteractive-image') {
        const attribute = element.attributes[
          type as keyof NamedNodeMap
        ] as Attr;
        if (!attribute) {
          return null;
        }
        const attributeValue = attribute.value;
        return attributeValue.substring(
          textWrapperLength,
          attributeValue.length - textWrapperLength
        );
      }
    });
    // Typecasted to string[] because Array.from() returns
    // (string | undefined)[] and we need to remove the undefined elements.
    return attributes.filter(attributeValues => attributeValues) as string[];
  }

  getImageAttributeTexts(
    htmlElements: HTMLCollectionOf<Element>
  ): ImageDetails {
    return {
      filePaths: this.getElementAttributeTexts(
        htmlElements,
        'filepath-with-value'
      ),
      alts: this.getElementAttributeTexts(htmlElements, 'alt-with-value'),
      descriptions: this.getElementAttributeTexts(
        htmlElements,
        'caption-with-value'
      ),
    };
  }

  hasSomeDuplicateElements(
    originalElements: string[],
    translatedElements: string[]
  ): boolean {
    const mathEquationRegex = new RegExp(
      /(?:(?:^|[-+_*/=])(?:\s*-?\d+(\.\d+)?(?:[eE][+-]?\d+)?\s*))+$/
    );
    if (originalElements.length === 0) {
      return false;
    }
    const hasMatchingTranslatedElement = (element: string) =>
      translatedElements.includes(element) &&
      originalElements.length > 0 &&
      !mathEquationRegex.test(element);
    return originalElements.some(hasMatchingTranslatedElement);
  }

  validateTranslationFromHtmlStrings(
    originalHtml: string,
    translatedHtml: string
  ): TranslationError {
    const domParser = new DOMParser();
    const originalElements = domParser.parseFromString(
      originalHtml,
      'text/html'
    );
    const translatedElements = domParser.parseFromString(
      translatedHtml,
      'text/html'
    );

    return this.validateTranslation(
      originalElements.getElementsByTagName('*'),
      translatedElements.getElementsByTagName('*')
    );
  }

  isTranslationCompleted(
    originalElements: HTMLCollectionOf<Element>,
    translatedElements: HTMLCollectionOf<Element>
  ): boolean {
    // Checks if there are custom tags present in the original content but not
    // in the translated content.
    const filteredOriginalElements = Array.from(originalElements, el =>
      el.tagName.toLowerCase()
    )
      .filter(tagName =>
        this.ALLOWED_CUSTOM_TAGS_IN_TRANSLATION_SUGGESTION.includes(tagName)
      )
      .sort();
    const filteredTranslatedElements = Array.from(translatedElements, el =>
      el.tagName.toLowerCase()
    )
      .filter(tagName =>
        this.ALLOWED_CUSTOM_TAGS_IN_TRANSLATION_SUGGESTION.includes(tagName)
      )
      .sort();
    return isEqual(filteredOriginalElements, filteredTranslatedElements);
  }

  validateTranslation(
    textToTranslate: HTMLCollectionOf<Element>,
    translatedText: HTMLCollectionOf<Element>
  ): TranslationError {
    const translatedElements: ImageDetails =
      this.getImageAttributeTexts(translatedText);
    const originalElements: ImageDetails =
      this.getImageAttributeTexts(textToTranslate);

    const hasDuplicateAltTexts = this.hasSomeDuplicateElements(
      originalElements.alts,
      translatedElements.alts
    );
    const hasDuplicateDescriptions = this.hasSomeDuplicateElements(
      originalElements.descriptions,
      translatedElements.descriptions
    );
    const hasUntranslatedElements = !this.isTranslationCompleted(
      textToTranslate,
      translatedText
    );

    return new TranslationError(
      hasDuplicateAltTexts,
      hasDuplicateDescriptions,
      hasUntranslatedElements
    );
  }
}
