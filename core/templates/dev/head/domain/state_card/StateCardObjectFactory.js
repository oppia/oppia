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
      stateName, currentParams, contentHtml, interactionHtml, interaction,
      leadsToConceptCard, destStateName, inputResponsePairs) {
    this._stateName = stateName;
    this._currentParams = currentParams;
    this._contentHtml = contentHtml;
    this._interactionHtml = interactionHtml;
    this._leadsToConceptCard = leadsToConceptCard;
    this._destStateName = destStateName;
    this._inputResponsePairs = inputResponsePairs;
    this._interaction = interaction;
  };

  StateCard.prototype.getDestStateName = function() {
    return this._destStateName;
  };

  StateCard.prototype.getStateName = function() {
    return this._stateName;
  };

  StateCard.prototype.getInteraction = function() {
    return this._interaction;
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

  StateCard.prototype.getOppiaResponse = function(index) {
    return this._inputResponsePairs[index].oppiaResponse;
  };

  StateCard.prototype.getLeadsToConceptCard = function() {
    return this._leadsToConceptCard;
  };

  StateCard.prototype.getInputResponsePairs = function() {
    return this._inputResponsePairs;
  };

  StateCard.prototype.getLastInputResponsePair = function() {
    if (this._inputResponsePairs.length === 0) {
      return null;
    }
    return this._inputResponsePairs[this._inputResponsePairs.length - 1];
  };

  StateCard.prototype.getLastOppiaResponse = function() {
    if (this.getLastInputResponsePair() === null) {
      return null;
    }
    return this.getLastInputResponsePair().oppiaResponse;
  };

  StateCard.prototype.addInputResponsePair = function(inputResponsePair) {
    this._inputResponsePairs.push(angular.copy(inputResponsePair));
  };

  StateCard.prototype.setDestStateName = function(destStateName) {
    this._destStateName = destStateName;
  };

  StateCard.prototype.setOppiaResponse = function(index, response) {
    this._inputResponsePairs[index].oppiaResponse = response;
  };

  StateCard.prototype.setLastOppiaResponse = function(response) {
    this.setOppiaResponse(this._inputResponsePairs.length - 1, response);
  };

  StateCard.prototype.setInteractionHtml = function(interactionHtml) {
    this._interactionHtml = interactionHtml;
  };

  StateCard.prototype.setLeadsToConceptCard = function(leadsToConceptCard) {
    this._leadsToConceptCard = leadsToConceptCard;
  };

  /**
   * @param {string} stateName - The state name for the current card.
   * @param {object} params - The set of parameters for the learner associated
   *        with a card.
   * @param {string} contentHtml - The HTML string for the content displayed on
   *        the content card.
   * @param {string} interactionHtml - The HTML that calls the interaction
   *        directive for the current card.
   * @param {Interaction} interaction - An interaction object that stores all
   *        the properties of the card's interaction.
   * @param {bool} leadsToConceptCard - Whether the current card leads to a
   *        concept card in the exploration.
   */
  StateCard.createNewCard = function(
      stateName, params, contentHtml, interactionHtml, interaction,
      leadsToConceptCard) {
    return new StateCard(
      stateName, params, contentHtml, interactionHtml, interaction,
      leadsToConceptCard, null, []);
  };

  return StateCard;
}]);
