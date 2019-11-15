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
 * @fileoverview Unit tests for the PlaythroughImprovementTaskObjectFactory.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// PlaythroughImprovementTaskObjectFactory.ts is upgraded to Angular 8.
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
import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { FeedbackThreadObjectFactory } from
  'domain/feedback_thread/FeedbackThreadObjectFactory';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { ImprovementActionButtonObjectFactory } from
  'domain/statistics/ImprovementActionButtonObjectFactory';
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { PlaythroughIssueObjectFactory } from
  'domain/statistics/PlaythroughIssueObjectFactory';
import { PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
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
import { SuggestionObjectFactory } from
  'domain/suggestion/SuggestionObjectFactory';
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

require('domain/statistics/PlaythroughImprovementTaskObjectFactory');

describe('PlaythroughImprovementTaskObjectFactory', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var PlaythroughImprovementTaskObjectFactory = null;
  var PlaythroughIssuesService = null;
  var UserExplorationPermissionsService = null;
  var PLAYTHROUGH_IMPROVEMENT_TASK_TYPE = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', new AngularNameService());
    $provide.value(
      'AnswerClassificationResultObjectFactory',
      new AnswerClassificationResultObjectFactory());
    $provide.value(
      'AnswerGroupObjectFactory',
      new AnswerGroupObjectFactory(
        new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
        new RuleObjectFactory()));
    $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
    $provide.value('EditabilityService', new EditabilityService());
    $provide.value(
      'ExplorationDraftObjectFactory', new ExplorationDraftObjectFactory());
    $provide.value(
      'ExplorationFeaturesService', new ExplorationFeaturesService());
    $provide.value(
      'FeedbackThreadObjectFactory', new FeedbackThreadObjectFactory());
    $provide.value('FractionObjectFactory', new FractionObjectFactory());
    $provide.value(
      'HintObjectFactory',
      new HintObjectFactory(new SubtitledHtmlObjectFactory()));
    $provide.value(
      'ImprovementActionButtonObjectFactory',
      new ImprovementActionButtonObjectFactory());
    $provide.value(
      'LearnerActionObjectFactory', new LearnerActionObjectFactory());
    $provide.value(
      'OutcomeObjectFactory',
      new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()));
    $provide.value('ParamChangeObjectFactory', new ParamChangeObjectFactory());
    $provide.value(
      'ParamChangesObjectFactory', new ParamChangesObjectFactory(
        new ParamChangeObjectFactory()));
    $provide.value(
      'PlaythroughIssueObjectFactory', new PlaythroughIssueObjectFactory());
    $provide.value(
      'PlaythroughObjectFactory', new PlaythroughObjectFactory(
        new LearnerActionObjectFactory()));
    $provide.value(
      'RecordedVoiceoversObjectFactory',
      new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value('SolutionValidityService', new SolutionValidityService());
    $provide.value(
      'StateClassifierMappingService', new StateClassifierMappingService(
        new ClassifierObjectFactory()));
    $provide.value(
      'StateEditorService', new StateEditorService(
        new SolutionValidityService()));
    $provide.value(
      'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
    $provide.value('SuggestionModalService', new SuggestionModalService());
    $provide.value('SuggestionObjectFactory', new SuggestionObjectFactory());
    $provide.value(
      'ThreadStatusDisplayService', new ThreadStatusDisplayService());
    $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
    $provide.value('UserInfoObjectFactory', new UserInfoObjectFactory());
    $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory', new WrittenTranslationObjectFactory());
    $provide.value(
      'WrittenTranslationsObjectFactory',
      new WrittenTranslationsObjectFactory(
        new WrittenTranslationObjectFactory()));
    $provide.value(
      'LearnerAnswerDetailsObjectFactory',
      new LearnerAnswerDetailsObjectFactory());
    $provide.value(
      'LearnerAnswerInfoObjectFactory', new LearnerAnswerInfoObjectFactory());

    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.upgradedServices)) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_,
      _PlaythroughImprovementTaskObjectFactory_, _PlaythroughIssuesService_,
      _UserExplorationPermissionsService_, _PLAYTHROUGH_IMPROVEMENT_TASK_TYPE_,
      // TODO(#7222): Import these as done above after
      // PlaythroughImprovementTaskObjectFactory is upgraded to Angular 8.
      ExplorationFeaturesService, PlaythroughIssueObjectFactory) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $uibModal = _$uibModal_;
    PlaythroughImprovementTaskObjectFactory =
      _PlaythroughImprovementTaskObjectFactory_;
    PlaythroughIssuesService = _PlaythroughIssuesService_;
    UserExplorationPermissionsService = _UserExplorationPermissionsService_;
    PLAYTHROUGH_IMPROVEMENT_TASK_TYPE = _PLAYTHROUGH_IMPROVEMENT_TASK_TYPE_;

    // TODO(#7222): Use these as done above after
    // PlaythroughImprovementTaskObjectFactory is upgraded to Angular 8.
    this.ExplorationFeaturesService = ExplorationFeaturesService;
    this.PlaythroughIssueObjectFactory = PlaythroughIssueObjectFactory;
  }));

  beforeEach(function() {
    this.expId = '7';
    this.expVersion = 1;
    PlaythroughIssuesService.initSession(this.expId, this.expVersion);

    this.scope = $rootScope.$new();
  });

  describe('.createNew', function() {
    beforeEach(function() {
      spyOn(UserExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue($q.resolve({can_edit: true}));
    });

    it('retrieves data from passed issue', function() {
      var issue = this.PlaythroughIssueObjectFactory.createFromBackendDict({
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {value: 'Hola'},
          time_spent_in_exp_in_msecs: {value: 5000},
        },
        playthrough_ids: ['1', '2'],
        schema_version: 1,
        is_valid: true,
      });

      var task = PlaythroughImprovementTaskObjectFactory.createNew(issue);

      expect(task.getTitle())
        .toEqual(PlaythroughIssuesService.renderIssueStatement(issue));
      expect(task.getDirectiveData()).toEqual({
        title: PlaythroughIssuesService.renderIssueStatement(issue),
        suggestions: PlaythroughIssuesService.renderIssueSuggestions(issue),
        playthroughIds: ['1', '2'],
      });
      expect(task.getDirectiveType())
        .toEqual(PLAYTHROUGH_IMPROVEMENT_TASK_TYPE);
    });
  });

  describe('.fetchTasks', function() {
    beforeEach(function() {
      this.earlyQuitIssue =
        this.PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'EarlyQuit',
          issue_customization_args: {
            state_name: {value: 'Hola'},
            time_spent_in_exp_in_msecs: {value: 5000},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
      this.multipleIncorrectSubmissionsIssue =
        this.PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'MultipleIncorrectSubmissions',
          issue_customization_args: {
            state_name: {value: 'Hola'},
            num_times_answered_incorrectly: {value: 4},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
      this.cyclicTransitionsIssue =
        this.PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'CyclicTransitions',
          issue_customization_args: {
            state_names: {value: ['Hola', 'Me Llamo', 'Hola']},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
      this.getIssuesSpy = spyOn(PlaythroughIssuesService, 'getIssues')
        .and.returnValue($q.resolve([
          this.earlyQuitIssue,
          this.multipleIncorrectSubmissionsIssue,
          this.cyclicTransitionsIssue,
        ]));

      spyOn(UserExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue($q.resolve({can_edit: true}));
    });

    it('returns task for each issue if recording is enabled', function(done) {
      spyOn(this.ExplorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(true);

      PlaythroughImprovementTaskObjectFactory.fetchTasks()
        .then(allTasks => allTasks.map(task => task.getTitle()))
        .then(allTaskTitles => {
          expect(allTaskTitles).toEqual([
            PlaythroughIssuesService.renderIssueStatement(
              this.earlyQuitIssue),
            PlaythroughIssuesService.renderIssueStatement(
              this.multipleIncorrectSubmissionsIssue),
            PlaythroughIssuesService.renderIssueStatement(
              this.cyclicTransitionsIssue),
          ]);
        }).then(done, done.fail);

      // Force all pending promises to evaluate.
      this.scope.$digest();
    });

    it('returns nothing if recording is disabled', function(done) {
      spyOn(this.ExplorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(false);

      PlaythroughImprovementTaskObjectFactory.fetchTasks()
        .then(allTasks => allTasks.map(task => task.getTitle()))
        .then(allTaskTitles => {
          expect(allTaskTitles).toEqual([]);
          expect(this.getIssuesSpy).not.toHaveBeenCalled();
        }).then(done, done.fail);

      // Force all pending promises to evaluate.
      this.scope.$digest();
    });
  });

  describe('PlaythroughImprovementTask', function() {
    beforeEach(function() {
      this.issue = this.PlaythroughIssueObjectFactory.createFromBackendDict({
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {value: 'Hola'},
          time_spent_in_exp_in_msecs: {value: 5000},
        },
        playthrough_ids: [],
        schema_version: 1,
        is_valid: true,
      });
    });

    describe('.getActionButtons', function() {
      describe('for a user with edit permissions', function() {
        it('has the mark as resolved button', function() {
          spyOn(UserExplorationPermissionsService, 'getPermissionsAsync')
            .and.returnValue($q.resolve({can_edit: true}));

          var task = PlaythroughImprovementTaskObjectFactory.createNew(
            this.issue);

          // Force all pending promises to evaluate.
          this.scope.$digest();

          expect(task.getActionButtons().map(button => button.getText()))
            .toEqual(['Mark as Resolved']);
        });
      });

      describe('for a user without edit permissions', function() {
        it('has no buttons', function() {
          spyOn(UserExplorationPermissionsService, 'getPermissionsAsync')
            .and.returnValue($q.resolve({can_edit: false}));

          var task = PlaythroughImprovementTaskObjectFactory.createNew(
            this.issue);

          // Force all pending promises to evaluate.
          this.scope.$digest();

          expect(task.getActionButtons().map(button => button.getText()))
            .toEqual([]);
        });
      });
    });

    describe('Mark as Resolved Action Button', function() {
      beforeEach(function() {
        spyOn(UserExplorationPermissionsService, 'getPermissionsAsync')
          .and.returnValue($q.resolve({can_edit: true}));

        this.task = PlaythroughImprovementTaskObjectFactory.createNew(
          this.issue);
        // Force all pending promises to evaluate.
        this.scope.$digest();
        this.resolveActionButton = this.task.getActionButtons()[0];

        this.resolveIssueSpy =
          spyOn(PlaythroughIssuesService, 'resolveIssue').and.stub();
      });

      it('marks the task as resolved after confirmation', function() {
        expect(this.task.getStatus()).toEqual('open');

        // Mock confirmation by returning a resolved promise.
        spyOn($uibModal, 'open').and.returnValue({result: $q.resolve()});

        this.resolveActionButton.execute();

        // Force all pending promises to evaluate.
        this.scope.$digest();

        expect(this.resolveIssueSpy).toHaveBeenCalledWith(this.issue);
        expect(this.task.getStatus()).not.toEqual('open');
      });

      it('keeps the task after cancel', function() {
        expect(this.task.getStatus()).toEqual('open');

        // Mock cancellation by returning a rejected promise.
        spyOn($uibModal, 'open').and.returnValue({result: $q.reject()});

        this.resolveActionButton.execute();

        // Force all pending promises to evaluate.
        this.scope.$digest();

        expect(this.resolveIssueSpy).not.toHaveBeenCalled();
        expect(this.task.getStatus()).toEqual('open');
      });
    });
  });
});
