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

import {Component, Input, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {LanguageSelectorModalComponent} from 'pages/topic-viewer-page/modals/language-selector-modal.component';
import {TopicSessionFallbackLanguageService} from 'pages/topic-viewer-page/services/topic-session-fallback-language.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {WindowRef} from 'services/contextual/window-ref.service';

import './topic-lesson-card.component.css';

const FALLBACK_THUMBNAIL_IMAGE_PATH = '/splash/student_desk1x.webp';

@Component({
  selector: 'topic-lesson-card',
  templateUrl: './topic-lesson-card.component.html',
  styleUrls: ['./topic-lesson-card.component.css'],
})
export class TopicLessonCardComponent implements OnInit {
  @Input() lessonTitle: string = '';
  @Input() lessonDescription: string = '';
  @Input() thumbnailUrl: string = '';
  @Input() startUrl: string = '';
  @Input() availableTextLanguageCodes: string[] = [];
  @Input() availableVoiceoverLanguageCodes: string[] = [];

  resolvedThumbnailUrl: string = '';
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
    private ngbModal: NgbModal,
    private topicSessionFallbackLanguageService: TopicSessionFallbackLanguageService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.resolvedThumbnailUrl =
      this.thumbnailUrl || this.getFallbackThumbnailUrl();
    this.initializeFallbackLanguageSelection();
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

    if (!this.isLessonUnavailableInPreferredLanguage()) {
      this.navigateTo(this.startUrl);
      return;
    }

    if (this.selectedTextLanguageCode) {
      this.saveSessionFallbackLanguageSelection();
      this.navigateTo(
        this.getLessonStartUrlWithLanguageSelection(
          this.selectedTextLanguageCode,
          this.selectedVoiceoverLanguageCode
        )
      );
      return;
    }

    this.openLanguageSelectionModal();
  }

  isLessonUnavailableInPreferredLanguage(): boolean {
    if (!this.availableTextLanguageCodes.length) {
      return false;
    }
    const preferredLanguageCode = this.getPreferredLanguageCode();
    return !this.availableTextLanguageCodes.includes(preferredLanguageCode);
  }

  getFallbackInfoTooltipText(): string {
    const preferredLanguageDescription = this.getLanguageDescription(
      this.getPreferredLanguageCode()
    );
    return (
      'This lesson is not available in ' +
      preferredLanguageDescription +
      '. Choose another language to continue.'
    );
  }

  onSelectedTextLanguageCodeChange(newLanguageCode: string | null): void {
    this.selectedTextLanguageCode = newLanguageCode;
    this.saveSessionFallbackLanguageSelection();
  }

  onSelectedVoiceoverLanguageCodeChange(newLanguageCode: string | null): void {
    this.selectedVoiceoverLanguageCode = newLanguageCode;
    this.saveSessionFallbackLanguageSelection();
  }

  getLanguageDescription(languageCode: string): string {
    return (
      this.languageUtilService.getContentLanguageDescription(languageCode) ||
      this.languageUtilService.getAudioLanguageDescription(languageCode) ||
      languageCode
    );
  }

  getThumbnailAltText(): string {
    return this.lessonTitle
      ? 'Lesson thumbnail for ' + this.lessonTitle
      : 'Lesson thumbnail';
  }

  private getFallbackThumbnailUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      FALLBACK_THUMBNAIL_IMAGE_PATH
    );
  }

  private getPreferredLanguageCode(): string {
    return this.i18nLanguageCodeService.getCurrentI18nLanguageCode();
  }

  private initializeFallbackLanguageSelection(): void {
    if (!this.isLessonUnavailableInPreferredLanguage()) {
      this.selectedTextLanguageCode = null;
      this.selectedVoiceoverLanguageCode = null;
      return;
    }

    const preferredLanguageCode = this.getPreferredLanguageCode();
    const sessionFallbackSelection =
      this.topicSessionFallbackLanguageService.getFallbackSelection(
        preferredLanguageCode
      );

    this.selectedTextLanguageCode = this.getInitialTextLanguageCode(
      sessionFallbackSelection?.textLanguageCode || null
    );
    this.selectedVoiceoverLanguageCode = this.getInitialVoiceoverLanguageCode(
      sessionFallbackSelection?.voiceoverLanguageCode || null
    );

    this.saveSessionFallbackLanguageSelection();
  }

  private getInitialTextLanguageCode(
    sessionFallbackTextLanguageCode: string | null
  ): string | null {
    if (!this.availableTextLanguageCodes.length) {
      return null;
    }

    if (
      sessionFallbackTextLanguageCode &&
      this.availableTextLanguageCodes.includes(sessionFallbackTextLanguageCode)
    ) {
      return sessionFallbackTextLanguageCode;
    }

    if (this.availableTextLanguageCodes.includes('en')) {
      return 'en';
    }

    return this.availableTextLanguageCodes[0];
  }

  private getInitialVoiceoverLanguageCode(
    sessionFallbackVoiceoverLanguageCode: string | null
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

    if (this.availableVoiceoverLanguageCodes.includes('en')) {
      return 'en';
    }

    return this.availableVoiceoverLanguageCodes[0];
  }

  private saveSessionFallbackLanguageSelection(): void {
    if (!this.isLessonUnavailableInPreferredLanguage()) {
      return;
    }

    if (!this.selectedTextLanguageCode) {
      return;
    }

    this.topicSessionFallbackLanguageService.saveFallbackSelection(
      this.getPreferredLanguageCode(),
      this.selectedTextLanguageCode,
      this.selectedVoiceoverLanguageCode
    );
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

  private openLanguageSelectionModal(): void {
    const modalRef = this.ngbModal.open(LanguageSelectorModalComponent, {
      backdrop: 'static',
      centered: true,
    });

    modalRef.componentInstance.preferredLanguageCode =
      this.getPreferredLanguageCode();
    modalRef.componentInstance.availableTextLanguageCodes =
      this.availableTextLanguageCodes;
    modalRef.componentInstance.availableVoiceoverLanguageCodes =
      this.availableVoiceoverLanguageCodes;
    modalRef.componentInstance.selectedTextLanguageCode =
      this.selectedTextLanguageCode;
    modalRef.componentInstance.selectedVoiceoverLanguageCode =
      this.selectedVoiceoverLanguageCode;

    modalRef.result.then(
      (result: {
        selectedTextLanguageCode: string;
        selectedVoiceoverLanguageCode: string | null;
      }) => {
        this.selectedTextLanguageCode = result.selectedTextLanguageCode;
        this.selectedVoiceoverLanguageCode =
          result.selectedVoiceoverLanguageCode;
        this.saveSessionFallbackLanguageSelection();
        this.navigateTo(
          this.getLessonStartUrlWithLanguageSelection(
            this.selectedTextLanguageCode,
            this.selectedVoiceoverLanguageCode
          )
        );
      },
      () => {}
    );
  }
}
