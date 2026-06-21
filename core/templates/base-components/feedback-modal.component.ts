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
 * @fileoverview Modal component that serves as a unified entry point
 * for lesson feedback, lesson issue reporting, and website issue
 * reporting. The displayed UI and submission behavior are configured
 * based on the provided feedback modal type.
 */

import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UserService} from 'services/user.service';
import {FeedbackScreenshotStagingService} from 'domain/feedback/feedback-screenshot-staging.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {PageContextService} from 'services/page-context.service';
import {LearnerAnswerInfoService} from 'pages/exploration-player-page/services/learner-answer-info.service';
import {FeedbackSessionInfoService} from 'services/feedback-session-info.service';
import {TranslateService} from '@ngx-translate/core';
import {
  ReportAnIssueCategory,
  IssueReportModel,
  SendALessonFeedbackModel,
  FeedbackModalType,
  LessonFeedbackMetadata,
} from 'domain/feedback/feedback.model';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {
  InsertScriptService,
  KNOWN_SCRIPTS,
} from 'services/insert-script.service';
import './feedback-modal.component.css';

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'error-callback': () => void;
      'expired-callback': () => void;
    }
  ) => string;
  reset: (widgetId: string) => void;
}

interface TurnstileWindow extends Window {
  turnstile?: TurnstileApi;
}

@Component({
  selector: 'oppia-feedback-modal',
  templateUrl: './feedback-modal.component.html',
})
export class FeedbackModalComponent implements OnInit {
  @Input() feedbackModalType!: FeedbackModalType;
  readonly MAX_REPORT_MESSAGE_LENGTH = 2500;
  @ViewChild('turnstileContainer')
  turnstileContainer!: ElementRef<HTMLDivElement>;
  turnstileWidgetId: string | null = null;
  isUserLoggedIn: boolean = false;
  feedbackText: string = '';
  formError: string | null = null;
  category: ReportAnIssueCategory | null = null;
  showTechnicalLogsCheckbox: boolean = true;
  includeTechnicalLogs: boolean = true;
  screenshotFilename: string | null = null;
  screenshotPreviewDataUrl: string | null = null;
  isUploadingScreenshot: boolean = false;
  screenshotFileError: string | null = null;
  allowedScreenshotImageFormats: string[] = ['png', 'jpg', 'jpeg'];
  maxScreenshotSizeInKB: number = 1024;
  captchaToken: string = '';
  captchaSiteKey: string | null = null;
  captchaLoadError: string | null = null;

  constructor(
    private userService: UserService,
    private windowRef: WindowRef,
    private insertScriptService: InsertScriptService,
    private feedbackScreenshotStagingService: FeedbackScreenshotStagingService,
    private playerPositionService: PlayerPositionService,
    private pageContextService: PageContextService,
    private learnerAnswerInfoService: LearnerAnswerInfoService,
    private feedbackSessionInfoService: FeedbackSessionInfoService,
    private feedbackBackendApiService: FeedbackBackendApiService,
    private ngbActiveModal: NgbActiveModal,
    private translateService: TranslateService
  ) {}

  get isLessonFeedbackMode(): boolean {
    return this.feedbackModalType === FeedbackModalType.LESSON_FEEDBACK;
  }

  get isLessonIssueMode(): boolean {
    return this.feedbackModalType === FeedbackModalType.LESSON_ISSUE;
  }

  get isSiteIssueMode(): boolean {
    return this.feedbackModalType === FeedbackModalType.SITE_ISSUE;
  }

  get shouldShowScreenshotUpload(): boolean {
    return this.isLessonIssueMode || this.isSiteIssueMode;
  }

  get shouldShowCategorySelector(): boolean {
    return this.isLessonIssueMode;
  }

  get shouldShowTechnicalLogs(): boolean {
    return this.showTechnicalLogsCheckbox && !this.isLessonFeedbackMode;
  }

  get title(): string {
    switch (this.feedbackModalType) {
      case FeedbackModalType.LESSON_FEEDBACK:
        return 'I18N_LESSON_FEEDBACK_MODAL_TITLE';

      case FeedbackModalType.LESSON_ISSUE:
        return 'I18N_REPORT_LESSON_BUG_TITLE';

      case FeedbackModalType.SITE_ISSUE:
        return 'I18N_FOOTER_REPORT_WEBSITE_ISSUE';
      default:
        throw new Error('Invalid feedback modal type.');
    }
  }

  get subTitle(): string {
    switch (this.feedbackModalType) {
      case FeedbackModalType.LESSON_FEEDBACK:
        return 'I18N_LESSON_FEEDBACK_MODAL_SUBTITLE';

      case FeedbackModalType.LESSON_ISSUE:
        return 'I18N_REPORT_LESSON_BUG_SUBTITLE';

      case FeedbackModalType.SITE_ISSUE:
        return 'I18N_REPORT_WEBSITE_ISSUE_SUBTITLE';
      default:
        throw new Error('Invalid feedback modal type.');
    }
  }

  get textarePlaceholder(): string {
    switch (this.feedbackModalType) {
      case FeedbackModalType.LESSON_FEEDBACK:
        return 'I18N_LESSON_FEEDBACK_MODAL_TEXTAREA_PLACEHOLDER';

      case FeedbackModalType.LESSON_ISSUE:
        return 'I18N_REPORT_LESSON_BUG_TEXTAREA_PLACEHOLDER';

      case FeedbackModalType.SITE_ISSUE:
        return 'I18N_REPORT_WEBSITE_ISSUE_TEXTAREA_PLACEHOLDER';
      default:
        throw new Error('Invalid feedback modal type.');
    }
  }

  async ngOnInit(): Promise<void> {
    this.showTechnicalLogsCheckbox = true;

    try {
      const userInfo = await this.userService.getUserInfoAsync();
      this.isUserLoggedIn = userInfo.isLoggedIn();
    } catch {
      this.isUserLoggedIn = false;
    }

    if (!this.isLessonFeedbackMode) {
      this.initializeCaptchaIfRequired();
    }
  }

  clearFormError(): void {
    if (this.formError) {
      this.formError = null;
    }
  }

  signIn(): void {
    this.userService.getLoginUrlAsync().then(loginUrl => {
      if (loginUrl) {
        (
          this.windowRef.nativeWindow as {location: string | Location}
        ).location = loginUrl;
      } else {
        this.windowRef.nativeWindow.location.reload();
      }
    });
  }

  selectCategory(category: ReportAnIssueCategory): void {
    this.category = category;

    this.showTechnicalLogsCheckbox =
      category === 'broken_layout_or_image' || category === 'other_or_not_sure';
  }

  onScreenshotFileReceived(file: File): void {
    this.isUploadingScreenshot = true;
    this.removeScreenshot();
    this.feedbackScreenshotStagingService
      .stageScreenshotAsync(file)
      .then(stagedScreenshot => {
        this.screenshotFilename = stagedScreenshot.filename;
        this.screenshotPreviewDataUrl = stagedScreenshot.previewDataUrl;
      })
      .catch(() => {
        this.screenshotFileError = 'I18N_FEEDBACK_SCREENSHOT_UPLOAD_ERROR';
        this.screenshotFilename = null;
        this.screenshotPreviewDataUrl = null;
      })
      .finally(() => {
        this.isUploadingScreenshot = false;
      });
  }

  removeScreenshot(): void {
    if (this.screenshotFilename) {
      this.feedbackScreenshotStagingService.clearStagedScreenshot(
        this.screenshotFilename
      );
    }
    this.screenshotFilename = null;
    this.screenshotPreviewDataUrl = null;
    this.screenshotFileError = null;
  }

  isFormValid(): boolean {
    if (!this.feedbackText.trim()) {
      this.formError = this.translateService.instant(
        'I18N_LESSON_FEEDBACK_DESCRIPTION_REQUIRED'
      );
      return false;
    }

    if (this.feedbackText.length > this.MAX_REPORT_MESSAGE_LENGTH) {
      this.formError = this.translateService.instant(
        'I18N_LESSON_FEEDBACK_MESSAGE_TOO_LONG',
        {
          maxLength: this.MAX_REPORT_MESSAGE_LENGTH,
        }
      );
      return false;
    }

    this.formError = null;
    return true;
  }

  async submit(): Promise<void> {
    switch (this.feedbackModalType) {
      case FeedbackModalType.LESSON_FEEDBACK:
        await this.submitLessonFeedback();
        break;

      case FeedbackModalType.LESSON_ISSUE:
        await this.submitLessonIssue();
        break;

      case FeedbackModalType.SITE_ISSUE:
        await this.submitSiteIssue();
        break;
    }
  }

  private getLessonFeedbackMetadata(): LessonFeedbackMetadata {
    const lessonFeedbackMetadata = {
      explorationId: this.pageContextService.getExplorationId(),
      explorationVersion: this.pageContextService.getExplorationVersion() ?? 0,
      stateName: this.playerPositionService.getCurrentStateName(),
      stateIndex: this.playerPositionService.getDisplayedCardIndex(),
      learnerCurrentAnswer: this.learnerAnswerInfoService.getCurrentAnswer(),
    };
    return lessonFeedbackMetadata;
  }

  private async submitLessonIssue(): Promise<void> {
    if (!this.isFormValid()) {
      return;
    }
    const lessonFeedbackMetadata = this.getLessonFeedbackMetadata();
    const sessionInfo = this.includeTechnicalLogs
      ? this.feedbackSessionInfoService.getSessionInfo()
      : null;

    const feedbackPayload = IssueReportModel.createForSubmission({
      source: 'lesson',
      reportMessage: this.feedbackText,
      explorationContext: {
        explorationId: lessonFeedbackMetadata.explorationId,
        explorationVersion: lessonFeedbackMetadata.explorationVersion,
        stateName: lessonFeedbackMetadata.stateName,
        stateIndex: lessonFeedbackMetadata.stateIndex,
        learnerCurrentAnswer: lessonFeedbackMetadata.learnerCurrentAnswer,
      },
      category: this.category,
      includeTechnicalLogs: this.includeTechnicalLogs,
      sessionInfo: sessionInfo,
      screenshotFilename: this.screenshotFilename,
    });

    try {
      await this.feedbackBackendApiService.submitSiteAndLessonIssueReportAsync(
        feedbackPayload,
        this.captchaToken
      );
      // Show success toast.
    } catch (error) {
      // Show error toast.
      console.error('Failed to submit Lesson issue report', error);
      return;
    }
    this.closeModal();
  }

  private async submitLessonFeedback(): Promise<void> {
    if (!this.isFormValid()) {
      return;
    }

    const lessonFeedbackMetadata = this.getLessonFeedbackMetadata();
    const feedbackPayload = SendALessonFeedbackModel.createForSubmission({
      feedbackText: this.feedbackText,
      exploration_context: {
        explorationId: lessonFeedbackMetadata.explorationId,
        explorationVersion: lessonFeedbackMetadata.explorationVersion,
        stateName: lessonFeedbackMetadata.stateName,
        stateIndex: lessonFeedbackMetadata.stateIndex,
        learnerCurrentAnswer: lessonFeedbackMetadata.learnerCurrentAnswer,
      },
    });

    try {
      await this.feedbackBackendApiService.submitLessonFeedbackAsync(
        feedbackPayload,
        this.captchaToken
      );
      // Show success toast.
    } catch (error) {
      // Show error toast.
      console.error('Failed to submit Lesson Feedback', error);
      return;
    }
    this.closeModal();
  }

  private async submitSiteIssue(): Promise<void> {
    if (!this.isFormValid()) {
      return;
    }
    const sessionInfo = this.includeTechnicalLogs
      ? this.feedbackSessionInfoService.getSessionInfo()
      : null;

    const feedbackPayload = IssueReportModel.createForSubmission({
      source: 'site',
      reportMessage: this.feedbackText,
      explorationContext: null,
      category: null,
      includeTechnicalLogs: this.includeTechnicalLogs,
      sessionInfo: sessionInfo,
      screenshotFilename: this.screenshotFilename,
    });

    try {
      await this.feedbackBackendApiService.submitSiteAndLessonIssueReportAsync(
        feedbackPayload,
        this.captchaToken
      );
      // Show success toast.
    } catch (error) {
      // Show error toast.
      console.error('Failed to submit site issue report', error);
      return;
    }
    this.closeModal();
  }

  initializeCaptchaIfRequired(): void {
    if (this.isUserLoggedIn) {
      return;
    }
    this.feedbackBackendApiService
      .fetchCaptchaConfigAsync()
      .then(config => {
        this.captchaSiteKey = config.site_key;
        if (!this.captchaSiteKey) {
          this.captchaLoadError =
            'Captcha is currently unavailable. Please Login to submit feedback.';
          return;
        }
        this.insertScriptService.loadScript(KNOWN_SCRIPTS.TURNSTILE, () => {
          this.renderTurnstile();
        });
      })
      .catch(() => {
        this.captchaLoadError =
          'Captcha is currently unavailable, Please Login to submit feedback.';
      });
  }

  renderTurnstile(): void {
    if (
      this.turnstileWidgetId ||
      !this.captchaSiteKey ||
      !this.turnstileContainer
    ) {
      return;
    }
    const turnstileWindow = this.windowRef.nativeWindow as TurnstileWindow;
    if (!turnstileWindow.turnstile) {
      this.captchaLoadError = 'Captcha failed to load.';
      return;
    }
    this.turnstileWidgetId = turnstileWindow.turnstile.render(
      this.turnstileContainer.nativeElement,
      {
        sitekey: this.captchaSiteKey,
        callback: (token: string) => {
          this.captchaToken = token;
          this.captchaLoadError = null;
        },
        'error-callback': () => {
          this.captchaToken = '';
          this.captchaLoadError = 'Captcha failed to load.';
        },
        'expired-callback': () => {
          this.captchaToken = '';
        },
      }
    );
  }

  closeModal(): void {
    this.feedbackText = '';
    this.category = null;
    this.includeTechnicalLogs = true;
    this.formError = null;
    this.removeScreenshot();
    this.ngbActiveModal.dismiss();
  }
}
