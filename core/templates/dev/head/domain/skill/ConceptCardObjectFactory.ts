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

require('domain/exploration/RecordedVoiceoversObjectFactory.ts');
require('domain/exploration/SubtitledHtmlObjectFactory.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('ConceptCardObjectFactory', [
  'RecordedVoiceoversObjectFactory', 'SubtitledHtmlObjectFactory',
  'COMPONENT_NAME_EXPLANATION',
  function(
      RecordedVoiceoversObjectFactory, SubtitledHtmlObjectFactory,
      COMPONENT_NAME_EXPLANATION) {
    var ConceptCard = function(
        explanation, workedExamples, recordedVoiceovers) {
      this._explanation = explanation;
      this._workedExamples = workedExamples;
      this._recordedVoiceovers = recordedVoiceovers;
    };

    ConceptCard.prototype.toBackendDict = function() {
      return {
        explanation: this._explanation.toBackendDict(),
        worked_examples: this._workedExamples.map(function(workedExample) {
          return workedExample.toBackendDict();
        }),
        recorded_voiceovers: this._recordedVoiceovers.toBackendDict()
      };
    };

    var _generateWorkedExamplesFromBackendDict = function(workedExampleDicts) {
      return workedExampleDicts.map(function(workedExampleDict) {
        return SubtitledHtmlObjectFactory.createFromBackendDict(
          workedExampleDict);
      });
    };

    var _getElementsInFirstSetButNotInSecond = function(setA, setB) {
      var diffList = Array.from(setA).filter(function(element) {
        return !setB.has(element);
      });
      return diffList;
    };

    var _extractAvailableContentIdsFromWorkedExamples = function(
        workedExamples) {
      var contentIds = new Set();
      workedExamples.forEach(function(workedExample) {
        contentIds.add(workedExample.getContentId());
      });
      return contentIds;
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    ConceptCard['createFromBackendDict'] = function(conceptCardBackendDict) {
    /* eslint-enable dot-notation */
      return new ConceptCard(
        SubtitledHtmlObjectFactory.createFromBackendDict(
          conceptCardBackendDict.explanation),
        _generateWorkedExamplesFromBackendDict(
          conceptCardBackendDict.worked_examples),
        RecordedVoiceoversObjectFactory.createFromBackendDict(
          conceptCardBackendDict.recorded_voiceovers));
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
      var oldContentIds = _extractAvailableContentIdsFromWorkedExamples(
        this._workedExamples);

      this._workedExamples = workedExamples.slice();

      var newContentIds = _extractAvailableContentIdsFromWorkedExamples(
        this._workedExamples);

      var contentIdsToDelete = _getElementsInFirstSetButNotInSecond(
        oldContentIds, newContentIds);
      var contentIdsToAdd = _getElementsInFirstSetButNotInSecond(
        newContentIds, oldContentIds);

      for (var i = 0; i < contentIdsToDelete.length; i++) {
        this._recordedVoiceovers.deleteContentId(contentIdsToDelete[i]);
      }
      for (var i = 0; i < contentIdsToAdd.length; i++) {
        this._recordedVoiceovers.addContentId(contentIdsToAdd[i]);
      }
    };

    ConceptCard.prototype.getRecordedVoiceovers = function() {
      return this._recordedVoiceovers;
    };

    // Create an interstitial concept card that would be displayed in the
    // editor until the actual skill is fetched from the backend.
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    ConceptCard['createInterstitialConceptCard'] = function() {
    /* eslint-enable dot-notation */
      var recordedVoiceoversDict = {
        voiceovers_mapping: {
          COMPONENT_NAME_EXPLANATION: {}
        }
      };
      return new ConceptCard(
        SubtitledHtmlObjectFactory.createDefault(
          'Loading review material', COMPONENT_NAME_EXPLANATION), [],
        RecordedVoiceoversObjectFactory.createFromBackendDict(
          recordedVoiceoversDict)
      );
    };

    return ConceptCard;
  }
]);
