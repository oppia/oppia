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
 * @fileoverview Unit tests for the ExplorationCategoryService.
 */

import { TestBed } from '@angular/core/testing';
import { ExplorationCategoryService } from './exploration-category.service';
import { ExplorationPropertyService } from './exploration-property.service';
import { ExplorationRightsService } from './exploration-rights.service';
import { ValidatorsService } from 'services/validators.service';
import { NormalizeWhitespacePipe } from 'filters/string-utility-filters/normalize-whitespace.pipe';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('Exploration Category Service', () => {
  let service: ExplorationCategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ExplorationRightsService,
        ValidatorsService,
        NormalizeWhitespacePipe,
        ExplorationPropertyService
      ]
    });

    service = TestBed.inject(ExplorationCategoryService);
  });

  it('should test the child object properties', () => {
    expect(service.propertyName).toBe('category');
    expect(service._isValid('Algorithms')).toBe(true);
    let NotNormalize = '   Exploration             Category Service     ';
    let Normalize = 'Exploration Category Service';
    expect(service._normalize(NotNormalize)).toBe(Normalize);
  });
});
