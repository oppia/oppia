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
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import {Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {StoryDomainConstants} from 'domain/story/story-domain.constants';
import {StoryNode} from 'domain/story/story-node.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PracticeSessionPageConstants} from 'pages/practice-session-page/practice-session-page.constants';
import {TopicSessionFallbackLanguageService} from 'pages/topic-viewer-page/services/topic-session-fallback-language.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ChapterLabelVisibilityService} from 'services/chapter-label-visibility.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UrlService} from 'services/contextual/url.service';
import {ChapterProgressLoaderService} from 'services/chapter-progress-loader.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

import constants from 'assets/constants';

import './topic-story-section.component.css';
import {MasteryChallengeLockedModalComponent} from './mastery-challenge-locked-modal.component';

const PRIMARY_AVATAR_IMAGE_PATH = '/avatar/oppia_avatar_large_100px.svg';
const FALLBACK_AVATAR_IMAGE_PATH = '/general/collection_mascot.svg';
const FALLBACK_LESSON_THUMBNAIL_PATH = '/splash/student_desk1x.webp';

interface LessonCardData {
  lessonNumber: number;
  lessonTitle: string;
  lessonDescription: string;
  thumbnailUrl: string;
  startUrl: string;
  practiceUrl: string;
  skillIds: string[];
  hasPracticeQuestions: boolean;
  nodeId: string;
  lessonProgressStatus:
    | 'not_started'
    | 'in_progress'
    | 'completed'
    | 'coming_soon';
  isComingSoon: boolean;
  isPublished: boolean;
  isNewLabelVisible: boolean;
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
  arcId: string;
  hasPracticeQuestions: boolean;
}

interface PracticeCardData {
  practiceTitle: string;
  practiceDescription: string;
  thumbnailUrl: string;
  studyUrl: string;
  practiceUrl: string;
  hasPracticeQuestions: boolean;
}

interface AdventureNavigationGroupData {
  lessons: {
    lessonNumber: number;
  }[];
  accentColor: string;
  showPractice: boolean;
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
  @Input() topicName: string = '';

  @Input() practiceCount: number = 0;
  @Input() lessonCount: number = 0;

  oppiaAvatarImageUrl: string = '';
  studyGuideUrl: string = '#';
  lessonCards: LessonCardData[] = [];
  availableLessonCards: LessonCardData[] = [];
  comingSoonLessonCards: LessonCardData[] = [];
  adventureGroups: AdventureGroupData[] = [];
  visibleAdventureGroups: AdventureGroupData[] = [];
  comingSoonAdventureGroups: AdventureGroupData[] = [];
  adventureNavigationGroups: AdventureNavigationGroupData[] = [];
  activeLessonNumber: number | null = null;
  practiceCard: PracticeCardData = {
    practiceTitle: '',
    practiceDescription: '',
    thumbnailUrl: '',
    studyUrl: '#',
    practiceUrl: '#',
    hasPracticeQuestions: false,
  };
  masteryChallengeUrl: string = '#';
  isMasteryUnlocked: boolean = false;
  isPracticeCardVisible: boolean = false;
  _expandedAdventureIndices: Set<number> = new Set();
  navigatedLessonNumber: number | null = null;

  @ViewChildren('lessonCardWrapper')
  lessonCardWrappers!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('practiceCardWrapper')
  practiceCardWrappers!: QueryList<ElementRef<HTMLElement>>;

  private practiceAvailabilityRequestId: number = 0;
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

    setTimeout(() => {
      const lessonCardElement = this.getLessonCardElement(lessonNumber);
      if (lessonCardElement) {
        const navbarHeight = 56;
        const adventureNav = document.querySelector(
          '.adventure-navigation-container'
        );
        const adventureNavHeight = adventureNav
          ? adventureNav.getBoundingClientRect().height
          : 0;
        const offset = navbarHeight + adventureNavHeight + 16;
        const lessonTop =
          lessonCardElement.getBoundingClientRect().top +
          window.scrollY -
          offset;
        window.scrollTo({top: lessonTop, behavior: 'smooth'});
      }
    }, 400);
  }

  onLessonStartClick(selection: {
    lessonNumber: number;
    startUrl: string;
  }): void {
    const {lessonNumber, startUrl} = selection;
    const adventureIndex = this.visibleAdventureGroups.findIndex(group =>
      group.lessonCards.some(card => card.lessonNumber === lessonNumber)
    );
    if (adventureIndex !== -1) {
      this._expandedAdventureIndices.add(adventureIndex);
    }
    this.activeLessonNumber = lessonNumber;
    this.navigatedLessonNumber = lessonNumber;

    if (startUrl) {
      this.windowRef.nativeWindow.location.assign(startUrl);
    }
  }

  onMasteryChallengeClicked(): void {
    if (this.isMasteryUnlocked) {
      this.scrollToMasteryChallenge();
      return;
    }

    const modalRef: NgbModalRef = this.ngbModal.open(
      MasteryChallengeLockedModalComponent,
      {
        backdrop: true,
        windowClass: 'mastery-locked-modal',
      }
    );
    modalRef.result.then(
      () => {
        this.isMasteryUnlocked = true;
        this.scrollToMasteryChallenge();
      },
      () => {}
    );
  }

  onNavigationPracticeSelected(adventureIndex: number): void {
    // Scroll to the practice card of the specific adventure after Angular finishes updating the DOM.
    setTimeout(() => {
      const practiceCardElement = this.getPracticeCardElement(adventureIndex);
      if (practiceCardElement) {
        practiceCardElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 300);
  }

  private getLessonCardElement(lessonNumber: number): HTMLElement | null {
    const wrappers = this.lessonCardWrappers?.toArray() ?? [];
    const match = wrappers.find(wrapper => {
      const id = wrapper.nativeElement.id;
      return (
        id === 'lesson-' + lessonNumber ||
        id === 'coming-soon-lesson-' + lessonNumber
      );
    });
    return match ? match.nativeElement : null;
  }

  private getPracticeCardElement(adventureIndex: number): HTMLElement | null {
    const wrappers = this.practiceCardWrappers?.toArray() ?? [];
    const match = wrappers.find(wrapper => {
      return wrapper.nativeElement.id === 'practice-card-' + adventureIndex;
    });
    return match ? match.nativeElement : null;
  }

  private scrollToMasteryChallenge(): void {
    setTimeout(() => {
      const masteryElement = document.querySelector('.mastery-challenge-card');
      if (!masteryElement) {
        return;
      }

      const navbarHeight = 56;
      const adventureNav = document.querySelector(
        '.adventure-navigation-container'
      );
      const adventureNavHeight = adventureNav
        ? adventureNav.getBoundingClientRect().height
        : 0;
      const offset = navbarHeight + adventureNavHeight + 16;
      const top =
        masteryElement.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({top, behavior: 'smooth'});
    }, 50);
  }

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private chapterProgressLoaderService: ChapterProgressLoaderService,
    private topicSessionFallbackLanguageService: TopicSessionFallbackLanguageService,
    private chapterLabelVisibilityService: ChapterLabelVisibilityService,
    private questionBackendApiService: QuestionBackendApiService,
    private windowRef: WindowRef,
    private ngbModal: NgbModal
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
      changes.practiceCount ||
      changes.practiceSubtopicIds
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

  shouldShowAdventureEndTestCard(adventureIndex: number): boolean {
    return Boolean(
      this.visibleAdventureGroups[adventureIndex]?.lessonCards.length
    );
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
    if (this.isChapterDisplayedAsComingSoon(node) || !node.getExplorationId()) {
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
        const lessonProgressStatus = this.getLessonProgressStatus(node);

        return {
          lessonNumber: index + 1,
          lessonTitle: node.getTitle(),
          lessonDescription: node.getDescription(),
          thumbnailUrl: this.getLessonThumbnailUrl(node),
          startUrl:
            lessonProgressStatus === 'coming_soon'
              ? '#'
              : this.getLessonStartUrl(node),
          practiceUrl:
            lessonProgressStatus === 'coming_soon'
              ? '#'
              : this.getLessonPracticeUrl(node.getId().split('_').pop() || ''),
          skillIds: node.getAcquiredSkillIds(),
          hasPracticeQuestions: false,
          lessonProgressStatus,
          nodeId: node.getId(),
          isComingSoon: lessonProgressStatus === 'coming_soon',
          isPublished: this.isChapterPublished(node),
          isNewLabelVisible: this.isNewChapterLabelVisible(node),
          availableTextLanguageCodes: node.getAvailableTextLanguageCodes(),
          availableVoiceoverLanguageCodes:
            node.getAvailableVoiceoverLanguageCodes(),
          availableVoiceoverLanguageAccentDescriptions:
            node.getAvailableVoiceoverLanguageAccentDescriptions(),
        };
      });

    const allNodes = this.storySummary.getAllNodes();
    this.adventureGroups = this.buildAdventureGroups(allNodes);
    this.updateVisibleSections();
    void this.loadPracticeQuestionAvailability();
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
      const arcNumber = arc.id.split('_').pop() || '';
      return {
        adventureTitle: arc.title,
        adventureDescription: arc.description,
        lessonCards: adventureLessonCards,
        accentColor: paletteColor.rowAccent,
        iconBg: paletteColor.iconBg,
        headerBackgroundColor: paletteColor.headerBg,
        headerBorderColor: paletteColor.headerBorder,
        arcId: arcNumber,
        hasPracticeQuestions: false,
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
      const lessonProgressStatus = this.getLessonProgressStatus(node);
      const nodeNumber = node.getId().split('_').pop() || '';

      return {
        lessonNumber: index + 1,
        lessonTitle: node.getTitle(),
        lessonDescription: node.getDescription(),
        thumbnailUrl: this.getLessonThumbnailUrl(node),
        startUrl:
          lessonProgressStatus === 'coming_soon'
            ? '#'
            : this.getLessonStartUrl(node),
        practiceUrl:
          lessonProgressStatus === 'coming_soon'
            ? '#'
            : this.getLessonPracticeUrl(nodeNumber),
        skillIds: node.getAcquiredSkillIds(),
        hasPracticeQuestions: false,
        nodeId: node.getId(),
        lessonProgressStatus,
        isComingSoon: lessonProgressStatus === 'coming_soon',
        isPublished: this.isChapterPublished(node),
        isNewLabelVisible: this.isNewChapterLabelVisible(node),
        availableTextLanguageCodes: node.getAvailableTextLanguageCodes(),
        availableVoiceoverLanguageCodes:
          node.getAvailableVoiceoverLanguageCodes(),
        availableVoiceoverLanguageAccentDescriptions:
          node.getAvailableVoiceoverLanguageAccentDescriptions(),
      };
    });

    this.adventureGroups = this.buildAdventureGroups(allNodes);
    this.updateVisibleSections();
    this.activeLessonNumber = this.getActiveLessonNumber();

    this.isPracticeCardVisible = this.practiceCount >= 1;
    this.practiceCard = this.getPracticeCardData();
    this.masteryChallengeUrl = this.getMasteryChallengeUrl();
    this.isMasteryUnlocked = this.isStoryCompleted();
    void this.loadPracticeQuestionAvailability();
  }

  private getPracticeCardData(): PracticeCardData {
    const firstArcId =
      this.adventureGroups.length > 0 ? this.adventureGroups[0].arcId : '';
    const firstAdventureTitle =
      this.visibleAdventureGroups.length > 0
        ? this.visibleAdventureGroups[0].adventureTitle
        : 'Adventure 1';

    return {
      practiceTitle: firstAdventureTitle,
      practiceDescription:
        this.adventureGroups.length > 1
          ? `Test what you have learned in ${firstAdventureTitle} to unlock the next adventure.`
          : `Test what you have learned in ${firstAdventureTitle}.`,
      thumbnailUrl: this.getFallbackLessonThumbnailUrl(),
      studyUrl: this.studyGuideUrl,
      practiceUrl: firstArcId
        ? this.getEndOfArcUrl(firstArcId)
        : this.getGeneralPracticeUrl(),
      hasPracticeQuestions: false,
    };
  }

  private getGeneralPracticeUrl(): string {
    if (
      !this.classroomUrlFragment ||
      !this.topicUrlFragment ||
      this.practiceSubtopicIds.length === 0
    ) {
      return '#';
    }

    return this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.PRACTICE_SESSIONS_URL,
      {
        classroom_url_fragment: this.classroomUrlFragment,
        topic_url_fragment: this.topicUrlFragment,
        stringified_subtopic_ids: JSON.stringify(this.practiceSubtopicIds),
      }
    );
  }

  private async loadPracticeQuestionAvailability(): Promise<void> {
    const requestId = ++this.practiceAvailabilityRequestId;
    const lessonCards = this.lessonCards;
    const adventureGroups = this.adventureGroups;

    const lessonAvailability = await Promise.all(
      lessonCards.map(card => this.checkIfQuestionsExist(card.skillIds))
    );
    const adventureAvailability = await Promise.all(
      adventureGroups.map(group =>
        this.checkIfQuestionsExist(this.getUniqueSkillIds(group.lessonCards))
      )
    );
    const flatPracticeAvailability = await this.checkIfQuestionsExist(
      this.getUniqueSkillIds(lessonCards)
    );

    if (requestId !== this.practiceAvailabilityRequestId) {
      return;
    }

    lessonCards.forEach((card, index) => {
      card.hasPracticeQuestions = lessonAvailability[index];
    });
    adventureGroups.forEach((group, index) => {
      group.hasPracticeQuestions = adventureAvailability[index];
    });
    this.practiceCard.hasPracticeQuestions = flatPracticeAvailability;
  }

  private getUniqueSkillIds(lessonCards: LessonCardData[]): string[] {
    const skillIds = lessonCards.reduce(
      (allSkillIds: string[], card) => allSkillIds.concat(card.skillIds),
      []
    );
    return Array.from(new Set(skillIds));
  }

  private async checkIfQuestionsExist(skillIds: string[]): Promise<boolean> {
    if (skillIds.length === 0) {
      return false;
    }

    try {
      const questionCount =
        await this.questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync(
          skillIds
        );
      return questionCount > 0;
    } catch {
      return false;
    }
  }

  getPracticeTitle(adventureIndex: number): string {
    return adventureIndex < this.visibleAdventureGroups.length
      ? this.visibleAdventureGroups[adventureIndex].adventureTitle
      : `Adventure ${adventureIndex + 1}`;
  }

  getPracticeDescription(adventureIndex: number): string {
    const adventureTitle =
      adventureIndex < this.visibleAdventureGroups.length
        ? this.visibleAdventureGroups[adventureIndex].adventureTitle
        : `Adventure ${adventureIndex + 1}`;
    if (adventureIndex < this.visibleAdventureGroups.length - 1) {
      return `Test what you have learned in ${adventureTitle} to unlock the next adventure.`;
    }
    return `Test what you have learned in ${adventureTitle}.`;
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

  private getMasteryChallengeUrl(): string {
    if (!this.classroomUrlFragment || !this.topicUrlFragment) {
      return '#';
    }
    return this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.MASTERY_CHALLENGE_URL,
      {
        classroom_url_fragment: this.classroomUrlFragment,
        topic_url_fragment: this.topicUrlFragment,
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

    return this.availableLessonCards.length > 0
      ? this.availableLessonCards[0].lessonNumber
      : null;
  }

  private updateVisibleSections(): void {
    this.availableLessonCards = this.lessonCards.filter(
      lesson => !lesson.isComingSoon
    );
    this.comingSoonLessonCards = this.lessonCards.filter(
      lesson => lesson.isComingSoon
    );

    this.visibleAdventureGroups = this.adventureGroups
      .map(group => {
        return {
          ...group,
          lessonCards: group.lessonCards.filter(card => !card.isComingSoon),
        };
      })
      .filter(group => group.lessonCards.length > 0);

    this.comingSoonAdventureGroups = this.adventureGroups
      .map(group => {
        return {
          ...group,
          lessonCards: group.lessonCards.filter(card => card.isComingSoon),
        };
      })
      .filter(group => group.lessonCards.length > 0);

    this.adventureNavigationGroups = this.adventureGroups
      .map(group => {
        const visibleLessons = group.lessonCards.filter(
          card => !card.isComingSoon && card.isPublished
        );

        return {
          lessons: visibleLessons.map(card => {
            return {
              lessonNumber: card.lessonNumber,
            };
          }),
          accentColor: group.accentColor,
          showPractice: visibleLessons.length > 0,
        };
      })
      .filter(group => group.lessons.length > 0);

    if (
      this.visibleAdventureGroups.length &&
      this._expandedAdventureIndices.size === 0
    ) {
      this._expandedAdventureIndices = new Set([0]);
    }

    this.isMasteryUnlocked = this.isStoryCompleted();
  }

  private isStoryCompleted(): boolean {
    const playableLessons = this.lessonCards.filter(card => !card.isComingSoon);
    if (playableLessons.length === 0) {
      return false;
    }

    return playableLessons.every(
      card => card.lessonProgressStatus === 'completed'
    );
  }

  private isChapterReadyToPublish(node: StoryNode): boolean {
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

  private isChapterPublished(node: StoryNode): boolean {
    try {
      return (
        this.hasStoryNodeStatus(node, constants.STORY_NODE_STATUS_PUBLISHED) ||
        this.hasStoryNodeStatus(node, 'Published')
      );
    } catch {
      return false;
    }
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

  private isChapterDisplayedAsComingSoon(node: StoryNode): boolean {
    if (this.isChapterReadyToPublish(node)) {
      return true;
    }

    return !node.getExplorationId();
  }

  private isNewChapterLabelVisible(node: StoryNode): boolean {
    if (this.isChapterDisplayedAsComingSoon(node)) {
      return false;
    }

    try {
      return this.chapterLabelVisibilityService.isNewChapterLabelVisible(
        node,
        this.storySummary
      );
    } catch {
      return false;
    }
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
