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
 * @fileoverview Tests for NormalizeWhitespace pipe for Oppia.
 */

import { NormalizeWhitespacePipe } from
  'filters/string-utility-filters/normalize-whitespace.pipe';
import { TestBed } from '@angular/core/testing';

describe('Testing NormalizeWhitespacePipe', () => {
  let nwp: NormalizeWhitespacePipe;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NormalizeWhitespacePipe]
    });
    nwp = TestBed.inject(NormalizeWhitespacePipe);
  });

  it('should have all expected pipes', () => {
    expect(nwp).not.toEqual(null);
  });

  it('should correctly normalize whitespace', () => {
    expect(nwp.transform('a')).toEqual('a');
    expect(nwp.transform('a  ')).toEqual('a');
    expect(nwp.transform('  a')).toEqual('a');
    expect(nwp.transform('  a  ')).toEqual('a');

    expect(nwp.transform('a  b ')).toEqual('a b');
    expect(nwp.transform('  a  b ')).toEqual('a b');
    expect(nwp.transform('  ab c ')).toEqual('ab c');
  });
});
