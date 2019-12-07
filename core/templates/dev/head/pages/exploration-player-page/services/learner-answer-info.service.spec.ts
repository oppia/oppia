// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the learner answer info service.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
/* eslint-disable max-len */
import { AnswerGroupsCacheService } from
  'pages/exploration-editor-page/editor-tab/services/answer-groups-cache.service';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
/* eslint-disable max-len */
import { ChangeObjectFactory } from
  'domain/editor/undo_redo/ChangeObjectFactory';
import { EditabilityService } from 'services/editability.service';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { CodeNormalizerService } from
  'services/code-normalizer.service';
import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { ImprovementsService } from 'services/improvements.service';
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { LearnerParamsService } from
  'pages/exploration-player-page/services/learner-params.service';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { ParamMetadataObjectFactory } from
  'domain/exploration/ParamMetadataObjectFactory';
import { ParamSpecObjectFactory } from
  'domain/exploration/ParamSpecObjectFactory';
import { ParamSpecsObjectFactory } from
  'domain/exploration/ParamSpecsObjectFactory';
import { ParamTypeObjectFactory } from
  'domain/exploration/ParamTypeObjectFactory';
import { PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';
import { PredictionResultObjectFactory } from
  'domain/classifier/PredictionResultObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
/* eslint-disable max-len */
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
import { StoryNodeObjectFactory } from
  'domain/story/StoryNodeObjectFactory';
/* eslint-enable max-len */
import { SuggestionObjectFactory } from
  'domain/suggestion/SuggestionObjectFactory';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { SuggestionModalService } from 'services/suggestion-modal.service';
/* eslint-disable max-len */
import { ThreadStatusDisplayService } from
  'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';
/* eslint-enable max-len */
import { TopicRightsObjectFactory } from
  'domain/topic/TopicRightsObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { VersionTreeService } from
  'pages/exploration-editor-page/history-tab/services/version-tree.service';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/exploration/OutcomeObjectFactory.ts');
require(
  'pages/exploration-player-page/services/learner-answer-info.service.ts');
require('domain/state/StateObjectFactory.ts');


describe('Learner answer info service', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'AnswerClassificationResultObjectFactory',
      new AnswerClassificationResultObjectFactory());
    $provide.value(
      'AnswerGroupsCacheService', new AnswerGroupsCacheService());
    $provide.value(
      'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
        new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
        new RuleObjectFactory()));
    $provide.value('ChangeObjectFactory', new ChangeObjectFactory());
    $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
    $provide.value('CodeNormalizerService', new CodeNormalizerService());
    $provide.value('EditabilityService', new EditabilityService());
    $provide.value(
      'ExplorationDraftObjectFactory', new ExplorationDraftObjectFactory());
    $provide.value(
      'ExplorationFeaturesService', new ExplorationFeaturesService());
    $provide.value('FractionObjectFactory', new FractionObjectFactory());
    $provide.value(
      'HintObjectFactory', new HintObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value('ImprovementsService', new ImprovementsService());
    $provide.value(
      'LearnerActionObjectFactory', new LearnerActionObjectFactory());
    $provide.value('LearnerParamsService', new LearnerParamsService());
    $provide.value(
      'OutcomeObjectFactory', new OutcomeObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value(
      'ParamChangesObjectFactory', new ParamChangesObjectFactory(
        new ParamChangeObjectFactory()));
    $provide.value(
      'ParamSpecObjectFactory',
      new ParamSpecObjectFactory(new ParamTypeObjectFactory()));
    $provide.value(
      'ParamSpecsObjectFactory',
      new ParamSpecsObjectFactory(
        new ParamSpecObjectFactory(new ParamTypeObjectFactory())));
    $provide.value('ParamTypeObjectFactory', new ParamTypeObjectFactory());
    $provide.value(
      'ParamChangeObjectFactory', new ParamChangeObjectFactory());
    $provide.value(
      'ParamMetadataObjectFactory', new ParamMetadataObjectFactory());
    $provide.value(
      'PlaythroughObjectFactory', new PlaythroughObjectFactory(
        new LearnerActionObjectFactory()));
    $provide.value(
      'PredictionResultObjectFactory', new PredictionResultObjectFactory());
    $provide.value(
      'RecordedVoiceoversObjectFactory',
      new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value('SolutionValidityService', new SolutionValidityService());
    $provide.value(
      'StateClassifierMappingService', new StateClassifierMappingService(
        new ClassifierObjectFactory()));
    $provide.value('StoryNodeObjectFactory', new StoryNodeObjectFactory());
    $provide.value(
      'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
    $provide.value('SuggestionModalService', new SuggestionModalService());
    $provide.value('SuggestionObjectFactory', new SuggestionObjectFactory());
    $provide.value(
      'ThreadStatusDisplayService', new ThreadStatusDisplayService());
    $provide.value('TopicRightsObjectFactory', new TopicRightsObjectFactory());
    $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
    $provide.value('VersionTreeService', new VersionTreeService());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
    $provide.value(
      'WrittenTranslationsObjectFactory',
      new WrittenTranslationsObjectFactory(
        new WrittenTranslationObjectFactory()));
    $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  var sof = null;
  var oof = null;
  var acrof = null;
  var stateDict = null;
  var firstState = null;
  var secondState = null;
  var thirdState = null;
  var mockAnswerClassificationService = null;
  var mockAnswer = null;
  var mockInteractionRulesService = null;
  var ladbas = null;
  var LearnerAnswerInfoService = null;
  var DEFAULT_OUTCOME_CLASSIFICATION;

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value(
        'AnswerClassificationService', [mockAnswerClassificationService][0]);
    });
  });

  beforeEach(function() {
    mockAnswerClassificationService = {
      getMatchingClassificationResult: function() {},
    };
  });

  beforeEach(angular.mock.inject(function($injector) {
    stateDict = {
      content: {
        content_id: 'content',
        html: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
          feedback_1: {},
          feedback_2: {}
        }
      },
      interaction: {
        id: 'RuleTest',
        answer_groups: [{
          outcome: {
            dest: 'outcome 1',
            feedback: {
              content_id: 'feedback_1',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          rule_specs: [{
            inputs: {
              x: 10
            },
            rule_type: 'Equals'
          }]
        }, {
          outcome: {
            dest: 'outcome 2',
            feedback: {
              content_id: 'feedback_2',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          rule_specs: [{
            inputs: {
              x: 5
            },
            rule_type: 'Equals'
          }, {
            inputs: {
              x: 7
            },
            rule_type: 'NotEquals'
          }, {
            inputs: {
              x: 6
            },
            rule_type: 'Equals'
          }]
        }],
        default_outcome: {
          dest: 'default',
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: []
      },
      param_changes: [],
      solicit_answer_details: true,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
          feedback_1: {},
          feedback_2: {}
        }
      }
    };

    sof = $injector.get('StateObjectFactory');
    oof = $injector.get('OutcomeObjectFactory');
    acrof = $injector.get('AnswerClassificationResultObjectFactory');
    LearnerAnswerInfoService = $injector.get('LearnerAnswerInfoService');
    ladbas = $injector.get(
      'LearnerAnswerDetailsBackendApiService');
    DEFAULT_OUTCOME_CLASSIFICATION = $injector.get(
      'DEFAULT_OUTCOME_CLASSIFICATION');
    firstState = sof.createFromBackendDict('new state', stateDict);
    secondState = sof.createFromBackendDict('fake state', stateDict);
    thirdState = sof.createFromBackendDict('demo state', stateDict);
    spyOn(
      mockAnswerClassificationService,
      'getMatchingClassificationResult').and.returnValue(acrof.createNew(
      oof.createNew('default', 'default_outcome', '', []), 2, 0,
      DEFAULT_OUTCOME_CLASSIFICATION));
    mockAnswer = 'This is my answer';
    mockInteractionRulesService = {
      Equals: function(answer, inputs) {
        return inputs.x === answer;
      },
      NotEquals: function(answer, inputs) {
        return inputs.x !== answer;
      }
    };
    // Spying the random function to return 0, so that
    // getRandomProbabilityIndex() returns 0, which is a private function in
    // LearnerAnswerInfoService. This will help to mark the
    // canAskLearnerAnswerInfo which is a boolean variable as true as every
    // probability index is greater than 0.
    spyOn(Math, 'random').and.returnValue(0);
  }));

  describe('.initLearnerAnswerInfo', function() {
    beforeEach(function() {
      LearnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', firstState, mockAnswer, mockInteractionRulesService, false);
    });

    it('should return can ask learner for answer info true', function() {
      expect(LearnerAnswerInfoService.canAskLearnerForAnswerInfo()).toEqual(
        true);
    });

    it('should return current answer', function() {
      expect(LearnerAnswerInfoService.getCurrentAnswer()).toEqual(
        'This is my answer');
    });

    it('should return current interaction rules service', function() {
      expect(
        LearnerAnswerInfoService.getCurrentInteractionRulesService()).toEqual(
        mockInteractionRulesService);
    });
  });

  describe('learner answer info service', function() {
    beforeEach(function() {
      LearnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', firstState, mockAnswer, mockInteractionRulesService, false);
    });

    it('should not ask for answer details for same state', function() {
      expect(LearnerAnswerInfoService.canAskLearnerForAnswerInfo()).toEqual(
        true);
      LearnerAnswerInfoService.recordLearnerAnswerInfo('My answer details');
      expect(LearnerAnswerInfoService.canAskLearnerForAnswerInfo()).toEqual(
        false);
      LearnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', firstState, mockAnswer, mockInteractionRulesService, false);
      expect(LearnerAnswerInfoService.canAskLearnerForAnswerInfo()).toEqual(
        false);
    });
  });

  describe(
    'should not ask for answer details for trivial interaction ids',
    function() {
      beforeEach(function() {
        firstState.interaction.id = 'EndExploration';
        LearnerAnswerInfoService.initLearnerAnswerInfoService(
          '10', firstState, mockAnswer, mockInteractionRulesService, false);
      });

      it('should return can ask learner for answer info false', function() {
        expect(LearnerAnswerInfoService.canAskLearnerForAnswerInfo()).toEqual(
          false);
      });
    });

  describe('init learner answer info service with solicit answer details false',
    function() {
      beforeEach(function() {
        firstState.solicitAnswerDetails = false;
        LearnerAnswerInfoService.initLearnerAnswerInfoService(
          '10', firstState, mockAnswer, mockInteractionRulesService, false);
      });
      it('should return can ask learner for answer info false', function() {
        expect(LearnerAnswerInfoService.canAskLearnerForAnswerInfo()).toEqual(
          false);
      });
    });


  describe('.recordLearnerAnswerInfo', function() {
    beforeEach(function() {
      LearnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', firstState, mockAnswer, mockInteractionRulesService, false);
    });

    it('should record learner answer details', function() {
      spyOn(ladbas, 'recordLearnerAnswerDetails');
      LearnerAnswerInfoService.recordLearnerAnswerInfo('My details');
      expect(
        ladbas.recordLearnerAnswerDetails).toHaveBeenCalledWith(
        '10', 'new state', 'RuleTest', 'This is my answer', 'My details');
    });
  });

  describe('learner answer info service', function() {
    beforeEach(function() {
      LearnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', firstState, mockAnswer, mockInteractionRulesService, false);
      LearnerAnswerInfoService.recordLearnerAnswerInfo('My details 1');
      LearnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', secondState, mockAnswer, mockInteractionRulesService, false);
      LearnerAnswerInfoService.recordLearnerAnswerInfo('My details 1');
    });

    it('should not record answer details more than two times', function() {
      LearnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', thirdState, mockAnswer, mockInteractionRulesService, false);
      expect(LearnerAnswerInfoService.canAskLearnerForAnswerInfo()).toEqual(
        false);
    });
  });

  describe('return html from the service', function() {
    it('should return solicit answer details question', function() {
      expect(
        LearnerAnswerInfoService.getSolicitAnswerDetailsQuestion()).toEqual(
        '<p translate="I18N_SOLICIT_ANSWER_DETAILS_QUESTION"></p>');
    });

    it('should return solicit answer details feedabck', function() {
      expect(
        LearnerAnswerInfoService.getSolicitAnswerDetailsFeedback()).toEqual(
        '<p translate="I18N_SOLICIT_ANSWER_DETAILS_FEEDBACK"></p>');
    });
  });
});
