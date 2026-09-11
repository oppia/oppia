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

import {StorySummary} from 'domain/story/story-summary.model';
import {TopicSessionFallbackLanguageService} from 'pages/topic-viewer-page/services/topic-session-fallback-language.service';
import {TopicStorySectionBackendDataService} from 'pages/topic-viewer-page/services/topic-story-section-backend-data.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LocalStorageService} from 'services/local-storage.service';

import './topic-story-section.component.css';
import {MasteryChallengeLockedModalComponent} from './mastery-challenge-locked-modal.component';

import {ModuleMasteredModalComponent} from './module-mastered-modal.component';
import {ModuleSkipConfirmationModalComponent} from './module-skip-confirmation-modal.component';
import {ModuleNavigationLessonSelection} from './module-navigation.component';
import {
  LessonCardData,
  ModuleGroupData,
} from 'pages/topic-viewer-page/services/topic-story-section-backend-data.service';

const ARC_MASTERED_QUERY_PARAM = 'arc_mastered';
const ARC_ID_QUERY_PARAM = 'arc_id';
const MOBILE_SCREEN_BREAKPOINT = 480;
const DEFAULT_FALLBACK_ACCENT_COLOR = '#00645c';
const DEFAULT_PRACTICE_BG_COLOR = '#ecf7f6';
const DEFAULT_PRACTICE_ACCENT_COLOR = '#0b776d';
const COMING_SOON_ACCENT_COLOR = '#6b7280';

interface PracticeCardData {
  practiceTitle: string;
  practiceDescription: string;
  thumbnailUrl: string;
  studyUrl: string;
  practiceUrl: string;
  hasPracticeQuestions: boolean;
}

interface ModuleNavigationGroupData {
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
  // Used to offset the sticky module navigation below the editor's fixed
  // header bar.
  @Input() isInTopicEditorPreview: boolean = false;

  oppiaAvatarImageUrl: string = '';
  studyGuideUrl: string = '#';
  lessonCards: LessonCardData[] = [];
  availableLessonCards: LessonCardData[] = [];
  comingSoonLessonCards: LessonCardData[] = [];
  moduleGroups: ModuleGroupData[] = [];
  visibleModuleGroups: ModuleGroupData[] = [];
  comingSoonModuleGroups: ModuleGroupData[] = [];
  moduleNavigationGroups: ModuleNavigationGroupData[] = [];
  activeLessonNumber: number | null = null;
  activePracticeArcId: string = '';
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
  _expandedModuleIndices: Set<number> = new Set();
  skippedModuleIndices: Set<number> = new Set();
  navigatedLessonNumber: number | null = null;
  showModuleSkipConfirmationModal: boolean = false;
  showModuleMasteredModal: boolean = false;
  masteredModuleIndex: number | null = null;
  pendingModuleSkipTargetLabel: string = '';
  private pendingNavigationLessonNumber: number | null = null;
  private pendingNavigationModuleIndex: number | null = null;
  private pendingStartUrl: string = '';
  private completedModulePracticeArcIds: Set<string> = new Set();
  private hasHandledArcMasteredQueryParams: boolean = false;
  private moduleSkipModalRef: NgbModalRef | null = null;
  private moduleMasteredModalRef: NgbModalRef | null = null;

  private practiceAvailabilityRequestId: number = 0;
  practiceAvailabilityPending: Promise<void> | null = null;
  private directiveSubscriptions: Subscription = new Subscription();

  isModuleExpanded(index: number): boolean {
    return this._expandedModuleIndices.has(index);
  }

  toggleModule(index: number): void {
    if (this._expandedModuleIndices.has(index)) {
      this._expandedModuleIndices.delete(index);
    } else {
      this._expandedModuleIndices.add(index);
      if (this.skippedModuleIndices.delete(index)) {
        this.persistSkippedModules();
      }
    }
  }

  onNavigationLessonSelected(selection: ModuleNavigationLessonSelection): void {
    const lessonNumber = selection.lessonNumber;
    const moduleIndex = selection.moduleIndex;

    // Clicking a lesson circle in the navbar should only scroll to that
    // lesson's card. Any confirmation is handled when starting the lesson.
    this.selectLessonFromNavigation(lessonNumber, moduleIndex);
  }

  onModuleSkipConfirmationCancel(): void {
    this.moduleSkipModalRef = null;
    this.pendingNavigationLessonNumber = null;
    this.pendingNavigationModuleIndex = null;
    this.pendingStartUrl = '';
    this.pendingModuleSkipTargetLabel = '';
  }

  onModuleSkipConfirmationProceed(): void {
    if (
      this.pendingNavigationLessonNumber === null ||
      this.pendingNavigationModuleIndex === null
    ) {
      this.onModuleSkipConfirmationCancel();
      return;
    }

    const lessonNumber = this.pendingNavigationLessonNumber;
    const moduleIndex = this.pendingNavigationModuleIndex;
    const startUrl = this.pendingStartUrl;

    this.moduleSkipModalRef = null;
    this.pendingNavigationLessonNumber = null;
    this.pendingNavigationModuleIndex = null;
    this.pendingStartUrl = '';
    this.pendingModuleSkipTargetLabel = '';

    if (moduleIndex !== -1) {
      this.markSkippedModulesBefore(moduleIndex);
      this._expandedModuleIndices.add(moduleIndex);
    }
    this.activeLessonNumber = lessonNumber;
    this.navigatedLessonNumber = lessonNumber;

    if (startUrl) {
      this.windowRef.nativeWindow.location.assign(startUrl);
    }
  }

  private openModuleSkipConfirmationModal(): void {
    if (this.windowDimensionsService.getWidth() < MOBILE_SCREEN_BREAKPOINT) {
      const bottomSheetRef = this.bottomSheet.open(
        ModuleSkipConfirmationModalComponent,
        {
          data: {
            moduleLabel: this.pendingModuleSkipTargetLabel,
            confirmationMessage: this.getModuleSkipConfirmationMessage(),
          },
        }
      );
      bottomSheetRef.afterDismissed().subscribe((result: string) => {
        if (result === 'confirm') {
          this.onModuleSkipConfirmationProceed();
        } else {
          this.onModuleSkipConfirmationCancel();
        }
      });
    } else {
      this.moduleSkipModalRef = this.ngbModal.open(
        ModuleSkipConfirmationModalComponent,
        {
          backdrop: 'static',
          windowClass: 'oppia-module-skip-confirmation-modal',
        }
      );
      this.moduleSkipModalRef.componentInstance.moduleLabel =
        this.pendingModuleSkipTargetLabel;
      this.moduleSkipModalRef.componentInstance.confirmationMessage =
        this.getModuleSkipConfirmationMessage();
      this.moduleSkipModalRef.result.then(
        () => this.onModuleSkipConfirmationProceed(),
        () => this.onModuleSkipConfirmationCancel()
      );
    }
  }

  private openModuleMasteredModal(): void {
    if (this.windowDimensionsService.getWidth() < MOBILE_SCREEN_BREAKPOINT) {
      const bottomSheetRef = this.bottomSheet.open(
        ModuleMasteredModalComponent,
        {
          data: {
            title: this.getModuleMasteredTitle(),
            message: this.getModuleMasteredSubtitle(),
          },
        }
      );
      bottomSheetRef.afterDismissed().subscribe((result: string) => {
        if (result === 'confirm') {
          this.onModuleMasteredContinue();
        } else {
          this.moduleMasteredModalRef = null;
        }
      });
    } else {
      this.moduleMasteredModalRef = this.ngbModal.open(
        ModuleMasteredModalComponent,
        {
          backdrop: 'static',
          windowClass: 'oppia-module-mastered-modal',
        }
      );
      this.moduleMasteredModalRef.componentInstance.title =
        this.getModuleMasteredTitle();
      this.moduleMasteredModalRef.componentInstance.message =
        this.getModuleMasteredSubtitle();
      this.moduleMasteredModalRef.result.then(
        () => this.onModuleMasteredContinue(),
        () => {
          this.moduleMasteredModalRef = null;
        }
      );
    }
  }

  onModuleMasteredContinue(): void {
    if (this.masteredModuleIndex !== null) {
      this._expandedModuleIndices.delete(this.masteredModuleIndex);

      const nextModuleIndex = this.masteredModuleIndex + 1;
      if (nextModuleIndex < this.visibleModuleGroups.length) {
        this._expandedModuleIndices.add(nextModuleIndex);
        const nextModuleFirstLesson =
          this.visibleModuleGroups[nextModuleIndex].lessonCards[0];
        if (nextModuleFirstLesson) {
          this.activeLessonNumber = nextModuleFirstLesson.lessonNumber;
          this.navigatedLessonNumber = nextModuleFirstLesson.lessonNumber;
        }
      }
    }
    this.moduleMasteredModalRef = null;
    this.masteredModuleIndex = null;
    this.hasHandledArcMasteredQueryParams = true;
  }

  getModuleMasteredTitle(): string {
    if (this.masteredModuleIndex === null) {
      return this.translateService.instant(
        'I18N_TOPIC_VIEWER_MODULE_MASTERED_TITLE'
      );
    }
    return this.translateService.instant(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_NUMBER_TITLE',
      {moduleNumber: this.masteredModuleIndex + 1}
    );
  }

  getModuleMasteredSubtitle(): string {
    if (this.masteredModuleIndex === null) {
      return this.translateService.instant(
        'I18N_TOPIC_VIEWER_MODULE_MASTERED_MOMENTUM_SUBTITLE'
      );
    }

    const unlockedModuleNumber = this.masteredModuleIndex + 2;
    if (unlockedModuleNumber <= this.visibleModuleGroups.length) {
      return this.translateService.instant(
        'I18N_TOPIC_VIEWER_MODULE_MASTERED_UNLOCKED_SUBTITLE',
        {moduleNumber: unlockedModuleNumber}
      );
    }

    return this.translateService.instant(
      'I18N_TOPIC_VIEWER_MODULE_MASTERED_ALL_COMPLETE_SUBTITLE'
    );
  }

  getModuleSkipConfirmationMessage(): string {
    if (this.pendingNavigationModuleIndex === null) {
      return '';
    }

    const skippedModuleNumbers: number[] = [];
    for (let index = 0; index < this.pendingNavigationModuleIndex; index++) {
      if (!this.areAllLessonsCompleted(index)) {
        skippedModuleNumbers.push(index + 1);
      }
    }

    if (skippedModuleNumbers.length === 0) {
      return '';
    }

    return this.translateService.instant(
      'I18N_TOPIC_VIEWER_MODULE_SKIP_CONFIRMATION_MESSAGE',
      {
        count: skippedModuleNumbers.length,
        moduleNumbers:
          this.topicStorySectionBackendDataService.joinModuleNumbers(
            skippedModuleNumbers
          ),
        messageFormat: true,
      }
    );
  }

  isModuleSkipped(moduleIndex: number): boolean {
    return this.skippedModuleIndices.has(moduleIndex);
  }

  getSkippedModuleButtonLabel(moduleIndex: number): string {
    const moduleGroup = this.visibleModuleGroups[moduleIndex];
    if (!moduleGroup) {
      return this.translateService.instant(
        'I18N_TOPIC_VIEWER_MODULE_START_BUTTON'
      );
    }

    const hasStarted = moduleGroup.lessonCards.some(
      card => card.lessonProgressStatus !== 'not_started'
    );
    return hasStarted
      ? this.translateService.instant('I18N_TOPIC_VIEWER_MODULE_RESUME_BUTTON')
      : this.translateService.instant('I18N_TOPIC_VIEWER_MODULE_START_BUTTON');
  }

  isModuleCompleted(moduleIndex: number): boolean {
    const moduleGroup = this.visibleModuleGroups[moduleIndex];
    if (!moduleGroup || moduleGroup.lessonCards.length === 0) {
      return false;
    }

    return (
      this.areAllLessonsCompleted(moduleIndex) &&
      this.isModulePracticeCompleted(moduleIndex)
    );
  }

  areAllLessonsCompleted(moduleIndex: number): boolean {
    const moduleGroup = this.visibleModuleGroups[moduleIndex];
    if (!moduleGroup || moduleGroup.lessonCards.length === 0) {
      return false;
    }

    return moduleGroup.lessonCards.every(
      card => card.lessonProgressStatus === 'completed'
    );
  }

  isModulePracticeCompleted(moduleIndex: number): boolean {
    const moduleGroup = this.visibleModuleGroups[moduleIndex];
    if (!moduleGroup) {
      return false;
    }
    return this.completedModulePracticeArcIds.has(moduleGroup.arcId);
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
    moduleIndex: number
  ): void {
    this.activeLessonNumber = lessonNumber;
    this.navigatedLessonNumber = lessonNumber;
    // Only one circle should appear filled in the navbar at a time.
    this.activePracticeArcId = '';

    if (moduleIndex !== -1) {
      this._expandedModuleIndices.add(moduleIndex);
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
    const moduleIndex = this.visibleModuleGroups.findIndex(group =>
      group.lessonCards.some(card => card.lessonNumber === lessonNumber)
    );

    if (moduleIndex !== -1 && this.shouldConfirmModuleSkip(moduleIndex)) {
      this.pendingNavigationLessonNumber = lessonNumber;
      this.pendingNavigationModuleIndex = moduleIndex;
      this.pendingStartUrl = startUrl;
      this.pendingModuleSkipTargetLabel = this.translateService.instant(
        'I18N_TOPIC_VIEWER_MODULE_NUMBER_LABEL',
        {moduleNumber: moduleIndex + 1}
      );
      this.openModuleSkipConfirmationModal();
      return;
    }

    if (moduleIndex !== -1) {
      this._expandedModuleIndices.add(moduleIndex);
    }
    this.activeLessonNumber = lessonNumber;
    this.navigatedLessonNumber = lessonNumber;
    // Only one circle should appear filled in the navbar at a time.
    this.activePracticeArcId = '';

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

  private shouldConfirmModuleSkip(moduleIndex: number): boolean {
    if (moduleIndex <= 0) {
      return false;
    }

    for (let index = 0; index < moduleIndex; index++) {
      if (!this.areAllLessonsCompleted(index)) {
        return true;
      }
    }
    return false;
  }

  private markSkippedModulesBefore(targetModuleIndex: number): void {
    if (targetModuleIndex <= 0) {
      return;
    }

    for (let index = 0; index < targetModuleIndex; index++) {
      if (!this.isModuleCompleted(index)) {
        this.skippedModuleIndices.add(index);
        this._expandedModuleIndices.delete(index);
      }
    }
    this.persistSkippedModules();
  }

  private restoreSkippedModules(): void {
    const storyId = this.storySummary.getId();
    if (!storyId) {
      return;
    }
    this.skippedModuleIndices = new Set(
      this.localStorageService.getSkippedModules(storyId)
    );
  }

  private persistSkippedModules(): void {
    const storyId = this.storySummary.getId();
    if (!storyId) {
      return;
    }
    this.localStorageService.updateSkippedModules(
      storyId,
      Array.from(this.skippedModuleIndices)
    );
  }

  private restoreMasteredModules(): void {
    const storyId = this.storySummary.getId();
    if (!storyId) {
      return;
    }
    this.completedModulePracticeArcIds = new Set(
      this.localStorageService.getMasteredModules(storyId)
    );
  }

  private persistMasteredModules(): void {
    const storyId = this.storySummary.getId();
    if (!storyId) {
      return;
    }
    this.localStorageService.updateMasteredModules(
      storyId,
      Array.from(this.completedModulePracticeArcIds)
    );
  }

  onNavigationPracticeSelected(arcId: string): void {
    this.activePracticeArcId = arcId;
    // Only one circle should appear filled in the navbar at a time.
    this.activeLessonNumber = null;
    setTimeout(() => {
      this.scrollToElementById('practice-card-' + arcId);
    }, 300);
  }

  scrollToMasteryChallenge(): void {
    setTimeout(() => {
      const el = this.windowRef.nativeWindow.document.querySelector(
        '.mastery-challenge-card'
      );
      if (el) {
        this.scrollToElement(el);
      }
    }, 50);
  }

  private scrollToElementById(id: string): void {
    const el = this.windowRef.nativeWindow.document.getElementById(id);
    if (el) {
      this.scrollToElement(el);
    }
  }

  private scrollToElement(el: Element): void {
    const navbarHeight = 56;
    const moduleNav = this.windowRef.nativeWindow.document.querySelector(
      '.module-navigation-container'
    );
    const moduleNavHeight = moduleNav
      ? moduleNav.getBoundingClientRect().height
      : 0;
    const offset = navbarHeight + moduleNavHeight + 16;
    const top =
      el.getBoundingClientRect().top +
      this.windowRef.nativeWindow.scrollY -
      offset;
    this.windowRef.nativeWindow.scrollTo({top, behavior: 'smooth'});
  }

  constructor(
    private urlService: UrlService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private topicSessionFallbackLanguageService: TopicSessionFallbackLanguageService,
    private topicStorySectionBackendDataService: TopicStorySectionBackendDataService,
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
    if (
      this.oppiaAvatarImageUrl !==
      this.topicStorySectionBackendDataService.getFallbackAvatarImageUrl()
    ) {
      this.oppiaAvatarImageUrl =
        this.topicStorySectionBackendDataService.getFallbackAvatarImageUrl();
    }
  }

  shouldShowModuleEndTestCard(moduleIndex: number): boolean {
    return Boolean(this.visibleModuleGroups[moduleIndex]?.lessonCards.length);
  }

  getModuleCompletionText(moduleIndex: number): string {
    const moduleGroup = this.visibleModuleGroups[moduleIndex];
    if (!moduleGroup) {
      return '';
    }
    const completedCount = moduleGroup.lessonCards.filter(
      card => card.lessonProgressStatus === 'completed'
    ).length;
    const totalCount = moduleGroup.lessonCards.length;
    return this.topicStorySectionBackendDataService.getModuleCompletionText(
      completedCount,
      totalCount
    );
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
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

    this.oppiaAvatarImageUrl =
      this.topicStorySectionBackendDataService.getPrimaryAvatarImageUrl();
    this.studyGuideUrl =
      this.topicStorySectionBackendDataService.getStudyGuideUrl(
        this.classroomUrlFragment,
        this.topicUrlFragment
      );

    this.storyTitle = this.storySummary.getTitle();
    this.storyDescription = this.storySummary.getDescription() || '';
    this.lessonCount = this.storySummary.getNodeTitles().length;
    const allNodes = this.storySummary.getAllNodes();
    this.lessonCards =
      this.topicStorySectionBackendDataService.buildLessonCards(
        allNodes,
        this.storySummary,
        this.classroomUrlFragment,
        this.topicUrlFragment
      );

    this.moduleGroups =
      this.topicStorySectionBackendDataService.buildModuleGroups(
        allNodes,
        this.storySummary,
        this.lessonCards
      );
    this.restoreSkippedModules();
    this.restoreMasteredModules();
    this.updateVisibleSections();
    this.activeLessonNumber = this.getActiveLessonNumber();
    this.expandModuleForActiveLesson();
    this.maybeShowModuleMasteredModal();

    this.isPracticeCardVisible = this.practiceCount >= 1;
    this.practiceCard = this.getPracticeCardData();
    this.masteryChallengeUrl = this.getMasteryChallengeUrl();
    this.isMasteryUnlocked = this.isStoryCompleted();
    this.practiceAvailabilityPending = this.loadPracticeQuestionAvailability();
  }

  private getPracticeCardData(): PracticeCardData {
    const firstArcId =
      this.moduleGroups.length > 0 ? this.moduleGroups[0].arcId : '';

    return {
      practiceTitle: this.getPracticeTitle(0),
      practiceDescription: this.getPracticeDescription(0),
      thumbnailUrl:
        this.topicStorySectionBackendDataService.getFallbackLessonThumbnailUrl(),
      studyUrl: this.studyGuideUrl,
      practiceUrl: firstArcId
        ? this.getEndOfArcUrl(firstArcId)
        : this.topicStorySectionBackendDataService.getGeneralPracticeUrl(
            this.practiceSubtopicIds,
            this.classroomUrlFragment,
            this.topicUrlFragment
          ),
      hasPracticeQuestions: false,
    };
  }

  private async loadPracticeQuestionAvailability(): Promise<void> {
    const requestId = ++this.practiceAvailabilityRequestId;
    const lessonCards = this.lessonCards;
    const moduleGroups = this.moduleGroups;

    const lessonAvailability = await Promise.all(
      lessonCards.map(card =>
        this.topicStorySectionBackendDataService.checkIfQuestionsExist(
          card.skillIds
        )
      )
    );

    if (requestId !== this.practiceAvailabilityRequestId) {
      return;
    }

    // The availability for each module and for the whole story is a union
    // of its lessons' skill sets, so it can be derived from the per-lesson
    // results without issuing redundant backend requests.
    const availabilityByLessonNumber = new Map<number, boolean>();
    lessonCards.forEach((card, index) => {
      card.hasPracticeQuestions = lessonAvailability[index];
      availabilityByLessonNumber.set(
        card.lessonNumber,
        lessonAvailability[index]
      );
    });
    moduleGroups.forEach(group => {
      group.hasPracticeQuestions = group.lessonCards.some(
        card => availabilityByLessonNumber.get(card.lessonNumber) === true
      );
    });
    this.practiceCard.hasPracticeQuestions = lessonAvailability.some(
      available => available
    );

    this.visibleModuleGroups = this.visibleModuleGroups.map(group => {
      const updated = moduleGroups.find(g => g.arcId === group.arcId);
      return updated ? {...updated, lessonCards: group.lessonCards} : group;
    });
  }

  getPracticeTitle(moduleIndex: number): string {
    return this.topicStorySectionBackendDataService.getPracticeTitle(
      moduleIndex
    );
  }

  getPracticeDescription(moduleIndex: number): string {
    return this.topicStorySectionBackendDataService.getPracticeDescription(
      moduleIndex,
      moduleIndex >= this.visibleModuleGroups.length - 1
    );
  }

  getLessonPracticeUrl(nodeId: string): string {
    return this.topicStorySectionBackendDataService.getLessonPracticeUrl(
      nodeId,
      this.classroomUrlFragment,
      this.topicUrlFragment
    );
  }

  getEndOfArcUrl(arcId: string): string {
    return this.topicStorySectionBackendDataService.getEndOfArcUrl(
      arcId,
      this.classroomUrlFragment,
      this.topicUrlFragment
    );
  }

  private getMasteryChallengeUrl(): string {
    return this.topicStorySectionBackendDataService.getMasteryChallengeUrl(
      this.classroomUrlFragment,
      this.topicUrlFragment
    );
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

  // Expands the module that contains the currently active (next) lesson so
  // that when the learner returns after completing a lesson and a new lesson
  // becomes active, its chapter is already expanded rather than collapsed.
  private expandModuleForActiveLesson(): void {
    if (this.activeLessonNumber === null) {
      return;
    }

    const activeLesson = this.lessonCards.find(
      lesson => lesson.lessonNumber === this.activeLessonNumber
    );
    if (
      !activeLesson ||
      activeLesson.isComingSoon ||
      (activeLesson.lessonProgressStatus !== 'in_progress' &&
        activeLesson.lessonProgressStatus !== 'not_started')
    ) {
      return;
    }

    const moduleIndex = this.visibleModuleGroups.findIndex(group =>
      group.lessonCards.some(
        card => card.lessonNumber === this.activeLessonNumber
      )
    );
    if (moduleIndex === -1 || this.skippedModuleIndices.has(moduleIndex)) {
      return;
    }
    this._expandedModuleIndices.add(moduleIndex);
  }

  private updateVisibleSections(): void {
    this.availableLessonCards = this.lessonCards.filter(
      lesson => !lesson.isComingSoon
    );
    this.comingSoonLessonCards = this.lessonCards.filter(
      lesson => lesson.isComingSoon
    );

    this.visibleModuleGroups = this.moduleGroups
      .map(group => {
        return {
          ...group,
          lessonCards: group.lessonCards.filter(card => !card.isComingSoon),
        };
      })
      .filter(group => group.lessonCards.length > 0);

    this.comingSoonModuleGroups = this.moduleGroups
      .map(group => {
        return {
          ...group,
          lessonCards: group.lessonCards.filter(card => card.isComingSoon),
        };
      })
      .filter(group => group.lessonCards.length > 0);

    this.moduleNavigationGroups = this.moduleGroups
      .map(group => {
        const visibleLessons = group.lessonCards.filter(
          card => !card.isComingSoon && card.isPublished
        );

        const isPracticeCompleted =
          visibleLessons.length > 0 &&
          this.completedModulePracticeArcIds.has(group.arcId);

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
      this.visibleModuleGroups.length &&
      this._expandedModuleIndices.size === 0
    ) {
      const firstNonSkippedIncompleteIndex = this.visibleModuleGroups.findIndex(
        (_group, index) =>
          !this.skippedModuleIndices.has(index) &&
          !this.isModuleCompleted(index)
      );
      const firstIncompleteIndex = this.visibleModuleGroups.findIndex(
        (_group, index) => !this.isModuleCompleted(index)
      );
      const moduleIndexToExpand =
        firstNonSkippedIncompleteIndex === -1
          ? firstIncompleteIndex
          : firstNonSkippedIncompleteIndex;
      if (moduleIndexToExpand !== -1) {
        this._expandedModuleIndices.add(moduleIndexToExpand);
      }
    }

    this.isMasteryUnlocked = this.isStoryCompleted();
  }

  private maybeShowModuleMasteredModal(): void {
    if (
      this.moduleMasteredModalRef !== null ||
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

    const moduleIndex = this.visibleModuleGroups.findIndex(
      group => group.arcId === masteredArcId
    );

    if (moduleIndex === -1 || !this.areAllLessonsCompleted(moduleIndex)) {
      return;
    }

    this.completedModulePracticeArcIds.add(masteredArcId);
    this.persistMasteredModules();
    this.updateVisibleSections();

    this.hasHandledArcMasteredQueryParams = true;
    this.masteredModuleIndex = moduleIndex;
    this.openModuleMasteredModal();
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
}
