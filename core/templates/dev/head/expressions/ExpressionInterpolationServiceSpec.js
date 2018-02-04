// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ExpressionInterpolationService.
 */

describe('Expression interpolation service', function() {
  beforeEach(module('oppia'));

  describe('expression interpolation service', function() {
    var ExpressionInterpolationService = null;

    beforeEach(inject(function($injector) {
      ExpressionInterpolationService = $injector.get(
        'ExpressionInterpolationService');
    }));

    it('should correctly interpolate and escape HTML strings', function() {
      expect(ExpressionInterpolationService.processHtml('abc', [{}])).toEqual(
        'abc');
      expect(ExpressionInterpolationService.processHtml('abc{{a}}', [{
        a: 'b'
      }])).toEqual('abcb');
      expect(ExpressionInterpolationService.processHtml('abc{{a}}', [{
        a: '<script></script>'
      }])).toEqual('abc&lt;script&gt;&lt;/script&gt;');
      expect(ExpressionInterpolationService.processHtml(
        'abc{{a}}', [{}])
      ).toEqual('abc<oppia-expression-error-tag></oppia-expression-error-tag>');
      expect(ExpressionInterpolationService.processHtml('abc{{a{{b}}}}', [{
        a: '1',
        b: '2'
      }])).toEqual(
        'abc<oppia-expression-error-tag></oppia-expression-error-tag>}}');

      expect(ExpressionInterpolationService.processHtml('abc{{a+b}}', [{
        a: '1',
        b: '2'
      }])).toEqual('abc3');
      expect(ExpressionInterpolationService.processHtml('abc{{a+b}}', [{
        a: '1',
        b: 'hello'
      }])).toEqual(
        'abc<oppia-expression-error-tag></oppia-expression-error-tag>');
    });

    it('should correctly interpolate unicode strings', function() {
      expect(ExpressionInterpolationService.processUnicode(
        'abc', [{}])).toEqual('abc');
      expect(ExpressionInterpolationService.processUnicode('abc{{a}}', [{
        a: 'b'
      }])).toEqual('abcb');
      expect(ExpressionInterpolationService.processUnicode('abc{{a}}', [{
        a: '<script></script>'
      }])).toEqual('abc<script></script>');
      expect(ExpressionInterpolationService.processUnicode(
        'abc{{a}}', [{}])).toBeNull();

      expect(ExpressionInterpolationService.processUnicode('abc{{a+b}}', [{
        a: '1',
        b: '2'
      }])).toEqual('abc3');
      expect(ExpressionInterpolationService.processUnicode('abc{{a+b}}', [{
        a: '1',
        b: 'hello'
      }])).toBeNull();
    });

    it('should correctly get params from strings', function() {
      expect(ExpressionInterpolationService.getParamsFromString(
        'abc')).toEqual([]);
      expect(ExpressionInterpolationService.getParamsFromString(
        'abc{{a}}')).toEqual(['a']);
      expect(ExpressionInterpolationService.getParamsFromString(
        'abc{{a+b}}')).toEqual(['a', 'b']);
    });
  });
});
