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
 * @fileoverview Unit tests for the ExplorationParamSpecsService.
 */

import {TestBed} from '@angular/core/testing';
import {ExplorationParamSpecsService} from './exploration-param-specs.service';
import {ExplorationPropertyService} from './exploration-property.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('Exploration Param Specs Service', () => {
  let epcs: ExplorationParamSpecsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExplorationPropertyService],
    });

    epcs = TestBed.inject(ExplorationParamSpecsService);
  });

  it('should test the child object properties', function () {
    expect(epcs.propertyName).toBe('param_specs');
  });
});
