// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Domain object for the result of an Apache Beam job instance.
 */

export interface BeamJobRunResultBackendDict {
  stdout: string;
  stderr: string;
}

export class BeamJobRunResult {
  constructor(
    public readonly stdout: string,
    public readonly stderr: string
  ) {}

  isEmpty(): boolean {
    return !this.stdout && !this.stderr;
  }

  static createFromBackendDict(
    backendDict: BeamJobRunResultBackendDict
  ): BeamJobRunResult {
    return new BeamJobRunResult(backendDict.stdout, backendDict.stderr);
  }
}
