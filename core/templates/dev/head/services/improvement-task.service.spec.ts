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
 * @fileoverview Unit tests for the ImprovementTaskService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// ImprovementTaskService.ts is upgraded to Angular 8.
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { EditabilityService } from './editability.service';
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
import { PlaythroughIssueObjectFactory } from
  'domain/statistics/PlaythroughIssueObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
/* eslint-disable max-len */
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
/* eslint-enable max-len */
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
/* eslint-disable max-len */
import { StateEditorService } from
  'components/state-editor/state-editor-properties-services/state-editor.service';
/* eslint-enable max-len */
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
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

require('domain/statistics/AnswerDetailsImprovementTaskObjectFactory.ts');
require('domain/statistics/FeedbackImprovementTaskObjectFactory.ts');
require('domain/statistics/PlaythroughImprovementTaskObjectFactory.ts');
require('domain/statistics/SuggestionImprovementTaskObjectFactory.ts');
require('services/improvement-task.service.ts');

describe('ImprovementTaskService', function() {
  var $q = null;
  var $rootScope = null;
  var ImprovementTaskService = null;
  var AnswerDetailsImprovementTaskObjectFactory = null;
  var FeedbackImprovementTaskObjectFactory = null;
  var PlaythroughImprovementTaskObjectFactory = null;
  var SuggestionImprovementTaskObjectFactory = null;

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
      'ExplorationFeaturesService', new ExplorationFeaturesService());
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
      'LearnerActionObjectFactory', new LearnerActionObjectFactory());
    $provide.value(
      'OutcomeObjectFactory', new OutcomeObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value(
      'ParamChangeObjectFactory', new ParamChangeObjectFactory());
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

    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _ImprovementTaskService_,
      _AnswerDetailsImprovementTaskObjectFactory_,
      _FeedbackImprovementTaskObjectFactory_,
      _PlaythroughImprovementTaskObjectFactory_,
      _SuggestionImprovementTaskObjectFactory_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    ImprovementTaskService = _ImprovementTaskService_;
    AnswerDetailsImprovementTaskObjectFactory =
      _AnswerDetailsImprovementTaskObjectFactory_;
    FeedbackImprovementTaskObjectFactory =
      _FeedbackImprovementTaskObjectFactory_;
    PlaythroughImprovementTaskObjectFactory =
      _PlaythroughImprovementTaskObjectFactory_;
    SuggestionImprovementTaskObjectFactory =
      _SuggestionImprovementTaskObjectFactory_;

    this.expectedFactories = [
      AnswerDetailsImprovementTaskObjectFactory,
      FeedbackImprovementTaskObjectFactory,
      PlaythroughImprovementTaskObjectFactory,
      SuggestionImprovementTaskObjectFactory,
    ];

    this.scope = $rootScope.$new();
  }));

  describe('.getImprovementTaskObjectFactoryRegistry', function() {
    it('contains all known improvement task object factories', function() {
      var actualFactories =
        ImprovementTaskService.getImprovementTaskObjectFactoryRegistry();

      // The registry should not be modifiable.
      expect(Object.isFrozen(actualFactories)).toBe(true);

      // Ordering isn't important, so allow the checks to be flexible.
      expect(actualFactories.length).toEqual(this.expectedFactories.length);
      this.expectedFactories.forEach(factory => {
        expect(actualFactories).toContain(factory);
      });
    });
  });

  describe('.fetchTasks', function() {
    // NOTE: Each individual factory should test their own fetchTasks function.

    it('returns empty list when each factory returns no tasks', function(done) {
      this.expectedFactories.forEach(factory => {
        spyOn(factory, 'fetchTasks').and.returnValue($q.resolve([]));
      });

      ImprovementTaskService.fetchTasks()
        .then(allTasks => expect(allTasks).toEqual([]))
        .then(done, done.fail);

      // Force all pending promises to evaluate.
      this.scope.$digest();
    });
  });
});
