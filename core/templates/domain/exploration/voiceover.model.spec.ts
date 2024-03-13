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
 * @fileoverview Unit tests for the voiceover-model.
 */

import {Voiceover} from 'domain/exploration/voiceover.model';

describe('Voiceover object factory', () => {
  let voiceover: Voiceover;

  beforeEach(() => {
    voiceover = Voiceover.createFromBackendDict({
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    });
  });

  it('should correctly mark voiceover as needing update', () => {
    voiceover.markAsNeedingUpdate();
    expect(voiceover).toEqual(
      Voiceover.createFromBackendDict({
        filename: 'a.mp3',
        file_size_bytes: 200000,
        needs_update: true,
        duration_secs: 10.0,
      })
    );
  });

  it('should toggle needs update attribute correctly', () => {
    voiceover.toggleNeedsUpdateAttribute();
    expect(voiceover).toEqual(
      Voiceover.createFromBackendDict({
        filename: 'a.mp3',
        file_size_bytes: 200000,
        needs_update: true,
        duration_secs: 10.0,
      })
    );

    voiceover.toggleNeedsUpdateAttribute();
    expect(voiceover).toEqual(
      Voiceover.createFromBackendDict({
        filename: 'a.mp3',
        file_size_bytes: 200000,
        needs_update: false,
        duration_secs: 10.0,
      })
    );
  });

  it('should convert to backend dict correctly', () => {
    expect(voiceover.toBackendDict()).toEqual({
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    });
  });

  it('should create a new voiceover object', () => {
    expect(Voiceover.createNew('filename.mp3', 100000, 5.0)).toEqual(
      Voiceover.createFromBackendDict({
        filename: 'filename.mp3',
        file_size_bytes: 100000,
        needs_update: false,
        duration_secs: 5.0,
      })
    );
  });

  it('should get the correct file size in MB', () => {
    var NUM_BYTES_IN_MB = 1 << 20;
    expect(voiceover.getFileSizeMB()).toEqual(200000 / NUM_BYTES_IN_MB);
  });
});
