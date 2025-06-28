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
 * @fileoverview Service to manage learner checkpoints in an exploration.
 *
 * This service handles the logic for tracking and recording learner progress through checkpoints. It provides methods to:
 * - Get the total and completed checkpoint counts.
 * - Mark checkpoints as reached.
 * - Track and update the last completed checkpoint.
 */

import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CheckpointProgressService {
  mostRecentlyReachedCheckpoint!: string;
  visitedCheckpointStateNames: string[] = [];

  constructor() {}

  setMostRecentlyReachedCheckpoint(checkpointStateName: string): void {
    this.mostRecentlyReachedCheckpoint = checkpointStateName;
  }

  getMostRecentlyReachedCheckpoint(): string {
    if (!this.mostRecentlyReachedCheckpoint) {
      throw new Error('Last completed checkpoint is not set.');
    }
    return this.mostRecentlyReachedCheckpoint;
  }

  getVisitedCheckpointStateNames(): string[] {
    if (this.visitedCheckpointStateNames.length === 0) {
      throw new Error('No checkpoints have been visited yet.');
    }
    return this.visitedCheckpointStateNames;
  }
  setVisitedCheckpointStateNames(checkpointStateName: string): void {
    if (!this.visitedCheckpointStateNames.includes(checkpointStateName)) {
      this.visitedCheckpointStateNames.push(checkpointStateName);
    }
  }

  resetVisitedCheckpointStateNames(): void {
    this.visitedCheckpointStateNames = [];
  }

  checkIfCheckpointIsVisited(checkpointStateName: string): boolean {
    return this.visitedCheckpointStateNames.includes(checkpointStateName);
  }
}
