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
 * @fileoverview Object factory for creating a front-end instance of a
 * concept card. In the backend, this is referred to as SkillContents.
 */

oppia.factory('ConceptCardObjectFactory', [
  function() {
    var ConceptCard = function(explanation, workedExamples) {
      this._explanation = explanation;
      this._workedExamples = workedExamples;
    };

    ConceptCard.prototype.toBackendDict = function() {
      return {
        explanation: this._explanation,
        worked_examples: this._workedExamples
      };
    };

    ConceptCard.createFromBackendDict = function(conceptCardBackendDict) {
      return new ConceptCard(
        conceptCardBackendDict.explanation,
        conceptCardBackendDict.worked_examples);
    };

    ConceptCard.prototype.getExplanation = function() {
      return this._explanation;
    };

    ConceptCard.prototype.setExplanation = function(explanation) {
      this._explanation = explanation;
    };

    ConceptCard.prototype.getWorkedExamples = function() {
      return this._workedExamples.slice();
    };

    ConceptCard.prototype.setWorkedExamples = function(workedExamples) {
      this._workedExamples = [];
      for (idx in workedExamples) {
        this._workedExamples.push(workedExamples[idx]);
      }
    };

    // Create an interstitial concept card that would be displayed in the
    // editor until the actual skill is fetched from the backend.
    ConceptCard.createInterstitialConceptCard = function() {
      return new ConceptCard('Concept card review material loading', []);
    };

    return ConceptCard;
  }
]);
