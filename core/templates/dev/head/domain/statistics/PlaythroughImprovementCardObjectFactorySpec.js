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
    this.PlaythroughIssuesService.initSession(this.expId, this.expVersion);
  }));

  describe('.createNew', function() {
  });

  describe('.fetchCards', function() {
  });

  describe('PlaythroughImprovementCard', function() {
    describe('.getActionButtons', function() {
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
      });

      describe('Archive Action', function() {
        beforeEach(inject(function($injector) {
          this.$httpBackend = $injector.get('$httpBackend');
        }));
        afterEach(function() {
          this.$httpBackend.verifyNoOutstandingExpectation();
          this.$httpBackend.verifyNoOutstandingRequest();
        });

        it('marks the card as resolved', function() {
          var card =
            this.PlaythroughImprovementCardObjectFactory.createNew(this.issue);
          var archiveCardAction = card.getActionButtons()[0];

          expect(card.isResolved()).toBe(false);
          expect(archiveCardAction.getName()).toEqual('Archive');

          this.$httpBackend.expectPOST('/resolveissuehandler/7').respond();
          archiveCardAction.performAction();
          this.$httpBackend.flush();

          expect(card.isResolved()).toBe(true);
        });
      });
    });
  });
});
