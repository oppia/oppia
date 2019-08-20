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
 * @fileoverview Unit tests for the controller of the 'State Editor'.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// exploration-editor-tab.directive.ts is upgraded to Angular 8.
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { AnswerStatsObjectFactory } from
  'domain/exploration/AnswerStatsObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { ExplorationFeaturesService } from
  'services/ExplorationFeaturesService';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { ImprovementsService } from 'services/ImprovementsService';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { ParamMetadataObjectFactory } from
  'domain/exploration/ParamMetadataObjectFactory';
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
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
// ^^^ This block is to be removed.

require('App.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/' +
  'exploration-editor-tab.directive.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-content.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');

describe('Exploration editor tab controller', function() {
  describe('ExplorationEditorTab', function() {
    var ecs, ess, scs, rootScope, $componentController;
    var explorationEditorTabCtrl;

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
      $provide.value(
        'AnswerStatsObjectFactory', new AnswerStatsObjectFactory());
      $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
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
        'OutcomeObjectFactory', new OutcomeObjectFactory(
          new SubtitledHtmlObjectFactory()));
      $provide.value(
        'ParamChangeObjectFactory', new ParamChangeObjectFactory());
      $provide.value(
        'ParamChangesObjectFactory', new ParamChangesObjectFactory(
          new ParamChangeObjectFactory()));
      $provide.value(
        'ParamMetadataObjectFactory', new ParamMetadataObjectFactory());
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
      $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
      $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
      $provide.value(
        'WrittenTranslationObjectFactory',
        new WrittenTranslationObjectFactory());
      $provide.value(
        'WrittenTranslationsObjectFactory',
        new WrittenTranslationsObjectFactory(
          new WrittenTranslationObjectFactory()));
    }));
    beforeEach(angular.mock.inject(function(
        _$componentController_, $injector, $rootScope) {
      $componentController = _$componentController_;
      rootScope = $injector.get('$rootScope');
      spyOn(rootScope, '$broadcast');
      ecs = $injector.get('StateEditorService');
      ess = $injector.get('ExplorationStatesService');
      scs = $injector.get('StateContentService');

      ess.init({
        'First State': {
          content: {
            content_id: 'content',
            html: 'First State Content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            default_outcome: {
              dest: 'default',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: []
          },
          param_changes: [],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          }
        },
        'Second State': {
          content: {
            content_id: 'content',
            html: 'Second State Content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            default_outcome: {
              dest: 'default',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: []
          },
          param_changes: [],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          }
        },
        'Third State': {
          content: {
            content_id: 'content',
            html: 'This is some content.'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            default_outcome: {
              dest: 'default',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: []
          },
          param_changes: [{
            name: 'comparison',
            generator_id: 'Copier',
            customization_args: {
              value: 'something clever',
              parse_with_jinja: false
            }
          }],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          }
        }
      });

      explorationEditorTabCtrl = $componentController('explorationEditorTab', {
        ExplorationStatesService: ess
      }, {});
    }));

    it('should correctly broadcast the stateEditorInitialized flag with ' +
       'the state data', function() {
      ecs.setActiveStateName('Third State');
      explorationEditorTabCtrl.initStateEditor();
      expect(
        rootScope.$broadcast
      ).toHaveBeenCalledWith(
        'stateEditorInitialized', ess.getState('Third State')
      );
    });
  });
});
