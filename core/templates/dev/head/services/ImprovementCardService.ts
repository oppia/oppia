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
 * All Improvement Cards should provide the following functions:
 *   - Card.fetchCards() -> Promise<Card[]>
 *       A "static" function that can be called on the factory itself. It should
 *       return a Promise of an array of cards associated to the current
 *       exploration.
 *   - Card.prototype.isOpen() -> boolean
 *       A "member" function which returns whether the improvement which the
 *       card suggests is open, i.e., still relevant and actionable.
 *   - Card.prototype.getTitle() -> string
 *   - Card.prototype.getDirectiveType() -> string
 *   - Card.prototype.getDirectiveData() -> *
 *   - Card.prototype.getActionButtons() -> ImprovementActionButton[]
 */

oppia.factory('ImprovementCardService', [
  'PlaythroughImprovementCardObjectFactory',
  function(PlaythroughImprovementCardObjectFactory) {
    /** @type {Object[]} */
    var improvementCardObjectFactoryRegistry = Object.freeze([
      PlaythroughImprovementCardObjectFactory,
    ]);

    return {
      /** @returns {Object[]} */
      getImprovementCardObjectFactoryRegistry: function() {
        return improvementCardObjectFactoryRegistry;
      },

      /**
       * @returns {Promise<Object[]>} - A list of improvement cards related to
       * the current exploration.
       *
       * IMPORTANT: DO NOT DEPEND ON THE ORDER OF CARDS RETURNED!!
       * When ordering matters, then *explicitly* sort the returned list.
       * Following this contract will make it easier to optimize the service in
       * the future.
       */
      fetchCards: function() {
        return Promise.all(
          improvementCardObjectFactoryRegistry.map(function(cardFactory) {
            return cardFactory.fetchCards();
          })
        ).then(function(cardsFromFactories) {
          // Flatten the cards into a single list before returning.
          return [].concat.apply([], cardsFromFactories);
        });
      },
    };
  }
]);
