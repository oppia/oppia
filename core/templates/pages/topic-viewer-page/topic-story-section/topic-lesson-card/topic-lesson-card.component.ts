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
 * @fileoverview Lesson card component used in the redesigned topic viewer story section.
 */

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {TopicSessionFallbackLanguageService} from 'pages/topic-viewer-page/services/topic-session-fallback-language.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {AppConstants} from 'app.constants';
import './topic-lesson-card.component.css';

const FALLBACK_THUMBNAIL_IMAGE_PATH = '/splash/student_desk1x.webp';
const INITIAL_CONTENT_LANGUAGE_CODE_URL_PARAM = 'initialContentLanguageCode';
const INITIAL_VOICEOVER_LANGUAGE_CODE_URL_PARAM =
  'initialVoiceoverLanguageCode';
const LESSON_THUMBNAIL_ALT_TEXT_PREFIX = 'Lesson thumbnail for ';
const DEFAULT_LESSON_THUMBNAIL_ALT_TEXT = 'Lesson thumbnail';
const STORY_NOT_IN_PREFERRED_LANGUAGE_MESSAGE_PREFIX =
  'This story is still in ';
const STORY_NOT_IN_PREFERRED_LANGUAGE_MESSAGE_SUFFIX =
  ', but you can still play it!';
const STORY_PLAYBACK_LANGUAGE_MESSAGE_PREFIX = 'The story will be played in ';

export type LessonProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'coming_soon';

@Component({
  selector: 'topic-lesson-card',
  templateUrl: './topic-lesson-card.component.html',
  styleUrls: ['./topic-lesson-card.component.css'],
})
export class TopicLessonCardComponent implements OnInit, OnChanges {
  @Input() lessonNumber: number = 1;
  @Input() lessonTitle: string = '';
  @Input() lessonDescription: string = '';
  @Input() thumbnailUrl: string = '';
  @Input() startUrl: string = '';
  @Input() studyUrl: string = '';
  @Input() practiceUrl: string = '';
  @Input() hasPracticeQuestions: boolean = false;
  @Input() moduleAccentColor: string = '#00645c';
  @Input() isActiveLesson: boolean = false;
  @Input() lessonProgressStatus: LessonProgressStatus = 'not_started';
  @Input() availableTextLanguageCodes: string[] = [];
  @Input() availableVoiceoverLanguageCodes: string[] = [];
  @Input() availableVoiceoverLanguageAccentDescriptions: {
    [accentCode: string]: string;
  } = {};
  @Input() isNewLessonLabelVisible: boolean = false;
  @Input() isComingSoonSectionCard: boolean = false;
  @Input() navigatedLessonNumber: number | null = null;
  @Output() startLessonClick = new EventEmitter<{
    lessonNumber: number;
    startUrl: string;
  }>();

  resolvedThumbnailUrl: string = '';
  selectedTextLanguageCode: string | null = null;
  selectedVoiceoverLanguageCode: string | null = null;
  isExpanded: boolean = false;
  private previousLessonProgressStatus: LessonProgressStatus = 'not_started';

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private languageUtilService: LanguageUtilService,
    private topicSessionFallbackLanguageService: TopicSessionFallbackLanguageService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.resolvedThumbnailUrl =
      this.thumbnailUrl || this.getFallbackThumbnailUrl();
    this.initializeLanguageSelection();
    // Expand the active (next) lesson, the navigated lesson, or the first
    // lesson by default so that the next chapter is already expanded.
    this.isExpanded =
      !this.isComingSoonSectionCard &&
      (this.isActiveLesson ||
        this.navigatedLessonNumber === this.lessonNumber ||
        (this.lessonNumber === 1 && this.lessonProgressStatus !== 'completed'));
    this.previousLessonProgressStatus = this.lessonProgressStatus;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.availableTextLanguageCodes ||
      changes.availableVoiceoverLanguageCodes
    ) {
      this.initializeLanguageSelection();
    }
    if (changes.navigatedLessonNumber) {
      // Auto-expand this lesson if it's the navigated lesson from the navbar.
      if (
        !this.isComingSoonSectionCard &&
        this.navigatedLessonNumber === this.lessonNumber
      ) {
        this.isExpanded = true;
      }
    }

    if (changes.lessonProgressStatus) {
      const currentStatus = changes.lessonProgressStatus
        .currentValue as LessonProgressStatus;
      if (
        currentStatus === 'completed' &&
        this.previousLessonProgressStatus !== 'completed' &&
        !this.isComingSoonSectionCard
      ) {
        this.isExpanded = false;
      }
      this.previousLessonProgressStatus = currentStatus;
    }
  }

  get isComingSoonLesson(): boolean {
    return this.lessonProgressStatus === 'coming_soon';
  }

  get isCompletedLesson(): boolean {
    return this.lessonProgressStatus === 'completed';
  }

  navigateTo(url: string): void {
    if (url) {
      this.windowRef.nativeWindow.location.assign(url);
    }
  }

  onStartButtonClick(): void {
    if (!this.startUrl || this.isComingSoonLesson) {
      return;
    }

    const resolvedUrl = this.selectedTextLanguageCode
      ? this.getLessonStartUrlWithLanguageSelection(
          this.selectedTextLanguageCode,
          this.selectedVoiceoverLanguageCode
        )
      : this.startUrl;

    this.startLessonClick.emit({
      lessonNumber: this.lessonNumber,
      startUrl: resolvedUrl,
    });
  }

  onPracticeButtonClick(): void {
    if (this.isComingSoonLesson || !this.hasPracticeQuestions) {
      return;
    }
    this.navigateTo(this.practiceUrl);
  }

  onStudyButtonClick(): void {
    if (this.isComingSoonLesson) {
      return;
    }
    this.navigateTo(this.studyUrl || this.startUrl);
  }

  toggleExpanded(): void {
    if (this.isComingSoonSectionCard) {
      return;
    }
    this.isExpanded = !this.isExpanded;
  }

  onPlayAgainClick(): void {
    if (!this.startUrl || this.isComingSoonLesson) {
      return;
    }

    const resolvedUrl = this.selectedTextLanguageCode
      ? this.getLessonStartUrlWithLanguageSelection(
          this.selectedTextLanguageCode,
          this.selectedVoiceoverLanguageCode
        )
      : this.startUrl;

    const separator = resolvedUrl.includes('?') ? '&' : '?';
    const restartUrl = `${resolvedUrl}${separator}restart=1`;
    this.startLessonClick.emit({
      lessonNumber: this.lessonNumber,
      startUrl: restartUrl,
    });
  }

  onSelectedTextLanguageCodeChange(newLanguageCode: string | null): void {
    this.selectedTextLanguageCode = newLanguageCode;
    if (!this.selectedVoiceoverLanguageCode && newLanguageCode) {
      const compatibleVoiceover = this.availableVoiceoverLanguageCodes.find(
        code =>
          this.isVoiceoverCompatibleWithTextLanguage(code, newLanguageCode)
      );
      if (compatibleVoiceover) {
        this.selectedVoiceoverLanguageCode = compatibleVoiceover;
      }
    }
    this.saveSessionFallbackLanguageSelection();
  }

  onSelectedVoiceoverLanguageCodeChange(newLanguageCode: string | null): void {
    this.selectedVoiceoverLanguageCode = newLanguageCode;
    this.saveSessionFallbackLanguageSelection();
  }

  isLessonUnavailableInPreferredLanguage(): boolean {
    if (!this.availableTextLanguageCodes.length) {
      return false;
    }
    return !this.availableTextLanguageCodes.includes(
      this.getPreferredLanguageCode()
    );
  }

  get shouldShowInfoIcon(): boolean {
    return this.availableTextLanguageCodes.some(
      code => code !== AppConstants.DEFAULT_LANGUAGE_CODE
    );
  }

  shouldShowFallbackCta(): boolean {
    return !!this.selectedTextLanguageCode;
  }

  getFallbackInfoTooltipText(): string {
    const selectedLanguageDescription = this.getLanguageDescription(
      this.selectedTextLanguageCode || AppConstants.DEFAULT_LANGUAGE_CODE
    );

    if (this.isLessonUnavailableInPreferredLanguage()) {
      return (
        STORY_NOT_IN_PREFERRED_LANGUAGE_MESSAGE_PREFIX +
        selectedLanguageDescription +
        STORY_NOT_IN_PREFERRED_LANGUAGE_MESSAGE_SUFFIX
      );
    }

    return (
      STORY_PLAYBACK_LANGUAGE_MESSAGE_PREFIX + selectedLanguageDescription + '.'
    );
  }

  getThumbnailAltText(): string {
    return this.lessonTitle
      ? LESSON_THUMBNAIL_ALT_TEXT_PREFIX + this.lessonTitle
      : DEFAULT_LESSON_THUMBNAIL_ALT_TEXT;
  }

  private initializeLanguageSelection(): void {
    if (!this.availableTextLanguageCodes.length) {
      this.selectedTextLanguageCode = null;
      this.selectedVoiceoverLanguageCode = null;
      return;
    }

    const preferredLanguageCode = this.getPreferredLanguageCode();
    if (this.availableTextLanguageCodes.includes(preferredLanguageCode)) {
      this.selectedTextLanguageCode = preferredLanguageCode;
      this.selectedVoiceoverLanguageCode = this.getInitialVoiceoverLanguageCode(
        null,
        preferredLanguageCode
      );
      return;
    }

    const sessionFallbackSelection =
      this.topicSessionFallbackLanguageService.getFallbackSelection();

    if (
      sessionFallbackSelection?.textLanguageCode &&
      this.availableTextLanguageCodes.includes(
        sessionFallbackSelection.textLanguageCode
      )
    ) {
      this.selectedTextLanguageCode = sessionFallbackSelection.textLanguageCode;
      this.selectedVoiceoverLanguageCode = this.getInitialVoiceoverLanguageCode(
        sessionFallbackSelection.voiceoverLanguageCode,
        sessionFallbackSelection.textLanguageCode
      );
      return;
    }

    this.selectedTextLanguageCode = this.getFallbackTextLanguageCode();
    this.selectedVoiceoverLanguageCode = this.getInitialVoiceoverLanguageCode(
      null,
      this.selectedTextLanguageCode
    );
  }

  private getFallbackTextLanguageCode(): string {
    if (
      this.availableTextLanguageCodes.includes(
        AppConstants.DEFAULT_LANGUAGE_CODE
      )
    ) {
      return AppConstants.DEFAULT_LANGUAGE_CODE;
    }
    return this.availableTextLanguageCodes[0];
  }

  private getInitialVoiceoverLanguageCode(
    sessionFallbackVoiceoverLanguageCode: string | null,
    selectedTextLanguageCode: string | null
  ): string | null {
    if (!this.availableVoiceoverLanguageCodes.length) {
      return null;
    }

    if (
      sessionFallbackVoiceoverLanguageCode &&
      this.availableVoiceoverLanguageCodes.includes(
        sessionFallbackVoiceoverLanguageCode
      )
    ) {
      return sessionFallbackVoiceoverLanguageCode;
    }

    if (selectedTextLanguageCode) {
      const compatibleVoiceover = this.availableVoiceoverLanguageCodes.find(
        code =>
          this.isVoiceoverCompatibleWithTextLanguage(
            code,
            selectedTextLanguageCode
          )
      );
      if (compatibleVoiceover) {
        return compatibleVoiceover;
      }
    }

    if (
      this.availableVoiceoverLanguageCodes.includes(
        AppConstants.DEFAULT_LANGUAGE_CODE
      )
    ) {
      return AppConstants.DEFAULT_LANGUAGE_CODE;
    }

    return this.availableVoiceoverLanguageCodes[0];
  }

  private isVoiceoverCompatibleWithTextLanguage(
    voiceoverCode: string,
    textLanguageCode: string
  ): boolean {
    const textRootCode = textLanguageCode.split(/[-_]/)[0].toLowerCase();
    const voiceoverRootCode = voiceoverCode.split(/[-_]/)[0].toLowerCase();

    if (voiceoverRootCode === textRootCode) {
      return true;
    }

    try {
      const relatedCodes = this.languageUtilService
        .getLanguageCodesRelatedToAudioLanguageCode(voiceoverCode)
        .map(code => code.split(/[-_]/)[0].toLowerCase());
      return relatedCodes.includes(textRootCode);
    } catch {
      return false;
    }
  }

  private saveSessionFallbackLanguageSelection(): void {
    if (!this.selectedTextLanguageCode) {
      return;
    }

    this.topicSessionFallbackLanguageService.saveFallbackSelection(
      this.selectedTextLanguageCode,
      this.selectedVoiceoverLanguageCode
    );
  }

  private getLanguageDescription(languageCode: string): string {
    return (
      this.languageUtilService.getContentLanguageDescription(languageCode) ||
      this.languageUtilService.getAudioLanguageDescription(languageCode) ||
      languageCode
    );
  }

  private getPreferredLanguageCode(): string {
    return this.i18nLanguageCodeService.getCurrentI18nLanguageCode();
  }

  private getLessonStartUrlWithLanguageSelection(
    textLanguageCode: string,
    voiceoverLanguageCode: string | null
  ): string {
    const lessonStartUrl = new URL(
      this.startUrl,
      this.windowRef.nativeWindow.location.origin
    );

    lessonStartUrl.searchParams.set(
      INITIAL_CONTENT_LANGUAGE_CODE_URL_PARAM,
      textLanguageCode
    );

    if (voiceoverLanguageCode) {
      lessonStartUrl.searchParams.set(
        INITIAL_VOICEOVER_LANGUAGE_CODE_URL_PARAM,
        voiceoverLanguageCode
      );
    }

    return lessonStartUrl.toString();
  }

  private getFallbackThumbnailUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      FALLBACK_THUMBNAIL_IMAGE_PATH
    );
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }
}
