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
 * @fileoverview Service to retrieve read only information
 * about the concept card of a skill from the backend.
 */

require('domain/utilities/UrlInterpolationService.ts');

require('domain/skill/skill-domain.constants.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('ConceptCardBackendApiService', [
  '$http', '$q', 'UrlInterpolationService', 'CONCEPT_CARD_DATA_URL_TEMPLATE',
  function($http, $q, UrlInterpolationService, CONCEPT_CARD_DATA_URL_TEMPLATE) {
    // Maps previously loaded concept cards to their IDs.
    var _conceptCardCache = [];

    var _fetchConceptCards = function(
        skillIds, successCallback, errorCallback) {
      var conceptCardDataUrl = UrlInterpolationService.interpolateUrl(
        CONCEPT_CARD_DATA_URL_TEMPLATE, {
          comma_separated_skill_ids: skillIds.join(',')
        });

      $http.get(conceptCardDataUrl).then(function(response) {
        var conceptCards = angular.copy(response.data.concept_card_dicts);
        if (successCallback) {
          successCallback(conceptCards);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _isCached = function(skillIds) {
      for (var skillId in skillIds) {
        if (!_conceptCardCache.hasOwnProperty(skillId)) {
          return false;
        }
      }
      return true;
    };

    return {
      /**
       * Retrieves the concept cards of skills from the backend given the skill
       * IDs. This returns a promise object that allows a success and rejection
       * callbacks to be registered. If the concept cards are successfully
       * loaded and a success callback function is provided to the promise
       * object, the success callback is called with the concept card passed
       * in as a parameter. If something goes wrong while trying to fetch the
       * concept cards, the rejection callback is called instead, if present.
       * The rejection callback function is passed the error that occurred and
       * the skill IDs.
       */
      fetchConceptCards: function(skillIds) {
        return $q(function(resolve, reject) {
          _fetchConceptCards(skillIds, resolve, reject);
        });
      },

      /**
       * Behaves in the exact same way as fetchConceptCards (including callback
       * behavior and returning a promise object), except this function will
       * attempt to see whether the given concept cards have already been
       * loaded. If they have not yet been loaded, it will fetch the concept
       * cards from the backend. If it successfully retrieves the concept cards
       * from the backend, it will store them in the cache to avoid requests
       * from the backend in further function calls.
       */
      loadConceptCards: function(skillIds) {
        return $q(function(resolve, reject) {
          if (_isCached(skillIds)) {
            if (resolve) {
              var conceptCards = [];
              skillIds.forEach(function(skillId) {
                conceptCards.push(angular.copy(_conceptCardCache[skillId]))
              });
              resolve(conceptCards);
            }
          } else {
            _fetchConceptCards(skillIds, function(conceptCards) {
              // Save the fetched conceptCards to avoid future fetches.
              for (var i = 0; i < skillIds.length; i++) {
                _conceptCardCache[skillIds[i]] = angular.copy(conceptCards[i]);
              }
              if (resolve) {
                resolve(angular.copy(conceptCards));
              }
            }, reject);
          }
        });
      },

      /**
       * Returns whether the given concept cards are stored within the local
       * data cache or if they need to be retrieved from the backend upon a
       * laod.
       */
      isCached: function(skillIds) {
        return _isCached(skillIds);
      },

      /**
       * Replaces the current concept cards in the cache given by the
       * specified skill IDs with new concept card objects.
       */
      cacheConceptCards: function(skillIds, conceptCards) {
        for (var i = 0; i < skillIds.length; i++) {
          _conceptCardCache[skillIds[i]] = angular.copy(conceptCards[i]);
        }
      },

      /**
       * Clears the local concept card data cache, forcing all future loads to
       * re-request the previously loaded concept cards from the backend.
       */
      clearConceptCardCache: function() {
        _conceptCardCache = [];
      }
    };
  }
]);
