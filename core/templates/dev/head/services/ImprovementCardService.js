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
 * @fileoverview Service for consolidating and accessing the types of
 * improvement cards that can be rendered in the Improvements Tab.
 *
 * All Improvement Cards must provide the following functions (which are
 * enforced by unit tests):
 *   - Card.fetchCards() -> Promise<Card[]>
 *       A "static" function that can be called on the factory itself. It should
 *       return a Promise of an array of cards associated to the current
 *       exploration.
 *   - Card.prototype.isResolved() -> boolean
 *       A "member" function which returns whether the improvement which the
 *       card suggests has been resolved.
 *   - Card.prototype.resolve()
 *       A "member" function which marks the card as resolved.
 *   - Card.prototype.getTitle() -> string
 *   - Card.prototype.getContentHtml() -> string
 *   - Card.prototype.getResolutions() -> ImprovementResolution[]
 */

oppia.factory('ImprovementCardService', [
  'PlaythroughImprovementCardObjectFactory',
  function(PlaythroughImprovementCardObjectFactory) {
    /** @type {Object[]} */
    var improvementCardRegistry = Object.freeze([
      PlaythroughImprovementCardObjectFactory,
    ]);

    return {
      /** @returns {Object[]} */
      getRegisteredCardObjectFactories: function() {
        return improvementCardRegistry;
      },

      /**
       * Returns a Promise of a list of open improvement cards for creators to
       * take action upon.
       *
       * IMPORTANT: DO NOT DEPEND ON THE ORDER OF CARDS RETURNED!!
       * When ordering matters, then *explicitly* sort the returned list.
       * Following this contract will make it easier to optimize the service in
       * the future.
       */
      fetchCards: function() {
        return Promise.all(
          improvementCardRegistry.map(function(improvementCardObjectFactory) {
            return improvementCardObjectFactory.fetchCards();
          })
        ).then(function(unresolvedCardsFromFactories) {
          // Flatten the cards into a single list before returning.
          return [].concat.apply([], unresolvedCardsFromFactories);
        });
      },
    };
  }
]);
