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
 * @fileoverview Unit tests for LearnerAnswerInfoBackendApiService
 */

require('domain/learner_answer_details/LearnerAnswerInfoBackendApiService.ts');

describe('Learner answer info backend Api service', function() {
  var LearnerAnswerInfoBackendApiService = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    LearnerAnswerInfoBackendApiService = $injector.get(
      'LearnerAnswerInfoBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully record the learner answer info',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'POST', '/explorehandler/learner_answer_details/exp123').respond(200);
      LearnerAnswerInfoBackendApiService.recordLearnerAnswerInfo(
        'exp123', 'Introduction', 'TextInput', 'sample answer',
        'sample answer details').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    });
});
