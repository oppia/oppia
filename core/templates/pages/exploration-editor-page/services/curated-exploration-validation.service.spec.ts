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
 * @fileoverview Unit tests for curated exploration validation service.
 */

import { CuratedExplorationValidationService } from './curated-exploration-validation.service';
import { CuratedExplorationValidationBackendApiService } from './curated-exploration-validation-backend-api.service';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('Curated exploration validation service', () => {
  let cevs: CuratedExplorationValidationService;
  let cevbas: CuratedExplorationValidationBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CuratedExplorationValidationBackendApiService]
    });

    cevs = TestBed.inject(CuratedExplorationValidationService);
    cevbas = TestBed.inject(CuratedExplorationValidationBackendApiService);
  });

  it('should call the backend api service to get whether the exploration can ' +
  'be curated', fakeAsync(() => {
    spyOn(cevbas, 'canExplorationBeCuratedAsync').and.resolveTo({
      can_be_curated: false,
      error_message: 'The exploration should not have any parameter changes.'
    });
    const explorationId = 'exp1';

    cevs.canExplorationBeCurated(explorationId).then((result) => {
      expect(result.canBeCurated).toBeFalse();
      expect(result.errorMessage).toEqual(
        'The exploration should not have any parameter changes.');
    });
  }));
});
