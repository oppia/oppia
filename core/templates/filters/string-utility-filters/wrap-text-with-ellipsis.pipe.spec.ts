// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the WrapTextWithEllipsisPipe for Oppia.
 */

import {TestBed} from '@angular/core/testing';

import {NormalizeWhitespacePipe} from 'filters/string-utility-filters/normalize-whitespace.pipe';
import {WrapTextWithEllipsisPipe} from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';

describe('Testing filters', function () {
  let wrapTextWithEllipsis: WrapTextWithEllipsisPipe;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WrapTextWithEllipsisPipe, NormalizeWhitespacePipe],
    });

    wrapTextWithEllipsis = TestBed.get(WrapTextWithEllipsisPipe);
  });

  it('should wrap text with ellipses based on its length', () => {
    expect(wrapTextWithEllipsis.transform('testing', 0)).toEqual('testing');
    expect(wrapTextWithEllipsis.transform('testing', 1)).toEqual('testing');
    expect(wrapTextWithEllipsis.transform('testing', 2)).toEqual('testing');
    expect(wrapTextWithEllipsis.transform('testing', 3)).toEqual('...');
    expect(wrapTextWithEllipsis.transform('testing', 4)).toEqual('t...');
    expect(wrapTextWithEllipsis.transform('testing', 7)).toEqual('testing');
    expect(
      wrapTextWithEllipsis.transform('Long sentence which goes on and on.', 80)
    ).toEqual('Long sentence which goes on and on.');
    expect(
      wrapTextWithEllipsis.transform('Long sentence which goes on and on.', 20)
    ).toEqual('Long sentence whi...');
    expect(
      wrapTextWithEllipsis.transform(
        'Sentence     with     long     spacing.',
        20
      )
    ).toEqual('Sentence with lon...');
    expect(
      wrapTextWithEllipsis.transform('With space before ellipsis.', 21)
    ).toEqual('With space before...');
  });
});
