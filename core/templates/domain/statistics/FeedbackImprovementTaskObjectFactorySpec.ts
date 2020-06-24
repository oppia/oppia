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

require('domain/statistics/FeedbackImprovementTaskObjectFactory.ts');

describe('FeedbackImprovementTaskObjectFactory', function() {
  var $q = null;
  var $rootScope = null;
  var FeedbackImprovementTaskObjectFactory = null;
  var FeedbackThreadObjectFactory = null;
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
      _$q_, _$rootScope_, _FeedbackImprovementTaskObjectFactory_,
      _FeedbackThreadObjectFactory_, _ImprovementModalService_,
      _ThreadDataService_, _FEEDBACK_IMPROVEMENT_TASK_TYPE_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    FeedbackImprovementTaskObjectFactory =
      _FeedbackImprovementTaskObjectFactory_;
    FeedbackThreadObjectFactory = _FeedbackThreadObjectFactory_;
    ImprovementModalService = _ImprovementModalService_;
    ThreadDataService = _ThreadDataService_;
    FEEDBACK_IMPROVEMENT_TASK_TYPE = _FEEDBACK_IMPROVEMENT_TASK_TYPE_;
  }));

  describe('.createNew', function() {
    it('should retrieve data from passed thread', function() {
      var mockThread = {threadId: 1};
      var task = FeedbackImprovementTaskObjectFactory.createNew(mockThread);

      expect(task.isObsolete()).toBe(false);
      expect(task.getDirectiveData()).toBe(mockThread);
      expect(task.getDirectiveType()).toEqual(FEEDBACK_IMPROVEMENT_TASK_TYPE);
    });
  });

  describe('.fetchTasks', function() {
    it('should fetch threads from the backend', function(done) {
      spyOn(ThreadDataService, 'getThreadsAsync').and.returnValue($q.resolve({
        feedbackThreads: [{ threadId: 'abc1' }, { threadId: 'def2' }]
      }));

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
      let feedbackThreadBackendDict = {
        last_updated_msecs: 1000,
        original_author_username: 'test_learner',
        state_name: null,
        status: 'open',
        subject: 'Feedback from a learner',
        summary: null,
        thread_id: 'exp1.thread1',
        message_count: 10,
        last_nonempty_message_author: 'author',
        last_nonempty_message_text: 'tenth message'
      };
      this.mockThread = FeedbackThreadObjectFactory.createFromBackendDict(
        feedbackThreadBackendDict);
      this.task =
        FeedbackImprovementTaskObjectFactory.createNew(this.mockThread);
    });

    describe('.getStatus', function() {
      it('should return the same status as the thread', function() {
        this.mockThread.status = 'a unique status';
        expect(this.task.getStatus()).toEqual('a unique status');
      });
    });

    describe('.getTitle', function() {
      it('should return the subject of the thread', function() {
        this.mockThread.subject = 'Feedback from a learner';
        expect(this.task.getTitle()).toEqual('Feedback from a learner');
      });
    });

    describe('.getDirectiveType', function() {
      it('should return feedback as directive type', function() {
        expect(this.task.getDirectiveType())
          .toEqual(FEEDBACK_IMPROVEMENT_TASK_TYPE);
      });
    });

    describe('.getDirectiveData', function() {
      it('should return the thread', function() {
        expect(this.task.getDirectiveData()).toBe(this.mockThread);
      });
    });

    describe('.getLastUpdatedTime', function() {
      it('should return a number', function() {
        expect(this.task.getLastUpdatedTime()).toEqual(jasmine.any(Number));
      });

      it('should return the time when the thread was last updated', function() {
        expect(this.task.getLastUpdatedTime())
          .toEqual(this.mockThread.lastUpdatedMsecs);
      });
    });

    describe('.getActionButtons', function() {
      it('should return one button', function() {
        expect(this.task.getActionButtons().length).toEqual(1);
      });

      describe('first button', function() {
        beforeEach(function() {
          this.button = this.task.getActionButtons()[0];
        });

        it('should open a thread modal', function() {
          var spy = spyOn(ImprovementModalService, 'openFeedbackThread');

          this.button.execute();

          expect(spy).toHaveBeenCalledWith(this.mockThread);
        });
      });
    });
  });
});
