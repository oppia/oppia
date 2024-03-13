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
 * @fileoverview Unit tests for the topics and skills dashboard component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {TopicCreationService} from 'components/entity-creation-services/topic-creation.service';
import {SkillSummary} from 'domain/skill/skill-summary.model';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {TopicsAndSkillsDashboardBackendApiService} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {TopicsAndSkillsDashboardFilter} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-filter.model';
import {CreateNewSkillModalService} from 'pages/topic-editor-page/services/create-new-skill-modal.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {TopicsAndSkillsDashboardPageComponent} from './topics-and-skills-dashboard-page.component';
import {TopicsAndSkillsDashboardPageService} from './topics-and-skills-dashboard-page.service';
import {PlatformFeatureService} from '../../services/platform-feature.service';
import {
  ETopicPublishedOptions,
  ETopicStatusOptions,
  TopicsAndSkillsDashboardPageConstants,
} from './topics-and-skills-dashboard-page.constants';

/**
 * @fileoverview Unit tests for the topics and skills dashboard component.
 */

class MockPlatformFeatureService {
  status = {
    SerialChapterLaunchCurriculumAdminView: {
      isEnabled: false,
    },
  };
}

describe('Topics and skills dashboard page component', () => {
  let fixture: ComponentFixture<TopicsAndSkillsDashboardPageComponent>;
  let componentInstance: TopicsAndSkillsDashboardPageComponent;
  let windowDimensionsService: WindowDimensionsService;
  let topicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService;
  let focusManagerService: FocusManagerService;
  let topicCreationService: TopicCreationService;
  let createNewSkillModalService: CreateNewSkillModalService;
  let topicsAndSkillsDashboardPageService: TopicsAndSkillsDashboardPageService;
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [TopicsAndSkillsDashboardPageComponent, MockTranslatePipe],
      providers: [
        FocusManagerService,
        CreateNewSkillModalService,
        TopicCreationService,
        TopicsAndSkillsDashboardBackendApiService,
        TopicsAndSkillsDashboardPageService,
        WindowDimensionsService,
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicsAndSkillsDashboardPageComponent);
    componentInstance = fixture.componentInstance;
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    topicsAndSkillsDashboardBackendApiService = TestBed.inject(
      TopicsAndSkillsDashboardBackendApiService
    );
    focusManagerService = TestBed.inject(FocusManagerService);
    topicCreationService = TestBed.inject(TopicCreationService);
    createNewSkillModalService = TestBed.inject(CreateNewSkillModalService);
    topicsAndSkillsDashboardPageService = TestBed.inject(
      TopicsAndSkillsDashboardPageService
    );
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', fakeAsync(() => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOn(TopicsAndSkillsDashboardFilter, 'createDefault').and.callThrough();
    spyOn(componentInstance, '_initDashboard');
    componentInstance.ngOnInit();
    topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized.emit(
      true
    );
    tick();
    expect(componentInstance._initDashboard).toHaveBeenCalled();
  }));

  it('should correctly initialize sort and status options list', () => {
    type TopicPublishedOptionsKeys =
      keyof typeof TopicsAndSkillsDashboardPageConstants.TOPIC_PUBLISHED_OPTIONS;
    type TopicSortOptionsKeys =
      keyof typeof TopicsAndSkillsDashboardPageConstants.TOPIC_SORT_OPTIONS;
    type TopicSortingOptionsKeys =
      keyof typeof TopicsAndSkillsDashboardPageConstants.TOPIC_SORTING_OPTIONS;
    type TopicStatusOptionsKeys =
      keyof typeof TopicsAndSkillsDashboardPageConstants.TOPIC_STATUS_OPTIONS;

    mockPlatformFeatureService.status.SerialChapterLaunchCurriculumAdminView.isEnabled =
      false;

    let topicSortOptions: string[] = [];
    for (let key in TopicsAndSkillsDashboardPageConstants.TOPIC_SORT_OPTIONS) {
      topicSortOptions.push(
        TopicsAndSkillsDashboardPageConstants.TOPIC_SORT_OPTIONS[
          key as TopicSortOptionsKeys
        ]
      );
    }
    let topicStatusOptions: (ETopicPublishedOptions | ETopicStatusOptions)[] =
      [];
    for (let key in TopicsAndSkillsDashboardPageConstants.TOPIC_PUBLISHED_OPTIONS) {
      topicStatusOptions.push(
        TopicsAndSkillsDashboardPageConstants.TOPIC_PUBLISHED_OPTIONS[
          key as TopicPublishedOptionsKeys
        ]
      );
    }

    componentInstance.ngOnInit();
    expect(componentInstance.sortOptions).toEqual(topicSortOptions);
    expect(componentInstance.statusOptions).toEqual(topicStatusOptions);

    mockPlatformFeatureService.status.SerialChapterLaunchCurriculumAdminView.isEnabled =
      true;

    topicSortOptions = [];
    for (let key in TopicsAndSkillsDashboardPageConstants.TOPIC_SORTING_OPTIONS) {
      topicSortOptions.push(
        TopicsAndSkillsDashboardPageConstants.TOPIC_SORTING_OPTIONS[
          key as TopicSortingOptionsKeys
        ]
      );
    }
    topicStatusOptions = [];
    for (let key in TopicsAndSkillsDashboardPageConstants.TOPIC_STATUS_OPTIONS) {
      topicStatusOptions.push(
        TopicsAndSkillsDashboardPageConstants.TOPIC_STATUS_OPTIONS[
          key as TopicStatusOptionsKeys
        ]
      );
    }

    componentInstance.ngOnInit();
    expect(componentInstance.sortOptions).toEqual(topicSortOptions);
    expect(componentInstance.statusOptions).toEqual(topicStatusOptions);
  });

  it('should destroy', () => {
    spyOn(componentInstance.directiveSubscriptions, 'unsubscribe');
    componentInstance.ngOnDestroy();
    expect(
      componentInstance.directiveSubscriptions.unsubscribe
    ).toHaveBeenCalled();
  });

  it('should generate numbers till range', () => {
    expect(componentInstance.generateNumbersTillRange(4)).toEqual([0, 1, 2, 3]);
  });

  it('should check whether next skill page is present', () => {
    for (let i = 0; i < 10; i++) {
      componentInstance.skillSummaries.push(
        new SkillSummary('', '', '', 1, 2, 3, 4, 5)
      );
    }
    componentInstance.skillPageNumber = 0;
    componentInstance.itemsPerPage = 4;
    expect(componentInstance.isNextSkillPagePresent()).toBeTrue();
    componentInstance.itemsPerPage = 11;
    expect(componentInstance.isNextSkillPagePresent()).toBeFalse();
  });

  it('should set topic tab as active tab', () => {
    componentInstance.filterObject = {
      reset: () => {},
    } as TopicsAndSkillsDashboardFilter;
    spyOn(componentInstance.filterObject, 'reset');
    spyOn(componentInstance, 'goToPageNumber');
    spyOn(focusManagerService, 'setFocus');
    componentInstance.setActiveTab(componentInstance.TAB_NAME_TOPICS);
    expect(componentInstance.filterObject.reset).toHaveBeenCalled();
    expect(componentInstance.goToPageNumber).toHaveBeenCalled();
    expect(focusManagerService.setFocus).toHaveBeenCalledWith('createTopicBtn');
  });

  it('should set skills tab as active tab', () => {
    componentInstance.filterObject = {
      reset: () => {},
    } as TopicsAndSkillsDashboardFilter;
    spyOn(componentInstance.filterObject, 'reset');
    spyOn(componentInstance, 'initSkillDashboard');
    spyOn(focusManagerService, 'setFocus');
    componentInstance.setActiveTab(componentInstance.TAB_NAME_SKILLS);
    expect(componentInstance.filterObject.reset).toHaveBeenCalled();
    expect(componentInstance.initSkillDashboard).toHaveBeenCalled();
    expect(focusManagerService.setFocus).toHaveBeenCalledWith('createSkillBtn');
  });

  it('should intialize skill dashboard', () => {
    spyOn(componentInstance, 'applyFilters');
    componentInstance.initSkillDashboard();
    expect(componentInstance.moreSkillsPresent).toBeTrue();
    expect(componentInstance.firstTimeFetchingSkills).toBeTrue();
    expect(componentInstance.applyFilters).toHaveBeenCalledWith();
  });

  it('should create new topic', () => {
    spyOn(topicCreationService, 'createNewTopic');
    componentInstance.createTopic();
    expect(topicCreationService.createNewTopic).toHaveBeenCalled();
  });

  it('should create skill', () => {
    spyOn(createNewSkillModalService, 'createNewSkill');
    componentInstance.createSkill();
    expect(createNewSkillModalService.createNewSkill).toHaveBeenCalled();
  });

  it('should jump tab to given page number', () => {
    componentInstance.activeTab = componentInstance.TAB_NAME_TOPICS;
    for (let i = 0; i < 20; i++) {
      componentInstance.topicSummaries.push(
        new CreatorTopicSummary(
          '',
          '',
          2,
          2,
          2,
          2,
          2,
          '',
          '',
          2,
          2,
          2,
          2,
          true,
          true,
          '',
          '',
          '',
          '',
          1,
          1,
          [5, 4],
          [3, 4]
        )
      );
    }
    componentInstance.pageNumber = 1;
    componentInstance.itemsPerPage = 4;
    componentInstance.goToPageNumber(2);
    expect(componentInstance.displayedTopicSummaries.length).toEqual(4);

    componentInstance.activeTab = componentInstance.TAB_NAME_SKILLS;
    for (let i = 0; i < 10; i++) {
      componentInstance.skillSummaries.push(
        new SkillSummary('', '', '', 1, 2, 3, 4, 5)
      );
    }
    componentInstance.pageNumber = 1;
    componentInstance.itemsPerPage = 2;
    componentInstance.goToPageNumber(2);
    expect(componentInstance.displayedSkillSummaries.length).toEqual(2);
  });

  it('should fetch skills', fakeAsync(() => {
    componentInstance.moreSkillsPresent = true;
    componentInstance.firstTimeFetchingSkills = true;

    const resp = {
      skillSummaries: [],
      nextCursor: '',
      more: true,
    };
    spyOn(
      topicsAndSkillsDashboardBackendApiService,
      'fetchSkillsDashboardDataAsync'
    ).and.returnValue(Promise.resolve(resp));
    spyOn(componentInstance, 'goToPageNumber');

    componentInstance.fetchSkills();
    tick();
    expect(componentInstance.moreSkillsPresent).toEqual(resp.more);
    expect(componentInstance.nextCursor).toEqual(resp.nextCursor);
    expect(componentInstance.currentCount).toEqual(
      componentInstance.skillSummaries.length
    );
    expect(componentInstance.goToPageNumber).toHaveBeenCalledWith(0);
    expect(componentInstance.firstTimeFetchingSkills).toBeFalse();
    componentInstance.fetchSkills();
    tick();
    expect(componentInstance.goToPageNumber).toHaveBeenCalledWith(
      componentInstance.pageNumber + 1
    );
    componentInstance.skillPageNumber = 1;
    componentInstance.itemsPerPage = 1;
    componentInstance.moreSkillsPresent = false;
    for (let i = 0; i < 5; i++) {
      componentInstance.skillSummaries.push(
        new SkillSummary('', '', '', 1, 2, 3, 4, 5)
      );
    }
    componentInstance.fetchSkills();
    expect(componentInstance.goToPageNumber).toHaveBeenCalledWith(
      componentInstance.pageNumber + 1
    );
  }));

  it('should apply filters', () => {
    // Skills tab.
    componentInstance.activeTab = componentInstance.TAB_NAME_SKILLS;
    spyOn(componentInstance, 'fetchSkills');
    componentInstance.applyFilters();
    expect(componentInstance.fetchSkills).toHaveBeenCalled();

    // Topics tab.
    componentInstance.activeTab = componentInstance.TAB_NAME_TOPICS;
    spyOn(
      topicsAndSkillsDashboardPageService,
      'getFilteredTopics'
    ).and.returnValue([]);
    spyOn(componentInstance, 'goToPageNumber');
    componentInstance.applyFilters();
    expect(componentInstance.goToPageNumber).toHaveBeenCalledWith(0);
  });

  it('should reset filters', () => {
    componentInstance.filterObject = {
      reset: () => {},
    } as TopicsAndSkillsDashboardFilter;
    spyOn(componentInstance, 'getUpperLimitValueForPagination');
    spyOn(componentInstance.filterObject, 'reset');
    spyOn(componentInstance, 'applyFilters');
    componentInstance.resetFilters();
    expect(
      componentInstance.getUpperLimitValueForPagination
    ).toHaveBeenCalled();
    expect(componentInstance.filterObject.reset).toHaveBeenCalled();
    expect(componentInstance.applyFilters).toHaveBeenCalled();
  });

  it('should toggle filter box', () => {
    componentInstance.filterBoxIsShown = false;
    componentInstance.toggleFilterBox();
    expect(componentInstance.filterBoxIsShown).toBeTrue();
    componentInstance.toggleFilterBox();
    expect(componentInstance.filterBoxIsShown).toBeFalse();
  });

  it('should display filter box on maximizing the window', () => {
    componentInstance.filterBoxIsShown = false;

    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOnProperty(window, 'innerWidth').and.returnValue(1024);

    componentInstance.filterBoxOnResize();

    expect(componentInstance.filterBoxIsShown).toBeTrue();
  });

  it('should hide filter box on minimizing the window', () => {
    componentInstance.filterBoxIsShown = true;

    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOnProperty(window, 'innerWidth').and.returnValue(768);

    componentInstance.filterBoxOnResize();

    expect(componentInstance.filterBoxIsShown).toBeFalse();
  });

  it('should get upper limit value for pagination', () => {
    componentInstance.pageNumber = 2;
    componentInstance.itemsPerPage = 2;
    componentInstance.currentCount = 0;
    expect(componentInstance.getUpperLimitValueForPagination()).toEqual(0);
  });

  it('should get total count value for skills', () => {
    componentInstance.skillSummaries = [
      new SkillSummary('', '', '', 2, 3, 4, 6, 7),
    ];
    componentInstance.itemsPerPage = 0;
    expect(componentInstance.getTotalCountValueForSkills()).toEqual('many');
    componentInstance.itemsPerPage = 2;
    expect(componentInstance.getTotalCountValueForSkills()).toEqual(1);
  });

  it('should refresh pagination', () => {
    spyOn(componentInstance, 'goToPageNumber');
    componentInstance.refreshPagination();
    expect(componentInstance.goToPageNumber).toHaveBeenCalledWith(0);
  });

  it('should initialize topics and skills dashboard', fakeAsync(() => {
    spyOn(
      topicsAndSkillsDashboardBackendApiService,
      'fetchDashboardDataAsync'
    ).and.returnValues(
      Promise.resolve({
        allClassroomNames: ['math'],
        canDeleteSkill: true,
        canDeleteTopic: true,
        canCreateTopic: true,
        canCreateSkill: true,
        untriagedSkillSummaries: [],
        mergeableSkillSummaries: [],
        totalSkillCount: 5,
        topicSummaries: [
          new CreatorTopicSummary(
            '',
            '',
            2,
            2,
            2,
            2,
            2,
            '',
            '',
            1,
            1,
            2,
            3,
            true,
            true,
            '',
            '',
            '',
            '',
            1,
            1,
            [5, 4],
            [3, 4]
          ),
        ],
        categorizedSkillsDict: {},
      }),
      Promise.resolve({
        allClassroomNames: ['math'],
        canDeleteSkill: true,
        canDeleteTopic: true,
        canCreateTopic: true,
        canCreateSkill: true,
        untriagedSkillSummaries: [new SkillSummary('', '', '', 2, 3, 4, 5, 6)],
        mergeableSkillSummaries: [],
        totalSkillCount: 5,
        topicSummaries: [],
        categorizedSkillsDict: {},
      })
    );
    spyOn(componentInstance, 'applyFilters');
    spyOn(focusManagerService, 'setFocus');
    spyOn(componentInstance, 'initSkillDashboard');
    componentInstance._initDashboard(false);
    tick();
    componentInstance._initDashboard(false);
    tick();
  }));

  it('should navigate to skill page', () => {
    componentInstance.fetchSkillsDebounced = () => {};
    spyOn(componentInstance, 'isNextSkillPagePresent').and.returnValues(
      true,
      false
    );
    spyOn(componentInstance, 'goToPageNumber');
    spyOn(componentInstance, 'fetchSkillsDebounced');
    componentInstance.navigateSkillPage(componentInstance.MOVE_TO_NEXT_PAGE);
    expect(componentInstance.goToPageNumber).toHaveBeenCalledWith(
      componentInstance.pageNumber + 1
    );
    componentInstance.navigateSkillPage(componentInstance.MOVE_TO_NEXT_PAGE);
    expect(componentInstance.fetchSkillsDebounced).toHaveBeenCalled();
    componentInstance.pageNumber = 5;
    componentInstance.navigateSkillPage('not next page');
    expect(componentInstance.goToPageNumber).toHaveBeenCalled();
  });

  it('should change page by one', () => {
    componentInstance.currentCount = 20;
    componentInstance.itemsPerPage = 5;
    componentInstance.pageNumber = 2;
    spyOn(componentInstance, 'goToPageNumber');
    componentInstance.changePageByOne(componentInstance.MOVE_TO_PREV_PAGE);
    expect(componentInstance.goToPageNumber).toHaveBeenCalledWith(
      componentInstance.pageNumber - 1
    );
    componentInstance.pageNumber = 1;
    componentInstance.changePageByOne(componentInstance.MOVE_TO_NEXT_PAGE);
    expect(componentInstance.goToPageNumber).toHaveBeenCalledWith(
      componentInstance.pageNumber + 1
    );
  });
});
