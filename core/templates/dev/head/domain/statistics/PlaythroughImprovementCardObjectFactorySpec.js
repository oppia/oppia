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
  }));

  describe('PlaythroughImprovementCard', function() {
    describe('.getResolutionActions', function() {
      beforeEach(function() {
        this.card = this.PlaythroughImprovementCardObjectFactory.createNew();
      });

      it('contains actions in a specific order', function() {
        expect(this.card.getResolutionActions()).toEqual([
          jasmine.objectContaining({name: 'Archive Card'}),
        ]);
      });

      describe('Archive Card action', function() {
        it('resolves the card', function() {
          var archiveCardAction = this.card.getResolutionActions()[0];

          expect(this.card.isResolved()).toBe(false);
          archiveCardAction.perform();
          expect(this.card.isResolved()).toBe(true);
        });
      });
    });
  });
});
