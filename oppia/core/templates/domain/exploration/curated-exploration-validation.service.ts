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
 * @fileoverview Service to validate candidates for curated lessons
 */

import {Injectable} from '@angular/core';

import {AppConstants} from 'app.constants';
import {
  ExplorationSummaryBackendApiService,
  ExplorationSummaryBackendDict,
} from 'domain/summary/exploration-summary-backend-api.service';
import {
  ReadOnlyExplorationBackendApiService,
  FetchExplorationBackendResponse,
} from './read-only-exploration-backend-api.service';
import {MultipleChoiceInputCustomizationArgsBackendDict} from 'extensions/interactions/customization-args-defs';

@Injectable({
  providedIn: 'root',
})
export class CuratedExplorationValidationService {
  constructor(
    private explorationSummaryBackendApiService: ExplorationSummaryBackendApiService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService
  ) {}

  /* *****************************************
  Validate exploration settings.
  ***************************************** */

  // Exploration must be published.
  async isExpPublishedAsync(explorationId: string): Promise<boolean> {
    return this.explorationSummaryBackendApiService
      .loadPublicExplorationSummariesAsync([explorationId])
      .then((response: ExplorationSummaryBackendDict) => {
        let summaries = response.summaries;
        return summaries.length === 1 && summaries[0] !== null;
      });
  }

  // Exploration cannot be in a custom category.
  async isDefaultCategoryAsync(explorationId: string): Promise<boolean> {
    return this.explorationSummaryBackendApiService
      .loadPublicExplorationSummariesAsync([explorationId])
      .then((response: ExplorationSummaryBackendDict) => {
        let summaries = response.summaries;
        let isCategoryPresent = false;
        if (summaries.length === 1) {
          let category = summaries[0].category;
          for (let i of AppConstants.ALL_CATEGORIES) {
            if (i === category) {
              isCategoryPresent = true;
            }
          }
        }
        return isCategoryPresent;
      });
  }

  /* *****************************************
  Validate exploration RTE components.
  ***************************************** */

  // We perform all RTE validation checks in the frontend by making a request
  // to the server and returning the result of the backend validation check.
  // This allows us to avoid needing to parse HTML DOM strings.

  /* *****************************************
  Validate exploration interactions.
  ***************************************** */

  // Interactions are restricted to an allowlist.
  async getStatesWithRestrictedInteractions(
    explorationId: string
  ): Promise<string[]> {
    let allowedInteractionIds: string[] = [];
    for (const category of AppConstants.ALLOWED_EXPLORATION_IN_STORY_INTERACTION_CATEGORIES) {
      allowedInteractionIds.push(...category.interaction_ids);
    }
    return this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(explorationId, null)
      .then((response: FetchExplorationBackendResponse) => {
        let invalidStateNames = [];
        for (const [stateName, stateDict] of Object.entries(
          response.exploration.states
        )) {
          const interactionId = stateDict.interaction.id as string;
          if (!allowedInteractionIds.includes(interactionId)) {
            invalidStateNames.push(stateName);
          }
        }
        return invalidStateNames;
      });
  }

  // Multiple choice interactions must have at least 4 choices.
  async getStatesWithInvalidMultipleChoices(
    explorationId: string
  ): Promise<string[]> {
    return this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(explorationId, null)
      .then((response: FetchExplorationBackendResponse) => {
        let invalidStateNames = [];
        for (const [stateName, stateDict] of Object.entries(
          response.exploration.states
        )) {
          if (stateDict.interaction.id === 'MultipleChoiceInput') {
            const args = stateDict.interaction
              .customization_args as MultipleChoiceInputCustomizationArgsBackendDict;
            if (
              args.choices.value.length <
              AppConstants.MIN_CHOICES_IN_MULTIPLE_CHOICE_INPUT_CURATED_EXP
            ) {
              invalidStateNames.push(stateName);
            }
          }
        }
        return invalidStateNames;
      });
  }
}
