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
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { EditabilityService } from 'services/editability.service';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { FeedbackThreadObjectFactory } from
  'domain/feedback_thread/FeedbackThreadObjectFactory';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { ImprovementActionButtonObjectFactory } from
  'domain/statistics/ImprovementActionButtonObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { SuggestionObjectFactory } from
  'domain/suggestion/SuggestionObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
/* eslint-disable max-len */
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
/* eslint-disable max-len */
import { StateEditorService } from
  'components/state-editor/state-editor-properties-services/state-editor.service';
/* eslint-enable max-len */
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
/* eslint-enable max-len */
import { SuggestionModalService } from 'services/suggestion-modal.service';
/* eslint-disable max-len */
import { ThreadStatusDisplayService } from
  'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';
/* eslint-enable max-len */
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { UserInfoObjectFactory } from 'domain/user/UserInfoObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { LearnerAnswerDetailsObjectFactory } from
  'domain/statistics/LearnerAnswerDetailsObjectFactory';
import { LearnerAnswerInfoObjectFactory } from
  'domain/statistics/LearnerAnswerInfoObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/statistics/FeedbackImprovementTaskObjectFactory.ts');

describe('FeedbackImprovementTaskObjectFactory', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var FeedbackImprovementTaskObjectFactory = null;
  var ImprovementModalService = null;
  var ThreadDataService = null;
  var FEEDBACK_IMPROVEMENT_TASK_TYPE = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', new AngularNameService());
    $provide.value(
      'AnswerClassificationResultObjectFactory',
      new AnswerClassificationResultObjectFactory());
    $provide.value(
      'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
        new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
        new RuleObjectFactory()));
    $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
    $provide.value('EditabilityService', new EditabilityService());
    $provide.value(
      'ExplorationDraftObjectFactory', new ExplorationDraftObjectFactory());
    $provide.value(
      'FeedbackThreadObjectFactory', new FeedbackThreadObjectFactory());
    $provide.value('FractionObjectFactory', new FractionObjectFactory());
    $provide.value(
      'HintObjectFactory', new HintObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value(
      'ImprovementActionButtonObjectFactory',
      new ImprovementActionButtonObjectFactory());
    $provide.value(
      'OutcomeObjectFactory', new OutcomeObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value(
      'ParamChangeObjectFactory', new ParamChangeObjectFactory());
    $provide.value(
      'ParamChangesObjectFactory', new ParamChangesObjectFactory(
        new ParamChangeObjectFactory()));
    $provide.value(
      'StateEditorService', new StateEditorService(
        new SolutionValidityService()));
    $provide.value(
      'RecordedVoiceoversObjectFactory',
      new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
    $provide.value(
      'StateClassifierMappingService', new StateClassifierMappingService(
        new ClassifierObjectFactory()));
    $provide.value(
      'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
    $provide.value('SuggestionObjectFactory', new SuggestionObjectFactory());
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value('SolutionValidityService', new SolutionValidityService());
    $provide.value('SuggestionModalService', new SuggestionModalService());
    $provide.value(
      'ThreadStatusDisplayService', new ThreadStatusDisplayService());
    $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
    $provide.value('UserInfoObjectFactory', new UserInfoObjectFactory());
    $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
    $provide.value(
      'WrittenTranslationsObjectFactory',
      new WrittenTranslationsObjectFactory(
        new WrittenTranslationObjectFactory()));
    $provide.value(
      'LearnerAnswerDetailsObjectFactory',
      new LearnerAnswerDetailsObjectFactory());
    $provide.value(
      'LearnerAnswerInfoObjectFactory', new LearnerAnswerInfoObjectFactory());
  }));
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

      expect(task.isObsolete()).toBe(false);
      expect(task.getDirectiveData()).toBe(mockThread);
      expect(task.getDirectiveType()).toEqual(FEEDBACK_IMPROVEMENT_TASK_TYPE);
    });
  });

  describe('.fetchTasks', function() {
    it('fetches threads from the backend', function(done) {
      var threads = {
        feedbackThreads: [{ threadId: 'abc1' }, { threadId: 'def2' }]
      };

      spyOn(ThreadDataService, 'fetchThreads').and
        .returnValue($q.resolve(threads));
      var fetchMessagesSpy = spyOn(ThreadDataService, 'fetchMessages');

      FeedbackImprovementTaskObjectFactory.fetchTasks().then(function(tasks) {
        expect(fetchMessagesSpy)
          .toHaveBeenCalledTimes(threads.feedbackThreads.length);
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

    describe('.getLastUpdatedTime', function() {
      it('returns the time when this task was last updated', function() {
        expect(this.task.getLastUpdatedTime())
          .toBe(this.mockThread.last_updated);
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
