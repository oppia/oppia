// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SchemaUndefinedLastElementService.
*/

import { TestBed } from '@angular/core/testing';
import { SchemaUndefinedLastElementService } from
  'services/schema-undefined-last-element.service';

describe('Schema Undefined Last Element Service', () => {
  let sules: SchemaUndefinedLastElementService;

  beforeEach(() => {
    sules = TestBed.inject(SchemaUndefinedLastElementService);
  });

  it('should get undefined value by schema', () => {
    expect(sules.getUndefinedValue({type: 'unicode'})).toBe('');
    expect(sules.getUndefinedValue({type: 'html'})).toBe('');
    expect(sules.getUndefinedValue({type: 'int'})).toBe(undefined);
  });
});
