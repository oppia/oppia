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
 * @fileoverview Unit tests for the PlaythroughImprovementCardObjectFactory.
 */

describe('PlaythroughImprovementCardObjectFactory', function() {
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    this.PlaythroughImprovementCardObjectFactory =
      $injector.get('PlaythroughImprovementCardObjectFactory');
    this.PlaythroughIssueObjectFactory =
      $injector.get('PlaythroughIssueObjectFactory');

    var expId = '7';
    var expVersion = 1;
    this.PlaythroughIssuesService = $injector.get('PlaythroughIssuesService');
    this.PlaythroughIssuesService.initSession(expId, expVersion);
  }));

  describe('.fetchCards', function() {
    it('returns a card for each issue', function(done) {
      var earlyQuitIssue =
        this.PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'EarlyQuit',
          issue_customization_args: {
            state_name: {value: 'Hola'},
            time_spent_in_exp_in_msecs: {value: 5000},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
      var earlyQuitCardTitle =
        this.PlaythroughIssuesService.renderIssueStatement(earlyQuitIssue);

      var multipleIncorrectSubmissionsIssue =
        this.PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'MultipleIncorrectSubmissions',
          issue_customization_args: {
            state_name: {value: 'Hola'},
            num_times_answered_incorrectly: {value: 4},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
      var multipleIncorrectSubmissionsCardTitle =
        this.PlaythroughIssuesService.renderIssueStatement(
          multipleIncorrectSubmissionsIssue);

      var cyclicTransitionsIssue =
        this.PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'CyclicTransitions',
          issue_customization_args: {
            state_names: {value: ['Hola', 'Me Llamo', 'Hola']},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
      var cyclicTransitionsCardTitle =
        this.PlaythroughIssuesService.renderIssueStatement(
          cyclicTransitionsIssue);

      var checkCards = function(cards) {
        expect(cards.length).toEqual(3);
        expect(cards[0].getTitle()).toEqual(earlyQuitCardTitle);
        expect(cards[1].getTitle())
          .toEqual(multipleIncorrectSubmissionsCardTitle);
        expect(cards[2].getTitle()).toEqual(cyclicTransitionsCardTitle);
        done();
      };

      spyOn(this.PlaythroughIssuesService, 'getIssues')
        .and.callFake(function() {
          return Promise.resolve([
            earlyQuitIssue,
            multipleIncorrectSubmissionsIssue,
            cyclicTransitionsIssue,
          ]);
        });

      this.PlaythroughImprovementCardObjectFactory.fetchCards()
        .then(checkCards, done.fail);
      }
    );
  });

  describe('PlaythroughImprovementCard', function() {
    describe('.getActionButtons', function() {
      describe('Archive Action', function() {
        beforeEach(inject(function($injector) {
          this.$httpBackend = $injector.get('$httpBackend');
        }));
        afterEach(function() {
          this.$httpBackend.verifyNoOutstandingExpectation();
          this.$httpBackend.verifyNoOutstandingRequest();
        });

        it('marks the card as resolved', function() {
          var issue = this.PlaythroughIssueObjectFactory.createFromBackendDict({
            issue_type: 'EarlyQuit',
            issue_customization_args: {
              state_name: {value: 'Hola'},
              time_spent_in_exp_in_msecs: {value: 5000},
            },
            playthrough_ids: [],
            schema_version: 1,
            is_valid: true,
          });

          var card =
            this.PlaythroughImprovementCardObjectFactory.createNew(issue);

          var firstActionButton = card.getActionButtons()[0];

          expect(card.isResolved()).toBe(false);
          expect(firstActionButton.getName()).toEqual('Archive');

          this.$httpBackend.expectPOST('/resolveissuehandler/7').respond();
          firstActionButton.execute();
          this.$httpBackend.flush();
          expect(card.isResolved()).toBe(true);
        });
      });
    });
  });
});
