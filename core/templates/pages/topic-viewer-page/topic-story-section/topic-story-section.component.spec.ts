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

import {StoryNode} from 'domain/story/story-node.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicSessionFallbackLanguageService} from 'pages/topic-viewer-page/services/topic-session-fallback-language.service';
import {UrlService} from 'services/contextual/url.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {ChapterLabelVisibilityService} from 'services/chapter-label-visibility.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ChapterProgressLoaderService} from 'services/chapter-progress-loader.service';

import {TopicStorySectionComponent} from './topic-story-section.component';
import {ChapterProgressSummary} from 'domain/exploration/chapter-progress-summary.model';

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
  let platformFeatureService: {
    status: {
      SerialChapterLaunchLearnerView: {
        isEnabled: boolean;
      };
    };
  };

  beforeEach(waitForAsync(() => {
    urlService = jasmine.createSpyObj('UrlService', [
      'getLearnerTopicStudyGuideUrl',
      'getClassroomUrlFragmentFromLearnerUrl',
      'getTopicUrlFragmentFromLearnerUrl',
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
    platformFeatureService = {
      status: {
        SerialChapterLaunchLearnerView: {
          isEnabled: false,
        },
      },
    };

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
          provide: PlatformFeatureService,
          useValue: platformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicStorySectionComponent);
    component = fixture.componentInstance;

    urlService.getLearnerTopicStudyGuideUrl.and.returnValue(
      '/learn/math/place-values/studyguide'
    );
    urlService.getClassroomUrlFragmentFromLearnerUrl.and.returnValue('math');
    urlService.getTopicUrlFragmentFromLearnerUrl.and.returnValue('topic');
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

    fixture.detectChanges();
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

  it('should expose story meta text helpers', () => {
    component.lessonCount = 2;
    component.practiceCount = 1;

    expect(component.getStoryMetaText()).toBe('2 lessons');
    expect(component.getStoryMetaAriaLabel()).toBe('2 lessons available');
  });

  it('should set study guide url on init', () => {
    expect(component.studyGuideUrl).toBe('/learn/math/place-values/studyguide');
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
    const storyNodeSpy1 = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy1.getTitle.and.returnValue('Node title 1');
    storyNodeSpy1.getDescription.and.returnValue('Node description 1');
    storyNodeSpy1.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy1.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy1.getId.and.returnValue('node_1');

    const storyNodeSpy2 = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy2.getTitle.and.returnValue('Node title 2');
    storyNodeSpy2.getDescription.and.returnValue('Node description 2');
    storyNodeSpy2.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy2.getExplorationId.and.returnValue('exp_2');
    storyNodeSpy2.getId.and.returnValue('node_2');

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
    expect(component.adventureGroups[0].lessonCards.length).toBe(1);
    expect(component.adventureGroups[0].lessonCards[0].lessonTitle).toContain(
      'Node title 1'
    );
    expect(component.adventureGroups[1].adventureTitle).toBe('Adventure 2');
    expect(component.adventureGroups[1].lessonCards.length).toBe(1);
    expect(component.adventureGroups[1].lessonCards[0].lessonTitle).toContain(
      'Node title 2'
    );
  });

  it('should build lesson cards from storySummary and not create practice card', () => {
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);

    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);

    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);

    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);

    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    fixture.detectChanges();

    expect(component.lessonCards.length).toBe(1);
    expect(component.lessonCards[0].totalCheckpointsCount).toBe(5);
    expect(component.lessonCards[0].visitedCheckpointsCount).toBe(3);
  });

  it('should preserve checkpoint counts after non-story input changes', () => {
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);

    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
      '/learn/math/place-values/studyguide'
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);

    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue(null);
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);

    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const initialStudyGuideUrl = component.studyGuideUrl;
    urlService.getLearnerTopicStudyGuideUrl.and.returnValue('/learn/new/study');

    component.ngOnChanges({
      storySummary: new SimpleChange(null, null, false),
    });

    expect(component.studyGuideUrl).not.toBe(initialStudyGuideUrl);
    expect(component.studyGuideUrl).toBe('/learn/new/study');
  });

  it('should not sync on unrelated ngOnChanges input updates', () => {
    component.studyGuideUrl = 'unchanged-value';
    urlService.getLearnerTopicStudyGuideUrl.and.returnValue('/learn/new/study');

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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');

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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue(null);
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);

    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);

    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue(null);
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);

    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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

  it('should return empty string for getAdventureCompletionText with invalid index', () => {
    expect(component.getAdventureCompletionText(999)).toBe('');
  });

  it('should return correct adventure completion text', () => {
    const storyNodeSpy1 = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy1.getTitle.and.returnValue('Node 1');
    storyNodeSpy1.getDescription.and.returnValue('Desc 1');
    storyNodeSpy1.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy1.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy1.getId.and.returnValue('node_1');
    storyNodeSpy1.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy1.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy1.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    const storyNodeSpy2 = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy2.getTitle.and.returnValue('Node 2');
    storyNodeSpy2.getDescription.and.returnValue('Desc 2');
    storyNodeSpy2.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy2.getExplorationId.and.returnValue('exp_2');
    storyNodeSpy2.getId.and.returnValue('node_2');
    storyNodeSpy2.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy2.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy2.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Coming Soon Node');
    storyNodeSpy.getDescription.and.returnValue('Description');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue(null);
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    storyNodeSpy.getTitle.and.returnValue('Coming Soon Node');
    storyNodeSpy.getDescription.and.returnValue('Description');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getStatus.and.returnValue('Ready To Publish');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Completed Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy1 = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy1.getTitle.and.returnValue('Node 1');
    storyNodeSpy1.getDescription.and.returnValue('Desc 1');
    storyNodeSpy1.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy1.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy1.getId.and.returnValue('node_1');
    storyNodeSpy1.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy1.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy1.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    const storyNodeSpy2 = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy2.getTitle.and.returnValue('Node 2');
    storyNodeSpy2.getDescription.and.returnValue('Desc 2');
    storyNodeSpy2.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy2.getExplorationId.and.returnValue('exp_2');
    storyNodeSpy2.getId.and.returnValue('node_2');
    storyNodeSpy2.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy2.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy2.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    fixture.detectChanges();

    component.onNavigationLessonSelected(2);

    expect(component.activeLessonNumber).toBe(2);
    expect(component.navigatedLessonNumber).toBe(2);
    expect(component.isAdventureExpanded(0)).toBe(true);

    tick(300);
  }));

  it('should handle adventure navigation practice selected when practice card is not rendered', fakeAsync(() => {
    component.onNavigationPracticeSelected(0);

    tick(300);

    expect(component.practiceCardWrappers.length).toBe(0);
  }));

  it('should select first not_started lesson as active when no in_progress', () => {
    const storyNodeSpy1 = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy1.getTitle.and.returnValue('Completed Node');
    storyNodeSpy1.getDescription.and.returnValue('Desc 1');
    storyNodeSpy1.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy1.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy1.getId.and.returnValue('node_1');
    storyNodeSpy1.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy1.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy1.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    const storyNodeSpy2 = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy2.getTitle.and.returnValue('Not Started Node');
    storyNodeSpy2.getDescription.and.returnValue('Desc 2');
    storyNodeSpy2.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy2.getExplorationId.and.returnValue('exp_2');
    storyNodeSpy2.getId.and.returnValue('node_2');
    storyNodeSpy2.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy2.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy2.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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

    expect(component._expandedAdventureIndices.size).toBe(0);
  });

  it('should return isPracticeCardVisible from shouldShowAdventureEndTestCard', () => {
    component.isPracticeCardVisible = true;
    expect(component.shouldShowAdventureEndTestCard(0)).toBe(true);

    component.isPracticeCardVisible = false;
    expect(component.shouldShowAdventureEndTestCard(0)).toBe(false);
  });

  it('should scroll to the lesson card when navigating to a lesson', fakeAsync(() => {
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    fixture.detectChanges();

    const lessonWrapper = component.lessonCardWrappers
      .toArray()
      .find(wrapper => wrapper.nativeElement.id === 'lesson-1');
    expect(lessonWrapper).toBeDefined();
    if (!lessonWrapper) {
      fail('Expected lesson wrapper to be defined');
      return;
    }
    spyOn(lessonWrapper.nativeElement, 'scrollIntoView');

    component.onNavigationLessonSelected(1);

    tick(300);

    expect(lessonWrapper.nativeElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  }));

  it('should scroll to the practice card when navigating to a practice session', fakeAsync(() => {
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    component.practiceCount = 1;

    component.ngOnInit();
    fixture.detectChanges();

    const practiceCardWrapper = component.practiceCardWrappers
      .toArray()
      .find(wrapper => wrapper.nativeElement.id === 'practice-card-0');
    expect(practiceCardWrapper).toBeDefined();
    if (!practiceCardWrapper) {
      fail('Expected practice card wrapper to be defined');
      return;
    }
    spyOn(practiceCardWrapper.nativeElement, 'scrollIntoView');

    component.onNavigationPracticeSelected(0);

    tick(300);

    expect(
      practiceCardWrapper.nativeElement.scrollIntoView
    ).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  }));

  it('should handle buildAdventureGroups when arcs is null', async () => {
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    urlService.getLearnerTopicStudyGuideUrl.and.returnValue('/learn/new/study');

    component.ngOnChanges({
      storyTitle: new SimpleChange('Old Title', 'New Title', false),
    });

    expect(component.studyGuideUrl).toBe('/learn/new/study');
  });

  it('should sync on storyDescription ngOnChanges input update', () => {
    urlService.getLearnerTopicStudyGuideUrl.and.returnValue('/learn/new/study');

    component.ngOnChanges({
      storyDescription: new SimpleChange('Old', 'New', false),
    });

    expect(component.studyGuideUrl).toBe('/learn/new/study');
  });

  it('should sync on classroomUrlFragment ngOnChanges input update', () => {
    urlService.getLearnerTopicStudyGuideUrl.and.returnValue('/learn/new/study');

    component.ngOnChanges({
      classroomUrlFragment: new SimpleChange('', 'science', false),
    });

    expect(component.studyGuideUrl).toBe('/learn/new/study');
  });

  it('should sync on topicUrlFragment ngOnChanges input update', () => {
    urlService.getLearnerTopicStudyGuideUrl.and.returnValue('/learn/new/study');

    component.ngOnChanges({
      topicUrlFragment: new SimpleChange('', 'biology', false),
    });

    expect(component.studyGuideUrl).toBe('/learn/new/study');
  });

  it('should sync on lessonCount ngOnChanges input update', () => {
    urlService.getLearnerTopicStudyGuideUrl.and.returnValue('/learn/new/study');

    component.ngOnChanges({
      lessonCount: new SimpleChange(0, 5, false),
    });

    expect(component.studyGuideUrl).toBe('/learn/new/study');
  });

  it('should return # as lesson start url when only topic fragment is missing', () => {
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getStatus.and.returnValue('Published');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
      },
    ]);
    expect(component.adventureNavigationGroups[0].accentColor).toBe('#27a844');
    expect(component.adventureNavigationGroups[0].showPractice).toBe(true);
  });

  it('should exclude non-published lessons from adventure navigation groups', () => {
    const publishedNodeSpy = jasmine.createSpyObj('StoryNode', [
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
    publishedNodeSpy.getTitle.and.returnValue('Published Node');
    publishedNodeSpy.getDescription.and.returnValue('Desc');
    publishedNodeSpy.getThumbnailFilename.and.returnValue(null);
    publishedNodeSpy.getExplorationId.and.returnValue('exp_1');
    publishedNodeSpy.getId.and.returnValue('node_1');
    publishedNodeSpy.getStatus.and.returnValue('Published');
    publishedNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    publishedNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    publishedNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    const draftNodeSpy = jasmine.createSpyObj('StoryNode', [
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
    draftNodeSpy.getTitle.and.returnValue('Draft Node');
    draftNodeSpy.getDescription.and.returnValue('Desc');
    draftNodeSpy.getThumbnailFilename.and.returnValue(null);
    draftNodeSpy.getExplorationId.and.returnValue('exp_2');
    draftNodeSpy.getId.and.returnValue('node_2');
    draftNodeSpy.getStatus.and.returnValue('Draft');
    draftNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    draftNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    draftNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
        lessons: [{lessonNumber: 1}],
        accentColor: '#27a844',
        showPractice: true,
      },
    ]);
  });

  it('should handle onNavigationLessonSelected when lesson is not in any adventure', fakeAsync(() => {
    component.storySummary = createStorySummarySpy([], []);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    fixture.detectChanges();

    component.onNavigationLessonSelected(999);

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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node 1');
    storyNodeSpy.getDescription.and.returnValue('Desc 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue(['en']);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].isNewLabelVisible).toBe(false);
  });

  it('should return false from isChapterPublished when getStatus throws', () => {
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
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getStatus.and.throwError('Status error');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].isPublished).toBe(false);
  });

  it('should return false from isChapterPublished when getStatus returns null', () => {
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
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getStatus.and.returnValue(null);
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].isPublished).toBe(false);
  });

  it('should return false from isChapterReadyToPublish when getStatus returns null', () => {
    platformFeatureService.status.SerialChapterLaunchLearnerView.isEnabled =
      true;
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
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getStatus.and.returnValue(null);
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards[0].lessonProgressStatus).toBe('not_started');
  });

  it('should use longer practice description when there are multiple adventure groups', () => {
    const storyNodeSpy1 = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy1.getTitle.and.returnValue('Node 1');
    storyNodeSpy1.getDescription.and.returnValue('Desc 1');
    storyNodeSpy1.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy1.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy1.getId.and.returnValue('node_1');
    storyNodeSpy1.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy1.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy1.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    const storyNodeSpy2 = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy2.getTitle.and.returnValue('Node 2');
    storyNodeSpy2.getDescription.and.returnValue('Desc 2');
    storyNodeSpy2.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy2.getExplorationId.and.returnValue('exp_2');
    storyNodeSpy2.getId.and.returnValue('node_2');
    storyNodeSpy2.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy2.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy2.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
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
    component.practiceCount = 1;

    component.ngOnInit();

    expect(component.isPracticeCardVisible).toBe(true);
    expect(component.practiceCard.practiceDescription).toBe(
      'Test what you have learned in Adventure 1 to unlock Adventure 2.'
    );
  });

  it('should scroll to the coming-soon lesson card when navigating to it', fakeAsync(() => {
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
      'getAvailableTextLanguageCodes',
      'getAvailableVoiceoverLanguageCodes',
      'getAvailableVoiceoverLanguageAccentDescriptions',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue(null);
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();
    fixture.detectChanges();

    const lessonWrapper = component.lessonCardWrappers
      .toArray()
      .find(wrapper => wrapper.nativeElement.id === 'coming-soon-lesson-1');
    expect(lessonWrapper).toBeDefined();
    if (!lessonWrapper) {
      fail('Expected coming-soon lesson wrapper to be defined');
      return;
    }
    spyOn(lessonWrapper.nativeElement, 'scrollIntoView');

    component.onNavigationLessonSelected(1);

    tick(300);

    expect(lessonWrapper.nativeElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  }));

  it('should return false from isChapterReadyToPublish when getStatus throws and serial flag enabled', () => {
    platformFeatureService.status.SerialChapterLaunchLearnerView.isEnabled =
      true;
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
    storyNodeSpy.getTitle.and.returnValue('Node');
    storyNodeSpy.getDescription.and.returnValue('Desc');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');
    storyNodeSpy.getStatus.and.throwError('Status error');
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );

    component.storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    // When getStatus throws and serial flag is enabled, isComingSoon falls back to false
    // (getExplorationId is set so it won't be coming_soon via the null check)
    expect(component.lessonCards[0].lessonProgressStatus).toBe('not_started');
  });
});
