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
 * @fileoverview Unit Tests for utility functions used in Angular.
 */

import { TestBed } from '@angular/core/testing';
import { MockTranslatePipe } from './unit-test-utils';
import { MockCapitalizePipe } from './unit-test-utils';

describe('Testing MockTranslatePipe', () => {
  let mtp: MockTranslatePipe;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockTranslatePipe]
    });
    mtp = TestBed.inject(MockTranslatePipe);
  });

  it('should have all expected pipes', () => {
    expect(mtp).not.toEqual(null);
  });

  it('should return same value', () => {
    expect(mtp.transform('a')).toEqual('a');
    expect(mtp.transform('abc')).toEqual('abc');
  });
});

describe('Testing MockCapitalizePipe', () => {
  let mcp: MockCapitalizePipe;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockCapitalizePipe]
    });
    mcp = TestBed.inject(MockCapitalizePipe);
  });

  it('should have all expected pipes', () => {
    expect(mcp).not.toEqual(null);
  });

  it('should return same value', () => {
    expect(mcp.transform('a')).toEqual('a');
    expect(mcp.transform('abc')).toEqual('abc');
  });
});
