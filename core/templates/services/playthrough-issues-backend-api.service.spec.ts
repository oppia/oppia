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
 * @fileoverview Unit tests for the issues backend api service.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';

import { PlaythroughIssuesBackendApiService } from
  'services/playthrough-issues-backend-api.service';
import {
  PlaythroughIssue,
  PlaythroughIssueType,
  PlaythroughIssueBackendDict,
} from 'domain/statistics/playthrough-issue.model';

describe('PlaythroughIssuesBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let playthroughIssuesBackendApiService: PlaythroughIssuesBackendApiService;

  let backendIssues: PlaythroughIssueBackendDict[] = [{
    issue_type: PlaythroughIssueType.MultipleIncorrectSubmissions,
    issue_customization_args: {
      state_name: { value: 'state_name1' },
      num_times_answered_incorrectly: { value: 7 }
    },
    playthrough_ids: ['playthrough_id2'],
    schema_version: 1,
    is_valid: true
  }];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    httpTestingController = TestBed.inject(HttpTestingController);
    playthroughIssuesBackendApiService = TestBed.inject(
      PlaythroughIssuesBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('.fetch', () => {
    it('should return the issues data provided by the backend', fakeAsync(
      () => {
        let successHandler = jasmine.createSpy('success');
        let failureHandler = jasmine.createSpy('failure');

        playthroughIssuesBackendApiService.fetchIssuesAsync('7', 1).then(
          successHandler, failureHandler);

        let req = httpTestingController.expectOne(
          '/issuesdatahandler/7?exp_version=1');
        expect(req.request.method).toEqual('GET');
        req.flush({unresolved_issues: backendIssues});
        flushMicrotasks();

        expect(successHandler).toHaveBeenCalledWith(
          backendIssues.map(
            PlaythroughIssue.createFromBackendDict));
        expect(failureHandler).not.toHaveBeenCalled();
      }));

    it('should use the rejection handler if the backend request failed.',
      fakeAsync(() => {
        var successHandler = jasmine.createSpy('success');
        var failHandler = jasmine.createSpy('fail');

        playthroughIssuesBackendApiService.fetchIssuesAsync('7', 1).then(
          successHandler, failHandler);

        var req = httpTestingController.expectOne(
          '/issuesdatahandler/7?exp_version=1');
        expect(req.request.method).toEqual('GET');
        req.flush({
          error: 'Some error in the backend.'
        }, {
          status: 500, statusText: 'Internal Server Error'
        });

        flushMicrotasks();

        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
      })
    );

    it('should not fetch an issue when another issue was already fetched',
      fakeAsync(() => {
        let successHandler = jasmine.createSpy('success');
        let failureHandler = jasmine.createSpy('failure');

        playthroughIssuesBackendApiService.fetchIssuesAsync('7', 1).then(
          successHandler, failureHandler);

        let req = httpTestingController.expectOne(
          '/issuesdatahandler/7?exp_version=1');
        expect(req.request.method).toEqual('GET');
        req.flush({unresolved_issues: backendIssues});
        flushMicrotasks();

        expect(successHandler).toHaveBeenCalledWith(
          backendIssues.map(
            PlaythroughIssue.createFromBackendDict));
        expect(failureHandler).not.toHaveBeenCalled();

        // Try to fetch another issue.
        playthroughIssuesBackendApiService.fetchIssuesAsync('8', 1).then(
          successHandler, failureHandler);

        flushMicrotasks();

        expect(successHandler).toHaveBeenCalledWith(backendIssues.map(
          PlaythroughIssue.createFromBackendDict));
        expect(failureHandler).not.toHaveBeenCalled();
      }));

    it('should return the playthrough data provided by the backend', fakeAsync(
      () => {
        let backendPlaythrough: PlaythroughIssueBackendDict = {
          issue_type: PlaythroughIssueType.EarlyQuit,
          issue_customization_args: {
            state_name: { value: 'state_name1' },
            time_spent_in_exp_in_msecs: { value: 200 }
          },
          playthrough_ids: ['pID'],
          schema_version: 2,
          is_valid: true
        };

        let successHandler = jasmine.createSpy('success');
        let failureHandler = jasmine.createSpy('failure');

        playthroughIssuesBackendApiService.fetchPlaythroughAsync('7', '1').then(
          successHandler, failureHandler);
        let req = httpTestingController.expectOne(
          '/playthroughdatahandler/7/1');
        expect(req.request.method).toEqual('GET');
        req.flush(backendPlaythrough);
        flushMicrotasks();

        expect(successHandler).toHaveBeenCalledWith(
          PlaythroughIssue.createFromBackendDict(
            backendPlaythrough));
        expect(failureHandler).not.toHaveBeenCalled();
      }));
  });

  it('should use the rejection handler if the backend request failed.',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      playthroughIssuesBackendApiService.fetchPlaythroughAsync('7', '1').then(
        successHandler, failHandler);

      var req = httpTestingController.expectOne(
        '/playthroughdatahandler/7/1');
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    })
  );

  describe('.resolve', () => {
    it('should resolve an issue', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failureHandler = jasmine.createSpy('failure');
      let explorationId = '7';
      let playthroughIssue = PlaythroughIssue
        .createFromBackendDict(backendIssues[0]);

      playthroughIssuesBackendApiService.fetchIssuesAsync('7', 1)
        .then(async() => playthroughIssuesBackendApiService.resolveIssueAsync(
          playthroughIssue, explorationId, 1))
        .then(successHandler, failureHandler);
      let req = httpTestingController.expectOne(
        '/issuesdatahandler/7?exp_version=1');
      expect(req.request.method).toEqual('GET');
      req.flush({unresolved_issues: backendIssues});
      flushMicrotasks();

      req = httpTestingController.expectOne(
        '/resolveissuehandler/7');
      req.flush(backendIssues);
      flushMicrotasks();

      // Function resolveIssue does not return a value.
      expect(successHandler).toHaveBeenCalled();
      expect(failureHandler).not.toHaveBeenCalled();
    }));

    it('should use the rejection handler if the backend request failed.',
      fakeAsync(() => {
        var successHandler = jasmine.createSpy('success');
        var failHandler = jasmine.createSpy('fail');
        let explorationId = '7';
        let playthroughIssue = PlaythroughIssue
          .createFromBackendDict(backendIssues[0]);

        playthroughIssuesBackendApiService.fetchIssuesAsync('7', 1)
          .then(async() => playthroughIssuesBackendApiService.resolveIssueAsync(
            playthroughIssue, explorationId, 1))
          .then(successHandler, failHandler);

        let req = httpTestingController.expectOne(
          '/issuesdatahandler/7?exp_version=1');
        expect(req.request.method).toEqual('GET');
        req.flush({unresolved_issues: backendIssues});
        flushMicrotasks();

        req = httpTestingController.expectOne(
          '/resolveissuehandler/7');
        expect(req.request.method).toEqual('POST');
        req.flush({
          error: 'Some error in the backend.'
        }, {
          status: 500, statusText: 'Internal Server Error'
        });

        flushMicrotasks();

        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
      })
    );

    it('should use the rejection handler when try to get non fetched issue',
      fakeAsync(() => {
        let successHandler = jasmine.createSpy('success');
        let failHandler = jasmine.createSpy('fail');
        let explorationId = '7';
        let playthroughIssue = PlaythroughIssue
          .createFromBackendDict(backendIssues[0]);

        playthroughIssuesBackendApiService.resolveIssueAsync(
          playthroughIssue, explorationId, 1).then(successHandler, failHandler);
        let req = httpTestingController.expectOne(
          '/resolveissuehandler/' + explorationId);
        expect(req.request.method).toEqual('POST');
        req.flush(backendIssues);
        flushMicrotasks();

        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalledWith(
          'An issue which was not fetched from the backend has been resolved');
      }));
  });
});
