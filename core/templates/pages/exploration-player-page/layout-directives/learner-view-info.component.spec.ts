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
 * @fileoverview Unit tests for learner view info component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContextService } from 'services/context.service';
import { LoggerService } from 'services/contextual/logger.service';
import { UrlService } from 'services/contextual/url.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { LearnerViewInfoBackendApiService } from '../services/learner-view-info-backend-api.service';
import { StatsReportingService } from '../services/stats-reporting.service';
import { LearnerViewInfoComponent } from './learner-view-info.component';

describe('Learner view info component', () => {
  let fixture: ComponentFixture<LearnerViewInfoComponent>;
  let componentInstance: LearnerViewInfoComponent;
  let contextService: ContextService;
  let learnerViewInfoBackendApiService: LearnerViewInfoBackendApiService;
  let loggerService: LoggerService;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let siteAnalyticsService: SiteAnalyticsService;
  let statsReportingService: StatsReportingService;
  let urlInterpolationService: UrlInterpolationService;
  let urlService: UrlService;
  let storyViewerBackendApiService: StoryViewerBackendApiService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        LearnerViewInfoComponent,
        MockTranslatePipe
      ],
      providers: [
        NgbModal,
        ContextService,
        LearnerViewInfoBackendApiService,
        LoggerService,
        ReadOnlyExplorationBackendApiService,
        SiteAnalyticsService,
        StatsReportingService,
        UrlInterpolationService,
        UrlService,
        StoryViewerBackendApiService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerViewInfoComponent);
    componentInstance = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    learnerViewInfoBackendApiService = TestBed.inject(
      LearnerViewInfoBackendApiService);
    loggerService = TestBed.inject(LoggerService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    statsReportingService = TestBed.inject(StatsReportingService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    urlService = TestBed.inject(UrlService);
    storyViewerBackendApiService = TestBed.inject(StoryViewerBackendApiService);
  });

  afterEach(() => {
    componentInstance.ngOnDestory();
  });

  it('should initialize when component loads into view', fakeAsync(() => {
    let explorationId = 'expId';
    let explorationTitle = 'Exploration Title';
    let topicUrl = 'topic_url';

    spyOn(urlService, 'getPathname').and.returnValue('/explore/');
    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    spyOn(readOnlyExplorationBackendApiService, 'fetchExplorationAsync')
      .and.returnValue(Promise.resolve({
        exploration: {
          title: explorationTitle
        }
      } as FetchExplorationBackendResponse));
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(componentInstance, 'getTopicUrl').and.returnValue(topicUrl);
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('');
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(new StoryPlaythrough('', [], '', '', '', '')));
    spyOn(statsReportingService, 'setTopicName');
    spyOn(siteAnalyticsService, 'registerCuratedLessonStarted');

    componentInstance.ngOnInit();
    tick();
    tick();

    expect(urlService.getPathname).toHaveBeenCalled();
    expect(contextService.getExplorationId).toHaveBeenCalled();
    expect(readOnlyExplorationBackendApiService.fetchExplorationAsync)
      .toHaveBeenCalled();
    expect(urlService.getExplorationVersionFromUrl).toHaveBeenCalled();
    expect(componentInstance.getTopicUrl).toHaveBeenCalled();
    expect(urlService.getTopicUrlFragmentFromLearnerUrl).toHaveBeenCalled();
    expect(urlService.getStoryUrlFragmentFromLearnerUrl).toHaveBeenCalled();
    expect(storyViewerBackendApiService.fetchStoryDataAsync).toHaveBeenCalled();
    expect(statsReportingService.setTopicName).toHaveBeenCalled();
    expect(siteAnalyticsService.registerCuratedLessonStarted)
      .toHaveBeenCalled();
  }));

  it('should get topic url from fragment correctly', () => {
    let topicUrl = 'topic_url';

    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic_url_fragment');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroom_url_fragment');
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(topicUrl);

    expect(componentInstance.getTopicUrl()).toEqual(topicUrl);
  });

  it('should invoke information card modal', () => {
    let ngbModal = TestBed.inject(NgbModal);

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        expInfo: null
      },
      result: {
        then: (successCallback: () => void, errorCallback: () => void) => {
          successCallback();
          errorCallback();
        }
      }
    } as NgbModalRef);

    componentInstance.openInformationCardModal();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should display information card', fakeAsync(() => {
    let explorationId = 'expId';
    componentInstance.explorationId = explorationId;
    componentInstance.expInfo = {} as LearnerExplorationSummaryBackendDict;

    spyOn(componentInstance, 'openInformationCardModal');
    componentInstance.showInformationCard();
    spyOn(learnerViewInfoBackendApiService, 'fetchLearnerInfoAsync')
      .and.returnValue(Promise.resolve({
        summaries: []
      }));

    expect(componentInstance.openInformationCardModal).toHaveBeenCalled();
    componentInstance.expInfo = null;

    componentInstance.showInformationCard();
    tick();

    expect(learnerViewInfoBackendApiService.fetchLearnerInfoAsync)
      .toHaveBeenCalled();
  }));

  it('should handle error if backend call fails', fakeAsync(() => {
    let explorationId = 'expId';
    componentInstance.explorationId = explorationId;
    componentInstance.expInfo = null;

    spyOn(learnerViewInfoBackendApiService, 'fetchLearnerInfoAsync')
      .and.returnValue(Promise.reject());
    spyOn(loggerService, 'error');

    componentInstance.showInformationCard();
    tick();

    expect(loggerService.error).toHaveBeenCalled();
  }));
});
