// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for NormalizeWhitespacePunctuationAndCase pipe for Oppia.
 */

import { NormalizeWhitespacePunctuationAndCasePipe } from
  './normalize-whitespace-punctuation-and-case.pipe';
import { TestBed } from '@angular/core/testing';

describe('Testing NormalizeWhitespacePunctuationAndCasePipe', () => {
  let nwpcp: NormalizeWhitespacePunctuationAndCasePipe;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NormalizeWhitespacePunctuationAndCasePipe]
    });
    nwpcp = TestBed.inject(NormalizeWhitespacePunctuationAndCasePipe);
  });

  it('should have all expected pipes', () => {
    expect(nwpcp).not.toEqual(null);
  });

  it('should normalize spaces and turn characters to lower case', () => {
    expect(nwpcp.transform('')).toEqual('');

    expect(nwpcp.transform('  remove '))
      .toEqual('remove');

    //  Should remove the space if it does not
    //  separate two alphanumeric "words".
    expect(nwpcp.transform('  remove ? '))
      .toEqual('remove?');
    expect(nwpcp.transform(' Hello, world '))
      .toEqual('hello,world');
    expect(nwpcp.transform('  Test1 tesT2 teSt3 '))
      .toEqual('test1 test2 test3');
    expect(nwpcp.transform('  Test1 tesT2! teSt3 '))
      .toEqual('test1 test2!test3');

    expect(nwpcp.transform(' teSTstrinG12  '))
      .toEqual('teststring12');
    expect(nwpcp.transform(' tesT1 teSt2 '))
      .toEqual('test1 test2');

    expect(nwpcp.transform('tesT1\n teSt2'))
      .toEqual('test1\ntest2');
  });
});
