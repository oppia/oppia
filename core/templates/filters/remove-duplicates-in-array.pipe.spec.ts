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
 * @fileoverview Tests for RemoveDuplicatesInArray pipe for Oppia.
 */

import { RemoveDuplicatesInArrayPipe } from './remove-duplicates-in-array.pipe';

describe('Testing RemoveDuplicatesInArrayPipe', () => {
  let pipe: RemoveDuplicatesInArrayPipe;
  beforeEach(() => {
    pipe = new RemoveDuplicatesInArrayPipe();
  });

  it('should have all expected filters', () => {
    expect(pipe).not.toEqual(null);
  });

  it('should correctly remove duplicates in array', () =>{
    expect(pipe.transform(
      ['ca_choices_1', 'ca_choices_2', 'ca_choices_1']))
      .toEqual(['ca_choices_1', 'ca_choices_2']);
    expect(pipe.transform(
      ['ca_choices_1', 'ca_choices_2']))
      .toEqual(['ca_choices_1', 'ca_choices_2']);
    expect(pipe.transform(
      ['ca_choices_1', 'ca_choices_2', 'ca_choices_1', 'ca_choices_2']))
      .toEqual(['ca_choices_1', 'ca_choices_2']);
  });

  it('should throw error when the input is invalid', () => {
    expect(() => {
      // Using unknown type conversion to check if the input is invalid.
      pipe.transform({
        filter: undefined
      } as unknown as string[]);
    }).toThrowError('Bad input for removeDuplicatesInArray: {}');
  });
});
