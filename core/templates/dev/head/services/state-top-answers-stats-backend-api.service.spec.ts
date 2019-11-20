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
 * @fileoverview Unit tests for StateTopAnswersStatsBackendApiService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('services/state-top-answers-stats-backend-api.service.ts');

describe('StateTopAnswersStatsBackendApiService', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    this.StateTopAnswersStatsBackendApiService =
      $injector.get('StateTopAnswersStatsBackendApiService');
    this.$httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  describe('.fetchStats', function() {
    it('returns the data provided by the backend.', function() {
      var backendDict = {
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 5},
            {answer: 'que?', frequency: 2},
          ]
        },
        interaction_ids: {Hola: 'TextInput'},
      };
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      this.$httpBackend.expectGET(
        '/createhandler/state_answer_stats/7'
      ).respond(backendDict);

      this.StateTopAnswersStatsBackendApiService.fetchStats('7').then(
        successHandler, failureHandler);
      this.$httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(backendDict);
      expect(failureHandler).not.toHaveBeenCalled();
    });
  });
});
