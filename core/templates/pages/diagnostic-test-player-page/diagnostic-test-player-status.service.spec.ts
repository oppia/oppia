// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Test for the diagnostic test player status service.
 */


import { DiagnosticTestPlayerStatusService } from './diagnostic-test-player-status.service';
import { TestBed } from '@angular/core/testing';

describe('Diagnostic test player status service', () => {
  let dtpss: DiagnosticTestPlayerStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({}).compileComponents();
    dtpss = TestBed.inject(DiagnosticTestPlayerStatusService);
  });

  it('should access on test session completed', () => {
    expect(dtpss.onDiagnosticTestSessionCompleted).toBeDefined();
  });

  it('should access the test progress data', () => {
    expect(dtpss.onDiagnosticTestSessionProgressChange).toBeDefined();
  });

  it('should access on skip question event', () => {
    expect(dtpss.onDiagnosticTestSkipButtonClick).toBeDefined();
  });
});
