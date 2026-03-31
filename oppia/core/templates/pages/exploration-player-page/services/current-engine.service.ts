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
 * @fileoverview Service to manage and provide access to the currently active
 * engine service. This includes the ExplorationEngineService,
 * QuestionPlayerEngineService, and DiagnosticTestPlayerEngineService.
 *
 * The CurrentEngineService acts as a dynamic delegate that allows other parts
 * of the application to interact with a specific engine without coupling to
 * its implementation. It provides setter methods to specify the active engine
 * and a getter method to retrieve the selected one.
 */
import {Injectable} from '@angular/core';
import {DiagnosticTestPlayerEngineService} from './diagnostic-test-player-engine.service';
import {ExplorationEngineService} from './exploration-engine.service';
import {QuestionPlayerEngineService} from './question-player-engine.service';

@Injectable({
  providedIn: 'root',
})
export class CurrentEngineService {
  currentEngineService!:
    | ExplorationEngineService
    | QuestionPlayerEngineService
    | DiagnosticTestPlayerEngineService;

  constructor(
    private explorationEngineService: ExplorationEngineService,
    private questionPlayerEngineService: QuestionPlayerEngineService,
    private diagnosticTestPlayerEngineService: DiagnosticTestPlayerEngineService
  ) {}

  getCurrentEngineService():
    | ExplorationEngineService
    | QuestionPlayerEngineService
    | DiagnosticTestPlayerEngineService {
    return this.currentEngineService;
  }

  setExplorationEngineService(): void {
    this.currentEngineService = this.explorationEngineService;
  }

  setQuestionPlayerEngineService(): void {
    this.currentEngineService = this.questionPlayerEngineService;
  }

  setDiagnosticTestPlayerEngineService(): void {
    this.currentEngineService = this.diagnosticTestPlayerEngineService;
  }
}
