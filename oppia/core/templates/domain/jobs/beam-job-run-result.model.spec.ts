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
 * @fileoverview Unit tests for BeamJobRunResult.
 */

import {BeamJobRunResult} from 'domain/jobs/beam-job-run-result.model';

describe('BeamJobRunResult model', () => {
  it('should copy arguments', () => {
    const result = new BeamJobRunResult('abc', 'def');
    expect(result.stdout).toEqual('abc');
    expect(result.stderr).toEqual('def');
  });

  it('should copy values from backend dict', () => {
    const result = BeamJobRunResult.createFromBackendDict({
      stdout: 'abc',
      stderr: 'def',
    });
    expect(result.stdout).toEqual('abc');
    expect(result.stderr).toEqual('def');
  });

  it('should identify non-empty stdout', () => {
    const result = new BeamJobRunResult('abc', '');
    expect(result.isEmpty()).toBeFalse();
  });

  it('should identify non-empty stderr', () => {
    const result = new BeamJobRunResult('', 'def');
    expect(result.isEmpty()).toBeFalse();
  });

  it('should identify empty stdout and stderr', () => {
    const result = new BeamJobRunResult('', '');
    expect(result.isEmpty()).toBeTrue();
  });
});
