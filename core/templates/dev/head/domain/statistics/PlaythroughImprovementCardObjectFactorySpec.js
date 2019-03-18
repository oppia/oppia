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
    this.PLAYTHROUGH_IMPROVEMENT_CARD_TYPE =
      $injector.get('PLAYTHROUGH_IMPROVEMENT_CARD_TYPE');

    var expId = '7';
    var expVersion = 1;
    this.PlaythroughIssuesService = $injector.get('PlaythroughIssuesService');
    this.PlaythroughIssuesService.initSession(expId, expVersion);
  }));

  describe('.createNew', function() {
    it('retrieves data from passed issue', function() {
      var issue = this.PlaythroughIssueObjectFactory.createFromBackendDict({
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {value: 'Hola'},
          time_spent_in_exp_in_msecs: {value: 5000},
        },
        playthrough_ids: ['1', '2'],
        schema_version: 1,
        is_valid: true,
      });

      var card = this.PlaythroughImprovementCardObjectFactory.createNew(issue);

      expect(card.getTitle()).toEqual(
        this.PlaythroughIssuesService.renderIssueStatement(issue));
      expect(card.getDirectiveData()).toEqual({
        suggestions:
          this.PlaythroughIssuesService.renderIssueSuggestions(issue),
        playthroughIds: ['1', '2'],
      });
      expect(card.getDirectiveType()).toEqual(
        this.PLAYTHROUGH_IMPROVEMENT_CARD_TYPE);
    });
  });

  describe('.fetchCards', function() {
    it('returns a card for each existing issue', function(done) {
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

      spyOn(this.PlaythroughIssuesService, 'getIssues').and.returnValue(
        Promise.resolve([
          earlyQuitIssue,
          multipleIncorrectSubmissionsIssue,
          cyclicTransitionsIssue,
        ]));

      this.PlaythroughImprovementCardObjectFactory.fetchCards()
        .then(function(cards) {
          expect(cards.length).toEqual(3);
          expect(cards[0].getTitle()).toEqual(earlyQuitCardTitle);
          expect(cards[1].getTitle())
            .toEqual(multipleIncorrectSubmissionsCardTitle);
          expect(cards[2].getTitle()).toEqual(cyclicTransitionsCardTitle);
        }).then(done, done.fail);
    });
  });

  describe('PlaythroughImprovementCard', function() {
    beforeEach(function() {
      this.issue = this.PlaythroughIssueObjectFactory.createFromBackendDict({
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {value: 'Hola'},
          time_spent_in_exp_in_msecs: {value: 5000},
        },
        playthrough_ids: [],
        schema_version: 1,
        is_valid: true,
      });
      this.card =
        this.PlaythroughImprovementCardObjectFactory.createNew(this.issue);
    });

    describe('.getActionButtons', function() {
      it('contains a specific sequence of buttons', function() {
        expect(this.card.getActionButtons().length).toEqual(1);
        expect(this.card.getActionButtons()[0].getText()).toEqual('Discard');
      });
    });

    describe('Discard Action Button', function() {
      beforeEach(inject(function($injector) {
        this.$uibModal = $injector.get('$uibModal');
      }));

      it('marks the card as resolved after confirmation', function(done) {
        var card = this.card;
        var issue = this.issue;
        var discardActionButton = card.getActionButtons()[0];
        var resolveIssueSpy =
          spyOn(this.PlaythroughIssuesService, 'resolveIssue').and.stub();

        spyOn(this.$uibModal, 'open').and.returnValue({
          result: Promise.resolve(), // Returned when confirm button is pressed.
        });

        expect(card.isOpen()).toBe(true);
        discardActionButton.execute().then(function() {
          expect(resolveIssueSpy).toHaveBeenCalledWith(issue);
          expect(card.isOpen()).toBe(false);
          done();
        }, function() {
          done.fail('dismiss button unexpectedly failed.');
        });
      });

      it('keeps the card after cancel', function(done) {
        var card = this.card;
        var issue = this.issue;
        var discardActionButton = card.getActionButtons()[0];
        var resolveIssueSpy =
          spyOn(this.PlaythroughIssuesService, 'resolveIssue').and.stub();

        spyOn(this.$uibModal, 'open').and.returnValue({
          result: Promise.reject(), // Returned when cancel button is pressed.
        });

        expect(card.isOpen()).toBe(true);
        discardActionButton.execute().then(function() {
          done.fail('dismiss button unexpectedly succeeded.');
        }, function() {
          expect(resolveIssueSpy).not.toHaveBeenCalled();
          expect(card.isOpen()).toBe(true);
          done();
        });
      });
    });
  });
});
