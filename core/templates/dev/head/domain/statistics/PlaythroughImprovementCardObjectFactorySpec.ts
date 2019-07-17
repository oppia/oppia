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

require('domain/statistics/PlaythroughImprovementCardObjectFactory.ts');
require('domain/statistics/PlaythroughIssueObjectFactory.ts');

describe('PlaythroughImprovementCardObjectFactory', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var PlaythroughImprovementCardObjectFactory = null;
  var PlaythroughIssueObjectFactory = null;
  var PlaythroughIssuesService = null;
  var PLAYTHROUGH_IMPROVEMENT_CARD_TYPE = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_,
      _PlaythroughImprovementCardObjectFactory_,
      _PlaythroughIssueObjectFactory_, _PlaythroughIssuesService_,
      _PLAYTHROUGH_IMPROVEMENT_CARD_TYPE_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $uibModal = _$uibModal_;
    PlaythroughImprovementCardObjectFactory =
      _PlaythroughImprovementCardObjectFactory_;
    PlaythroughIssueObjectFactory = _PlaythroughIssueObjectFactory_;
    PlaythroughIssuesService = _PlaythroughIssuesService_;
    PLAYTHROUGH_IMPROVEMENT_CARD_TYPE = _PLAYTHROUGH_IMPROVEMENT_CARD_TYPE_;

    PlaythroughIssuesService.initSession(expId, expVersion);

    var expId = '7';
    var expVersion = 1;
    this.scope = $rootScope.$new();
  }));

  describe('.createNew', function() {
    it('retrieves data from passed issue', function() {
      var issue = PlaythroughIssueObjectFactory.createFromBackendDict({
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {value: 'Hola'},
          time_spent_in_exp_in_msecs: {value: 5000},
        },
        playthrough_ids: ['1', '2'],
        schema_version: 1,
        is_valid: true,
      });

      var card = PlaythroughImprovementCardObjectFactory.createNew(issue);

      expect(card.getTitle()).toEqual(
        PlaythroughIssuesService.renderIssueStatement(issue));
      expect(card.getDirectiveData()).toEqual({
        title: PlaythroughIssuesService.renderIssueStatement(issue),
        suggestions:
          PlaythroughIssuesService.renderIssueSuggestions(issue),
        playthroughIds: ['1', '2'],
      });
      expect(card.getDirectiveType()).toEqual(
        PLAYTHROUGH_IMPROVEMENT_CARD_TYPE);
    });
  });

  describe('.fetchCards', function() {
    it('returns a card for each existing issue', function(done) {
      var earlyQuitIssue =
        PlaythroughIssueObjectFactory.createFromBackendDict({
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
        PlaythroughIssuesService.renderIssueStatement(earlyQuitIssue);

      var multipleIncorrectSubmissionsIssue =
        PlaythroughIssueObjectFactory.createFromBackendDict({
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
        PlaythroughIssuesService.renderIssueStatement(
          multipleIncorrectSubmissionsIssue);

      var cyclicTransitionsIssue =
        PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'CyclicTransitions',
          issue_customization_args: {
            state_names: {value: ['Hola', 'Me Llamo', 'Hola']},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
      var cyclicTransitionsCardTitle =
        PlaythroughIssuesService.renderIssueStatement(
          cyclicTransitionsIssue);

      spyOn(PlaythroughIssuesService, 'getIssues').and.returnValue(
        $q.resolve([
          earlyQuitIssue,
          multipleIncorrectSubmissionsIssue,
          cyclicTransitionsIssue,
        ]));

      PlaythroughImprovementCardObjectFactory.fetchCards()
        .then(function(cards) {
          expect(cards.length).toEqual(3);
          expect(cards[0].getTitle()).toEqual(earlyQuitCardTitle);
          expect(cards[1].getTitle())
            .toEqual(multipleIncorrectSubmissionsCardTitle);
          expect(cards[2].getTitle()).toEqual(cyclicTransitionsCardTitle);
        }).then(done, done.fail);

      this.scope.$digest(); // Forces all pending promises to evaluate.
    });
  });

  describe('PlaythroughImprovementCard', function() {
    beforeEach(function() {
      this.issue = PlaythroughIssueObjectFactory.createFromBackendDict({
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {value: 'Hola'},
          time_spent_in_exp_in_msecs: {value: 5000},
        },
        playthrough_ids: [],
        schema_version: 1,
        is_valid: true,
      });
      this.card = PlaythroughImprovementCardObjectFactory.createNew(this.issue);
    });

    describe('.getActionButtons', function() {
      it('contains a specific sequence of buttons', function() {
        expect(this.card.getActionButtons().length).toEqual(1);
        expect(this.card.getActionButtons()[0].getText())
          .toEqual('Mark as Resolved');
      });
    });

    describe('Mark as Resolved Action Button', function() {
      it('marks the card as resolved after confirmation', function(done) {
        var card = this.card;
        var issue = this.issue;
        var resolveActionButton = card.getActionButtons()[0];
        var resolveIssueSpy =
          spyOn(PlaythroughIssuesService, 'resolveIssue').and.stub();

        spyOn($uibModal, 'open').and.returnValue({
          result: $q.resolve(), // Returned when confirm button is pressed.
        });

        expect(card.isOpen()).toBe(true);
        resolveActionButton.execute().then(function() {
          expect(resolveIssueSpy).toHaveBeenCalledWith(issue);
          expect(card.isOpen()).toBe(false);
          done();
        }, function() {
          done.fail('dismiss button unexpectedly failed.');
        });

        this.scope.$digest(); // Forces all pending promises to evaluate.
      });

      it('keeps the card after cancel', function(done) {
        var card = this.card;
        var issue = this.issue;
        var resolveActionButton = card.getActionButtons()[0];
        var resolveIssueSpy =
          spyOn(PlaythroughIssuesService, 'resolveIssue').and.stub();

        spyOn($uibModal, 'open').and.returnValue({
          result: $q.reject(), // Returned when cancel button is pressed.
        });

        expect(card.isOpen()).toBe(true);
        resolveActionButton.execute().then(function() {
          done.fail('dismiss button unexpectedly succeeded.');
        }, function() {
          expect(resolveIssueSpy).not.toHaveBeenCalled();
          expect(card.isOpen()).toBe(true);
          done();
        });

        this.scope.$digest(); // Forces all pending promises to evaluate.
      });
    });
  });
});
