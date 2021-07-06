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
import { NormalizeWhitespacePipe } from 'filters/string-utility-filters/normalize-whitespace.pipe';
import { AlertsService } from 'services/alerts.service';
import { ValidatorsService } from 'services/validators.service';

describe('Validators service', () => {
  let vs: ValidatorsService;
  const INVALID_NAME_CHARS_COPY = (
    Array.from(AppConstants.INVALID_NAME_CHARS));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AlertsService, NormalizeWhitespacePipe]
    });
    vs = TestBed.inject(ValidatorsService);
    // This throws "Cannot assign to 'INVALID_NAME_CHARS' because it
    // is a read-only property.". We need to suppress this error because
    // we need to change the value of 'INVALID_NAME_CHARS' for testing
    // purposes.
    // @ts-expect-error
    AppConstants.INVALID_NAME_CHARS = ['#', 'x', 'y', 'z'];
  });


  afterAll(() => {
    // This throws "Cannot assign to 'INVALID_NAME_CHARS' because it
    // is a read-only property.". We need to suppress this error because
    // we need to change the value of 'INVALID_NAME_CHARS' for testing
    // purposes.
    // @ts-expect-error
    AppConstants.INVALID_NAME_CHARS = INVALID_NAME_CHARS_COPY;
  });

  it('should correctly validate entity names', () => {
    expect(vs.isValidEntityName('b', false, false)).toBe(true);
    expect(vs.isValidEntityName('b   ', false, false)).toBe(true);
    expect(vs.isValidEntityName('   b', false, false)).toBe(true);
    expect(vs.isValidEntityName('bd', false, false)).toBe(true);

    expect(vs.isValidEntityName('', true, false)).toBe(false);
    expect(vs.isValidEntityName('   ', false, false)).toBe(false);
    expect(vs.isValidEntityName('x', false, false)).toBe(false);
    expect(vs.isValidEntityName('y', false, false)).toBe(false);
    expect(vs.isValidEntityName('bx', true, false)).toBe(false);
  });

  it('should correctly validate exploration titles', () => {
    expect(vs.isValidExplorationTitle('b', false)).toBe(true);
    expect(vs.isValidExplorationTitle('abc def', false)).toBe(true);

    expect(vs.isValidExplorationTitle('', false)).toBe(false);
    expect(vs.isValidExplorationTitle('', false)).toBe(false);
    expect(vs.isValidExplorationTitle(
      'A title with invalid characters #', false)).toBe(false);
    expect(vs.isValidExplorationTitle(
      'A title that is toooooooooooooooooooooooooo too long.', true)).toBe(
      false);
  });

  it('should correctly validate non-emptiness', () => {
    expect(vs.isNonempty('b', false)).toBe(true);
    expect(vs.isNonempty('abc def', false)).toBe(true);

    expect(vs.isNonempty('', false)).toBe(false);
    expect(vs.isNonempty('', false)).toBe(false);
    expect(vs.isNonempty('', true)).toBe(false);
  });

  it('should correctly validate exploration IDs', () => {
    expect(vs.isValidExplorationId('b', false)).toBe(true);
    expect(vs.isValidExplorationId('2', false)).toBe(true);
    expect(vs.isValidExplorationId('asbfjkdAFS-_', false)).toBe(true);

    expect(vs.isValidExplorationId('abc def', false)).toBe(false);
    expect(vs.isValidExplorationId('', false)).toBe(false);
    expect(vs.isValidExplorationId('abcd;', true)).toBe(false);
  });

  it('should correctly validate state name', () => {
    expect(vs.isValidStateName('abc def', false)).toBe(true);

    expect(vs.isValidStateName('', false)).toBe(false);
    expect(vs.isValidStateName(
      'A state name with invalid character x', false)).toBe(false);
    expect(vs.isValidStateName(
      'A state name that is toooooooooooooooooooooooo long', true))
      .toBe(false);
  });

  it('should correctly validate review message', () => {
    const longReviewText: string = 'a'.repeat(10001);
    expect(vs.isValidReviewMessage('some review message', false)).toBe(true);
    expect(vs.isValidReviewMessage('', false)).toBe(true);
    expect(vs.isValidReviewMessage(longReviewText, true)).toBe(false);
  });
});
