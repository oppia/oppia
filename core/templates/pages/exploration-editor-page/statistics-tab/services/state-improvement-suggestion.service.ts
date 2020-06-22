// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for suggestion improvements to a specific state.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ExplorationEditorPageConstants }
  from 'pages/exploration-editor-page/exploration-editor-page.constants';
import { ExplorationStats } from
  'domain/statistics/ExplorationStatsObjectFactory';

interface RankedStates {
  rank: number;
  stateName: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class StateImprovementSuggestionService {
  getStateImprovements(explorationStats: ExplorationStats): RankedStates[] {
    const rankComparator = (lhs, rhs) => {
      return rhs.rank - lhs.rank;
    };

    const rankedStates = [];
    explorationStats.getStateNames().forEach(stateName => {
      const stateStats = explorationStats.getStateStats(stateName);
      const totalEntryCount = stateStats.totalHitCount;
      const noAnswerSubmittedCount = stateStats.totalAnswersCount;

      if (totalEntryCount === 0) {
        return;
      }

      const threshold = 0.2 * totalEntryCount;
      const eligibleFlags = [];
      if (noAnswerSubmittedCount > threshold) {
        eligibleFlags.push({
          rank: noAnswerSubmittedCount,
          improveType: ExplorationEditorPageConstants.IMPROVE_TYPE_INCOMPLETE,
        });
      }
      if (eligibleFlags.length > 0) {
        eligibleFlags.sort(rankComparator);
        rankedStates.push({
          rank: eligibleFlags[0].rank,
          stateName: stateName,
          type: eligibleFlags[0].improveType,
        });
      }
    });

    // The returned suggestions are sorted decreasingly by their ranks.
    rankedStates.sort(rankComparator);
    return rankedStates;
  }
}

angular.module('oppia').factory(
  'StateImprovementSuggestionService',
  downgradeInjectable(StateImprovementSuggestionService));
