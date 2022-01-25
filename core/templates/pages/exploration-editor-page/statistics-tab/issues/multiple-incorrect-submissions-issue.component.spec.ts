// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for multipleIncorrectSubmissionsIssue.
 */

import { TestBed } from '@angular/core/testing';

import { SubtitledHtml } from
  'domain/exploration/subtitled-html.model';
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Multiple Incorrect Submissions Issue Component', function() {
  var ctrl = null;
  var explorationStatesService = null;
  var learnerActionObjectFactory = null;

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

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'StateEditorRefreshService', TestBed.get(StateEditorRefreshService));
  }));

  beforeEach(function() {
    learnerActionObjectFactory = TestBed.get(LearnerActionObjectFactory);
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    explorationStatesService = $injector.get('ExplorationStatesService');

    ctrl = $componentController('multipleIncorrectSubmissionsIssue', {
      $attrs: {
        finalBlock: (
          '[{"actionCustomizationArgs":{"state_name":{"value":"Continue"}},' +
          '"actionType":"NotAnswerSubmit"}]'),
        actionStartIndex: 1
      }
    });
  }));

  it('should check if action type is answer submit', function() {
    expect(ctrl.isActionSubmit({
      actionType: 'AnswerSubmit'
    })).toBe(true);
    expect(ctrl.isActionSubmit({
      actionType: 'NotAnswerSubmit'
    })).toBe(false);
  });

  it('should get learner action index based on action start index', function() {
    expect(ctrl.actionStartIndex).toBe(1);
    expect(ctrl.getLearnerActionIndex(0)).toBe(2);
    expect(ctrl.getLearnerActionIndex(1)).toBe(3);
    expect(ctrl.getLearnerActionIndex(2)).toBe(4);
  });

  it('should get feedback from an action', function() {
    var action = {
      actionCustomizationArgs: {
        feedback: {
          value: SubtitledHtml.createDefault(
            'This is the {{answer}}', '1')
        },
        submitted_answer: {
          value: ''
        }
      }
    };

    spyOn(explorationStatesService, 'getState').and.returnValue({
      interaction: {
        id: 'Continue',
        customizationArgs: []
      }
    });
    expect(ctrl.getFeedback(action)).toBe(
      'This is the <oppia-short-response-continue' +
      ' answer="&amp;quot;&amp;quot;"></oppia-short-response-continue>');
  });

  it('should render leaner action html according to action customization args',
    function() {
      var learnerAction = learnerActionObjectFactory.createFromBackendDict({
        action_type: 'AnswerSubmit',
        action_customization_args: {
          interaction_id: {
            value: 'Continue'
          },
          time_spent_in_state_in_msecs: {
            value: 100
          },
          time_spent_state_in_msecs: {
            value: 100
          },
          dest_state_name: {
            value: 'Final'
          },
          submitted_answer: {
            value: ''
          },
          state_name: {
            value: 'Introduction'
          }
        },
        schema_version: 1
      });

      spyOn(explorationStatesService, 'getState').and.returnValue({
        interaction: {
          id: 'Continue',
          customizationArgs: []
        }
      });
      expect(ctrl.renderLearnerAction(learnerAction, 1)).toBe(
        '1. Pressed "Continue" to move to card "Final" after 0.1 seconds.');
    });
});
