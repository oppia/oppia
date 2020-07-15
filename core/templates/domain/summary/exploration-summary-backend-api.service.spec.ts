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
 * @fileoverview Unit tests for ExplorationSummaryBackendApiService.
 */
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { UpgradedServices } from 'services/UpgradedServices';

import { AlertsService } from 'services/alerts.service';
import { CsrfTokenService } from 'services/csrf-token.service.ts';
import { ExplorationSummaryBackendApiService } from
  'domain/summary/exploration-summary-backend-api.service.ts';


describe('Exploration Summary Backend Api Service', () => {
  let explorationSummaryBackendApiService:
    ExplorationSummaryBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService = null;
  let alertsService: AlertsService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExplorationSummaryBackendApiService]
    });

    explorationSummaryBackendApiService = TestBed.get(
      ExplorationSummaryBackendApiService
    );
    csrfService = TestBed.get(CsrfTokenService);
    alertsService = TestBed.get(UpgradedServices);
    httpTestingController = TestBed.get(HttpTestingController);

    spyOn(csrfService, 'getTokenAsync').and.callFake(function() {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should not load public exploration summaries from backend when' +
    ' exploration id is not valid', function() {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let explorationIds = ['#', null, '1'];
    let alertSpy = spyOn(alertsService, 'addWarning').and.callThrough();

    explorationSummaryBackendApiService.loadPublicExplorationSummaries(
      explorationIds).then(successHandler, failHandler);

    expect(alertSpy).toHaveBeenCalledWith(
      'Please enter a valid exploration ID.');
    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith([null, null, null]);
  });

  it('should load public exploration summaries from backend',
    function() {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let explorationIds = ['0', '1', '2'];
      let sampleResults = [{
        title: 'Title 1',
        category: 'Category 1',
        status: 'public',
        language_code: 'en'
      }];

      let requestUrl = '/explorationsummarieshandler/data?' +
        'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds)) +
        '&' + 'include_private_explorations=false';

      explorationSummaryBackendApiService
        .loadPublicExplorationSummaries(explorationIds)
        .then(successHandler, failHandler);

      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(sampleResults);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should load public and private exploration summaries from backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let explorationIds = ['0', '1', '2'];
      let sampleResults = [{
        title: 'Title 1',
        category: 'Category 1',
        status: 'public',
        language_code: 'en'
      }, {
        title: 'Title 2',
        category: 'Category 2',
        status: 'private',
        language_code: 'en'
      }];

      let requestUrl = '/explorationsummarieshandler/data?' +
        'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds)) +
        '&' + 'include_private_explorations=true';


      explorationSummaryBackendApiService
        .loadPublicAndPrivateExplorationSummaries(explorationIds).then(
          successHandler, failHandler);

      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(sampleResults);
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should use reject handler when loading public exploration summaries' +
    ' from backend returns null', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let explorationIds = ['0', '1', '2'];

    let requestUrl = '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds)) +
      '&' + 'include_private_explorations=false';

    explorationSummaryBackendApiService
      .loadPublicExplorationSummaries(explorationIds)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(null);

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      Error('Summaries fetched are null for explorationIds: ' +
      explorationIds));
  }));

  it('should use reject handler when loading public exploration summaries' +
    ' from backend fails', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let explorationIds = ['0', '1', '2'];
    let errorMessage = 'Error on loading public exploration summaries.';

    let requestUrl = '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds)) +
      '&' + 'include_private_explorations=false';

    explorationSummaryBackendApiService
      .loadPublicExplorationSummaries(explorationIds)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(errorMessage);

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(errorMessage);
  }));
});
