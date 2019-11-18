// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for IdGenerationService.
 */

import { IdGenerationService } from 'services/id-generation.service';

describe('IdGenerationService', () => {
  let idGenerationService = null;

  beforeEach(() => {
    idGenerationService = new IdGenerationService();
  });

  it('should generate a random id of fixed length', () => {
    expect(idGenerationService.generateNewId()).toMatch(/^[a-z0-9]{10}$/);
  });

  it('should generate two different ids', () => {
    let id1 = idGenerationService.generateNewId();
    let id2 = idGenerationService.generateNewId();
    expect(id1).not.toEqual(id2);
  });
});
