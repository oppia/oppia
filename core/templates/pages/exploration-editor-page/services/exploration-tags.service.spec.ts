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
 * @fileoverview Unit tests for the ExplorationTagsService.
 */

import {TestBed} from '@angular/core/testing';
import {ExplorationPropertyService} from './exploration-property.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ExplorationTagsService} from './exploration-tags.service';

describe('Exploration Tags Service', () => {
  let explorationTagsService: ExplorationTagsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExplorationPropertyService],
    });

    explorationTagsService = TestBed.inject(ExplorationTagsService);
  });

  it('should test the child object properties', () => {
    expect(explorationTagsService.propertyName).toBe('tags');
    let NotNormalize = ['angularjs ', ' google  cloud  storage   ', ' python'];
    let Normalize = ['angularjs', 'google cloud storage', 'python'];
    let UpperCaseNotValid = ['Angularjs', 'google cloud storage', 'Python'];
    let NumberNotValid = ['angularjs', 'google cloud storage', 'Python123'];
    let SpecialNotValid = ['@ngularjs', 'google cloud storage', 'Python'];
    expect(explorationTagsService._normalize(NotNormalize)).toEqual(Normalize);
    expect(explorationTagsService._isValid(Normalize)).toBe(true);
    expect(explorationTagsService._isValid(UpperCaseNotValid)).toBe(false);
    expect(explorationTagsService._isValid(NumberNotValid)).toBe(false);
    expect(explorationTagsService._isValid(SpecialNotValid)).toBe(false);
  });
});
