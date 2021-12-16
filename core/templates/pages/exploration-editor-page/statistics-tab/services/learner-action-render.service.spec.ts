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
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { SubtitledHtml } from
  'domain/exploration/subtitled-html.model';

require('pages/exploration-editor-page/services/exploration-states.service');
require(
  'pages/exploration-editor-page/statistics-tab/services/' +
  'learner-action-render.service.ts');

describe('Learner Action Render Service', function() {
  let explorationStatesService = null;
  let learnerActionObjectFactory: LearnerActionObjectFactory = null;
  let learnerActionRenderService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));
  importAllAngularServices();
  beforeEach(angular.mock.inject(function($injector) {
    explorationStatesService = $injector.get('ExplorationStatesService');
    learnerActionObjectFactory = $injector.get('LearnerActionObjectFactory');
    learnerActionRenderService = $injector.get('LearnerActionRenderService');
  }));

  beforeEach(() => {
    spyOn(explorationStatesService, 'getState')
      .withArgs('stateName1').and.returnValue({
        interaction: {
          id: 'Continue',
          customizationArgs: {
            buttonText: {value: new SubtitledUnicode('', '')}
          }
        }
      })
      .withArgs('stateName2').and.returnValue({
        interaction: {
          id: 'TextInput',
          customizationArgs: {
            placeholder: {value: new SubtitledUnicode('', '')},
            rows: {value: 1}
          }
        }
      })
      .withArgs('stateName3').and.returnValue({
        interaction: {
          id: 'MultipleChoiceInput',
          customizationArgs: {
            choices: {value: [
              new SubtitledHtml('Choice1', ''),
              new SubtitledHtml('Choice2', ''),
              new SubtitledHtml('Choice3', '')
            ]},
            showChoicesInShuffledOrder: {value: true}
          }
        }
      });
  });

  describe('Test learner action render service functions', () => {
    it('should render correct learner actions', () => {
      let actions = [
        learnerActionObjectFactory.createNewExplorationStartAction({
          state_name: {value: 'stateName1'},
        }),
        learnerActionObjectFactory.createNewAnswerSubmitAction({
          state_name: {value: 'stateName1'},
          dest_state_name: {value: 'stateName2'},
          interaction_id: {value: 'Continue'},
          submitted_answer: {value: ''},
          feedback: {value: 'Welcome'},
          time_spent_state_in_msecs: {value: 30000},
        }),
        learnerActionObjectFactory.createNewAnswerSubmitAction({
          state_name: {value: 'stateName2'},
          dest_state_name: {value: 'stateName2'},
          interaction_id: {value: 'TextInput'},
          submitted_answer: {value: 'Hello'},
          feedback: {value: 'Try again'},
          time_spent_state_in_msecs: {value: 30000},
        }),
        learnerActionObjectFactory.createNewExplorationQuitAction({
          state_name: {value: 'stateName2'},
          time_spent_in_state_in_msecs: {value: 120000},
        }),
      ];

      let renderedStatements = actions.map(
        (a, i) => learnerActionRenderService.renderLearnerAction(a, i + 1));

      expect(renderedStatements[0]).toEqual(
        '1. Started exploration at card "stateName1".');
      expect(renderedStatements[1]).toEqual(
        '2. Pressed "Continue" to move to card "stateName2" after 30 seconds.');
      expect(renderedStatements[3]).toEqual(
        '4. Left the exploration after spending a total of 120 seconds on ' +
        'card "stateName2".');
    });

    it('should render the table for a Multiple Incorrect Submissions issue',
      () => {
        // We pass a sample learner actions array just to find out whether
        // the directive rendered is being initialised with the right values.
        let learnerActions = [{key: 'value'}];
        let tableDirective = (
          learnerActionRenderService.renderFinalDisplayBlockForMISIssueHTML(
            learnerActions, 1));
        expect(tableDirective).toEqual(
          '<multiple-incorrect-submissions-issue final-block="[{&amp;quot;ke' +
          'y&amp;quot;:&amp;quot;value&amp;quot;}]" action-start-index="1"><' +
          '/multiple-incorrect-submissions-issue>');
      });
  });
});
