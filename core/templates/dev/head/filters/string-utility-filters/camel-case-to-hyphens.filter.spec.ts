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
 * @fileoverview Tests for CamelCaseToHyphens filter for Oppia.
 */

import { TestBed } from '@angular/core/testing';
import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';

describe('Testing filters', () => {
  let camelCaseToHyphensPipe: CamelCaseToHyphensPipe ;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe]
    });
    camelCaseToHyphensPipe = new CamelCaseToHyphensPipe();
  });

  it('should have all expected filters', () => {
    expect(camelCaseToHyphensPipe).not.toEqual(null);
  });

  it('should convert camelCase to hyphens properly', () => {
    expect(camelCaseToHyphensPipe.transform('test')).toEqual('test');
    expect(camelCaseToHyphensPipe.transform('testTest')).toEqual('test-test');
    expect(camelCaseToHyphensPipe.transform('testTestTest'))
      .toEqual('test-test-test');
    expect(camelCaseToHyphensPipe.transform('aBaBCa')).toEqual('a-ba-b-ca');
    expect(camelCaseToHyphensPipe.transform('AbcDefGhi'))
      .toEqual('abc-def-ghi');
  });
});
