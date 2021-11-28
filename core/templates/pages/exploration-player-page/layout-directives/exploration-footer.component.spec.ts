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
 * @fileoverview Unit tests for showing author/share footer
 * in exploration player.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ExplorationFooterComponent } from './exploration-footer.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { LimitToPipe } from 'filters/limit-to.pipe';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { ExplorationSummaryBackendApiService, ExplorationSummaryDict } from 'domain/summary/exploration-summary-backend-api.service';
import { EventEmitter } from '@angular/core';
import { QuestionPlayerStateService } from 'components/question-directives/question-player/services/question-player-state.service';

describe('ExplorationFooterComponent', () => {
  let component: ExplorationFooterComponent;
  let fixture: ComponentFixture<ExplorationFooterComponent>;
  let contextService: ContextService;
  let urlService: UrlService;
  let windowDimensionsService: WindowDimensionsService;
  let questionPlayerStateService: QuestionPlayerStateService;
  let mockResizeEventEmitter = new EventEmitter();
  let explorationSummaryBackendApiService: ExplorationSummaryBackendApiService;
  let mockResultsLoadedEventEmitter = new EventEmitter<boolean>();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModule],
      declarations: [
        ExplorationFooterComponent,
        MockTranslatePipe,
        LimitToPipe
      ],
      providers: [QuestionPlayerStateService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    contextService = TestBed.inject(ContextService);
    urlService = TestBed.inject(UrlService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    explorationSummaryBackendApiService = TestBed.inject(
      ExplorationSummaryBackendApiService);
    questionPlayerStateService = TestBed.inject(
      QuestionPlayerStateService);
    fixture = TestBed.createComponent(ExplorationFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialise component when user opens exploration ' +
  'player', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(urlService, 'isIframed').and.returnValue(true);
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      mockResizeEventEmitter);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(contextService, 'getQuestionPlayerIsManuallySet').and
      .returnValue(true);
    spyOn(
      explorationSummaryBackendApiService,
      'loadPublicAndPrivateExplorationSummariesAsync').and.resolveTo({
      summaries: [
        {
          category: 'Coding',
          community_owned: true,
          thumbnail_bg_color: '#a33f40',
          title: 'Project Euler Problem 1',
          num_views: 263,
          tags: [],
          human_readable_contributors_summary: {
            contributor_1: {
              num_commits: 1
            },
            contributor_2: {
              num_commits: 3
            },
            contributor_3: {
              num_commits: 2
            }
          },
          status: 'public',
          language_code: 'en',
          objective: 'Solve problem 1 on the Project Euler site',
          thumbnail_icon_url: '/subjects/Lightbulb.svg',
          id: 'exp1',
        } as unknown as ExplorationSummaryDict
      ]
    });

    component.ngOnInit();
    tick();

    expect(component.explorationId).toBe('exp1');
    expect(component.iframed).toBeTrue();
    expect(component.windowIsNarrow).toBeFalse();
    expect(
      explorationSummaryBackendApiService.
        loadPublicAndPrivateExplorationSummariesAsync)
      .toHaveBeenCalledWith(['exp1']);
    expect(component.contributorNames).toEqual([
      'contributor_2', 'contributor_3', 'contributor_1']);
  }));

  it('should not show hints after user finishes practice session' +
  ' and results are loadeed.', () => {
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    expect(component.hintsAndSolutionsAreSupported).toBeTrue();

    spyOnProperty(questionPlayerStateService, 'resultsPageIsLoadedEventEmitter')
      .and.returnValue(mockResultsLoadedEventEmitter);

    component.ngOnInit();
    mockResultsLoadedEventEmitter.emit(true);

    expect(component.hintsAndSolutionsAreSupported).toBeFalse();
  });

  it('should show hints when initialized in question player when user is' +
  ' going through the practice session and should add subscription.', () => {
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(
      questionPlayerStateService.resultsPageIsLoadedEventEmitter, 'subscribe');

    component.ngOnInit();

    expect(component.hintsAndSolutionsAreSupported).toBeTrue();
    expect(questionPlayerStateService.resultsPageIsLoadedEventEmitter.subscribe)
      .toHaveBeenCalled();
  });

  it('should check if window is narrow when user resizes window', () => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(urlService, 'isIframed').and.returnValue(true);
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      mockResizeEventEmitter);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(contextService, 'getQuestionPlayerIsManuallySet').and
      .returnValue(false);
    component.windowIsNarrow = true;

    component.ngOnInit();
    mockResizeEventEmitter.emit();

    expect(component.windowIsNarrow).toBeFalse();
  });

  it('should not display author names when exploration is in question' +
  ' player mode', () => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(urlService, 'isIframed').and.returnValue(true);
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      mockResizeEventEmitter);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(contextService, 'getQuestionPlayerIsManuallySet').and
      .returnValue(false);
    spyOn(
      explorationSummaryBackendApiService,
      'loadPublicAndPrivateExplorationSummariesAsync');

    component.ngOnInit();

    expect(
      explorationSummaryBackendApiService.
        loadPublicAndPrivateExplorationSummariesAsync).not.toHaveBeenCalled();
  });
});
