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
 * @fileoverview Unit tests for the AudioTranslation object factory.
 */

describe('AudioTranslation object factory', function() {
  beforeEach(module('oppia'));

  describe('AudioTranslationObjectFactory', function() {
    var scope, atof, audioTranslation;

    beforeEach(inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      atof = $injector.get('AudioTranslationObjectFactory');
      audioTranslation = atof.createFromBackendDict({
        filename: 'a.mp3',
        file_size_bytes: 200000,
        needs_update: false
      });
    }));

    it('should correctly mark audio as needing update', inject(function() {
      audioTranslation.markAsNeedingUpdate();
      expect(audioTranslation).toEqual(atof.createFromBackendDict({
        filename: 'a.mp3',
        file_size_bytes: 200000,
        needs_update: true
      }));
    }));

    it('should toggle needs update attribute correctly', inject(function() {
      audioTranslation.toggleNeedsUpdateAttribute();
      expect(audioTranslation).toEqual(atof.createFromBackendDict({
        filename: 'a.mp3',
        file_size_bytes: 200000,
        needs_update: true
      }));

      audioTranslation.toggleNeedsUpdateAttribute();
      expect(audioTranslation).toEqual(atof.createFromBackendDict({
        filename: 'a.mp3',
        file_size_bytes: 200000,
        needs_update: false
      }));
    }));

    it('should convert to backend dict correctly', inject(function() {
      expect(audioTranslation.toBackendDict()).toEqual({
        filename: 'a.mp3',
        file_size_bytes: 200000,
        needs_update: false
      });
    }));

    it('should create a new audio translation', inject(function() {
      expect(atof.createNew('filename.mp3', 100000)).toEqual(
        atof.createFromBackendDict({
          filename: 'filename.mp3',
          file_size_bytes: 100000,
          needs_update: false
        })
      );
    }));

    it('should get the correct file size in MB', inject(function() {
      var NUM_BYTES_IN_MB = 1 << 20;
      expect(audioTranslation.getFileSizeMB()).toEqual(
        200000 / NUM_BYTES_IN_MB);
    }));
  });
});
