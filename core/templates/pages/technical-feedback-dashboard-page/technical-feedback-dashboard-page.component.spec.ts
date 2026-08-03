// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TechnicalFeedbackDashboardPageComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {TechnicalFeedbackDashboardPageComponent} from './technical-feedback-dashboard-page.component';
import {TechnicalFeedbackDashboardPageModule} from './technical-feedback-dashboard-page.module';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {RouterTestingModule} from '@angular/router/testing';
import {
  TechnicalTeamType,
  FeedbackFilterState,
  FeedbackStatus,
  PlatformFeedbackDetailResponse,
  PlatformFeedbackSummary,
} from 'domain/feedback/feedback.model';
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  Router,
} from '@angular/router';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {Location} from '@angular/common';
import {AppConstants} from 'app.constants';
import {BehaviorSubject} from 'rxjs';
import {AlertsService} from 'services/alerts.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ReportType} from '../../domain/feedback/feedback.model';

describe('TechnicalFeedbackDashboardPageComponent', () => {
  let component: TechnicalFeedbackDashboardPageComponent;
  let fixture: ComponentFixture<TechnicalFeedbackDashboardPageComponent>;
  let router: Router;
  let alertsService: AlertsService;
  let feedbackBackendApiService: FeedbackBackendApiService;
  let assetsBackendApiService: AssetsBackendApiService;
  let windowRef: WindowRef;
  let currentFilterState: FeedbackFilterState;
  let navigateSpy: jasmine.Spy;
  let fetchFeedbackListSpy: jasmine.Spy;
  let fetchFeedbackDetailSpy: jasmine.Spy;
  let updateFeedbackStatusSpy: jasmine.Spy;
  let paramMapSubject: BehaviorSubject<ParamMap>;
  let mockDetailResponse: PlatformFeedbackDetailResponse = {
    id: 'report1',
    report_message: 'Sample report',
    source: ReportType.APP,
    status: FeedbackStatus.OPEN,
    platform: 'web',
    destination_dashboard: TechnicalTeamType.TECH_EXTERNAL,
    page_url: '/learn/math',
    category: null,
    lesson_metadata: null,
    include_technical_logs: false,
    session_info: null,
    screenshot_filename: null,
    screenshot_entity_id: null,
    created_on_msecs: 1234567890,
  };

  const createFeedbackSummary = (
    id: string,
    reportMessagePreview: string
  ): PlatformFeedbackSummary => ({
    id,
    report_message_preview: reportMessagePreview,
    status: FeedbackStatus.OPEN,
    source: 'platform',
    category: null,
  });

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({}));
    await TestBed.configureTestingModule({
      imports: [
        TechnicalFeedbackDashboardPageModule,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      declarations: [MockTranslatePipe],
      providers: [
        {
          provide: Location,
          useValue: jasmine.createSpyObj('Location', ['replaceState']),
        },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TechnicalFeedbackDashboardPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    alertsService = TestBed.inject(AlertsService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    feedbackBackendApiService = TestBed.inject(FeedbackBackendApiService);
    windowRef = TestBed.inject(WindowRef);

    currentFilterState = {
      searchText: '',
      status: FeedbackStatus.OPEN,
      technicalTeam: TechnicalTeamType.TECH_EXTERNAL,
      dateRange: {
        start: null,
        end: null,
      },
    };

    navigateSpy = spyOn(router, 'navigateByUrl');

    fetchFeedbackListSpy = spyOn(
      feedbackBackendApiService,
      'fetchTechnicalDashboardFeedbackListAsync'
    ).and.returnValue(
      Promise.resolve({
        summaries: [],
        next_cursor: null,
        more: false,
      })
    );

    fetchFeedbackDetailSpy = spyOn(
      feedbackBackendApiService,
      'fetchPlatformFeedbackDetailAsync'
    ).and.returnValue(Promise.resolve(mockDetailResponse));

    updateFeedbackStatusSpy = spyOn(
      feedbackBackendApiService,
      'updatePlatformFeedbackStatusAsync'
    ).and.returnValue(Promise.resolve({success: true}));
  });

  it('should create the component instance', () => {
    component.ngOnInit();
    expect(component instanceof TechnicalFeedbackDashboardPageComponent).toBe(
      true
    );
  });

  it('should navigate back to technical dashboard', () => {
    component.ngOnInit();
    navigateSpy.and.returnValue(Promise.resolve(true));
    component.navigateBackToDashboard();

    expect(navigateSpy).toHaveBeenCalledWith(
      '/' +
        AppConstants.PAGES_REGISTERED_WITH_FRONTEND.TECHNICAL_FEEDBACK_DASHBOARD
          .ROUTE
    );
  });

  it('should navigate to feedback detail page', () => {
    component.ngOnInit();
    navigateSpy.and.returnValue(Promise.resolve(true));
    component.onRowClick('report123');

    expect(navigateSpy).toHaveBeenCalledWith(
      '/' +
        AppConstants.PAGES_REGISTERED_WITH_FRONTEND.TECHNICAL_FEEDBACK_DETAIL.ROUTE.replace(
          ':team',
          TechnicalTeamType.TECH_EXTERNAL
        ).replace(':reportId', encodeURIComponent('report123'))
    );
  });

  it('should not fetch next page when no more feedback is available', () => {
    component.ngOnInit();
    fetchFeedbackListSpy.calls.reset();
    component.moreFeedbackAvailable = false;
    component.nextCursor = null;
    component.onNextPage();
    expect(fetchFeedbackListSpy).not.toHaveBeenCalled();
  });

  it('should not fetch previous page when already on first page', () => {
    component.ngOnInit();
    fetchFeedbackListSpy.calls.reset();
    component.currentPage = 1;
    component.onPreviousPage();
    expect(fetchFeedbackListSpy).not.toHaveBeenCalled();
  });

  it('should fetch feedback when loading dashboard route', async () => {
    component.ngOnInit();

    await fixture.whenStable();

    expect(fetchFeedbackListSpy).toHaveBeenCalledWith(currentFilterState, null);
  });

  it('should fetch feedback when reportId route parameter is missing', async () => {
    paramMapSubject.next(
      convertToParamMap({
        team: TechnicalTeamType.TECH_EXTERNAL,
      })
    );
    component.ngOnInit();

    await fixture.whenStable();

    expect(fetchFeedbackListSpy).toHaveBeenCalledWith(currentFilterState, null);
    expect(fetchFeedbackDetailSpy).not.toHaveBeenCalled();
  });

  it('should filter newly loaded feedback by search text', async () => {
    fetchFeedbackListSpy.and.returnValue(
      Promise.resolve({
        summaries: [
          createFeedbackSummary('1', 'Angular bug'),
          createFeedbackSummary('2', 'React issue'),
        ],
        next_cursor: null,
        more: false,
      })
    );

    currentFilterState.searchText = 'angular';
    component.onFilterChange(currentFilterState);
    await fixture.whenStable();

    expect(component.displayedFeedbackSummaries.length).toBe(1);
    expect(component.displayedFeedbackSummaries[0].report_message_preview).toBe(
      'Angular bug'
    );
  });

  it('should filter already loaded feedback by search text', async () => {
    component.ngOnInit();

    fetchFeedbackListSpy.and.returnValue(
      Promise.resolve({
        summaries: [
          createFeedbackSummary('1', 'Angular bug'),
          createFeedbackSummary('2', 'React issue'),
        ],
        next_cursor: null,
        more: false,
      })
    );

    component.onFilterChange(currentFilterState);
    await fixture.whenStable();

    fetchFeedbackListSpy.calls.reset();

    currentFilterState.searchText = 'angular';
    component.onFilterChange(currentFilterState);

    expect(fetchFeedbackListSpy).not.toHaveBeenCalled();
    expect(component.displayedFeedbackSummaries.length).toBe(1);
    expect(component.displayedFeedbackSummaries[0].report_message_preview).toBe(
      'Angular bug'
    );
  });

  it('should display all feedback when search text is empty', async () => {
    fetchFeedbackListSpy.and.returnValue(
      Promise.resolve({
        summaries: [
          createFeedbackSummary('1', 'Angular bug'),
          createFeedbackSummary('2', 'React issue'),
        ],
        next_cursor: null,
        more: false,
      })
    );

    currentFilterState.searchText = '';
    component.onFilterChange(currentFilterState);
    await fixture.whenStable();

    expect(component.displayedFeedbackSummaries.length).toBe(2);
  });

  it('should display all feedback when search text is null', async () => {
    fetchFeedbackListSpy.and.returnValue(
      Promise.resolve({
        summaries: [
          createFeedbackSummary('1', 'Angular bug'),
          createFeedbackSummary('2', 'React issue'),
        ],
        next_cursor: null,
        more: false,
      })
    );

    currentFilterState.searchText = null;
    component.onFilterChange(currentFilterState);
    await fixture.whenStable();

    expect(component.displayedFeedbackSummaries.length).toBe(2);
  });

  it('should fetch feedback again when server filters change', async () => {
    component.onFilterChange({
      ...currentFilterState,
      dateRange: {
        start: new Date(2026, 0, 1),
        end: new Date(2026, 0, 31),
      },
    });
    await fixture.whenStable();

    fetchFeedbackListSpy.calls.reset();
    const updatedFilterState: FeedbackFilterState = {
      ...currentFilterState,
      status: FeedbackStatus.FIXED,
      dateRange: {
        start: new Date(2026, 0, 1),
        end: new Date(2026, 0, 31),
      },
    };

    component.onFilterChange(updatedFilterState);
    await fixture.whenStable();

    expect(fetchFeedbackListSpy).toHaveBeenCalledWith(updatedFilterState, null);
    expect(component.currentPage).toBe(1);
    expect(component.cursorHistory).toEqual([null]);
  });

  it('should fetch next page', async () => {
    fetchFeedbackListSpy.and.returnValue(
      Promise.resolve({
        summaries: [createFeedbackSummary('2', 'Second page issue')],
        next_cursor: 'cursor2',
        more: true,
      })
    );
    component.ngOnInit();
    component.currentPage = 1;
    component.moreFeedbackAvailable = true;
    component.nextCursor = 'cursor1';
    component.onNextPage();
    await fixture.whenStable();

    expect(fetchFeedbackListSpy).toHaveBeenCalledWith(
      currentFilterState,
      'cursor1'
    );
    expect(component.currentPage).toBe(2);
    expect(component.cursorHistory).toEqual([null, 'cursor1']);
    expect(component.nextCursor).toBe('cursor2');
    expect(component.moreFeedbackAvailable).toBe(true);
    expect(component.displayedFeedbackSummaries).toEqual([
      createFeedbackSummary('2', 'Second page issue'),
    ]);
  });

  it('should not duplicate cursor history when revisiting a loaded page', async () => {
    fetchFeedbackListSpy.and.returnValue(
      Promise.resolve({
        summaries: [],
        next_cursor: null,
        more: false,
      })
    );
    component.ngOnInit();
    component.currentPage = 1;
    component.moreFeedbackAvailable = true;
    component.nextCursor = 'cursor1';
    component.cursorHistory = [null, 'cursor1'];

    component.onNextPage();
    await fixture.whenStable();

    expect(component.cursorHistory).toEqual([null, 'cursor1']);
  });

  it('should not fetch next page when cursor is missing', () => {
    component.ngOnInit();
    fetchFeedbackListSpy.calls.reset();
    component.moreFeedbackAvailable = true;
    component.nextCursor = null;
    component.onNextPage();

    expect(fetchFeedbackListSpy).not.toHaveBeenCalled();
  });

  it('should fetch previous page', async () => {
    fetchFeedbackListSpy.and.returnValue(
      Promise.resolve({
        summaries: [createFeedbackSummary('1', 'First page issue')],
        next_cursor: 'cursor1',
        more: false,
      })
    );
    component.ngOnInit();
    component.currentPage = 2;
    component.cursorHistory = [null, 'cursor1'];
    component.onPreviousPage();
    await fixture.whenStable();

    expect(fetchFeedbackListSpy).toHaveBeenCalledWith(currentFilterState, null);
    expect(component.currentPage).toBe(1);
    expect(component.displayedFeedbackSummaries).toEqual([
      createFeedbackSummary('1', 'First page issue'),
    ]);
  });

  it('should load feedback details when team and reportId are present and response contains screenshot', async () => {
    const responseWithScreenshot: PlatformFeedbackDetailResponse = {
      ...mockDetailResponse,
      screenshot_filename: 'screenshot',
      screenshot_entity_id: 'screenshot_id',
    };
    const getImageUrlForPreviewSpy = spyOn(
      assetsBackendApiService,
      'getImageUrlForPreview'
    ).and.returnValue('screenshot_url');
    fetchFeedbackDetailSpy.and.returnValue(
      Promise.resolve(responseWithScreenshot)
    );

    paramMapSubject.next(
      convertToParamMap({
        team: TechnicalTeamType.TECH_EXTERNAL,
        reportId: 'report1',
      })
    );

    component.ngOnInit();
    await fixture.whenStable();

    expect(fetchFeedbackDetailSpy).toHaveBeenCalledWith(
      'technical',
      TechnicalTeamType.TECH_EXTERNAL,
      'report1'
    );
    expect(getImageUrlForPreviewSpy).toHaveBeenCalledWith(
      AppConstants.ENTITY_TYPE.FEEDBACK,
      'screenshot_id',
      'screenshot'
    );
    expect(component.feedbackDetailResponse).toEqual(responseWithScreenshot);
    expect(component.screenshotDataUrl).toBe('screenshot_url');
  });

  it('should not load screenshot when screenshot metadata is incomplete', async () => {
    const getImageUrlForPreviewSpy = spyOn(
      assetsBackendApiService,
      'getImageUrlForPreview'
    ).and.returnValue('screenshot_url');
    fetchFeedbackDetailSpy.and.returnValue(
      Promise.resolve({
        ...mockDetailResponse,
        screenshot_filename: 'screenshot',
        screenshot_entity_id: null,
      })
    );
    paramMapSubject.next(
      convertToParamMap({
        team: TechnicalTeamType.TECH_EXTERNAL,
        reportId: 'report1',
      })
    );

    component.ngOnInit();
    await fixture.whenStable();

    expect(getImageUrlForPreviewSpy).not.toHaveBeenCalled();
    expect(component.screenshotDataUrl).toBeNull();
  });

  it('should update feedback status locally after saving it', async () => {
    const addSuccessMessageSpy = spyOn(
      alertsService,
      'addSuccessMessage'
    ).and.stub();

    paramMapSubject.next(
      convertToParamMap({
        team: TechnicalTeamType.TECH_INTERNAL,
        reportId: 'report1',
      })
    );

    component.ngOnInit();
    await fixture.whenStable();

    component.onStatusChange(FeedbackStatus.FIXED);
    await fixture.whenStable();

    expect(updateFeedbackStatusSpy).toHaveBeenCalledWith(
      'technical',
      TechnicalTeamType.TECH_INTERNAL,
      'report1',
      FeedbackStatus.FIXED
    );
    expect(component.feedbackDetailResponse?.status).toBe(FeedbackStatus.FIXED);
    expect(addSuccessMessageSpy).toHaveBeenCalledWith(
      `Feedback status updated to ${FeedbackStatus.FIXED}.`,
      7000,
      true
    );
  });

  it('should save status without updating details when details are not loaded', async () => {
    const addSuccessMessageSpy = spyOn(
      alertsService,
      'addSuccessMessage'
    ).and.stub();
    component.selectedTeam = TechnicalTeamType.TECH_INTERNAL;
    component.selectedReportId = 'report1';
    component.feedbackDetailResponse = null;

    component.onStatusChange(FeedbackStatus.NOT_ACTIONABLE);
    await fixture.whenStable();

    expect(updateFeedbackStatusSpy).toHaveBeenCalledWith(
      'technical',
      TechnicalTeamType.TECH_INTERNAL,
      'report1',
      FeedbackStatus.NOT_ACTIONABLE
    );
    expect(component.feedbackDetailResponse).toBeNull();
    expect(addSuccessMessageSpy).toHaveBeenCalledWith(
      `Feedback status updated to ${FeedbackStatus.NOT_ACTIONABLE}.`,
      7000,
      true
    );
  });

  it('should not update status when route parameters are missing', async () => {
    const addSuccessMessageSpy = spyOn(
      alertsService,
      'addSuccessMessage'
    ).and.stub();

    component.onStatusChange(FeedbackStatus.FIXED);
    await fixture.whenStable();

    expect(updateFeedbackStatusSpy).not.toHaveBeenCalled();
    expect(addSuccessMessageSpy).not.toHaveBeenCalled();
  });

  it('should update status before opening transferred GitHub issue', async () => {
    const githubIssueUrl = 'https://github.com/oppia/oppia/issues/new';
    const openSpy = spyOn(windowRef.nativeWindow, 'open').and.stub();
    const addSuccessMessageSpy = spyOn(
      alertsService,
      'addSuccessMessage'
    ).and.stub();

    paramMapSubject.next(
      convertToParamMap({
        team: TechnicalTeamType.TECH_INTERNAL,
        reportId: 'report1',
      })
    );

    component.ngOnInit();
    await fixture.whenStable();

    component.onGithubTransfer(githubIssueUrl);
    expect(openSpy).not.toHaveBeenCalled();
    await fixture.whenStable();
    await Promise.resolve();

    expect(updateFeedbackStatusSpy).toHaveBeenCalledWith(
      'technical',
      TechnicalTeamType.TECH_INTERNAL,
      'report1',
      FeedbackStatus.TRANSFERRED_TO_GITHUB
    );
    expect(component.feedbackDetailResponse?.status).toBe(
      FeedbackStatus.TRANSFERRED_TO_GITHUB
    );
    expect(addSuccessMessageSpy).toHaveBeenCalledWith(
      `Feedback status updated to ${FeedbackStatus.TRANSFERRED_TO_GITHUB}.`,
      7000,
      true
    );
    expect(openSpy).toHaveBeenCalledWith(githubIssueUrl, '_blank', 'noopener');
  });
});
