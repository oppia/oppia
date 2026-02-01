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
 * @fileoverview Unit tests for the CommunityLessonProgressService.
 */

import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {CommunityLessonProgressService} from './community-lesson-progress.service';

describe('CommunityLessonProgressService', () => {
  let service: CommunityLessonProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommunityLessonProgressService],
    });

    service = TestBed.inject(CommunityLessonProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('markCheckpointReached', () => {
    it('should mark a checkpoint as reached for an exploration', () => {
      const explorationId = 'exp123';
      const checkpointStateName = 'Checkpoint1';

      service.markCheckpointReached(explorationId, checkpointStateName);

      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(1);
      expect(
        service.isCheckpointVisited(explorationId, checkpointStateName)
      ).toBe(true);
    });

    it('should track multiple checkpoints for the same exploration', () => {
      const explorationId = 'exp123';

      service.markCheckpointReached(explorationId, 'Checkpoint1');
      service.markCheckpointReached(explorationId, 'Checkpoint2');
      service.markCheckpointReached(explorationId, 'Checkpoint3');

      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(3);
    });

    it('should not add duplicate checkpoints', () => {
      const explorationId = 'exp123';
      const checkpointStateName = 'Checkpoint1';

      service.markCheckpointReached(explorationId, checkpointStateName);
      service.markCheckpointReached(explorationId, checkpointStateName);

      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(1);
    });

    it('should update the most recently reached checkpoint', () => {
      const explorationId = 'exp123';

      service.markCheckpointReached(explorationId, 'Checkpoint1');
      expect(service.getMostRecentlyReachedCheckpoint(explorationId)).toEqual(
        'Checkpoint1'
      );

      service.markCheckpointReached(explorationId, 'Checkpoint2');
      expect(service.getMostRecentlyReachedCheckpoint(explorationId)).toEqual(
        'Checkpoint2'
      );
    });

    it('should emit progress update when checkpoint is reached', fakeAsync(() => {
      const explorationId = 'exp123';
      let emittedExpId: string | null = null;

      service.progressUpdate$.subscribe(updatedExpId => {
        emittedExpId = updatedExpId;
      });

      service.markCheckpointReached(explorationId, 'Checkpoint1');
      tick();

      expect(emittedExpId).toBe(explorationId);
    }));

    it('should track separate progress for different explorations', () => {
      const exp1 = 'exp123';
      const exp2 = 'exp456';

      service.markCheckpointReached(exp1, 'CP1');
      service.markCheckpointReached(exp1, 'CP2');
      service.markCheckpointReached(exp2, 'CP1');

      expect(service.getVisitedCheckpointsCount(exp1)).toBe(2);
      expect(service.getVisitedCheckpointsCount(exp2)).toBe(1);
      expect(service.getMostRecentlyReachedCheckpoint(exp1)).toEqual('CP2');
      expect(service.getMostRecentlyReachedCheckpoint(exp2)).toEqual('CP1');
    });
  });

  describe('getExplorationProgress', () => {
    it('should return null for unexplored explorations', () => {
      const result = service.getExplorationProgress('nonexistent');
      expect(result).toBeNull();
    });

    it('should return progress data for an exploration with recorded checkpoints', () => {
      const explorationId = 'exp123';

      service.markCheckpointReached(explorationId, 'Checkpoint1');

      const progress = service.getExplorationProgress(explorationId);

      expect(progress).not.toBeNull();
      expect(progress?.explorationId).toBe(explorationId);
      expect(progress?.mostRecentlyReachedCheckpointStateName).toBe(
        'Checkpoint1'
      );
    });

    it('should include all visited checkpoints in progress data', () => {
      const explorationId = 'exp123';

      service.markCheckpointReached(explorationId, 'CP1');
      service.markCheckpointReached(explorationId, 'CP2');
      service.markCheckpointReached(explorationId, 'CP3');

      const progress = service.getExplorationProgress(explorationId);

      expect(progress?.visitedCheckpointStateNames.size).toBe(3);
      expect(progress?.visitedCheckpointStateNames.has('CP1')).toBe(true);
      expect(progress?.visitedCheckpointStateNames.has('CP2')).toBe(true);
      expect(progress?.visitedCheckpointStateNames.has('CP3')).toBe(true);
    });

    it('should include lastUpdated timestamp', () => {
      const explorationId = 'exp123';
      const beforeTimestamp = Date.now();

      service.markCheckpointReached(explorationId, 'CP1');

      const afterTimestamp = Date.now();
      const progress = service.getExplorationProgress(explorationId);

      expect(progress?.lastUpdated).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(progress?.lastUpdated).toBeLessThanOrEqual(afterTimestamp + 1);
    });
  });

  describe('getVisitedCheckpointsCount', () => {
    it('should return 0 for unexplored explorations', () => {
      expect(service.getVisitedCheckpointsCount('nonexistent')).toBe(0);
    });

    it('should return correct count of visited checkpoints', () => {
      const explorationId = 'exp123';

      service.markCheckpointReached(explorationId, 'CP1');
      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(1);

      service.markCheckpointReached(explorationId, 'CP2');
      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(2);

      service.markCheckpointReached(explorationId, 'CP3');
      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(3);
    });

    it('should not count duplicate checkpoints multiple times', () => {
      const explorationId = 'exp123';

      service.markCheckpointReached(explorationId, 'CP1');
      service.markCheckpointReached(explorationId, 'CP1');
      service.markCheckpointReached(explorationId, 'CP1');

      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(1);
    });
  });

  describe('getMostRecentlyReachedCheckpoint', () => {
    it('should return null for unexplored explorations', () => {
      expect(
        service.getMostRecentlyReachedCheckpoint('nonexistent')
      ).toBeNull();
    });

    it('should return the most recently reached checkpoint', () => {
      const explorationId = 'exp123';

      service.markCheckpointReached(explorationId, 'CP1');
      expect(service.getMostRecentlyReachedCheckpoint(explorationId)).toEqual(
        'CP1'
      );

      service.markCheckpointReached(explorationId, 'CP2');
      expect(service.getMostRecentlyReachedCheckpoint(explorationId)).toEqual(
        'CP2'
      );

      service.markCheckpointReached(explorationId, 'CP3');
      expect(service.getMostRecentlyReachedCheckpoint(explorationId)).toEqual(
        'CP3'
      );
    });

    it('should update when a new checkpoint is reached', () => {
      const explorationId = 'exp123';

      service.markCheckpointReached(explorationId, 'FirstCheckpoint');
      const firstCheckpoint =
        service.getMostRecentlyReachedCheckpoint(explorationId);

      service.markCheckpointReached(explorationId, 'SecondCheckpoint');
      const secondCheckpoint =
        service.getMostRecentlyReachedCheckpoint(explorationId);

      expect(firstCheckpoint).not.toEqual(secondCheckpoint);
      expect(secondCheckpoint).toEqual('SecondCheckpoint');
    });
  });

  describe('isCheckpointVisited', () => {
    it('should return false for unvisited checkpoints', () => {
      const explorationId = 'exp123';

      expect(service.isCheckpointVisited(explorationId, 'UnvisitedCP')).toBe(
        false
      );
    });

    it('should return true for visited checkpoints', () => {
      const explorationId = 'exp123';
      const checkpointName = 'VisitedCP';

      service.markCheckpointReached(explorationId, checkpointName);

      expect(service.isCheckpointVisited(explorationId, checkpointName)).toBe(
        true
      );
    });

    it('should return false for checkpoints in different explorations', () => {
      const exp1 = 'exp123';
      const exp2 = 'exp456';

      service.markCheckpointReached(exp1, 'CP1');

      expect(service.isCheckpointVisited(exp1, 'CP1')).toBe(true);
      expect(service.isCheckpointVisited(exp2, 'CP1')).toBe(false);
    });

    it('should return false for explorations without any visited checkpoints', () => {
      const explorationId = 'exp123';

      expect(service.isCheckpointVisited(explorationId, 'AnyCheckpoint')).toBe(
        false
      );
    });
  });

  describe('resetExplorationProgress', () => {
    it('should clear progress for a specific exploration', () => {
      const explorationId = 'exp123';

      service.markCheckpointReached(explorationId, 'CP1');
      service.markCheckpointReached(explorationId, 'CP2');

      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(2);

      service.resetExplorationProgress(explorationId);

      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(0);
      expect(service.getExplorationProgress(explorationId)).toBeNull();
    });

    it('should not affect progress in other explorations', () => {
      const exp1 = 'exp123';
      const exp2 = 'exp456';

      service.markCheckpointReached(exp1, 'CP1');
      service.markCheckpointReached(exp2, 'CP1');

      service.resetExplorationProgress(exp1);

      expect(service.getVisitedCheckpointsCount(exp1)).toBe(0);
      expect(service.getVisitedCheckpointsCount(exp2)).toBe(1);
    });

    it('should emit progress update when exploration is reset', fakeAsync(() => {
      const explorationId = 'exp123';
      let emittedExpId: string | null = null;

      service.markCheckpointReached(explorationId, 'CP1');

      service.progressUpdate$.subscribe(updatedExpId => {
        emittedExpId = updatedExpId;
      });

      service.resetExplorationProgress(explorationId);
      tick();

      expect(emittedExpId).toBe(explorationId);
      expect(service.getExplorationProgress(explorationId)).toBeNull();
    }));
  });

  describe('resetAllProgress', () => {
    it('should clear all progress data', () => {
      service.markCheckpointReached('exp1', 'CP1');
      service.markCheckpointReached('exp2', 'CP1');
      service.markCheckpointReached('exp3', 'CP1');

      expect(service.getAllExplorationsWithProgress().length).toBe(3);

      service.resetAllProgress();

      expect(service.getAllExplorationsWithProgress().length).toBe(0);
      expect(service.getExplorationProgress('exp1')).toBeNull();
      expect(service.getExplorationProgress('exp2')).toBeNull();
      expect(service.getExplorationProgress('exp3')).toBeNull();
    });

    it('should emit progress update with null when all progress is reset', fakeAsync(() => {
      service.markCheckpointReached('exp1', 'CP1');
      let emittedExpId: string | null = 'not-null';

      service.progressUpdate$.subscribe(updatedExpId => {
        emittedExpId = updatedExpId;
      });

      service.resetAllProgress();
      tick();

      expect(emittedExpId).toBeNull();
      expect(service.getAllExplorationsWithProgress().length).toBe(0);
    }));
  });

  describe('getAllExplorationsWithProgress', () => {
    it('should return empty array when no progress is recorded', () => {
      const explorations = service.getAllExplorationsWithProgress();

      expect(explorations).toEqual([]);
    });

    it('should return all exploration IDs with recorded progress', () => {
      service.markCheckpointReached('exp1', 'CP1');
      service.markCheckpointReached('exp2', 'CP1');
      service.markCheckpointReached('exp3', 'CP1');

      const explorations = service.getAllExplorationsWithProgress();

      expect(explorations.length).toBe(3);
      expect(explorations).toContain('exp1');
      expect(explorations).toContain('exp2');
      expect(explorations).toContain('exp3');
    });

    it('should not include explorations with reset progress', () => {
      service.markCheckpointReached('exp1', 'CP1');
      service.markCheckpointReached('exp2', 'CP1');

      service.resetExplorationProgress('exp1');

      const explorations = service.getAllExplorationsWithProgress();

      expect(explorations.length).toBe(1);
      expect(explorations).toContain('exp2');
      expect(explorations).not.toContain('exp1');
    });
  });

  describe('progressUpdate$ observable', () => {
    it('should emit when checkpoint is reached', fakeAsync(() => {
      const explorationId = 'exp123';
      let emittedExpId: string | null = null;

      service.progressUpdate$.subscribe(updatedExpId => {
        emittedExpId = updatedExpId;
      });

      service.markCheckpointReached(explorationId, 'CP1');
      tick();

      expect(emittedExpId).toBe(explorationId);
    }));

    it('should emit with exploration ID when progress is reset', fakeAsync(() => {
      const explorationId = 'exp123';
      let emittedExpId: string | null = null;

      service.markCheckpointReached(explorationId, 'CP1');

      service.progressUpdate$.subscribe(updatedExpId => {
        emittedExpId = updatedExpId;
      });

      service.resetExplorationProgress(explorationId);
      tick();

      expect(emittedExpId).toBe(explorationId);
    }));

    it('should emit with null when all progress is reset', fakeAsync(() => {
      service.markCheckpointReached('exp1', 'CP1');
      let emittedExpId: string | null = 'not-null';

      service.progressUpdate$.subscribe(updatedExpId => {
        emittedExpId = updatedExpId;
      });

      service.resetAllProgress();
      tick();

      expect(emittedExpId).toBeNull();
    }));

    it('should allow multiple subscribers', fakeAsync(() => {
      const explorationId = 'exp123';
      let subscriber1Called = false;
      let subscriber2Called = false;

      service.progressUpdate$.subscribe(() => {
        subscriber1Called = true;
      });

      service.progressUpdate$.subscribe(() => {
        subscriber2Called = true;
      });

      service.markCheckpointReached(explorationId, 'CP1');
      tick();

      expect(subscriber1Called).toBe(true);
      expect(subscriber2Called).toBe(true);
    }));
  });

  describe('Integration scenarios', () => {
    it('should handle a complete exploration playthrough with multiple checkpoints', () => {
      const explorationId = 'math-101';

      service.markCheckpointReached(explorationId, 'Introduction');
      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(1);
      expect(service.getMostRecentlyReachedCheckpoint(explorationId)).toEqual(
        'Introduction'
      );

      service.markCheckpointReached(explorationId, 'BasicConcepts');
      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(2);
      expect(service.getMostRecentlyReachedCheckpoint(explorationId)).toEqual(
        'BasicConcepts'
      );

      // User tries again and goes back to first checkpoint (should not increment)
      service.markCheckpointReached(explorationId, 'Introduction');
      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(2);

      service.markCheckpointReached(explorationId, 'AdvancedConcepts');
      expect(service.getVisitedCheckpointsCount(explorationId)).toBe(3);
      expect(service.getMostRecentlyReachedCheckpoint(explorationId)).toEqual(
        'AdvancedConcepts'
      );

      expect(service.isCheckpointVisited(explorationId, 'Introduction')).toBe(
        true
      );
      expect(service.isCheckpointVisited(explorationId, 'BasicConcepts')).toBe(
        true
      );
      expect(
        service.isCheckpointVisited(explorationId, 'AdvancedConcepts')
      ).toBe(true);
    });

    it('should manage progress across multiple explorations independently', () => {
      const algebra = 'algebra-201';
      const geometry = 'geometry-101';
      const calculus = 'calculus-301';

      service.markCheckpointReached(algebra, 'CP1');
      service.markCheckpointReached(algebra, 'CP2');

      service.markCheckpointReached(geometry, 'CP1');

      service.markCheckpointReached(algebra, 'CP3');

      service.markCheckpointReached(calculus, 'CP1');

      expect(service.getVisitedCheckpointsCount(algebra)).toBe(3);
      expect(service.getVisitedCheckpointsCount(geometry)).toBe(1);
      expect(service.getVisitedCheckpointsCount(calculus)).toBe(1);

      expect(service.getMostRecentlyReachedCheckpoint(algebra)).toEqual('CP3');
      expect(service.getMostRecentlyReachedCheckpoint(geometry)).toEqual('CP1');
      expect(service.getMostRecentlyReachedCheckpoint(calculus)).toEqual('CP1');
    });
  });
});
