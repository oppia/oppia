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
 * @fileoverview Tests for AudioBarStatusService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {AttributionService} from 'services/attribution.service';
import {ContextService} from 'services/context.service';
import {CsrfTokenService} from 'services/csrf-token.service';

describe('AttributionService', () => {
  let attributionService: AttributionService;
  let contextService: ContextService;
  let csrfService: CsrfTokenService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    attributionService = TestBed.get(AttributionService);
    contextService = TestBed.get(ContextService);
    csrfService = TestBed.get(CsrfTokenService);
    httpTestingController = TestBed.get(HttpTestingController);

    spyOn(csrfService, 'getTokenAsync').and.callFake(async () => {
      return Promise.resolve('simple-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should set authors and exploration title correctly', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('0');
    const explorationIds = ['0'];
    const sampleResults = {
      summaries: [
        {
          title: 'Title 1',
          category: 'Category 1',
          status: 'public',
          language_code: 'en',
          human_readable_contributors_summary: {
            a: {num_commits: 2},
            b: {num_commits: 5},
          },
        },
      ],
    };

    const requestUrl =
      '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' +
      encodeURI(JSON.stringify(explorationIds)) +
      '&' +
      'include_private_explorations=true';

    attributionService.init();
    attributionService.showAttributionModal();

    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleResults);

    flushMicrotasks();
    expect(attributionService.getAuthors()).toEqual(['b', 'a']);
    expect(attributionService.getExplorationTitle()).toEqual('Title 1');
    expect(attributionService.isAttributionModalShown()).toBeTrue();
  }));

  it('should show and hide modal correctly', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('0');
    const explorationIds = ['0'];
    const sampleResults = {
      summaries: [
        {
          title: 'Title 1',
          category: 'Category 1',
          status: 'public',
          language_code: 'en',
          human_readable_contributors_summary: {
            a: {num_commits: 2},
            b: {num_commits: 5},
          },
        },
      ],
    };

    const requestUrl =
      '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' +
      encodeURI(JSON.stringify(explorationIds)) +
      '&' +
      'include_private_explorations=true';

    attributionService.init();
    attributionService.showAttributionModal();

    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleResults);

    flushMicrotasks();
    expect(attributionService.getAuthors()).toEqual(['b', 'a']);
    expect(attributionService.getExplorationTitle()).toEqual('Title 1');
    expect(attributionService.isAttributionModalShown()).toBeTrue();

    attributionService.hideAttributionModal();
    expect(attributionService.isAttributionModalShown()).toBeFalse();

    attributionService.showAttributionModal();
    expect(attributionService.isAttributionModalShown()).toBeTrue();
  }));

  it('should not initialise fields if backend call fails', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('0');
    const explorationIds = ['0'];

    const requestUrl =
      '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' +
      encodeURI(JSON.stringify(explorationIds)) +
      '&' +
      'include_private_explorations=true';

    attributionService.init();

    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Error fetching data.',
      },
      {
        status: 500,
        statusText: 'Error fetching data.',
      }
    );

    flushMicrotasks();
    expect(attributionService.isAttributionModalShown()).toBeFalse();
    expect(attributionService.getAuthors()).toEqual([]);
    expect(attributionService.getExplorationTitle()).toEqual('');
  }));

  it('should allow attribution generation in exp player page', () => {
    spyOn(contextService, 'isInExplorationPlayerPage').and.returnValue(true);
    expect(attributionService.isGenerateAttributionAllowed()).toBeTrue();
  });

  it('should not allow attribution generation in non exp player pages', () => {
    spyOn(contextService, 'isInExplorationPlayerPage').and.returnValue(false);
    expect(attributionService.isGenerateAttributionAllowed()).toBeFalse();
  });
});
