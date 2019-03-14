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
  'ContentIdsToAudioTranslationsObjectFactory', 'SubtitledHtmlObjectFactory',
  'COMPONENT_NAME_EXPLANATION',
  function(
      ContentIdsToAudioTranslationsObjectFactory, SubtitledHtmlObjectFactory,
      COMPONENT_NAME_EXPLANATION) {
    var ConceptCard = function(
        explanation, workedExamples, contentIdsToAudioTranslations) {
      this._explanation = explanation;
      this._workedExamples = workedExamples;
      this._contentIdsToAudioTranslations = contentIdsToAudioTranslations;
    };

    ConceptCard.prototype.toBackendDict = function() {
      return {
        explanation: this._explanation.toBackendDict(),
        worked_examples: this._workedExamples.map(function(workedExample) {
          return workedExample.toBackendDict();
        }),
        content_ids_to_audio_translations:
          this._contentIdsToAudioTranslations.toBackendDict()
      };
    };

    var _generateWorkedExamplesFromBackendDict = function(workedExampleDicts) {
      return workedExampleDicts.map(function(workedExampleDict) {
        return SubtitledHtmlObjectFactory.createFromBackendDict(
          workedExampleDict);
      });
    };

    var _getElementsInFirstSetButNotInSecond = function(setA, setB) {
      diffList = Array.from(setA).filter(function(element) {
        return !setB.has(element);
      });
      return diffList;
    };

    var _extractAvailableContentIdsFromWorkedExamples = function(
        workedExamples) {
      contentIds = new Set();
      workedExamples.forEach(function(workedExample) {
        contentIds.add(workedExample.getContentId());
      });
      return contentIds;
    };

    ConceptCard.createFromBackendDict = function(conceptCardBackendDict) {
      return new ConceptCard(
        SubtitledHtmlObjectFactory.createFromBackendDict(
          conceptCardBackendDict.explanation),
        _generateWorkedExamplesFromBackendDict(
          conceptCardBackendDict.worked_examples),
        ContentIdsToAudioTranslationsObjectFactory.createFromBackendDict(
          conceptCardBackendDict.content_ids_to_audio_translations));
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
      oldContentIds = _extractAvailableContentIdsFromWorkedExamples(
        this._workedExamples);

      this._workedExamples = workedExamples.slice();

      newContentIds = _extractAvailableContentIdsFromWorkedExamples(
        this._workedExamples);

      var contentIdsToDelete = _getElementsInFirstSetButNotInSecond(
        oldContentIds, newContentIds);
      var contentIdsToAdd = _getElementsInFirstSetButNotInSecond(
        newContentIds, oldContentIds);

      for (var i = 0; i < contentIdsToDelete.length; i++) {
        this._contentIdsToAudioTranslations.deleteContentId(
          contentIdsToDelete[i]);
      }
      for (var i = 0; i < contentIdsToAdd.length; i++) {
        this._contentIdsToAudioTranslations.addContentId(contentIdsToAdd[i]);
      }
    };

    ConceptCard.prototype.getContentIdsToAudioTranslations = function() {
      return this._contentIdsToAudioTranslations;
    };

    // Create an interstitial concept card that would be displayed in the
    // editor until the actual skill is fetched from the backend.
    ConceptCard.createInterstitialConceptCard = function() {
      contentIdsToAudioTranslationsDict = {};
      contentIdsToAudioTranslationsDict[COMPONENT_NAME_EXPLANATION] = {};
      return new ConceptCard(
        SubtitledHtmlObjectFactory.createDefault(
          'Loading review material', COMPONENT_NAME_EXPLANATION), [],
        ContentIdsToAudioTranslationsObjectFactory.createFromBackendDict(
          contentIdsToAudioTranslationsDict)
      );
    };

    return ConceptCard;
  }
]);
