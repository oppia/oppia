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

// TODO(#7222): Remove the following block of unnnecessary imports once
// FeedbackImprovementCardObjectFactory.ts is upgraded to Angular 8.
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { EditabilityService } from 'services/EditabilityService';
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
import { SuggestionModalService } from 'services/SuggestionModalService';
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
// ^^^ This block is to be removed.

require('domain/statistics/AnswerDetailsImprovementCardObjectFactory.ts');

describe('AnswerDetailsImprovementCardObjectFactory', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var AnswerDetailsImprovementCardObjectFactory = null;
  var ImprovementModalService = null;
  var LearnerAnswerDetailsDataService = null;
  var ANSWER_DETAILS_IMPROVEMENT_CARD_TYPE = null;
  var STATUS_NOT_ACTIONABLE = null;
  var STATUS_OPEN = null;

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
      LearnerAnswerDetailsObjectFactory);
    $provide.value(
      'LearnerAnswerInfoObjectFactory', LearnerAnswerInfoObjectFactory);
  }));
  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_,
      _AnswerDetailsImprovementCardObjectFactory_, _ImprovementModalService_,
      _LearnerAnswerDetailsDataService_,
      _ANSWER_DETAILS_IMPROVEMENT_CARD_TYPE_,
      _STATUS_NOT_ACTIONABLE_, _STATUS_OPEN_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $uibModal = _$uibModal_;
    AnswerDetailsImprovementCardObjectFactory =
      _AnswerDetailsImprovementCardObjectFactory_;
    ImprovementModalService = _ImprovementModalService_;
    LearnerAnswerDetailsDataService = _LearnerAnswerDetailsDataService_;
    ANSWER_DETAILS_IMPROVEMENT_CARD_TYPE =
      _ANSWER_DETAILS_IMPROVEMENT_CARD_TYPE_;
    STATUS_NOT_ACTIONABLE = _STATUS_NOT_ACTIONABLE_;
    STATUS_OPEN = _STATUS_OPEN_;
  }));

  describe('.createNew', function() {
    it('retrieves data from passed thread', function() {
      var mockLearnerAnswerDetails = {learnerAnswerInfoData: 'sample'};
      var card = AnswerDetailsImprovementCardObjectFactory.createNew(
        mockLearnerAnswerDetails);

      expect(card.getDirectiveData()).toBe(mockLearnerAnswerDetails);
      expect(card.getDirectiveType()).toEqual(
        ANSWER_DETAILS_IMPROVEMENT_CARD_TYPE);
    });
  });

  describe('.fetchCards', function() {
    it('fetches threads from the backend', function(done) {
      spyOn(
        LearnerAnswerDetailsDataService,
        'fetchLearnerAnswerInfoData').and.callFake($q.resolve);
      spyOn(LearnerAnswerDetailsDataService, 'getData').and.returnValue(
        [{learnerAnswerInfoData: 'abc1'}, {learnerAnswerInfoData: 'def2'}]);

      AnswerDetailsImprovementCardObjectFactory.fetchCards().then(
        function(cards) {
          expect(
            cards[0].getDirectiveData().learnerAnswerInfoData).toEqual('abc1');
          expect(
            cards[1].getDirectiveData().learnerAnswerInfoData).toEqual('def2');
        }).then(done, done.fail);

      // $q Promises need to be forcibly resolved through a JavaScript digest,
      // which is what $apply helps kick-start.
      $rootScope.$apply();
    });
  });

  describe('AnswerDetailsImprovementCard', function() {
    beforeEach(function() {
      this.mockLearnerAnswerDetails = {
        expId: 12,
        stateName: 'fakeStateName',
        learnerAnswerInfoData: [{
          id: 1,
          answer: 'fakeAnswer',
          answer_details: 'fakeAnswerDetails',
          created_on: 1441870501230.642,
        }]
      };
      this.card =
        AnswerDetailsImprovementCardObjectFactory.createNew(
          this.mockLearnerAnswerDetails);
    });

    describe('.getStatus', function() {
      it('returns open as status', function() {
        expect(this.card.getStatus()).toEqual(STATUS_OPEN);
      });

      it('returns not actionable as status', function() {
        this.mockLearnerAnswerDetails.learnerAnswerInfoData = [];
        expect(this.card.getStatus()).toEqual(STATUS_NOT_ACTIONABLE);
      });
    });

    describe('.getTitle', function() {
      it('returns answer details as title', function() {
        expect(this.card.getTitle()).toEqual(
          'Answer details for the card "fakeStateName"');
      });
    });

    describe('.isObsolete', function() {
      it('returns is obsolete as false', function() {
        expect(this.card.isObsolete()).toEqual(false);
      });

      it('returns is obsolete as true', function() {
        this.mockLearnerAnswerDetails.learnerAnswerInfoData = [];
        expect(this.card.isObsolete()).toEqual(true);
      });
    });

    describe('.getDirectiveType', function() {
      it('returns answer details as directive type', function() {
        expect(this.card.getDirectiveType())
          .toEqual(ANSWER_DETAILS_IMPROVEMENT_CARD_TYPE);
      });
    });

    describe('.getDirectiveData', function() {
      it('returns the learner answer details', function() {
        expect(this.card.getDirectiveData()).toBe(
          this.mockLearnerAnswerDetails);
      });
    });

    describe('.getActionButtons', function() {
      it('contains one button', function() {
        expect(this.card.getActionButtons().length).toEqual(1);
      });
    });

    describe('first button', function() {
      beforeEach(function() {
        this.button = this.card.getActionButtons()[0];
      });

      it('opens a learner answer details modal', function() {
        var spy = spyOn(ImprovementModalService, 'openLearnerAnswerDetails');

        this.button.execute();

        expect(spy).toHaveBeenCalledWith(this.mockLearnerAnswerDetails);
      });
    });
  });
});
