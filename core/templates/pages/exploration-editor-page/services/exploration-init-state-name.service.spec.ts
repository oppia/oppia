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
 * @fileoverview Unit tests for the ExplorationInitSateNameService.
 */

import { TestBed } from '@angular/core/testing';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { ExplorationInitStateNameService } from './exploration-init-state-name.service';

describe('Exploration Init State Name Service', () => {
  let eisns: ExplorationInitStateNameService = null;

  importAllAngularServices();

  beforeEach(() => {
    eisns = TestBed.inject(ExplorationInitStateNameService);
  });

  it('should test the child object properties', () => {
    expect(eisns.propertyName).toBe('init_state_name');
  });
});
