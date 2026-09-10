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
 * @fileoverview Business logic for the topic story section that builds the
 * lesson and module data displayed by the topic-story-section component and
 * derives URLs, colors and chapter statuses from the story summary.
 */

import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {AppConstants} from 'app.constants';
import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {StoryDomainConstants} from 'domain/story/story-domain.constants';
import {StoryNode} from 'domain/story/story-node.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PracticeSessionPageConstants} from 'pages/practice-session-page/practice-session-page.constants';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ChapterLabelVisibilityService} from 'services/chapter-label-visibility.service';
import {UrlService} from 'services/contextual/url.service';

import constants from 'assets/constants';

import {LessonProgressStatus} from '../topic-story-section/topic-lesson-card/topic-lesson-card.component';

const PRIMARY_AVATAR_IMAGE_PATH = '/avatar/oppia_avatar_large_100px.svg';
const FALLBACK_AVATAR_IMAGE_PATH = '/general/collection_mascot.svg';
const FALLBACK_LESSON_THUMBNAIL_PATH = '/splash/student_desk1x.webp';

export interface LessonCardData {
  lessonNumber: number;
  lessonTitle: string;
  lessonDescription: string;
  thumbnailUrl: string;
  startUrl: string;
  practiceUrl: string;
  skillIds: string[];
  hasPracticeQuestions: boolean;
  nodeId: string;
  lessonProgressStatus: LessonProgressStatus;
  isComingSoon: boolean;
  isPublished: boolean;
  isNewLabelVisible: boolean;
  availableTextLanguageCodes: string[];
  availableVoiceoverLanguageCodes: string[];
  availableVoiceoverLanguageAccentDescriptions: {[accentCode: string]: string};
}

export interface ModuleGroupData {
  moduleTitle: string;
  moduleDescription: string;
  lessonCards: LessonCardData[];
  accentColor: string;
  iconBg: string;
  headerBackgroundColor: string;
  headerBorderColor: string;
  arcId: string;
  hasPracticeQuestions: boolean;
}

export interface ModulePaletteColor {
  headerBg: string;
  headerBorder: string;
  iconBg: string;
  rowAccent: string;
}

@Injectable({
  providedIn: 'root',
})
export class TopicStorySectionBackendDataService {
  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private chapterLabelVisibilityService: ChapterLabelVisibilityService,
    private questionBackendApiService: QuestionBackendApiService,
    private translateService: TranslateService
  ) {}

  buildLessonCards(
    allNodes: StoryNode[],
    storySummary: StorySummary,
    classroomUrlFragment: string,
    topicUrlFragment: string
  ): LessonCardData[] {
    return allNodes.map((node: StoryNode, index: number) => {
      const lessonProgressStatus = this.getLessonProgressStatus(
        node,
        storySummary
      );
      const nodeNumber = node.getId().split('_').pop() || '';

      return {
        lessonNumber: index + 1,
        lessonTitle: node.getTitle(),
        lessonDescription: node.getDescription(),
        thumbnailUrl: this.getLessonThumbnailUrl(node, storySummary),
        startUrl:
          lessonProgressStatus === 'coming_soon'
            ? '#'
            : this.getLessonStartUrl(
                node,
                storySummary,
                classroomUrlFragment,
                topicUrlFragment
              ),
        practiceUrl:
          lessonProgressStatus === 'coming_soon'
            ? '#'
            : this.getLessonPracticeUrl(
                nodeNumber,
                classroomUrlFragment,
                topicUrlFragment
              ),
        skillIds: node.getAcquiredSkillIds(),
        hasPracticeQuestions: false,
        nodeId: node.getId(),
        lessonProgressStatus,
        isComingSoon: lessonProgressStatus === 'coming_soon',
        isPublished: this.isChapterPublished(node),
        isNewLabelVisible: this.isNewChapterLabelVisible(node, storySummary),
        availableTextLanguageCodes: node.getAvailableTextLanguageCodes(),
        availableVoiceoverLanguageCodes:
          node.getAvailableVoiceoverLanguageCodes(),
        availableVoiceoverLanguageAccentDescriptions:
          node.getAvailableVoiceoverLanguageAccentDescriptions(),
      };
    });
  }

  buildModuleGroups(
    allNodes: StoryNode[],
    storySummary: StorySummary,
    lessonCards: LessonCardData[]
  ): ModuleGroupData[] {
    const arcs = storySummary.getArcs();
    if (!arcs || arcs.length === 0) {
      return [];
    }

    const nodeIndexMap = new Map<string, number>();
    allNodes.forEach((node, index) => {
      nodeIndexMap.set(node.getId(), index);
    });

    return arcs.map((arc, moduleIndex) => {
      const moduleLessonCards: LessonCardData[] = [];
      const paletteColor = this.getModulePaletteColor(moduleIndex);
      arc.node_ids.forEach(nodeId => {
        const nodeIndex = nodeIndexMap.get(nodeId);
        if (nodeIndex !== undefined && lessonCards[nodeIndex]) {
          moduleLessonCards.push(lessonCards[nodeIndex]);
        }
      });
      // The backend maps an arc to its 1-based position among the topic's
      // story arcs, so pass the position rather than a parsed arc id.
      const arcId = String(moduleIndex + 1);
      return {
        moduleTitle: arc.title,
        moduleDescription: arc.description,
        lessonCards: moduleLessonCards,
        accentColor: paletteColor.rowAccent,
        iconBg: paletteColor.iconBg,
        headerBackgroundColor: paletteColor.headerBg,
        headerBorderColor: paletteColor.headerBorder,
        arcId,
        hasPracticeQuestions: false,
      };
    });
  }

  getModulePaletteColor(moduleIndex: number): ModulePaletteColor {
    const palette = StoryDomainConstants.ARC_COLOR_PALETTE;
    return palette[moduleIndex % palette.length];
  }

  getPracticeTitle(moduleIndex: number): string {
    return `Module ${moduleIndex + 1} Review & Test`;
  }

  getPracticeDescription(moduleIndex: number, isLastModule: boolean): string {
    const moduleNumber = moduleIndex + 1;
    if (!isLastModule) {
      return this.translateService.instant(
        'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_WITH_NEXT',
        {moduleNumber, nextModuleNumber: moduleNumber + 1}
      );
    }
    return this.translateService.instant(
      'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_FINAL',
      {moduleNumber}
    );
  }

  getModuleCompletionText(completedCount: number, totalCount: number): string {
    return this.translateService.instant(
      'I18N_TOPIC_VIEWER_MODULE_COMPLETION_TEXT',
      {completedCount, totalCount}
    );
  }

  joinModuleNumbers(numbers: number[]): string {
    if (numbers.length === 1) {
      return String(numbers[0]);
    }
    const andConjunction = this.translateService.instant(
      'I18N_TOPIC_VIEWER_LIST_AND'
    );
    if (numbers.length === 2) {
      return numbers.join(andConjunction);
    }
    const commaAndConjunction = this.translateService.instant(
      'I18N_TOPIC_VIEWER_LIST_COMMA_AND'
    );
    return (
      numbers.slice(0, -1).join(', ') +
      commaAndConjunction +
      numbers[numbers.length - 1]
    );
  }

  getPrimaryAvatarImageUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      PRIMARY_AVATAR_IMAGE_PATH
    );
  }

  getFallbackAvatarImageUrl(): string {
    return this.urlInterpolationService.getStaticCopyrightedImageUrl(
      FALLBACK_AVATAR_IMAGE_PATH
    );
  }

  getFallbackLessonThumbnailUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      FALLBACK_LESSON_THUMBNAIL_PATH
    );
  }

  getLessonStartUrl(
    node: StoryNode,
    storySummary: StorySummary,
    classroomUrlFragment: string,
    topicUrlFragment: string
  ): string {
    const explorationId = node.getExplorationId();
    if (!explorationId || !classroomUrlFragment || !topicUrlFragment) {
      return '#';
    }

    let lessonUrl = this.urlInterpolationService.interpolateUrl(
      '/explore/<exp_id>',
      {exp_id: explorationId}
    );
    lessonUrl = this.urlService.addField(
      lessonUrl,
      'topic_url_fragment',
      topicUrlFragment
    );
    lessonUrl = this.urlService.addField(
      lessonUrl,
      'classroom_url_fragment',
      classroomUrlFragment
    );
    lessonUrl = this.urlService.addField(
      lessonUrl,
      'story_url_fragment',
      storySummary.getUrlFragment()
    );
    lessonUrl = this.urlService.addField(lessonUrl, 'node_id', node.getId());
    return lessonUrl;
  }

  getLessonPracticeUrl(
    nodeId: string,
    classroomUrlFragment: string,
    topicUrlFragment: string
  ): string {
    if (!classroomUrlFragment || !topicUrlFragment) {
      return '#';
    }
    return this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.LESSON_PRACTICE_URL,
      {
        classroom_url_fragment: classroomUrlFragment,
        topic_url_fragment: topicUrlFragment,
        node_id: nodeId,
      }
    );
  }

  getEndOfArcUrl(
    arcId: string,
    classroomUrlFragment: string,
    topicUrlFragment: string
  ): string {
    if (!classroomUrlFragment || !topicUrlFragment) {
      return '#';
    }
    return this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.END_OF_ARC_URL,
      {
        classroom_url_fragment: classroomUrlFragment,
        topic_url_fragment: topicUrlFragment,
        arc_id: arcId,
      }
    );
  }

  getGeneralPracticeUrl(
    practiceSubtopicIds: number[],
    classroomUrlFragment: string,
    topicUrlFragment: string
  ): string {
    if (
      !classroomUrlFragment ||
      !topicUrlFragment ||
      practiceSubtopicIds.length === 0
    ) {
      return '#';
    }

    return this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.PRACTICE_SESSIONS_URL,
      {
        classroom_url_fragment: classroomUrlFragment,
        topic_url_fragment: topicUrlFragment,
        stringified_subtopic_ids: JSON.stringify(practiceSubtopicIds),
      }
    );
  }

  getMasteryChallengeUrl(
    classroomUrlFragment: string,
    topicUrlFragment: string
  ): string {
    if (!classroomUrlFragment || !topicUrlFragment) {
      return '#';
    }
    return this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.MASTERY_CHALLENGE_URL,
      {
        classroom_url_fragment: classroomUrlFragment,
        topic_url_fragment: topicUrlFragment,
      }
    );
  }

  getStudyGuideUrl(
    classroomUrlFragment: string,
    topicUrlFragment: string
  ): string {
    if (!classroomUrlFragment || !topicUrlFragment) {
      return '#';
    }
    return ClassroomDomainConstants.TOPIC_VIEWER_STUDYGUIDE_URL_TEMPLATE.replace(
      '<classroom_url_fragment>',
      encodeURIComponent(classroomUrlFragment)
    ).replace('<topic_url_fragment>', encodeURIComponent(topicUrlFragment));
  }

  isChapterPublished(node: StoryNode): boolean {
    try {
      return (
        this.hasStoryNodeStatus(node, constants.STORY_NODE_STATUS_PUBLISHED) ||
        this.hasStoryNodeStatus(node, 'Published')
      );
    } catch {
      return false;
    }
  }

  isChapterReadyToPublish(node: StoryNode): boolean {
    try {
      return (
        this.hasStoryNodeStatus(
          node,
          constants.STORY_NODE_STATUS_READY_TO_PUBLISH
        ) || this.hasStoryNodeStatus(node, 'Ready To Publish')
      );
    } catch {
      return false;
    }
  }

  isChapterDisplayedAsComingSoon(node: StoryNode): boolean {
    if (this.isChapterReadyToPublish(node)) {
      return true;
    }

    return !node.getExplorationId();
  }

  isNewChapterLabelVisible(
    node: StoryNode,
    storySummary: StorySummary
  ): boolean {
    if (this.isChapterDisplayedAsComingSoon(node)) {
      return false;
    }

    try {
      return this.chapterLabelVisibilityService.isNewChapterLabelVisible(
        node,
        storySummary
      );
    } catch {
      return false;
    }
  }

  checkIfQuestionsExist(skillIds: string[]): Promise<boolean> {
    if (!skillIds || skillIds.length === 0) {
      return Promise.resolve(false);
    }

    return this.questionBackendApiService
      .fetchTotalQuestionCountForSkillIdsAsync(skillIds)
      .then(questionCount => questionCount > 0)
      .catch(() => false);
  }

  private getLessonProgressStatus(
    node: StoryNode,
    storySummary: StorySummary
  ): LessonProgressStatus {
    if (this.isChapterDisplayedAsComingSoon(node) || !node.getExplorationId()) {
      return 'coming_soon';
    }

    const nodeTitle = node.getTitle();
    if (storySummary.isNodeCompleted(nodeTitle)) {
      return 'completed';
    }

    const visitedChapterTitles = storySummary.getVisitedChapterTitles();
    if (visitedChapterTitles && visitedChapterTitles.includes(nodeTitle)) {
      return 'in_progress';
    }

    return 'not_started';
  }

  private getLessonThumbnailUrl(
    node: StoryNode,
    storySummary: StorySummary
  ): string {
    const thumbnailFilename = node.getThumbnailFilename();
    const storyId = storySummary.getId();
    if (thumbnailFilename) {
      if (!storyId) {
        return this.getFallbackLessonThumbnailUrl();
      }
      return this.assetsBackendApiService.getThumbnailUrlForPreview(
        AppConstants.ENTITY_TYPE.STORY,
        storyId,
        thumbnailFilename
      );
    }
    return this.getFallbackLessonThumbnailUrl();
  }

  private hasStoryNodeStatus(node: StoryNode, expectedStatus: string): boolean {
    const status = node.getStatus();
    if (!status) {
      return false;
    }

    return (
      this.normalizeStoryNodeStatus(status) ===
      this.normalizeStoryNodeStatus(expectedStatus)
    );
  }

  private normalizeStoryNodeStatus(status: string): string {
    return status.trim().toLowerCase().replace(/\s+/g, ' ');
  }
}
