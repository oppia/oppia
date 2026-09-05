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
 * @fileoverview Unit tests for MathFormulaDetectionService.
 */

import {TestBed} from '@angular/core/testing';
import {MathFormulaDetectionService} from 'services/math-formula-detection.service';

describe('Math Formula Detection Service', () => {
  let mathFormulaDetectionService: MathFormulaDetectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MathFormulaDetectionService],
    });
    mathFormulaDetectionService = TestBed.inject(MathFormulaDetectionService);
  });

  describe('isFormulaAsText', () => {
    it('should return true when formula is written as plain text', () => {
      expect(
        mathFormulaDetectionService.isFormulaAsText('3 + 6 = 9')
      ).toBeTrue();
      expect(
        mathFormulaDetectionService.isFormulaAsText(
          '<p>Addition</p><p>9 = 6 + 3</p>'
        )
      ).toBeTrue();
      expect(
        mathFormulaDetectionService.isFormulaAsText('<p>x - y = z</p>')
      ).toBeTrue();
      expect(
        mathFormulaDetectionService.isFormulaAsText('Addition\n9 = 6 + 3')
      ).toBeTrue();
    });

    it('should return false when formula is inside noninteractive math component', () => {
      const mathHtml =
        '<oppia-noninteractive-math></oppia-noninteractive-math>';
      expect(mathFormulaDetectionService.isFormulaAsText(mathHtml)).toBeFalse();
    });

    it('should return true when there is a plain text formula alongside a math component', () => {
      const mathHtml =
        '<oppia-noninteractive-math></oppia-noninteractive-math> <p>3 + 6 = 9</p>';
      expect(mathFormulaDetectionService.isFormulaAsText(mathHtml)).toBeTrue();
    });

    it('should return true when formula is inside an array of strings', () => {
      expect(
        mathFormulaDetectionService.isFormulaAsText([
          'Normal text',
          '3 + 6 = 9',
        ])
      ).toBeTrue();
    });

    it('should return false for normal text without math formulas', () => {
      expect(
        mathFormulaDetectionService.isFormulaAsText('Compare causes - effects')
      ).toBeFalse();
      expect(
        mathFormulaDetectionService.isFormulaAsText(
          'Just normal sentence without formula.'
        )
      ).toBeFalse();
      expect(
        mathFormulaDetectionService.isFormulaAsText(
          'First line normal\nSecond line normal'
        )
      ).toBeFalse();
    });

    it('should return false for empty or non-string inputs', () => {
      expect(mathFormulaDetectionService.isFormulaAsText('')).toBeFalse();
      expect(mathFormulaDetectionService.isFormulaAsText([])).toBeFalse();
    });
  });
});
