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
 * @fileoverview Unit tests for the FeedbackImprovementTaskObjectFactory.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// FeedbackImprovementTaskObjectFactory.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';

require('domain/statistics/AnswerDetailsImprovementTaskObjectFactory.ts');

describe('AnswerDetailsImprovementTaskObjectFactory', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var AnswerDetailsImprovementTaskObjectFactory = null;
  var ImprovementModalService = null;
  var LearnerAnswerDetailsDataService = null;
  var TestLearnerAnswerDetailsObjectFactory = null;
  var TestLearnerAnswerInfoObjectFactory = null;
  var ANSWER_DETAILS_IMPROVEMENT_TASK_TYPE = null;
  var STATUS_NOT_ACTIONABLE = null;
  var STATUS_OPEN = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_,
      _AnswerDetailsImprovementTaskObjectFactory_, _ImprovementModalService_,
      _LearnerAnswerDetailsDataService_,
      _LearnerAnswerDetailsObjectFactory_,
      _LearnerAnswerInfoObjectFactory_,
      _ANSWER_DETAILS_IMPROVEMENT_TASK_TYPE_,
      _STATUS_NOT_ACTIONABLE_, _STATUS_OPEN_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $uibModal = _$uibModal_;
    AnswerDetailsImprovementTaskObjectFactory =
      _AnswerDetailsImprovementTaskObjectFactory_;
    ImprovementModalService = _ImprovementModalService_;
    LearnerAnswerDetailsDataService = _LearnerAnswerDetailsDataService_;
    TestLearnerAnswerDetailsObjectFactory = _LearnerAnswerDetailsObjectFactory_;
    TestLearnerAnswerInfoObjectFactory = _LearnerAnswerInfoObjectFactory_;
    ANSWER_DETAILS_IMPROVEMENT_TASK_TYPE =
      _ANSWER_DETAILS_IMPROVEMENT_TASK_TYPE_;
    STATUS_NOT_ACTIONABLE = _STATUS_NOT_ACTIONABLE_;
    STATUS_OPEN = _STATUS_OPEN_;
  }));

  describe('.createNew', function() {
    it('should retrieve data from passed thread', function() {
      var mockLearnerAnswerDetails = {learnerAnswerInfoData: 'sample'};
      var task = AnswerDetailsImprovementTaskObjectFactory.createNew(
        mockLearnerAnswerDetails);

      expect(task.getDirectiveData()).toBe(mockLearnerAnswerDetails);
      expect(task.getDirectiveType()).toEqual(
        ANSWER_DETAILS_IMPROVEMENT_TASK_TYPE);
    });
  });

  describe('.fetchTasks', function() {
    it('should fetch threads from the backend', function(done) {
      spyOn(
        LearnerAnswerDetailsDataService,
        'fetchLearnerAnswerInfoData').and.callFake($q.resolve);
      spyOn(LearnerAnswerDetailsDataService, 'getData').and.returnValue(
        [{learnerAnswerInfoData: 'abc1'}, {learnerAnswerInfoData: 'def2'}]);

      AnswerDetailsImprovementTaskObjectFactory.fetchTasks().then(
        function(tasks) {
          expect(
            tasks[0].getDirectiveData().learnerAnswerInfoData).toEqual('abc1');
          expect(
            tasks[1].getDirectiveData().learnerAnswerInfoData).toEqual('def2');
        }).then(done, done.fail);

      // $q Promises need to be forcibly resolved through a JavaScript digest,
      // which is what $apply helps kick-start.
      $rootScope.$apply();
    });
  });

  describe('AnswerDetailsImprovementTask', function() {
    beforeEach(function() {
      this.testLastUpdatedTime = 1441870501230.642;

      this.testLearnerAnswerDetails =
        TestLearnerAnswerDetailsObjectFactory.createDefaultLearnerAnswerDetails(
          'fakeExpId', 'fakeStateName', 'fakeInteractionId',
          'fakeCustomizationArgs', [
            TestLearnerAnswerInfoObjectFactory.createFromBackendDict({
              id: 'test_1',
              answer: 'Answer 1',
              answer_details: 'Answer details one.',
              created_on: this.testLastUpdatedTime
            })
          ]
        );

      this.task = AnswerDetailsImprovementTaskObjectFactory
        .createNew(this.testLearnerAnswerDetails);
    });

    describe('.getStatus', function() {
      it('should return open as status', function() {
        expect(this.task.getStatus()).toEqual(STATUS_OPEN);
      });

      it('should return not actionable as status', function() {
        this.testLearnerAnswerDetails.learnerAnswerInfoData = [];
        expect(this.task.getStatus()).toEqual(STATUS_NOT_ACTIONABLE);
      });
    });

    describe('.getTitle', function() {
      it('should return answer details as title', function() {
        expect(this.task.getTitle()).toEqual(
          'Answer details for the card "fakeStateName"');
      });
    });

    describe('.isObsolete', function() {
      it('should return is obsolete as false', function() {
        expect(this.task.isObsolete()).toEqual(false);
      });

      it('should return is obsolete as true', function() {
        this.testLearnerAnswerDetails.learnerAnswerInfoData = [];
        expect(this.task.isObsolete()).toEqual(true);
      });
    });

    describe('.getDirectiveType', function() {
      it('should return answer details as directive type', function() {
        expect(this.task.getDirectiveType())
          .toEqual(ANSWER_DETAILS_IMPROVEMENT_TASK_TYPE);
      });
    });

    describe('.getDirectiveData', function() {
      it('should return the learner answer details', function() {
        expect(this.task.getDirectiveData()).toBe(
          this.testLearnerAnswerDetails);
      });
    });

    describe('.getActionButtons', function() {
      it('should return one button', function() {
        expect(this.task.getActionButtons().length).toEqual(1);
      });
    });

    describe('.getLastUpdatedTime', function() {
      it('should return a number', function() {
        expect(this.task.getLastUpdatedTime()).toEqual(jasmine.any(Number));
      });

      it('should return the time when this task was last updated', function() {
        expect(this.task.getLastUpdatedTime())
          .toEqual(this.testLastUpdatedTime);
      });
    });

    describe('first button', function() {
      beforeEach(function() {
        this.button = this.task.getActionButtons()[0];
      });

      it('should open a learner answer details modal', function() {
        var spy = spyOn(ImprovementModalService, 'openLearnerAnswerDetails');

        this.button.execute();

        expect(spy).toHaveBeenCalledWith(this.testLearnerAnswerDetails);
      });
    });
  });
});
