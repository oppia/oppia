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

import { UpgradedServices } from 'services/UpgradedServices';

require('domain/statistics/FeedbackImprovementTaskObjectFactory.ts');

describe('FeedbackImprovementTaskObjectFactory', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var FeedbackImprovementTaskObjectFactory = null;
  var ImprovementModalService = null;
  var ThreadDataService = null;
  var FEEDBACK_IMPROVEMENT_TASK_TYPE = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_, _FeedbackImprovementTaskObjectFactory_,
      _ImprovementModalService_, _ThreadDataService_,
      _FEEDBACK_IMPROVEMENT_TASK_TYPE_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $uibModal = _$uibModal_;
    FeedbackImprovementTaskObjectFactory =
      _FeedbackImprovementTaskObjectFactory_;
    ImprovementModalService = _ImprovementModalService_;
    ThreadDataService = _ThreadDataService_;
    FEEDBACK_IMPROVEMENT_TASK_TYPE = _FEEDBACK_IMPROVEMENT_TASK_TYPE_;
  }));

  describe('.createNew', function() {
    it('retrieves data from passed thread', function() {
      var mockThread = {threadId: 1};
      var task = FeedbackImprovementTaskObjectFactory.createNew(mockThread);

      expect(task.getDirectiveData()).toBe(mockThread);
      expect(task.getDirectiveType()).toEqual(FEEDBACK_IMPROVEMENT_TASK_TYPE);
    });
  });

  describe('.fetchTasks', function() {
    it('fetches threads from the backend', function(done) {
      spyOn(ThreadDataService, 'fetchThreads').and.callFake($q.resolve);
      spyOn(ThreadDataService, 'fetchMessages').and.callFake($q.resolve);
      spyOn(ThreadDataService, 'getData').and.returnValue({
        feedbackThreads: [{threadId: 'abc1'}, {threadId: 'def2'}]
      });

      FeedbackImprovementTaskObjectFactory.fetchTasks().then(function(tasks) {
        expect(tasks[0].getDirectiveData().threadId).toEqual('abc1');
        expect(tasks[1].getDirectiveData().threadId).toEqual('def2');
      }).then(done, done.fail);

      // $q Promises need to be forcibly resolved through a JavaScript digest,
      // which is what $apply helps kick-start.
      $rootScope.$apply();
    });
  });

  describe('FeedbackImprovementTask', function() {
    beforeEach(function() {
      this.mockThread = {
        last_updated: 1441870501230.642,
        original_author_username: 'test_learner',
        state_name: null,
        status: 'open',
        subject: 'Feedback from a learner',
        summary: null,
        thread_id: 'abc1',
      };
      this.task =
        FeedbackImprovementTaskObjectFactory.createNew(this.mockThread);
    });

    describe('.getStatus', function() {
      it('returns the same status as the thread', function() {
        this.mockThread.status = 'a unique status';
        expect(this.task.getStatus()).toEqual('a unique status');
      });
    });

    describe('.getTitle', function() {
      it('returns the subject of the thread', function() {
        this.mockThread.subject = 'Feedback from a learner';
        expect(this.task.getTitle()).toEqual('Feedback from a learner');
      });
    });

    describe('.getDirectiveType', function() {
      it('returns feedback as directive type', function() {
        expect(this.task.getDirectiveType())
          .toEqual(FEEDBACK_IMPROVEMENT_TASK_TYPE);
      });
    });

    describe('.getDirectiveData', function() {
      it('returns the thread', function() {
        expect(this.task.getDirectiveData()).toBe(this.mockThread);
      });
    });

    describe('.getActionButtons', function() {
      it('contains one button', function() {
        expect(this.task.getActionButtons().length).toEqual(1);
      });

      describe('first button', function() {
        beforeEach(function() {
          this.button = this.task.getActionButtons()[0];
        });

        it('opens a thread modal', function() {
          var spy = spyOn(ImprovementModalService, 'openFeedbackThread');

          this.button.execute();

          expect(spy).toHaveBeenCalledWith(this.mockThread);
        });
      });
    });
  });
});
