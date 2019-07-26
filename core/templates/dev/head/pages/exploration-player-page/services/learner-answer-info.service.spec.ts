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

import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service.ts';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory.ts';
import { EditabilityService } from 'services/EditabilityService.ts';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory.ts';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory.ts';
import { CodeNormalizerService } from
  'services/CodeNormalizerService.ts';
import { ExplorationFeaturesService } from
  'services/ExplorationFeaturesService.ts';
import { ImprovementsService } from 'services/ImprovementsService.ts';
import { PredictionResultObjectFactory } from
  'domain/classifier/PredictionResultObjectFactory.ts';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory.ts';
/* eslint-disable max-len */
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service.ts';
/* eslint-enable max-len */
import { SuggestionObjectFactory } from
  'domain/suggestion/SuggestionObjectFactory.ts';
import { SuggestionModalService } from 'services/SuggestionModalService.ts';
import { TopicRightsObjectFactory } from
  'domain/topic/TopicRightsObjectFactory.ts';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory.ts';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory.ts';

require('domain/exploration/OutcomeObjectFactory.ts');
require(
  'pages/exploration-player-page/services/learner-answer-info.service.ts');
require('domain/state/StateObjectFactory.ts');


describe('Learner answer info service', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', new AngularNameService());
    $provide.value(
      'AnswerClassificationResultObjectFactory',
      new AnswerClassificationResultObjectFactory());
    $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
    $provide.value('CodeNormalizerService', new CodeNormalizerService());
    $provide.value('EditabilityService', new EditabilityService());
    $provide.value(
      'ExplorationDraftObjectFactory', new ExplorationDraftObjectFactory());
    $provide.value(
      'ExplorationFeaturesService', new ExplorationFeaturesService());
    $provide.value('ImprovementsService', new ImprovementsService());
    $provide.value(
      'PredictionResultObjectFactory', new PredictionResultObjectFactory());
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value('SolutionValidityService', new SolutionValidityService());
    $provide.value('SuggestionModalService', new SuggestionModalService());
    $provide.value('SuggestionObjectFactory', new SuggestionObjectFactory());
    $provide.value('TopicRightsObjectFactory', new TopicRightsObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
    $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
  }));

  var sof = null;
  var oof = null;
  var acrof = null;
  var stateDict = null;
  var state = null;
  var mockAnswerClassificationService = null;
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
    DEFAULT_OUTCOME_CLASSIFICATION = $injector.get(
      'DEFAULT_OUTCOME_CLASSIFICATION');
    state = sof.createFromBackendDict('new state', stateDict);
    spyOn(
      mockAnswerClassificationService,
      'getMatchingClassificationResult').and.returnValue(acrof.createNew(
      oof.createNew('default', 'default_outcome', '', []), 2, 0,
      DEFAULT_OUTCOME_CLASSIFICATION));
  }));

  it('should be able to evaluate ask for learner answer info', function() {
    expect(typeof (LearnerAnswerInfoService.evalAskLearnerForAnswerInfo(
      '10', state, 'a', 'b'))).toEqual('boolean');
  });

  it('should be able to return can ask learner answer info', function() {
    expect(
      LearnerAnswerInfoService.canAskLearnerForAnswerInfo()).toEqual(false);
  });

  it('should return current answer as null', function() {
    expect(LearnerAnswerInfoService.getCurrentAnswer()).toBeNull();
  });
});
