// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * AudioTranslation domain objects.
 */

oppia.factory('AudioTranslationObjectFactory', [function() {
  var AudioTranslation = function(
      languageCode, filename, fileSizeBytes, needsUpdate) {
    this.languageCode = languageCode;
    this.filename = filename;
    this.fileSizeBytes = fileSizeBytes;
    this.needsUpdate = needsUpdate;
  };

  AudioTranslation.prototype.markAsNeedingUpdate = function() {
    this.needsUpdate = true;
  };

  AudioTranslation.prototype.toBackendDict = function() {
    return {
      language_code: this.languageCode,
      filename: this.filename,
      file_size_bytes: this.fileSizeBytes,
      needs_update: this.needsUpdate
    };
  };

  AudioTranslation.createFromBackendDict = function(translationBackendDict) {
    return new AudioTranslation(
      translationBackendDict.language_code,
      translationBackendDict.filename,
      translationBackendDict.file_size_bytes,
      translationBackendDict.needs_update);
  };

  return AudioTranslation;
}]);
