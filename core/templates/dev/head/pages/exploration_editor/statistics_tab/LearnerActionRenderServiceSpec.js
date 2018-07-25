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
 */

describe('Learner Action Render Service', function() {
  beforeEach(module('oppia'));

  describe('Test learner action render service functions', function() {
    beforeEach(inject(function($injector) {
      this.laof = $injector.get('LearnerActionObjectFactory');
      this.ps = $injector.get('PlaythroughService');
      spyOn(this.ps, 'isPlayerExcludedFromSamplePopulation').and.returnValue(
        false);
      spyOn(this.ps, 'isExplorationWhitelisted').and.returnValue(true);
      this.lars = $injector.get('LearnerActionRenderService');
      this.ps.initSession('expId1', 1);
    }));

    it('should split up EarlyQuit learner actions into display blocks.',
      function() {
        this.ps.recordExplorationStartAction('stateName1');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'Continue', '', 'Welcome', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName2', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordExplorationQuitAction('stateName2', 120);

        var learnerActions = this.ps.getPlaythrough().actions;
        var displayBlocks = this.lars.getDisplayBlocks(learnerActions);

        expect(displayBlocks).toEqual([[
          this.laof.createNew(
            'ExplorationStart', {
              state_name: {
                value: 'stateName1'
              }
            }, 1
          ),
          jasmine.any(Object),
          jasmine.any(Object),
          this.laof.createNew(
            'ExplorationQuit', {
              state_name: {
                value: 'stateName2'
              },
              time_spent_in_state_secs: {
                value: 120
              }
            }, 1
          )
        ]]);
      });

    it('should split up many learner actions into different display blocks.',
      function() {
        this.ps.recordExplorationStartAction('stateName1');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordExplorationQuitAction('stateName1', 120);

        var learnerActions = this.ps.getPlaythrough().actions;
        var displayBlocks = this.lars.getDisplayBlocks(learnerActions);

        expect(displayBlocks).toEqual([
          [
            this.laof.createNew(
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
                answer: {
                  value: 'Hello'
                },
                feedback: {
                  value: 'Try again'
                },
                time_spent_in_state_secs: {
                  value: 30
                }
              }, 1
            ),
            jasmine.any(Object),
            jasmine.any(Object),
            this.laof.createNew(
              'ExplorationQuit', {
                state_name: {
                  value: 'stateName1'
                },
                time_spent_in_state_secs: {
                  value: 120
                }
              }, 1
            )
          ],
          [
            this.laof.createNew(
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
                answer: {
                  value: 'Hello'
                },
                feedback: {
                  value: 'Try again'
                },
                time_spent_in_state_secs: {
                  value: 30
                }
              }, 1
            ),
            jasmine.any(Object),
            jasmine.any(Object),
            this.laof.createNew(
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
                answer: {
                  value: 'Hello'
                },
                feedback: {
                  value: 'Try again'
                },
                time_spent_in_state_secs: {
                  value: 30
                }
              }, 1
            )
          ],
          [
            this.laof.createNew(
              'ExplorationStart', {
                state_name: {
                  value: 'stateName1'
                }
              }, 1
            ),
            jasmine.any(Object),
            this.laof.createNew(
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
                answer: {
                  value: 'Hello'
                },
                feedback: {
                  value: 'Try again'
                },
                time_spent_in_state_secs: {
                  value: 30
                }
              }, 1
            )
          ]
        ]);
      });

    it('should assign multiple learner actions at same state to same block.',
      function() {
        this.ps.recordExplorationStartAction('stateName1');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordExplorationQuitAction('stateName1', 120);

        var learnerActions = this.ps.getPlaythrough().actions;
        var displayBlocks = this.lars.getDisplayBlocks(learnerActions);

        expect(displayBlocks).toEqual([[
          this.laof.createNew(
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
          this.laof.createNew(
            'ExplorationQuit', {
              state_name: {
                value: 'stateName1'
              },
              time_spent_in_state_secs: {
                value: 120
              }
            }, 1
          )
        ]])
      });

    it('should render tables for MultipleIncorrectSubmissions issue block.',
      function() {
        this.ps.recordExplorationStartAction('stateName1');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.ps.recordExplorationQuitAction('stateName1', 120);

        var learnerActions = this.ps.getPlaythrough().actions;
        var displayBlocks = this.lars.getDisplayBlocks(learnerActions);

        expect(displayBlocks.length).toEqual(1);

        var finalBlockHTML = this.lars.renderFinalDisplayBlockForMISIssueHTML(
          displayBlocks[0]);

        expect(finalBlockHTML).toEqual(
          '<span class="learner-action">Started exploration at card ' +
          '"stateName1".</span>' +
          '<span class="learner-action">Submitted the following answers in ' +
          'card "stateName1"</span>' +
          '<table class="learner-actions-table"><tr><th>Answer</th>' +
          '<th>Feedback</th></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr></table>' +
          '<span class="learner-action">Left the exploration after spending ' +
          'a total of 120 seconds on card "stateName1".</span>'
        );
      });

    it('should render HTML for learner action display blocks.', function() {
      this.ps.recordExplorationStartAction('stateName1');
      this.ps.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'Continue', '', 'Welcome', 30);
      this.ps.recordAnswerSubmitAction(
        'stateName2', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
      this.ps.recordExplorationQuitAction('stateName2', 120);

      var learnerActions = this.ps.getPlaythrough().actions;
      var displayBlocks = this.lars.getDisplayBlocks(learnerActions);

      expect(displayBlocks.length).toEqual(1);

      var blockHTML = this.lars.renderDisplayBlockHTML(displayBlocks[0]);

      expect(blockHTML).toEqual(
        '<span class="learner-action">Started exploration at card ' +
        '"stateName1".</span>' +
        '<span class="learner-action">Pressed "Continue" to move to card ' +
        '"stateName2" after 30 seconds.</span>' +
        '<span class="learner-action">Submitted answer "Hello" in card ' +
        '"stateName2".</span>' +
        '<span class="learner-action">Left the exploration after spending a ' +
        'total of 120 seconds on card "stateName2".</span>'
      );
    });
  });
});
