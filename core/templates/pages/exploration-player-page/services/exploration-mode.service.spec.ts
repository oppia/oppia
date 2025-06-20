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
 * @fileoverview Unit tests for the ExplorationModeService.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed, tick, waitForAsync} from '@angular/core/testing';
import {
  ExplorationModeService,
  EXPLORATION_MODE,
} from './exploration-mode.service';
import {UrlService} from 'services/contextual/url.service';
import {PageContextService} from 'services/page-context.service';
import {CurrentEngineService} from './current-engine.service';
import {TranslateModule} from '@ngx-translate/core';

describe('ExplorationModeService', () => {
  let explorationModeService: ExplorationModeService;
  let urlService: UrlService;
  let pageContextService: PageContextService;
  let currentEngineService: CurrentEngineService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        ExplorationModeService,
        UrlService,
        PageContextService,
        CurrentEngineService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    explorationModeService = TestBed.inject(ExplorationModeService);
    urlService = TestBed.inject(UrlService);
    pageContextService = TestBed.inject(PageContextService);
    currentEngineService = TestBed.inject(CurrentEngineService);
  });

  it('should initialize to editor preview mode based on URL', () => {
    spyOn(urlService, 'getPathname').and.returnValue('/create/123');
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      true
    );
    explorationModeService.init();
    expect(explorationModeService.getCurrentMode()).toBe(
      EXPLORATION_MODE.EDITOR_PREVIEW
    );
  });

  it('should initialize to question player mode based on URL', () => {
    spyOn(urlService, 'getPathname').and.returnValue('/skill_editor/123');
    spyOn(pageContextService, 'isInQuestionPlayerMode').and.returnValue(true);
    explorationModeService.init();
    expect(explorationModeService.getCurrentMode()).toBe(
      EXPLORATION_MODE.QUESTION_PLAYER
    );
  });

  it('should set the exploration mode correctly', () => {
    spyOn(currentEngineService, 'setExplorationEngineService');
    explorationModeService.setExplorationMode();
    expect(explorationModeService.getCurrentMode()).toBe(
      EXPLORATION_MODE.EXPLORATION
    );
    expect(currentEngineService.setExplorationEngineService).toHaveBeenCalled();
  });

  it('should set the pretest mode correctly', () => {
    spyOn(currentEngineService, 'setQuestionPlayerEngineService');
    explorationModeService.setPretestMode();
    expect(explorationModeService.getCurrentMode()).toBe(
      EXPLORATION_MODE.PRETEST
    );
    expect(
      currentEngineService.setQuestionPlayerEngineService
    ).toHaveBeenCalled();
  });

  it('should set the question player mode correctly', () => {
    spyOn(currentEngineService, 'setQuestionPlayerEngineService');
    explorationModeService.setQuestionPlayerMode();
    expect(explorationModeService.getCurrentMode()).toBe(
      EXPLORATION_MODE.QUESTION_PLAYER
    );
    expect(
      currentEngineService.setQuestionPlayerEngineService
    ).toHaveBeenCalled();
  });

  it('should set the diagnostic test player mode correctly', () => {
    spyOn(currentEngineService, 'setDiagnosticTestPlayerEngineService');
    explorationModeService.setDiagnosticTestPlayerMode();
    expect(explorationModeService.getCurrentMode()).toBe(
      EXPLORATION_MODE.DIAGNOSTIC_TEST_PLAYER
    );
    expect(
      currentEngineService.setDiagnosticTestPlayerEngineService
    ).toHaveBeenCalled();
  });

  it('should set the story chapter mode correctly', () => {
    spyOn(currentEngineService, 'setExplorationEngineService');
    explorationModeService.setStoryChapterMode();
    expect(explorationModeService.getCurrentMode()).toBe(
      EXPLORATION_MODE.STORY_CHAPTER
    );
    expect(currentEngineService.setExplorationEngineService).toHaveBeenCalled();
  });

  it('should check if in question mode', () => {
    explorationModeService.setPretestMode();
    expect(explorationModeService.isInQuestionMode()).toBeTrue();

    explorationModeService.setQuestionPlayerMode();
    expect(explorationModeService.isInQuestionMode()).toBeTrue();

    explorationModeService.setExplorationMode();
    expect(explorationModeService.isInQuestionMode()).toBeFalse();
  });

  it('should check if in question player mode', () => {
    explorationModeService.setQuestionPlayerMode();
    expect(explorationModeService.isInQuestionPlayerMode()).toBeTrue();

    explorationModeService.setExplorationMode();
    expect(explorationModeService.isInQuestionPlayerMode()).toBeFalse();
  });

  it('should check if presenting isolated questions', () => {
    explorationModeService.setQuestionPlayerMode();
    expect(explorationModeService.isPresentingIsolatedQuestions()).toBeTrue();

    explorationModeService.setDiagnosticTestPlayerMode();
    expect(explorationModeService.isPresentingIsolatedQuestions()).toBeTrue();

    explorationModeService.setPretestMode();
    expect(explorationModeService.isPresentingIsolatedQuestions()).toBeTrue();

    explorationModeService.setExplorationMode();
    expect(explorationModeService.isPresentingIsolatedQuestions()).toBeFalse();

    explorationModeService.setStoryChapterMode();
    expect(explorationModeService.isPresentingIsolatedQuestions()).toBeFalse();

    explorationModeService.currentMode = EXPLORATION_MODE.EDITOR_PREVIEW;
    expect(() => {
      explorationModeService.isPresentingIsolatedQuestions();
      tick(10);
    }).toThrowError('Invalid mode received: editor_preview.');
  });

  it('should check if in diagnostic test player mode', () => {
    explorationModeService.setDiagnosticTestPlayerMode();
    expect(explorationModeService.isInDiagnosticTestPlayerMode()).toBeTrue();

    explorationModeService.setExplorationMode();
    expect(explorationModeService.isInDiagnosticTestPlayerMode()).toBeFalse();
  });

  it('should check if in story chapter mode', () => {
    explorationModeService.setStoryChapterMode();
    expect(explorationModeService.isInStoryChapterMode()).toBeTrue();

    explorationModeService.setExplorationMode();
    expect(explorationModeService.isInStoryChapterMode()).toBeFalse();
  });

  it('should set exploration mode from URL when parameters are present', () => {
    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_url_fragment: 'some_fragment',
      node_id: 'some_id',
    });
    explorationModeService.setExplorationModeFromUrl();
    expect(explorationModeService.getCurrentMode()).toBe(
      EXPLORATION_MODE.STORY_CHAPTER
    );
  });

  it('should set exploration mode from URL when parameters are absent', () => {
    spyOn(urlService, 'getUrlParams').and.returnValue({});
    explorationModeService.setExplorationModeFromUrl();
    expect(explorationModeService.getCurrentMode()).toBe(
      EXPLORATION_MODE.EXPLORATION
    );
  });
});
