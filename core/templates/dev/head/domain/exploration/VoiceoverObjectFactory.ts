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
 * Voiceover domain objects.
 */

var oppia = require('AppInit.ts').module;

oppia.factory('VoiceoverObjectFactory', [function() {
  var Voiceover = function(filename, fileSizeBytes, needsUpdate) {
    this.filename = filename;
    this.fileSizeBytes = fileSizeBytes;
    this.needsUpdate = needsUpdate;
  };

  Voiceover.prototype.markAsNeedingUpdate = function() {
    this.needsUpdate = true;
  };

  Voiceover.prototype.toggleNeedsUpdateAttribute = function() {
    this.needsUpdate = !this.needsUpdate;
  };

  Voiceover.prototype.getFileSizeMB = function() {
    var NUM_BYTES_IN_MB = 1 << 20;
    return this.fileSizeBytes / NUM_BYTES_IN_MB;
  };

  Voiceover.prototype.toBackendDict = function() {
    return {
      filename: this.filename,
      file_size_bytes: this.fileSizeBytes,
      needs_update: this.needsUpdate
    };
  };

  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  Voiceover['createNew'] = function(filename, fileSizeBytes) {
  /* eslint-enable dot-notation */
    return new Voiceover(filename, fileSizeBytes, false);
  };

  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  Voiceover['createFromBackendDict'] = function(translationBackendDict) {
  /* eslint-enable dot-notation */
    return new Voiceover(
      translationBackendDict.filename,
      translationBackendDict.file_size_bytes,
      translationBackendDict.needs_update);
  };

  return Voiceover;
}]);
