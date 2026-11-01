// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for new lesson player header component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {Router} from '@angular/router';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from '../../../../domain/exploration/read-only-exploration-backend-api.service';
import {
  ReadOnlyTopicBackendDict,
  ReadOnlyTopic,
} from '../../../../domain/topic_viewer/read-only-topic.model';
import {TopicViewerBackendApiService} from '../../../../domain/topic_viewer/topic-viewer-backend-api.service';
import {UrlInterpolationService} from '../../../../domain/utilities/url-interpolation.service';
import {PageContextService} from '../../../../services/page-context.service';
import {UrlService} from '../../../../services/contextual/url.service';
import {I18nLanguageCodeService} from '../../../../services/i18n-language-code.service';
import {SiteAnalyticsService} from '../../../../services/site-analytics.service';
import {MockTranslatePipe} from '../../../../tests/unit-test-utils';
import {StatsReportingService} from '../../services/stats-reporting.service';
import {PlayerHeaderComponent} from './player-header.component';
import {MobileMenuService} from '../../services/mobile-menu.service';
import {WindowRef} from '../../../../services/contextual/window-ref.service';
import {AccessValidationBackendApiService} from '../../../oppia-root/routing/access-validation-backend-api.service';
import {CapitalizePipe} from '../../../../filters/string-utility-filters/capitalize.pipe';
import {ClassroomBackendApiService} from '../../../../domain/classroom/classroom-backend-api.service';
import {StoryViewerBackendApiService} from '../../../../domain/story_viewer/story-viewer-backend-api.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UserService} from '../../../../services/user.service';
import {PreventPageUnloadEventService} from '../../../../services/prevent-page-unload-event.service';
import {EditableExplorationBackendApiService} from '../../../../domain/exploration/editable-exploration-backend-api.service';
import {LocalStorageService} from '../../../../services/local-storage.service';
import {CheckpointProgressService} from '../../services/checkpoint-progress.service';
import {LessonExitService} from './lesson-exit.service';
import {LessonExitModalComponent} from './lesson-exit-modal.component';

class MockWindowRef {
  nativeWindow = {
    innerWidth: 1024,
    location: {
      pathname: '/explore/expId',
      href: '',
      reload: jasmine.createSpy('reload'),
    },
    confirm: jasmine.createSpy('confirm').and.returnValue(true),
    gtag: jasmine.createSpy('gtag'),
  };

  setPathname(pathname: string): void {
    this.nativeWindow.location.pathname = pathname;
  }
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
  navigateByUrl = jasmine.createSpy('navigateByUrl');
}

class MockUserService {
  isLoggedIn = false;
  username: string | null = null;
  getUserInfoAsync = jasmine.createSpy('getUserInfoAsync').and.callFake(() =>
    Promise.resolve({
      isLoggedIn: () => this.isLoggedIn,
      getUsername: () => this.username,
    })
  );
  getLoginUrlAsync = jasmine
    .createSpy('getLoginUrlAsync')
    .and.returnValue(Promise.resolve('/login?return_url=/lesson/expId'));
}

class MockLessonExitService {
  getExitUrl = jasmine.createSpy('getExitUrl').and.returnValue('/exit-url');
  isExitModalHidden = jasmine
    .createSpy('isExitModalHidden')
    .and.returnValue(false);
  hideExitModal = jasmine.createSpy('hideExitModal');
  saveSignInIntent = jasmine.createSpy('saveSignInIntent');
  clearSignInIntent = jasmine.createSpy('clearSignInIntent');
}

class MockCheckpointProgressService {
  checkpoint: string | null = 'Mid';
  getMostRecentlyReachedCheckpoint = jasmine
    .createSpy('getMostRecentlyReachedCheckpoint')
    .and.callFake(() => {
      if (this.checkpoint === null) {
        throw new Error('Last completed checkpoint is not set.');
      }
      return this.checkpoint;
    });
}

class MockEditableExplorationBackendApiService {
  recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner = jasmine
    .createSpy('recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner')
    .and.returnValue(Promise.resolve({unique_progress_url_id: 'pid123'}));
}

class MockPreventPageUnloadEventService {
  removeListener = jasmine.createSpy('removeListener');
}

class MockAccessValidationBackendApiService {
  validateAccessToClassroomPage = jasmine
    .createSpy('validateAccessToClassroomPage')
    .and.returnValue(Promise.resolve());
}

class MockCapitalizePipe {
  transform = jasmine.createSpy('transform').and.returnValue('Math Classroom');
}

class MockClassroomBackendApiService {
  fetchClassroomDataAsync = jasmine
    .createSpy('fetchClassroomDataAsync')
    .and.returnValue(
      Promise.resolve({
        getName: () => 'math classroom',
      })
    );
}

class MockStoryViewerBackendApiService {
  fetchStoryDataAsync = jasmine
    .createSpy('fetchStoryDataAsync')
    .and.returnValue(
      Promise.resolve({
        getStoryNodes: () => [
          {getExplorationId: () => 'other_exploration'},
          {getExplorationId: () => 'expId'},
        ],
      })
    );
}

describe('Lesson player header component', () => {
  let fixture: ComponentFixture<PlayerHeaderComponent>;
  let componentInstance: PlayerHeaderComponent;
  let pageContextService: PageContextService;
  let readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService;
  let siteAnalyticsService: SiteAnalyticsService;
  let statsReportingService: StatsReportingService;
  let urlService: UrlService;
  let topicViewerBackendApiService: TopicViewerBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let mobileMenuService: MobileMenuService;
  let mockWindowRef: MockWindowRef;
  let router: Router;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let classroomBackendApiService: ClassroomBackendApiService;

  beforeEach(waitForAsync(() => {
    const windowRefInstance = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [PlayerHeaderComponent, MockTranslatePipe],
      providers: [
        PageContextService,
        ReadOnlyExplorationBackendApiService,
        SiteAnalyticsService,
        StatsReportingService,
        UrlInterpolationService,
        UrlService,
        TopicViewerBackendApiService,
        MobileMenuService,
        {provide: WindowRef, useValue: windowRefInstance},
        {provide: Router, useClass: MockRouter},
        {provide: UserService, useClass: MockUserService},
        {provide: LessonExitService, useClass: MockLessonExitService},
        {
          provide: CheckpointProgressService,
          useClass: MockCheckpointProgressService,
        },
        {
          provide: EditableExplorationBackendApiService,
          useClass: MockEditableExplorationBackendApiService,
        },
        {
          provide: PreventPageUnloadEventService,
          useClass: MockPreventPageUnloadEventService,
        },
        {
          provide: AccessValidationBackendApiService,
          useClass: MockAccessValidationBackendApiService,
        },
        {provide: CapitalizePipe, useClass: MockCapitalizePipe},
        {
          provide: ClassroomBackendApiService,
          useClass: MockClassroomBackendApiService,
        },
        {
          provide: StoryViewerBackendApiService,
          useClass: MockStoryViewerBackendApiService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerHeaderComponent);
    componentInstance = fixture.componentInstance;
    pageContextService = TestBed.inject(PageContextService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    );
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    statsReportingService = TestBed.inject(StatsReportingService);
    urlService = TestBed.inject(UrlService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    topicViewerBackendApiService = TestBed.inject(TopicViewerBackendApiService);
    mobileMenuService = TestBed.inject(MobileMenuService);
    mockWindowRef = TestBed.inject(WindowRef) as unknown as MockWindowRef;
    router = TestBed.inject(Router);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);

    spyOn(topicViewerBackendApiService, 'fetchTopicDataAsync').and.resolveTo(
      ReadOnlyTopic.createFromBackendDict({
        subtopics: [],
        skill_descriptions: {},
        uncategorized_skill_ids: [],
        degrees_of_mastery: {},
        canonical_story_dicts: [],
        additional_story_dicts: [],
        topic_name: 'Topic Name 1',
        topic_id: 'topic1',
        topic_description: 'Description',
        practice_tab_is_displayed: false,
        meta_tag_content: 'content',
        page_title_fragment_for_web: 'title',
        classroom_name: 'math',
      } as ReadOnlyTopicBackendDict)
    );

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );

    (router.navigate as jasmine.Spy).calls.reset();
  });

  describe('ngOnInit', () => {
    it('should initialize when component loads into exploration view', fakeAsync(() => {
      let explorationId = 'expId';
      let explorationTitle = 'Exploration Title';

      spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
        false
      );
      spyOn(pageContextService, 'isInQuestionPlayerMode').and.returnValue(
        false
      );
      spyOn(urlService, 'isIframed').and.returnValue(false);
      spyOn(pageContextService, 'getExplorationId').and.returnValue(
        explorationId
      );
      spyOn(
        readOnlyExplorationBackendApiService,
        'fetchExplorationAsync'
      ).and.returnValue(
        Promise.resolve({
          exploration: {
            title: explorationTitle,
          },
        } as FetchExplorationBackendResponse)
      );
      spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
      spyOn(urlService, 'getPidFromUrl').and.returnValue(null);
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        'topic1'
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue('classroom1');
      spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
        'story1'
      );
      spyOn(statsReportingService, 'setTopicName');
      spyOn(siteAnalyticsService, 'registerCuratedLessonStarted');

      componentInstance.ngOnInit();
      tick();

      expect(pageContextService.getExplorationId).toHaveBeenCalled();
      expect(
        readOnlyExplorationBackendApiService.fetchExplorationAsync
      ).toHaveBeenCalled();
      expect(urlService.getExplorationVersionFromUrl).toHaveBeenCalled();
      expect(urlService.getTopicUrlFragmentFromLearnerUrl).toHaveBeenCalled();
      expect(
        topicViewerBackendApiService.fetchTopicDataAsync
      ).toHaveBeenCalled();
      expect(statsReportingService.setTopicName).toHaveBeenCalled();
      expect(
        siteAnalyticsService.registerCuratedLessonStarted
      ).toHaveBeenCalled();
      expect(componentInstance.explorationTitle).toBe(explorationTitle);
      expect(componentInstance.chapterNumber).toBe(2);
    }));

    it('should initialize for diagnostic test page', fakeAsync(() => {
      spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
        true
      );
      spyOn(urlService, 'getUrlParams').and.returnValue({classroom: 'math'});
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        null
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue(null);
      spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
        null
      );

      componentInstance.ngOnInit();
      tick();

      expect(
        accessValidationBackendApiService.validateAccessToClassroomPage
      ).toHaveBeenCalledWith('math');
      expect(
        classroomBackendApiService.fetchClassroomDataAsync
      ).toHaveBeenCalled();
      expect(componentInstance.classroomName).toBe('Math Classroom');
    }));

    it('should initialize for practice page', fakeAsync(() => {
      spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
        false
      );
      spyOn(pageContextService, 'isInQuestionPlayerMode').and.returnValue(true);
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        'topic1'
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue('classroom1');

      componentInstance.ngOnInit();
      tick();

      expect(
        topicViewerBackendApiService.fetchTopicDataAsync
      ).toHaveBeenCalled();
      expect(componentInstance.topicName).toBe('Topic Name 1');
    }));

    it('should throw error when classroom URL fragment is null for diagnostic page', () => {
      spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
        true
      );
      spyOn(urlService, 'getUrlParams').and.returnValue({classroom: null});

      expect(() => componentInstance.ngOnInit()).toThrowError(
        'Classroom URL fragment is null'
      );
    });

    it('should throw error when story URL fragment is null for linked topic', () => {
      spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
        false
      );
      spyOn(pageContextService, 'isInQuestionPlayerMode').and.returnValue(
        false
      );
      spyOn(urlService, 'isIframed').and.returnValue(false);
      spyOn(pageContextService, 'getExplorationId').and.returnValue('expId');

      spyOn(
        readOnlyExplorationBackendApiService,
        'fetchExplorationAsync'
      ).and.returnValue(
        Promise.resolve({
          exploration: {title: 'Test Exploration'},
        } as FetchExplorationBackendResponse)
      );

      spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
      spyOn(urlService, 'getPidFromUrl').and.returnValue(null);
      spyOn(componentInstance, 'getTopicUrl').and.returnValue(true);

      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        'topic1'
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue('classroom1');
      spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
        null
      );

      componentInstance.isLinkedToTopic = true;
      componentInstance.storyUrlFragment = null;

      expect(() => componentInstance.ngOnInit()).toThrowError(
        'Story URL fragment is null'
      );
    });
  });

  it('should register community lesson start event', fakeAsync(() => {
    let explorationId = 'expId';
    let explorationTitle = 'Exploration Title';

    spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
      false
    );
    spyOn(pageContextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(urlService, 'isIframed').and.returnValue(false);
    spyOn(pageContextService, 'getExplorationId').and.returnValue(
      explorationId
    );
    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(
      Promise.resolve({
        exploration: {
          title: explorationTitle,
        },
      } as FetchExplorationBackendResponse)
    );
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(urlService, 'getPidFromUrl').and.returnValue(null);
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      ''
    );
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(statsReportingService, 'setTopicName');
    spyOn(siteAnalyticsService, 'registerCommunityLessonStarted');

    componentInstance.ngOnInit();
    tick();

    expect(
      siteAnalyticsService.registerCommunityLessonStarted
    ).toHaveBeenCalled();
  }));

  describe('getTopicUrl', () => {
    it('should return true when all URL fragments are present', () => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        'topic1'
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue('classroom1');
      spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
        'story1'
      );

      const result = componentInstance.getTopicUrl();

      expect(result).toBe(true);
      expect(componentInstance.topicUrlFragment).toBe('topic1');
      expect(componentInstance.classroomUrlFragment).toBe('classroom1');
      expect(componentInstance.storyUrlFragment).toBe('story1');
    });

    it('should return false when topic URL fragment is missing', () => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        null
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue('classroom1');
      spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
        'story1'
      );

      const result = componentInstance.getTopicUrl();

      expect(result).toBe(false);
    });

    it('should handle exceptions and return false', () => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.throwError(
        'Test error'
      );

      const result = componentInstance.getTopicUrl();

      expect(result).toBe(false);
    });
  });

  describe('getHeaderTitleText', () => {
    it('should return practice session title', () => {
      componentInstance.explorationContext =
        componentInstance.explorationContextConstants.PRACTICE_PAGE;
      componentInstance.topicName = 'Math Topic';

      expect(componentInstance.getHeaderTitleText()).toBe(
        'Practice Session: Math Topic'
      );
    });

    it('should return diagnostic test title', () => {
      componentInstance.explorationContext =
        componentInstance.explorationContextConstants.DIAGNOSTIC_PAGE;
      componentInstance.classroomName = 'Math Classroom';

      expect(componentInstance.getHeaderTitleText()).toBe(
        'Diagnostic Test: Math Classroom'
      );
    });

    it('should return chapter title for linked exploration', () => {
      componentInstance.explorationContext =
        componentInstance.explorationContextConstants.EXPLORATION_PAGE;
      componentInstance.isLinkedToTopic = true;
      componentInstance.chapterNumber = 1;
      componentInstance.explorationTitle = 'Test Exploration';

      expect(componentInstance.getHeaderTitleText()).toBe(
        'Chapter 1: Test Exploration'
      );
    });

    it('should return exploration title for non-linked exploration', () => {
      componentInstance.explorationContext =
        componentInstance.explorationContextConstants.EXPLORATION_PAGE;
      componentInstance.isLinkedToTopic = false;
      componentInstance.explorationTitle = 'Test Exploration';

      expect(componentInstance.getHeaderTitleText()).toBe('Test Exploration');
    });

    it('should return empty string for unknown context', () => {
      (componentInstance as {explorationContext: string}).explorationContext =
        'unknown';

      expect(componentInstance.getHeaderTitleText()).toBe('');
    });
  });

  describe('setPageContext', () => {
    it('should set diagnostic page context', () => {
      spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
        true
      );

      componentInstance.setPageContext();

      expect(componentInstance.explorationContext).toBe('diagnostic');
    });

    it('should set practice page context', () => {
      spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
        false
      );
      spyOn(pageContextService, 'isInQuestionPlayerMode').and.returnValue(true);

      componentInstance.setPageContext();

      expect(componentInstance.explorationContext).toBe('practice');
    });

    it('should set exploration page context as default', () => {
      spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
        false
      );
      spyOn(pageContextService, 'isInQuestionPlayerMode').and.returnValue(
        false
      );

      componentInstance.setPageContext();

      expect(componentInstance.explorationContext).toBe('exploration');
    });
  });

  it('should toggle menu on mobile', () => {
    spyOn(mobileMenuService, 'toggleMenuVisibility');
    componentInstance.toggleMenu();
    expect(mobileMenuService.toggleMenuVisibility).toHaveBeenCalled();
  });

  describe('confirmExit', () => {
    it('should return true when user confirms', () => {
      mockWindowRef.nativeWindow.confirm = jasmine
        .createSpy('confirm')
        .and.returnValue(true);

      const result = componentInstance.confirmExit();

      expect(result).toBe(true);
      expect(mockWindowRef.nativeWindow.confirm).toHaveBeenCalledWith(
        'If you exit, your progress will be lost. Do you still want to exit?'
      );
    });

    it('should return false when user cancels', () => {
      mockWindowRef.nativeWindow.confirm = jasmine
        .createSpy('confirm')
        .and.returnValue(false);

      const result = componentInstance.confirmExit();

      expect(result).toBe(false);
    });
  });

  describe('closePlayer', () => {
    let ngbModal: NgbModal;
    let userService: MockUserService;
    let lessonExitService: MockLessonExitService;
    let preventPageUnloadEventService: MockPreventPageUnloadEventService;
    let localStorageService: LocalStorageService;
    let modalResult: Promise<unknown>;
    let modalComponentInstance: {isLoggedIn?: boolean};

    beforeEach(() => {
      ngbModal = TestBed.inject(NgbModal);
      userService = TestBed.inject(UserService) as unknown as MockUserService;
      lessonExitService = TestBed.inject(
        LessonExitService
      ) as unknown as MockLessonExitService;
      preventPageUnloadEventService = TestBed.inject(
        PreventPageUnloadEventService
      ) as unknown as MockPreventPageUnloadEventService;
      localStorageService = TestBed.inject(LocalStorageService);
      componentInstance.explorationId = 'expId';
      componentInstance.explorationContext =
        componentInstance.explorationContextConstants.EXPLORATION_PAGE;
      modalComponentInstance = {};
      modalResult = Promise.resolve({action: 'exit', dontShowAgain: false});
      spyOn(ngbModal, 'open').and.callFake(
        () =>
          ({
            componentInstance: modalComponentInstance,
            result: modalResult,
          }) as never
      );
      // The sign in flow saves logged-out progress first, which loads the
      // latest exploration. Without this stub the call goes to the real
      // service and never resolves under HttpClientTestingModule.
      spyOn(
        readOnlyExplorationBackendApiService,
        'loadLatestExplorationAsync'
      ).and.returnValue(Promise.resolve({version: 7} as never));
    });

    afterEach(() => {
      localStorageService.removeUniqueProgressIdOfLoggedOutLearner();
    });

    it('should open the exit modal for a logged-in learner', fakeAsync(() => {
      userService.isLoggedIn = true;

      componentInstance.closePlayer();
      tick();

      expect(ngbModal.open).toHaveBeenCalledWith(LessonExitModalComponent, {
        backdrop: 'static',
      });
      expect(modalComponentInstance.isLoggedIn).toBe(true);
    }));

    it('should open the exit modal for a logged-out learner', fakeAsync(() => {
      userService.isLoggedIn = false;

      componentInstance.closePlayer();
      tick();

      expect(modalComponentInstance.isLoggedIn).toBe(false);
    }));

    it('should navigate to the exit url when the learner confirms', fakeAsync(() => {
      componentInstance.closePlayer();
      tick();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/exit-url');
      expect(lessonExitService.hideExitModal).not.toHaveBeenCalled();
    }));

    it("should remember 'don't show again' for a logged-in learner", fakeAsync(() => {
      userService.isLoggedIn = true;
      userService.username = 'learner';
      modalResult = Promise.resolve({action: 'exit', dontShowAgain: true});

      componentInstance.closePlayer();
      tick();

      expect(lessonExitService.hideExitModal).toHaveBeenCalledWith('learner');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/exit-url');
    }));

    it('should use an empty username when the user has none', fakeAsync(() => {
      userService.isLoggedIn = true;
      userService.username = null;
      modalResult = Promise.resolve({action: 'exit', dontShowAgain: true});

      componentInstance.closePlayer();
      tick();

      expect(lessonExitService.hideExitModal).toHaveBeenCalledWith('');
    }));

    it('should skip the modal for a logged-in learner who opted out', fakeAsync(() => {
      userService.isLoggedIn = true;
      userService.username = 'learner';
      lessonExitService.isExitModalHidden.and.returnValue(true);

      componentInstance.closePlayer();
      tick();

      expect(lessonExitService.isExitModalHidden).toHaveBeenCalledWith(
        'learner'
      );
      expect(ngbModal.open).not.toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/exit-url');
    }));

    it('should never skip the modal for a logged-out learner', fakeAsync(() => {
      userService.isLoggedIn = false;
      lessonExitService.isExitModalHidden.and.returnValue(true);

      componentInstance.closePlayer();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
    }));

    it('should exit without saving for a logged-out learner', fakeAsync(() => {
      modalResult = Promise.resolve({
        action: 'exit-without-saving',
        dontShowAgain: false,
      });

      componentInstance.closePlayer();
      tick();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/exit-url');
      expect(userService.getLoginUrlAsync).not.toHaveBeenCalled();
    }));

    it('should stay in the lesson when the modal is dismissed', fakeAsync(() => {
      modalResult = new Promise((_, reject) => {
        setTimeout(() => reject('dismissed'), 0);
      });

      componentInstance.closePlayer();
      tick();

      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(userService.getLoginUrlAsync).not.toHaveBeenCalled();
    }));

    it('should save progress intent and redirect to sign in', fakeAsync(() => {
      modalResult = Promise.resolve({
        action: 'sign-in',
        dontShowAgain: false,
      });

      componentInstance.closePlayer();
      tick();

      expect(lessonExitService.saveSignInIntent).toHaveBeenCalledWith('expId');
      expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
      expect(mockWindowRef.nativeWindow.location.href).toBe(
        '/login?return_url=/lesson/expId'
      );
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    }));

    describe('saving logged-out progress before signing in', () => {
      let checkpointProgressService: MockCheckpointProgressService;
      let editableApi: MockEditableExplorationBackendApiService;

      beforeEach(() => {
        checkpointProgressService = TestBed.inject(
          CheckpointProgressService
        ) as unknown as MockCheckpointProgressService;
        editableApi = TestBed.inject(
          EditableExplorationBackendApiService
        ) as unknown as MockEditableExplorationBackendApiService;
        localStorageService.removeUniqueProgressIdOfLoggedOutLearner();
        modalResult = Promise.resolve({
          action: 'sign-in',
          dontShowAgain: false,
        });
      });

      it('should record the reached checkpoint and keep the progress id', fakeAsync(() => {
        componentInstance.closePlayer();
        tick();

        expect(
          editableApi.recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner
        ).toHaveBeenCalledWith('expId', 7, 'Mid');
        expect(
          localStorageService.getUniqueProgressIdOfLoggedOutLearner()
        ).toBe('pid123');
        expect(mockWindowRef.nativeWindow.location.href).toBe(
          '/login?return_url=/lesson/expId'
        );
      }));

      it('should replace a stale progress id with a fresh one', fakeAsync(() => {
        localStorageService.updateUniqueProgressIdOfLoggedOutLearner('old');

        componentInstance.closePlayer();
        tick();

        expect(
          editableApi.recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner
        ).toHaveBeenCalledWith('expId', 7, 'Mid');
        expect(
          localStorageService.getUniqueProgressIdOfLoggedOutLearner()
        ).toBe('pid123');
      }));

      it('should drop a stale progress id when there is nothing to save', fakeAsync(() => {
        localStorageService.updateUniqueProgressIdOfLoggedOutLearner('old');
        checkpointProgressService.checkpoint = null;

        componentInstance.closePlayer();
        tick();

        expect(
          localStorageService.getUniqueProgressIdOfLoggedOutLearner()
        ).toBe(null);
        expect(userService.getLoginUrlAsync).toHaveBeenCalled();
      }));

      it('should skip saving when no checkpoint has been reached', fakeAsync(() => {
        checkpointProgressService.checkpoint = null;

        componentInstance.closePlayer();
        tick();

        expect(
          editableApi.recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner
        ).not.toHaveBeenCalled();
        expect(userService.getLoginUrlAsync).toHaveBeenCalled();
      }));

      it('should skip saving when the exploration has no version', fakeAsync(() => {
        (
          readOnlyExplorationBackendApiService.loadLatestExplorationAsync as jasmine.Spy
        ).and.returnValue(Promise.resolve({version: null}));

        componentInstance.closePlayer();
        tick();

        expect(
          editableApi.recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner
        ).not.toHaveBeenCalled();
        expect(userService.getLoginUrlAsync).toHaveBeenCalled();
      }));

      it('should still send the learner to sign in if saving fails', fakeAsync(() => {
        editableApi.recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner.and.callFake(
          () => Promise.reject('server error')
        );

        componentInstance.closePlayer();
        tick();

        expect(
          localStorageService.getUniqueProgressIdOfLoggedOutLearner()
        ).toBe(null);
        expect(mockWindowRef.nativeWindow.location.href).toBe(
          '/login?return_url=/lesson/expId'
        );
      }));

      it('should not leave an exit intent behind if saving fails', fakeAsync(() => {
        editableApi.recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner.and.callFake(
          () => Promise.reject('server error')
        );

        componentInstance.closePlayer();
        tick();

        expect(lessonExitService.saveSignInIntent).not.toHaveBeenCalled();
        expect(lessonExitService.clearSignInIntent).toHaveBeenCalled();
      }));
    });

    it('should reload when no sign in url is returned', fakeAsync(() => {
      modalResult = Promise.resolve({
        action: 'sign-in',
        dontShowAgain: false,
      });
      userService.getLoginUrlAsync.and.returnValue(Promise.resolve(''));

      componentInstance.closePlayer();
      tick();

      expect(mockWindowRef.nativeWindow.location.reload).toHaveBeenCalled();
    }));

    it('should clear the intent when fetching the sign in url fails', fakeAsync(() => {
      modalResult = Promise.resolve({
        action: 'sign-in',
        dontShowAgain: false,
      });
      userService.getLoginUrlAsync.and.callFake(() =>
        Promise.reject('offline')
      );

      componentInstance.closePlayer();
      tick();

      expect(lessonExitService.clearSignInIntent).toHaveBeenCalled();
    }));

    it('should navigate to practice page parent for practice session when confirmed', () => {
      mockWindowRef.setPathname('/learn/classroom1/topic1/practice');
      componentInstance.explorationContext =
        componentInstance.explorationContextConstants.PRACTICE_PAGE;
      spyOn(componentInstance, 'confirmExit').and.returnValue(true);

      componentInstance.closePlayer();

      expect(router.navigate).toHaveBeenCalledWith([
        'learn',
        'classroom1',
        'topic1',
      ]);
      expect(ngbModal.open).not.toHaveBeenCalled();
    });

    it('should navigate to classroom page for diagnostic test when confirmed', () => {
      mockWindowRef.setPathname('/learn/classroom1/diagnostic');
      componentInstance.explorationContext =
        componentInstance.explorationContextConstants.DIAGNOSTIC_PAGE;
      componentInstance.classroomUrlFragment = 'classroom1';
      spyOn(componentInstance, 'confirmExit').and.returnValue(true);

      componentInstance.closePlayer();

      expect(router.navigate).toHaveBeenCalledWith(['learn', 'classroom1']);
    });

    it('should not navigate when user cancels for practice or diagnostic', () => {
      componentInstance.explorationContext =
        componentInstance.explorationContextConstants.DIAGNOSTIC_PAGE;
      spyOn(componentInstance, 'confirmExit').and.returnValue(false);

      componentInstance.closePlayer();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
