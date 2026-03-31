// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the CurrentEngineService.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed, waitForAsync} from '@angular/core/testing';
import {CurrentEngineService} from './current-engine.service';
import {ExplorationEngineService} from './exploration-engine.service';
import {QuestionPlayerEngineService} from './question-player-engine.service';
import {DiagnosticTestPlayerEngineService} from './diagnostic-test-player-engine.service';
import {TranslateModule} from '@ngx-translate/core';

describe('CurrentEngineService', () => {
  let currentEngineService: CurrentEngineService;
  let explorationEngineService: ExplorationEngineService;
  let questionPlayerEngineService: QuestionPlayerEngineService;
  let diagnosticTestPlayerEngineService: DiagnosticTestPlayerEngineService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        CurrentEngineService,
        ExplorationEngineService,
        QuestionPlayerEngineService,
        DiagnosticTestPlayerEngineService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    currentEngineService = TestBed.inject(CurrentEngineService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    diagnosticTestPlayerEngineService = TestBed.inject(
      DiagnosticTestPlayerEngineService
    );
  });

  it('should be created', () => {
    expect(currentEngineService).toBeTruthy();
  });

  it('should set currentEngineService to ExplorationEngineService', () => {
    currentEngineService.setExplorationEngineService();
    expect(currentEngineService.getCurrentEngineService()).toBe(
      explorationEngineService
    );
  });

  it('should set currentEngineService to QuestionPlayerEngineService', () => {
    currentEngineService.setQuestionPlayerEngineService();
    expect(currentEngineService.getCurrentEngineService()).toBe(
      questionPlayerEngineService
    );
  });

  it('should set currentEngineService to DiagnosticTestPlayerEngineService', () => {
    currentEngineService.setDiagnosticTestPlayerEngineService();
    expect(currentEngineService.getCurrentEngineService()).toBe(
      diagnosticTestPlayerEngineService
    );
  });
});
