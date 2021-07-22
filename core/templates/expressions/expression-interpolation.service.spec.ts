
// Copyright 2020 The Oppia Authors. All Rights Reserved.
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

import { HttpClientTestingModule } from
  '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ExpressionInterpolationService } from
  'expressions/expression-interpolation.service';

describe('expression interpolation service', ()=> {
  let expressionInterpolationService: ExpressionInterpolationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    expressionInterpolationService =
      TestBed.get(ExpressionInterpolationService);
  });

  it('should correctly interpolate and escape HTML strings', ()=> {
    expect(expressionInterpolationService.processHtml('abc', [{}])).toEqual(
      'abc');
    expect(expressionInterpolationService.processHtml('abc{{a}}', [{
      a: 'b'
    }])).toEqual('abcb');
    expect(expressionInterpolationService.processHtml('abc{{a}}', [{
      a: '<script></script>'
    }])).toEqual('abc&lt;script&gt;&lt;/script&gt;');
    expect(expressionInterpolationService.processHtml(
      'abc{{a}}', [{}])
    ).toEqual('abc<oppia-expression-error-tag></oppia-expression-error-tag>');
    expect(expressionInterpolationService.processHtml('abc{{a{{b}}}}', [{
      a: '1',
      b: '2'
    }])).toEqual(
      'abc<oppia-expression-error-tag></oppia-expression-error-tag>}}');

    expect(expressionInterpolationService.processHtml('abc{{a+b}}', [{
      a: '1',
      b: '2'
    }])).toEqual('abc3');
    expect(expressionInterpolationService.processHtml('abc{{a+b}}', [{
      a: '1',
      b: 'hello'
    }])).toEqual(
      'abc<oppia-expression-error-tag></oppia-expression-error-tag>');
  });

  it('should correctly interpolate unicode strings', ()=> {
    expect(expressionInterpolationService.processUnicode(
      'abc', [{}])).toEqual('abc');
    expect(expressionInterpolationService.processUnicode('abc{{a}}', [{
      a: 'b'
    }])).toEqual('abcb');
    expect(expressionInterpolationService.processUnicode('abc{{a}}', [{
      a: '<script></script>'
    }])).toEqual('abc<script></script>');
    expect(expressionInterpolationService.processUnicode(
      'abc{{a}}', [{}])).toBeNull();

    expect(expressionInterpolationService.processUnicode('abc{{a+b}}', [{
      a: '1',
      b: '2'
    }])).toEqual('abc3');
    expect(expressionInterpolationService.processUnicode('abc{{a+b}}', [{
      a: '1',
      b: 'hello'
    }])).toBeNull();
  });

  it('should correctly get params from strings', ()=> {
    expect(expressionInterpolationService.getParamsFromString(
      'abc')).toEqual([]);
    expect(expressionInterpolationService.getParamsFromString(
      'abc{{a}}')).toEqual(['a']);
    expect(expressionInterpolationService.getParamsFromString(
      'abc{{a+b}}')).toEqual(['a', 'b']);
  });
});
