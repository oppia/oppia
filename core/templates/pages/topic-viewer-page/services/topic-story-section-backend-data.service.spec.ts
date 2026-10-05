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
 * @fileoverview Unit tests for TopicStorySectionBackendDataService.
 */

import {TestBed} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';

import {StoryNode} from 'domain/story/story-node.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ChapterLabelVisibilityService} from 'services/chapter-label-visibility.service';

import {TopicStorySectionBackendDataService} from './topic-story-section-backend-data.service';

class MockTranslateService {
  instant(key: string, params?: Record<string, unknown>): string {
    if (params) {
      return key + ':' + JSON.stringify(params);
    }
    return key;
  }
}

describe('TopicStorySectionBackendDataService', () => {
  let service: TopicStorySectionBackendDataService;
  let urlService: jasmine.SpyObj<UrlService>;
  let urlInterpolationService: jasmine.SpyObj<UrlInterpolationService>;
  let assetsBackendApiService: jasmine.SpyObj<AssetsBackendApiService>;
  let chapterLabelVisibilityService: jasmine.SpyObj<ChapterLabelVisibilityService>;
  let questionBackendApiService: jasmine.SpyObj<QuestionBackendApiService>;
  let translateService: TranslateService;

  beforeEach(() => {
    urlService = jasmine.createSpyObj('UrlService', ['addField']);
    urlInterpolationService = jasmine.createSpyObj('UrlInterpolationService', [
      'getStaticImageUrl',
      'getStaticCopyrightedImageUrl',
      'interpolateUrl',
    ]);
    assetsBackendApiService = jasmine.createSpyObj('AssetsBackendApiService', [
      'getThumbnailUrlForPreview',
    ]);
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

    TestBed.configureTestingModule({
      providers: [
        TopicStorySectionBackendDataService,
        {provide: UrlService, useValue: urlService},
        {
          provide: UrlInterpolationService,
          useValue: urlInterpolationService,
        },
        {
          provide: AssetsBackendApiService,
          useValue: assetsBackendApiService,
        },
        {
          provide: ChapterLabelVisibilityService,
          useValue: chapterLabelVisibilityService,
        },
        {
          provide: QuestionBackendApiService,
          useValue: questionBackendApiService,
        },
        {provide: TranslateService, useClass: MockTranslateService},
      ],
    });

    service = TestBed.inject(TopicStorySectionBackendDataService);
    translateService = TestBed.inject(TranslateService);
    spyOn(translateService, 'instant').and.callThrough();

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
    storyNodeSpy.getStatus.and.returnValue(options.status ?? null);
    storyNodeSpy.getAcquiredSkillIds.and.returnValue(
      options.acquiredSkillIds ?? []
    );
    storyNodeSpy.getAvailableTextLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageCodes.and.returnValue([]);
    storyNodeSpy.getAvailableVoiceoverLanguageAccentDescriptions.and.returnValue(
      {}
    );
    return storyNodeSpy;
  };

  it('should build lesson cards with progress and URLs', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node Title',
      'Node Desc',
      'exp_1',
      'node_1',
      'thumb.png',
      {status: 'Published'}
    );
    const storySummary = createStorySummarySpy(['Node Title'], [storyNodeSpy]);

    const cards = service.buildLessonCards(
      [storyNodeSpy],
      storySummary,
      'math',
      'topic'
    );

    expect(cards.length).toBe(1);
    expect(cards[0].lessonNumber).toBe(1);
    expect(cards[0].lessonTitle).toBe('Node Title');
    expect(cards[0].lessonDescription).toBe('Node Desc');
    expect(cards[0].thumbnailUrl).toBe('/thumbnail/story/story_id/thumb.png');
    expect(cards[0].lessonProgressStatus).toBe('not_started');
    expect(cards[0].isComingSoon).toBe(false);
    expect(cards[0].isPublished).toBe(true);
    expect(cards[0].isNewLabelVisible).toBe(false);
    expect(cards[0].nodeId).toBe('node_1');
  });

  it('should mark coming soon lesson cards without start or practice urls', () => {
    const storyNodeSpy = createStoryNodeSpy('Node', 'Desc', null, 'node_1');
    const storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);

    const cards = service.buildLessonCards(
      [storyNodeSpy],
      storySummary,
      'math',
      'topic'
    );

    expect(cards[0].lessonProgressStatus).toBe('coming_soon');
    expect(cards[0].isComingSoon).toBe(true);
    expect(cards[0].startUrl).toBe('#');
    expect(cards[0].practiceUrl).toBe('#');
  });

  it('should use fallback thumbnail when node has no thumbnail file', () => {
    const storyNodeSpy = createStoryNodeSpy(
      'Node',
      'Desc',
      'exp_1',
      'node_1',
      null
    );
    const storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);

    const cards = service.buildLessonCards(
      [storyNodeSpy],
      storySummary,
      'math',
      'topic'
    );

    expect(cards[0].thumbnailUrl).toBe(
      '/assets/images/splash/student_desk1x.webp'
    );
  });

  it('should build module groups from story arcs', () => {
    const node1 = createStoryNodeSpy('Lesson 1', 'Desc', 'exp_1', 'node_1');
    const node2 = createStoryNodeSpy('Lesson 2', 'Desc', 'exp_2', 'node_2');
    const storySummary = createStorySummarySpy(
      ['Lesson 1', 'Lesson 2'],
      [node1, node2],
      [
        {title: 'Arc 1', description: 'Arc Desc', node_ids: ['node_1']},
        {title: 'Arc 2', description: 'Arc Desc', node_ids: ['node_2']},
      ]
    );
    const lessonCards = service.buildLessonCards(
      [node1, node2],
      storySummary,
      'math',
      'topic'
    );

    const groups = service.buildModuleGroups(
      [node1, node2],
      storySummary,
      lessonCards
    );

    expect(groups.length).toBe(2);
    expect(groups[0].moduleTitle).toBe('Arc 1');
    expect(groups[0].moduleDescription).toBe('Arc Desc');
    expect(groups[0].lessonCards.length).toBe(1);
    expect(groups[0].lessonCards[0].lessonNumber).toBe(1);
    expect(groups[0].arcId).toBe('1');
    expect(groups[1].arcId).toBe('2');
    expect(groups[0].hasPracticeQuestions).toBe(false);
  });

  it('should return empty module groups when arcs are null', () => {
    const node1 = createStoryNodeSpy('Lesson 1', 'Desc', 'exp_1', 'node_1');
    const storySummary = createStorySummarySpy(['Lesson 1'], [node1]);
    storySummary.getArcs.and.returnValue(null);

    const groups = service.buildModuleGroups([node1], storySummary, []);

    expect(groups).toEqual([]);
  });

  it('should return empty module groups when arcs are empty', () => {
    const node1 = createStoryNodeSpy('Lesson 1', 'Desc', 'exp_1', 'node_1');
    const storySummary = createStorySummarySpy(['Lesson 1'], [node1], []);

    const groups = service.buildModuleGroups([node1], storySummary, []);

    expect(groups).toEqual([]);
  });

  it('should derive palette color by cycling the arc palette', () => {
    expect(service.getModulePaletteColor(0)).toBeDefined();
    expect(service.getModulePaletteColor(1)).toBeDefined();
    expect(service.getModulePaletteColor(2)).toBeDefined();
  });

  it('should return practice title for a module', () => {
    expect(service.getPracticeTitle(0)).toBe('Module 1 Review & Test');
    expect(service.getPracticeTitle(1)).toBe('Module 2 Review & Test');
  });

  it('should return practice description for a non-final module', () => {
    const result = service.getPracticeDescription(0, false);
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_WITH_NEXT',
      jasmine.any(Object)
    );
    expect(result).toContain(
      'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_WITH_NEXT'
    );
  });

  it('should return practice description for a final module', () => {
    const result = service.getPracticeDescription(2, true);
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_FINAL',
      jasmine.any(Object)
    );
    expect(result).toContain('I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_FINAL');
  });

  it('should return module completion text', () => {
    const result = service.getModuleCompletionText(2, 3);
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_MODULE_COMPLETION_TEXT',
      jasmine.any(Object)
    );
    expect(result).toContain('I18N_TOPIC_VIEWER_MODULE_COMPLETION_TEXT');
  });

  it('should join a single module number as string', () => {
    expect(service.joinModuleNumbers([1])).toBe('1');
  });

  it('should join two module numbers with an AND conjunction', () => {
    const result = service.joinModuleNumbers([1, 2]);
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_LIST_AND'
    );
  });

  it('should join three module numbers with comma AND conjunction', () => {
    const result = service.joinModuleNumbers([1, 2, 3]);
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('3');
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_LIST_COMMA_AND'
    );
  });

  it('should return primary avatar image url', () => {
    expect(service.getPrimaryAvatarImageUrl()).toBe(
      '/assets/images/avatar/oppia_avatar_large_100px.svg'
    );
  });

  it('should return fallback avatar image url', () => {
    expect(service.getFallbackAvatarImageUrl()).toBe(
      '/assets/copyrighted-images/general/collection_mascot.svg'
    );
  });

  it('should return fallback lesson thumbnail url', () => {
    expect(service.getFallbackLessonThumbnailUrl()).toBe(
      '/assets/images/splash/student_desk1x.webp'
    );
  });

  it('should build a lesson start url with query params', () => {
    const storyNodeSpy = createStoryNodeSpy('Node', 'Desc', 'exp_1', 'node_1');
    const storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);

    const url = service.getLessonStartUrl(
      storyNodeSpy,
      storySummary,
      'math',
      'topic'
    );

    expect(url).toContain('?node_id=node_1');
  });

  it('should return # for lesson start url when fragments are missing', () => {
    const storyNodeSpy = createStoryNodeSpy('Node', 'Desc', 'exp_1', 'node_1');
    const storySummary = createStorySummarySpy(['Node'], [storyNodeSpy]);

    expect(
      service.getLessonStartUrl(storyNodeSpy, storySummary, '', 'topic')
    ).toBe('#');
  });

  it('should build a lesson practice url', () => {
    const url = service.getLessonPracticeUrl('1', 'math', 'topic');
    expect(url).toContain('/practice/1');
  });

  it('should return # for lesson practice url when fragments are missing', () => {
    expect(service.getLessonPracticeUrl('1', '', 'topic')).toBe('#');
  });

  it('should build an end of arc url', () => {
    const url = service.getEndOfArcUrl('1', 'math', 'topic');
    expect(url).toContain('/test/arc/1');
  });

  it('should return # for end of arc url when fragments are missing', () => {
    expect(service.getEndOfArcUrl('1', '', 'topic')).toBe('#');
  });

  it('should build a general practice url', () => {
    const url = service.getGeneralPracticeUrl([1, 2], 'math', 'topic');
    expect(url).toContain('selected_subtopic_ids=[1,2]');
  });

  it('should return # for general practice url when subtopic ids are empty', () => {
    expect(service.getGeneralPracticeUrl([], 'math', 'topic')).toBe('#');
  });

  it('should build a mastery challenge url', () => {
    const url = service.getMasteryChallengeUrl('math', 'topic');
    expect(url).toContain('math');
  });

  it('should return # for mastery challenge url when fragments are missing', () => {
    expect(service.getMasteryChallengeUrl('', 'topic')).toBe('#');
  });

  it('should build a study guide url', () => {
    expect(service.getStudyGuideUrl('math', 'topic')).toBe(
      '/learn/math/topic/studyguide'
    );
  });

  it('should return # for study guide url when fragments are missing', () => {
    expect(service.getStudyGuideUrl('', 'topic')).toBe('#');
  });

  it('should return true from isChapterPublished for a published node', () => {
    const node = createStoryNodeSpy('N', 'D', 'exp_1', 'node_1', null, {
      status: 'Published',
    });
    expect(service.isChapterPublished(node)).toBe(true);
  });

  it('should return false from isChapterPublished for a non-published node', () => {
    const node = createStoryNodeSpy('N', 'D', 'exp_1', 'node_1', null, {
      status: 'Draft',
    });
    expect(service.isChapterPublished(node)).toBe(false);
  });

  it('should return false from isChapterPublished when getStatus throws', () => {
    const node = createStoryNodeSpy('N', 'D', 'exp_1', 'node_1', null);
    node.getStatus.and.throwError('Status error');
    expect(service.isChapterPublished(node)).toBe(false);
  });

  it('should return true from isChapterReadyToPublish for a ready node', () => {
    const node = createStoryNodeSpy('N', 'D', 'exp_1', 'node_1', null, {
      status: 'Ready To Publish',
    });
    expect(service.isChapterReadyToPublish(node)).toBe(true);
  });

  it('should return false from isChapterReadyToPublish when getStatus throws', () => {
    const node = createStoryNodeSpy('N', 'D', 'exp_1', 'node_1', null);
    node.getStatus.and.throwError('Status error');
    expect(service.isChapterReadyToPublish(node)).toBe(false);
  });

  it('should report a ready-to-publish chapter as coming soon', () => {
    const node = createStoryNodeSpy('N', 'D', 'exp_1', 'node_1', null, {
      status: 'Ready To Publish',
    });
    expect(service.isChapterDisplayedAsComingSoon(node)).toBe(true);
  });

  it('should report a chapter without exploration id as coming soon', () => {
    const node = createStoryNodeSpy('N', 'D', null, 'node_1', null);
    expect(service.isChapterDisplayedAsComingSoon(node)).toBe(true);
  });

  it('should report a published chapter as not coming soon', () => {
    const node = createStoryNodeSpy('N', 'D', 'exp_1', 'node_1', null, {
      status: 'Published',
    });
    expect(service.isChapterDisplayedAsComingSoon(node)).toBe(false);
  });

  it('should return false from isNewChapterLabelVisible for coming soon chapters', () => {
    const node = createStoryNodeSpy('N', 'D', null, 'node_1', null);
    const storySummary = createStorySummarySpy(['N'], [node]);
    expect(service.isNewChapterLabelVisible(node, storySummary)).toBe(false);
  });

  it('should delegate new chapter label visibility to the service', () => {
    const node = createStoryNodeSpy('N', 'D', 'exp_1', 'node_1', null, {
      status: 'Published',
    });
    const storySummary = createStorySummarySpy(['N'], [node]);
    chapterLabelVisibilityService.isNewChapterLabelVisible.and.returnValue(
      true
    );
    expect(service.isNewChapterLabelVisible(node, storySummary)).toBe(true);
  });

  it('should return false from isNewChapterLabelVisible when service throws', () => {
    const node = createStoryNodeSpy('N', 'D', 'exp_1', 'node_1', null, {
      status: 'Published',
    });
    const storySummary = createStorySummarySpy(['N'], [node]);
    chapterLabelVisibilityService.isNewChapterLabelVisible.and.throwError(
      'New label error'
    );
    expect(service.isNewChapterLabelVisible(node, storySummary)).toBe(false);
  });

  it('should check that questions exist for skills', async () => {
    questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync.and.resolveTo(
      3
    );
    const exists = await service.checkIfQuestionsExist(['skill_1']);
    expect(exists).toBe(true);
  });

  it('should report no questions when count is zero', async () => {
    const exists = await service.checkIfQuestionsExist(['skill_1']);
    expect(exists).toBe(false);
  });

  it('should report no questions for empty skill ids', async () => {
    const exists = await service.checkIfQuestionsExist([]);
    expect(exists).toBe(false);
  });

  it('should report no questions when the backend request fails', async () => {
    questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync.and.rejectWith(
      new Error('failure')
    );
    const exists = await service.checkIfQuestionsExist(['skill_1']);
    expect(exists).toBe(false);
  });
});
