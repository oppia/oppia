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

import { States }
  from 'domain/exploration/StatesObjectFactory';
import { ExplorationEditorPageConstants }
  from 'pages/exploration-editor-page/exploration-editor-page.constants';

interface RankedStates {
  rank: number;
  stateName: string;
  type: string;
}

export interface StateStats {
  // eslint-disable-next-line camelcase
  total_entry_count: number;
  // eslint-disable-next-line camelcase
  no_submitted_answer_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class StateImprovementSuggestionService {
  getStateImprovements(
      explorationStates: States,
      allStateStats: {[state: string]: StateStats}): RankedStates[] {
    const rankComparator = (lhs, rhs) => {
      return rhs.rank - lhs.rank;
    };

    const rankedStates = [];
    explorationStates.getStateNames().forEach(stateName => {
      if (!allStateStats.hasOwnProperty(stateName)) {
        return;
      }

      const stateStats = allStateStats[stateName];
      const totalEntryCount = stateStats.total_entry_count;
      const noAnswerSubmittedCount = stateStats.no_submitted_answer_count;

      if (totalEntryCount === 0) {
        return;
      }

      const threshold = 0.2 * totalEntryCount;
      const eligibleFlags = [];
      const state = explorationStates.getState(stateName);
      const stateInteraction = state.interaction;
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
