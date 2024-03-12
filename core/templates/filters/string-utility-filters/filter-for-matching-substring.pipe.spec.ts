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
 * @fileoverview Tests for CamelCaseToHyphens pipe for Oppia.
 */

import {FilterForMatchingSubstringPipe} from 'filters/string-utility-filters/filter-for-matching-substring.pipe';

describe('Testing FilterForMatchingSubstringPipe', () => {
  let pipe: FilterForMatchingSubstringPipe;
  beforeEach(() => {
    pipe = new FilterForMatchingSubstringPipe();
  });

  it('should have all expected pipes', () => {
    expect(pipe).not.toEqual(null);
  });

  it('should get items that contain input', () => {
    let list = ['cat', 'dog', 'caterpillar'];
    expect(pipe.transform(list, 'cat')).toEqual(['cat', 'caterpillar']);
    expect(pipe.transform(list, 'dog')).toEqual(['dog']);
    expect(pipe.transform(list, 'c')).toEqual(['cat', 'caterpillar']);
  });

  it('should not get items that do not contain input', () => {
    let list = ['cat', 'dog', 'caterpillar'];
    expect(pipe.transform(list, 'puppy')).toEqual([]);
  });

  it('should get items that contain numerical input', () => {
    let list = ['c4t', 'd0g', 'c4terpill4r'];
    expect(pipe.transform(list, '4')).toEqual(['c4t', 'c4terpill4r']);
    expect(pipe.transform(list, '4t')).toEqual(['c4t', 'c4terpill4r']);
  });

  it('should get items that contain punctuation input', () => {
    let list = ['.', 'dog.', 'cat..and..dog'];
    expect(pipe.transform(list, '.')).toEqual(['.', 'dog.', 'cat..and..dog']);
    expect(pipe.transform(list, '..')).toEqual(['cat..and..dog']);
  });

  it('should get items when input is a space', () => {
    let list = ['cat and dog', 'dog', 'caterpillar', 'cat  and dog', '  '];
    expect(pipe.transform(list, ' ')).toEqual([
      'cat and dog',
      'cat  and dog',
      '  ',
    ]);
    expect(pipe.transform(list, '  ')).toEqual(['cat  and dog', '  ']);
  });

  it('should give all items when input is empty', () => {
    let list = ['cat', 'dog', 'caterpillar'];
    expect(pipe.transform(list, '')).toEqual(list);
  });
});
