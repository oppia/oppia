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
 * @fileoverview Model for creating new frontend instances of
 * Voiceover domain objects.
 */
export interface VoiceoverBackendDict {
  'duration_secs': number;
  'filename': string;
  'file_size_bytes': number;
  'needs_update': boolean;
}

export class Voiceover {
  filename: string;
  fileSizeBytes: number;
  needsUpdate: boolean;
  durationSecs: number;

  constructor(
      filename: string, fileSizeBytes: number, needsUpdate: boolean,
      durationSecs: number) {
    this.filename = filename;
    this.fileSizeBytes = fileSizeBytes;
    this.needsUpdate = needsUpdate;
    this.durationSecs = durationSecs;
  }

  markAsNeedingUpdate(): void {
    this.needsUpdate = true;
  }

  toggleNeedsUpdateAttribute(): void {
    this.needsUpdate = !this.needsUpdate;
  }

  getFileSizeMB(): number {
    var NUM_BYTES_IN_MB = 1 << 20;
    return this.fileSizeBytes / NUM_BYTES_IN_MB;
  }

  toBackendDict(): VoiceoverBackendDict {
    return {
      filename: this.filename,
      file_size_bytes: this.fileSizeBytes,
      needs_update: this.needsUpdate,
      duration_secs: this.durationSecs
    };
  }

  static createNew(
      filename: string, fileSizeBytes: number,
      durationSecs: number): Voiceover {
    return new Voiceover(filename, fileSizeBytes, false, durationSecs);
  }

  static createFromBackendDict(
      translationBackendDict: VoiceoverBackendDict): Voiceover {
    return new Voiceover(
      translationBackendDict.filename,
      translationBackendDict.file_size_bytes,
      translationBackendDict.needs_update,
      translationBackendDict.duration_secs);
  }
}
