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
 * @fileoverview Unit tests for the Voiceover object factory.
 */

require('domain/exploration/VoiceoverObjectFactory.ts');

describe('Voiceover object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  var scope = null;
  var vof = null;
  var voiceover = null;

  beforeEach(angular.mock.inject(function($injector) {
    vof = $injector.get('VoiceoverObjectFactory');
    voiceover = vof.createFromBackendDict({
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false
    });
  }));

  it('should correctly mark voiceover as needing update', function() {
    voiceover.markAsNeedingUpdate();
    expect(voiceover).toEqual(vof.createFromBackendDict({
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: true
    }));
  });

  it('should toggle needs update attribute correctly', function() {
    voiceover.toggleNeedsUpdateAttribute();
    expect(voiceover).toEqual(vof.createFromBackendDict({
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: true
    }));

    voiceover.toggleNeedsUpdateAttribute();
    expect(voiceover).toEqual(vof.createFromBackendDict({
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false
    }));
  });

  it('should convert to backend dict correctly', function() {
    expect(voiceover.toBackendDict()).toEqual({
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false
    });
  });

  it('should create a new voiceover object', function() {
    expect(vof.createNew('filename.mp3', 100000)).toEqual(
      vof.createFromBackendDict({
        filename: 'filename.mp3',
        file_size_bytes: 100000,
        needs_update: false
      })
    );
  });

  it('should get the correct file size in MB', function() {
    var NUM_BYTES_IN_MB = 1 << 20;
    expect(voiceover.getFileSizeMB()).toEqual(
      200000 / NUM_BYTES_IN_MB);
  });
});
