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
 * @fileoverview Unit tests for Validators Service.
 */

import { TestBed } from '@angular/core/testing';

import { AppConstants } from 'app.constants';
import { NormalizeWhitespacePipe } from
  'filters/string-utility-filters/normalize-whitespace.pipe';
import { ValidatorsService } from 'services/validators.service';

describe('Validators service', () => {
  let vs: ValidatorsService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NormalizeWhitespacePipe]
    });
    vs = TestBed.get(ValidatorsService);
    /* eslint-disable dot-notation */
    AppConstants['INVALID_NAME_CHARS'] = '#xyz';
    /* eslint-enable dot-notation */
  });

  it('should correctly validate entity names', () => {
    expect(vs.isValidEntityName('b', null, null)).toBe(true);
    expect(vs.isValidEntityName('b   ', null, null)).toBe(true);
    expect(vs.isValidEntityName('   b', null, null)).toBe(true);
    expect(vs.isValidEntityName('bd', null, null)).toBe(true);

    expect(vs.isValidEntityName('', null, null)).toBe(false);
    expect(vs.isValidEntityName('   ', null, null)).toBe(false);
    expect(vs.isValidEntityName('x', null, null)).toBe(false);
    expect(vs.isValidEntityName('y', null, null)).toBe(false);
    expect(vs.isValidEntityName('bx', null, null)).toBe(false);
  });

  it('should correctly validate exploration titles', () => {
    expect(vs.isValidExplorationTitle('b', null)).toBe(true);
    expect(vs.isValidExplorationTitle('abc def', null)).toBe(true);

    expect(vs.isValidExplorationTitle('', null)).toBe(false);
    expect(vs.isValidExplorationTitle(null, null)).toBe(false);
    expect(vs.isValidExplorationTitle(undefined, null)).toBe(false);
    expect(vs.isValidExplorationTitle(
      'A title with invalid characters #', null)).toBe(false);
    expect(vs.isValidExplorationTitle(
      'A title that is toooooooooooooooooooooooooo too long.', null)).toBe(
      false);
  });

  it('should correctly validate non-emptiness', () => {
    expect(vs.isNonempty('b', null)).toBe(true);
    expect(vs.isNonempty('abc def', null)).toBe(true);

    expect(vs.isNonempty('', null)).toBe(false);
    expect(vs.isNonempty(null, null)).toBe(false);
    expect(vs.isNonempty(undefined, null)).toBe(false);
  });

  it('should correctly validate exploration IDs', () => {
    expect(vs.isValidExplorationId('b', null)).toBe(true);
    expect(vs.isValidExplorationId('2', null)).toBe(true);
    expect(vs.isValidExplorationId('asbfjkdAFS-_', null)).toBe(true);

    expect(vs.isValidExplorationId('abc def', null)).toBe(false);
    expect(vs.isValidExplorationId('', null)).toBe(false);
    expect(vs.isValidExplorationId('abcd;', null)).toBe(false);
  });
});
