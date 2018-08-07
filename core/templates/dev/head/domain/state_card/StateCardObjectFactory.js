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
 * @fileoverview Factory for creating new frontend instances of State
 * card domain objects used in the exploration player.
 */

oppia.factory('StateCardObjectFactory', [function() {
    var StateCard = function(
        stateName, currentParams, contentHtml, interactionHtml,
        leadsToConceptCard, destStateName, inputResponsePairs) {
      this._stateName = stateName;
      this._currentParams = currentParams;
      this._contentHtml = contentHtml;
      this._interactionHtml = interactionHtml;
      this._leadsToConceptCard = leadsToConceptCard;
      this._destStateName = destStateName;
      this._inputResponsePairs = inputResponsePairs;
    };

    StateCard.prototype.getDestStateName = function() {
        return this._destStateName;
    };

    StateCard.prototype.getStateName = function() {
        return this._stateName;
    };

    StateCard.prototype.getCurrentParams = function() {
        return this._currentParams;
    };

    StateCard.prototype.getContentHtml = function() {
        return this._contentHtml;
    };

    StateCard.prototype.getInteractionHtml = function() {
        return this._interactionHtml;
    };

    StateCard.prototype.getLeadsToConceptCard = function() {
        return this._leadsToConceptCard;
    };

    StateCard.prototype.getInputResponsePairs = function() {
        return this._inputResponsePairs;
    };

    StateCard.prototype.addInputResponsePair = function(inputResponsePair) {
        this._inputResponsePairs.push(angular.copy(inputResponsePair));
    };

    StateCard.prototype.setDestStateName = function(destStateName) {
        this._destStateName = destStateName;
    };

    StateCard.prototype.setInteractionHtml = function(interactionHtml) {
        this._interactionHtml = interactionHtml;
    };

    StateCard.prototype.setLeadsToConceptCard = function(leadsToConceptCard) {
        this._leadsToConceptCard = leadsToConceptCard;
    };

    StateCard.createNewCard = function(
        stateName, params, contentHtml, interactionHtml, leadsToConceptCard) {
      return new StateCard(
        stateName, params, contentHtml, interactionHtml,
        leadsToConceptCard, null, []);
    };

    return StateCard;
  }
]);
