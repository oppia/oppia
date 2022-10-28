// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for SortBy pipe for Oppia.
 */

import { SortByPipe } from 'filters/string-utility-filters/sort-by.pipe';
import { TestBed } from '@angular/core/testing';

describe('Sort By Pipe', () => {
  let multidimensionalArray = [{
    impact: 0,
    picture_data_url: 'creatorA-url',
    username: 'Bucky',
  },
  {
    impact: 1,
    picture_data_url: 'creatorB-url',
    username: 'Arrow',
  },
  {
    impact: 3,
    picture_data_url: 'same-url',
    username: 'Deadpool',
  },
  {
    impact: 2,
    picture_data_url: 'same-url',
    username: 'Captain America',
  }];

  let sortByPipe: SortByPipe;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SortByPipe]
    });
    sortByPipe = TestBed.inject(SortByPipe);
  });

  it('should have all expected pipes', () => {
    expect(sortByPipe).not.toEqual(null);
  });

  it('should sort single dimension integer' +
    ' array in ascending order', () => {
    let numberArray = [1, 4, 3, 5, 2];
    let result = sortByPipe.transform(numberArray, false);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('should sort single dimension integer array' +
    ' in descending order', () => {
    let numberArray = [1, 4, 3, 5, 2];
    let result = sortByPipe.transform(numberArray, true);
    expect(result).toEqual([5, 4, 3, 2, 1]);
  });

  it('should sort single dimension character array' +
    ' in ascending order', () => {
    let charArray = ['b', 'c', 'a', 'd', 'e'];
    let result = sortByPipe.transform(charArray, false);
    expect(result).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('should sort single dimension character array' +
    ' in descending order', () => {
    let charArray = ['b', 'c', 'a', 'd', 'e'];
    let result = sortByPipe.transform(charArray, true);
    expect(result).toEqual(['e', 'd', 'c', 'b', 'a']);
  });

  it('should sort multi dimensional array with integer attribute' +
    ' in ascending order', () => {
    let result = sortByPipe.transform(
      multidimensionalArray, false, 'impact');
    result.forEach((value, index) => {
      if (index === 0) {
        expect(value.impact).toBe(0);
      }
      if (index === 1) {
        expect(value.impact).toBe(1);
      }
      if (index === 2) {
        expect(value.impact).toBe(2);
      }
      if (index === 3) {
        expect(value.impact).toBe(3);
      }
    });
  });

  it('should sort multi dimensional array with integer attribute' +
    ' in descending order', () => {
    let result = sortByPipe.transform(
      multidimensionalArray, true, 'impact');
    result.forEach((value, index) => {
      if (index === 0) {
        expect(value.impact).toBe(3);
      }
      if (index === 1) {
        expect(value.impact).toBe(2);
      }
      if (index === 2) {
        expect(value.impact).toBe(1);
      }
      if (index === 3) {
        expect(value.impact).toBe(0);
      }
    });
  });

  it('should sort multi dimensional array with string attribute' +
    ' in ascending order', () => {
    let result = sortByPipe.transform(
      multidimensionalArray, false, 'username');
    result.forEach((value, index) => {
      if (index === 0) {
        expect(value.username).toBe('Arrow');
      }
      if (index === 1) {
        expect(value.username).toBe('Bucky');
      }
      if (index === 2) {
        expect(value.username).toBe('Captain America');
      }
      if (index === 3) {
        expect(value.username).toBe('Deadpool');
      }
    });
  });

  it('should sort multi dimensional array with string attribute' +
    ' in descending order', () => {
    let result = sortByPipe.transform(
      multidimensionalArray, true, 'username');
    result.forEach((value, index) => {
      if (index === 0) {
        expect(value.username).toBe('Deadpool');
      }
      if (index === 1) {
        expect(value.username).toBe('Captain America');
      }
      if (index === 2) {
        expect(value.username).toBe('Bucky');
      }
      if (index === 3) {
        expect(value.username).toBe('Arrow');
      }
    });
  });

  it('should return back the current value if' +
    ' sortKey values matches', () => {
    let result = sortByPipe.transform(
      multidimensionalArray, false, 'picture_data_url');
    result.forEach((value, index) => {
      if (index === 0) {
        expect(value.picture_data_url).toBe('creatorA-url');
      }
      if (index === 1) {
        expect(value.picture_data_url).toBe('creatorB-url');
      }
      if (index === 2) {
        expect(value.picture_data_url).toBe('same-url');
      }
      if (index === 3) {
        expect(value.picture_data_url).toBe('same-url');
      }
    });
    expect(result).toEqual(multidimensionalArray);
  });

  it('should return the reversed array if given sortKey is default', () => {
    let result = sortByPipe.transform(
      multidimensionalArray, true, 'default');
    expect(result).toEqual(multidimensionalArray.reverse());
  });
});
