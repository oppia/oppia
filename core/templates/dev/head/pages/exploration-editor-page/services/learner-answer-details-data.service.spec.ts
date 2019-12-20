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
 * @fileoverview Unit tests for LearnerAnswerDetailsDataService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// learner-answer-details-data.service.ts is upgraded to Angular 8.
import { LearnerAnswerDetailsObjectFactory } from
  'domain/statistics/LearnerAnswerDetailsObjectFactory';
import { LearnerAnswerInfoObjectFactory } from
  'domain/statistics/LearnerAnswerInfoObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/exploration-editor-page/services/' +
  'learner-answer-details-data.service.ts');
require('services/csrf-token.service.ts');

describe('Learner answer details service', function() {
  var expId = '12345';
  var LearnerAnswerDetailsDataService = null;
  var sampleDataResults = null;
  var $httpBackend = null;
  var CsrfService = null;
  var $q = null;
  var LearnerAnswerInfoObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('ExplorationDataService', {
        explorationId: expId
      });
      $provide.value(
        'LearnerAnswerDetailsObjectFactory',
        new LearnerAnswerDetailsObjectFactory());
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, _$q_) {
    LearnerAnswerDetailsDataService = $injector.get(
      'LearnerAnswerDetailsDataService');
    $q = _$q_;
    LearnerAnswerInfoObjectFactory = $injector.get(
      'LearnerAnswerInfoObjectFactory');
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      return $q.resolve('sample-csrf-token');
    });
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('when .fetchLearnerAnswerInfoData is called', function() {
    beforeEach(function() {
      sampleDataResults = {
        learner_answer_info_data: [{
          state_name: 'fakeStateName',
          interaction_id: 'fakeInteractionId',
          customization_args: 'fakeCustomizationArgs',
          learner_answer_info_dicts: []
        }]
      };
    });

    it('should successfully fetch learner answer info data from the backend',
      function() {
        sampleDataResults.learner_answer_info_data[0]
          .learner_answer_info_dicts = [{
            id: '123',
            answer: 'My answer',
            answer_details: 'My answer details',
            created_on: 123456
          }];

        var successHandler = jasmine.createSpy('success');
        var failHandler = jasmine.createSpy('fail');

        var createFromBackendDictSpy = spyOn(LearnerAnswerInfoObjectFactory,
          'createFromBackendDict');

        $httpBackend.expect('GET', '/learneranswerinfohandler/' +
          'learner_answer_details/exploration/12345').respond(
          sampleDataResults);
        LearnerAnswerDetailsDataService.fetchLearnerAnswerInfoData().then(
          successHandler, failHandler);
        $httpBackend.flush();

        expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
        expect(failHandler).not.toHaveBeenCalled();
        expect(createFromBackendDictSpy).toHaveBeenCalledTimes(
          sampleDataResults.learner_answer_info_data[0]
            .learner_answer_info_dicts.length);
        expect(LearnerAnswerDetailsDataService.getData().length)
          .toBe(sampleDataResults.learner_answer_info_data.length);
      });

    it('should not create info dicts if it is not in learner answer info',
      function() {
        var successHandler = jasmine.createSpy('success');
        var failHandler = jasmine.createSpy('fail');

        var createFromBackendDictSpy = spyOn(LearnerAnswerInfoObjectFactory,
          'createFromBackendDict');

        $httpBackend.expect('GET', '/learneranswerinfohandler/' +
          'learner_answer_details/exploration/12345').respond(
          sampleDataResults);
        LearnerAnswerDetailsDataService.fetchLearnerAnswerInfoData().then(
          successHandler, failHandler);
        $httpBackend.flush();

        expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
        expect(failHandler).not.toHaveBeenCalled();
        expect(createFromBackendDictSpy).not.toHaveBeenCalled();
        expect(LearnerAnswerDetailsDataService.getData().length)
          .toBe(sampleDataResults.learner_answer_info_data.length);
      });
  });

  it('should delete learner answer info when correct id is provided',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      $httpBackend.expect('DELETE', '/learneranswerinfohandler/' +
      'learner_answer_details/exploration/12345?state_name=fakeStateName&' +
      'learner_answer_info_id=fakeId').respond(200);
      LearnerAnswerDetailsDataService.deleteLearnerAnswerInfo(
        '12345', 'fakeStateName', 'fakeId').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(200);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should not delete learner answer info when incorrect id is provided',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      $httpBackend.expect('DELETE', '/learneranswerinfohandler/' +
      'learner_answer_details/exploration/12345?state_name=fakeStateName&' +
      'learner_answer_info_id=fakeId').respond(404);
      LearnerAnswerDetailsDataService.deleteLearnerAnswerInfo(
        '12345', 'fakeStateName', 'fakeId').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(undefined);
    }
  );
});
