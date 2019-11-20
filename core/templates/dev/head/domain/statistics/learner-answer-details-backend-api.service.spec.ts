// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LearnerAnswerDetailsBackendApiService
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/statistics/learner-answer-details-backend-api.service.ts');
require('services/csrf-token.service.ts');

describe('Learner answer info backend Api service', function() {
  var LearnerAnswerDetailsBackendApiService = null;
  var $rootScope = null;
  var $httpBackend = null;
  var CsrfService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $q) {
    LearnerAnswerDetailsBackendApiService = $injector.get(
      'LearnerAnswerDetailsBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
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

  it('should successfully record the learner answer details',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'PUT',
        '/learneranswerdetailshandler/exploration/exp123').respond(
        200);
      LearnerAnswerDetailsBackendApiService.recordLearnerAnswerDetails(
        'exp123', 'Introduction', 'TextInput', 'sample answer',
        'sample answer details').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    });
});
