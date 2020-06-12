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
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { PlaythroughService } from 'services/playthrough.service';

require('pages/exploration-editor-page/services/exploration-states.service');
require(
  'pages/exploration-editor-page/statistics-tab/services/' +
  'learner-action-render.service.ts');

describe('Learner Action Render Service', function() {
  var explorationFeaturesService: ExplorationFeaturesService = null;
  var explorationStatesService = null;
  var learnerActionRenderService = null;
  var playthroughService: PlaythroughService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    playthroughService = $injector.get('PlaythroughService');
    explorationStatesService = $injector.get('ExplorationStatesService');
    explorationFeaturesService = $injector.get('ExplorationFeaturesService');
    learnerActionRenderService = $injector.get('LearnerActionRenderService');
  }));

  beforeEach(function() {
    playthroughService.initSession('expId1', 1, 1.0);

    spyOn(explorationFeaturesService, 'isPlaythroughRecordingEnabled')
      .and.returnValue(true);

    spyOn(explorationStatesService, 'getState')
      .withArgs('stateName1').and.returnValue({
        interaction: { id: 'Continue'}
      })
      .withArgs('stateName2').and.returnValue({
        interaction: { id: 'TextInput'}
      })
      .withArgs('stateName3').and.returnValue({
        interaction: {
          id: 'MultipleChoiceInput',
          customizationArgs: {
            choices: {value: ['Choice1', 'Choice2', 'Choice3']}
          }
        }
      });
  });

  describe('Test learner action render service functions', function() {
    it('should render correct learner actions', function() {
      playthroughService.recordExplorationStartAction('stateName1');
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'Continue', '', 'Welcome', 30);
      playthroughService.recordAnswerSubmitAction(
        'stateName2', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
      playthroughService.recordExplorationQuitAction('stateName2', 120);

      var renderedStatements = playthroughService.getPlaythrough().actions.map(
        a => learnerActionRenderService.renderLearnerAction(a));

      expect(renderedStatements[0]).toEqual(
        '1. Started exploration at card "stateName1".');
      expect(renderedStatements[1]).toEqual(
        '2. Pressed "Continue" to move to card "stateName2" after 30 seconds.');
      expect(renderedStatements[3]).toEqual(
        '4. Left the exploration after spending a total of 120 seconds on ' +
        'card "stateName2".');
    });

    it('should render the table for a Multiple Incorrect Submissions issue',
      function() {
        // We pass a sample learner actions array just to find out whether
        // the directive rendered is being initialised with the right values.
        var learnerActions = [{key: 'value'}];
        var tableDirective = (
          learnerActionRenderService.renderFinalDisplayBlockForMISIssueHTML(
            learnerActions, 1));
        expect(tableDirective).toEqual(
          '<multiple-incorrect-submissions-issue final-block="[{&amp;quot;ke' +
          'y&amp;quot;:&amp;quot;value&amp;quot;}]" action-start-index="1"><' +
          '/multiple-incorrect-submissions-issue>');
      });
  });
});
