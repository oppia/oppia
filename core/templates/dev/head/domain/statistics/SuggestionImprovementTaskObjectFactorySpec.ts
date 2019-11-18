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
 * @fileoverview Unit tests for the SuggestionImprovementTaskObjectFactory.
 */

import { UpgradedServices } from 'services/UpgradedServices';

require('domain/statistics/SuggestionImprovementTaskObjectFactory.ts');

describe('SuggestionImprovementTaskObjectFactory', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var ImprovementModalService = null;
  var SuggestionImprovementTaskObjectFactory = null;
  var SuggestionModalForExplorationEditorService = null;
  var SuggestionThreadObjectFactory = null;
  var ThreadDataService = null;
  var SUGGESTION_IMPROVEMENT_TASK_TYPE = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_, _ImprovementModalService_,
      _SuggestionImprovementTaskObjectFactory_,
      _SuggestionModalForExplorationEditorService_,
      _SuggestionThreadObjectFactory_, _ThreadDataService_,
      _SUGGESTION_IMPROVEMENT_TASK_TYPE_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $uibModal = _$uibModal_;
    ImprovementModalService = _ImprovementModalService_;
    SuggestionImprovementTaskObjectFactory =
      _SuggestionImprovementTaskObjectFactory_;
    SuggestionModalForExplorationEditorService =
      _SuggestionModalForExplorationEditorService_;
    SuggestionThreadObjectFactory = _SuggestionThreadObjectFactory_;
    ThreadDataService = _ThreadDataService_;
    SUGGESTION_IMPROVEMENT_TASK_TYPE = _SUGGESTION_IMPROVEMENT_TASK_TYPE_;
  }));

  describe('.createNew', function() {
    it('retrieves data from passed thread', function() {
      var mockThread = {threadId: 1};
      var task = SuggestionImprovementTaskObjectFactory.createNew(mockThread);

      expect(task.getDirectiveData()).toBe(mockThread);
      expect(task.getDirectiveType()).toEqual(SUGGESTION_IMPROVEMENT_TASK_TYPE);
    });
  });

  describe('.fetchTasks', function() {
    it('fetches threads from the backend', function(done) {
      spyOn(ThreadDataService, 'fetchThreads').and.callFake($q.resolve);
      spyOn(ThreadDataService, 'fetchMessages').and.callFake($q.resolve);
      spyOn(ThreadDataService, 'getData').and.returnValue({
        suggestionThreads: [{threadId: 'abc1'}, {threadId: 'def2'}]
      });

      SuggestionImprovementTaskObjectFactory.fetchTasks().then(function(tasks) {
        expect(tasks[0].getDirectiveData().threadId).toEqual('abc1');
        expect(tasks[1].getDirectiveData().threadId).toEqual('def2');
      }).then(done, done.fail);

      // $q Promises need to be forcibly resolved through a JavaScript digest,
      // which is what $apply helps kick-start.
      $rootScope.$apply();
    });
  });

  describe('SuggestionImprovementTask', function() {
    beforeEach(function() {
      var mockSuggestionThreadBackendDict = {
        last_updated: 1000,
        original_author_username: 'author',
        status: 'accepted',
        subject: 'sample subject',
        summary: 'sample summary',
        message_count: 10,
        state_name: 'state 1',
        thread_id: 'exploration.exp1.thread1',
        thread_summary_dict: {
          status: 'accepted',
          original_author_id: 'usr1',
          last_updated: 1000,
          last_message_text: 'last message',
          total_message_count: 10,
          last_message_is_read: false,
          second_last_message_is_read: true,
          author_last_message: 'author',
          author_second_last_message: 'Test user 1',
          exploration_title: 'Sample exploration 1',
          exploration_id: 'exploration.exp1',
          thread_id: 'exploration.exp1.thread1',
        },
      };
      var mockSuggestionBackendDict = {
        suggestion_id: 'exploration.exp1.thread1',
        suggestion_type: 'edit_exploration_state_content',
        target_type: 'exploration',
        target_id: 'exp1',
        target_version_at_submission: 1,
        status: 'accepted',
        author_name: 'author',
        change: {
          cmd: 'edit_state_property',
          property_name: 'content',
          state_name: 'state_1',
          new_value: {
            html: 'new suggestion content'
          },
          old_value: {
            html: 'old suggestion content'
          }
        },
        last_updated: 1000
      };

      this.mockThread = SuggestionThreadObjectFactory.createFromBackendDicts(
        mockSuggestionThreadBackendDict, mockSuggestionBackendDict);
      this.task =
        SuggestionImprovementTaskObjectFactory.createNew(this.mockThread);
    });

    describe('.getStatus', function() {
      it('returns the same status as the thread', function() {
        this.mockThread.status = 'a unique status';
        expect(this.task.getStatus()).toEqual('a unique status');
      });
    });

    describe('.getTitle', function() {
      it('returns the state associated with the suggestion', function() {
        expect(this.task.getTitle())
          .toEqual('Suggestion for the card "state_1"');
      });
    });

    describe('.getDirectiveType', function() {
      it('returns suggestion as directive type', function() {
        expect(this.task.getDirectiveType())
          .toEqual(SUGGESTION_IMPROVEMENT_TASK_TYPE);
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
          var spy = spyOn(ImprovementModalService, 'openSuggestionThread');

          this.button.execute();

          expect(spy).toHaveBeenCalledWith(this.mockThread);
        });
      });
    });
  });
});
