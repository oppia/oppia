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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {ExplorationSummaryBackendApiService} from 'domain/summary/exploration-summary-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {CsrfTokenService} from 'services/csrf-token.service';

describe('Exploration Summary Backend Api Service', () => {
  let explorationSummaryBackendApiService: ExplorationSummaryBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;
  let alertsService: AlertsService;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    explorationSummaryBackendApiService = TestBed.inject(
      ExplorationSummaryBackendApiService
    );
    csrfService = TestBed.inject(CsrfTokenService);
    alertsService = TestBed.inject(AlertsService);
    httpTestingController = TestBed.inject(HttpTestingController);

    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');

    spyOn(csrfService, 'getTokenAsync').and.callFake(async () => {
      return Promise.resolve('simple-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it(
    'should not load public exploration summaries from backend when' +
      ' exploration id is not valid',
    fakeAsync(() => {
      const explorationIds = ['#', '', '1'];
      const alertSpy = spyOn(alertsService, 'addWarning').and.callThrough();

      explorationSummaryBackendApiService
        .loadPublicExplorationSummariesAsync(explorationIds)
        .then(successHandler, failHandler);

      flushMicrotasks();

      expect(alertSpy).toHaveBeenCalledWith(
        'Please enter a valid exploration ID.'
      );
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith([null, null, null]);
    })
  );

  it('should use reject handler when server throws and error', fakeAsync(() => {
    const explorationIds = ['12'];
    const requestUrl =
      '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' +
      encodeURI(JSON.stringify(explorationIds)) +
      '&' +
      'include_private_explorations=false';

    explorationSummaryBackendApiService
      .loadPublicExplorationSummariesAsync(explorationIds)
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(
      {error: 'Error Communicating with Server'},
      {status: 400, statusText: ''}
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error Communicating with Server');
  }));

  it('should load public exploration summaries from backend', fakeAsync(() => {
    const explorationIds = ['0', '1', '2'];
    const sampleResults = [
      {
        title: 'Title 1',
        category: 'Category 1',
        status: 'public',
        language_code: 'en',
      },
    ];

    const requestUrl =
      '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' +
      encodeURI(JSON.stringify(explorationIds)) +
      '&' +
      'include_private_explorations=false';

    explorationSummaryBackendApiService
      .loadPublicExplorationSummariesAsync(explorationIds)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleResults);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should load public and private exploration summaries from backend', fakeAsync(() => {
    const explorationIds = ['0', '1', '2'];
    const sampleResults = [
      {
        title: 'Title 1',
        category: 'Category 1',
        status: 'public',
        language_code: 'en',
      },
      {
        title: 'Title 2',
        category: 'Category 2',
        status: 'private',
        language_code: 'en',
      },
    ];

    const requestUrl =
      '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' +
      encodeURI(JSON.stringify(explorationIds)) +
      '&' +
      'include_private_explorations=true';

    explorationSummaryBackendApiService
      .loadPublicAndPrivateExplorationSummariesAsync(explorationIds)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleResults);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should use reject handler when loading public exploration summaries' +
      ' from backend returns null',
    fakeAsync(() => {
      const explorationIds = ['0', '1', '2'];

      const requestUrl =
        '/explorationsummarieshandler/data?' +
        'stringified_exp_ids=' +
        encodeURI(JSON.stringify(explorationIds)) +
        '&' +
        'include_private_explorations=false';

      explorationSummaryBackendApiService
        .loadPublicExplorationSummariesAsync(explorationIds)
        .then(successHandler, failHandler);

      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(null);

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Summaries fetched are null for explorationIds: ' + explorationIds
      );
    })
  );

  it(
    'should use reject handler when loading public exploration summaries' +
      ' from backend fails',
    fakeAsync(() => {
      const explorationIds = ['0', '1', '2'];
      const errorMessage = 'Error on loading public exploration summaries.';

      const requestUrl =
        '/explorationsummarieshandler/data?' +
        'stringified_exp_ids=' +
        encodeURI(JSON.stringify(explorationIds)) +
        '&' +
        'include_private_explorations=false';

      explorationSummaryBackendApiService
        .loadPublicExplorationSummariesAsync(explorationIds)
        .then(successHandler, failHandler);

      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush({error: errorMessage}, {status: 500, statusText: ''});

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(errorMessage);
    })
  );
});
