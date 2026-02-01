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
 * @fileoverview Service for tracking checkpoint progress in community lessons
 * (explorations from the Community Library, not part of classroom topics).
 *
 * This service maintains progress state for community lessons and notifies
 * subscribers when checkpoints are reached, enabling the learner dashboard
 * to display accurate progress for non-classroom explorations.
 */

import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

/**
 * Represents progress data for a specific exploration.
 */
interface ExplorationProgress {
  explorationId: string;
  visitedCheckpointStateNames: Set<string>;
  mostRecentlyReachedCheckpointStateName: string | null;
  lastUpdated: number;
}

@Injectable({providedIn: 'root'})
export class CommunityLessonProgressService {
  private explorationProgressMap = new Map<string, ExplorationProgress>();

  private progressUpdateSubject = new BehaviorSubject<string | null>(null);
  public progressUpdate$: Observable<string | null> =
    this.progressUpdateSubject.asObservable();

  /**
   * Records that a checkpoint has been reached in a community lesson.
   * @param explorationId - The ID of the exploration
   * @param checkpointStateName - The name of the checkpoint state that was reached
   */
  markCheckpointReached(
    explorationId: string,
    checkpointStateName: string
  ): void {
    let progress = this.explorationProgressMap.get(explorationId);

    if (!progress) {
      // Initialize progress for this exploration.
      progress = {
        explorationId: explorationId,
        visitedCheckpointStateNames: new Set<string>(),
        mostRecentlyReachedCheckpointStateName: null,
        lastUpdated: Date.now(),
      };
      this.explorationProgressMap.set(explorationId, progress);
    }

    // Update progress.
    progress.visitedCheckpointStateNames.add(checkpointStateName);
    progress.mostRecentlyReachedCheckpointStateName = checkpointStateName;
    progress.lastUpdated = Date.now();

    // Notify subscribers.
    this.progressUpdateSubject.next(explorationId);
  }

  /**
   * Gets the progress data for a specific exploration.
   * @param explorationId - The ID of the exploration
   * @returns The progress data, or null if no progress exists
   */
  getExplorationProgress(explorationId: string): ExplorationProgress | null {
    const progress = this.explorationProgressMap.get(explorationId);
    return progress || null;
  }

  /**
   * Gets the number of checkpoints visited in an exploration.
   * @param explorationId - The ID of the exploration
   * @returns The count of visited checkpoints
   */
  getVisitedCheckpointsCount(explorationId: string): number {
    const progress = this.explorationProgressMap.get(explorationId);
    return progress ? progress.visitedCheckpointStateNames.size : 0;
  }

  /**
   * Gets the most recently reached checkpoint for an exploration.
   * @param explorationId - The ID of the exploration
   * @returns The checkpoint state name, or null if none exists
   */
  getMostRecentlyReachedCheckpoint(explorationId: string): string | null {
    const progress = this.explorationProgressMap.get(explorationId);
    return progress ? progress.mostRecentlyReachedCheckpointStateName : null;
  }

  /**
   * Checks if a specific checkpoint has been visited in an exploration.
   * @param explorationId - The ID of the exploration
   * @param checkpointStateName - The checkpoint state name to check
   * @returns true if the checkpoint has been visited, false otherwise
   */
  isCheckpointVisited(
    explorationId: string,
    checkpointStateName: string
  ): boolean {
    const progress = this.explorationProgressMap.get(explorationId);
    return progress
      ? progress.visitedCheckpointStateNames.has(checkpointStateName)
      : false;
  }

  /**
   * Resets progress for a specific exploration.
   * @param explorationId - The ID of the exploration
   */
  resetExplorationProgress(explorationId: string): void {
    this.explorationProgressMap.delete(explorationId);
    this.progressUpdateSubject.next(explorationId);
  }

  /**
   * Clears all progress data.
   */
  resetAllProgress(): void {
    this.explorationProgressMap.clear();
    this.progressUpdateSubject.next(null);
  }

  /**
   * Gets all explorations with recorded progress.
   * @returns Array of exploration IDs
   */
  getAllExplorationsWithProgress(): string[] {
    return Array.from(this.explorationProgressMap.keys());
  }
}
