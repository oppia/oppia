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
 * @fileoverview Unit tests for storyViewerPage.
 */

import {TestBed, fakeAsync, flushMicrotasks, tick} from '@angular/core/testing';
import {ElementRef, NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TranslateService} from '@ngx-translate/core';

import {StoryNode} from 'domain/story/story-node.model';
import {StoryPlaythrough} from 'domain/story_viewer/story-playthrough.model';
import {StoryViewerPageComponent} from './story-viewer-page.component';
import {UserService} from 'services/user.service';
import {StoryViewerBackendApiService} from 'domain/story_viewer/story-viewer-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {PageTitleService} from 'services/page-title.service';
import {UserInfo} from 'domain/user/user-info.model';
import {WindowRef} from 'services/contextual/window-ref.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {ReadOnlyStoryNode} from 'domain/story_viewer/read-only-story-node.model';

class MockAssetsBackendApiService {
  getThumbnailUrlForPreview() {
    return 'thumbnail-url';
  }
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Story Viewer Page component', () => {
  let httpTestingController: HttpTestingController;
  let component: StoryViewerPageComponent;
  let alertsService: AlertsService;
  let assetsBackendApiService: AssetsBackendApiService;
  let storyViewerBackendApiService: StoryViewerBackendApiService;
  let urlService: UrlService;
  let userService: UserService;
  let pageTitleService: PageTitleService;
  let windowRef: WindowRef;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let translateService: TranslateService;
  let _samplePlaythroughObject: StoryPlaythrough;
  const UserInfoObject = {
    roles: ['USER_ROLE'],
    is_moderator: false,
    is_curriculum_admin: false,
    is_super_admin: false,
    is_topic_manager: false,
    can_create_collections: true,
    preferred_site_language_code: null,
    username: 'tester',
    email: 'test@test.com',
    user_is_logged_in: false,
  };

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      declarations: [StoryViewerPageComponent, MockTranslatePipe],
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: assetsBackendApiService,
          useClass: MockAssetsBackendApiService,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    httpTestingController = TestBed.get(HttpTestingController);
    pageTitleService = TestBed.get(PageTitleService);
    assetsBackendApiService = TestBed.get(AssetsBackendApiService);
    urlService = TestBed.get(UrlService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    userService = TestBed.get(UserService);
    alertsService = TestBed.get(AlertsService);
    storyViewerBackendApiService = TestBed.get(StoryViewerBackendApiService);
    windowRef = TestBed.get(WindowRef);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    translateService = TestBed.inject(TranslateService);
    let fixture = TestBed.createComponent(StoryViewerPageComponent);
    component = fixture.componentInstance;
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        reload: () => {},
        href: '/home',
      },
    } as Window);
  }));

  beforeEach(() => {
    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview').and.returnValue(
      'thumbnail-url'
    );
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(UserInfo.createFromBackendDict(UserInfoObject))
    );
  });

  beforeEach(() => {
    var firstSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_1',
      description: 'description',
      title: 'Title 1',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private',
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
      },
      completed: true,
      thumbnail_bg_color: '#927117',
      thumbnail_filename: 'filename',
    };
    var secondSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_2',
      description: 'description',
      title: 'Title 2',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_3'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private',
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
      },
      completed: false,
      thumbnail_bg_color: '#927117',
      thumbnail_filename: 'filename',
    };
    var storyPlaythroughBackendObject = {
      story_id: 'qwerty',
      story_nodes: [
        firstSampleReadOnlyStoryNodeBackendDict,
        secondSampleReadOnlyStoryNodeBackendDict,
      ],
      story_title: 'Story',
      story_description: 'Description',
      topic_name: 'Topic 1',
      meta_tag_content: 'Story meta tag content',
    };
    _samplePlaythroughObject = StoryPlaythrough.createFromBackendDict(
      storyPlaythroughBackendObject
    );
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should get complete exploration url when clicking on svg element', () => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic'
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story'
    );
    let node = StoryNode.createFromIdAndTitle('1', 'Story node title');
    expect(component.getExplorationUrl(node)).toBe(
      '/explore/null?topic_url_fragment=topic&' +
        'classroom_url_fragment=math&story_url_fragment=story&' +
        'node_id=1'
    );
  });

  it(
    'should get complete image path corresponding to a given' +
      ' relative path',
    () => {
      let imagePath = '/path/to/image.png';
      expect(component.getStaticImageUrl(imagePath)).toBe(
        '/assets/images/path/to/image.png'
      );
    }
  );

  it("should not show story's chapters when story has no chapters", () => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic'
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story'
    );
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(
        StoryPlaythrough.createFromBackendDict({
          story_nodes: [],
          story_title: 'Story Title 1',
          story_description: 'Story Description 1',
          topic_name: 'topic_1',
          meta_tag_content: 'this is a meta tag content',
          story_id: 'id',
        })
      )
    );

    component.ngOnInit();

    expect(component.showChapters()).toBeFalse();
  });

  it('should throw error if story url fragment is not present', () => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic'
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      null
    );
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(
        StoryPlaythrough.createFromBackendDict({
          story_nodes: [],
          story_title: 'Story Title 1',
          story_description: 'Story Description 1',
          topic_name: 'topic_1',
          meta_tag_content: 'this is a meta tag content',
          story_id: 'id',
        })
      )
    );
    let node = StoryNode.createFromIdAndTitle('1', 'Story node title');

    expect(() => {
      component.ngOnInit();
    }).toThrowError('Story url fragment is null');

    expect(() => {
      component.getExplorationUrl(node);
    }).toThrowError('Story url fragment is null');
  });

  it("should show story's chapters when story has chapters", () => {
    let sampleDataResults = {
      story_id: 'qwerty',
      story_title: 'Story title',
      story_description: 'Story description',
      story_nodes: [],
      topic_name: 'Topic name',
      meta_tag_content: 'Story meta tag content',
    };
    let samplePlaythroughObject =
      StoryPlaythrough.createFromBackendDict(sampleDataResults);
    component.storyPlaythroughObject = {
      id: '1',
      nodes: [],
      title: 'title',
      description: 'description',
      topicName: 'topic_name',
      metaTagContent: 'this is meta tag content',
      getInitialNode(): ReadOnlyStoryNode {
        return samplePlaythroughObject.getInitialNode();
      },
      getStoryNodeCount(): number {
        return 2;
      },
      getStoryNodes(): ReadOnlyStoryNode[] {
        return [];
      },
      hasFinishedStory(): boolean {
        return false;
      },
      getNextPendingNodeId(): string {
        return 'id';
      },
      hasStartedStory(): boolean {
        return false;
      },
      getStoryId(): string {
        return this.id;
      },
      getMetaTagContent(): string {
        return this.metaTagContent;
      },
    };
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic'
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story'
    );
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(_samplePlaythroughObject)
    );

    expect(_samplePlaythroughObject.getStoryNodes()[0].getId()).toEqual(
      'node_1'
    );
    expect(_samplePlaythroughObject.getStoryNodes()[1].getId()).toEqual(
      'node_2'
    );

    expect(component.showChapters()).toBeTrue();
  });

  it('should sign in correctly', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.resolveTo('/home');
    component.signIn();
    flushMicrotasks();
    expect(windowRef.nativeWindow.location.href).toBe('/home');
  }));

  it(
    'should refresh page if login url is not provided when login button is' +
      ' clicked',
    fakeAsync(() => {
      const reloadSpy = spyOn(windowRef.nativeWindow.location, 'reload');
      spyOn(userService, 'getLoginUrlAsync').and.resolveTo(undefined);
      component.signIn();
      flushMicrotasks();

      expect(reloadSpy).toHaveBeenCalled();
    })
  );

  it('should show warnings when fetching story data fails', fakeAsync(() => {
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic'
    );
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story'
    );
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.reject({
        status: 404,
      })
    );
    spyOn(alertsService, 'addWarning').and.callThrough();
    component.ngOnInit();
    flushMicrotasks();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to get dashboard data'
    );
  }));

  it('should get path icon parameters after story data is loaded', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic'
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story'
    );
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(_samplePlaythroughObject)
    );
    spyOn(component, 'subscribeToOnLangChange');
    component.ngOnInit();

    flushMicrotasks();

    expect(component.subscribeToOnLangChange).toHaveBeenCalled();
    expect(component.pathIconParameters).toEqual([
      {
        thumbnailIconUrl: 'thumbnail-url',
        left: '225px',
        top: '35px',
        thumbnailBgColor: '#927117',
      },
      {
        thumbnailIconUrl: 'thumbnail-url',
        left: '225px',
        top: '35px',
        thumbnailBgColor: '#927117',
      },
    ]);
  }));

  it(
    'should obtain translated title and set it whenever the ' +
      'selected language changes',
    () => {
      component.subscribeToOnLangChange();
      spyOn(component, 'setPageTitle');
      translateService.onLangChange.emit();

      expect(component.setPageTitle).toHaveBeenCalled();
    }
  );

  it('should set page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    component.topicName = 'dummy_topic_name';
    component.storyTitle = 'dummy_story_title';
    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_STORY_VIEWER_PAGE_TITLE',
      {
        topicName: 'dummy_topic_name',
        storyTitle: 'dummy_story_title',
      }
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_STORY_VIEWER_PAGE_TITLE'
    );
  });

  it('should unsubscribe upon component destruction', () => {
    component.subscribeToOnLangChange();
    expect(component.directiveSubscriptions.closed).toBe(false);
    component.ngOnDestroy();

    expect(component.directiveSubscriptions.closed).toBe(true);
  });

  it('should place empty values if Filename and BgColor are null', fakeAsync(() => {
    var firstSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_1',
      description: 'description',
      title: 'Title 1',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private',
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
      },
      completed: true,
      thumbnail_bg_color: '#927117',
      thumbnail_filename: '',
    };
    var secondSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_2',
      description: 'description',
      title: 'Title 2',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_3'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private',
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
      },
      completed: false,
      thumbnail_bg_color: '#927117',
      thumbnail_filename: '',
    };

    var storyPlaythroughBackendObject = {
      story_id: 'qwerty',
      story_nodes: [
        firstSampleReadOnlyStoryNodeBackendDict,
        secondSampleReadOnlyStoryNodeBackendDict,
      ],
      story_title: 'Story',
      story_description: 'Description',
      topic_name: 'Topic 1',
      meta_tag_content: 'Story meta tag content',
    };
    _samplePlaythroughObject = StoryPlaythrough.createFromBackendDict(
      storyPlaythroughBackendObject
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic'
    );
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story'
    );
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(_samplePlaythroughObject)
    );
    component.ngOnInit();
    flushMicrotasks();
    expect(component.thumbnailFilename === '');
    expect(component.iconUrl === '');
  }));

  it('should close the login overlay', fakeAsync(() => {
    spyOn(component, 'hideLoginOverlay').and.callThrough();

    expect(component.showLoginOverlay).toEqual(true);

    component.hideLoginOverlay();
    tick();

    expect(component.showLoginOverlay).toEqual(false);
  }));

  it('should set focus on skip button', fakeAsync(() => {
    let target = document.createElement('div');
    target.classList.add('target');

    let nonTarget = document.createElement('div');
    nonTarget.classList.add('test');

    let overlay = new ElementRef(document.createElement('div'));
    let button = new ElementRef(document.createElement('button'));

    component.skipButton = button;
    component.overlay = overlay;
    component.showLoginOverlay = true;

    spyOn(component, 'focusSkipButton').and.callThrough();
    spyOn(component.skipButton.nativeElement, 'focus');
    spyOn(target, 'closest').and.returnValue(nonTarget);

    component.focusSkipButton(target, true);
    tick();

    expect(component.skipButton.nativeElement.focus).not.toHaveBeenCalled();

    component.focusSkipButton(target, false);
    tick();

    expect(component.skipButton.nativeElement.focus).toHaveBeenCalled();
  }));
  it('should check if hacky translation is displayed correctly', () => {
    spyOn(
      i18nLanguageCodeService,
      'isHackyTranslationAvailable'
    ).and.returnValues(false, true, false, true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish').and.returnValues(
      false,
      false,
      true,
      false
    );

    let hackyStoryTitleTranslationIsDisplayed =
      component.isHackyStoryTitleTranslationDisplayed();
    expect(hackyStoryTitleTranslationIsDisplayed).toBe(false);
    let hackyStoryDescTranslationIsDisplayed =
      component.isHackyStoryDescTranslationDisplayed();
    expect(hackyStoryDescTranslationIsDisplayed).toBe(true);
    let hackyStoryNodeTitleTranslationIsDisplayed =
      component.isHackyStoryNodeTitleTranslationDisplayed(0);
    expect(hackyStoryNodeTitleTranslationIsDisplayed).toBe(false);
    let hackyStoryNodeDescTranslationIsDisplayed =
      component.isHackyStoryNodeDescTranslationDisplayed(0);
    expect(hackyStoryNodeDescTranslationIsDisplayed).toBe(true);
  });
});
