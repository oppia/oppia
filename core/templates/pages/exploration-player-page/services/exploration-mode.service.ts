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
 * @fileoverview Service to determine and manage the current mode of the exploration player.
 *
 * This service identifies the context in which an exploration or question is being played.
 * It differentiates between various modes such as exploration, editor preview, question player,
 * pretest, diagnostic test, and story chapter modes. Depending on the current mode, it assigns
 * the appropriate engine service for handling state and interaction logic./
 */

import {Injectable} from '@angular/core';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {PageContextService} from 'services/page-context.service';
import {DiagnosticTestPlayerEngineService} from './diagnostic-test-player-engine.service';
import {ExplorationEngineService} from './exploration-engine.service';
import {QuestionPlayerEngineService} from './question-player-engine.service';

enum EXPLORATION_MODE {
  DIAGNOSTIC_TEST_PLAYER = 'diagnostic_test_player',
  EXPLORATION = 'exploration',
  EDITOR_PREVIEW = 'editor_preview',
  LESSON_PLAYER = 'lesson_player',
  PRETEST = 'pretest',
  QUESTION_PLAYER = 'question_player',
  STORY_CHAPTER = 'story_chapter',
}

@Injectable({
  providedIn: 'root',
})
export class ExplorationModeService {
  currentMode!: EXPLORATION_MODE;
  currentEngineService!:
    | ExplorationEngineService
    | QuestionPlayerEngineService
    | DiagnosticTestPlayerEngineService;

  constructor(
    private explorationEngineService: ExplorationEngineService,
    private questionPlayerEngineService: QuestionPlayerEngineService,
    private diagnosticTestPlayerEngineService: DiagnosticTestPlayerEngineService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private pageContextService: PageContextService,
    private urlService: UrlService
  ) {
    this.init();
  }

  private init(): void {
    let pathnameArray = this.urlService.getPathname().split('/');
    let explorationContext = false;

    for (let i = 0; i < pathnameArray.length; i++) {
      if (
        pathnameArray[i] === 'explore' ||
        pathnameArray[i] === 'create' ||
        pathnameArray[i] === 'skill_editor' ||
        pathnameArray[i] === 'embed' ||
        pathnameArray[i] === 'lesson'
      ) {
        explorationContext = true;
        break;
      }
    }

    if (explorationContext) {
      if (this.pageContextService.isInExplorationEditorPage()) {
        this.currentMode = EXPLORATION_MODE.EDITOR_PREVIEW;
      } else if (this.pageContextService.isInQuestionPlayerMode()) {
        this.currentMode = EXPLORATION_MODE.QUESTION_PLAYER;
      }
    }
  }

  getCurrentMode(): EXPLORATION_MODE {
    return this.currentMode;
  }

  getCurrentEngineService():
    | ExplorationEngineService
    | QuestionPlayerEngineService
    | DiagnosticTestPlayerEngineService {
    return this.currentEngineService;
  }

  setExplorationMode(): void {
    this.currentMode = EXPLORATION_MODE.EXPLORATION;
    this.currentEngineService = this.explorationEngineService;
  }

  setPretestMode(): void {
    this.currentMode = EXPLORATION_MODE.PRETEST;
    this.currentEngineService = this.questionPlayerEngineService;
  }

  setQuestionPlayerMode(): void {
    this.currentMode = EXPLORATION_MODE.QUESTION_PLAYER;
    this.currentEngineService = this.questionPlayerEngineService;
  }

  setDiagnosticTestPlayerMode(): void {
    this.currentMode = EXPLORATION_MODE.DIAGNOSTIC_TEST_PLAYER;
    this.currentEngineService = this.diagnosticTestPlayerEngineService;
  }

  setStoryChapterMode(): void {
    this.currentMode = EXPLORATION_MODE.STORY_CHAPTER;
    this.currentEngineService = this.explorationEngineService;
  }

  isInQuestionMode(): boolean {
    return (
      this.currentMode === EXPLORATION_MODE.PRETEST ||
      this.currentMode === EXPLORATION_MODE.QUESTION_PLAYER
    );
  }

  isInExplorationEditorPreviewMode(): boolean {
    return this.currentMode === EXPLORATION_MODE.EDITOR_PREVIEW;
  }

  isInQuestionPlayerMode(): boolean {
    return this.currentMode === EXPLORATION_MODE.QUESTION_PLAYER;
  }

  isPresentingIsolatedQuestions(): boolean {
    // The method returns a boolean value by checking whether the current mode
    // is only presenting the questions or not.
    // The diagnostic player mode, question player mode, and pretest mode are
    // the ones in which only questions are presented to the learner, while in
    // the exploration mode and story chapter mode the learning contents along
    // with questions are presented.
    if (
      this.currentMode === EXPLORATION_MODE.QUESTION_PLAYER ||
      this.currentMode === EXPLORATION_MODE.DIAGNOSTIC_TEST_PLAYER ||
      this.currentMode === EXPLORATION_MODE.PRETEST
    ) {
      return true;
    } else if (
      this.currentMode === EXPLORATION_MODE.EXPLORATION ||
      this.currentMode === EXPLORATION_MODE.STORY_CHAPTER
    ) {
      return false;
    } else {
      throw new Error('Invalid mode received: ' + this.currentMode + '.');
    }
  }

  isInDiagnosticTestPlayerMode(): boolean {
    return this.currentMode === EXPLORATION_MODE.DIAGNOSTIC_TEST_PLAYER;
  }

  isInStoryChapterMode(): boolean {
    return this.currentMode === EXPLORATION_MODE.STORY_CHAPTER;
  }
}
