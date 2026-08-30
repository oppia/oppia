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
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {Subscription} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';

import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

import {AppConstants} from 'app.constants';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';
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
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LocalStorageService} from 'services/local-storage.service';

import constants from 'assets/constants';
import './topic-story-section.component.css';
import {MasteryChallengeLockedModalComponent} from './mastery-challenge-locked-modal.component';

import {AdventureMasteredModalComponent} from './adventure-mastered-modal.component';
import {ArcSkipConfirmationModalComponent} from './arc-skip-confirmation-modal.component';
import {AdventureNavigationLessonSelection} from './adventure-navigation.component';
import {LessonProgressStatus} from './topic-lesson-card/topic-lesson-card.component';

const PRIMARY_AVATAR_IMAGE_PATH = '/avatar/oppia_avatar_large_100px.svg';
const FALLBACK_AVATAR_IMAGE_PATH = '/general/collection_mascot.svg';
const FALLBACK_LESSON_THUMBNAIL_PATH = '/splash/student_desk1x.webp';
const ARC_MASTERED_QUERY_PARAM = 'arc_mastered';
const ARC_ID_QUERY_PARAM = 'arc_id';
const MOBILE_SCREEN_BREAKPOINT = 480;
const DEFAULT_FALLBACK_ACCENT_COLOR = '#00645c';
const DEFAULT_PRACTICE_BG_COLOR = '#ecf7f6';
const DEFAULT_PRACTICE_ACCENT_COLOR = '#0b776d';
const COMING_SOON_ACCENT_COLOR = '#6b7280';

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
  lessonProgressStatus: LessonProgressStatus;
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
    isCompleted: boolean;
  }[];
  accentColor: string;
  showPractice: boolean;
  isPracticeCompleted: boolean;
  arcId: string;
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
  // True when this section is rendered inside the topic editor's preview tab.
  // Used to offset the sticky adventure navigation below the editor's fixed
  // header bar.
  @Input() isInTopicEditorPreview: boolean = false;

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
  readonly defaultFallbackAccentColor = DEFAULT_FALLBACK_ACCENT_COLOR;
  readonly defaultPracticeBgColor = DEFAULT_PRACTICE_BG_COLOR;
  readonly defaultPracticeAccentColor = DEFAULT_PRACTICE_ACCENT_COLOR;
  readonly comingSoonAccentColor = COMING_SOON_ACCENT_COLOR;
  _expandedAdventureIndices: Set<number> = new Set();
  skippedAdventureIndices: Set<number> = new Set();
  navigatedLessonNumber: number | null = null;
  showArcSkipConfirmationModal: boolean = false;
  showAdventureMasteredModal: boolean = false;
  masteredAdventureIndex: number | null = null;
  pendingArcSkipTargetLabel: string = '';
  private pendingNavigationLessonNumber: number | null = null;
  private pendingNavigationAdventureIndex: number | null = null;
  private pendingStartUrl: string = '';
  private completedAdventurePracticeArcIds: Set<string> = new Set();
  private hasHandledArcMasteredQueryParams: boolean = false;
  private arcSkipModalRef: NgbModalRef | null = null;
  private adventureMasteredModalRef: NgbModalRef | null = null;

  private practiceAvailabilityRequestId: number = 0;
  practiceAvailabilityPending: Promise<void> | null = null;
  private directiveSubscriptions: Subscription = new Subscription();

  isAdventureExpanded(index: number): boolean {
    return this._expandedAdventureIndices.has(index);
  }

  toggleAdventure(index: number): void {
    if (this._expandedAdventureIndices.has(index)) {
      this._expandedAdventureIndices.delete(index);
    } else {
      this._expandedAdventureIndices.add(index);
      if (this.skippedAdventureIndices.delete(index)) {
        this.persistSkippedAdventures();
      }
    }
  }

  onNavigationLessonSelected(
    selection: AdventureNavigationLessonSelection
  ): void {
    const lessonNumber = selection.lessonNumber;
    const adventureIndex = selection.adventureIndex;

    if (adventureIndex !== -1 && this.shouldConfirmArcSkip(adventureIndex)) {
      this.pendingNavigationLessonNumber = lessonNumber;
      this.pendingNavigationAdventureIndex = adventureIndex;
      this.pendingStartUrl = '';
      this.pendingArcSkipTargetLabel = this.translateService.instant(
        'I18N_TOPIC_VIEWER_ADVENTURE_NUMBER_LABEL',
        {adventureNumber: adventureIndex + 1}
      );
      this.openArcSkipConfirmationModal();
      return;
    }

    this.selectLessonFromNavigation(lessonNumber, adventureIndex);
  }

  onArcSkipConfirmationCancel(): void {
    this.arcSkipModalRef = null;
    this.pendingNavigationLessonNumber = null;
    this.pendingNavigationAdventureIndex = null;
    this.pendingStartUrl = '';
    this.pendingArcSkipTargetLabel = '';
  }

  onArcSkipConfirmationProceed(): void {
    if (
      this.pendingNavigationLessonNumber === null ||
      this.pendingNavigationAdventureIndex === null
    ) {
      this.onArcSkipConfirmationCancel();
      return;
    }

    const lessonNumber = this.pendingNavigationLessonNumber;
    const adventureIndex = this.pendingNavigationAdventureIndex;
    const startUrl = this.pendingStartUrl;

    this.arcSkipModalRef = null;
    this.pendingNavigationLessonNumber = null;
    this.pendingNavigationAdventureIndex = null;
    this.pendingStartUrl = '';
    this.pendingArcSkipTargetLabel = '';

    if (adventureIndex !== -1) {
      for (let i = 0; i < adventureIndex; i++) {
        this.skippedAdventureIndices.add(i);
      }
      this._expandedAdventureIndices.add(adventureIndex);
      this.persistSkippedAdventures();
    }
    this.activeLessonNumber = lessonNumber;
    this.navigatedLessonNumber = lessonNumber;

    if (startUrl) {
      this.windowRef.nativeWindow.location.assign(startUrl);
    }
  }

  private openArcSkipConfirmationModal(): void {
    if (this.windowDimensionsService.getWidth() < MOBILE_SCREEN_BREAKPOINT) {
      const bottomSheetRef = this.bottomSheet.open(
        ArcSkipConfirmationModalComponent,
        {
          data: {
            adventureLabel: this.pendingArcSkipTargetLabel,
            confirmationMessage: this.getArcSkipConfirmationMessage(),
          },
        }
      );
      bottomSheetRef.afterDismissed().subscribe((result: string) => {
        if (result === 'confirm') {
          this.onArcSkipConfirmationProceed();
        } else {
          this.onArcSkipConfirmationCancel();
        }
      });
    } else {
      this.arcSkipModalRef = this.ngbModal.open(
        ArcSkipConfirmationModalComponent,
        {
          backdrop: 'static',
          windowClass: 'oppia-arc-skip-confirmation-modal',
        }
      );
      this.arcSkipModalRef.componentInstance.adventureLabel =
        this.pendingArcSkipTargetLabel;
      this.arcSkipModalRef.componentInstance.confirmationMessage =
        this.getArcSkipConfirmationMessage();
      this.arcSkipModalRef.result.then(
        () => this.onArcSkipConfirmationProceed(),
        () => this.onArcSkipConfirmationCancel()
      );
    }
  }

  private openAdventureMasteredModal(): void {
    if (this.windowDimensionsService.getWidth() < MOBILE_SCREEN_BREAKPOINT) {
      const bottomSheetRef = this.bottomSheet.open(
        AdventureMasteredModalComponent,
        {
          data: {
            title: this.getAdventureMasteredTitle(),
            message: this.getAdventureMasteredSubtitle(),
          },
        }
      );
      bottomSheetRef.afterDismissed().subscribe((result: string) => {
        if (result === 'confirm') {
          this.onAdventureMasteredContinue();
        } else {
          this.adventureMasteredModalRef = null;
        }
      });
    } else {
      this.adventureMasteredModalRef = this.ngbModal.open(
        AdventureMasteredModalComponent,
        {
          backdrop: 'static',
          windowClass: 'oppia-adventure-mastered-modal',
        }
      );
      this.adventureMasteredModalRef.componentInstance.title =
        this.getAdventureMasteredTitle();
      this.adventureMasteredModalRef.componentInstance.message =
        this.getAdventureMasteredSubtitle();
      this.adventureMasteredModalRef.result.then(
        () => this.onAdventureMasteredContinue(),
        () => {
          this.adventureMasteredModalRef = null;
        }
      );
    }
  }

  onAdventureMasteredContinue(): void {
    if (this.masteredAdventureIndex !== null) {
      this._expandedAdventureIndices.delete(this.masteredAdventureIndex);

      const nextAdventureIndex = this.masteredAdventureIndex + 1;
      if (nextAdventureIndex < this.visibleAdventureGroups.length) {
        this._expandedAdventureIndices.add(nextAdventureIndex);
        const nextAdventureFirstLesson =
          this.visibleAdventureGroups[nextAdventureIndex].lessonCards[0];
        if (nextAdventureFirstLesson) {
          this.activeLessonNumber = nextAdventureFirstLesson.lessonNumber;
          this.navigatedLessonNumber = nextAdventureFirstLesson.lessonNumber;
        }
      }
    }
    this.adventureMasteredModalRef = null;
    this.masteredAdventureIndex = null;
    this.hasHandledArcMasteredQueryParams = true;
  }

  getAdventureMasteredTitle(): string {
    if (this.masteredAdventureIndex === null) {
      return this.translateService.instant(
        'I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_TITLE'
      );
    }
    return this.translateService.instant(
      'I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_NUMBER_TITLE',
      {adventureNumber: this.masteredAdventureIndex + 1}
    );
  }

  getAdventureMasteredSubtitle(): string {
    if (this.masteredAdventureIndex === null) {
      return this.translateService.instant(
        'I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_MOMENTUM_SUBTITLE'
      );
    }

    const unlockedAdventureNumber = this.masteredAdventureIndex + 2;
    if (unlockedAdventureNumber <= this.visibleAdventureGroups.length) {
      return this.translateService.instant(
        'I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_UNLOCKED_SUBTITLE',
        {adventureNumber: unlockedAdventureNumber}
      );
    }

    return this.translateService.instant(
      'I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_ALL_COMPLETE_SUBTITLE'
    );
  }

  getArcSkipConfirmationMessage(): string {
    if (this.pendingNavigationAdventureIndex === null) {
      return '';
    }

    const skippedAdventureNumbers: number[] = [];
    for (let index = 0; index < this.pendingNavigationAdventureIndex; index++) {
      if (!this.areAllLessonsCompleted(index)) {
        skippedAdventureNumbers.push(index + 1);
      }
    }

    if (skippedAdventureNumbers.length === 0) {
      return '';
    }

    return this.translateService.instant(
      'I18N_TOPIC_VIEWER_ARC_SKIP_CONFIRMATION_MESSAGE',
      {
        count: skippedAdventureNumbers.length,
        adventureNumbers: this.joinAdventureNumbers(skippedAdventureNumbers),
        messageFormat: true,
      }
    );
  }

  private joinAdventureNumbers(numbers: number[]): string {
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

  isAdventureSkipped(adventureIndex: number): boolean {
    return this.skippedAdventureIndices.has(adventureIndex);
  }

  getSkippedAdventureButtonLabel(adventureIndex: number): string {
    const adventureGroup = this.visibleAdventureGroups[adventureIndex];
    if (!adventureGroup) {
      return this.translateService.instant(
        'I18N_TOPIC_VIEWER_ADVENTURE_START_BUTTON'
      );
    }

    const hasStarted = adventureGroup.lessonCards.some(
      card => card.lessonProgressStatus !== 'not_started'
    );
    return hasStarted
      ? this.translateService.instant(
          'I18N_TOPIC_VIEWER_ADVENTURE_RESUME_BUTTON'
        )
      : this.translateService.instant(
          'I18N_TOPIC_VIEWER_ADVENTURE_START_BUTTON'
        );
  }

  isAdventureCompleted(adventureIndex: number): boolean {
    const adventureGroup = this.visibleAdventureGroups[adventureIndex];
    if (!adventureGroup || adventureGroup.lessonCards.length === 0) {
      return false;
    }

    return (
      this.areAllLessonsCompleted(adventureIndex) &&
      this.isAdventurePracticeCompleted(adventureIndex)
    );
  }

  areAllLessonsCompleted(adventureIndex: number): boolean {
    const adventureGroup = this.visibleAdventureGroups[adventureIndex];
    if (!adventureGroup || adventureGroup.lessonCards.length === 0) {
      return false;
    }

    return adventureGroup.lessonCards.every(
      card => card.lessonProgressStatus === 'completed'
    );
  }

  isAdventurePracticeCompleted(adventureIndex: number): boolean {
    const adventureGroup = this.visibleAdventureGroups[adventureIndex];
    if (!adventureGroup) {
      return false;
    }
    return this.completedAdventurePracticeArcIds.has(adventureGroup.arcId);
  }

  isStoryCompleted(): boolean {
    if (this.availableLessonCards.length === 0) {
      return false;
    }

    return this.availableLessonCards.every(
      card => card.lessonProgressStatus === 'completed'
    );
  }

  private selectLessonFromNavigation(
    lessonNumber: number,
    adventureIndex: number
  ): void {
    this.activeLessonNumber = lessonNumber;
    this.navigatedLessonNumber = lessonNumber;

    if (adventureIndex !== -1) {
      this._expandedAdventureIndices.add(adventureIndex);
    }

    setTimeout(() => {
      this.scrollToElementById('lesson-' + lessonNumber);
      this.scrollToElementById('coming-soon-lesson-' + lessonNumber);
    }, 300);
  }

  onLessonStartClick(selection: {
    lessonNumber: number;
    startUrl: string;
  }): void {
    const {lessonNumber, startUrl} = selection;
    const adventureIndex = this.visibleAdventureGroups.findIndex(group =>
      group.lessonCards.some(card => card.lessonNumber === lessonNumber)
    );

    if (adventureIndex !== -1 && this.shouldConfirmArcSkip(adventureIndex)) {
      this.pendingNavigationLessonNumber = lessonNumber;
      this.pendingNavigationAdventureIndex = adventureIndex;
      this.pendingStartUrl = startUrl;
      this.pendingArcSkipTargetLabel = this.translateService.instant(
        'I18N_TOPIC_VIEWER_ADVENTURE_NUMBER_LABEL',
        {adventureNumber: adventureIndex + 1}
      );
      this.openArcSkipConfirmationModal();
      return;
    }

    if (adventureIndex !== -1) {
      this._expandedAdventureIndices.add(adventureIndex);
    }
    this.activeLessonNumber = lessonNumber;
    this.navigatedLessonNumber = lessonNumber;

    if (startUrl) {
      this.windowRef.nativeWindow.location.assign(startUrl);
    }
  }

  onNavigationMasteryChallengeClicked(): void {
    this.openMasteryChallengeModal();
  }

  onMasteryChallengeCardClicked(): void {
    if (this.isMasteryUnlocked) {
      if (this.masteryChallengeUrl !== '#') {
        this.windowRef.nativeWindow.location.assign(this.masteryChallengeUrl);
      }
      return;
    }

    this.openMasteryChallengeModal();
  }

  private openMasteryChallengeModal(): void {
    const modalRef: NgbModalRef = this.ngbModal.open(
      MasteryChallengeLockedModalComponent,
      {
        backdrop: 'static',
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

  private shouldConfirmArcSkip(adventureIndex: number): boolean {
    if (adventureIndex <= 0) {
      return false;
    }

    for (let index = 0; index < adventureIndex; index++) {
      if (!this.areAllLessonsCompleted(index)) {
        return true;
      }
    }
    return false;
  }

  private markSkippedAdventuresBefore(targetAdventureIndex: number): void {
    if (targetAdventureIndex <= 0) {
      return;
    }

    for (let index = 0; index < targetAdventureIndex; index++) {
      if (!this.isAdventureCompleted(index)) {
        this.skippedAdventureIndices.add(index);
        this._expandedAdventureIndices.delete(index);
      }
    }
    this.persistSkippedAdventures();
  }

  private restoreSkippedAdventures(): void {
    const storyId = this.storySummary.getId();
    if (!storyId) {
      return;
    }
    this.skippedAdventureIndices = new Set(
      this.localStorageService.getSkippedAdventures(storyId)
    );
  }

  private persistSkippedAdventures(): void {
    const storyId = this.storySummary.getId();
    if (!storyId) {
      return;
    }
    this.localStorageService.updateSkippedAdventures(
      storyId,
      Array.from(this.skippedAdventureIndices)
    );
  }

  private restoreMasteredAdventures(): void {
    const storyId = this.storySummary.getId();
    if (!storyId) {
      return;
    }
    this.completedAdventurePracticeArcIds = new Set(
      this.localStorageService.getMasteredAdventures(storyId)
    );
  }

  private persistMasteredAdventures(): void {
    const storyId = this.storySummary.getId();
    if (!storyId) {
      return;
    }
    this.localStorageService.updateMasteredAdventures(
      storyId,
      Array.from(this.completedAdventurePracticeArcIds)
    );
  }

  onNavigationPracticeSelected(arcId: string): void {
    setTimeout(() => {
      this.scrollToElementById('practice-card-' + arcId);
    }, 300);
  }

  public scrollToMasteryChallenge(): void {
    setTimeout(() => {
      const el = document.querySelector('.mastery-challenge-card');
      if (el) {
        this.scrollToElement(el);
      }
    }, 50);
  }

  private scrollToElementById(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      this.scrollToElement(el);
    }
  }

  private scrollToElement(el: Element): void {
    const navbarHeight = 56;
    const adventureNav = document.querySelector(
      '.adventure-navigation-container'
    );
    const adventureNavHeight = adventureNav
      ? adventureNav.getBoundingClientRect().height
      : 0;
    const offset = navbarHeight + adventureNavHeight + 16;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({top, behavior: 'smooth'});
  }

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private topicSessionFallbackLanguageService: TopicSessionFallbackLanguageService,
    private chapterLabelVisibilityService: ChapterLabelVisibilityService,
    private questionBackendApiService: QuestionBackendApiService,
    private windowRef: WindowRef,
    private ngbModal: NgbModal,
    private localStorageService: LocalStorageService,
    private bottomSheet: MatBottomSheet,
    private windowDimensionsService: WindowDimensionsService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.populateFromInputs();
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
    if (changes.practiceSubtopicIds) {
      this.practiceCard = this.getPracticeCardData();
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
    return this.translateService.instant(
      'I18N_TOPIC_VIEWER_ADVENTURE_COMPLETION_TEXT',
      {completedCount, totalCount}
    );
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  private getLessonProgressStatus(node: StoryNode): LessonProgressStatus {
    if (this.isChapterDisplayedAsComingSoon(node) || !node.getExplorationId()) {
      return 'coming_soon';
    }

    const nodeTitle = node.getTitle();
    if (this.storySummary.isNodeCompleted(nodeTitle)) {
      return 'completed';
    }

    const visitedChapterTitles = this.storySummary.getVisitedChapterTitles();
    if (visitedChapterTitles && visitedChapterTitles.includes(nodeTitle)) {
      return 'in_progress';
    }

    return 'not_started';
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
      // The backend maps an arc to its 1-based position among the topic's
      // story arcs, so pass the position rather than a parsed arc id.
      const arcId = String(adventureIndex + 1);
      return {
        adventureTitle: arc.title,
        adventureDescription: arc.description,
        lessonCards: adventureLessonCards,
        accentColor: paletteColor.rowAccent,
        iconBg: paletteColor.iconBg,
        headerBackgroundColor: paletteColor.headerBg,
        headerBorderColor: paletteColor.headerBorder,
        arcId,
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
    this.restoreSkippedAdventures();
    this.restoreMasteredAdventures();
    this.updateVisibleSections();
    this.activeLessonNumber = this.getActiveLessonNumber();
    this.maybeShowAdventureMasteredModal();

    this.isPracticeCardVisible = this.practiceCount >= 1;
    this.practiceCard = this.getPracticeCardData();
    this.masteryChallengeUrl = this.getMasteryChallengeUrl();
    this.isMasteryUnlocked = this.isStoryCompleted();
    this.practiceAvailabilityPending = this.loadPracticeQuestionAvailability();
  }

  private getPracticeCardData(): PracticeCardData {
    const firstArcId =
      this.adventureGroups.length > 0 ? this.adventureGroups[0].arcId : '';

    return {
      practiceTitle: this.getPracticeTitle(0),
      practiceDescription: this.getPracticeDescription(0),
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

    this.visibleAdventureGroups = this.visibleAdventureGroups.map(group => {
      const updated = adventureGroups.find(g => g.arcId === group.arcId);
      return updated ? {...updated, lessonCards: group.lessonCards} : group;
    });
  }

  private getUniqueSkillIds(lessonCards: LessonCardData[]): string[] {
    const skillIds = lessonCards.reduce(
      (allSkillIds: string[], card) => allSkillIds.concat(card.skillIds),
      []
    );
    return Array.from(new Set(skillIds));
  }

  private async checkIfQuestionsExist(skillIds: string[]): Promise<boolean> {
    if (!skillIds || skillIds.length === 0) {
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
    return `Adventure ${adventureIndex + 1} Review & Test`;
  }

  getPracticeDescription(adventureIndex: number): string {
    const adventureNumber = adventureIndex + 1;
    if (adventureIndex < this.visibleAdventureGroups.length - 1) {
      return this.translateService.instant(
        'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_WITH_NEXT',
        {adventureNumber, nextAdventureNumber: adventureNumber + 1}
      );
    }
    return this.translateService.instant(
      'I18N_TOPIC_VIEWER_PRACTICE_DESCRIPTION_FINAL',
      {adventureNumber}
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

        const isPracticeCompleted =
          visibleLessons.length > 0 &&
          this.completedAdventurePracticeArcIds.has(group.arcId);

        return {
          lessons: visibleLessons.map(card => {
            return {
              lessonNumber: card.lessonNumber,
              isCompleted: card.lessonProgressStatus === 'completed',
            };
          }),
          accentColor: group.accentColor,
          showPractice: visibleLessons.length > 0,
          isPracticeCompleted,
          arcId: group.arcId,
        };
      })
      .filter(group => group.lessons.length > 0);

    if (
      this.visibleAdventureGroups.length &&
      this._expandedAdventureIndices.size === 0
    ) {
      const firstNonSkippedIncompleteIndex =
        this.visibleAdventureGroups.findIndex(
          (_group, index) =>
            !this.skippedAdventureIndices.has(index) &&
            !this.isAdventureCompleted(index)
        );
      const firstIncompleteIndex = this.visibleAdventureGroups.findIndex(
        (_group, index) => !this.isAdventureCompleted(index)
      );
      const adventureIndexToExpand =
        firstNonSkippedIncompleteIndex === -1
          ? firstIncompleteIndex
          : firstNonSkippedIncompleteIndex;
      if (adventureIndexToExpand !== -1) {
        this._expandedAdventureIndices.add(adventureIndexToExpand);
      }
    }

    this.isMasteryUnlocked = this.isStoryCompleted();
  }

  private maybeShowAdventureMasteredModal(): void {
    if (
      this.adventureMasteredModalRef !== null ||
      this.hasHandledArcMasteredQueryParams
    ) {
      return;
    }

    const arcMasteredFlagValues = this.urlService.getQueryFieldValuesAsList(
      ARC_MASTERED_QUERY_PARAM
    );
    const arcIdValues =
      this.urlService.getQueryFieldValuesAsList(ARC_ID_QUERY_PARAM);

    if (
      arcMasteredFlagValues.length === 0 ||
      arcMasteredFlagValues[0] !== 'true' ||
      arcIdValues.length === 0
    ) {
      return;
    }

    const masteredArcId = this.normalizeArcIdFromQueryValue(arcIdValues[0]);
    if (!masteredArcId) {
      return;
    }

    const adventureIndex = this.visibleAdventureGroups.findIndex(
      group => group.arcId === masteredArcId
    );

    if (adventureIndex === -1 || !this.areAllLessonsCompleted(adventureIndex)) {
      return;
    }

    this.completedAdventurePracticeArcIds.add(masteredArcId);
    this.persistMasteredAdventures();
    this.updateVisibleSections();

    this.hasHandledArcMasteredQueryParams = true;
    this.masteredAdventureIndex = adventureIndex;
    this.openAdventureMasteredModal();
  }

  private normalizeArcIdFromQueryValue(rawArcId: string): string | null {
    if (!rawArcId) {
      return null;
    }

    const match = rawArcId.match(/^\d+/);
    if (!match) {
      return null;
    }

    return match[0];
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
    if (!this.classroomUrlFragment || !this.topicUrlFragment) {
      return '#';
    }
    return ClassroomDomainConstants.TOPIC_VIEWER_STUDYGUIDE_URL_TEMPLATE.replace(
      '<classroom_url_fragment>',
      encodeURIComponent(this.classroomUrlFragment)
    ).replace(
      '<topic_url_fragment>',
      encodeURIComponent(this.topicUrlFragment)
    );
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
