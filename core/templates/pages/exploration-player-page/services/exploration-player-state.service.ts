// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service that maintains a record of the state of the player,
 *  like engine service.
 */

import {Injectable, EventEmitter} from '@angular/core';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {PretestQuestionBackendApiService} from 'domain/question/pretest-question-backend-api.service';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {
  Question,
} from 'domain/question/QuestionObjectFactory';
import {StateCard} from 'domain/state_card/state-card.model';
import {UrlService} from 'services/contextual/url.service';
import {
  ExplorationFeatures,
  ExplorationFeaturesBackendApiService,
} from 'services/exploration-features-backend-api.service';
import {ExplorationFeaturesService} from 'services/exploration-features.service';
import {PlaythroughService} from 'services/playthrough.service';
import {ExplorationEngineService} from './exploration-engine.service';
import {NumberAttemptsService} from './number-attempts.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {QuestionPlayerEngineService} from './question-player-engine.service';
import {DiagnosticTestPlayerEngineService} from './diagnostic-test-player-engine.service';
import {StatsReportingService} from './stats-reporting.service';

@Injectable({
  providedIn: 'root',
})
export class ExplorationPlayerStateService {
  explorationMode: string;
  editorPreviewMode: boolean;
  questionPlayerMode: boolean;
  diagnosticTestPlayerMode: boolean;
  explorationId: string;
  version: number | null;
  storyUrlFragment: string;
  lastCompletedCheckpoint: string;
  isLoggedOutProgressTracked: boolean = false;
  uniqueProgressUrlId: string | null = null;


  constructor(
    private editableExplorationBackendApiService: EditableExplorationBackendApiService,
    private explorationEngineService: ExplorationEngineService,
    private explorationFeaturesBackendApiService: ExplorationFeaturesBackendApiService,
    private explorationFeaturesService: ExplorationFeaturesService,
    private numberAttemptsService: NumberAttemptsService,
    private playerTranscriptService: PlayerTranscriptService,
    private playthroughService: PlaythroughService,
    private pretestQuestionBackendApiService: PretestQuestionBackendApiService,
    private questionBackendApiService: QuestionBackendApiService,
    private questionPlayerEngineService: QuestionPlayerEngineService,
    private diagnosticTestPlayerEngineService: DiagnosticTestPlayerEngineService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private statsReportingService: StatsReportingService,
    private urlService: UrlService
  ) { }




}
