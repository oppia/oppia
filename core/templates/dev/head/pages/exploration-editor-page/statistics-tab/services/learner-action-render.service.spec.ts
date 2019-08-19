// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the learner action render service.
 *
 * NOTE: To make tests shorter, we skip some elements and simply check
 * jasmine.any(Object).
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// learner-action-render.service.ts is upgraded to Angular 8.
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { EditabilityService } from 'services/EditabilityService';
import { ExplorationFeaturesService } from
  'services/ExplorationFeaturesService';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
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
import { SuggestionModalService } from 'services/SuggestionModalService';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
// ^^^ This block is to be removed.

require('domain/statistics/LearnerActionObjectFactory.ts');
require(
  'pages/exploration-editor-page/statistics-tab/services/' +
  'learner-action-render.service.ts');
require('services/PlaythroughService.ts');

describe('Learner Action Render Service', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(function($provide) {
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
    $provide.value('FractionObjectFactory', new FractionObjectFactory());
    $provide.value(
      'HintObjectFactory', new HintObjectFactory(
        new SubtitledHtmlObjectFactory()));
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

  describe('Test learner action render service functions', function() {
    beforeEach(angular.mock.inject(function($injector) {
      this.$sce = $injector.get('$sce');
      this.LearnerActionObjectFactory =
        $injector.get('LearnerActionObjectFactory');
      this.PlaythroughService = $injector.get('PlaythroughService');
      this.ExplorationStatesService = $injector.get('ExplorationStatesService');
      this.ExplorationFeaturesService =
        $injector.get('ExplorationFeaturesService');
      this.PlaythroughService.initSession('expId1', 1, 1.0);
      spyOn(this.ExplorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(true);

      spyOn(this.ExplorationStatesService, 'getState')
        .withArgs('stateName1').and.returnValue(
          { interaction: { id: 'Continue'}})
        .withArgs('stateName2').and.returnValue(
          { interaction: { id: 'TextInput'}})
        .withArgs('stateName3').and.returnValue(
          { interaction: {
            id: 'MultipleChoiceInput',
            customizationArgs: {
              choices: {
                value: [
                  'Choice1',
                  'Choice2',
                  'Choice3'
                ]
              }
            }}
          });

      this.LearnerActionRenderService =
        $injector.get('LearnerActionRenderService');
    }));

    it('should split up EarlyQuit learner actions into display blocks.',
      function() {
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'Continue', '', 'Welcome', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName2', 120);

        var learnerActions = this.PlaythroughService.getPlaythrough().actions;
        var displayBlocks =
          this.LearnerActionRenderService.getDisplayBlocks(learnerActions);

        expect(displayBlocks).toEqual([[
          this.LearnerActionObjectFactory.createNew(
            'ExplorationStart', {
              state_name: {
                value: 'stateName1'
              }
            }, 1
          ),
          jasmine.any(Object),
          jasmine.any(Object),
          this.LearnerActionObjectFactory.createNew(
            'ExplorationQuit', {
              state_name: {
                value: 'stateName2'
              },
              time_spent_in_state_in_msecs: {
                value: 120
              }
            }, 1
          )
        ]]);
      });

    it('should split up many learner actions into different display blocks.',
      function() {
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName1', 120);

        var learnerActions = this.PlaythroughService.getPlaythrough().actions;
        var displayBlocks =
          this.LearnerActionRenderService.getDisplayBlocks(learnerActions);

        expect(displayBlocks).toEqual([
          [
            this.LearnerActionObjectFactory.createNew(
              'AnswerSubmit', {
                state_name: {
                  value: 'stateName1'
                },
                dest_state_name: {
                  value: 'stateName2'
                },
                interaction_id: {
                  value: 'TextInput'
                },
                submitted_answer: {
                  value: 'Hello'
                },
                feedback: {
                  value: 'Try again'
                },
                time_spent_state_in_msecs: {
                  value: 30
                }
              }, 1
            ),
            jasmine.any(Object),
            jasmine.any(Object),
            this.LearnerActionObjectFactory.createNew(
              'ExplorationQuit', {
                state_name: {
                  value: 'stateName1'
                },
                time_spent_in_state_in_msecs: {
                  value: 120
                }
              }, 1
            )
          ],
          [
            this.LearnerActionObjectFactory.createNew(
              'AnswerSubmit', {
                state_name: {
                  value: 'stateName3'
                },
                dest_state_name: {
                  value: 'stateName1'
                },
                interaction_id: {
                  value: 'TextInput'
                },
                submitted_answer: {
                  value: 'Hello'
                },
                feedback: {
                  value: 'Try again'
                },
                time_spent_state_in_msecs: {
                  value: 30
                }
              }, 1
            ),
            jasmine.any(Object),
            jasmine.any(Object),
            this.LearnerActionObjectFactory.createNew(
              'AnswerSubmit', {
                state_name: {
                  value: 'stateName3'
                },
                dest_state_name: {
                  value: 'stateName1'
                },
                interaction_id: {
                  value: 'TextInput'
                },
                submitted_answer: {
                  value: 'Hello'
                },
                feedback: {
                  value: 'Try again'
                },
                time_spent_state_in_msecs: {
                  value: 30
                }
              }, 1
            )
          ],
          [
            this.LearnerActionObjectFactory.createNew(
              'ExplorationStart', {
                state_name: {
                  value: 'stateName1'
                }
              }, 1
            ),
            jasmine.any(Object),
            this.LearnerActionObjectFactory.createNew(
              'AnswerSubmit', {
                state_name: {
                  value: 'stateName2'
                },
                dest_state_name: {
                  value: 'stateName3'
                },
                interaction_id: {
                  value: 'TextInput'
                },
                submitted_answer: {
                  value: 'Hello'
                },
                feedback: {
                  value: 'Try again'
                },
                time_spent_state_in_msecs: {
                  value: 30
                }
              }, 1
            )
          ]
        ]);
      });

    it('should assign multiple learner actions at same state to same block.',
      function() {
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName1', 120);

        var learnerActions = this.PlaythroughService.getPlaythrough().actions;
        var displayBlocks =
          this.LearnerActionRenderService.getDisplayBlocks(learnerActions);

        expect(displayBlocks).toEqual([[
          this.LearnerActionObjectFactory.createNew(
            'ExplorationStart', {
              state_name: {
                value: 'stateName1'
              }
            }, 1
          ),
          jasmine.any(Object),
          jasmine.any(Object),
          jasmine.any(Object),
          jasmine.any(Object),
          jasmine.any(Object),
          jasmine.any(Object),
          this.LearnerActionObjectFactory.createNew(
            'ExplorationQuit', {
              state_name: {
                value: 'stateName1'
              },
              time_spent_in_state_in_msecs: {
                value: 120
              }
            }, 1
          )
        ]]);
      });

    it('should render tables for MultipleIncorrectSubmissions issue block.',
      function() {
        var feedback = {
          _html: 'Try again'
        };
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', feedback, 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', feedback, 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', feedback, 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', feedback, 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', feedback, 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName1', 120);

        var learnerActions = this.PlaythroughService.getPlaythrough().actions;
        var displayBlocks =
          this.LearnerActionRenderService.getDisplayBlocks(learnerActions);

        expect(displayBlocks.length).toEqual(1);

        var finalBlockHTML =
          this.LearnerActionRenderService
            .renderFinalDisplayBlockForMISIssueHTML(displayBlocks[0], 1);

        expect(this.$sce.getTrustedHtml(finalBlockHTML)).toEqual(
          '1. Started exploration at card "stateName1".' +
          '<span class="oppia-issues-learner-action">2. Submitted the ' +
          'following answers in card "stateName1"</span>' +
          '<table class="oppia-issues-learner-action-table"><tr><th>Answer' +
          '</th><th>Feedback</th></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr></table>' +
          '3. Left the exploration after spending a total of 120 seconds on ' +
          'card "stateName1".'
        );
      });

    it('should render HTML for learner action display blocks.', function() {
      this.PlaythroughService.recordExplorationStartAction('stateName1');
      this.PlaythroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'Continue', '', 'Welcome', 30);
      this.PlaythroughService.recordAnswerSubmitAction(
        'stateName2', 'stateName3', 'TextInput', 'Hello', 'Go ahead', 30);
      this.PlaythroughService.recordAnswerSubmitAction(
        'stateName3', 'stateName3', 'MultipleChoiceInput', 'Choice1',
        'Go ahead', 30);
      this.PlaythroughService.recordExplorationQuitAction('stateName2', 120);

      var learnerActions = this.PlaythroughService.getPlaythrough().actions;
      var displayBlocks =
        this.LearnerActionRenderService.getDisplayBlocks(learnerActions);

      expect(displayBlocks.length).toEqual(1);

      var actionHtmlList = [];
      for (var i = 0; i < displayBlocks[0].length; i++) {
        actionHtmlList.push(this.LearnerActionRenderService.renderLearnerAction(
          displayBlocks[0][i], 0, i + 1));
      }

      expect(actionHtmlList[0]).toEqual(
        '1. Started exploration at card "stateName1".');
      expect(actionHtmlList[1]).toEqual(
        '2. Pressed "Continue" to move to card "stateName2" after 30 seconds.');
      expect(actionHtmlList[2]).toEqual(
        '<answer-submit-action answer="&amp;quot;Hello&amp;quot;" ' +
        'dest-state-name="stateName3" time-spent-in-state-secs="30" ' +
        'current-state-name="stateName2" action-index="3" ' +
        'interaction-id="TextInput" interaction-customization-args=' +
        '"undefined"></answer-submit-action>');
      expect(actionHtmlList[3]).toEqual(
        '<answer-submit-action answer="&amp;quot;Choice1&amp;quot;" ' +
        'dest-state-name="stateName3" time-spent-in-state-secs="30" ' +
        'current-state-name="stateName3" action-index="4" ' +
        'interaction-id="MultipleChoiceInput" interaction-customization-args=' +
        '"{&amp;quot;choices&amp;quot;:{&amp;quot;value&amp;quot;:' +
        '[&amp;quot;Choice1&amp;quot;,&amp;quot;Choice2&amp;quot;,' +
        '&amp;quot;Choice3&amp;quot;]}}"></answer-submit-action>');
      expect(actionHtmlList[4]).toEqual(
        '5. Left the exploration after spending a total of 120 seconds on ' +
        'card "stateName2".');
    });
  });
});
