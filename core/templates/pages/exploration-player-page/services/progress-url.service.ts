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
 * @fileoverview Generates and retrieves a unique progress URL ID for logged-out learners.
 */

import {Injectable} from '@angular/core';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {PageContextService} from 'services/page-context.service';
import {CheckpointProgressService} from './checkpoint-progress.service';

@Injectable({
  providedIn: 'root',
})
export class ProgressUrlService {
  uniqueProgressUrlId: string | null = null;
  constructor(
    private editableExplorationBackendApiService: EditableExplorationBackendApiService,
    private pageContextService: PageContextService,
    private checkpointProgressService: CheckpointProgressService
  ) {}

  /**
   * Asynchronously requests and sets a unique progress URL ID for a logged-out learner.
   * This ID helps persist progress and is fetched from the backend.
   *
   * @returns {Promise<void>} A promise that resolves when the unique progress URL ID is set.
   */
  async setUniqueProgressUrlId(): Promise<void> {
    let explorationId = this.pageContextService.getExplorationId();
    let lastCompletedCheckpoint =
      this.checkpointProgressService.getLastCompletedCheckpoint();
    let version = this.pageContextService.getExplorationVersion();

    if (version) {
      await this.editableExplorationBackendApiService
        .recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner(
          explorationId,
          version,
          lastCompletedCheckpoint
        )
        .then(response => {
          this.uniqueProgressUrlId = response.unique_progress_url_id;
        });
    } else {
      throw new Error(
        'Exploration version is not available. Cannot set unique progress URL ID.'
      );
    }
  }

  /**
   * Returns the unique identifier for the progress URL.
   *
   * @returns {string} The unique progress URL ID.
   */
  getUniqueProgressUrlId(): string | null {
    return this.uniqueProgressUrlId;
  }
}
