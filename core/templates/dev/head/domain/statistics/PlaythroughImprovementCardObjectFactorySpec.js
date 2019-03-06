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
    this.PlaythroughIssuesService = $injector.get('PlaythroughIssuesService');

    this.expId = '7';
    this.expVersion = 1;
  }));

  describe('PlaythroughImprovementCard', function() {
    describe('.getActions', function() {
      beforeEach(function() {
        this.PlaythroughIssuesService.initSession(this.expId, this.expVersion);
        this.issue = new this.PlaythroughIssueObjectFactory(
          'EarlyQuit',
          /*issueCustomizationArgs=*/{
            state_name: {value: 'Hola'},
            time_spent_in_exp_in_msecs: {value: 5000},
          },
          /*learnerActions=*/[], 1, true);
        this.card =
          this.PlaythroughImprovementCardObjectFactory.createNew(this.issue);
      });

      it('contains actions in a specific order', function() {
        var actions = this.card.getActions();
        expect(actions.length).toEqual(1);
        expect(actions[0].getName()).toEqual('Archive');
      });

      describe('Archive action', function() {
        it('marks the card as resolved', function() {
          var archiveCardAction = this.card.getActions()[0];

          expect(this.card.isResolved()).toBe(false);
          archiveCardAction.performAction();
          expect(this.card.isResolved()).toBe(true);
        });
      });
    });
  });
});
