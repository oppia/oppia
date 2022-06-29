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
 * @fileoverview Unit tests for PlaythroughIssuesService.
 */

import { TestBed } from '@angular/core/testing';
import { PlaythroughIssuesService } from './playthrough-issues.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PlaythroughIssuesBackendApiService } from 'services/playthrough-issues-backend-api.service';

describe('Playthrough Issues Service', () => {
  let playthroughIssuesService: PlaythroughIssuesService;
  let playthroughIssuesBackendApiService: PlaythroughIssuesBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PlaythroughIssuesService,
        PlaythroughIssuesBackendApiService
      ]
    });

    playthroughIssuesService = TestBed.inject(PlaythroughIssuesService);
    playthroughIssuesBackendApiService = (
      TestBed.inject(PlaythroughIssuesBackendApiService));

    spyOn(playthroughIssuesBackendApiService, 'fetchIssuesAsync')
      .and.stub();
  });

  it('should be defined', () => {
    playthroughIssuesService.initSession('explorationId', 1);

    expect(playthroughIssuesService.explorationId).toBe('explorationId');
    expect(playthroughIssuesService.explorationVersion).toEqual(1);

    playthroughIssuesService.getIssues();

    expect(playthroughIssuesBackendApiService.fetchIssuesAsync)
      .toHaveBeenCalled();
  });
});
