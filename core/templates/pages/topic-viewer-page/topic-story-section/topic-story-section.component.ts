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
 * @fileoverview Redesigned story section for the topic viewer page.
 */

import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {StoryDomainConstants} from 'domain/story/story-domain.constants';
import {StoryNode} from 'domain/story/story-node.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PracticeSessionPageConstants} from 'pages/practice-session-page/practice-session-page.constants';
import {TopicSessionFallbackLanguageService} from 'pages/topic-viewer-page/services/topic-session-fallback-language.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ChapterProgressLoaderService} from 'services/chapter-progress-loader.service';

const PRIMARY_AVATAR_IMAGE_PATH = '/avatar/oppia_avatar_large_100px.svg';
const FALLBACK_AVATAR_IMAGE_PATH = '/general/collection_mascot.svg';
const FALLBACK_LESSON_THUMBNAIL_PATH = '/splash/student_desk1x.webp';

interface LessonCardData {
  lessonNumber: number;
  lessonTitle: string;
  lessonDescription: string;
  thumbnailUrl: string;
  startUrl: string;
  nodeId: string;
  lessonProgressStatus:
    | 'not_started'
    | 'in_progress'
    | 'completed'
    | 'coming_soon';
  totalCheckpointsCount: number;
  visitedCheckpointsCount: number;
  availableTextLanguageCodes: string[];
  availableVoiceoverLanguageCodes: string[];
  availableVoiceoverLanguageAccentDescriptions: {[accentCode: string]: string};
}

interface AdventureGroupData {
  adventureTitle: string;
  adventureDescription: string;
  lessonCards: LessonCardData[];
  accentColor: string;
  iconBg: string;
  headerBackgroundColor: string;
  headerBorderColor: string;
}

interface PracticeCardData {
  practiceTitle: string;
  practiceDescription: string;
  relatedLessonNumber: number | null;
  thumbnailUrl: string;
  studyUrl: string;
  practiceUrl: string;
}

interface AdventureNavigationGroupData {
  lessonNumbers: number[];
  accentColor: string;
}

@Component({
  selector: 'topic-story-section',
  templateUrl: './topic-story-section.component.html',
  styleUrls: ['./topic-story-section.component.css'],
})
export class TopicStorySectionComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() storySummary!: StorySummary;
  @Input() storyTitle!: string;
  @Input() storyDescription!: string;
  @Input() classroomUrlFragment: string = '';
  @Input() topicUrlFragment: string = '';
  @Input() practiceSubtopicIds: number[] = [];

  @Input() practiceCount: number = 0;
  @Input() lessonCount: number = 0;

  oppiaAvatarImageUrl: string = '';
  studyGuideUrl: string = '#';
  lessonCards: LessonCardData[] = [];
  adventureGroups: AdventureGroupData[] = [];
  visibleAdventureGroups: AdventureGroupData[] = [];
  adventureNavigationGroups: AdventureNavigationGroupData[] = [];
  activeLessonNumber: number | null = null;
  practiceCard: PracticeCardData = {
    practiceTitle: '',
    practiceDescription: '',
    relatedLessonNumber: null,
    thumbnailUrl: '',
    studyUrl: '#',
    practiceUrl: '#',
  };
  masteryChallengeUrl: string = '#';
  isPracticeCardVisible: boolean = false;
  _expandedAdventureIndices: Set<number> = new Set();
  navigatedLessonNumber: number | null = null;

  private directiveSubscriptions: Subscription = new Subscription();

  isAdventureExpanded(index: number): boolean {
    return this._expandedAdventureIndices.has(index);
  }

  toggleAdventure(index: number): void {
    if (this._expandedAdventureIndices.has(index)) {
      this._expandedAdventureIndices.delete(index);
    } else {
      this._expandedAdventureIndices.add(index);
    }
  }

  onNavigationLessonSelected(lessonNumber: number): void {
    this.activeLessonNumber = lessonNumber;
    this.navigatedLessonNumber = lessonNumber;

    // Expand the adventure that contains this lesson.
    const adventureIndex = this.visibleAdventureGroups.findIndex(group =>
      group.lessonCards.some(card => card.lessonNumber === lessonNumber)
    );
    if (adventureIndex !== -1) {
      this._expandedAdventureIndices.add(adventureIndex);
    }

    // Scroll to the lesson card after Angular finishes updating the DOM.
    setTimeout(() => {
      const el = document.getElementById('lesson-' + lessonNumber);
      if (el) {
        el.scrollIntoView({behavior: 'smooth', block: 'start'});
      }
    }, 300);
  }

  onNavigationPracticeSelected(adventureIndex: number): void {
    // Scroll to the practice card of the specific adventure after Angular finishes updating the DOM.
    setTimeout(() => {
      const el = document.getElementById('practice-card-' + adventureIndex);
      if (el) {
        el.scrollIntoView({behavior: 'smooth', block: 'start'});
      }
    }, 300);
  }

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private chapterProgressLoaderService: ChapterProgressLoaderService,
    private topicSessionFallbackLanguageService: TopicSessionFallbackLanguageService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.populateFromInputs();
    void this.loadChapterProgress();
    this.directiveSubscriptions.add(
      this.i18nLanguageCodeService.onI18nLanguageCodeChange.subscribe(() => {
        this.topicSessionFallbackLanguageService.clearSelection();
      })
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.storySummary ||
      changes.storyTitle ||
      changes.storyDescription ||
      changes.classroomUrlFragment ||
      changes.topicUrlFragment ||
      changes.lessonCount ||
      changes.practiceCount
    ) {
      this.populateFromInputs();
    }
    if (changes.storySummary && !changes.storySummary.firstChange) {
      void this.loadChapterProgress();
    }
  }

  onAvatarImageError(): void {
    if (this.oppiaAvatarImageUrl !== this.getFallbackAvatarImageUrl()) {
      this.oppiaAvatarImageUrl = this.getFallbackAvatarImageUrl();
    }
  }

  getLessonCountText(): string {
    return this.lessonCount === 1
      ? this.lessonCount + ' lesson'
      : this.lessonCount + ' lessons';
  }

  getPracticeCountText(): string {
    return this.practiceCount === 1
      ? this.practiceCount + ' practice'
      : this.practiceCount + ' practices';
  }

  getStoryMetaText(): string {
    const lessonText = this.getLessonCountText();
    if (this.practiceCount > 0) {
      return lessonText + ', ' + this.getPracticeCountText();
    }
    return lessonText;
  }

  getStoryMetaAriaLabel(): string {
    const lessonText = this.getLessonCountText();
    if (this.practiceCount > 0) {
      return lessonText + ' and ' + this.getPracticeCountText() + ' available';
    }
    return lessonText + ' available';
  }

  shouldShowAdventureEndTestCard(adventureIndex: number): boolean {
    return this.isPracticeCardVisible;
  }

  getAdventureCompletionText(adventureIndex: number): string {
    const adventureGroup = this.visibleAdventureGroups[adventureIndex];
    if (!adventureGroup) {
      return '';
    }
    const completedCount = adventureGroup.lessonCards.filter(
      card => card.lessonProgressStatus === 'completed'
    ).length;
    const totalCount = adventureGroup.lessonCards.length;
    return `${completedCount} of ${totalCount} completed`;
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  private getLessonProgressStatus(
    node: StoryNode
  ): 'not_started' | 'in_progress' | 'completed' | 'coming_soon' {
    if (!node.getExplorationId()) {
      return 'coming_soon';
    }

    const nodeTitle = node.getTitle();
    if (this.storySummary.isNodeCompleted(nodeTitle)) {
      return 'completed';
    }

    const visitedChapterTitles = this.storySummary.getVisitedChapterTitles();
    if (
      visitedChapterTitles &&
      visitedChapterTitles.indexOf(nodeTitle) !== -1
    ) {
      return 'in_progress';
    }

    return 'not_started';
  }

  private async loadChapterProgress(): Promise<void> {
    const explorationIds = this.storySummary
      .getAllNodes()
      .map(node => node.getExplorationId())
      .filter(id => id !== null) as string[];

    if (explorationIds.length === 0) {
      return;
    }

    try {
      await this.chapterProgressLoaderService.loadChapterProgressForStory(
        this.storySummary.getId(),
        explorationIds
      );
    } catch {
      return;
    }

    this.lessonCards = this.storySummary
      .getAllNodes()
      .map((node: StoryNode, index: number) => {
        const explorationId = node.getExplorationId();
        let totalCheckpoints = 0;
        let visitedCheckpoints = 0;

        if (explorationId) {
          const summary =
            this.chapterProgressLoaderService.getChapterProgressSummary(
              explorationId
            );
          if (summary) {
            totalCheckpoints = summary.totalCheckpoints;
            visitedCheckpoints = summary.visitedCheckpoints;
          }
        }

        return {
          lessonNumber: index + 1,
          lessonTitle: 'Lesson ' + (index + 1) + ': ' + node.getTitle(),
          lessonDescription: node.getDescription(),
          thumbnailUrl: this.getLessonThumbnailUrl(node),
          startUrl: this.getLessonStartUrl(node),
          lessonProgressStatus: this.getLessonProgressStatus(node),
          totalCheckpointsCount: totalCheckpoints,
          visitedCheckpointsCount: visitedCheckpoints,
          nodeId: node.getId(),
          availableTextLanguageCodes: node.getAvailableTextLanguageCodes(),
          availableVoiceoverLanguageCodes:
            node.getAvailableVoiceoverLanguageCodes(),
          availableVoiceoverLanguageAccentDescriptions:
            node.getAvailableVoiceoverLanguageAccentDescriptions(),
        };
      });

    const allNodes = this.storySummary.getAllNodes();
    this.adventureGroups = this.buildAdventureGroups(allNodes);
    this.visibleAdventureGroups = this.adventureGroups;
  }

  private buildAdventureGroups(allNodes: StoryNode[]): AdventureGroupData[] {
    const arcs = this.storySummary.getArcs();
    if (!arcs || arcs.length === 0) {
      return [];
    }

    const nodeIndexMap = new Map<string, number>();
    allNodes.forEach((node, index) => {
      nodeIndexMap.set(node.getId(), index);
    });

    return arcs.map((arc, adventureIndex) => {
      const adventureLessonCards: LessonCardData[] = [];
      const paletteColor = this.getAdventurePaletteColor(adventureIndex);
      arc.node_ids.forEach(nodeId => {
        const nodeIndex = nodeIndexMap.get(nodeId);
        if (nodeIndex !== undefined && this.lessonCards[nodeIndex]) {
          adventureLessonCards.push(this.lessonCards[nodeIndex]);
        }
      });
      return {
        adventureTitle: arc.title,
        adventureDescription: arc.description,
        lessonCards: adventureLessonCards,
        accentColor: paletteColor.rowAccent,
        iconBg: paletteColor.iconBg,
        headerBackgroundColor: paletteColor.headerBg,
        headerBorderColor: paletteColor.headerBorder,
      };
    });
  }

  private populateFromInputs(): void {
    if (!this.classroomUrlFragment) {
      this.classroomUrlFragment =
        this.urlService.getClassroomUrlFragmentFromLearnerUrl();
    }
    if (!this.topicUrlFragment) {
      this.topicUrlFragment =
        this.urlService.getTopicUrlFragmentFromLearnerUrl();
    }

    this.oppiaAvatarImageUrl = this.getPrimaryAvatarImageUrl();
    this.studyGuideUrl = this.getStudyGuideUrl();

    this.storyTitle = this.storySummary.getTitle();
    this.storyDescription = this.storySummary.getDescription() || '';
    this.lessonCount = this.storySummary.getNodeTitles().length;
    const allNodes = this.storySummary.getAllNodes();
    this.lessonCards = allNodes.map((node: StoryNode, index: number) => {
      const explorationId = node.getExplorationId();
      const progressSummary = explorationId
        ? this.chapterProgressLoaderService.getChapterProgressSummary(
            explorationId
          )
        : null;

      return {
        lessonNumber: index + 1,
        lessonTitle: 'Lesson ' + (index + 1) + ': ' + node.getTitle(),
        lessonDescription: node.getDescription(),
        thumbnailUrl: this.getLessonThumbnailUrl(node),
        startUrl: this.getLessonStartUrl(node),
        nodeId: node.getId(),
        lessonProgressStatus: this.getLessonProgressStatus(node),
        totalCheckpointsCount: progressSummary
          ? progressSummary.totalCheckpoints
          : 0,
        visitedCheckpointsCount: progressSummary
          ? progressSummary.visitedCheckpoints
          : 0,
        availableTextLanguageCodes: node.getAvailableTextLanguageCodes(),
        availableVoiceoverLanguageCodes:
          node.getAvailableVoiceoverLanguageCodes(),
        availableVoiceoverLanguageAccentDescriptions:
          node.getAvailableVoiceoverLanguageAccentDescriptions(),
      };
    });

    this.adventureGroups = this.buildAdventureGroups(allNodes);
    this.visibleAdventureGroups = this.adventureGroups;
    this.adventureNavigationGroups = this.visibleAdventureGroups.map(group => {
      return {
        lessonNumbers: group.lessonCards.map(card => card.lessonNumber),
        accentColor: group.accentColor,
      };
    });
    this.activeLessonNumber = this.getActiveLessonNumber();

    this.isPracticeCardVisible = this.practiceCount >= 1;
    this.practiceCard = this.getPracticeCardData();
    this.masteryChallengeUrl = this.getPracticeSessionUrl();

    if (this.visibleAdventureGroups.length) {
      this._expandedAdventureIndices = new Set([0]);
    }
  }

  private getPracticeCardData(): PracticeCardData {
    const nextArcNumber = Math.min(this.adventureGroups.length, 2);

    return {
      practiceTitle: 'Arc 1 Review & Test',
      practiceDescription:
        'Test what you have learned in Arc 1 to unlock Arc ' +
        nextArcNumber +
        '.',
      relatedLessonNumber:
        this.lessonCards.length > 0 ? this.lessonCards[0].lessonNumber : null,
      thumbnailUrl: this.getFallbackLessonThumbnailUrl(),
      studyUrl: this.studyGuideUrl,
      practiceUrl: this.getPracticeSessionUrl(),
    };
  }

  private getPracticeSessionUrl(): string {
    if (!this.classroomUrlFragment || !this.topicUrlFragment) {
      return '#';
    }

    const practiceSubtopicId = this.practiceSubtopicIds[0];
    if (practiceSubtopicId === undefined) {
      return '#';
    }

    return this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.PRACTICE_SESSIONS_URL,
      {
        classroom_url_fragment: this.classroomUrlFragment,
        topic_url_fragment: this.topicUrlFragment,
        stringified_subtopic_ids: JSON.stringify([practiceSubtopicId]),
      }
    );
  }

  getLessonPracticeUrl(nodeId: string): string {
    if (!this.classroomUrlFragment || !this.topicUrlFragment) {
      return '#';
    }
    return this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.LESSON_PRACTICE_URL,
      {
        classroom_url_fragment: this.classroomUrlFragment,
        topic_url_fragment: this.topicUrlFragment,
        node_id: nodeId,
      }
    );
  }

  getEndOfArcUrl(arcId: string): string {
    if (!this.classroomUrlFragment || !this.topicUrlFragment) {
      return '#';
    }
    return this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.END_OF_ARC_URL,
      {
        classroom_url_fragment: this.classroomUrlFragment,
        topic_url_fragment: this.topicUrlFragment,
        arc_id: arcId,
      }
    );
  }

  private getLessonThumbnailUrl(node: StoryNode): string {
    const thumbnailFilename = node.getThumbnailFilename();
    const storyId = this.storySummary.getId();
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

  private getAdventurePaletteColor(adventureIndex: number): {
    headerBg: string;
    headerBorder: string;
    iconBg: string;
    rowAccent: string;
  } {
    const palette = StoryDomainConstants.ARC_COLOR_PALETTE;
    return palette[adventureIndex % palette.length];
  }

  private getActiveLessonNumber(): number | null {
    const inProgressLesson = this.lessonCards.find(
      lesson => lesson.lessonProgressStatus === 'in_progress'
    );
    if (inProgressLesson) {
      return inProgressLesson.lessonNumber;
    }

    const notStartedLesson = this.lessonCards.find(
      lesson => lesson.lessonProgressStatus === 'not_started'
    );
    if (notStartedLesson) {
      return notStartedLesson.lessonNumber;
    }

    return this.lessonCards.length > 0
      ? this.lessonCards[0].lessonNumber
      : null;
  }

  private getLessonStartUrl(node: StoryNode): string {
    const explorationId = node.getExplorationId();
    if (
      !explorationId ||
      !this.classroomUrlFragment ||
      !this.topicUrlFragment
    ) {
      return '#';
    }

    let lessonUrl = this.urlInterpolationService.interpolateUrl(
      '/explore/<exp_id>',
      {exp_id: explorationId}
    );
    lessonUrl = this.urlService.addField(
      lessonUrl,
      'topic_url_fragment',
      this.topicUrlFragment
    );
    lessonUrl = this.urlService.addField(
      lessonUrl,
      'classroom_url_fragment',
      this.classroomUrlFragment
    );
    lessonUrl = this.urlService.addField(
      lessonUrl,
      'story_url_fragment',
      this.storySummary.getUrlFragment()
    );
    lessonUrl = this.urlService.addField(lessonUrl, 'node_id', node.getId());
    return lessonUrl;
  }

  private getStudyGuideUrl(): string {
    return this.urlService.getLearnerTopicStudyGuideUrl();
  }

  private getPrimaryAvatarImageUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      PRIMARY_AVATAR_IMAGE_PATH
    );
  }

  private getFallbackAvatarImageUrl(): string {
    return this.urlInterpolationService.getStaticCopyrightedImageUrl(
      FALLBACK_AVATAR_IMAGE_PATH
    );
  }

  private getFallbackLessonThumbnailUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      FALLBACK_LESSON_THUMBNAIL_PATH
    );
  }
}
