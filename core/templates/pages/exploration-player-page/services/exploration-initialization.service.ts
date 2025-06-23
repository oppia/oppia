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
 * @fileoverview Temporary service to initialize the exploration player
 * and question player. This service is used to initialize the exploration
 * player and question player with the necessary data and features.
 *
 * It has been created to avoid circular dependencies between
 * ExplorationEngineService and ExplorationModeService.
 */

import {Injectable} from '@angular/core';
import {UrlService} from 'services/contextual/url.service';
import {PageContextService} from 'services/page-context.service';
import {FetchExplorationBackendResponse} from 'domain/exploration/read-only-exploration-backend-api.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {ExplorationEngineService} from './exploration-engine.service';
import {QuestionPlayerEngineService} from './question-player-engine.service';
import {ExplorationFeaturesService} from 'services/exploration-features.service';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {PretestQuestionBackendApiService} from '../../../domain/question/pretest-question-backend-api.service';
import {
  ExplorationFeatures,
  ExplorationFeaturesBackendApiService,
} from 'services/exploration-features-backend-api.service';
import {StatsReportingService} from './stats-reporting.service';
import {PlaythroughService} from 'services/playthrough.service';
import {NumberAttemptsService} from './number-attempts.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {ExplorationModeService} from './exploration-mode.service';
import {Question} from 'domain/question/QuestionObjectFactory';

@Injectable({
  providedIn: 'root',
})
export class ExplorationInitializationService {
  constructor(
    private pageContextService: PageContextService,
    private urlService: UrlService,
    private explorationEngineService: ExplorationEngineService,
    private questionPlayerEngineService: QuestionPlayerEngineService,
    private explorationFeaturesService: ExplorationFeaturesService,
    private editableExplorationBackendApiService: EditableExplorationBackendApiService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private pretestQuestionBackendApiService: PretestQuestionBackendApiService,
    private explorationFeaturesBackendApiService: ExplorationFeaturesBackendApiService,
    private statsReportingService: StatsReportingService,
    private playthroughService: PlaythroughService,
    private numberAttemptsService: NumberAttemptsService,
    private playerTranscriptService: PlayerTranscriptService,
    private explorationModeService: ExplorationModeService
  ) {}

  private initExplorationPreviewPlayer(
    callback: (sateCard: StateCard, str: string) => void
  ): void {
    this.explorationModeService.setExplorationMode();
    let explorationId = this.pageContextService.getExplorationId();
    Promise.all([
      this.editableExplorationBackendApiService.fetchApplyDraftExplorationAsync(
        explorationId
      ),
      this.explorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
        explorationId
      ),
    ]).then(combinedData => {
      let explorationData = combinedData[0];
      let featuresData: ExplorationFeatures = combinedData[1];

      this.explorationFeaturesService.init(
        {
          param_changes: explorationData.param_changes,
          states: explorationData.states,
        },
        featuresData
      );
      this.explorationEngineService.init(
        explorationData,
        null,
        null,
        null,
        [],
        [],
        callback
      );
      this.numberAttemptsService.reset();
    });
  }

  private async initExplorationPlayer(
    callback: (stateCard: StateCard, str: string) => void
  ): Promise<void> {
    let explorationId = this.pageContextService.getExplorationId();
    let version = this.pageContextService.getExplorationVersion();
    let explorationDataPromise = version
      ? this.readOnlyExplorationBackendApiService.loadExplorationAsync(
          explorationId,
          version
        )
      : this.readOnlyExplorationBackendApiService.loadLatestExplorationAsync(
          explorationId
        );
    let storyUrlFragment = this.urlService.getStoryUrlFragmentFromLearnerUrl();
    let pretestQuestionsData: Question[] = [];
    if (storyUrlFragment) {
      pretestQuestionsData =
        await this.pretestQuestionBackendApiService.fetchPretestQuestionsAsync(
          explorationId,
          storyUrlFragment
        );
    }
    Promise.all([
      explorationDataPromise,
      this.explorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
        explorationId
      ),
    ]).then(combinedData => {
      let explorationData: FetchExplorationBackendResponse = combinedData[0];
      let featuresData = combinedData[1];
      this.explorationFeaturesService.init(
        {
          ...explorationData.exploration,
        },
        featuresData
      );
      if (pretestQuestionsData.length > 0) {
        this.explorationModeService.setPretestMode();
        this.initializeExplorationServices(explorationData, true, callback);
        this.questionPlayerEngineService.initializePretestServices(
          pretestQuestionsData,
          callback
        );
      } else if (
        this.urlService.getUrlParams().hasOwnProperty('story_url_fragment') &&
        this.urlService.getUrlParams().hasOwnProperty('node_id')
      ) {
        this.explorationModeService.setStoryChapterMode();
        this.initializeExplorationServices(explorationData, false, callback);
      } else {
        this.explorationModeService.setExplorationMode();
        this.initializeExplorationServices(explorationData, false, callback);
      }
    });
  }

  initializePlayer(
    callback: (stateCard: StateCard, str: string) => void
  ): void {
    this.playerTranscriptService.init();
    if (this.pageContextService.isInExplorationEditorPage()) {
      this.initExplorationPreviewPlayer(callback);
    } else {
      this.initExplorationPlayer(callback);
    }
  }

  private initializeExplorationServices(
    returnDict: FetchExplorationBackendResponse,
    arePretestsAvailable: boolean,
    callback: (stateCard: StateCard, str: string) => void
  ): void {
    let explorationId = this.pageContextService.getExplorationId();
    // For some cases, version is set only after
    // ReadOnlyExplorationBackendApiService.loadExploration() has completed.
    // Use returnDict.version for non-null version value.
    let collectionId = this.urlService.getCollectionIdFromExplorationUrl();
    this.statsReportingService.initSession(
      explorationId,
      returnDict.exploration.title,
      returnDict.version,
      returnDict.session_id,
      collectionId
    );
    this.playthroughService.initSession(
      explorationId,
      returnDict.version,
      returnDict.record_playthrough_probability
    );
    this.explorationEngineService.init(
      {
        auto_tts_enabled: returnDict.auto_tts_enabled,
        draft_changes: [],
        is_version_of_draft_valid: true,
        init_state_name: returnDict.exploration.init_state_name,
        param_changes: returnDict.exploration.param_changes,
        param_specs: returnDict.exploration.param_specs,
        states: returnDict.exploration.states,
        title: returnDict.exploration.title,
        draft_change_list_id: returnDict.draft_change_list_id,
        language_code: returnDict.exploration.language_code,
        version: returnDict.version,
        next_content_id_index: returnDict.exploration.next_content_id_index,
        exploration_metadata: returnDict.exploration_metadata,
      },
      returnDict.version,
      returnDict.preferred_audio_language_code,
      returnDict.auto_tts_enabled,
      returnDict.preferred_language_codes,
      returnDict.displayable_language_codes,
      arePretestsAvailable ? () => {} : callback
    );
  }
}
