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
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {TopicSessionFallbackLanguageService} from 'pages/topic-viewer-page/services/topic-session-fallback-language.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';

import './topic-lesson-card.component.css';

const FALLBACK_THUMBNAIL_IMAGE_PATH = '/splash/student_desk1x.webp';
const CHECKPOINT_STATUS_COMPLETED = 'completed';
const CHECKPOINT_STATUS_IN_PROGRESS = 'in-progress';
const CHECKPOINT_STATUS_INCOMPLETE = 'incomplete';

@Component({
  selector: 'topic-lesson-card',
  templateUrl: './topic-lesson-card.component.html',
  styleUrls: ['./topic-lesson-card.component.css'],
})
export class TopicLessonCardComponent implements OnInit, OnChanges {
  @Input() lessonTitle: string = '';
  @Input() lessonDescription: string = '';
  @Input() thumbnailUrl: string = '';
  @Input() startUrl: string = '';
  @Input() lessonProgressStatus:
    | 'not_started'
    | 'in_progress'
    | 'completed'
    | 'coming_soon' = 'not_started';
  @Input() totalCheckpointsCount: number = 0;
  @Input() visitedCheckpointsCount: number = 0;
  @Input() availableTextLanguageCodes: string[] = [];
  @Input() availableVoiceoverLanguageCodes: string[] = [];

  resolvedThumbnailUrl: string = '';
  _checkpointStatuses: string[] = [];
  selectedTextLanguageCode: string | null = null;
  selectedVoiceoverLanguageCode: string | null = null;

  private readonly INITIAL_CONTENT_LANGUAGE_CODE_URL_PARAM =
    'initialContentLanguageCode';
  private readonly INITIAL_VOICEOVER_LANGUAGE_CODE_URL_PARAM =
    'initialVoiceoverLanguageCode';

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
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.lessonProgressStatus ||
      changes.totalCheckpointsCount ||
      changes.visitedCheckpointsCount
    ) {
      this._checkpointStatuses = this._computeCheckpointStatuses();
    }

    if (
      changes.availableTextLanguageCodes ||
      changes.availableVoiceoverLanguageCodes
    ) {
      this.initializeLanguageSelection();
    }
  }

  get checkpointStatuses(): string[] {
    return this._checkpointStatuses;
  }

  private _computeCheckpointStatuses(): string[] {
    if (
      this.lessonProgressStatus === 'coming_soon' ||
      this.totalCheckpointsCount === 0
    ) {
      return [];
    }

    const totalNodes = this.totalCheckpointsCount + 1;
    const statuses: string[] = [];
    const visitedCheckpointCount = Math.min(
      Math.max(this.visitedCheckpointsCount, 0),
      this.totalCheckpointsCount
    );

    const reachedCheckpointCount = Math.max(visitedCheckpointCount - 1, 0);

    if (
      this.lessonProgressStatus === 'completed' ||
      visitedCheckpointCount >= this.totalCheckpointsCount
    ) {
      for (let i = 0; i < totalNodes; i++) {
        statuses.push(CHECKPOINT_STATUS_COMPLETED);
      }
      return statuses;
    }

    const currentNodeIndex = reachedCheckpointCount;

    for (let i = 0; i < totalNodes; i++) {
      if (i < currentNodeIndex) {
        statuses.push(CHECKPOINT_STATUS_COMPLETED);
      } else if (i === currentNodeIndex) {
        statuses.push(CHECKPOINT_STATUS_IN_PROGRESS);
      } else {
        statuses.push(CHECKPOINT_STATUS_INCOMPLETE);
      }
    }

    return statuses;
  }

  get progressPercent(): number {
    if (
      this.totalCheckpointsCount === 0 ||
      this.lessonProgressStatus === 'coming_soon'
    ) {
      return 0;
    }
    const visitedCheckpointCount = Math.min(
      Math.max(this.visitedCheckpointsCount, 0),
      this.totalCheckpointsCount
    );
    if (
      this.lessonProgressStatus === 'completed' ||
      visitedCheckpointCount >= this.totalCheckpointsCount
    ) {
      return 100;
    }
    const reachedCheckpointCount = Math.max(visitedCheckpointCount - 1, 0);
    return Math.floor(
      (reachedCheckpointCount / this.totalCheckpointsCount) * 100
    );
  }

  get showCheckpointBar(): boolean {
    return (
      this.lessonProgressStatus !== 'coming_soon' &&
      this.totalCheckpointsCount > 0
    );
  }

  navigateTo(url: string): void {
    if (url) {
      this.windowRef.nativeWindow.location.assign(url);
    }
  }

  onStartButtonClick(): void {
    if (!this.startUrl) {
      return;
    }

    if (!this.shouldShowFallbackCta() || !this.selectedTextLanguageCode) {
      this.navigateTo(this.startUrl);
      return;
    }

    this.navigateTo(
      this.getLessonStartUrlWithLanguageSelection(
        this.selectedTextLanguageCode,
        this.selectedVoiceoverLanguageCode
      )
    );
  }

  onSelectedTextLanguageCodeChange(newLanguageCode: string | null): void {
    this.selectedTextLanguageCode = newLanguageCode;
    if (
      !this.selectedVoiceoverLanguageCode &&
      newLanguageCode &&
      this.availableVoiceoverLanguageCodes.includes(newLanguageCode)
    ) {
      this.selectedVoiceoverLanguageCode = newLanguageCode;
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

  getStartButtonLabel(): string {
    if (!this.shouldShowFallbackCta()) {
      return '';
    }

    const languageDescription = this.getLanguageDescription(
      this.selectedTextLanguageCode as string
    );
    if (this.getPreferredLanguageCode().startsWith('pt')) {
      return (
        'Jogar Li\u00e7\u00e3o em ' + languageDescription + ' \uD83C\uDF10'
      );
    }

    return 'Play Lesson in ' + languageDescription + ' \uD83C\uDF10';
  }

  shouldShowFallbackCta(): boolean {
    return (
      !!this.selectedTextLanguageCode &&
      this.selectedTextLanguageCode !== this.getPreferredLanguageCode()
    );
  }

  getFallbackInfoTooltipText(): string {
    const selectedLanguageDescription = this.getLanguageDescription(
      this.selectedTextLanguageCode || 'en'
    );

    if (this.isLessonUnavailableInPreferredLanguage()) {
      if (this.getPreferredLanguageCode().startsWith('pt')) {
        return (
          'Esta hist\u00f3ria ainda est\u00e1 em ' +
          selectedLanguageDescription +
          ', mas voc\u00ea ainda pode jog\u00e1-la!'
        );
      }
      return (
        'This story is still in ' +
        selectedLanguageDescription +
        ', but you can still play it!'
      );
    }

    if (this.getPreferredLanguageCode().startsWith('pt')) {
      return (
        'A hist\u00f3ria ser\u00e1 reproduzida em ' +
        selectedLanguageDescription +
        '.'
      );
    }

    return 'The story will be played in ' + selectedLanguageDescription + '.';
  }

  getThumbnailAltText(): string {
    return this.lessonTitle
      ? 'Lesson thumbnail for ' + this.lessonTitle
      : 'Lesson thumbnail';
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
    if (this.availableTextLanguageCodes.includes('en')) {
      return 'en';
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

    if (
      selectedTextLanguageCode &&
      this.availableVoiceoverLanguageCodes.includes(selectedTextLanguageCode)
    ) {
      return selectedTextLanguageCode;
    }

    if (this.availableVoiceoverLanguageCodes.includes('en')) {
      return 'en';
    }

    return this.availableVoiceoverLanguageCodes[0];
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
      this.INITIAL_CONTENT_LANGUAGE_CODE_URL_PARAM,
      textLanguageCode
    );

    if (voiceoverLanguageCode) {
      lessonStartUrl.searchParams.set(
        this.INITIAL_VOICEOVER_LANGUAGE_CODE_URL_PARAM,
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
}
