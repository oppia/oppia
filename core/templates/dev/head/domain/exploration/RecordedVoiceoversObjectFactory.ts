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
 * @fileoverview Factory for creating new frontend instances of
 * RecordedVoiceovers domain objects.
 */

require('domain/exploration/VoiceoverObjectFactory.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('RecordedVoiceoversObjectFactory', [
  'VoiceoverObjectFactory', 'COMPONENT_NAME_FEEDBACK',
  function(
      VoiceoverObjectFactory, COMPONENT_NAME_FEEDBACK) {
    var RecordedVoiceovers = function(voiceoversMapping) {
      this.voiceoversMapping = voiceoversMapping;
    };

    RecordedVoiceovers.prototype.getAllContentId = function() {
      return Object.keys(this.voiceoversMapping);
    };

    RecordedVoiceovers.prototype.getBindableVoiceovers = function(
        contentId) {
      return this.voiceoversMapping[contentId];
    };

    RecordedVoiceovers.prototype.getVoiceover = function(
        contentId, langCode) {
      return this.voiceoversMapping[contentId][langCode];
    };

    RecordedVoiceovers.prototype.markAllVoiceoversAsNeedingUpdate = function(
        contentId) {
      var languageCodeToVoiceover = this.voiceoversMapping[contentId];
      for (var languageCode in languageCodeToVoiceover) {
        languageCodeToVoiceover[languageCode].markAsNeedingUpdate();
      }
    };

    RecordedVoiceovers.prototype.getVoiceoverLanguageCodes = function(
        contentId) {
      return Object.keys(this.voiceoversMapping[contentId]);
    };

    RecordedVoiceovers.prototype.hasVoiceovers = function(contentId) {
      return this.getVoiceoverLanguageCodes(contentId).length > 0;
    };

    RecordedVoiceovers.prototype.hasUnflaggedVoiceovers = function(contentId) {
      var languageCodeToVoiceover = this.voiceoversMapping[contentId];
      for (var languageCode in languageCodeToVoiceover) {
        if (!languageCodeToVoiceover[languageCode].needsUpdate) {
          return true;
        }
      }
      return false;
    };

    RecordedVoiceovers.prototype.addContentId = function(contentId) {
      if (this.voiceoversMapping.hasOwnProperty(contentId)) {
        throw Error('Trying to add duplicate content id.');
      }
      this.voiceoversMapping[contentId] = {};
    };

    RecordedVoiceovers.prototype.deleteContentId = function(
        contentId) {
      if (!this.voiceoversMapping.hasOwnProperty(contentId)) {
        throw Error('Unable to find the given content id.');
      }
      delete this.voiceoversMapping[contentId];
    };

    RecordedVoiceovers.prototype.addVoiceover = function(
        contentId, languageCode, filename, fileSizeBytes) {
      var languageCodeToVoiceover = this.voiceoversMapping[contentId];
      if (languageCodeToVoiceover.hasOwnProperty(languageCode)) {
        throw Error('Trying to add duplicate language code.');
      }
      languageCodeToVoiceover[languageCode] = VoiceoverObjectFactory.createNew(
        filename, fileSizeBytes);
    };

    RecordedVoiceovers.prototype.deleteVoiceover = function(
        contentId, languageCode) {
      var languageCodeToVoiceover = this.voiceoversMapping[contentId];
      if (!languageCodeToVoiceover.hasOwnProperty(languageCode)) {
        throw Error(
          'Trying to remove non-existing translation for language code ' +
          languageCode);
      }
      delete languageCodeToVoiceover[languageCode];
    };

    RecordedVoiceovers.prototype.toggleNeedsUpdateAttribute = function(
        contentId, languageCode) {
      var languageCodeToVoiceover = this.voiceoversMapping[contentId];
      languageCodeToVoiceover[languageCode].toggleNeedsUpdateAttribute();
    };

    RecordedVoiceovers.prototype.toBackendDict = function() {
      var voiceoversMappingDict = {};
      for (var contentId in this.voiceoversMapping) {
        var languageCodeToVoiceover = this.voiceoversMapping[contentId];
        var languageCodeToVoiceoverDict = {};
        Object.keys(languageCodeToVoiceover).forEach(function(lang) {
          languageCodeToVoiceoverDict[lang] = (
            languageCodeToVoiceover[lang].toBackendDict());
        });
        voiceoversMappingDict[contentId] = languageCodeToVoiceoverDict;
      }
      return {
        voiceovers_mapping: voiceoversMappingDict
      };
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    RecordedVoiceovers['createFromBackendDict'] = function(
    /* eslint-enable dot-notation */
        recordedVoiceoversDict) {
      var voiceoversMapping = {};
      var voiceoversMappingDict = recordedVoiceoversDict.voiceovers_mapping;
      Object.keys(voiceoversMappingDict).forEach(function(contentId) {
        var languageCodeToVoiceoverDict = voiceoversMappingDict[contentId];
        var languageCodeToVoiceover = {};
        Object.keys(languageCodeToVoiceoverDict).forEach(function(langCode) {
          languageCodeToVoiceover[langCode] = (
            VoiceoverObjectFactory.createFromBackendDict(
              languageCodeToVoiceoverDict[langCode]));
        });
        voiceoversMapping[contentId] = languageCodeToVoiceover;
      });

      return new RecordedVoiceovers(voiceoversMapping);
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    RecordedVoiceovers['createEmpty'] = function() {
    /* eslint-enable dot-notation */
      return new RecordedVoiceovers({});
    };

    return RecordedVoiceovers;
  }
]);
