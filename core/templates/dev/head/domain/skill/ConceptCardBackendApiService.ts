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

require('domain/skill/skill-domain.constants.ajs.ts');

angular.module('oppia').factory('ConceptCardBackendApiService', [
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

    var _isCached = function(skillId) {
      return _conceptCardCache.hasOwnProperty(skillId);
    };

    var _getUncachedSkillIds = function(skillIds) {
      var uncachedSkillIds = [];
      skillIds.forEach(function(skillId) {
        if (!_isCached(skillId)) {
          uncachedSkillIds.push(skillId);
        }
      });
      return uncachedSkillIds;
    };

    return {
      /**
       * This function will fetch concept cards from the backend, as well as
       * attempt to see whether the given concept cards have already been
       * loaded. If they have not yet been loaded, it will fetch the concept
       * cards from the backend. If it successfully retrieves the concept cards
       * from the backend, it will store them in the cache to avoid requests
       * from the backend in further function calls.
       */
      loadConceptCards: function(skillIds) {
        return $q(function(resolve, reject) {
          var uncachedSkillIds = _getUncachedSkillIds(skillIds);
          var conceptCards = [];
          if (uncachedSkillIds.length !== 0) {
            // Case where only part (or none) of the concept cards are cached
            // locally.
            _fetchConceptCards(
              uncachedSkillIds, function(uncachedConceptCards) {
                skillIds.forEach(function(skillId) {
                  if (uncachedSkillIds.includes(skillId)) {
                    conceptCards.push(
                      uncachedConceptCards[uncachedSkillIds.indexOf(skillId)]);
                    // Save the fetched conceptCards to avoid future fetches.
                    _conceptCardCache[skillId] = angular.copy(
                      uncachedConceptCards[uncachedSkillIds.indexOf(skillId)]);
                  } else {
                    conceptCards.push(angular.copy(_conceptCardCache[skillId]));
                  }
                });
                if (resolve) {
                  resolve(angular.copy(conceptCards));
                }
              }, reject);
          } else {
            // Case where all of the concept cards are cached locally.
            skillIds.forEach(function(skillId) {
              conceptCards.push(angular.copy(_conceptCardCache[skillId]));
            });
            if (resolve) {
              resolve(conceptCards);
            }
          }
        });
      }
    };
  }
]);
