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

import { AnswerClassificationResult } from
  'domain/classifier/AnswerClassificationResultObjectFactory.ts';
import { Classifier } from 'domain/classifier/ClassifierObjectFactory.ts';
import { ExplorationDraft } from
  'domain/exploration/ExplorationDraftObjectFactory.ts';
import { Rule } from 'domain/exploration/RuleObjectFactory.ts';
import { WrittenTranslation } from
  'domain/exploration/WrittenTranslationObjectFactory.ts';

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
      $provide.value('AnswerClassificationResultObjectFactory', {
        createNew: function(
            outcome: any, answerGroupIndex: any, ruleIndex: any,
            classificationCategorization: any) {
          return new AnswerClassificationResult(
            outcome, answerGroupIndex, ruleIndex, classificationCategorization);
        }
      });
      $provide.value('ClassifierObjectFactory', {
        create: function(
            algorithmId: any, classifierData: any, dataSchemaVersion: any) {
          return new Classifier(algorithmId, classifierData, dataSchemaVersion);
        }
      });
      $provide.value('ExplorationDraftObjectFactory', {
        createFromLocalStorageDict: function(explorationDraftDict) {
          return new ExplorationDraft(
            explorationDraftDict.draftChanges,
            explorationDraftDict.draftChangeListId);
        },
        toLocalStorageDict: function(changeList, draftChangeListId) {
          return {
            draftChanges: changeList,
            draftChangeListId: draftChangeListId
          };
        }
      });
      $provide.value('ImprovementsService', {
        isStateForcedToResolveOutstandingUnaddressedAnswers: function(state) {
          return !!state && ['TextInput'].indexOf(
            state.interaction.id) !== -1;
        }
      });
      $provide.value('RuleObjectFactory', {
        createNew: function(type, inputs) {
          return new Rule(type, inputs);
        },
        createFromBackendDict: function(ruleDict) {
          return new Rule(ruleDict.rule_type, ruleDict.inputs);
        }
      });
      $provide.value('WrittenTranslationObjectFactory', {
        createNew: function(html) {
          return new WrittenTranslation(html, false);
        },
        createFromBackendDict(translationBackendDict) {
          return new WrittenTranslation(
            translationBackendDict.html,
            translationBackendDict.needs_update);
        }
      });
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
