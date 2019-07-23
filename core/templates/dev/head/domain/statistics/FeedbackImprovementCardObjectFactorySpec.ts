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
 * @fileoverview Unit tests for the FeedbackImprovementCardObjectFactory.
 */

// TODO(YashJipkate): Remove the following block of unnnecessary imports once
// FeedbackImprovementCardObjectFactory.ts is upgraded to Angular 8.
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory.ts';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory.ts';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory.ts';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory.ts';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory.ts';
// ^^^ This block is to be removed.

require('domain/statistics/FeedbackImprovementCardObjectFactory.ts');

describe('FeedbackImprovementCardObjectFactory', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var FeedbackImprovementCardObjectFactory = null;
  var ImprovementModalService = null;
  var ThreadDataService = null;
  var FEEDBACK_IMPROVEMENT_CARD_TYPE = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'AnswerClassificationResultObjectFactory',
      new AnswerClassificationResultObjectFactory());
    $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
    $provide.value(
      'ExplorationDraftObjectFactory', new ExplorationDraftObjectFactory());
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
  }));
  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_, _FeedbackImprovementCardObjectFactory_,
      _ImprovementModalService_, _ThreadDataService_,
      _FEEDBACK_IMPROVEMENT_CARD_TYPE_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $uibModal = _$uibModal_;
    FeedbackImprovementCardObjectFactory =
      _FeedbackImprovementCardObjectFactory_;
    ImprovementModalService = _ImprovementModalService_;
    ThreadDataService = _ThreadDataService_;
    FEEDBACK_IMPROVEMENT_CARD_TYPE = _FEEDBACK_IMPROVEMENT_CARD_TYPE_;
  }));

  describe('.createNew', function() {
    it('retrieves data from passed thread', function() {
      var mockThread = {threadId: 1};
      var card = FeedbackImprovementCardObjectFactory.createNew(mockThread);

      expect(card.getDirectiveData()).toBe(mockThread);
      expect(card.getDirectiveType()).toEqual(FEEDBACK_IMPROVEMENT_CARD_TYPE);
    });
  });

  describe('.fetchCards', function() {
    it('fetches threads from the backend', function(done) {
      spyOn(ThreadDataService, 'fetchThreads').and.callFake($q.resolve);
      spyOn(ThreadDataService, 'fetchMessages').and.callFake($q.resolve);
      spyOn(ThreadDataService, 'getData').and.returnValue({
        feedbackThreads: [{threadId: 'abc1'}, {threadId: 'def2'}]
      });

      FeedbackImprovementCardObjectFactory.fetchCards().then(function(cards) {
        expect(cards[0].getDirectiveData().threadId).toEqual('abc1');
        expect(cards[1].getDirectiveData().threadId).toEqual('def2');
      }).then(done, done.fail);

      // $q Promises need to be forcibly resolved through a JavaScript digest,
      // which is what $apply helps kick-start.
      $rootScope.$apply();
    });
  });

  describe('FeedbackImprovementCard', function() {
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
      this.card =
        FeedbackImprovementCardObjectFactory.createNew(this.mockThread);
    });

    describe('.isOpen', function() {
      it('returns true when status is open', function() {
        this.mockThread.status = 'open';
        expect(this.card.isOpen()).toBe(true);
      });

      it('returns false when status is not open', function() {
        this.mockThread.status = 'closed';
        expect(this.card.isOpen()).toBe(false);
      });
    });

    describe('.getTitle', function() {
      it('returns the subject of the thread', function() {
        this.mockThread.subject = 'Feedback from a learner';
        expect(this.card.getTitle()).toEqual('Feedback from a learner');
      });
    });

    describe('.getDirectiveType', function() {
      it('returns feedback as directive type', function() {
        expect(this.card.getDirectiveType())
          .toEqual(FEEDBACK_IMPROVEMENT_CARD_TYPE);
      });
    });

    describe('.getDirectiveData', function() {
      it('returns the thread', function() {
        expect(this.card.getDirectiveData()).toBe(this.mockThread);
      });
    });

    describe('.getActionButtons', function() {
      it('contains one button', function() {
        expect(this.card.getActionButtons().length).toEqual(1);
      });

      describe('first button', function() {
        beforeEach(function() {
          this.button = this.card.getActionButtons()[0];
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
