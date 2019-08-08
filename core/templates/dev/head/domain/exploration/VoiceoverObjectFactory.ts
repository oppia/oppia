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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class Voiceover {
  filename: string;
  fileSizeBytes: number;
  needsUpdate: boolean;

  constructor(filename: string, fileSizeBytes: number, needsUpdate: boolean) {
    this.filename = filename;
    this.fileSizeBytes = fileSizeBytes;
    this.needsUpdate = needsUpdate;
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

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' since 'toBackendDict' returns a dict with underscore_cased keys which
  // gives tslint errors against underscore_casing in favor of camelCasing.
  toBackendDict(): any {
    return {
      filename: this.filename,
      file_size_bytes: this.fileSizeBytes,
      needs_update: this.needsUpdate
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class VoiceoverObjectFactory {
  createNew(filename: string, fileSizeBytes: number): Voiceover {
    return new Voiceover(filename, fileSizeBytes, false);
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' since 'translationBackendDict' is a dict with underscore_cased keys
  // which gives tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(translationBackendDict: any): Voiceover {
    return new Voiceover(
      translationBackendDict.filename,
      translationBackendDict.file_size_bytes,
      translationBackendDict.needs_update);
  }
}

angular.module('oppia').factory(
  'VoiceoverObjectFactory', downgradeInjectable(VoiceoverObjectFactory));
