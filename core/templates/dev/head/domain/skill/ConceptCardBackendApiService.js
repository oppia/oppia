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
oppia.constant(
  'CONCEPT_CARD_DATA_URL_TEMPLATE', '/concept_card_data_handler/<skill_id>');

oppia.factory('ConceptCardBackendApiService', [
  '$http', '$q', 'CONCEPT_CARD_DATA_URL_TEMPLATE', 'UrlInterpolationService',
  function($http, $q, CONCEPT_CARD_DATA_URL_TEMPLATE, UrlInterpolationService) {
    // Maps previously loaded concept cards to their IDs.
    var _conceptCardCache = [];

    var _fetchConceptCard = function(
        skillId, successCallback, errorCallback) {
      var conceptCardDataUrl = UrlInterpolationService.interpolateUrl(
        CONCEPT_CARD_DATA_URL_TEMPLATE, {
          skill_id: skillId
        });

      $http.get(conceptCardDataUrl).then(function(response) {
        var conceptCard = angular.copy(response.data.concept_card);
        if (successCallback) {
          successCallback(conceptCard);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _isCached = function(conceptCardId) {
      return _conceptCardCache.hasOwnProperty(skillId);
    };

    return {
      /**
       * Retrieves the concept card of a skill from the backend given a skill
       * ID. This returns a promise object that allows a success and rejection
       * callbacks to be registered. If the concept card is successfully loaded
       * and a success callback function is provided to the promise object, the
       * success callback is called with the concept card passed in as a
       * parameter. If something goes wrong while trying to fetch the
       * concept card, the rejection callback is called instead, if present. The
       * rejection callback function is passed the error that occurred and the
       * skill ID.
       */
      fetchConceptCard: function(skillId) {
        return $q(function(resolve, reject) {
          _fetchConceptCard(skillId, resolve, reject);
        });
      },

      /**
       * Behaves in the exact same way as fetchConceptCard (including callback
       * behavior and returning a promise object), except this function will
       * attempt to see whether the given concept card has already been loaded.
       * If it has not yet been loaded, it will fetch the concept card from the
       * backend. If it successfully retrieves the concept card from the
       * backend, it will store it in the cache to avoid requests from the
       * backend in further function calls.
       */
      loadConceptCard: function(skillId) {
        return $q(function(resolve, reject) {
          if (_isCached(skillId)) {
            if (resolve) {
              resolve(angular.copy(_conceptCardCache[skillId]));
            }
          } else {
            _fetchConceptCard(skillId, function(conceptCard) {
              // Save the fetched conceptCard to avoid future fetches.
              _conceptCardCache[skillId] = conceptCard;
              if (resolve) {
                resolve(angular.copy(conceptCard));
              }
            }, reject);
          }
        });
      },

      /**
       * Returns whether the given concept card is stored within the local data
       * cache or if it needs to be retrieved from the backend upon a laod.
       */
      isCached: function(skillId) {
        return _isCached(skillId);
      },

      /**
       * Replaces the current concept card in the cache given by the specified
       * skill ID with a new concept card object.
       */
      cacheConceptCard: function(skillId, conceptCard) {
        _conceptCardCache[skillId] = angular.copy(conceptCard);
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
