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
 * @fileoverview Unit tests for learner dashboard parge.
 */

import {
  Collection,
  CollectionBackendDict,
} from 'domain/collection/collection.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';

import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {ProfileSummary} from 'domain/user/profile-summary.model';
import {LearnerDashboardPageComponent} from './learner-dashboard-page.component';
import {
  async,
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from '@angular/core/testing';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Component, EventEmitter, NO_ERRORS_SCHEMA, Pipe} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {AlertsService} from 'services/alerts.service';
import {CsrfTokenService} from 'services/csrf-token.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {
  ExplorationBackendDict,
  ExplorationObjectFactory,
} from 'domain/exploration/ExplorationObjectFactory';
import {LearnerDashboardBackendApiService} from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import {LearnerDashboardActivityBackendApiService} from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import {SuggestionModalForLearnerDashboardService} from './suggestion-modal/suggestion-modal-for-learner-dashboard.service';
import {SortByPipe} from 'filters/string-utility-filters/sort-by.pipe';
import {UserService} from 'services/user.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {StorySummary} from 'domain/story/story-summary.model';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NonExistentTopicsAndStories} from 'domain/learner_dashboard/non-existent-topics-and-stories.model';
import {NonExistentCollections} from 'domain/learner_dashboard/non-existent-collections.model';
import {NonExistentExplorations} from 'domain/learner_dashboard/non-existent-explorations.model';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {PageTitleService} from 'services/page-title.service';
import {LearnerGroupBackendApiService} from 'domain/learner_group/learner-group-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {UserInfo} from 'domain/user/user-info.model';

@Pipe({name: 'slice'})
class MockSlicePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockLearnerDashboardActivityBackendApiService {
  async removeActivityModalAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string): string {
    return key;
  }
}

class MockPlatformFeatureService {
  get status(): object {
    return {
      ShowRedesignedLearnerDashboard: {
        isEnabled: false,
      },
    };
  }
}

@Component({selector: 'background-banner', template: ''})
class BackgroundBannerComponentStub {}

@Component({selector: 'exploration-summary-tile', template: ''})
class ExplorationSummaryTileComponentStub {}

@Component({selector: 'collection-summary-tile', template: ''})
class CollectionSummaryTileComponentStub {}

@Component({selector: 'loading-dots', template: ''})
class LoadingDotsComponentStub {}

describe('Learner dashboard page', () => {
  let component: LearnerDashboardPageComponent;
  let fixture: ComponentFixture<LearnerDashboardPageComponent>;
  let alertsService: AlertsService = null;
  let csrfTokenService: CsrfTokenService = null;
  let dateTimeFormatService: DateTimeFormatService = null;
  let explorationObjectFactory: ExplorationObjectFactory = null;
  let focusManagerService: FocusManagerService;
  let learnerDashboardBackendApiService: LearnerDashboardBackendApiService =
    null;
  let suggestionModalForLearnerDashboardService: SuggestionModalForLearnerDashboardService =
    null;
  let windowDimensionsService: WindowDimensionsService;
  let mockResizeEmitter: EventEmitter<void>;
  let userService: UserService = null;
  let translateService: TranslateService = null;
  let pageTitleService: PageTitleService = null;
  let learnerGroupBackendApiService: LearnerGroupBackendApiService;
  let urlService: UrlService;
  let platformFeatureService: PlatformFeatureService;
  let learnerDashboardBackendApiServiceSpy: LearnerDashboardBackendApiService;

  let explorationDict: ExplorationBackendDict = {
    init_state_name: 'Introduction',
    language_code: 'en',
    states: {},
    param_changes: [],
    param_specs: {},
    is_version_of_draft_valid: true,
    draft_changes: [],
    version: 1,
    draft_change_list_id: 3,
    title: 'Test Exploration',
    next_content_id_index: 3,
    auto_tts_enabled: true,
    exploration_metadata: {
      title: 'Exploration',
      category: 'Algebra',
      objective: 'To learn',
      language_code: 'en',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 50,
      init_state_name: 'Introduction',
      param_specs: {},
      param_changes: [],
      auto_tts_enabled: false,
      edits_allowed: true,
    },
  };

  let titleList = [
    'World War III',
    'Quantum Mechanics',
    'Algebra',
    'Nouns',
    'Counting Stars',
    'Hip Hop',
    'Consiousness',
    'Database Management',
    'Plant Cell',
    'Zebra',
  ];

  let categoryList = [
    'Social',
    'Science',
    'Mathematics',
    'English',
    'French',
    'Arts',
    'Pyschology',
    'Computer Science',
    'Biology',
    'Zoo',
  ];

  let subscriptionsList = [
    {
      creator_impact: 0,
      creator_username: 'Bucky',
    },
    {
      creator_impact: 1,
      creator_username: 'Arrow',
    },
    {
      creator_impact: 3,
      creator_username: 'Deadpool',
    },
    {
      creator_impact: 2,
      creator_username: 'Captain America',
    },
  ];

  let collectionDict: CollectionBackendDict = {
    id: 'sample_collection_id',
    title: 'a title',
    objective: 'an objective',
    category: 'a category',
    version: 0,
    nodes: [],
    language_code: null,
    schema_version: null,
    tags: null,
    playthrough_dict: {
      next_exploration_id: 'expId',
      completed_exploration_ids: ['expId2'],
    },
  };

  let learnerDashboardTopicAndStoriesData = {
    completed_stories_list: [],
    learnt_topic_list: [],
    partially_learnt_topics_list: [],
    topics_to_learn_list: [],
    all_topics_list: [],
    untracked_topics: {},
    completed_to_incomplete_stories: [],
    learnt_to_partially_learnt_topics: [],
    number_of_nonexistent_topics_and_stories: {
      partially_learnt_topics: 0,
      completed_stories: 0,
      learnt_topics: 0,
      topics_to_learn: 0,
    },
  };

  let learnerDashboardCollectionsData = {
    completed_collections_list: [],
    incomplete_collections_list: [],
    completed_to_incomplete_collections: [],
    number_of_nonexistent_collections: {
      incomplete_collections: 0,
      completed_collections: 0,
      collection_playlist: 0,
    },
    collection_playlist: [],
  };

  let learnerDashboardExplorationsData = {
    completed_explorations_list: [],
    incomplete_explorations_list: [],
    subscription_list: subscriptionsList,
    number_of_nonexistent_explorations: {
      incomplete_explorations: 0,
      completed_explorations: 0,
      exploration_playlist: 0,
    },
    exploration_playlist: [],
  };

  let userInfo = {
    _roles: ['USER_ROLE'],
    _isModerator: true,
    _isCurriculumAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isCurriculumAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    isTranslationAdmin: () => false,
    isBlogAdmin: () => false,
    isBlogPostEditor: () => false,
    isQuestionAdmin: () => false,
    isQuestionCoordinator: () => false,
    isTranslationCoordinator: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () => 'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true,
  };

  describe('when succesfully fetching learner dashboard data', () => {
    beforeEach(async(() => {
      mockResizeEmitter = new EventEmitter();
      TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          MaterialModule,
          FormsModule,
          HttpClientTestingModule,
        ],
        declarations: [
          LearnerDashboardPageComponent,
          MockTranslatePipe,
          SortByPipe,
          MockSlicePipe,
          MockTrunctePipe,
          BackgroundBannerComponentStub,
          ExplorationSummaryTileComponentStub,
          CollectionSummaryTileComponentStub,
          LoadingDotsComponentStub,
        ],
        providers: [
          AlertsService,
          DateTimeFormatService,
          ExplorationObjectFactory,
          FocusManagerService,
          LearnerDashboardBackendApiService,
          {
            provide: LearnerDashboardActivityBackendApiService,
            useClass: MockLearnerDashboardActivityBackendApiService,
          },
          {
            provide: WindowDimensionsService,
            useValue: {
              isWindowNarrow: () => true,
              getResizeEvent: () => mockResizeEmitter,
            },
          },
          {
            provide: PlatformFeatureService,
            useClass: MockPlatformFeatureService,
          },
          {
            provide: PlatformFeatureService,
            useClass: MockPlatformFeatureService,
          },
          SuggestionModalForLearnerDashboardService,
          UrlInterpolationService,
          UserService,
          PageTitleService,
          {
            provide: TranslateService,
            useClass: MockTranslateService,
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();
    }));

    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(LearnerDashboardPageComponent);
      component = fixture.componentInstance;

      alertsService = TestBed.inject(AlertsService);
      csrfTokenService = TestBed.inject(CsrfTokenService);
      dateTimeFormatService = TestBed.inject(DateTimeFormatService);
      explorationObjectFactory = TestBed.inject(ExplorationObjectFactory);
      focusManagerService = TestBed.inject(FocusManagerService);
      windowDimensionsService = TestBed.inject(WindowDimensionsService);
      learnerDashboardBackendApiService = TestBed.inject(
        LearnerDashboardBackendApiService
      );
      suggestionModalForLearnerDashboardService = TestBed.inject(
        SuggestionModalForLearnerDashboardService
      );
      userService = TestBed.inject(UserService);
      translateService = TestBed.inject(TranslateService);
      pageTitleService = TestBed.inject(PageTitleService);
      urlService = TestBed.inject(UrlService);
      learnerGroupBackendApiService = TestBed.inject(
        LearnerGroupBackendApiService
      );
      platformFeatureService = TestBed.inject(PlatformFeatureService);

      const mockElement = document.createElement('div');
      mockElement.className = 'oppia-exploration-title';
      document.body.appendChild(mockElement);

      spyOn(csrfTokenService, 'getTokenAsync').and.callFake(async () => {
        return Promise.resolve('sample-csrf-token');
      });
      // Generate completed explorations and exploration playlist.
      for (let i = 0; i < 10; i++) {
        learnerDashboardExplorationsData.completed_explorations_list[i] =
          explorationObjectFactory.createFromBackendDict(
            Object.assign(explorationDict, {
              id: i + 1,
              title: titleList[i],
              category: categoryList[i],
            })
          );
        learnerDashboardExplorationsData.exploration_playlist[i] = {
          id: Number(i + 1).toString(),
        };
      }

      // Generate incomplete explorations and incomplete exploration playlist.
      for (let i = 0; i < 12; i++) {
        learnerDashboardExplorationsData.incomplete_explorations_list[i] =
          explorationObjectFactory.createFromBackendDict(
            Object.assign(explorationDict, {
              // Create ids from 11 to 22.
              // (1 to 10 is the complete explorations).
              id: Number(i + 11).toString(),
              title: titleList[i],
              category: categoryList[i],
            })
          );
      }

      // Generate completed collections and collection playlist.
      for (let i = 0; i < 8; i++) {
        learnerDashboardCollectionsData.completed_collections_list[i] =
          // TODO(#10875): Fix type mismatch.
          Collection.create(
            Object.assign(collectionDict, {
              title: titleList[i],
              category: categoryList[i],
            }) as CollectionBackendDict
          );
        learnerDashboardCollectionsData.collection_playlist[i] = {
          id: Number(i + 1).toString(),
        };
      }

      // Generate incomplete collections.
      for (let i = 0; i < 8; i++) {
        learnerDashboardCollectionsData.incomplete_collections_list[i] =
          // TODO(#10875): Fix type mismatch.
          Collection.create(
            Object.assign(collectionDict, {
              // Create ids from 9 to 16.
              // (1 to 8 is the complete collections).
              id: Number(i + 9).toString(),
              title: 'Collection Title ' + (i + 7),
            }) as CollectionBackendDict
          );
      }

      spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
        'profile-image-url-png',
        'profile-image-url-webp',
      ]);

      spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardTopicsAndStoriesDataAsync'
      ).and.returnValue(
        Promise.resolve({
          completedStoriesList:
            learnerDashboardTopicAndStoriesData.completed_stories_list.map(
              storySummary => StorySummary.createFromBackendDict(storySummary)
            ),
          learntTopicsList:
            learnerDashboardTopicAndStoriesData.learnt_topic_list.map(
              topicSummary =>
                LearnerTopicSummary.createFromBackendDict(topicSummary)
            ),
          partiallyLearntTopicsList:
            learnerDashboardTopicAndStoriesData.partially_learnt_topics_list.map(
              topicSummary =>
                LearnerTopicSummary.createFromBackendDict(topicSummary)
            ),
          topicsToLearnList:
            learnerDashboardTopicAndStoriesData.topics_to_learn_list.map(
              topicSummary =>
                LearnerTopicSummary.createFromBackendDict(topicSummary)
            ),
          allTopicsList:
            learnerDashboardTopicAndStoriesData.all_topics_list.map(
              topicSummary =>
                LearnerTopicSummary.createFromBackendDict(topicSummary)
            ),
          untrackedTopics: learnerDashboardTopicAndStoriesData.untracked_topics,
          completedToIncompleteStories:
            learnerDashboardTopicAndStoriesData.completed_to_incomplete_stories,
          learntToPartiallyLearntTopics:
            learnerDashboardTopicAndStoriesData.learnt_to_partially_learnt_topics,
          numberOfNonexistentTopicsAndStories:
            NonExistentTopicsAndStories.createFromBackendDict(
              learnerDashboardTopicAndStoriesData.number_of_nonexistent_topics_and_stories
            ),
        })
      );

      learnerDashboardBackendApiServiceSpy = spyOn(
        learnerDashboardBackendApiService,
        'fetchSubtopicMastery'
      )
        .withArgs([])
        .and.returnValue(Promise.resolve({}));

      spyOn(
        learnerGroupBackendApiService,
        'isLearnerGroupFeatureEnabledAsync'
      ).and.returnValue(Promise.resolve(true));

      spyOn(urlService, 'getUrlParams').and.returnValue({
        active_tab: 'learner-groups',
      });

      spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardCollectionsDataAsync'
      ).and.returnValue(
        Promise.resolve({
          completedCollectionsList:
            learnerDashboardCollectionsData.completed_collections_list.map(
              collectionSummary =>
                CollectionSummary.createFromBackendDict(collectionSummary)
            ),
          incompleteCollectionsList:
            learnerDashboardCollectionsData.incomplete_collections_list.map(
              collectionSummary =>
                CollectionSummary.createFromBackendDict(collectionSummary)
            ),
          collectionPlaylist:
            learnerDashboardCollectionsData.collection_playlist.map(
              collectionSummary =>
                CollectionSummary.createFromBackendDict(collectionSummary)
            ),
          completedToIncompleteCollections:
            learnerDashboardCollectionsData.completed_to_incomplete_collections,
          numberOfNonexistentCollections:
            NonExistentCollections.createFromBackendDict(
              learnerDashboardCollectionsData.number_of_nonexistent_collections
            ),
        })
      );

      spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardExplorationsDataAsync'
      ).and.returnValue(
        Promise.resolve({
          completedExplorationsList:
            learnerDashboardExplorationsData.completed_explorations_list.map(
              expSummary =>
                LearnerExplorationSummary.createFromBackendDict(expSummary)
            ),
          incompleteExplorationsList:
            learnerDashboardExplorationsData.incomplete_explorations_list.map(
              expSummary =>
                LearnerExplorationSummary.createFromBackendDict(expSummary)
            ),
          explorationPlaylist:
            learnerDashboardExplorationsData.exploration_playlist.map(
              expSummary =>
                LearnerExplorationSummary.createFromBackendDict(expSummary)
            ),
          numberOfNonexistentExplorations:
            NonExistentExplorations.createFromBackendDict(
              learnerDashboardExplorationsData.number_of_nonexistent_explorations
            ),
          subscriptionList:
            learnerDashboardExplorationsData.subscription_list.map(
              profileSummary =>
                ProfileSummary.createFromCreatorBackendDict(profileSummary)
            ),
        })
      );

      component.ngOnInit();
      flush();
      fixture.detectChanges();
      flush();
    }));

    it(
      'should initialize correctly component properties after its' +
        ' initialization and get data from backend',
      fakeAsync(() => {
        spyOn(userService, 'getUserInfoAsync').and.callFake(async () => {
          return Promise.resolve(userInfo);
        });
        component.ngOnInit();
        flush();

        expect(component.profilePicturePngDataUrl).toEqual(
          'profile-image-url-png'
        );
        expect(component.profilePictureWebpDataUrl).toEqual(
          'profile-image-url-webp'
        );
        expect(component.username).toBe(userInfo.getUsername());
        expect(component.windowIsNarrow).toBeTrue();
      })
    );

    it('should get default profile pictures when username is null', fakeAsync(() => {
      let userInfo = {
        getUsername: () => null,
        isSuperAdmin: () => true,
        getEmail: () => 'test_email@example.com',
      };
      spyOn(userService, 'getUserInfoAsync').and.resolveTo(
        userInfo as UserInfo
      );
      component.ngOnInit();
      flush();

      expect(component.profilePicturePngDataUrl).toEqual(
        '/assets/images/avatar/user_blue_150px.png'
      );
      expect(component.profilePictureWebpDataUrl).toEqual(
        '/assets/images/avatar/user_blue_150px.webp'
      );
    }));

    it('should check whether window is narrow on resizing the screen', () => {
      spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

      expect(component.windowIsNarrow).toBeTrue();

      mockResizeEmitter.emit();

      expect(component.windowIsNarrow).toBeFalse();
    });

    it('should set focus without scroll on browse lesson btn', fakeAsync(() => {
      const focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll');
      spyOn(userService, 'getUserInfoAsync').and.callFake(async () => {
        return Promise.resolve(userInfo);
      });

      component.ngOnInit();
      flush();

      expect(focusSpy).toHaveBeenCalledWith('ourLessonsBtn');
    }));

    it(
      'should subscribe to onLangChange upon initialisation and set page ' +
        'title whenever language changes',
      fakeAsync(() => {
        spyOn(component.directiveSubscriptions, 'add');
        spyOn(translateService.onLangChange, 'subscribe');
        spyOn(component, 'setPageTitle');

        component.ngOnInit();
        flush();

        expect(component.directiveSubscriptions.add).toHaveBeenCalled();
        expect(translateService.onLangChange.subscribe).toHaveBeenCalled();

        translateService.onLangChange.emit();

        expect(component.setPageTitle).toHaveBeenCalled();
      })
    );

    it('should obtain translated page title and set it', () => {
      spyOn(translateService, 'instant').and.callThrough();
      spyOn(pageTitleService, 'setDocumentTitle');

      component.setPageTitle();

      expect(translateService.instant).toHaveBeenCalledWith(
        'I18N_LEARNER_DASHBOARD_PAGE_TITLE'
      );
      expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
        'I18N_LEARNER_DASHBOARD_PAGE_TITLE'
      );
    });

    it('should get static image url', () => {
      let imagePath = '/path/to/image.png';

      expect(component.getStaticImageUrl(imagePath)).toBe(
        '/assets/images/path/to/image.png'
      );
    });

    it('should get user profile image png data url correctly', () => {
      expect(component.getauthorPicturePngDataUrl('username')).toBe(
        'profile-image-url-png'
      );
    });

    it('should get user profile image webp data url correctly', () => {
      expect(component.getauthorPictureWebpDataUrl('username')).toBe(
        'profile-image-url-webp'
      );
    });

    it('should toggle active subsection type when changing subsection type', () => {
      // Active subsection is set as I18N_DASHBOARD_SKILL_PROFICIENCY when
      // component is initialized.
      expect(component.activeSubsection).toBe(
        'I18N_DASHBOARD_SKILL_PROFICIENCY'
      );

      let newActiveSubsection2 = 'I18N_DASHBOARD_SKILL_PROFICIENCY';
      component.setActiveSubsection(newActiveSubsection2);

      expect(component.activeSubsection).toBe(newActiveSubsection2);
    });

    it('should show username popover based on its length', () => {
      expect(component.showUsernamePopover('abcdefghijk')).toBe('mouseenter');
      expect(component.showUsernamePopover('abc')).toBe('none');
    });

    it('should show new and old content when opening suggestion modal', () => {
      spyOn(
        suggestionModalForLearnerDashboardService,
        'showSuggestionModal'
      ).and.returnValue(null);

      let newContent = 'New content';
      let oldContent = 'Old content';
      let description = 'Description';
      component.showSuggestionModal(newContent, oldContent, description);

      expect(
        suggestionModalForLearnerDashboardService.showSuggestionModal
      ).toHaveBeenCalledWith('edit_exploration_state_content', {
        newContent: newContent,
        oldContent: oldContent,
        description: description,
      });
    });

    it('should get css classes based on status', () => {
      expect(component.getLabelClass('open')).toBe('badge badge-info');
      expect(component.getLabelClass('compliment')).toBe('badge badge-success');
      expect(component.getLabelClass('another')).toBe('badge badge-secondary');
    });

    it('should get human readable status from provided status', () => {
      expect(component.getHumanReadableStatus('open')).toBe('Open');
      expect(component.getHumanReadableStatus('compliment')).toBe('Compliment');
      expect(component.getHumanReadableStatus('not_actionable')).toBe(
        'Not Actionable'
      );
    });

    it('should get formatted date string from the timestamp in milliseconds', () => {
      // This corresponds to Fri, 2 Apr 2021 09:45:00 GMT.
      let NOW_MILLIS = 1617393321345;
      spyOn(dateTimeFormatService, 'getLocaleAbbreviatedDatetimeString')
        .withArgs(NOW_MILLIS)
        .and.returnValue('4/2/2021');

      expect(component.getLocaleAbbreviatedDatetimeString(NOW_MILLIS)).toBe(
        '4/2/2021'
      );
    });

    it('should sanitize given png base64 data and generate url', () => {
      let result = component.decodePngURIData('%D1%88%D0%B5%D0%BB%D0%BB%D1%8B');

      fixture.detectChanges();

      expect(result).toBe('шеллы');
    });

    it('should get show_redesigned_learner_dashboard flag', () => {
      spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
        ShowRedesignedLearnerDashboard: {
          isEnabled: false,
        },
      });
    });
    it('should correctly get subtopic masteries', fakeAsync(() => {
      let subtopic = {
        skill_ids: ['skill_id_2'],
        id: 1,
        title: 'subtopic_name',
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        url_fragment: 'subtopic-name',
      };

      let nodeDict1 = {
        id: 'node_1',
        thumbnail_filename: 'image1.png',
        title: 'Chapter 1',
        description: 'Description 1',
        prerequisite_skill_ids: ['skill_id_1'],
        acquired_skill_ids: ['skill_id_2'],
        destination_node_ids: ['node_2'],
        outline: 'Outline',
        exploration_id: 'exp_1',
        outline_is_finalized: false,
        thumbnail_bg_color: '#a33f40',
        status: 'Published',
        planned_publication_date_msecs: 100,
        last_modified_msecs: 100,
        first_publication_date_msecs: 200,
        unpublishing_reason: null,
      };
      const learntTopicSummaryDict = {
        id: 'sample_topic_id',
        name: 'Topic Name',
        language_code: 'en',
        description: 'description',
        version: 1,
        story_titles: ['Story 1'],
        total_published_node_count: 2,
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#C6DCDA',
        classroom_name: 'math',
        classroom_url_fragment: 'math',
        practice_tab_is_displayed: false,
        canonical_story_summary_dict: [
          {
            id: '0',
            title: 'Story Title',
            description: 'Story Description',
            node_titles: ['Chapter 1'],
            thumbnail_filename: 'image.svg',
            thumbnail_bg_color: '#F8BF74',
            story_is_published: true,
            completed_node_titles: ['Chapter 1'],
            all_node_dicts: [nodeDict1],
            url_fragment: 'story-title',
            topic_name: 'Topic Name',
            classroom_url_fragment: 'math',
            topic_url_fragment: 'topic-name',
          },
        ],
        url_fragment: 'topic-name',
        subtopics: [subtopic],
        degrees_of_mastery: {
          skill_id_1: 1,
          skill_id_2: 1,
        },
        skill_descriptions: {
          skill_id_1: 'Skill Description 1',
          skill_id_2: 'Skill Description 2',
        },
      };

      let newSubtopic = {
        skill_ids: ['skill_id_3'],
        id: 1,
        title: 'subtopic_name',
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        url_fragment: 'subtopic-name',
      };

      let newNodeDict = {
        id: 'node_1',
        thumbnail_filename: 'image1.png',
        title: 'Chapter 1',
        description: 'Description 1',
        prerequisite_skill_ids: ['skill_id_3'],
        acquired_skill_ids: ['skill_id_4'],
        destination_node_ids: [''],
        outline: 'Outline',
        exploration_id: 'exp_1',
        outline_is_finalized: false,
        thumbnail_bg_color: '#a33f40',
        status: 'Published',
        planned_publication_date_msecs: 100,
        last_modified_msecs: 100,
        first_publication_date_msecs: 200,
        unpublishing_reason: null,
      };

      const newTopicSummaryDict = {
        id: 'new_sample_topic_id',
        name: 'New Topic Name',
        language_code: 'en',
        description: 'description',
        version: 1,
        story_titles: ['Story 1'],
        total_published_node_count: 2,
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#C6DCDA',
        classroom_name: 'math',
        classroom_url_fragment: 'math',
        practice_tab_is_displayed: false,
        canonical_story_summary_dict: [
          {
            id: '0',
            title: 'Story Title',
            description: 'Story Description',
            node_titles: ['Chapter 1'],
            thumbnail_filename: 'image.svg',
            thumbnail_bg_color: '#F8BF74',
            story_is_published: true,
            completed_node_titles: [''],
            all_node_dicts: [newNodeDict],
            url_fragment: 'new-story-title',
            topic_name: 'New Topic Name',
            classroom_url_fragment: 'math',
            topic_url_fragment: 'new-topic-name',
          },
        ],
        url_fragment: 'new-topic-name',
        subtopics: [newSubtopic],
        degrees_of_mastery: {
          skill_id_3: 0,
        },
        skill_descriptions: {
          skill_id_3: 'Skill Description 3',
        },
      };

      component.partiallyLearntTopicsList = [
        LearnerTopicSummary.createFromBackendDict(newTopicSummaryDict),
      ];
      component.learntTopicsList = [
        LearnerTopicSummary.createFromBackendDict(learntTopicSummaryDict),
      ];
      learnerDashboardBackendApiServiceSpy
        .withArgs(['new_sample_topic_id', 'sample_topic_id'])
        .and.returnValue(
          Promise.resolve({new_sample_topic_id: {}, sample_topic_id: {1: 1}})
        );

      component.getSubtopicMasteryData();
      tick();

      expect(learnerDashboardBackendApiServiceSpy).toHaveBeenCalledWith([
        'new_sample_topic_id',
        'sample_topic_id',
      ]);
      expect(component.subtopicMasteries).toEqual({
        new_sample_topic_id: {},
        sample_topic_id: {1: 1},
      });
    }));
  });

  describe('when fetching dashboard data fails', () => {
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          MaterialModule,
          FormsModule,
          HttpClientTestingModule,
        ],
        declarations: [
          LearnerDashboardPageComponent,
          MockTranslatePipe,
          SortByPipe,
          MockSlicePipe,
          MockTrunctePipe,
          BackgroundBannerComponentStub,
          ExplorationSummaryTileComponentStub,
          CollectionSummaryTileComponentStub,
          LoadingDotsComponentStub,
        ],
        providers: [
          AlertsService,
          CsrfTokenService,
          LearnerDashboardBackendApiService,
          UserService,
          PageTitleService,
          {
            provide: TranslateService,
            useClass: MockTranslateService,
          },
          {
            provide: PlatformFeatureService,
            useClass: MockPlatformFeatureService,
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();
    }));

    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(LearnerDashboardPageComponent);
      component = fixture.componentInstance;
      alertsService = TestBed.inject(AlertsService);
      csrfTokenService = TestBed.inject(CsrfTokenService);
      learnerDashboardBackendApiService = TestBed.inject(
        LearnerDashboardBackendApiService
      );
      userService = TestBed.inject(UserService);
      translateService = TestBed.inject(TranslateService);
      pageTitleService = TestBed.inject(PageTitleService);
      platformFeatureService = TestBed.inject(PlatformFeatureService);

      spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
        Promise.resolve('sample-csrf-token')
      );

      spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
        'default-image-url-png',
        'default-image-url-webp',
      ]);

      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(userInfo)
      );
    }));

    it(
      'should show an alert warning when fails to get topics and' +
        ' stories data',
      fakeAsync(() => {
        const fetchDataSpy = spyOn(
          learnerDashboardBackendApiService,
          'fetchLearnerDashboardTopicsAndStoriesDataAsync'
        ).and.rejectWith(404);
        const alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

        component.ngOnInit();

        tick();
        fixture.detectChanges();

        expect(alertsSpy).toHaveBeenCalledWith(
          'Failed to get learner dashboard topics and stories data'
        );
        expect(fetchDataSpy).toHaveBeenCalled();
      })
    );

    it(
      'should show an alert warning when fails to get collections data' +
        'in mobile view',
      fakeAsync(() => {
        const fetchDataSpy = spyOn(
          learnerDashboardBackendApiService,
          'fetchLearnerDashboardCollectionsDataAsync'
        ).and.rejectWith(404);
        const alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

        let newActiveSectionName = 'I18N_DASHBOARD_LESSONS';
        component.setActiveSubsection(newActiveSectionName);

        tick();
        fixture.detectChanges();

        expect(alertsSpy).toHaveBeenCalledWith(
          'Failed to get learner dashboard collections data'
        );
        expect(fetchDataSpy).toHaveBeenCalled();
      })
    );

    it(
      'should show an alert warning when fails to get explorations data in' +
        'mobile view',
      fakeAsync(() => {
        const fetchDataSpy = spyOn(
          learnerDashboardBackendApiService,
          'fetchLearnerDashboardExplorationsDataAsync'
        ).and.rejectWith(404);
        const alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

        let newActiveSectionName = 'I18N_DASHBOARD_LESSONS';
        component.setActiveSubsection(newActiveSectionName);

        tick();
        fixture.detectChanges();

        expect(alertsSpy).toHaveBeenCalledWith(
          'Failed to get learner dashboard explorations data'
        );
        expect(fetchDataSpy).toHaveBeenCalled();
      })
    );

    it(
      'should get explorations and collections data when user clicks ' +
        'communtiy lessons tab in mobile view',
      fakeAsync(() => {
        const fetchCollectionsDataSpy = spyOn(
          learnerDashboardBackendApiService,
          'fetchLearnerDashboardCollectionsDataAsync'
        ).and.returnValue(
          Promise.resolve({
            completedCollectionsList:
              learnerDashboardCollectionsData.completed_collections_list.map(
                collectionSummary =>
                  CollectionSummary.createFromBackendDict(collectionSummary)
              ),
            incompleteCollectionsList:
              learnerDashboardCollectionsData.incomplete_collections_list.map(
                collectionSummary =>
                  CollectionSummary.createFromBackendDict(collectionSummary)
              ),
            collectionPlaylist:
              learnerDashboardCollectionsData.collection_playlist.map(
                collectionSummary =>
                  CollectionSummary.createFromBackendDict(collectionSummary)
              ),
            completedToIncompleteCollections:
              learnerDashboardCollectionsData.completed_to_incomplete_collections,
            numberOfNonexistentCollections:
              NonExistentCollections.createFromBackendDict(
                learnerDashboardCollectionsData.number_of_nonexistent_collections
              ),
          })
        );

        const fetchExplorationsDataSpy = spyOn(
          learnerDashboardBackendApiService,
          'fetchLearnerDashboardExplorationsDataAsync'
        ).and.returnValue(
          Promise.resolve({
            completedExplorationsList:
              learnerDashboardExplorationsData.completed_explorations_list.map(
                expSummary =>
                  LearnerExplorationSummary.createFromBackendDict(expSummary)
              ),
            incompleteExplorationsList:
              learnerDashboardExplorationsData.incomplete_explorations_list.map(
                expSummary =>
                  LearnerExplorationSummary.createFromBackendDict(expSummary)
              ),
            explorationPlaylist:
              learnerDashboardExplorationsData.exploration_playlist.map(
                expSummary =>
                  LearnerExplorationSummary.createFromBackendDict(expSummary)
              ),
            numberOfNonexistentExplorations:
              NonExistentExplorations.createFromBackendDict(
                learnerDashboardExplorationsData.number_of_nonexistent_explorations
              ),
            subscriptionList:
              learnerDashboardExplorationsData.subscription_list.map(
                profileSummary =>
                  ProfileSummary.createFromCreatorBackendDict(profileSummary)
              ),
          })
        );

        let newActiveSectionName = 'I18N_DASHBOARD_LESSONS';
        component.setActiveSubsection(newActiveSectionName);

        tick();
        fixture.detectChanges();

        expect(fetchCollectionsDataSpy).toHaveBeenCalled();
        flush();
        expect(fetchExplorationsDataSpy).toHaveBeenCalled();
        expect(component.communityLessonsDataLoaded).toEqual(true);
      })
    );

    it(
      'should show an alert warning when fails to get collections data ' +
        'in web view',
      fakeAsync(() => {
        const fetchDataSpy = spyOn(
          learnerDashboardBackendApiService,
          'fetchLearnerDashboardCollectionsDataAsync'
        ).and.rejectWith(404);
        const alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

        let newActiveSectionName =
          'I18N_LEARNER_DASHBOARD_COMMUNITY_LESSONS_SECTION';
        component.setActiveSection(newActiveSectionName);

        tick();
        fixture.detectChanges();

        expect(alertsSpy).toHaveBeenCalledWith(
          'Failed to get learner dashboard collections data'
        );
        expect(fetchDataSpy).toHaveBeenCalled();
      })
    );

    it(
      'should show an alert warning when fails to get explorations data in ' +
        'web view',
      fakeAsync(() => {
        const fetchDataSpy = spyOn(
          learnerDashboardBackendApiService,
          'fetchLearnerDashboardExplorationsDataAsync'
        ).and.rejectWith(404);
        const alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

        let newActiveSectionName =
          'I18N_LEARNER_DASHBOARD_COMMUNITY_LESSONS_SECTION';
        component.setActiveSection(newActiveSectionName);

        tick();
        fixture.detectChanges();

        expect(alertsSpy).toHaveBeenCalledWith(
          'Failed to get learner dashboard explorations data'
        );
        expect(fetchDataSpy).toHaveBeenCalled();
      })
    );

    it(
      'should get explorations and collections data when user clicks ' +
        'communtiy lessons tab in web view',
      fakeAsync(() => {
        const fetchCollectionsDataSpy = spyOn(
          learnerDashboardBackendApiService,
          'fetchLearnerDashboardCollectionsDataAsync'
        ).and.returnValue(
          Promise.resolve({
            completedCollectionsList:
              learnerDashboardCollectionsData.completed_collections_list.map(
                collectionSummary =>
                  CollectionSummary.createFromBackendDict(collectionSummary)
              ),
            incompleteCollectionsList:
              learnerDashboardCollectionsData.incomplete_collections_list.map(
                collectionSummary =>
                  CollectionSummary.createFromBackendDict(collectionSummary)
              ),
            collectionPlaylist:
              learnerDashboardCollectionsData.collection_playlist.map(
                collectionSummary =>
                  CollectionSummary.createFromBackendDict(collectionSummary)
              ),
            completedToIncompleteCollections:
              learnerDashboardCollectionsData.completed_to_incomplete_collections,
            numberOfNonexistentCollections:
              NonExistentCollections.createFromBackendDict(
                learnerDashboardCollectionsData.number_of_nonexistent_collections
              ),
          })
        );

        const fetchExplorationsDataSpy = spyOn(
          learnerDashboardBackendApiService,
          'fetchLearnerDashboardExplorationsDataAsync'
        ).and.returnValue(
          Promise.resolve({
            completedExplorationsList:
              learnerDashboardExplorationsData.completed_explorations_list.map(
                expSummary =>
                  LearnerExplorationSummary.createFromBackendDict(expSummary)
              ),
            incompleteExplorationsList:
              learnerDashboardExplorationsData.incomplete_explorations_list.map(
                expSummary =>
                  LearnerExplorationSummary.createFromBackendDict(expSummary)
              ),
            explorationPlaylist:
              learnerDashboardExplorationsData.exploration_playlist.map(
                expSummary =>
                  LearnerExplorationSummary.createFromBackendDict(expSummary)
              ),
            numberOfNonexistentExplorations:
              NonExistentExplorations.createFromBackendDict(
                learnerDashboardExplorationsData.number_of_nonexistent_explorations
              ),
            subscriptionList:
              learnerDashboardExplorationsData.subscription_list.map(
                profileSummary =>
                  ProfileSummary.createFromCreatorBackendDict(profileSummary)
              ),
          })
        );

        let newActiveSectionName =
          'I18N_LEARNER_DASHBOARD_COMMUNITY_LESSONS_SECTION';
        component.setActiveSection(newActiveSectionName);

        tick();
        fixture.detectChanges();

        expect(fetchCollectionsDataSpy).toHaveBeenCalled();
        flush();
        expect(fetchExplorationsDataSpy).toHaveBeenCalled();
        expect(component.communityLessonsDataLoaded).toEqual(true);
      })
    );

    it('should return home greeting when current tab is set to home', () => {
      component.activeSection = 'I18N_LEARNER_DASHBOARD_HOME_SECTION';
      fixture.detectChanges();

      expect(component.getDashboardTabHeading()).toBe(
        'I18N_LEARNER_DASHBOARD_HOME_SECTION_HEADING'
      );
    });

    it('should return goal greeting when current tab is set to goals', () => {
      component.activeSection = 'I18N_LEARNER_DASHBOARD_GOALS_SECTION';
      fixture.detectChanges();

      expect(component.getDashboardTabHeading()).toBe(
        'I18N_LEARNER_DASHBOARD_GOALS_SECTION_HEADING'
      );
    });

    it('should return progress greeting when current tab is set to progress', () => {
      component.activeSection = 'I18N_LEARNER_DASHBOARD_PROGRESS_SECTION';
      fixture.detectChanges();

      expect(component.getDashboardTabHeading()).toBe(
        'I18N_LEARNER_DASHBOARD_PROGRESS_SECTION_HEADING'
      );
    });

    it('should return default greeting when current tab is not valid', () => {
      component.activeSection = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      fixture.detectChanges();

      expect(component.getDashboardTabHeading()).toBe(
        'No valid I18N key for heading of I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION'
      );
    });

    it('should unsubscribe upon component destruction', () => {
      spyOn(component.directiveSubscriptions, 'unsubscribe');

      component.ngOnDestroy();

      expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
    });
  });
});
