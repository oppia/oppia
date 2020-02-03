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

// TODO(#7222): Remove the following block of unnnecessary imports once
// PlaythroughIssuesBackendApiService.ts is upgraded to Angular 8.
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { PlaythroughIssueObjectFactory } from
  'domain/statistics/PlaythroughIssueObjectFactory';
import { PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('services/playthrough-issues-backend-api.service.ts');

describe('PlaythroughIssuesBackendApiService', function() {
  var PlaythroughIssuesBackendApiService = null;
  var $httpBackend = null;
  var PlaythroughIssueObjectFactory = null;
  var PlaythroughObjectFactory = null;
  var CsrfService = null;
  var backendIssues = [{
    issue_type: 'MultipleIncorrectSubmissions',
    issue_customization_args: {
      state_name: {
        value: 'state_name1'
      },
      num_times_answered_incorrectly: {
        value: 7
      }
    },
    playthrough_ids: ['playthrough_id2'],
    schema_version: 1,
    is_valid: true
  }];

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $q) {
    PlaythroughIssuesBackendApiService =
      $injector.get('PlaythroughIssuesBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
    PlaythroughIssueObjectFactory = $injector.get(
      'PlaythroughIssueObjectFactory');
    PlaythroughObjectFactory = $injector.get('PlaythroughObjectFactory');

    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('.fetch', function() {
    it('returns the issues data provided by the backend', function() {
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      $httpBackend.expectGET(
        '/issuesdatahandler/7?exp_version=1'
      ).respond(backendIssues);

      PlaythroughIssuesBackendApiService.fetchIssues('7', 1).then(
        successHandler, failureHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        backendIssues.map(PlaythroughIssueObjectFactory.createFromBackendDict));
      expect(failureHandler).not.toHaveBeenCalled();
    });

    it('should not fetch an issue when another issue was already fetched',
      function() {
        var successHandler = jasmine.createSpy('success');
        var failureHandler = jasmine.createSpy('failure');
        $httpBackend.expectGET(
          '/issuesdatahandler/7?exp_version=1'
        ).respond(backendIssues);

        PlaythroughIssuesBackendApiService.fetchIssues('7', 1).then(
          successHandler, failureHandler);
        $httpBackend.flush();

        expect(successHandler).toHaveBeenCalledWith(
          backendIssues.map(
            PlaythroughIssueObjectFactory.createFromBackendDict));
        expect(failureHandler).not.toHaveBeenCalled();

        // Try to fetch another issue
        PlaythroughIssuesBackendApiService.fetchIssues('8', 1).then(
          successHandler, failureHandler);

        expect(successHandler).toHaveBeenCalledWith(
          backendIssues.map(
            PlaythroughIssueObjectFactory.createFromBackendDict));
        expect(failureHandler).not.toHaveBeenCalled();
      });

    it('returns the playthrough data provided by the backend', function() {
      var backendPlaythrough = {
        exp_id: 'exp_id1',
        exp_version: 1,
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {
            value: 'state_name1'
          },
          time_spent_in_exp_in_msecs: {
            value: 200
          }
        },
        actions: [{
          action_type: 'ExplorationStart',
          action_customization_args: {
            state_name: {
              value: 'state_name1'
            }
          },
          schema_version: 1
        }]
      };

      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      $httpBackend.expectGET(
        '/playthroughdatahandler/7/1'
      ).respond(backendPlaythrough);

      PlaythroughIssuesBackendApiService.fetchPlaythrough('7', '1').then(
        successHandler, failureHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        PlaythroughObjectFactory.createFromBackendDict(backendPlaythrough));
      expect(failureHandler).not.toHaveBeenCalled();
    });
  });

  describe('.resolve', function() {
    it('should resolve an issue', function() {
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      var explorationId = '7';
      var playthroughIssue = PlaythroughIssueObjectFactory
        .createFromBackendDict(backendIssues[0]);
      $httpBackend.expectGET(
        '/issuesdatahandler/7?exp_version=1'
      ).respond(backendIssues);
      $httpBackend.expectPOST('/resolveissuehandler/' + explorationId)
        .respond(200);

      PlaythroughIssuesBackendApiService.fetchIssues('7', 1).then(
        function() {
          PlaythroughIssuesBackendApiService.resolveIssue(
            playthroughIssue, explorationId, 1).then(
            successHandler, failureHandler);

          // resolveIssue does not return any resolve promise method.
          expect(successHandler).not.toHaveBeenCalled();
          expect(failureHandler).not.toHaveBeenCalled();
        });
      $httpBackend.flush();
    });

    it('should use the rejection handler when try to get non fetched issue',
      function() {
        var explorationId = '7';
        var playthroughIssue = PlaythroughIssueObjectFactory
          .createFromBackendDict(backendIssues[0]);

        var successHandler = jasmine.createSpy('success');
        var failHandler = jasmine.createSpy('fail');

        $httpBackend.expectPOST('/resolveissuehandler/' + explorationId)
          .respond(200);
        PlaythroughIssuesBackendApiService.resolveIssue(
          playthroughIssue, explorationId, 1).then(successHandler, failHandler);
        $httpBackend.flush();

        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler)
          .toHaveBeenCalledWith(
            new Error('An issue which was not fetched from the backend has ' +
            'been resolved'));
      });
  });
});
