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
 * @fileoverview Tracks the current mode of the exploration player (exploration, pretest, questions, diagnostics,
 * story chapter) and provides mode-specific checks.
 */

import {Injectable, EventEmitter} from '@angular/core';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { DiagnosticTestPlayerEngineService } from './diagnostic-test-player-engine.service';
import { ExplorationEngineService } from './exploration-engine.service';
import { QuestionPlayerEngineService } from './question-player-engine.service';


@Injectable({
  providedIn: 'root',
})
export class ProgressUrlService {


  constructor (
      explorationEngineService: ExplorationEngineService,
      questionPlayerEngineService: QuestionPlayerEngineService,
      diagnosticTestPlayerEngineService: DiagnosticTestPlayerEngineService,
      readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
      contextService: ContextService,
      urlService: UrlService
  ) { }

  async setUniqueProgressUrlId(): Promise<void> {
    await this.editableExplorationBackendApiService
      .recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner(
        this.explorationId,
        this.version,
        this.lastCompletedCheckpoint
      )
      .then(response => {
        this.uniqueProgressUrlId = response.unique_progress_url_id;
        this.trackLoggedOutLearnerProgress();
      });
  }

  getUniqueProgressUrlId(): string {
    return this.uniqueProgressUrlId;
  }

  private trackLoggedOutLearnerProgress(): void {
    this.isLoggedOutProgressTracked = true;
  }

}
