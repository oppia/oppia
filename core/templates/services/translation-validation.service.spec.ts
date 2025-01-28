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
 * @fileoverview Unit tests for TranslationValidationService.
 */

import {TestBed} from '@angular/core/testing';
import {TranslationValidationService} from './translation-validation.service';

describe('TranslationValidationService', () => {
  let translationValidationService: TranslationValidationService;

  const htmlWithComponents = `
    <p>Content with components</p>
    <oppia-noninteractive-image
      alt-with-value="&amp;quot;Image description&amp;quot;"
      caption-with-value="&amp;quot;Image caption&amp;quot;"
      filepath-with-value="&amp;quot;img_20241109_030945_oc195e5356_height_350_width_450.svg&amp;quot;">
    </oppia-noninteractive-image>
    <oppia-noninteractive-math 
      math_content-with-value="{\u0026amp;quot;raw_latex\u0026amp;quot;:\u0026amp;quot;\\\\frac{x}{y}\u0026amp;quot;,\u0026amp;quot;svg_filename\u0026amp;quot;:\u0026amp;quot;mathImg_20250126_225215_x5vy0sjj6v_height_3d205_width_1d784_vertical_1d306.svg\u0026amp;quot;}">
    </oppia-noninteractive-math>
    <oppia-noninteractive-skillreview 
      skill_id-with-value="&amp;quot;wfLsQD3CTfrI&amp;quot;" 
      text-with-value="&amp;quot;concept card&amp;quot;">
    </oppia-noninteractive-skillreview>
  `;
  const htmlWithoutComponents = '<p>Content without components</p>';
  const htmlWithMultipleComponents = `
  <p>Content with multiple components</p>
  <oppia-noninteractive-image
    alt-with-value="&amp;quot;Image 1&amp;quot;"
    caption-with-value="&amp;quot;Image 1 caption&amp;quot;"
    filepath-with-value="&amp;quot;img1.svg&amp;quot;">
  </oppia-noninteractive-image>
  <oppia-noninteractive-image
    alt-with-value="&amp;quot;Image 2&amp;quot;"
    caption-with-value="&amp;quot;Image 2 caption&amp;quot;"
    filepath-with-value="&amp;quot;img2.svg&amp;quot;">
  </oppia-noninteractive-image>
  <oppia-noninteractive-math 
    math_content-with-value="{\u0026amp;quot;raw_latex\u0026amp;quot;:\u0026amp;quot;\\\\frac{x}{y}\u0026amp;quot;}">
  </oppia-noninteractive-math>
  <oppia-noninteractive-math 
    math_content-with-value="{\u0026amp;quot;raw_latex\u0026amp;quot;:\u0026amp;quot;\\\\frac{a}{b}\u0026amp;quot;}">
  </oppia-noninteractive-math>
  <oppia-noninteractive-skillreview 
    skill_id-with-value="&amp;quot;skill1&amp;quot;"
    text-with-value="&amp;quot;concept card 1&amp;quot;">
  </oppia-noninteractive-skillreview>
  <oppia-noninteractive-skillreview 
    skill_id-with-value="&amp;quot;skill2&amp;quot;"
    text-with-value="&amp;quot;concept card 2&amp;quot;">
  </oppia-noninteractive-skillreview>
  `;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    translationValidationService = TestBed.inject(TranslationValidationService);
  });

  describe('getElementAttributeTexts', () => {
    it('should extract image attributes correctly', () => {
      const domParser = new DOMParser();
      const elements = domParser
        .parseFromString(htmlWithComponents, 'text/html')
        .getElementsByTagName('*');

      const result = translationValidationService.getElementAttributeTexts(
        elements,
        'filepath-with-value'
      );
      expect(result.length).toBe(1);
      expect(result[0]).toBe(
        'img_20241109_030945_oc195e5356_height_350_width_450.svg'
      );
    });

    it('should handle missing attributes', () => {
      const domParser = new DOMParser();
      const elements = domParser
        .parseFromString(
          '<oppia-noninteractive-image></oppia-noninteractive-image>',
          'text/html'
        )
        .getElementsByTagName('*');

      const result = translationValidationService.getElementAttributeTexts(
        elements,
        'filepath-with-value'
      );
      expect(result.length).toBe(0);
    });
  });

  describe('isTranslationCompleted', () => {
    it('should return true for matching components', () => {
      const domParser = new DOMParser();
      const originalElements = domParser
        .parseFromString(htmlWithComponents, 'text/html')
        .getElementsByTagName('*');
      const translatedElements = domParser
        .parseFromString(htmlWithComponents, 'text/html')
        .getElementsByTagName('*');

      expect(
        translationValidationService.isTranslationCompleted(
          originalElements,
          translatedElements
        )
      ).toBeTrue();
    });

    it('should return false for mismatched components', () => {
      const domParser = new DOMParser();
      const originalElements = domParser
        .parseFromString(htmlWithComponents, 'text/html')
        .getElementsByTagName('*');
      const translatedElements = domParser
        .parseFromString(htmlWithoutComponents, 'text/html')
        .getElementsByTagName('*');

      expect(
        translationValidationService.isTranslationCompleted(
          originalElements,
          translatedElements
        )
      ).toBeFalse();
    });
  });

  describe('validateTranslation', () => {
    it('should validate content with matching components', () => {
      const domParser = new DOMParser();
      const originalElements = domParser
        .parseFromString(htmlWithComponents, 'text/html')
        .getElementsByTagName('*');
      const translatedElements = domParser
        .parseFromString(htmlWithComponents, 'text/html')
        .getElementsByTagName('*');

      const result = translationValidationService.validateTranslation(
        originalElements,
        translatedElements
      );
      expect(result.hasUntranslatedElements).toBeFalse();
      expect(result.hasDuplicateAltTexts).toBeTrue();
      expect(result.hasDuplicateDescriptions).toBeTrue();
    });

    it('should detect missing components in translation', () => {
      const domParser = new DOMParser();
      const originalElements = domParser
        .parseFromString(htmlWithComponents, 'text/html')
        .getElementsByTagName('*');
      const translatedElements = domParser
        .parseFromString(htmlWithoutComponents, 'text/html')
        .getElementsByTagName('*');

      const result = translationValidationService.validateTranslation(
        originalElements,
        translatedElements
      );
      expect(result.hasUntranslatedElements).toBeTrue();
    });

    it('should validate when original has no components', () => {
      const domParser = new DOMParser();
      const originalElements = domParser
        .parseFromString(htmlWithoutComponents, 'text/html')
        .getElementsByTagName('*');
      const translatedElements = domParser
        .parseFromString(htmlWithoutComponents, 'text/html')
        .getElementsByTagName('*');

      const result = translationValidationService.validateTranslation(
        originalElements,
        translatedElements
      );
      expect(result.hasUntranslatedElements).toBeFalse();
      expect(result.hasDuplicateAltTexts).toBeFalse();
      expect(result.hasDuplicateDescriptions).toBeFalse();
    });

    it('should validate multiple components correctly', () => {
      const domParser = new DOMParser();
      const originalElements = domParser
        .parseFromString(htmlWithMultipleComponents, 'text/html')
        .getElementsByTagName('*');
      const translatedElements = domParser
        .parseFromString(htmlWithMultipleComponents, 'text/html')
        .getElementsByTagName('*');

      const result = translationValidationService.validateTranslation(
        originalElements,
        translatedElements
      );
      expect(result.hasUntranslatedElements).toBeFalse();
      expect(result.hasDuplicateAltTexts).toBeTrue();
      expect(result.hasDuplicateDescriptions).toBeTrue();
    });

    it('should detect when translation adds extra components', () => {
      const domParser = new DOMParser();
      const originalElements = domParser
        .parseFromString(htmlWithoutComponents, 'text/html')
        .getElementsByTagName('*');
      const translatedElements = domParser
        .parseFromString(htmlWithComponents, 'text/html')
        .getElementsByTagName('*');

      const result = translationValidationService.validateTranslation(
        originalElements,
        translatedElements
      );
      expect(result.hasUntranslatedElements).toBeTrue();
    });
  });
});
