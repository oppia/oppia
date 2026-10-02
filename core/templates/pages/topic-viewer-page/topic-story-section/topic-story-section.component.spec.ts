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

import {NO_ERRORS_SCHEMA} from '@angular/core';
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
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicSessionFallbackLanguageService} from 'pages/topic-viewer-page/services/topic-session-fallback-language.service';
import {UrlService} from 'services/contextual/url.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {ChapterLabelVisibilityService} from 'services/chapter-label-visibility.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {LocalStorageService} from 'services/local-storage.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';

import {TopicStorySectionComponent} from './topic-story-section.component';
import {ModuleMasteredModalComponent} from './module-mastered-modal.component';
import {ModuleSkipConfirmationModalComponent} from './module-skip-confirmation-modal.component';
import {MasteryChallengeLockedModalComponent} from './mastery-challenge-locked-modal.component';

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
  let topicSessionFallbackLanguageService: jasmine.SpyObj<TopicSessionFallbackLanguageService>;
  let chapterLabelVisibilityService: jasmine.SpyObj<ChapterLabelVisibilityService>;
  let questionBackendApiService: jasmine.SpyObj<QuestionBackendApiService>;
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
      location: {
        assign: jasmine.Spy;
      };
      scrollY: number;
      scrollTo: jasmine.Spy;
      document: {
        querySelector: jasmine.Spy;
        getElementById: jasmine.Spy;
      };
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
    questionBackendApiService = jasmine.createSpyObj(
      'QuestionBackendApiService',
      ['fetchTotalQuestionCountForSkillIdsAsync']
    );
    questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync.and.resolveTo(
      0
    );
    localStorageService = jasmine.createSpyObj('LocalStorageService', [
      'getSkippedModules',
      'updateSkippedModules',
      'getMasteredModules',
      'updateMasteredModules',
    ]);
    localStorageService.getSkippedModules.and.returnValue([]);
    localStorageService.getMasteredModules.and.returnValue([]);
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
        location: {
          assign: jasmine.createSpy('location.assign'),
        },
        scrollY: 0,
        scrollTo: jasmine.createSpy('window.scrollTo'),
        document: {
          querySelector: jasmine.createSpy('document.querySelector'),
          getElementById: jasmine.createSpy('document.getElementById'),
        },
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
          provide: TopicSessionFallbackLanguageService,
          useValue: topicSessionFallbackLanguageService,
        },
        {
          provide: ChapterLabelVisibilityService,
          useValue: chapterLabelVisibilityService,
        },
        {
          provide: QuestionBackendApiService,
          useValue: questionBackendApiService,
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
      acquiredSkillIds?: string[];
    } = {}
  ): jasmine.SpyObj<StoryNode> => {
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getStatus',
      'getAcquiredSkillIds',
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
    storyNodeSpy.getAcquiredSkillIds.and.returnValue(
      options.acquiredSkillIds ?? []
    );
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
    skillIds: [],
    hasPracticeQuestions: false,
    nodeId: 'node_' + lessonNumber,
    lessonProgressStatus: lessonProgressStatus,
    isComingSoon: false,
    isPublished: true,
    isNewLabelVisible: false,
    availableTextLanguageCodes: [],
    availableVoiceoverLanguageCodes: [],
    availableVoiceoverLanguageAccentDescriptions: {},
  });

  const createModuleGroup = (
    moduleTitle: string,
    lessonCards: ReturnType<typeof createLessonCard>[]
  ) => ({
    moduleTitle: moduleTitle,
    moduleDescription: '',
    lessonCards: lessonCards,
    accentColor: '#27a844',
    iconBg: '',
    headerBackgroundColor: '',
    headerBorderColor: '',
    arcId: '1',
    hasPracticeQuestions: false,
  });

  it('should include review and test in the practice title', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Fractions', [createLessonCard(1, 'not_started')]),
    ];

    expect(component.getPracticeTitle(0)).toBe('Module 1 Review & Test');
    expect(component.getPracticeTitle(1)).toBe('Module 2 Review & Test');
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

  it('should build module groups when story has arcs', () => {
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
        title: 'Module 1',
        description: 'First module',
        node_ids: ['node_1'],
      },
      {
        id: 'arc_2',
        title: 'Module 2',
        description: 'Second module',
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

    expect(component.moduleGroups.length).toBe(2);
    expect(component.moduleGroups[0].moduleTitle).toBe('Module 1');
    expect(component.moduleGroups[0].arcId).toBe('1');
    expect(component.moduleGroups[0].lessonCards.length).toBe(1);
    expect(component.moduleGroups[0].lessonCards[0].lessonTitle).toContain(
      'Node title 1'
    );
    expect(component.moduleGroups[1].moduleTitle).toBe('Module 2');
    expect(component.moduleGroups[1].arcId).toBe('2');
    expect(component.moduleGroups[1].lessonCards.length).toBe(1);
    expect(component.moduleGroups[1].lessonCards[0].lessonTitle).toContain(
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

  it('should show module-end-test card when lesson cards exist and practice is enabled', () => {
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
          title: 'Module 1',
          description: 'First module',
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
          title: 'Module 1',
          description: 'First module',
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

  it('should enable lesson and module practice when questions exist', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {acquiredSkillIds: ['skill_1']}
    );
    questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync.and.resolveTo(
      2
    );
    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );

    component.ngOnInit();
    await fixture.whenStable();
    await component.practiceAvailabilityPending;

    expect(component.lessonCards[0].hasPracticeQuestions).toBe(true);
    expect(component.moduleGroups[0].hasPracticeQuestions).toBe(true);
  });

  it('should keep practice disabled when the question check fails', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {acquiredSkillIds: ['skill_1']}
    );
    questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync.and.rejectWith(
      new Error('Request failed')
    );
    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.lessonCards[0].hasPracticeQuestions).toBe(false);
    expect(component.moduleGroups[0].hasPracticeQuestions).toBe(false);
  });

  it('should return correct practice title for each module index', () => {
    expect(component.getPracticeTitle(0)).toBe('Module 1 Review & Test');
    expect(component.getPracticeTitle(1)).toBe('Module 2 Review & Test');
    expect(component.getPracticeTitle(2)).toBe('Module 3 Review & Test');
  });

  it('should return correct practice description with unlock message for non-last modules', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'not_started')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];

    expect(component.getPracticeDescription(0)).toBe(
      'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_WITH_NEXT'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_WITH_NEXT',
      {moduleNumber: 1, nextModuleNumber: 2}
    );
    expect(component.getPracticeDescription(1)).toBe(
      'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_FINAL'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_FINAL',
      {moduleNumber: 2}
    );
  });

  it('should return correct practice description without unlock for last module', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'not_started')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
      createModuleGroup('Module 3', [createLessonCard(3, 'not_started')]),
    ];

    expect(component.getPracticeDescription(2)).toBe(
      'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_FINAL'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_FINAL',
      {moduleNumber: 3}
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

  it('should toggle module expansion state', () => {
    expect(component.isModuleExpanded(0)).toBe(false);

    component.toggleModule(0);
    expect(component.isModuleExpanded(0)).toBe(true);

    component.toggleModule(0);
    expect(component.isModuleExpanded(0)).toBe(false);
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
        title: 'Module 1',
        description: 'First module',
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

    expect(component.moduleGroups.length).toBe(1);
    expect(component.moduleGroups[0].lessonCards).toEqual([]);
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

  it('should return empty string for getModuleCompletionText with invalid index', () => {
    expect(component.getModuleCompletionText(999)).toBe('');
  });

  it('should return correct module completion text', () => {
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
          title: 'Module 1',
          description: 'First module',
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

    expect(component.getModuleCompletionText(0)).toBe(
      'I18N_TOPIC_VIEWER_MODULE_COMPLETION_TEXT'
    );
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

  it('should return empty module groups when arcs are empty', async () => {
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

    expect(component.moduleGroups).toEqual([]);
    expect(component.visibleModuleGroups).toEqual([]);
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

  it('should handle module navigation lesson selected', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1', 'node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.onNavigationLessonSelected({lessonNumber: 2, moduleIndex: 0});

    expect(component.activeLessonNumber).toBe(2);
    expect(component.navigatedLessonNumber).toBe(2);
    expect(component.isModuleExpanded(0)).toBe(true);

    tick(400);
  }));

  it('should restore skipped modules from localStorage on init', () => {
    localStorageService.getSkippedModules.and.returnValue([0]);

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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(localStorageService.getSkippedModules).toHaveBeenCalledWith(
      'story_id_1'
    );
    expect(component.isModuleSkipped(0)).toBe(true);
    expect(component.isModuleSkipped(1)).toBe(false);
    expect(component.isModuleExpanded(0)).toBe(false);
    expect(component.isModuleExpanded(1)).toBe(true);
  });

  it('should auto-expand first module when all modules are skipped', () => {
    localStorageService.getSkippedModules.and.returnValue([0, 1]);

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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.isModuleSkipped(0)).toBe(true);
    expect(component.isModuleSkipped(1)).toBe(true);
    expect(component.isModuleExpanded(0)).toBe(true);
  });

  it('should persist skipped modules when proceeding with skip confirmation', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});

    expect(ngbModal.open).toHaveBeenCalledWith(
      ModuleSkipConfirmationModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-module-skip-confirmation-modal',
      }
    );
    expect(localStorageService.updateSkippedModules).not.toHaveBeenCalled();

    component.onModuleSkipConfirmationProceed();

    expect(component.isModuleSkipped(0)).toBe(true);
    expect(localStorageService.updateSkippedModules).toHaveBeenCalledWith(
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
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'not_started')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];
    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});

    component.onModuleSkipConfirmationCancel();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should cancel skip confirmation on proceed when there is no pending navigation', () => {
    const mockModalRef = {
      result: Promise.resolve(),
      componentInstance: {},
    } as NgbModalRef;
    ngbModal.open.and.returnValue(mockModalRef);
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'not_started')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];
    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});

    component.onModuleSkipConfirmationProceed();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should not show skip confirmation when all earlier modules are completed', fakeAsync(() => {
    localStorageService.getMasteredModules.and.returnValue(['1']);

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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
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

    expect(component.isModuleCompleted(0)).toBe(true);
    expect(component.isModuleCompleted(1)).toBe(false);

    component.onNavigationLessonSelected({lessonNumber: 2, moduleIndex: 1});

    expect(ngbModal.open).not.toHaveBeenCalled();
    expect(component.activeLessonNumber).toBe(2);
    expect(component.navigatedLessonNumber).toBe(2);
    expect(component.isModuleExpanded(1)).toBe(true);

    tick(300);
  }));

  it('should only scroll and not open the arc skip modal when a lesson circle is clicked in the navbar', fakeAsync(() => {
    windowDimensionsService.getWidth.and.returnValue(1024);
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.activePracticeArcId = 'arc_2';
    component.onNavigationLessonSelected({lessonNumber: 2, moduleIndex: 1});

    expect(ngbModal.open).not.toHaveBeenCalled();
    expect(component.activeLessonNumber).toBe(2);
    expect(component.navigatedLessonNumber).toBe(2);
    expect(component.activePracticeArcId).toBe('');

    tick(300);
  }));

  it('should persist un-skipping when a skipped module is expanded', () => {
    component.skippedModuleIndices = new Set([0]);

    component.toggleModule(0);

    expect(component.isModuleSkipped(0)).toBe(false);
    expect(localStorageService.updateSkippedModules).toHaveBeenCalledWith(
      'story_id_1',
      []
    );
  });

  it('should build singular skip confirmation message for one skipped module', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'not_started')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];

    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});

    expect(ngbModal.open).toHaveBeenCalledWith(
      ModuleSkipConfirmationModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-module-skip-confirmation-modal',
      }
    );
    expect(component.getModuleSkipConfirmationMessage()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_SKIP_CONFIRMATION_MESSAGE'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_MODULE_SKIP_CONFIRMATION_MESSAGE',
      {count: 1, moduleNumbers: '1', messageFormat: true}
    );
  });

  it('should build plural skip confirmation message for two skipped modules', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'not_started')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
      createModuleGroup('Module 3', [createLessonCard(3, 'not_started')]),
    ];

    component.onLessonStartClick({lessonNumber: 3, startUrl: ''});

    (translateService.instant as jasmine.Spy).calls.reset();

    expect(component.getModuleSkipConfirmationMessage()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_SKIP_CONFIRMATION_MESSAGE'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_MODULE_SKIP_CONFIRMATION_MESSAGE',
      {
        count: 2,
        moduleNumbers: '1I18N_TOPIC_VIEWER_LIST_AND2',
        messageFormat: true,
      }
    );
  });

  it('should build comma-separated skip confirmation message for three skipped modules', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'not_started')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
      createModuleGroup('Module 3', [createLessonCard(3, 'not_started')]),
      createModuleGroup('Module 4', [createLessonCard(4, 'not_started')]),
    ];

    component.onLessonStartClick({lessonNumber: 4, startUrl: ''});

    (translateService.instant as jasmine.Spy).calls.reset();

    expect(component.getModuleSkipConfirmationMessage()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_SKIP_CONFIRMATION_MESSAGE'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_MODULE_SKIP_CONFIRMATION_MESSAGE',
      {
        count: 3,
        moduleNumbers: '1, 2I18N_TOPIC_VIEWER_LIST_COMMA_AND3',
        messageFormat: true,
      }
    );
  });

  it('should exclude completed modules from the skip confirmation message', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
      createModuleGroup('Module 3', [createLessonCard(3, 'not_started')]),
    ];

    component.onLessonStartClick({lessonNumber: 3, startUrl: ''});

    expect(component.getModuleSkipConfirmationMessage()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_SKIP_CONFIRMATION_MESSAGE'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_MODULE_SKIP_CONFIRMATION_MESSAGE',
      {count: 1, moduleNumbers: '2', messageFormat: true}
    );
  });

  it('should return empty skip confirmation message when there is no pending navigation', () => {
    expect(component.getModuleSkipConfirmationMessage()).toBe('');
  });

  it('should return empty skip confirmation message when no earlier modules are skipped', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'not_started')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];

    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});
    expect(ngbModal.open).toHaveBeenCalledWith(
      ModuleSkipConfirmationModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-module-skip-confirmation-modal',
      }
    );

    component.visibleModuleGroups[0].lessonCards[0].lessonProgressStatus =
      'completed';

    expect(component.getModuleSkipConfirmationMessage()).toBe('');
  });

  it('should return Start label for a skipped module that was never started', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'not_started')]),
    ];

    expect(component.getSkippedModuleButtonLabel(0)).toBe(
      'I18N_TOPIC_VIEWER_MODULE_START_BUTTON'
    );
  });

  it('should return Resume label for a skipped module that was started', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'in_progress')]),
    ];

    expect(component.getSkippedModuleButtonLabel(0)).toBe(
      'I18N_TOPIC_VIEWER_MODULE_RESUME_BUTTON'
    );
  });

  it('should return Start label when the module group is missing', () => {
    component.visibleModuleGroups = [];

    expect(component.getSkippedModuleButtonLabel(0)).toBe(
      'I18N_TOPIC_VIEWER_MODULE_START_BUTTON'
    );
  });

  it('should not persist or restore skipped modules when story id is missing', () => {
    (component.storySummary.getId as jasmine.Spy).and.returnValue('');
    localStorageService.getSkippedModules.calls.reset();
    localStorageService.updateSkippedModules.calls.reset();

    component.skippedModuleIndices = new Set([0]);
    component.toggleModule(0);

    expect(localStorageService.updateSkippedModules).not.toHaveBeenCalled();

    component.ngOnInit();

    expect(localStorageService.getSkippedModules).not.toHaveBeenCalled();
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

  it('should handle module groups with palette color cycling', () => {
    const storyNodeSpies = [];
    const nodeIds = [];
    for (let i = 0; i < 16; i++) {
      const spy = jasmine.createSpyObj('StoryNode', [
        'getTitle',
        'getDescription',
        'getThumbnailFilename',
        'getExplorationId',
        'getId',
        'getStatus',
        'getAcquiredSkillIds',
        'getAvailableTextLanguageCodes',
        'getAvailableVoiceoverLanguageCodes',
        'getAvailableVoiceoverLanguageAccentDescriptions',
      ]);
      spy.getTitle.and.returnValue(`Node ${i}`);
      spy.getDescription.and.returnValue(`Desc ${i}`);
      spy.getThumbnailFilename.and.returnValue(null);
      spy.getExplorationId.and.returnValue(`exp_${i}`);
      spy.getId.and.returnValue(`node_${i}`);
      spy.getStatus.and.returnValue(null);
      spy.getAcquiredSkillIds.and.returnValue([]);
      spy.getAvailableTextLanguageCodes.and.returnValue([]);
      spy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
      spy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue({});
      storyNodeSpies.push(spy);
      nodeIds.push(`node_${i}`);
    }

    const arcs = nodeIds.map((nodeId, i) => ({
      id: `arc_${i}`,
      title: `Module ${i}`,
      description: `Module ${i} desc`,
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

    expect(component.moduleGroups.length).toBe(16);
    expect(component.moduleGroups[0].accentColor).toBe('#27a844');
    expect(component.moduleGroups[14].accentColor).toBe('#2e7d32');
    expect(component.moduleGroups[15].accentColor).toBe('#27a844');
  });

  it('should not expand any module when no module groups exist', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.isModuleExpanded(0)).toBe(false);
  });

  it('should show an module end test card when the module has lessons', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'not_started')]),
    ];
    expect(component.shouldShowModuleEndTestCard(0)).toBe(true);

    component.visibleModuleGroups[0].lessonCards = [];
    expect(component.shouldShowModuleEndTestCard(0)).toBe(false);
  });

  it('should report story as completed only when all available lessons are completed', () => {
    const baseLesson = {
      lessonTitle: 'Lesson',
      lessonDescription: '',
      thumbnailUrl: '',
      startUrl: '/explore/1',
      practiceUrl: '',
      skillIds: [] as string[],
      hasPracticeQuestions: false,
      nodeId: 'node_1',
      lessonProgressStatus: 'completed' as const,
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

  it('should not report an module as completed before its test is completed', () => {
    const baseLesson = {
      lessonTitle: 'Lesson',
      lessonDescription: '',
      thumbnailUrl: '',
      startUrl: '/explore/1',
      practiceUrl: '',
      skillIds: [] as string[],
      hasPracticeQuestions: false,
      nodeId: 'node_1',
      lessonProgressStatus: 'completed' as const,
      isComingSoon: false,
      isPublished: true,
      isNewLabelVisible: false,
      availableTextLanguageCodes: [],
      availableVoiceoverLanguageCodes: [],
      availableVoiceoverLanguageAccentDescriptions: {},
    };

    component.visibleModuleGroups = [
      {
        moduleTitle: 'Module 1',
        moduleDescription: '',
        lessonCards: [],
        accentColor: '#27a844',
        iconBg: '',
        headerBackgroundColor: '',
        headerBorderColor: '',
        arcId: '1',
        hasPracticeQuestions: false,
      },
      {
        moduleTitle: 'Module 2',
        moduleDescription: '',
        lessonCards: [
          {...baseLesson, lessonNumber: 1},
          {...baseLesson, lessonNumber: 2},
        ],
        accentColor: '#27a844',
        iconBg: '',
        headerBackgroundColor: '',
        headerBorderColor: '',
        arcId: '2',
        hasPracticeQuestions: false,
      },
      {
        moduleTitle: 'Module 3',
        moduleDescription: '',
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
        hasPracticeQuestions: false,
      },
    ];

    expect(component.isModuleCompleted(0)).toBe(false);
    expect(component.isModuleCompleted(1)).toBe(false);
    expect(component.isModuleCompleted(2)).toBe(false);
    expect(component.isModuleCompleted(99)).toBe(false);
  });

  it('should collapse an module only when its lessons and test are completed', () => {
    localStorageService.getMasteredModules.and.returnValue(['1']);
    const storyNodeSpy = createStoryNodeSpy(
      'Completed Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );
    const storySummary = createStorySummarySpy(
      ['Completed Node'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );
    storySummary.isNodeCompleted.and.returnValue(true);
    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.isModuleCompleted(0)).toBe(true);
    expect(component.isModuleExpanded(0)).toBe(false);
  });

  it('should expand an module when only its lessons are completed', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Completed Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );
    const storySummary = createStorySummarySpy(
      ['Completed Node'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );
    storySummary.isNodeCompleted.and.returnValue(true);
    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.isModuleCompleted(0)).toBe(false);
    expect(component.isModuleExpanded(0)).toBe(true);
  });

  it('should auto-expand the next module after the current lesson is completed', () => {
    const storyNodeSpy1 = createStoryNodeSpy(
      'Node title 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );
    const storyNodeSpy2 = createStoryNodeSpy(
      'Node title 2',
      'Desc 2',
      'exp_2',
      'node_2',
      null
    );

    const storySummary = createStorySummarySpy(
      ['Node title 1', 'Node title 2'],
      [storyNodeSpy1, storyNodeSpy2],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    storySummary.isNodeCompleted.and.callFake(
      (title: string) => title === 'Node title 1'
    );
    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    // Simulate the learner returning with the completed module expanded.
    Reflect.set(component, '_expandedModuleIndices', new Set([0]));

    component.ngOnInit();

    expect(component.activeLessonNumber).toBe(2);
    expect(component.isModuleExpanded(1)).toBe(true);
  });

  it('should report that missing or empty modules have incomplete lessons', () => {
    component.visibleModuleGroups = [createModuleGroup('Empty Module', [])];

    expect(component.areAllLessonsCompleted(0)).toBeFalsy();
    expect(component.areAllLessonsCompleted(1)).toBeFalsy();
  });

  it('should handle buildModuleGroups when arcs is null', async () => {
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

    expect(component.moduleGroups).toEqual([]);
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

  it('should update practice card when practiceSubtopicIds changes', () => {
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceSubtopicIds = [1];

    component.ngOnChanges({
      practiceSubtopicIds: new SimpleChange([], [1], false),
    });

    expect(component.practiceCard.practiceUrl).toContain(
      'selected_subtopic_ids=[1]'
    );
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

  it('should populate moduleNavigationGroups with lesson numbers and accent colors', async () => {
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.moduleNavigationGroups.length).toBe(1);
    expect(component.moduleNavigationGroups[0].lessons).toEqual([
      {
        lessonNumber: 1,
        isCompleted: false,
      },
    ]);
    expect(component.moduleNavigationGroups[0].accentColor).toBe('#27a844');
    expect(component.moduleNavigationGroups[0].showPractice).toBe(true);
    expect(component.moduleNavigationGroups[0].isPracticeCompleted).toBe(false);
  });

  it('should mark completed lessons in moduleNavigationGroups', async () => {
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
          title: 'Module 1',
          description: 'First module',
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

    expect(component.moduleNavigationGroups[0].lessons).toEqual([
      {
        lessonNumber: 1,
        isCompleted: true,
      },
    ]);
  });

  it('should exclude non-published lessons from module navigation groups', () => {
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.moduleNavigationGroups).toEqual([
      {
        lessons: [{lessonNumber: 1, isCompleted: false}],
        accentColor: '#27a844',
        showPractice: true,
        isPracticeCompleted: false,
        arcId: '1',
      },
    ]);
  });

  it('should handle onNavigationLessonSelected when lesson is not in any module', fakeAsync(() => {
    component.storySummary = createStorySummarySpy([], []);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.onNavigationLessonSelected({
      lessonNumber: 999,
      moduleIndex: 0,
    });

    expect(component.activeLessonNumber).toBe(999);
    expect(component.navigatedLessonNumber).toBe(999);

    tick(400);
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

  it('should show module mastered modal when returning from completed arc test', fakeAsync(() => {
    const createNode = (nodeId: string, title: string) => {
      const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
        'getTitle',
        'getDescription',
        'getThumbnailFilename',
        'getExplorationId',
        'getId',
        'getStatus',
        'getAcquiredSkillIds',
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
      storyNodeSpy.getAcquiredSkillIds.and.returnValue([]);
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1', 'node_2', 'node_3'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
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

    expect(ngbModal.open).toHaveBeenCalledWith(ModuleMasteredModalComponent, {
      backdrop: 'static',
      windowClass: 'oppia-module-mastered-modal',
    });
    expect(component.masteredModuleIndex).toBe(0);
    expect(component.getModuleMasteredTitle()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_NUMBER_TITLE'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_NUMBER_TITLE',
      {moduleNumber: 1}
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
        'getAcquiredSkillIds',
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
      storyNodeSpy.getAcquiredSkillIds.and.returnValue([]);
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
          title: 'Module 1',
          description: 'First module',
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

    expect(ngbModal.open).toHaveBeenCalledWith(ModuleMasteredModalComponent, {
      backdrop: 'static',
      windowClass: 'oppia-module-mastered-modal',
    });
    expect(component.masteredModuleIndex).toBe(0);
  }));

  it('should collapse mastered module when continuing from mastered modal', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];
    component.masteredModuleIndex = 0;
    component.toggleModule(0);

    component.onModuleMasteredContinue();

    expect(component.masteredModuleIndex).toBeNull();
    expect(component.isModuleExpanded(0)).toBe(false);
    expect(component.isModuleExpanded(1)).toBe(true);
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
          title: 'Module 1',
          description: 'First module',
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

    component.activeLessonNumber = 1;
    component.onNavigationPracticeSelected('1');

    expect(component.activePracticeArcId).toBe('1');
    expect(component.activeLessonNumber).toBeNull();
    tick(300);
  }));

  it('should handle onNavigationPracticeSelected when element is not found', fakeAsync(() => {
    component.onNavigationPracticeSelected('999');

    expect(component.activePracticeArcId).toBe('999');
    tick(300);
  }));

  it('should handle onModuleMasteredContinue when masteredModuleIndex is null', () => {
    component.masteredModuleIndex = null;

    component.onModuleMasteredContinue();

    expect(component.masteredModuleIndex).toBeNull();
  });

  it('should handle onModuleMasteredContinue when mastered the last module', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
    ];
    component.masteredModuleIndex = 0;

    component.onModuleMasteredContinue();

    expect(component.masteredModuleIndex).toBeNull();
    expect(component.isModuleExpanded(0)).toBe(false);
    expect(Reflect.get(component, 'hasHandledArcMasteredQueryParams')).toBe(
      true
    );
  });

  it('should call onModuleSkipConfirmationCancel when arc skip modal is rejected', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    const rejectModalRef = {
      result: Promise.reject(new Error('dismissed')),
      componentInstance: {},
    } as NgbModalRef;
    ngbModal.open.and.returnValue(rejectModalRef);

    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});

    expect(ngbModal.open).toHaveBeenCalledWith(
      ModuleSkipConfirmationModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-module-skip-confirmation-modal',
      }
    );

    tick();

    expect(Reflect.get(component, 'pendingNavigationLessonNumber')).toBeNull();
    expect(Reflect.get(component, 'pendingNavigationModuleIndex')).toBeNull();
  }));

  it('should call onModuleMasteredContinue when mastered modal is resolved', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
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

    expect(ngbModal.open).toHaveBeenCalledWith(ModuleMasteredModalComponent, {
      backdrop: 'static',
      windowClass: 'oppia-module-mastered-modal',
    });
    expect(component.masteredModuleIndex).toBeNull();
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
          title: 'Module 1',
          description: 'First module',
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

    expect(ngbModal.open).toHaveBeenCalledWith(ModuleMasteredModalComponent, {
      backdrop: 'static',
      windowClass: 'oppia-module-mastered-modal',
    });

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

  it('should return default mastered modal text when no module is mastered', () => {
    expect(component.getModuleMasteredTitle()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_TITLE'
    );
    expect(component.getModuleMasteredSubtitle()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_MOMENTUM_SUBTITLE'
    );
  });

  it('should show the unlocked module in the mastered modal subtitle', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];
    component.masteredModuleIndex = 0;

    expect(component.getModuleMasteredSubtitle()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_UNLOCKED_SUBTITLE'
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_UNLOCKED_SUBTITLE',
      {moduleNumber: 2}
    );
  });

  it('should show the all-modules-mastered text in the mastered modal subtitle', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
    ];
    component.masteredModuleIndex = 0;

    expect(component.getModuleMasteredSubtitle()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_ALL_COMPLETE_SUBTITLE'
    );
  });

  it('should return false from isModulePracticeCompleted when the module group is missing', () => {
    component.visibleModuleGroups = [];

    expect(component.isModulePracticeCompleted(0)).toBe(false);
  });

  it('should report practice completion for a mastered module arc', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
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

    expect(ngbModal.open).toHaveBeenCalledWith(ModuleMasteredModalComponent, {
      backdrop: 'static',
      windowClass: 'oppia-module-mastered-modal',
    });
    expect(component.isModulePracticeCompleted(0)).toBe(true);
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
          title: 'Module 1',
          description: 'First module',
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
          title: 'Module 1',
          description: 'First module',
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

  it('should not show the mastered modal when arc_id does not match any module', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
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
        'getAcquiredSkillIds',
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
      storyNodeSpy.getAcquiredSkillIds.and.returnValue([]);
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1', 'node_2', 'node_3'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
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

    expect(ngbModal.open).toHaveBeenCalledWith(ModuleMasteredModalComponent, {
      backdrop: 'static',
      windowClass: 'oppia-module-mastered-modal',
    });

    component.onModuleMasteredContinue();

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

  it('should handle module navigation practice selected when element not found', fakeAsync(() => {
    component.onNavigationPracticeSelected('1');
    tick(300);
  }));

  it('should scroll to lesson element when found by ViewChildren', fakeAsync(() => {
    component.onNavigationLessonSelected({
      lessonNumber: 1,
      moduleIndex: 0,
    });
    tick(300);
  }));

  it('should scroll to practice card element when found by ViewChildren', fakeAsync(() => {
    component.onNavigationPracticeSelected('1');
    tick(300);
  }));

  it('should restore mastered modules from localStorage on init', () => {
    localStorageService.getMasteredModules.and.returnValue(['1']);

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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(localStorageService.getMasteredModules).toHaveBeenCalledWith(
      'story_id_1'
    );
    expect(component.isModulePracticeCompleted(0)).toBe(true);
    expect(component.isModulePracticeCompleted(1)).toBe(false);
  });

  it('should persist mastered modules when returning from arc test', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
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

    expect(ngbModal.open).toHaveBeenCalledWith(ModuleMasteredModalComponent, {
      backdrop: 'static',
      windowClass: 'oppia-module-mastered-modal',
    });
    expect(localStorageService.updateMasteredModules).toHaveBeenCalledWith(
      'story_id_1',
      ['1']
    );
  }));

  it('should retain mastered modules across page reload from localStorage', () => {
    localStorageService.getMasteredModules.and.returnValue(['1', '2']);

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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
        {
          id: 'arc_3',
          title: 'Module 3',
          description: 'Third module',
          node_ids: ['node_3'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.isModulePracticeCompleted(0)).toBe(true);
    expect(component.isModulePracticeCompleted(1)).toBe(true);
    expect(component.isModulePracticeCompleted(2)).toBe(false);
  });

  it('should not persist or restore mastered modules when story id is missing', () => {
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
          title: 'Module 1',
          description: 'First module',
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
    localStorageService.getMasteredModules.calls.reset();
    localStorageService.updateMasteredModules.calls.reset();

    component.ngOnInit();

    expect(localStorageService.getMasteredModules).not.toHaveBeenCalled();
    expect(localStorageService.updateMasteredModules).not.toHaveBeenCalled();
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});

    expect(bottomSheet.open).toHaveBeenCalledWith(
      ModuleSkipConfirmationModalComponent,
      jasmine.objectContaining({data: jasmine.any(Object)})
    );
    expect(ngbModal.open).not.toHaveBeenCalled();

    tick(300);
  }));

  it('should open module mastered modal as bottom sheet on mobile', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
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
      ModuleMasteredModalComponent,
      jasmine.objectContaining({data: jasmine.any(Object)})
    );
    expect(ngbModal.open).not.toHaveBeenCalled();
  }));

  it('should call onModuleSkipConfirmationProceed when bottom sheet confirms', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});

    dismissCallback('confirm');

    expect(component.isModuleSkipped(0)).toBe(true);
    expect(localStorageService.updateSkippedModules).toHaveBeenCalledWith(
      'story_id_1',
      [0]
    );

    tick(300);
  }));

  it('should call onModuleSkipConfirmationCancel when bottom sheet is dismissed', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});

    dismissCallback('cancel');

    expect(component.isModuleSkipped(0)).toBe(false);

    tick(300);
  }));

  it('should call onModuleMasteredContinue when mastered bottom sheet confirms', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
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

    expect(component.masteredModuleIndex).toBeNull();
    expect(Reflect.get(component, 'moduleMasteredModalRef')).toBeNull();
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
          title: 'Module 1',
          description: 'First module',
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

    expect(Reflect.get(component, 'moduleMasteredModalRef')).toBeNull();
  }));

  it('should set active lesson and navigate to startUrl when lesson is in the current module', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1', 'node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.onLessonStartClick({
      lessonNumber: 1,
      startUrl: '/explore/exp_1',
    });

    expect(component.activeLessonNumber).toBe(1);
    expect(component.navigatedLessonNumber).toBe(1);

    tick(300);
  }));

  it('should expand module group when lesson belongs to an module', fakeAsync(() => {
    const storyNodeSpy1 = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy1],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.isModuleExpanded(0)).toBe(true);

    component.onLessonStartClick({
      lessonNumber: 1,
      startUrl: '/explore/exp_1',
    });

    expect(component.isModuleExpanded(0)).toBe(true);

    tick(300);
  }));

  it('should open arc skip confirmation modal when lesson is in a later module and earlier ones are incomplete', fakeAsync(() => {
    windowDimensionsService.getWidth.and.returnValue(1024);
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.onLessonStartClick({
      lessonNumber: 2,
      startUrl: '/explore/exp_2',
    });

    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should not navigate when startUrl is empty', fakeAsync(() => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );

    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    component.activePracticeArcId = 'arc_1';
    component.onLessonStartClick({
      lessonNumber: 1,
      startUrl: '',
    });

    expect(component.activeLessonNumber).toBe(1);
    expect(component.activePracticeArcId).toBe('');

    tick(300);
  }));

  it('should not confirm arc skip nor show a modal when all earlier modules are completed', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'completed')]),
    ];

    component.activePracticeArcId = 'arc_2';
    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});

    expect(ngbModal.open).not.toHaveBeenCalled();
    expect(component.activeLessonNumber).toBe(2);
    expect(component.navigatedLessonNumber).toBe(2);
    expect(component.activePracticeArcId).toBe('');
  });

  it('should open the modal from navigation even when mastery is unlocked', () => {
    component.isMasteryUnlocked = true;
    const mockModalRef = {
      result: new Promise<void>((resolve, reject) => {
        reject('dismiss');
      }),
    };
    ngbModal.open.and.returnValue(mockModalRef as NgbModalRef);

    component.onNavigationMasteryChallengeClicked();

    expect(ngbModal.open).toHaveBeenCalledWith(
      MasteryChallengeLockedModalComponent,
      {
        backdrop: 'static',
        windowClass: 'mastery-locked-modal',
      }
    );
  });

  it('should open the modal from the locked mastery card', () => {
    component.isMasteryUnlocked = false;
    const mockModalRef = {
      result: new Promise<void>((resolve, reject) => {
        reject('dismiss');
      }),
    };
    ngbModal.open.and.returnValue(mockModalRef as NgbModalRef);

    component.onMasteryChallengeCardClicked();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should navigate from the unlocked mastery card', () => {
    component.isMasteryUnlocked = true;
    component.masteryChallengeUrl = '/practice/session/mastery-challenge';

    component.onMasteryChallengeCardClicked();

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      '/practice/session/mastery-challenge'
    );
    expect(ngbModal.open).not.toHaveBeenCalled();
  });

  it('should set isMasteryUnlocked to true and scroll when modal resolves', fakeAsync(() => {
    component.isMasteryUnlocked = false;
    let resolveModal!: () => void;
    const mockModalRef = {
      result: new Promise<void>(resolve => {
        resolveModal = resolve;
      }),
    };
    ngbModal.open.and.returnValue(mockModalRef as NgbModalRef);
    spyOn(component, 'scrollToMasteryChallenge');

    component.onNavigationMasteryChallengeClicked();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(component.isMasteryUnlocked).toBe(false);

    resolveModal();
    tick();

    expect(component.isMasteryUnlocked).toBe(true);
    expect(component.scrollToMasteryChallenge).toHaveBeenCalled();
  }));

  it('should set isMasteryUnlocked to true when story is completed on init', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );

    const storySummary = createStorySummarySpy(['Node 1'], [storyNodeSpy]);
    storySummary.isNodeCompleted.and.returnValue(true);
    storySummary.getCompletedNodeTitles.and.returnValue(['Node 1']);

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.isMasteryUnlocked).toBe(true);
  });

  it('should set isMasteryUnlocked to false when story is not completed on init', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );

    component.storySummary = createStorySummarySpy(['Node 1'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.isMasteryUnlocked).toBe(false);
  });

  it('should not navigate when mastery is unlocked but masteryChallengeUrl is #', () => {
    component.isMasteryUnlocked = true;
    component.masteryChallengeUrl = '#';

    component.onMasteryChallengeCardClicked();

    expect(windowRef.nativeWindow.location.assign).not.toHaveBeenCalled();
    expect(ngbModal.open).not.toHaveBeenCalled();
  });

  it('should return empty string for getModuleCompletionText with invalid index', () => {
    expect(component.getModuleCompletionText(999)).toBe('');
  });

  it('should not include practice questions for lessons with no skill ids', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {acquiredSkillIds: []}
    );
    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.lessonCards[0].hasPracticeQuestions).toBe(false);
    expect(component.moduleGroups[0].hasPracticeQuestions).toBe(false);
  });

  it('should handle practice availability with stale request id', async () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {acquiredSkillIds: ['skill_1']}
    );
    questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync.and.resolveTo(
      2
    );
    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );

    component.ngOnInit();
    Reflect.set(component, 'practiceAvailabilityRequestId', 999);
    await fixture.whenStable();

    expect(component.lessonCards[0].hasPracticeQuestions).toBe(false);
  });

  it('should show practice card when practice count is 1 or more', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.lessonCount = 0;
    component.practiceCount = 2;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.isPracticeCardVisible).toBe(true);
  });

  it('should return default accent colors for module groups', () => {
    expect(component.defaultFallbackAccentColor).toBe('#00645c');
    expect(component.defaultPracticeBgColor).toBe('#ecf7f6');
    expect(component.defaultPracticeAccentColor).toBe('#0b776d');
    expect(component.comingSoonAccentColor).toBe('#6b7280');
  });

  it('should navigate via location.assign when startUrl is set', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();

    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});
    Reflect.set(component, 'pendingStartUrl', '/explore/exp_2');

    component.onModuleSkipConfirmationProceed();

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      '/explore/exp_2'
    );
    tick(300);
  }));

  it('should not navigate when startUrl is empty', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();

    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});

    component.onModuleSkipConfirmationProceed();

    expect(windowRef.nativeWindow.location.assign).not.toHaveBeenCalledWith(
      '/explore/exp_2'
    );
    tick(300);
  }));

  it('should expand the target module and mark earlier ones skipped', fakeAsync(() => {
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();

    component.onLessonStartClick({lessonNumber: 2, startUrl: ''});

    component.onModuleSkipConfirmationProceed();

    expect(component.isModuleSkipped(0)).toBe(true);
    expect(component.isModuleExpanded(1)).toBe(true);
    expect(component.activeLessonNumber).toBe(2);
    expect(component.navigatedLessonNumber).toBe(2);
    tick(300);
  }));

  it('should open skip modal and navigate on proceed', fakeAsync(() => {
    windowDimensionsService.getWidth.and.returnValue(1024);
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();

    let resolveModal!: () => void;
    const mockModalRef = {
      result: new Promise<void>(resolve => {
        resolveModal = resolve;
      }),
      componentInstance: {},
    };
    ngbModal.open.and.returnValue(mockModalRef as NgbModalRef);

    component.onLessonStartClick({
      lessonNumber: 2,
      startUrl: '/explore/exp_2',
    });

    expect(ngbModal.open).toHaveBeenCalled();

    resolveModal();
    tick();

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      '/explore/exp_2'
    );
    expect(component.activeLessonNumber).toBe(2);
    expect(component.navigatedLessonNumber).toBe(2);
    tick(300);
  }));

  it('should navigate directly when lesson is in current module', fakeAsync(() => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );
    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();

    component.onLessonStartClick({
      lessonNumber: 1,
      startUrl: '/explore/exp_1',
    });

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      '/explore/exp_1'
    );
    expect(component.activeLessonNumber).toBe(1);
    expect(component.navigatedLessonNumber).toBe(1);
    tick(300);
  }));

  it('should not change lesson numbers when next module has empty lessonCards', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', []),
    ];
    component.masteredModuleIndex = 0;

    component.onModuleMasteredContinue();

    expect(component.isModuleExpanded(0)).toBe(false);
    expect(component.isModuleExpanded(1)).toBe(true);
    expect(component.activeLessonNumber).toBeNull();
    expect(component.navigatedLessonNumber).toBeNull();
    expect(component.masteredModuleIndex).toBeNull();
  });

  it('should set hasHandledArcMasteredQueryParams to true', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
    ];
    component.masteredModuleIndex = 0;

    component.onModuleMasteredContinue();

    expect(Reflect.get(component, 'hasHandledArcMasteredQueryParams')).toBe(
      true
    );
  });

  it('should set navigatedLessonNumber on continue', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', [
        createLessonCard(2, 'not_started'),
        createLessonCard(3, 'not_started'),
      ]),
    ];
    component.masteredModuleIndex = 0;

    component.onModuleMasteredContinue();

    expect(component.navigatedLessonNumber).toBe(2);
  });

  it('should return all complete subtitle when no more modules exist', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
    ];
    component.masteredModuleIndex = 0;

    expect(component.getModuleMasteredSubtitle()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_ALL_COMPLETE_SUBTITLE'
    );
  });

  it('should return unlocked subtitle when next module exists', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];
    component.masteredModuleIndex = 0;

    expect(component.getModuleMasteredSubtitle()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_UNLOCKED_SUBTITLE'
    );
  });

  it('should return momentum subtitle when masteredModuleIndex is null', () => {
    component.masteredModuleIndex = null;

    expect(component.getModuleMasteredSubtitle()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_MOMENTUM_SUBTITLE'
    );
  });

  it('should return empty string when pendingModuleIndex is null', () => {
    Reflect.set(component, 'pendingNavigationModuleIndex', null);

    expect(component.getModuleSkipConfirmationMessage()).toBe('');
  });

  it('should return empty string when all earlier modules are completed', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];
    Reflect.set(component, 'pendingNavigationModuleIndex', 1);

    expect(component.getModuleSkipConfirmationMessage()).toBe('');
  });

  it('should handle fetchTotalQuestionCount failure gracefully', async () => {
    questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync.and.rejectWith(
      new Error('Network error')
    );
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {acquiredSkillIds: ['skill_1']}
    );
    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.lessonCards[0].hasPracticeQuestions).toBe(false);
  });

  it('should not expand any module when moduleIndex is -1', fakeAsync(() => {
    component.onNavigationLessonSelected({
      lessonNumber: 1,
      moduleIndex: -1,
    });

    expect(component.activeLessonNumber).toBe(1);
    expect(component.navigatedLessonNumber).toBe(1);
    tick(300);
  }));

  it('should update practiceCard when practiceSubtopicIds changes', () => {
    component.practiceSubtopicIds = [1];
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnChanges({
      practiceSubtopicIds: new SimpleChange([1], [2], false),
    });

    expect(component.practiceCard).toBeDefined();
  });

  it('should not expand any module when moduleIndex is -1', fakeAsync(() => {
    component.onNavigationLessonSelected({
      lessonNumber: 1,
      moduleIndex: -1,
    });

    expect(component.activeLessonNumber).toBe(1);
    expect(component.navigatedLessonNumber).toBe(1);
    tick(300);
  }));

  it('should handle fetchTotalQuestionCount failure gracefully', async () => {
    questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync.and.rejectWith(
      new Error('Network error')
    );
    const storyNodeSpy = createStoryNodeSpy(
      'Node title 1',
      'Node description 1',
      'exp_1',
      'node_1',
      'thumb.png',
      {acquiredSkillIds: ['skill_1']}
    );
    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.lessonCards[0].hasPracticeQuestions).toBe(false);
  });

  it('should return empty string when pendingModuleIndex is null', () => {
    Reflect.set(component, 'pendingNavigationModuleIndex', null);

    expect(component.getModuleSkipConfirmationMessage()).toBe('');
  });

  it('should return empty string when all earlier modules are completed', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];
    Reflect.set(component, 'pendingNavigationModuleIndex', 1);

    expect(component.getModuleSkipConfirmationMessage()).toBe('');
  });

  it('should return all complete subtitle when no more modules exist', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
    ];
    component.masteredModuleIndex = 0;

    expect(component.getModuleMasteredSubtitle()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_ALL_COMPLETE_SUBTITLE'
    );
  });

  it('should return unlocked subtitle when next module exists', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];
    component.masteredModuleIndex = 0;

    expect(component.getModuleMasteredSubtitle()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_UNLOCKED_SUBTITLE'
    );
  });

  it('should return momentum subtitle when masteredModuleIndex is null', () => {
    component.masteredModuleIndex = null;

    expect(component.getModuleMasteredSubtitle()).toBe(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_MOMENTUM_SUBTITLE'
    );
  });

  it('should not change lesson numbers when next module has empty lessonCards', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', []),
    ];
    component.masteredModuleIndex = 0;

    component.onModuleMasteredContinue();

    expect(component.isModuleExpanded(0)).toBe(false);
    expect(component.isModuleExpanded(1)).toBe(true);
    expect(component.activeLessonNumber).toBeNull();
    expect(component.navigatedLessonNumber).toBeNull();
    expect(component.masteredModuleIndex).toBeNull();
  });

  it('should set hasHandledArcMasteredQueryParams to true', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
    ];
    component.masteredModuleIndex = 0;

    component.onModuleMasteredContinue();

    expect(Reflect.get(component, 'hasHandledArcMasteredQueryParams')).toBe(
      true
    );
  });

  it('should set navigatedLessonNumber on continue', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', [
        createLessonCard(2, 'not_started'),
        createLessonCard(3, 'not_started'),
      ]),
    ];
    component.masteredModuleIndex = 0;

    component.onModuleMasteredContinue();

    expect(component.navigatedLessonNumber).toBe(2);
  });

  it('should navigate directly when lesson is in current module', fakeAsync(() => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node 1',
      'Desc 1',
      'exp_1',
      'node_1',
      null
    );
    component.storySummary = createStorySummarySpy(
      ['Node 1'],
      [storyNodeSpy],
      [
        {
          id: 'arc_1',
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();

    component.onLessonStartClick({
      lessonNumber: 1,
      startUrl: '/explore/exp_1',
    });

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      '/explore/exp_1'
    );
    expect(component.activeLessonNumber).toBe(1);
    expect(component.navigatedLessonNumber).toBe(1);
    tick(300);
  }));

  it('should open skip modal and navigate on proceed', fakeAsync(() => {
    windowDimensionsService.getWidth.and.returnValue(1024);
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
          title: 'Module 1',
          description: 'First module',
          node_ids: ['node_1'],
        },
        {
          id: 'arc_2',
          title: 'Module 2',
          description: 'Second module',
          node_ids: ['node_2'],
        },
      ]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.ngOnInit();

    let resolveModal!: () => void;
    const mockModalRef = {
      result: new Promise<void>(resolve => {
        resolveModal = resolve;
      }),
      componentInstance: {},
    };
    ngbModal.open.and.returnValue(mockModalRef as NgbModalRef);

    component.onLessonStartClick({
      lessonNumber: 2,
      startUrl: '/explore/exp_2',
    });

    expect(ngbModal.open).toHaveBeenCalled();

    resolveModal();
    tick();

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      '/explore/exp_2'
    );
    expect(component.activeLessonNumber).toBe(2);
    expect(component.navigatedLessonNumber).toBe(2);
    tick(300);
  }));

  it('should scroll to the mastery challenge card when it exists', fakeAsync(() => {
    const card = jasmine.createSpyObj<HTMLElement>('card', [
      'getBoundingClientRect',
    ]);
    card.getBoundingClientRect.and.returnValue({top: 500} as DOMRect);
    windowRef.nativeWindow.document.querySelector.and.callFake(
      (selector: string) =>
        selector === '.mastery-challenge-card' ? card : null
    );
    windowRef.nativeWindow.scrollY = 200;

    component.scrollToMasteryChallenge();
    tick(50);

    expect(windowRef.nativeWindow.document.querySelector).toHaveBeenCalledWith(
      '.mastery-challenge-card'
    );
    expect(windowRef.nativeWindow.scrollTo).toHaveBeenCalledWith({
      top: 500 + 200 - (56 + 16),
      behavior: 'smooth',
    });
  }));

  it('should not scroll when the mastery challenge card does not exist', fakeAsync(() => {
    windowRef.nativeWindow.document.querySelector.and.returnValue(null);

    component.scrollToMasteryChallenge();
    tick(50);

    expect(windowRef.nativeWindow.scrollTo).not.toHaveBeenCalled();
  }));

  it('should scroll to the lesson element when found by getElementById', fakeAsync(() => {
    const lessonEl = jasmine.createSpyObj<HTMLElement>('lessonEl', [
      'getBoundingClientRect',
    ]);
    lessonEl.getBoundingClientRect.and.returnValue({top: 300} as DOMRect);
    windowRef.nativeWindow.document.getElementById.and.callFake((id: string) =>
      id === 'lesson-1' ? lessonEl : null
    );
    windowRef.nativeWindow.document.querySelector.and.returnValue(null);

    component.onNavigationLessonSelected({
      lessonNumber: 1,
      moduleIndex: -1,
    });
    tick(300);

    expect(windowRef.nativeWindow.document.getElementById).toHaveBeenCalledWith(
      'lesson-1'
    );
    expect(windowRef.nativeWindow.scrollTo).toHaveBeenCalledWith({
      top: 300 - (56 + 16),
      behavior: 'smooth',
    });
  }));

  it('should account for the module navigation height when scrolling', fakeAsync(() => {
    const lessonEl = jasmine.createSpyObj<HTMLElement>('lessonEl', [
      'getBoundingClientRect',
    ]);
    lessonEl.getBoundingClientRect.and.returnValue({top: 300} as DOMRect);
    const moduleNav = jasmine.createSpyObj<HTMLElement>('moduleNav', [
      'getBoundingClientRect',
    ]);
    moduleNav.getBoundingClientRect.and.returnValue({height: 80} as DOMRect);
    windowRef.nativeWindow.document.getElementById.and.callFake((id: string) =>
      id === 'lesson-1' ? lessonEl : null
    );
    windowRef.nativeWindow.document.querySelector.and.callFake(
      (selector: string) =>
        selector === '.module-navigation-container' ? moduleNav : null
    );

    component.onNavigationLessonSelected({
      lessonNumber: 1,
      moduleIndex: -1,
    });
    tick(300);

    expect(windowRef.nativeWindow.document.querySelector).toHaveBeenCalledWith(
      '.module-navigation-container'
    );
    expect(windowRef.nativeWindow.scrollTo).toHaveBeenCalledWith({
      top: 300 - (56 + 80 + 16),
      behavior: 'smooth',
    });
  }));

  it('should scroll to the coming soon lesson element when found', fakeAsync(() => {
    const comingSoonEl = jasmine.createSpyObj<HTMLElement>('comingSoonEl', [
      'getBoundingClientRect',
    ]);
    comingSoonEl.getBoundingClientRect.and.returnValue({
      top: 450,
    } as DOMRect);
    windowRef.nativeWindow.document.getElementById.and.callFake((id: string) =>
      id === 'coming-soon-lesson-1' ? comingSoonEl : null
    );
    windowRef.nativeWindow.document.querySelector.and.returnValue(null);

    component.onNavigationLessonSelected({
      lessonNumber: 1,
      moduleIndex: -1,
    });
    tick(300);

    expect(windowRef.nativeWindow.document.getElementById).toHaveBeenCalledWith(
      'coming-soon-lesson-1'
    );
    expect(windowRef.nativeWindow.scrollTo).toHaveBeenCalledWith({
      top: 450 - (56 + 16),
      behavior: 'smooth',
    });
  }));

  it('should mark earlier incomplete modules as skipped', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'not_started')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];

    (
      Reflect.get(component, 'markSkippedModulesBefore') as (
        idx: number
      ) => void
    ).call(component, 1);

    expect(component.isModuleSkipped(0)).toBe(true);
    expect(localStorageService.updateSkippedModules).toHaveBeenCalled();
  });

  it('should return early when targetModuleIndex is 0', () => {
    (
      Reflect.get(component, 'markSkippedModulesBefore') as (
        idx: number
      ) => void
    ).call(component, 0);

    expect(localStorageService.updateSkippedModules).not.toHaveBeenCalled();
  });

  it('should return early when targetModuleIndex is negative', () => {
    (
      Reflect.get(component, 'markSkippedModulesBefore') as (
        idx: number
      ) => void
    ).call(component, -1);

    expect(localStorageService.updateSkippedModules).not.toHaveBeenCalled();
  });

  it('should not mark modules that are already completed', () => {
    component.visibleModuleGroups = [
      createModuleGroup('Module 1', [createLessonCard(1, 'completed')]),
      createModuleGroup('Module 2', [createLessonCard(2, 'not_started')]),
    ];
    Reflect.set(component, 'completedModulePracticeArcIds', new Set(['1']));

    (
      Reflect.get(component, 'markSkippedModulesBefore') as (
        idx: number
      ) => void
    ).call(component, 1);

    expect(component.isModuleSkipped(0)).toBe(false);
  });
});
