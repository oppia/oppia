// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// @ts-nocheck
/**
 * @fileoverview Unit tests for TopicStorySectionComponent.
 */

import {ElementRef, NO_ERRORS_SCHEMA, QueryList} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {SimpleChange} from '@angular/core';
import {EventEmitter} from '@angular/core';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {TranslateService} from '@ngx-translate/core';

import {StoryNode} from 'domain/story/story-node.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicSessionFallbackLanguageService} from 'pages/topic-viewer-page/services/topic-session-fallback-language.service';
import {UrlService} from 'services/contextual/url.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {ChapterLabelVisibilityService} from 'services/chapter-label-visibility.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ChapterProgressLoaderService} from 'services/chapter-progress-loader.service';
import {LocalStorageService} from 'services/local-storage.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';

import {TopicStorySectionComponent} from './topic-story-section.component';
import {AdventureMasteredModalComponent} from './adventure-mastered-modal.component';
import {ArcSkipConfirmationModalComponent} from './arc-skip-confirmation-modal.component';
import {ChapterProgressSummary} from 'domain/exploration/chapter-progress-summary.model';

class MockTranslateService {
  instant(key: string): string {
    return key;
  }
}

describe('TopicStorySectionComponent', () => {
  let component: TopicStorySectionComponent;
  let fixture: ComponentFixture<TopicStorySectionComponent>;
  let urlService: jasmine.SpyObj<UrlService>;
  let urlInterpolationService: jasmine.SpyObj<UrlInterpolationService>;
  let assetsBackendApiService: jasmine.SpyObj<AssetsBackendApiService>;
  let i18nLanguageCodeService: {
    isCurrentLanguageRTL: jasmine.Spy;
    onI18nLanguageCodeChange: EventEmitter<string>;
  };
  let chapterProgressLoaderService: jasmine.SpyObj<ChapterProgressLoaderService>;
  let topicSessionFallbackLanguageService: jasmine.SpyObj<TopicSessionFallbackLanguageService>;
  let chapterLabelVisibilityService: jasmine.SpyObj<ChapterLabelVisibilityService>;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let platformFeatureService: {
    status: {
      SerialChapterLaunchLearnerView: {
        isEnabled: boolean;
      };
    };
  };
  let windowRef: {
    nativeWindow: {
      confirm: jasmine.Spy;
    };
  };
  let translateService: TranslateService;
  let ngbModal: jasmine.SpyObj<NgbModal>;
  let bottomSheet: jasmine.SpyObj<MatBottomSheet>;
  let windowDimensionsService: jasmine.SpyObj<WindowDimensionsService>;

  beforeEach(waitForAsync(() => {
    urlService = jasmine.createSpyObj('UrlService', [
      'getClassroomUrlFragmentFromLearnerUrl',
      'getTopicUrlFragmentFromLearnerUrl',
      'getQueryFieldValuesAsList',
      'addField',
    ]);
    urlInterpolationService = jasmine.createSpyObj('UrlInterpolationService', [
      'getStaticImageUrl',
      'getStaticCopyrightedImageUrl',
      'interpolateUrl',
    ]);
    assetsBackendApiService = jasmine.createSpyObj('AssetsBackendApiService', [
      'getThumbnailUrlForPreview',
    ]);
    i18nLanguageCodeService = jasmine.createSpyObj('I18nLanguageCodeService', [
      'isCurrentLanguageRTL',
    ]);
    i18nLanguageCodeService.onI18nLanguageCodeChange =
      new EventEmitter<string>();
    chapterProgressLoaderService = jasmine.createSpyObj(
      'ChapterProgressLoaderService',
      [
        'getChapterProgressSummary',
        'getLessonProgress',
        'loadChapterProgressForStory',
      ]
    );
    chapterProgressLoaderService.loadChapterProgressForStory.and.resolveTo();
    topicSessionFallbackLanguageService = jasmine.createSpyObj(
      'TopicSessionFallbackLanguageService',
      ['clearSelection']
    );
    chapterLabelVisibilityService = jasmine.createSpyObj(
      'ChapterLabelVisibilityService',
      ['isNewChapterLabelVisible']
    );
    chapterLabelVisibilityService.isNewChapterLabelVisible.and.returnValue(
      false
    );
    localStorageService = jasmine.createSpyObj('LocalStorageService', [
      'getSkippedAdventures',
      'updateSkippedAdventures',
      'getMasteredAdventures',
      'updateMasteredAdventures',
    ]);
    localStorageService.getSkippedAdventures.and.returnValue([]);
    localStorageService.getMasteredAdventures.and.returnValue([]);
    platformFeatureService = {
      status: {
        SerialChapterLaunchLearnerView: {
          isEnabled: false,
        },
      },
    };
    windowRef = {
      nativeWindow: {
        confirm: jasmine.createSpy('confirm').and.returnValue(true),
      },
    };
    ngbModal = jasmine.createSpyObj('NgbModal', ['open']);
    ngbModal.open.and.returnValue({
      componentInstance: {},
      result: new Promise(() => {}),
    } as NgbModalRef);
    bottomSheet = jasmine.createSpyObj('MatBottomSheet', ['open']);
    windowDimensionsService = jasmine.createSpyObj('WindowDimensionsService', [
      'getWidth',
    ]);
    windowDimensionsService.getWidth.and.returnValue(1024);

    TestBed.configureTestingModule({
      declarations: [TopicStorySectionComponent, MockTranslatePipe],
      providers: [
        {provide: UrlService, useValue: urlService},
        {provide: UrlInterpolationService, useValue: urlInterpolationService},
        {provide: AssetsBackendApiService, useValue: assetsBackendApiService},
        {provide: I18nLanguageCodeService, useValue: i18nLanguageCodeService},
        {
          provide: ChapterProgressLoaderService,
          useValue: chapterProgressLoaderService,
        },
        {
          provide: TopicSessionFallbackLanguageService,
          useValue: topicSessionFallbackLanguageService,
        },
        {
          provide: ChapterLabelVisibilityService,
          useValue: chapterLabelVisibilityService,
        },
        {
          provide: LocalStorageService,
          useValue: localStorageService,
        },
        {
          provide: PlatformFeatureService,
          useValue: platformFeatureService,
        },
        {
          provide: WindowRef,
          useValue: windowRef,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: NgbModal,
          useValue: ngbModal,
        },
        {
          provide: MatBottomSheet,
          useValue: bottomSheet,
        },
        {
          provide: WindowDimensionsService,
          useValue: windowDimensionsService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicStorySectionComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);
    spyOn(translateService, 'instant').and.callThrough();

    urlService.getClassroomUrlFragmentFromLearnerUrl.and.returnValue('math');
    urlService.getTopicUrlFragmentFromLearnerUrl.and.returnValue('topic');
    urlService.getQueryFieldValuesAsList.and.returnValue([]);
    urlService.addField.and.callFake(
      (url: string, key: string, value: string | number) =>
        `${url}?${key}=${value}`
    );

    urlInterpolationService.getStaticImageUrl.and.callFake((p: string) => {
      return `/assets/images${p}`;
    });
    urlInterpolationService.getStaticCopyrightedImageUrl.and.callFake(
      (p: string) => `/assets/copyrighted-images${p}`
    );
    urlInterpolationService.interpolateUrl.and.callFake(
      (template: string, params: Record<string, string>) => {
        let url = template;
        for (const [key, value] of Object.entries(params)) {
          url = url.replace(`<${key}>`, value);
        }
        url = url.replace('<exp_id>', 'exp_1');
        return url;
      }
    );

    assetsBackendApiService.getThumbnailUrlForPreview.and.returnValue(
      '/thumbnail/story/story_id/thumb.png'
    );

    (
      i18nLanguageCodeService.isCurrentLanguageRTL as jasmine.Spy
    ).and.returnValue(false);

    component.storySummary = createStorySummarySpy([], []);

    chapterProgressLoaderService.getChapterProgressSummary.and.returnValue(
      null
    );
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  const createStorySummarySpy = (
    nodeTitles: string[],
    nodes: jasmine.SpyObj<StoryNode>[],
    arcs: object[] = []
  ): jasmine.SpyObj<StorySummary> => {
    const storySummarySpy = jasmine.createSpyObj('StorySummary', [
      'getTitle',
      'getDescription',
      'getNodeTitles',
      'getAllNodes',
      'getId',
      'getUrlFragment',
      'getArcs',
      'isNodeCompleted',
      'getCompletedNodeTitles',
      'getVisitedChapterTitles',
    ]);

    storySummarySpy.getTitle.and.returnValue('Story Title');
    storySummarySpy.getDescription.and.returnValue('Story Description');
    storySummarySpy.getNodeTitles.and.returnValue(nodeTitles);
    storySummarySpy.getAllNodes.and.returnValue(nodes);
    storySummarySpy.getId.and.returnValue('story_id_1');
    storySummarySpy.getUrlFragment.and.returnValue('story-url-fragment');
    storySummarySpy.getArcs.and.returnValue(arcs);
    storySummarySpy.isNodeCompleted.and.returnValue(false);
    storySummarySpy.getCompletedNodeTitles.and.returnValue([]);
    storySummarySpy.getVisitedChapterTitles.and.returnValue([]);

    return storySummarySpy as jasmine.SpyObj<StorySummary>;
  };

  const createStoryNodeSpy = (
    title: string,
    description: string,
    explorationId: string | null,
    nodeId: string,
    thumbnailFilename: string | null = null,
    options: {
      status?: string | null;
      textLanguageCodes?: string[];
    } = {}
  ): jasmine.SpyObj<StoryNode> => {
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getStatus',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue(title);
    storyNodeSpy.getDescription.and.returnValue(description);
    storyNodeSpy.getThumbnailFilename.and.returnValue(thumbnailFilename);
    storyNodeSpy.getExplorationId.and.returnValue(explorationId);
    storyNodeSpy.getId.and.returnValue(nodeId);
    storyNodeSpy.getStatus.and.returnValue(options.status);
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(
      options.textLanguageCodes ?? []
    );
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    return storyNodeSpy;
  };

  const createLessonCard = (
    lessonNumber: number,
    lessonProgressStatus:
      | 'not_started'
      | 'in_progress'
      | 'completed'
      | 'coming_soon'
  ) => ({
    lessonNumber: lessonNumber,
    lessonTitle: 'Lesson ' + lessonNumber,
    lessonDescription: '',
    thumbnailUrl: '',
    startUrl: '',
    practiceUrl: '',
    nodeId: 'node_' + lessonNumber,
    lessonProgressStatus: lessonProgressStatus,
    totalCheckpointsCount: 0,
    visitedCheckpointsCount: 0,
    isComingSoon: false,
    isPublished: true,
    isNewLabelVisible: false,
    availableTextLanguageCodes: [],
    availableVoiceoverLanguageCodes: [],
    availableVoiceoverLanguageAccentDescriptions: {},
  });

  const createAdventureGroup = (
    adventureTitle: string,
    lessonCards: ReturnType<typeof createLessonCard>[]
  ) => ({
    adventureTitle: adventureTitle,
    adventureDescription: '',
    lessonCards: lessonCards,
    accentColor: '#27a844',
    iconBg: '',
    headerBackgroundColor: '',
    headerBorderColor: '',
    arcId: '1',
  });

  it('should expose story meta text helpers', () => {
    component.lessonCount = 2;
    component.practiceCount = 1;

    expect(component.getStoryMetaText()).toBe('2 lessons');
    expect(component.getStoryMetaAriaLabel()).toBe('2 lessons available');
  });

  it('should set study guide url on init', () => {
    component.ngOnInit();

    expect(component.studyGuideUrl).toBe('/learn/math/topic/studyguide');
  });

  it('should fallback avatar image on error', () => {
    const primary = component.oppiaAvatarImageUrl;
    component.onAvatarImageError();
    expect(component.oppiaAvatarImageUrl).not.toBe(primary);
    expect(component.oppiaAvatarImageUrl).toContain(
      '/assets/copyrighted-images/general/collection_mascot.svg'
    );
  });

  it('should build adventure groups when story has arcs', () => {
    const storyNodeSpy1 = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      null
    );

    const storyNodeSpy2 = createStoryNodeSpy(
      'Node title 2',
      'Node description 2',
      'exp_2',
      'node_2',
      null
    );

    const arcs = [
      {
        id: 'arc_1',
        title: 'Adventure 1',
        description: 'First adventure',
        node_ids: ['node_1'],
      },
      {
        id: 'arc_2',
        title: 'Adventure 2',
        description: 'Second adventure',
        node_ids: ['node_2'],
      },
    ];

    component.storySummary = createStorySummarySpy(
      ['Node title 1', 'Node title 2'],
      [storyNodeSpy1, storyNodeSpy2],
      arcs
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.adventureGroups.length).toBe(2);
    expect(component.adventureGroups[0].adventureTitle).toBe('Adventure 1');
    expect(component.adventureGroups[0].arcId).toBe('1');
    expect(component.adventureGroups[0].lessonCards.length).toBe(1);
    expect(component.adventureGroups[0].lessonCards[0].lessonTitle).toContain(
      'Node title 1'
    );
    expect(component.adventureGroups[1].adventureTitle).toBe('Adventure 2');
    expect(component.adventureGroups[1].arcId).toBe('2');
    expect(component.adventureGroups[1].lessonCards.length).toBe(1);
    expect(component.adventureGroups[1].lessonCards[0].lessonTitle).toContain(
      'Node title 2'
    );
  });

  it('should build lesson cards from storySummary and not create practice card', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {
        textLanguageCodes: ['en'],
      }
    );

    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(1);
    expect(component.lessonCards[0].thumbnailUrl).toBe(
      '/thumbnail/story/story_id/thumb.png'
    );
    expect(component.lessonCards[0].lessonProgressStatus).toBe('not_started');
    expect(component.isPracticeCardVisible).toBe(false);
  });

  it('should mark lesson as completed when node is completed', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {
        textLanguageCodes: ['en'],
      }
    );

    const storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    storySummary.isNodeCompleted.and.callFake(
      (title: string) => title === 'Node title 1'
    );
    storySummary.getCompletedNodeTitles.and.returnValue(['Node title 1']);

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(1);
    expect(component.lessonCards[0].lessonProgressStatus).toBe('completed');
  });

  it('should mark lesson as in_progress when node is visited but not completed', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {
        textLanguageCodes: ['en'],
      }
    );

    const storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    storySummary.getVisitedChapterTitles.and.returnValue(['Node title 1']);

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(1);
    expect(component.lessonCards[0].lessonProgressStatus).toBe('in_progress');
  });

  it('should load checkpoint counts from chapter progress service on init', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {
        textLanguageCodes: ['en'],
      }
    );

    const mockSummary = new ChapterProgressSummary('exp_1', 5, 3, false);
    chapterProgressLoaderService.getChapterProgressSummary.and.returnValue(
      mockSummary
    );

    const storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.lessonCards.length).toBe(1);
    expect(component.lessonCards[0].totalCheckpointsCount).toBe(5);
    expect(component.lessonCards[0].visitedCheckpointsCount).toBe(3);
  });

  it('should preserve checkpoint counts after non-story input changes', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {
        textLanguageCodes: ['en'],
      }
    );

    const mockSummary = new ChapterProgressSummary('exp_1', 3, 1, false);
    chapterProgressLoaderService.getChapterProgressSummary.and.returnValue(
      mockSummary
    );

    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceCount = 0;

    component.ngOnInit();
    expect(component.lessonCards[0].totalCheckpointsCount).toBe(3);
    expect(component.lessonCards[0].visitedCheckpointsCount).toBe(1);

    component.practiceCount = 1;
    component.ngOnChanges({
      practiceCount: new SimpleChange(0, 1, false),
    });

    expect(component.lessonCards[0].totalCheckpointsCount).toBe(3);
    expect(component.lessonCards[0].visitedCheckpointsCount).toBe(1);
  });

  it('should show adventure-end-test card when lesson cards exist and practice is enabled', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {
        textLanguageCodes: ['en'],
      }
    );

    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    component.lessonCount = 1;
    component.practiceCount = 1;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(1);
    expect(component.isPracticeCardVisible).toBe(true);
  });

  it('should create practice card only when there are zero lessons', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.lessonCount = 0;
    component.practiceCount = 1;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(0);
    expect(component.isPracticeCardVisible).toBe(true);
    expect(component.practiceCard.studyUrl).toBe(
      '/learn/math/topic/studyguide'
    );
  });

  it('should use fallback practice session url when fragments are missing', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.lessonCount = 0;
    component.practiceCount = 1;
    urlService.getClassroomUrlFragmentFromLearnerUrl.and.returnValue('');
    urlService.getTopicUrlFragmentFromLearnerUrl.and.returnValue('');
    component.classroomUrlFragment = '';
    component.topicUrlFragment = '';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(0);
    expect(component.isPracticeCardVisible).toBe(true);
    expect(component.practiceCard.practiceUrl).toBe('#');
  });

  it('should use fallback practice session url when no subtopic id present', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.lessonCount = 0;
    component.practiceCount = 1;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceSubtopicIds = [];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(0);
    expect(component.isPracticeCardVisible).toBe(true);
    expect(component.practiceCard.practiceUrl).toBe('#');
  });

  it('should build lesson start url with all fields when exploration id present', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      null,
      {
        textLanguageCodes: ['en'],
      }
    );

    const storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(1);
    const startUrl = component.lessonCards[0].startUrl;
    expect(startUrl).toContain('/explore/exp_1');
    expect(startUrl).toContain('?node_id=node_1');
    expect(startUrl).toContain('?story_url_fragment=story-url-fragment');
  });

  it('should fallback lesson thumbnail when story id is missing', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      null,
      'node_1',
      'thumb.png',
      {
        textLanguageCodes: ['en'],
      }
    );

    const storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    storySummary.getId.and.returnValue(null);

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(1);
    expect(component.lessonCards[0].thumbnailUrl).toContain(
      '/assets/images/splash/student_desk1x.webp'
    );
  });

  it('should not change avatar when already using fallback', () => {
    component.oppiaAvatarImageUrl =
      '/assets/copyrighted-images/general/collection_mascot.svg';
    component.onAvatarImageError();
    expect(component.oppiaAvatarImageUrl).toContain(
      '/assets/copyrighted-images/general/collection_mascot.svg'
    );
  });

  it('should respect RTL language flag', () => {
    (
      i18nLanguageCodeService.isCurrentLanguageRTL as jasmine.Spy
    ).and.returnValue(true);
    expect(component.isLanguageRTL()).toBe(true);
  });

  it('should clear fallback selection when language changes', () => {
    component.ngOnInit();
    topicSessionFallbackLanguageService.clearSelection.calls.reset();

    i18nLanguageCodeService.onI18nLanguageCodeChange.emit('es');

    expect(
      topicSessionFallbackLanguageService.clearSelection
    ).toHaveBeenCalledTimes(1);

    component.ngOnDestroy();
    i18nLanguageCodeService.onI18nLanguageCodeChange.emit('fr');
    expect(
      topicSessionFallbackLanguageService.clearSelection
    ).toHaveBeenCalledTimes(1);
  });

  it('should correctly singularize lesson and practice counts', () => {
    component.lessonCount = 1;
    component.practiceCount = 1;
    expect(component.getLessonCountText()).toBe('1 lesson');
    expect(component.getPracticeCountText()).toBe('1 practice');
    expect(component.getStoryMetaAriaLabel()).toBe('1 lesson available');
  });

  it('should pluralize practice count text', () => {
    component.practiceCount = 2;
    expect(component.getPracticeCountText()).toBe('2 practices');
  });

  it('should construct practice card url when arcs and fragments are present', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {
        textLanguageCodes: ['en'],
      }
    );

    const storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'place-values';
    component.practiceCount = 1;
    component.practiceSubtopicIds = [3];
    component.practiceCount = 1;

    component.ngOnInit();

    expect(component.isPracticeCardVisible).toBe(true);
    expect(component.practiceCard.practiceUrl).toContain('test/arc/1');
  });

  it('should use positional arc id in practice card url for non-numeric arc ids', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {
        textLanguageCodes: ['en'],
      }
    );

    const storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy],
      [
        {
          id: 'default_arc',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'add';
    component.practiceCount = 1;
    component.practiceSubtopicIds = [3];

    component.ngOnInit();

    expect(component.isPracticeCardVisible).toBe(true);
    expect(component.practiceCard.practiceUrl).toContain('add/test/arc/1');
    expect(component.practiceCard.practiceUrl).not.toContain(
      'add/test/arc/arc'
    );
  });

  it('should return correct practice title for each adventure index', () => {
    expect(component.getPracticeTitle(0)).toBe('Adventure 1 Review & Test');
    expect(component.getPracticeTitle(1)).toBe('Adventure 2 Review & Test');
    expect(component.getPracticeTitle(2)).toBe('Adventure 3 Review & Test');
  });

  it('should return correct practice description with unlock message for non-last adventures', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'not_started')]),
      createAdventureGroup('Adventure 2', [createLessonCard(2, 'not_started')]),
    ];

    expect(component.getPracticeDescription(0)).toBe(
      'Test what you have learned in Adventure 1 to unlock Adventure 2.'
    );
    expect(component.getPracticeDescription(1)).toBe(
      'Test what you have learned in Adventure 2.'
    );
  });

  it('should return correct practice description without unlock for last adventure', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'not_started')]),
      createAdventureGroup('Adventure 2', [createLessonCard(2, 'not_started')]),
      createAdventureGroup('Adventure 3', [createLessonCard(3, 'not_started')]),
    ];

    expect(component.getPracticeDescription(2)).toBe(
      'Test what you have learned in Adventure 3.'
    );
  });

  it('should not create practice card when practice count is zero', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.lessonCount = 0;
    component.practiceCount = 0;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'place-values';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(0);
    expect(component.isPracticeCardVisible).toBe(false);
  });

  it('should use empty string when story description is missing', () => {
    const storySummary = createStorySummarySpy([], []);
    storySummary.getDescription.and.returnValue(null);

    component.storySummary = storySummary;
    component.lessonCount = 0;
    component.practiceCount = 0;

    component.ngOnInit();

    expect(component.storyDescription).toBe('');
  });

  it('should sync on relevant ngOnChanges input updates', () => {
    component.classroomUrlFragment = 'science';

    component.ngOnChanges({
      storySummary: new SimpleChange(null, null, false),
    });

    expect(component.studyGuideUrl).toBe('/learn/science/topic/studyguide');
  });

  it('should not sync on unrelated ngOnChanges input updates', () => {
    component.studyGuideUrl = 'unchanged-value';

    component.ngOnChanges({
      practiceSubtopicIds: new SimpleChange([], [1], false),
    });

    expect(component.studyGuideUrl).toBe('unchanged-value');
  });

  it('should toggle adventure expansion state', () => {
    expect(component.isAdventureExpanded(0)).toBe(false);

    component.toggleAdventure(0);
    expect(component.isAdventureExpanded(0)).toBe(true);

    component.toggleAdventure(0);
    expect(component.isAdventureExpanded(0)).toBe(false);
  });

  it('should ignore arc node ids not present in all nodes', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      null
    );

    const arcs = [
      {
        id: 'arc_1',
        title: 'Adventure 1',
        description: 'First adventure',
        node_ids: ['missing_node_id'],
      },
    ];

    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy],
      arcs
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.adventureGroups.length).toBe(1);
    expect(component.adventureGroups[0].lessonCards).toEqual([]);
  });

  it('should return # as startUrl when exploration id is null', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      null,
      'node_1',
      null,
      {
        textLanguageCodes: ['en'],
      }
    );

    const storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].startUrl).toBe('#');
  });

  it('should handle chapter progress loader failure gracefully', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {
        textLanguageCodes: ['en'],
      }
    );

    chapterProgressLoaderService.loadChapterProgressForStory.and.rejectWith(
      new Error('Network error')
    );

    const storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.lessonCards.length).toBe(1);
    expect(component.lessonCards[0].lessonTitle).toBe('Node title 1');
  });

  it('should handle loadChapterProgress with no exploration IDs gracefully', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      null,
      'node_1',
      null,
      {
        textLanguageCodes: ['en'],
      }
    );

    const storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.lessonCards.length).toBe(1);
    expect(component.lessonCards[0].totalCheckpointsCount).toBe(0);
  });

  it('should handle an empty node number when loading chapter progress', fakeAsync(() => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    tick();

    expect(component.lessonCards[0].practiceUrl).toContain(
      '/learn/math/topic/practice/'
    );
  }));

  it('should return empty string for getAdventureCompletionText with invalid index', () => {
    expect(component.getAdventureCompletionText(999)).toBe('');
  });

  it('should return correct adventure completion text', () => {
    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );

    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    const storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1', 'node_2'],
        },
      ]
    );
    storySummary.isNodeCompleted.and.callFake(
      (title: string) => title === 'Node 1'
    );
    storySummary.getCompletedNodeTitles.and.returnValue(['Node 1']);

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.getAdventureCompletionText(0)).toBe('1 of 2 completed');
  });

  it('should return practiceCount text without practice when practiceCount is 0', () => {
    component.lessonCount = 3;
    component.practiceCount = 0;
    expect(component.getStoryMetaText()).toBe('3 lessons');
    expect(component.getStoryMetaAriaLabel()).toBe('3 lessons available');
  });

  it('should mark lesson as coming_soon when exploration id is null', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Coming Soon Node',
      'Description',
      null,
      'node_1',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Coming Soon Node'],
      [storyNodeSpy]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].lessonProgressStatus).toBe('coming_soon');
    expect(component.lessonCards[0].startUrl).toBe('#');
  });

  it('should mark ready-to-publish lesson as coming soon when serial learner flag is enabled', () => {
    platformFeatureService.status.SerialChapterLaunchLearnerView.isEnabled =
      true;
    const storyNodeSpy = createStoryNodeSpy(
      'Coming Soon Node',
      'Description',
      'exp_1',
      'node_1',
      null,
      {
        status: 'Ready To Publish',
      }
    );

    component.storySummary = createStorySummarySpy(
      ['Coming Soon Node'],
      [storyNodeSpy]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].lessonProgressStatus).toBe('coming_soon');
    expect(component.comingSoonLessonCards.length).toBe(1);
    expect(component.availableLessonCards.length).toBe(0);
  });

  it('should use chapter label visibility service for new lesson labels', () => {
    chapterLabelVisibilityService.isNewChapterLabelVisible.and.returnValue(
      true
    );
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {
        textLanguageCodes: ['en'],
      }
    );

    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].isNewLabelVisible).toBe(true);
  });

  it('should not call loadChapterProgress on first change of storySummary', () => {
    chapterProgressLoaderService.loadChapterProgressForStory.calls.reset();
    component.ngOnChanges({
      storySummary: new SimpleChange(null, null, true),
    });
    expect(
      chapterProgressLoaderService.loadChapterProgressForStory
    ).not.toHaveBeenCalled();
  });

  it('should call loadChapterProgress on non-first change of storySummary', async () => {
    chapterProgressLoaderService.loadChapterProgressForStory.calls.reset();
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );
    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnChanges({
      storySummary: new SimpleChange(null, component.storySummary, false),
    });
    await fixture.whenStable();

    expect(
      chapterProgressLoaderService.loadChapterProgressForStory
    ).toHaveBeenCalled();
  });

  it('should return empty adventure groups when arcs are empty', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );
    component.storySummary = createStorySummarySpy(
      ['Node'],
      [storyNodeSpy],
      []
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.adventureGroups).toEqual([]);
    expect(component.visibleAdventureGroups).toEqual([]);
  });

  it('should select first lesson as active when all lessons are completed', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Completed Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );

    const storySummary = createStorySummarySpy(
      ['Completed Node'],
      [storyNodeSpy]
    );
    storySummary.isNodeCompleted.and.returnValue(true);
    storySummary.getCompletedNodeTitles.and.returnValue(['Completed Node']);

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.activeLessonNumber).toBe(1);
    expect(component.lessonCards[0].lessonProgressStatus).toBe('completed');
  });

  it('should handle lesson thumbnail url when node has no thumbnail and story has no id', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );

    const storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    storySummary.getId.and.returnValue(null);

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].thumbnailUrl).toContain(
      '/assets/images/splash/student_desk1x.webp'
    );
  });

  it('should return # as lesson start url when classroom or topic fragment is missing', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );

    urlService.getClassroomUrlFragmentFromLearnerUrl.and.returnValue('');
    urlService.getTopicUrlFragmentFromLearnerUrl.and.returnValue('');

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = '';
    component.topicUrlFragment = '';

    component.ngOnInit();

    expect(component.lessonCards[0].startUrl).toBe('#');
  });

  it('should handle adventure navigation lesson selected', fakeAsync(() => {
    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );

    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1', 'node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.lessonWrappers = new QueryList<ElementRef>();
    component.lessonWrappers.reset([]);

    component.onNavigationLessonSelected({lessonNumber: 2, adventureIndex: 0});

    expect(component.activeLessonNumber).toBe(2);
    expect(component.navigatedLessonNumber).toBe(2);
    expect(component.isAdventureExpanded(0)).toBe(true);

    tick(300);
  }));

  it('should restore skipped adventures from localStorage on init', () => {
    localStorageService.getSkippedAdventures.and.returnValue([0]);

    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );

    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(localStorageService.getSkippedAdventures).toHaveBeenCalledWith(
      'story_id_1'
    );
    expect(component.isAdventureSkipped(0)).toBe(true);
    expect(component.isAdventureSkipped(1)).toBe(false);
    expect(component.isAdventureExpanded(0)).toBe(false);
    expect(component.isAdventureExpanded(1)).toBe(true);
  });

  it('should auto-expand first adventure when all adventures are skipped', () => {
    localStorageService.getSkippedAdventures.and.returnValue([0, 1]);

    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );

    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.isAdventureSkipped(0)).toBe(true);
    expect(component.isAdventureSkipped(1)).toBe(true);
    expect(component.isAdventureExpanded(0)).toBe(true);
  });

  it('should persist skipped adventures when proceeding with skip confirmation', fakeAsync(() => {
    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );

    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.lessonWrappers = new QueryList<ElementRef>();
    component.lessonWrappers.reset([]);

    component.onNavigationLessonSelected({lessonNumber: 2, adventureIndex: 1});

    expect(ngbModal.open).toHaveBeenCalledWith(
      ArcSkipConfirmationModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-arc-skip-confirmation-modal',
      }
    );
    expect(localStorageService.updateSkippedAdventures).not.toHaveBeenCalled();

    component.onArcSkipConfirmationProceed();

    expect(component.isAdventureSkipped(0)).toBe(true);
    expect(localStorageService.updateSkippedAdventures).toHaveBeenCalledWith(
      'story_id_1',
      [0]
    );

    tick(300);
  }));

  it('should clear skip confirmation state on cancel', () => {
    const mockModalRef = {
      result: Promise.resolve(),
      componentInstance: {},
    } as NgbModalRef;
    ngbModal.open.and.returnValue(mockModalRef);
    component.onNavigationLessonSelected({lessonNumber: 2, adventureIndex: 1});

    component.onArcSkipConfirmationCancel();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should cancel skip confirmation on proceed when there is no pending navigation', () => {
    const mockModalRef = {
      result: Promise.resolve(),
      componentInstance: {},
    } as NgbModalRef;
    ngbModal.open.and.returnValue(mockModalRef);
    component.onNavigationLessonSelected({lessonNumber: 2, adventureIndex: 1});

    component.onArcSkipConfirmationProceed();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should not show skip confirmation when all earlier adventures are completed', fakeAsync(() => {
    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );

    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    const storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_2'],
        },
      ]
    );
    storySummary.isNodeCompleted.and.callFake(
      (title: string) => title === 'Node 1'
    );

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.isAdventureCompleted(0)).toBe(true);
    expect(component.isAdventureCompleted(1)).toBe(false);

    component.lessonWrappers = new QueryList<ElementRef>();
    component.lessonWrappers.reset([]);

    component.onNavigationLessonSelected({lessonNumber: 2, adventureIndex: 1});

    expect(ngbModal.open).not.toHaveBeenCalled();
    expect(component.activeLessonNumber).toBe(2);
    expect(component.navigatedLessonNumber).toBe(2);
    expect(component.isAdventureExpanded(1)).toBe(true);

    tick(300);
  }));

  it('should persist un-skipping when a skipped adventure is expanded', () => {
    component.skippedAdventureIndices = new Set([0]);

    component.toggleAdventure(0);

    expect(component.isAdventureSkipped(0)).toBe(false);
    expect(localStorageService.updateSkippedAdventures).toHaveBeenCalledWith(
      'story_id_1',
      []
    );
  });

  it('should build singular skip confirmation message for one skipped adventure', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'not_started')]),
      createAdventureGroup('Adventure 2', [createLessonCard(2, 'not_started')]),
    ];

    component.onNavigationLessonSelected({lessonNumber: 2, adventureIndex: 1});

    expect(ngbModal.open).toHaveBeenCalledWith(
      ArcSkipConfirmationModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-arc-skip-confirmation-modal',
      }
    );
    expect(component.getArcSkipConfirmationMessage()).toBe(
      'I18N_TOPIC_VIEWER_ARC_SKIP_CONFIRMATION_MESSAGE'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_ARC_SKIP_CONFIRMATION_MESSAGE',
      {count: 1, adventureNumbers: '1', messageFormat: true}
    );
  });

  it('should build plural skip confirmation message for two skipped adventures', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'not_started')]),
      createAdventureGroup('Adventure 2', [createLessonCard(2, 'not_started')]),
      createAdventureGroup('Adventure 3', [createLessonCard(3, 'not_started')]),
    ];

    component.onNavigationLessonSelected({lessonNumber: 3, adventureIndex: 2});

    expect(component.getArcSkipConfirmationMessage()).toBe(
      'I18N_TOPIC_VIEWER_ARC_SKIP_CONFIRMATION_MESSAGE'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_ARC_SKIP_CONFIRMATION_MESSAGE',
      {count: 2, adventureNumbers: '1 and 2', messageFormat: true}
    );
  });

  it('should build comma-separated skip confirmation message for three skipped adventures', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'not_started')]),
      createAdventureGroup('Adventure 2', [createLessonCard(2, 'not_started')]),
      createAdventureGroup('Adventure 3', [createLessonCard(3, 'not_started')]),
      createAdventureGroup('Adventure 4', [createLessonCard(4, 'not_started')]),
    ];

    component.onNavigationLessonSelected({lessonNumber: 4, adventureIndex: 3});

    expect(component.getArcSkipConfirmationMessage()).toBe(
      'I18N_TOPIC_VIEWER_ARC_SKIP_CONFIRMATION_MESSAGE'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_ARC_SKIP_CONFIRMATION_MESSAGE',
      {count: 3, adventureNumbers: '1, 2, and 3', messageFormat: true}
    );
  });

  it('should exclude completed adventures from the skip confirmation message', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'completed')]),
      createAdventureGroup('Adventure 2', [createLessonCard(2, 'not_started')]),
      createAdventureGroup('Adventure 3', [createLessonCard(3, 'not_started')]),
    ];

    component.onNavigationLessonSelected({lessonNumber: 3, adventureIndex: 2});

    expect(component.getArcSkipConfirmationMessage()).toBe(
      'I18N_TOPIC_VIEWER_ARC_SKIP_CONFIRMATION_MESSAGE'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_ARC_SKIP_CONFIRMATION_MESSAGE',
      {count: 1, adventureNumbers: '2', messageFormat: true}
    );
  });

  it('should return empty skip confirmation message when there is no pending navigation', () => {
    expect(component.getArcSkipConfirmationMessage()).toBe('');
  });

  it('should return empty skip confirmation message when no earlier adventures are skipped', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'not_started')]),
      createAdventureGroup('Adventure 2', [createLessonCard(2, 'not_started')]),
    ];

    component.onNavigationLessonSelected({lessonNumber: 2, adventureIndex: 1});
    expect(ngbModal.open).toHaveBeenCalledWith(
      ArcSkipConfirmationModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-arc-skip-confirmation-modal',
      }
    );

    component.visibleAdventureGroups[0].lessonCards[0].lessonProgressStatus =
      'completed';

    expect(component.getArcSkipConfirmationMessage()).toBe('');
  });

  it('should return Start label for a skipped adventure that was never started', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'not_started')]),
    ];

    expect(component.getSkippedAdventureButtonLabel(0)).toBe(
      'I18N_TOPIC_VIEWER_ADVENTURE_START_BUTTON'
    );
  });

  it('should return Resume label for a skipped adventure that was started', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'in_progress')]),
    ];

    expect(component.getSkippedAdventureButtonLabel(0)).toBe(
      'I18N_TOPIC_VIEWER_ADVENTURE_RESUME_BUTTON'
    );
  });

  it('should return Start label when the adventure group is missing', () => {
    component.visibleAdventureGroups = [];

    expect(component.getSkippedAdventureButtonLabel(0)).toBe(
      'I18N_TOPIC_VIEWER_ADVENTURE_START_BUTTON'
    );
  });

  it('should not persist or restore skipped adventures when story id is missing', () => {
    (component.storySummary.getId as jasmine.Spy).and.returnValue('');
    localStorageService.getSkippedAdventures.calls.reset();
    localStorageService.updateSkippedAdventures.calls.reset();

    component.skippedAdventureIndices = new Set([0]);
    component.toggleAdventure(0);

    expect(localStorageService.updateSkippedAdventures).not.toHaveBeenCalled();

    component.ngOnInit();

    expect(localStorageService.getSkippedAdventures).not.toHaveBeenCalled();
  });

  it('should select first not_started lesson as active when no in_progress', () => {
    const storyNodeSpy1 = createStoryNodeSpy(
      'Completed Node',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );

    const storyNodeSpy2 = createStoryNodeSpy(
      'Not Started Node',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    const storySummary = createStorySummarySpy(
      ['Completed Node', 'Not Started Node'],
      [storyNodeSpy1, storyNodeSpy2]
    );
    storySummary.isNodeCompleted.and.callFake(
      (title: string) => title === 'Completed Node'
    );
    storySummary.getCompletedNodeTitles.and.returnValue(['Completed Node']);

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.activeLessonNumber).toBe(2);
  });

  it('should return null active lesson when there are no lesson cards', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.activeLessonNumber).toBeNull();
  });

  it('should handle adventure groups with palette color cycling', () => {
    const storyNodeSpies = [];
    const nodeIds = [];
    for (let i = 0; i < 16; i++) {
      const spy = jasmine.createSpyObj('StoryNode', [
        'getTitle',
        'getDescription',
        'getThumbnailFilename',
        'getExplorationId',
        'getId',
        'getAvailableTextLanguageCodes',
        'getAvailableVoiceoverLanguageCodes',
        'getAvailableVoiceoverLanguageAccentDescriptions',
      ]);
      spy.getTitle.and.returnValue(`Node ${i}`);
      spy.getDescription.and.returnValue(`Desc ${i}`);
      spy.getThumbnailFilename.and.returnValue(null);
      spy.getExplorationId.and.returnValue(`exp_${i}`);
      spy.getId.and.returnValue(`node_${i}`);
      spy.getAvailableTextLanguageCodes.and.returnValue([]);
      spy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
      spy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue({});
      storyNodeSpies.push(spy);
      nodeIds.push(`node_${i}`);
    }

    const arcs = nodeIds.map((nodeId, i) => ({
      id: `arc_${i}`,
      title: `Adventure ${i}`,
      description: `Adventure ${i} desc`,
      node_ids: [nodeId],
    }));

    component.storySummary = createStorySummarySpy(
      nodeIds.map((_, i) => `Node ${i}`),
      storyNodeSpies,
      arcs
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.adventureGroups.length).toBe(16);
    expect(component.adventureGroups[0].accentColor).toBe('#27a844');
    expect(component.adventureGroups[14].accentColor).toBe('#2e7d32');
    expect(component.adventureGroups[15].accentColor).toBe('#27a844');
  });

  it('should not expand any adventure when no adventure groups exist', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.isAdventureExpanded(0)).toBe(false);
  });

  it('should return isPracticeCardVisible from shouldShowAdventureEndTestCard', () => {
    component.isPracticeCardVisible = true;
    expect(component.shouldShowAdventureEndTestCard(0)).toBe(true);

    component.isPracticeCardVisible = false;
    expect(component.shouldShowAdventureEndTestCard(0)).toBe(false);
  });

  it('should report story as completed only when all available lessons are completed', () => {
    const baseLesson = {
      lessonTitle: 'Lesson',
      lessonDescription: '',
      thumbnailUrl: '',
      startUrl: '/explore/1',
      practiceUrl: '',
      nodeId: 'node_1',
      lessonProgressStatus: 'completed' as const,
      totalCheckpointsCount: 0,
      visitedCheckpointsCount: 0,
      isComingSoon: false,
      isPublished: true,
      isNewLabelVisible: false,
      availableTextLanguageCodes: [],
      availableVoiceoverLanguageCodes: [],
      availableVoiceoverLanguageAccentDescriptions: {},
    };

    component.availableLessonCards = [
      {...baseLesson, lessonNumber: 1},
      {...baseLesson, lessonNumber: 2},
    ];

    expect(component.isStoryCompleted()).toBe(true);

    component.availableLessonCards = [
      {...baseLesson, lessonNumber: 1},
      {
        ...baseLesson,
        lessonNumber: 2,
        lessonProgressStatus: 'not_started',
      },
    ];

    expect(component.isStoryCompleted()).toBe(false);
  });

  it('should report story as not completed when no available lessons exist', () => {
    component.availableLessonCards = [];

    expect(component.isStoryCompleted()).toBe(false);
  });

  it('should report adventure as completed only when all its lessons are completed', () => {
    const baseLesson = {
      lessonTitle: 'Lesson',
      lessonDescription: '',
      thumbnailUrl: '',
      startUrl: '/explore/1',
      practiceUrl: '',
      nodeId: 'node_1',
      lessonProgressStatus: 'completed' as const,
      totalCheckpointsCount: 0,
      visitedCheckpointsCount: 0,
      isComingSoon: false,
      isPublished: true,
      isNewLabelVisible: false,
      availableTextLanguageCodes: [],
      availableVoiceoverLanguageCodes: [],
      availableVoiceoverLanguageAccentDescriptions: {},
    };

    component.visibleAdventureGroups = [
      {
        adventureTitle: 'Adventure 1',
        adventureDescription: '',
        lessonCards: [],
        accentColor: '#27a844',
        iconBg: '',
        headerBackgroundColor: '',
        headerBorderColor: '',
        arcId: '1',
      },
      {
        adventureTitle: 'Adventure 2',
        adventureDescription: '',
        lessonCards: [
          {...baseLesson, lessonNumber: 1},
          {...baseLesson, lessonNumber: 2},
        ],
        accentColor: '#27a844',
        iconBg: '',
        headerBackgroundColor: '',
        headerBorderColor: '',
        arcId: '2',
      },
      {
        adventureTitle: 'Adventure 3',
        adventureDescription: '',
        lessonCards: [
          {...baseLesson, lessonNumber: 3},
          {
            ...baseLesson,
            lessonNumber: 4,
            lessonProgressStatus: 'not_started',
          },
        ],
        accentColor: '#27a844',
        iconBg: '',
        headerBackgroundColor: '',
        headerBorderColor: '',
        arcId: '3',
      },
    ];

    expect(component.isAdventureCompleted(0)).toBe(false);
    expect(component.isAdventureCompleted(1)).toBe(true);
    expect(component.isAdventureCompleted(2)).toBe(false);
    expect(component.isAdventureCompleted(99)).toBe(false);
  });

  it('should report that missing or empty adventures have incomplete lessons', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Empty Adventure', []),
    ];

    expect(component.areAllLessonsCompleted(0)).toBeFalsy();
    expect(component.areAllLessonsCompleted(1)).toBeFalsy();
  });

  it('should handle buildAdventureGroups when arcs is null', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );

    const storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    storySummary.getArcs.and.returnValue(null);

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.adventureGroups).toEqual([]);
  });

  it('should sync on storyTitle ngOnChanges input update', () => {
    component.ngOnChanges({
      storyTitle: new SimpleChange('Old Title', 'New Title', false),
    });

    expect(component.studyGuideUrl).toBe('/learn/math/topic/studyguide');
  });

  it('should sync on storyDescription ngOnChanges input update', () => {
    component.ngOnChanges({
      storyDescription: new SimpleChange('Old', 'New', false),
    });

    expect(component.studyGuideUrl).toBe('/learn/math/topic/studyguide');
  });

  it('should sync on classroomUrlFragment ngOnChanges input update', () => {
    component.classroomUrlFragment = 'science';

    component.ngOnChanges({
      classroomUrlFragment: new SimpleChange('', 'science', false),
    });

    expect(component.studyGuideUrl).toBe('/learn/science/topic/studyguide');
  });

  it('should sync on topicUrlFragment ngOnChanges input update', () => {
    component.topicUrlFragment = 'biology';

    component.ngOnChanges({
      topicUrlFragment: new SimpleChange('', 'biology', false),
    });

    expect(component.studyGuideUrl).toBe('/learn/math/biology/studyguide');
  });

  it('should sync on lessonCount ngOnChanges input update', () => {
    component.ngOnChanges({
      lessonCount: new SimpleChange(0, 5, false),
    });

    expect(component.studyGuideUrl).toBe('/learn/math/topic/studyguide');
  });

  it('should return # as lesson start url when only topic fragment is missing', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );

    urlService.getClassroomUrlFragmentFromLearnerUrl.and.returnValue('math');
    urlService.getTopicUrlFragmentFromLearnerUrl.and.returnValue('');

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = '';

    component.ngOnInit();

    expect(component.lessonCards[0].startUrl).toBe('#');
  });

  it('should return # as lesson start url when only classroom fragment is missing', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );

    urlService.getClassroomUrlFragmentFromLearnerUrl.and.returnValue('');
    urlService.getTopicUrlFragmentFromLearnerUrl.and.returnValue('topic');

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = '';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].startUrl).toBe('#');
  });

  it('should not call populateFromInputs on ngOnChanges when only practiceSubtopicIds changes', () => {
    const initialTitle = component.storyTitle;
    component.practiceSubtopicIds = [1];

    component.ngOnChanges({
      practiceSubtopicIds: new SimpleChange([], [1], false),
    });

    expect(component.storyTitle).toBe(initialTitle);
  });

  it('should handle getActiveLessonNumber when visitedChapterTitles is null', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );

    const storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    storySummary.getVisitedChapterTitles.and.returnValue(null);

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].lessonProgressStatus).toBe('not_started');
  });

  it('should populate adventureNavigationGroups with lesson numbers and accent colors', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null,
      {
        status: 'Published',
      }
    );

    component.storySummary = createStorySummarySpy(
      ['Node'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.adventureNavigationGroups.length).toBe(1);
    expect(component.adventureNavigationGroups[0].lessons).toEqual([
      {
        lessonNumber: 1,
        isCompleted: false,
      },
    ]);
    expect(component.adventureNavigationGroups[0].accentColor).toBe('#27a844');
    expect(component.adventureNavigationGroups[0].showPractice).toBe(true);
    expect(component.adventureNavigationGroups[0].isPracticeCompleted).toBe(
      false
    );
  });

  it('should mark completed lessons in adventureNavigationGroups', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Completed Node',
      'Desc',
      'exp_1',
      'node_1',
      null,
      {
        status: 'Published',
      }
    );

    component.storySummary = createStorySummarySpy(
      ['Completed Node'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.returnValue(
      true
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.adventureNavigationGroups[0].lessons).toEqual([
      {
        lessonNumber: 1,
        isCompleted: true,
      },
    ]);
  });

  it('should exclude non-published lessons from adventure navigation groups', () => {
    const publishedNodeSpy = createStoryNodeSpy(
      'Published Node',
      'Desc',
      'exp_1',
      'node_1',
      null,
      {
        status: 'Published',
      }
    );

    const draftNodeSpy = createStoryNodeSpy(
      'Draft Node',
      'Desc',
      'exp_2',
      'node_2',
      null,
      {
        status: 'Draft',
      }
    );

    component.storySummary = createStorySummarySpy(
      ['Published Node', 'Draft Node'],
      [publishedNodeSpy, draftNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.adventureNavigationGroups).toEqual([
      {
        lessons: [{lessonNumber: 1, isCompleted: false}],
        accentColor: '#27a844',
        showPractice: true,
        isPracticeCompleted: false,
        arcId: '1',
      },
    ]);
  });

  it('should handle onNavigationLessonSelected when lesson is not in any adventure', fakeAsync(() => {
    component.storySummary = createStorySummarySpy([], []);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.lessonWrappers = new QueryList<ElementRef>();
    component.lessonWrappers.reset([]);

    component.onNavigationLessonSelected({
      lessonNumber: 999,
      adventureIndex: 0,
    });

    expect(component.activeLessonNumber).toBe(999);
    expect(component.navigatedLessonNumber).toBe(999);

    tick(300);
  }));

  it('should set masteryChallengeUrl from mastery challenge url', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.lessonCount = 0;
    component.practiceCount = 1;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.masteryChallengeUrl).toContain('mastery-challenge');
  });

  it('should set masteryChallengeUrl to # when fragments are missing', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.lessonCount = 0;
    component.practiceCount = 1;
    urlService.getClassroomUrlFragmentFromLearnerUrl.and.returnValue('');
    urlService.getTopicUrlFragmentFromLearnerUrl.and.returnValue('');
    component.classroomUrlFragment = '';
    component.topicUrlFragment = '';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.masteryChallengeUrl).toBe('#');
  });

  it('should populate lessonCount from storySummary on init', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2', 'Node 3'],
      [storyNodeSpy]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.lessonCount).toBe(3);
  });

  it('should populate storyTitle and storyDescription from storySummary', async () => {
    const storySummary = createStorySummarySpy([], []);
    storySummary.getTitle.and.returnValue('My Story Title');
    storySummary.getDescription.and.returnValue('My Story Description');

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.storyTitle).toBe('My Story Title');
    expect(component.storyDescription).toBe('My Story Description');
  });

  it('should set lessonProgressStatus from loadChapterProgress for completed node', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {
        textLanguageCodes: ['en'],
      }
    );

    const storySummary = createStorySummarySpy(['Node 1'], [storyNodeSpy]);
    storySummary.isNodeCompleted.and.returnValue(true);

    chapterProgressLoaderService.getChapterProgressSummary.and.returnValue(
      new ChapterProgressSummary('exp_1', 5, 5, true)
    );

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.lessonCards[0].lessonProgressStatus).toBe('completed');
    expect(component.lessonCards[0].totalCheckpointsCount).toBe(5);
    expect(component.lessonCards[0].visitedCheckpointsCount).toBe(5);
  });

  it('should build lesson practice url with fragments', () => {
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'fractions';

    const practiceUrl = component.getLessonPracticeUrl('1');
    expect(practiceUrl).toContain('fractions/practice/1');
  });

  it('should fallback lesson practice url when fragments are missing', () => {
    component.classroomUrlFragment = '';
    component.topicUrlFragment = '';

    const practiceUrl = component.getLessonPracticeUrl('1');
    expect(practiceUrl).toBe('#');
  });

  it('should build end of arc url with fragments', () => {
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'fractions';

    const arcUrl = component.getEndOfArcUrl('1');
    expect(arcUrl).toContain('fractions/test/arc/1');
  });

  it('should fallback end of arc url when fragments are missing', () => {
    component.classroomUrlFragment = '';
    component.topicUrlFragment = '';

    const arcUrl = component.getEndOfArcUrl('1');
    expect(arcUrl).toBe('#');
  });

  it('should return false from isNewChapterLabelVisible when service throws', () => {
    chapterLabelVisibilityService.isNewChapterLabelVisible.and.throwError(
      'Service error'
    );
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].isNewLabelVisible).toBe(false);
  });

  it('should return false from isChapterPublished when getStatus throws', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );
    storyNodeSpy.getStatus.and.throwError('Status error');

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].isPublished).toBe(false);
  });

  it('should return false from isChapterReadyToPublish when getStatus throws and serial flag enabled', () => {
    platformFeatureService.status.SerialChapterLaunchLearnerView.isEnabled =
      true;
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );
    storyNodeSpy.getStatus.and.throwError('Status error');

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    // When getStatus throws and serial flag is enabled, isComingSoon falls back to false
    // (getExplorationId is set so it won't be coming_soon via the null check)
    expect(component.lessonCards[0].lessonProgressStatus).toBe('not_started');
  });

  it('should show adventure mastered modal when returning from completed arc test', fakeAsync(() => {
    const createNode = (nodeId: string, title: string) => {
      const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
        'getTitle',
        'getDescription',
        'getThumbnailFilename',
        'getExplorationId',
        'getId',
        'getStatus',
        'getAvailableTextLanguageCodes',
        'getAvailableVoiceoverLanguageCodes',
        'getAvailableVoiceoverLanguageAccentDescriptions',
      ]);
      storyNodeSpy.getTitle.and.returnValue(title);
      storyNodeSpy.getDescription.and.returnValue('Desc');
      storyNodeSpy.getThumbnailFilename.and.returnValue(null);
      storyNodeSpy.getExplorationId.and.returnValue('exp_' + nodeId);
      storyNodeSpy.getId.and.returnValue(nodeId);
      storyNodeSpy.getStatus.and.returnValue('Published');
      storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
      storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
      storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
        {}
      );
      return storyNodeSpy;
    };

    const node1 = createNode('node_1', 'Node 1');
    const node2 = createNode('node_2', 'Node 2');
    const node3 = createNode('node_3', 'Node 3');
    const node4 = createNode('node_4', 'Node 4');

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2', 'Node 3', 'Node 4'],
      [node1, node2, node3, node4],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1', 'node_2', 'node_3'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_4'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.callFake(
      (title: string) => title !== 'Node 4'
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return ['1'];
      }
      return [];
    });

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();
    tick();

    expect(ngbModal.open).toHaveBeenCalledWith(
      AdventureMasteredModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-adventure-mastered-modal',
      }
    );
    expect(component.masteredAdventureIndex).toBe(0);
    expect(component.getAdventureMasteredTitle()).toBe(
      'I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_NUMBER_TITLE'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_NUMBER_TITLE',
      {adventureNumber: 1}
    );
  }));

  it('should handle malformed arc_id query values when showing mastered modal', fakeAsync(() => {
    const createNode = (nodeId: string, title: string) => {
      const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
        'getTitle',
        'getDescription',
        'getThumbnailFilename',
        'getExplorationId',
        'getId',
        'getStatus',
        'getAvailableTextLanguageCodes',
        'getAvailableVoiceoverLanguageCodes',
        'getAvailableVoiceoverLanguageAccentDescriptions',
      ]);
      storyNodeSpy.getTitle.and.returnValue(title);
      storyNodeSpy.getDescription.and.returnValue('Desc');
      storyNodeSpy.getThumbnailFilename.and.returnValue(null);
      storyNodeSpy.getExplorationId.and.returnValue('exp_' + nodeId);
      storyNodeSpy.getId.and.returnValue(nodeId);
      storyNodeSpy.getStatus.and.returnValue('Published');
      storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
      storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
      storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
        {}
      );
      return storyNodeSpy;
    };

    const node1 = createNode('node_1', 'Node 1');
    const node2 = createNode('node_2', 'Node 2');
    const node3 = createNode('node_3', 'Node 3');

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2', 'Node 3'],
      [node1, node2, node3],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1', 'node_2', 'node_3'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.returnValue(
      true
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return ['1/story'];
      }
      return [];
    });

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();
    tick();

    expect(ngbModal.open).toHaveBeenCalledWith(
      AdventureMasteredModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-adventure-mastered-modal',
      }
    );
    expect(component.masteredAdventureIndex).toBe(0);
  }));

  it('should collapse mastered adventure when continuing from mastered modal', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'completed')]),
      createAdventureGroup('Adventure 2', [createLessonCard(2, 'not_started')]),
    ];
    component.masteredAdventureIndex = 0;
    component.toggleAdventure(0);

    component.onAdventureMasteredContinue();

    expect(component.masteredAdventureIndex).toBeNull();
    expect(component.isAdventureExpanded(0)).toBe(false);
    expect(component.isAdventureExpanded(1)).toBe(true);
    expect(component.activeLessonNumber).toBe(2);
  });

  it('should handle onNavigationPracticeSelected by scrolling to practice card', fakeAsync(() => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null,
      {status: 'Published'}
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    const practiceElement = jasmine.createSpyObj<HTMLElement>(
      'practiceElement',
      ['scrollIntoView']
    );
    practiceElement.id = 'practice-card-1';
    component.practiceWrappers = new QueryList<ElementRef>();
    component.practiceWrappers.reset([
      {nativeElement: practiceElement} as ElementRef,
    ]);

    component.onNavigationPracticeSelected('1');
    tick(300);

    expect(practiceElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  }));

  it('should handle onNavigationPracticeSelected when element is not found', fakeAsync(() => {
    component.practiceWrappers = new QueryList<ElementRef>();
    component.practiceWrappers.reset([]);

    component.onNavigationPracticeSelected('999');
    tick(300);
  }));

  it('should handle onAdventureMasteredContinue when masteredAdventureIndex is null', () => {
    component.masteredAdventureIndex = null;

    component.onAdventureMasteredContinue();

    expect(component.masteredAdventureIndex).toBeNull();
  });

  it('should handle onAdventureMasteredContinue when mastered the last adventure', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'completed')]),
    ];
    component.masteredAdventureIndex = 0;

    component.onAdventureMasteredContinue();

    expect(component.masteredAdventureIndex).toBeNull();
    expect(component.isAdventureExpanded(0)).toBe(false);
    expect(Reflect.get(component, 'hasHandledArcMasteredQueryParams')).toBe(
      true
    );
  });

  it('should call onArcSkipConfirmationCancel when arc skip modal is rejected', fakeAsync(() => {
    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );
    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.lessonWrappers = new QueryList<ElementRef>();
    component.lessonWrappers.reset([]);

    const rejectModalRef = {
      result: Promise.reject(new Error('dismissed')),
      componentInstance: {},
    } as NgbModalRef;
    ngbModal.open.and.returnValue(rejectModalRef);

    component.onNavigationLessonSelected({lessonNumber: 2, adventureIndex: 1});

    expect(ngbModal.open).toHaveBeenCalledWith(
      ArcSkipConfirmationModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-arc-skip-confirmation-modal',
      }
    );

    tick();

    expect(Reflect.get(component, 'pendingNavigationLessonNumber')).toBeNull();
    expect(
      Reflect.get(component, 'pendingNavigationAdventureIndex')
    ).toBeNull();
  }));

  it('should call onAdventureMasteredContinue when mastered modal is resolved', fakeAsync(() => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null,
      {status: 'Published'}
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.returnValue(
      true
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return ['1'];
      }
      return [];
    });

    const resolveModalRef = {
      result: Promise.resolve(),
      componentInstance: {},
    } as NgbModalRef;
    ngbModal.open.and.returnValue(resolveModalRef);

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    tick();

    expect(ngbModal.open).toHaveBeenCalledWith(
      AdventureMasteredModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-adventure-mastered-modal',
      }
    );
    expect(component.masteredAdventureIndex).toBeNull();
    expect(Reflect.get(component, 'hasHandledArcMasteredQueryParams')).toBe(
      true
    );
  }));

  it('should clear mastered modal ref when mastered modal is rejected', fakeAsync(() => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null,
      {status: 'Published'}
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.returnValue(
      true
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return ['1'];
      }
      return [];
    });

    const rejectModalRef = {
      result: Promise.reject(new Error('dismissed')),
      componentInstance: {},
    } as NgbModalRef;
    ngbModal.open.and.returnValue(rejectModalRef);

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    tick();

    expect(ngbModal.open).toHaveBeenCalledWith(
      AdventureMasteredModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-adventure-mastered-modal',
      }
    );

    tick(1);
  }));

  it('should return false from isChapterPublished when getStatus returns null', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null,
      {
        status: null,
      }
    );

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].isPublished).toBe(false);
  });

  it('should return default mastered modal text when no adventure is mastered', () => {
    expect(component.getAdventureMasteredTitle()).toBe(
      'I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_TITLE'
    );
    expect(component.getAdventureMasteredSubtitle()).toBe(
      'I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_MOMENTUM_SUBTITLE'
    );
  });

  it('should show the unlocked adventure in the mastered modal subtitle', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'completed')]),
      createAdventureGroup('Adventure 2', [createLessonCard(2, 'not_started')]),
    ];
    component.masteredAdventureIndex = 0;

    expect(component.getAdventureMasteredSubtitle()).toBe(
      'I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_UNLOCKED_SUBTITLE'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_UNLOCKED_SUBTITLE',
      {adventureNumber: 2}
    );
  });

  it('should show the all-adventures-mastered text in the mastered modal subtitle', () => {
    component.visibleAdventureGroups = [
      createAdventureGroup('Adventure 1', [createLessonCard(1, 'completed')]),
    ];
    component.masteredAdventureIndex = 0;

    expect(component.getAdventureMasteredSubtitle()).toBe(
      'I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_ALL_COMPLETE_SUBTITLE'
    );
  });

  it('should return false from isAdventurePracticeCompleted when the adventure group is missing', () => {
    component.visibleAdventureGroups = [];

    expect(component.isAdventurePracticeCompleted(0)).toBe(false);
  });

  it('should report practice completion for a mastered adventure arc', fakeAsync(() => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null,
      {
        status: 'Published',
      }
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.returnValue(
      true
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return ['1'];
      }
      return [];
    });

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    tick();

    expect(ngbModal.open).toHaveBeenCalledWith(
      AdventureMasteredModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-adventure-mastered-modal',
      }
    );
    expect(component.isAdventurePracticeCompleted(0)).toBe(true);
  }));

  it('should not show the mastered modal when arc_id does not start with a digit', fakeAsync(() => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null,
      {
        status: 'Published',
      }
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.returnValue(
      true
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return ['abc'];
      }
      return [];
    });

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    tick();

    expect(ngbModal.open).not.toHaveBeenCalled();
  }));

  it('should not show the mastered modal when arc_id is empty', fakeAsync(() => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null,
      {
        status: 'Published',
      }
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.returnValue(
      true
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return [''];
      }
      return [];
    });

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    tick();

    expect(ngbModal.open).not.toHaveBeenCalled();
  }));

  it('should not show the mastered modal when arc_id does not match any adventure', fakeAsync(() => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null,
      {
        status: 'Published',
      }
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.returnValue(
      true
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return ['5'];
      }
      return [];
    });

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    tick();

    expect(ngbModal.open).not.toHaveBeenCalled();
  }));

  it('should not show the mastered modal again after it has been handled', fakeAsync(() => {
    const createNode = (nodeId: string, title: string) => {
      const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
        'getTitle',
        'getDescription',
        'getThumbnailFilename',
        'getExplorationId',
        'getId',
        'getStatus',
        'getAvailableTextLanguageCodes',
        'getAvailableVoiceoverLanguageCodes',
        'getAvailableVoiceoverLanguageAccentDescriptions',
      ]);
      storyNodeSpy.getTitle.and.returnValue(title);
      storyNodeSpy.getDescription.and.returnValue('Desc');
      storyNodeSpy.getThumbnailFilename.and.returnValue(null);
      storyNodeSpy.getExplorationId.and.returnValue('exp_' + nodeId);
      storyNodeSpy.getId.and.returnValue(nodeId);
      storyNodeSpy.getStatus.and.returnValue('Published');
      storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
      storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
      storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
        {}
      );
      return storyNodeSpy;
    };

    const node1 = createNode('node_1', 'Node 1');
    const node2 = createNode('node_2', 'Node 2');
    const node3 = createNode('node_3', 'Node 3');
    const node4 = createNode('node_4', 'Node 4');

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2', 'Node 3', 'Node 4'],
      [node1, node2, node3, node4],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1', 'node_2', 'node_3'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_4'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.callFake(
      (title: string) => title !== 'Node 4'
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return ['1'];
      }
      return [];
    });

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();
    tick();

    expect(ngbModal.open).toHaveBeenCalledWith(
      AdventureMasteredModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-adventure-mastered-modal',
      }
    );

    component.onAdventureMasteredContinue();

    component.ngOnChanges({
      storySummary: new SimpleChange(
        component.storySummary,
        component.storySummary,
        false
      ),
    });
    tick();

    expect(ngbModal.open).toHaveBeenCalledTimes(1);
  }));

  it('should forward the topic editor preview flag to the adventure navigation', () => {
    component.isInTopicEditorPreview = true;
    fixture.detectChanges();

    const navigationElement = fixture.nativeElement.querySelector(
      'topic-adventure-navigation'
    );
    expect(navigationElement).not.toBeNull();
    expect(navigationElement.isInTopicEditorPreview).toBeTruthy();
  });

  it('should not forward the topic editor preview flag by default', () => {
    component.isInTopicEditorPreview = false;
    fixture.detectChanges();

    const navigationElement = fixture.nativeElement.querySelector(
      'topic-adventure-navigation'
    );
    expect(navigationElement).not.toBeNull();
    expect(navigationElement.isInTopicEditorPreview).toBeFalsy();
  });

  it('should handle adventure navigation practice selected when element not found', fakeAsync(() => {
    component.practiceWrappers = new QueryList<ElementRef>();
    component.practiceWrappers.reset([]);

    component.onNavigationPracticeSelected('1');
    tick(300);
  }));

  it('should scroll to lesson element when found by ViewChildren', fakeAsync(() => {
    const lessonElement = jasmine.createSpyObj<HTMLElement>('lessonElement', [
      'scrollIntoView',
    ]);
    lessonElement.id = 'lesson-1';
    component.lessonWrappers = new QueryList<ElementRef>();
    component.lessonWrappers.reset([
      {nativeElement: lessonElement} as ElementRef,
    ]);

    component.onNavigationLessonSelected({
      lessonNumber: 1,
      adventureIndex: 0,
    });
    tick(300);

    expect(lessonElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  }));

  it('should scroll to practice card element when found by ViewChildren', fakeAsync(() => {
    const practiceElement = jasmine.createSpyObj<HTMLElement>(
      'practiceElement',
      ['scrollIntoView']
    );
    practiceElement.id = 'practice-card-1';
    component.practiceWrappers = new QueryList<ElementRef>();
    component.practiceWrappers.reset([
      {nativeElement: practiceElement} as ElementRef,
    ]);

    component.onNavigationPracticeSelected('1');
    tick(300);

    expect(practiceElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  }));

  it('should restore mastered adventures from localStorage on init', () => {
    localStorageService.getMasteredAdventures.and.returnValue(['1']);

    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );
    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(localStorageService.getMasteredAdventures).toHaveBeenCalledWith(
      'story_id_1'
    );
    expect(component.isAdventurePracticeCompleted(0)).toBe(true);
    expect(component.isAdventurePracticeCompleted(1)).toBe(false);
  });

  it('should persist mastered adventures when returning from arc test', fakeAsync(() => {
    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null,
      {status: 'Published'}
    );
    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null,
      {status: 'Published'}
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_2'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.callFake(
      (title: string) => title === 'Node 1'
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return ['1'];
      }
      return [];
    });

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();
    tick();

    expect(ngbModal.open).toHaveBeenCalledWith(
      AdventureMasteredModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-adventure-mastered-modal',
      }
    );
    expect(localStorageService.updateMasteredAdventures).toHaveBeenCalledWith(
      'story_id_1',
      ['1']
    );
  }));

  it('should retain mastered adventures across page reload from localStorage', () => {
    localStorageService.getMasteredAdventures.and.returnValue(['1', '2']);

    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );
    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );
    const storyNodeSpy3 = createStoryNodeSpy(
      'Node 3',
      'Desc 3',
      'exp_3',
      'node_3',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2', 'Node 3'],
      [storyNodeSpy1, storyNodeSpy2, storyNodeSpy3],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_2'],
        },
        {
          id: 'arc_3',
          title: 'Adventure 3',
          description: 'Third adventure',
          node_ids: ['node_3'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.isAdventurePracticeCompleted(0)).toBe(true);
    expect(component.isAdventurePracticeCompleted(1)).toBe(true);
    expect(component.isAdventurePracticeCompleted(2)).toBe(false);
  });

  it('should not persist or restore mastered adventures when story id is missing', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null,
      {status: 'Published'}
    );
    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    (
      component.storySummary as jasmine.SpyObj<StorySummary>
    ).getId.and.returnValue('');
    (
      component.storySummary as jasmine.SpyObj<StorySummary>
    ).isNodeCompleted.and.returnValue(true);
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      return fieldName === 'arc_mastered' ? ['true'] : ['1'];
    });
    localStorageService.getMasteredAdventures.calls.reset();
    localStorageService.updateMasteredAdventures.calls.reset();

    component.ngOnInit();

    expect(localStorageService.getMasteredAdventures).not.toHaveBeenCalled();
    expect(localStorageService.updateMasteredAdventures).not.toHaveBeenCalled();
  });

  it('should open arc skip confirmation as bottom sheet on mobile', fakeAsync(() => {
    windowDimensionsService.getWidth.and.returnValue(300);
    const mockBottomSheetRef = {
      afterDismissed: () => ({subscribe: jasmine.createSpy('subscribe')}),
    };
    bottomSheet.open.and.returnValue(mockBottomSheetRef);

    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );
    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.onNavigationLessonSelected({lessonNumber: 2, adventureIndex: 1});

    expect(bottomSheet.open).toHaveBeenCalledWith(
      ArcSkipConfirmationModalComponent,
      jasmine.objectContaining({data: jasmine.any(Object)})
    );
    expect(ngbModal.open).not.toHaveBeenCalled();

    tick(300);
  }));

  it('should open adventure mastered modal as bottom sheet on mobile', fakeAsync(() => {
    windowDimensionsService.getWidth.and.returnValue(300);
    const mockBottomSheetRef = {
      afterDismissed: () => ({subscribe: jasmine.createSpy('subscribe')}),
    };
    bottomSheet.open.and.returnValue(mockBottomSheetRef);

    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null,
      {status: 'Published'}
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.returnValue(
      true
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return ['1'];
      }
      return [];
    });

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();
    tick();

    expect(bottomSheet.open).toHaveBeenCalledWith(
      AdventureMasteredModalComponent,
      jasmine.objectContaining({data: jasmine.any(Object)})
    );
    expect(ngbModal.open).not.toHaveBeenCalled();
  }));

  it('should call onArcSkipConfirmationProceed when bottom sheet confirms', fakeAsync(() => {
    windowDimensionsService.getWidth.and.returnValue(300);
    let dismissCallback: (result: string) => void = () => {};
    const mockBottomSheetRef = {
      afterDismissed: () => ({
        subscribe: (cb: (result: string) => void) => {
          dismissCallback = cb;
        },
      }),
    };
    bottomSheet.open.and.returnValue(mockBottomSheetRef);

    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );
    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.onNavigationLessonSelected({lessonNumber: 2, adventureIndex: 1});

    dismissCallback('confirm');

    expect(component.isAdventureSkipped(0)).toBe(true);
    expect(localStorageService.updateSkippedAdventures).toHaveBeenCalledWith(
      'story_id_1',
      [0]
    );

    tick(300);
  }));

  it('should call onArcSkipConfirmationCancel when bottom sheet is dismissed', fakeAsync(() => {
    windowDimensionsService.getWidth.and.returnValue(300);
    let dismissCallback: (result: string) => void = () => {};
    const mockBottomSheetRef = {
      afterDismissed: () => ({
        subscribe: (cb: (result: string) => void) => {
          dismissCallback = cb;
        },
      }),
    };
    bottomSheet.open.and.returnValue(mockBottomSheetRef);

    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );
    const storyNodeSpy2 = createStoryNodeSpy(
      'Node 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1', 'Node 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Adventure 2',
          description: 'Second adventure',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.onNavigationLessonSelected({lessonNumber: 2, adventureIndex: 1});

    dismissCallback('cancel');

    expect(component.isAdventureSkipped(0)).toBe(false);

    tick(300);
  }));

  it('should call onAdventureMasteredContinue when mastered bottom sheet confirms', fakeAsync(() => {
    windowDimensionsService.getWidth.and.returnValue(300);
    let dismissCallback: (result: string) => void = () => {};
    const mockBottomSheetRef = {
      afterDismissed: () => ({
        subscribe: (cb: (result: string) => void) => {
          dismissCallback = cb;
        },
      }),
    };
    bottomSheet.open.and.returnValue(mockBottomSheetRef);

    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null,
      {status: 'Published'}
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.returnValue(
      true
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return ['1'];
      }
      return [];
    });

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();
    tick();

    dismissCallback('confirm');

    expect(component.masteredAdventureIndex).toBeNull();
    expect(Reflect.get(component, 'adventureMasteredModalRef')).toBeNull();
  }));

  it('should clear mastered modal ref when mastered bottom sheet is dismissed', fakeAsync(() => {
    windowDimensionsService.getWidth.and.returnValue(300);
    let dismissCallback: (result: string) => void = () => {};
    const mockBottomSheetRef = {
      afterDismissed: () => ({
        subscribe: (cb: (result: string) => void) => {
          dismissCallback = cb;
        },
      }),
    };
    bottomSheet.open.and.returnValue(mockBottomSheetRef);

    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null,
      {status: 'Published'}
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Adventure 1',
          description: 'First adventure',
          node_ids: ['node_1'],
        },
      ]
    );
    (component.storySummary.isNodeCompleted as jasmine.Spy).and.returnValue(
      true
    );
    urlService.getQueryFieldValuesAsList.and.callFake((fieldName: string) => {
      if (fieldName === 'arc_mastered') {
        return ['true'];
      }
      if (fieldName === 'arc_id') {
        return ['1'];
      }
      return [];
    });

    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();
    tick();

    dismissCallback('cancel');

    expect(Reflect.get(component, 'adventureMasteredModalRef')).toBeNull();
  }));
});
