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

describe('IssuesBackendApiService', function() {
  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    this.IssuesBackendApiService = $injector.get('IssuesBackendApiService');
    this.$httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  describe('.fetch', function() {
    it('returns the issues data provided by the backend', function() {
      var backendIssues = [{
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {
            value: 'state_name1'
          },
          time_spent_in_exp_in_msecs: {
            value: 200
          }
        },
        playthrough_ids: ['playthrough_id1'],
        schema_version: 1,
        is_valid: true
      }, {
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

      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      this.$httpBackend.expectGET(
        '/issuesdatahandler/7?exp_version=1'
      ).respond(backendIssues);

      this.IssuesBackendApiService.fetchIssues('7', 1).then(
        successHandler, failureHandler);
      this.$httpBackend.flush();

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
      this.$httpBackend.expectGET(
        '/playthroughdatahandler/7/1'
      ).respond(backendPlaythrough);

      this.IssuesBackendApiService.fetchPlaythrough('7', '1').then(
        successHandler, failureHandler);
      this.$httpBackend.flush();

      expect(failureHandler).not.toHaveBeenCalled();
    });
  });
});
