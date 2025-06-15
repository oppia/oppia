// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Backend api service for stats reporting.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {ContextService} from 'services/context.service';
import {ExplorationPlayerConstants} from 'pages/exploration-player-page/exploration-player-page.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

interface SessionStateStats {
  total_answers_count: number;
  useful_feedback_count: number;
  total_hit_count: number;
  first_hit_count: number;
  num_times_solution_viewed: number;
  num_completions: number;
}

export interface AggregatedStats {
  num_starts: number;
  num_completions: number;
  num_actual_starts: number;
  state_stats_mapping: {
    [stateName: string]: SessionStateStats;
  };
}

type StatsReportingUrlsKey =
  keyof typeof ExplorationPlayerConstants.STATS_REPORTING_URLS;

@Injectable({
  providedIn: 'root',
})
export class StatsReportingBackendApiService {
  constructor(
    private contextService: ContextService,
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private getFullStatsUrl(
    urlIdentifier: string,
    explorationId: string,
    currentStateName: string,
    nextExpId: string,
    previousStateName: string,
    nextStateName: string
  ): string {
    try {
      return this.urlInterpolationService.interpolateUrl(
        ExplorationPlayerConstants.STATS_REPORTING_URLS[
          urlIdentifier as StatsReportingUrlsKey
        ],
        {
          exploration_id: explorationId,
        }
      );
      // We use unknown type because we are unsure of the type of error
      // that was thrown. Since the catch block cannot identify the
      // specific type of error, we are unable to further optimise the
      // code by introducing more types of errors.
    } catch (e: unknown) {
      if (e instanceof Error) {
        let additionalInfo =
          '\nUndefined exploration id error debug logs:' +
          '\nThe event being recorded: ' +
          urlIdentifier +
          '\nExploration ID: ' +
          this.contextService.getExplorationId();
        if (currentStateName) {
          additionalInfo += '\nCurrent State name: ' + currentStateName;
        }
        if (nextExpId) {
          additionalInfo += '\nRefresher exp id: ' + nextExpId;
        }
        if (previousStateName && nextStateName) {
          additionalInfo +=
            '\nOld State name: ' +
            previousStateName +
            '\nNew State name: ' +
            nextStateName;
        }
        e.message += additionalInfo;
      }
      throw e;
    }
  }

  async postsStatsAsync(
    aggregatedStats: AggregatedStats,
    expVersion: number,
    explorationId: string,
    currentStateName: string,
    nextExpId: string,
    previousStateName: string,
    nextStateName: string
  ): Promise<Object> {
    return this.http
      .post(
        this.getFullStatsUrl(
          'STATS_EVENTS',
          explorationId,
          currentStateName,
          nextExpId,
          previousStateName,
          nextStateName
        ),
        {
          aggregated_stats: aggregatedStats,
          exp_version: expVersion,
        }
      )
      .toPromise();
  }

  async recordExpStartedAsync(
    params: Object,
    sessionId: string,
    stateName: string,
    expVersion: number,
    explorationId: string,
    currentStateName: string,
    nextExpId: string,
    previousStateName: string,
    nextStateName: string
  ): Promise<Object> {
    return this.http
      .post(
        this.getFullStatsUrl(
          'EXPLORATION_STARTED',
          explorationId,
          currentStateName,
          nextExpId,
          previousStateName,
          nextStateName
        ),
        {
          params: params,
          session_id: sessionId,
          state_name: stateName,
          version: expVersion,
        }
      )
      .toPromise();
  }

  async recordStateHitAsync(
    clientTimeSpentInSecs: number,
    expVersion: number,
    newStateName: string,
    oldParams: Object,
    sessionId: string,
    explorationId: string,
    currentStateName: string,
    nextExpId: string,
    previousStateName: string,
    nextStateName: string
  ): Promise<Object> {
    return this.http
      .post(
        this.getFullStatsUrl(
          'STATE_HIT',
          explorationId,
          currentStateName,
          nextExpId,
          previousStateName,
          nextStateName
        ),
        {
          client_time_spent_in_secs: clientTimeSpentInSecs,
          exploration_version: expVersion,
          new_state_name: newStateName,
          old_params: oldParams,
          session_id: sessionId,
        }
      )
      .toPromise();
  }

  async recordExplorationActuallyStartedAsync(
    expVersion: number,
    stateName: string,
    sessionId: string,
    explorationId: string,
    currentStateName: string,
    nextExpId: string,
    previousStateName: string,
    nextStateName: string
  ): Promise<Object> {
    return this.http
      .post(
        this.getFullStatsUrl(
          'EXPLORATION_ACTUALLY_STARTED',
          explorationId,
          currentStateName,
          nextExpId,
          previousStateName,
          nextStateName
        ),
        {
          exploration_version: expVersion,
          state_name: stateName,
          session_id: sessionId,
        }
      )
      .toPromise();
  }

  async recordSolutionHitAsync(
    timeSpentInStateSecs: number,
    expVersion: number,
    stateName: string,
    sessionId: string,
    explorationId: string,
    currentStateName: string,
    nextExpId: string,
    previousStateName: string,
    nextStateName: string
  ): Promise<Object> {
    return this.http
      .post(
        this.getFullStatsUrl(
          'SOLUTION_HIT',
          explorationId,
          currentStateName,
          nextExpId,
          previousStateName,
          nextStateName
        ),
        {
          exploration_version: expVersion,
          state_name: stateName,
          session_id: sessionId,
          time_spent_in_state_secs: timeSpentInStateSecs,
        }
      )
      .toPromise();
  }

  async recordLeaveForRefresherExpAsync(
    expVersion: number,
    refresherExpId: string,
    stateName: string,
    sessionId: string,
    timeSpentInStateSecs: number,
    explorationId: string,
    currentStateName: string,
    nextExpId: string,
    previousStateName: string,
    nextStateName: string
  ): Promise<Object> {
    return this.http
      .post(
        this.getFullStatsUrl(
          'LEAVE_FOR_REFRESHER_EXP',
          explorationId,
          currentStateName,
          nextExpId,
          previousStateName,
          nextStateName
        ),
        {
          exploration_version: expVersion,
          refresher_exp_id: refresherExpId,
          state_name: stateName,
          session_id: sessionId,
          time_spent_in_state_secs: timeSpentInStateSecs,
        }
      )
      .toPromise();
  }

  async recordStateCompletedAsync(
    expVersion: number,
    sessionId: string,
    stateName: string,
    timeSpentInStateSecs: number,
    explorationId: string,
    currentStateName: string,
    nextExpId: string,
    previousStateName: string,
    nextStateName: string
  ): Promise<Object> {
    return this.http
      .post(
        this.getFullStatsUrl(
          'STATE_COMPLETED',
          explorationId,
          currentStateName,
          nextExpId,
          previousStateName,
          nextStateName
        ),
        {
          exp_version: expVersion,
          state_name: stateName,
          session_id: sessionId,
          time_spent_in_state_secs: timeSpentInStateSecs,
        }
      )
      .toPromise();
  }

  async recordExplorationCompletedAsync(
    clientTimeSpentInSecs: number,
    collectionId: string,
    params: Object,
    sessionId: string,
    stateName: string,
    version: number,
    explorationId: string,
    currentStateName: string,
    nextExpId: string,
    previousStateName: string,
    nextStateName: string
  ): Promise<Object> {
    return this.http
      .post(
        this.getFullStatsUrl(
          'EXPLORATION_COMPLETED',
          explorationId,
          currentStateName,
          nextExpId,
          previousStateName,
          nextStateName
        ),
        {
          client_time_spent_in_secs: clientTimeSpentInSecs,
          collection_id: collectionId,
          params: params,
          session_id: sessionId,
          state_name: stateName,
          version: version,
        }
      )
      .toPromise();
  }

  async recordAnswerSubmittedAsync(
    answer: string,
    params: Object,
    version: number,
    sessionId: string,
    clientTimeSpentInSecs: number,
    oldStateName: string,
    answerGroupIndex: number,
    ruleSpecIndex: number,
    classificationCategorization: string,
    explorationId: string,
    currentStateName: string,
    nextExpId: string,
    previousStateName: string,
    nextStateName: string
  ): Promise<Object> {
    return this.http
      .post(
        this.getFullStatsUrl(
          'ANSWER_SUBMITTED',
          explorationId,
          currentStateName,
          nextExpId,
          previousStateName,
          nextStateName
        ),
        {
          answer: answer,
          params: params,
          version: version,
          session_id: sessionId,
          client_time_spent_in_secs: clientTimeSpentInSecs,
          old_state_name: oldStateName,
          answer_group_index: answerGroupIndex,
          rule_spec_index: ruleSpecIndex,
          classification_categorization: classificationCategorization,
        }
      )
      .toPromise();
  }

  async recordMaybeLeaveEventAsync(
    clientTimeSpentInSecs: number,
    collectionId: string,
    params: Object,
    sessionId: string,
    stateName: string,
    version: number,
    explorationId: string,
    currentStateName: string,
    nextExpId: string,
    previousStateName: string,
    nextStateName: string
  ): Promise<Object> {
    return this.http
      .post(
        this.getFullStatsUrl(
          'EXPLORATION_MAYBE_LEFT',
          explorationId,
          currentStateName,
          nextExpId,
          previousStateName,
          nextStateName
        ),
        {
          client_time_spent_in_secs: clientTimeSpentInSecs,
          collection_id: collectionId,
          params: params,
          session_id: sessionId,
          state_name: stateName,
          version: version,
        }
      )
      .toPromise();
  }
}
