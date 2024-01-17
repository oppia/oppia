// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for translation suggestion review modal.
 */

import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { ContributionAndReviewService } from '../services/contribution-and-review.service';
import { ContributionOpportunitiesService } from '../services/contribution-opportunities.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { ThreadDataBackendApiService } from 'pages/exploration-editor-page/feedback-tab/services/thread-data-backend-api.service';
import { UserService } from 'services/user.service';
import { ValidatorsService } from 'services/validators.service';
import { ThreadMessage } from 'domain/feedback_message/ThreadMessage.model';
import { AppConstants } from 'app.constants';
import { ListSchema, UnicodeSchema } from 'services/schema-default-value.service';
import { UserContributionRightsDataBackendDict } from 'services/user-backend-api.service';
// This throws "TS2307". We need to
// suppress this error because rte-output-display is not strictly typed yet.
// @ts-ignore
import { RteOutputDisplayComponent } from 'rich_text_components/rte-output-display.component';

interface HTMLSchema {
  'type': string;
}

interface EditedContentDict {
  'html': string;
}

interface ActiveContributionDetailsDict {
  'chapter_title': string;
  'story_title': string;
  'topic_name': string;
}

interface SuggestionChangeDict {
  'cmd': string;
  'content_html': string | string[];
  'content_id': string;
  'data_format': string;
  'language_code': string;
  'state_name': string;
  'translation_html': string;
}

interface ActiveSuggestionDict {
  'author_name': string;
  'change_cmd': SuggestionChangeDict;
  'exploration_content_html': string | string[] | null;
  'language_code': string;
  'last_updated_msecs': number;
  'status': string;
  'suggestion_id': string;
  'suggestion_type': string;
  'target_id': string;
  'target_type': string;
}

// Details are null if suggestion's corresponding opportunity is deleted.
// See issue #14234.
export interface ActiveContributionDict {
  'details': ActiveContributionDetailsDict | null;
  'suggestion': ActiveSuggestionDict;
}

enum ExpansionTabType {
  CONTENT,
  TRANSLATION
}

@Component({
  selector: 'oppia-translation-suggestion-review-modal',
  templateUrl: './translation-suggestion-review-modal.component.html',
})

export class TranslationSuggestionReviewModalComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  activeContribution!: ActiveContributionDict;
  authorName!: string;
  activeSuggestion!: ActiveSuggestionDict;
  activeSuggestionId!: string;
  contentHtml!: string | string[];
  editedContent!: EditedContentDict;
  errorMessage!: string;
  explorationContentHtml!: string | string[] | null;
  finalCommitMessage!: string;
  initialSuggestionId!: string;
  languageCode!: string;
  languageDescription!: string;
  preEditTranslationHtml!: string;
  remainingContributionIds!: string[];
  skippedContributionIds: string[] = [];
  allContributions!: Record<string, ActiveContributionDict>;
  isLastItem!: boolean;
  isFirstItem: boolean = true;
  reviewMessage!: string;
  reviewer!: string;
  status!: string;
  heading: string = 'Your Translation Contributions';
  subheading!: string;
  suggestionIdToContribution!: Record<string, ActiveContributionDict>;
  translationHtml!: string;
  userCanReviewTranslationSuggestionsInLanguages!: string[];
  username!: string;
  resolvedSuggestionIds: string[] = [];
  errorFound: boolean = false;
  contentTypeIsHtml: boolean = false;
  contentTypeIsSetOfStrings: boolean = false;
  contentTypeIsUnicode: boolean = false;
  lastSuggestionToReview: boolean = false;
  firstSuggestionToReview: boolean = true;
  resolvingSuggestion: boolean = false;
  reviewable: boolean = false;
  canEditTranslation: boolean = false;
  userIsCurriculumAdmin: boolean = false;
  isContentExpanded: boolean = false;
  isContentOverflowing: boolean = false;
  isTranslationExpanded: boolean = false;
  isTranslationOverflowing: boolean = false;
  explorationImagesString: string = '';
  suggestionImagesString: string = '';
  @Input() altTextIsDisplayed: boolean = false;

  @ViewChild('contentPanel')
    contentPanel!: RteOutputDisplayComponent;

  @ViewChild('translationPanel')
    translationPanel!: RteOutputDisplayComponent;

  @ViewChild('contentContainer')
    contentContainer!: ElementRef;

  @ViewChild('translationContainer')
    translationContainer!: ElementRef;

  @ViewChild('contentPanelWithAltText')
    contentPanelWithAltText!: RteOutputDisplayComponent;

  HTML_SCHEMA: HTMLSchema = { type: 'html' };
  MAX_REVIEW_MESSAGE_LENGTH = AppConstants.MAX_REVIEW_MESSAGE_LENGTH;
  SET_OF_STRINGS_SCHEMA: ListSchema = {
    type: 'list',
    items: {
      type: 'unicode'
    }
  };

  startedEditing: boolean = false;
  translationUpdated: boolean = false;
  UNICODE_SCHEMA: UnicodeSchema = { type: 'unicode' };

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    public activeModal: NgbActiveModal,
    private alertsService: AlertsService,
    private contextService: ContextService,
    private contributionAndReviewService: ContributionAndReviewService,
    private contributionOpportunitiesService: ContributionOpportunitiesService,
    private languageUtilService: LanguageUtilService,
    private siteAnalyticsService: SiteAnalyticsService,
    private threadDataBackendApiService: ThreadDataBackendApiService,
    private userService: UserService,
    private validatorsService: ValidatorsService,
  ) {}

  ngOnInit(): void {
    this.activeSuggestionId = this.initialSuggestionId;
    this.activeContribution = this.suggestionIdToContribution[
      this.activeSuggestionId];
    this.activeSuggestion = this.activeContribution.suggestion;
    this.authorName = this.activeSuggestion.author_name;
    this.languageDescription = (
      this.languageUtilService.getAudioLanguageDescription(
        this.activeSuggestion.language_code));
    this.status = this.activeSuggestion.status;
    if (this.reviewable) {
      this.siteAnalyticsService
        .registerContributorDashboardViewSuggestionForReview('Translation');
      this.heading = 'Review Translation Contributions';
    }
    const suggestionIds = Object.keys(this.suggestionIdToContribution);
    const clickedSuggestionIndex = suggestionIds.indexOf(
      this.activeSuggestionId);
    this.skippedContributionIds = (
      suggestionIds.slice(0, clickedSuggestionIndex));
    delete this.suggestionIdToContribution[this.initialSuggestionId];
    this.remainingContributionIds = suggestionIds.slice(
      clickedSuggestionIndex + 1, suggestionIds.length);
    this.remainingContributionIds.reverse();
    this.isLastItem = this.remainingContributionIds.length === 0;
    this.allContributions = this.suggestionIdToContribution;
    this.allContributions[this.activeSuggestionId] = (
      this.activeContribution);

    this.refreshActiveContributionState();
    // The 'html' value is passed as an object as it is required for
    // schema-based-editor. Otherwise the corrrectly updated value for
    // the translation is not received from the editor when the translation
    // is edited by the reviewer.
    this.editedContent = {
      html: this.translationHtml
    };
  }

  refreshActiveContributionState(): void {
    this.activeContribution = this.allContributions[
      this.activeSuggestionId];

    // Close modal instance if the suggestion's corresponding opportunity
    // is deleted. See issue #14234.
    if (this.activeContribution.details === null) {
      this.activeModal.close(this.resolvedSuggestionIds);
      return;
    }
    this.activeSuggestion = this.activeContribution.suggestion;
    this.contextService.setCustomEntityContext(
      AppConstants.IMAGE_CONTEXT.EXPLORATION_SUGGESTIONS,
      this.activeSuggestion.target_id);
    this.subheading = (
      `${this.activeContribution.details.topic_name} / ` +
        `${this.activeContribution.details.story_title} / ` +
        `${this.activeContribution.details.chapter_title}`
    );

    this.isLastItem = this.remainingContributionIds.length === 0;
    this.isFirstItem = this.skippedContributionIds.length === 0;
    this.userCanReviewTranslationSuggestionsInLanguages = [];
    this.languageCode = this.activeSuggestion.change_cmd.
      language_code;
    this.userService.getUserInfoAsync().then(userInfo => {
      const username = userInfo.getUsername();

      if (username === null) {
        throw new Error('Cannot fetch username.');
      }
      this.username = username;
      this.userIsCurriculumAdmin = userInfo.isCurriculumAdmin();
    });
    this.userService.getUserContributionRightsDataAsync().then(
      (userContributionRights) => {
        let userContributionRightsData = (
          userContributionRights as UserContributionRightsDataBackendDict);
        this.userCanReviewTranslationSuggestionsInLanguages = (
          userContributionRightsData
            .can_review_translation_for_language_codes);
        this.canEditTranslation = (
          this.userCanReviewTranslationSuggestionsInLanguages.includes(
            this.languageCode) && this.username !== this.activeSuggestion.
            author_name
        );
      });
    this.isContentExpanded = false;
    this.isTranslationExpanded = false;
    this.errorMessage = '';
    this.errorFound = false;
    this.startedEditing = false;
    this.resolvingSuggestion = false;
    this.lastSuggestionToReview = (
      Object.keys(this.allContributions).length <= 1);
    this.translationHtml = (
      this.activeSuggestion.change_cmd.translation_html);
    this.status = this.activeSuggestion.status;
    this.contentHtml = (
      this.activeSuggestion.change_cmd.content_html);
    this.explorationContentHtml = (
      this.activeSuggestion.exploration_content_html);
    this.contentTypeIsHtml = (
      this.activeSuggestion.change_cmd.data_format === 'html'
    );
    this.contentTypeIsUnicode = (
      this.activeSuggestion.change_cmd.data_format === 'unicode'
    );
    this.contentTypeIsSetOfStrings = (
      this.activeSuggestion.change_cmd.data_format ===
        'set_of_normalized_string' ||
      this.activeSuggestion.change_cmd.data_format ===
        'set_of_unicode_string'
    );
    this.reviewMessage = '';
    if (!this.reviewable) {
      this._getThreadMessagesAsync(this.activeSuggestionId).then(() => {
        // No review message and no exploration content means the suggestion
        // became obsolete and was auto-rejected in a batch job. See issue
        // #16022.
        if (!this.reviewMessage && !this.explorationContentHtml) {
          this.reviewMessage = (
            AppConstants.OBSOLETE_TRANSLATION_SUGGESTION_REVIEW_MSG);
        }
      });
    }
    this.explorationImagesString = this.getImageInfoForSuggestion(
      this.contentHtml);
    this.suggestionImagesString = this.getImageInfoForSuggestion(
      this.translationHtml);
    setTimeout(() => {
      this.computePanelOverflowState();
    }, 0);
  }

  computePanelOverflowState(): void {
    setTimeout(() => {
      this.isContentOverflowing = (
        this.contentPanel.elementRef.nativeElement.offsetHeight >
        this.contentContainer.nativeElement.offsetHeight);
      this.isTranslationOverflowing = (
        this.translationPanel.elementRef.nativeElement.offsetHeight >
        this.translationContainer.nativeElement.offsetHeight);
    }, 0);
  }

  ngAfterViewInit(): void {
    this.computePanelOverflowState();
  }

  toggleExpansionState(tab: ExpansionTabType): void {
    if (tab === ExpansionTabType.CONTENT) {
      this.isContentExpanded = !this.isContentExpanded;
    } else if (tab === ExpansionTabType.TRANSLATION) {
      this.isTranslationExpanded = !this.isTranslationExpanded;
    }
  }

  updateSuggestion(): void {
    const updatedTranslation = this.editedContent.html;
    const suggestionId = this.activeSuggestion.suggestion_id;
    this.preEditTranslationHtml = this.translationHtml;
    this.translationHtml = updatedTranslation;
    this.contributionAndReviewService.updateTranslationSuggestionAsync(
      suggestionId,
      updatedTranslation,
      () => {
        this.translationUpdated = true;
        this.startedEditing = false;
        this.contributionOpportunitiesService.
          reloadOpportunitiesEventEmitter.emit();
      },
      this.showTranslationSuggestionUpdateError);
    this.suggestionImagesString = this.getImageInfoForSuggestion(
      this.translationHtml);
  }

  // The length of the commit message should not exceed 375 characters,
  // since this is the maximum allowed commit message size.
  generateCommitMessage(): string {
    const contentId = this.activeSuggestion.change_cmd.content_id;
    const stateName = this.activeSuggestion.change_cmd.state_name;
    const contentType = contentId.split('_')[0];
    const commitMessage = `${contentType} section of "${stateName}" card`;

    return commitMessage;
  }

  async _getThreadMessagesAsync(threadId: string): Promise<void> {
    const response = await this.threadDataBackendApiService.fetchMessagesAsync(
      threadId);
    const threadMessageBackendDicts = response.messages;
    let threadMessages = threadMessageBackendDicts.map(
      m => ThreadMessage.createFromBackendDict(m));
    // This is to prevent a console error when a contribution
    // doesn't have a review message. When a contribution has
    // a review message the second element of the threadMessages
    // array contains the actual review message.
    if (threadMessages[1] !== undefined) {
      this.reviewer = threadMessages[1].authorUsername;
      this.reviewMessage = threadMessages[1].text;
    }
  }

  goToNextItem(): void {
    const lastContributionId = this.remainingContributionIds.pop();
    // If the current item is the last item, do not navigate.
    if (lastContributionId === undefined) {
      return;
    }
    // Don't add resolved contributions to the skippedContributionIds beacuse
    // we don't want to show resolved suggestions when navigating back.
    if (!this.resolvedSuggestionIds.includes(this.activeSuggestionId)) {
      this.skippedContributionIds.push(this.activeSuggestionId);
    }

    this.activeSuggestionId = lastContributionId;

    this.refreshActiveContributionState();
  }

  goToPreviousItem(): void {
    const lastContributionId = this.skippedContributionIds.pop();
    // If the current item is the first item, do not navigate.
    if (lastContributionId === undefined) {
      return;
    }
    // Don't add resolved contributions to the remainingContributionIds beacuse
    // we don't want to show resolved suggestions when navigating forward.
    if (!this.resolvedSuggestionIds.includes(this.activeSuggestionId)) {
      this.remainingContributionIds.push(this.activeSuggestionId);
    }

    this.activeSuggestionId = lastContributionId;

    this.refreshActiveContributionState();
  }

  resolveSuggestionAndUpdateModal(): void {
    this.resolvedSuggestionIds.push(this.activeSuggestionId);

    // Resolved contributions don't need to be displayed in the modal.
    delete this.allContributions[this.activeSuggestionId];

    // If the reviewed item was the last item, close the modal.
    if (this.lastSuggestionToReview || this.isLastItem) {
      this.activeModal.close(this.resolvedSuggestionIds);
      return;
    }
    this.goToNextItem();
  }

  acceptAndReviewNext(): void {
    this.finalCommitMessage = this.generateCommitMessage();
    const reviewMessageForSubmitter = this.reviewMessage + (
      this.translationUpdated ? (
        (this.reviewMessage.length > 0 ? ': ' : '') +
        '(Note: This suggestion was submitted with reviewer edits.)') :
      '');
    this.resolvingSuggestion = true;
    this.siteAnalyticsService.registerContributorDashboardAcceptSuggestion(
      'Translation');

    this.contributionAndReviewService.reviewExplorationSuggestion(
      this.activeSuggestion.target_id, this.activeSuggestionId,
      AppConstants.ACTION_ACCEPT_SUGGESTION,
      reviewMessageForSubmitter, this.finalCommitMessage,
      () => {
        this.alertsService.clearMessages();
        this.alertsService.addSuccessMessage('Suggestion accepted.');
        this.resolveSuggestionAndUpdateModal();
      }, (errorMessage) => {
        this.alertsService.clearWarnings();
        this.alertsService.addWarning(`Invalid Suggestion: ${errorMessage}`);
      });
  }

  rejectAndReviewNext(reviewMessage: string): void {
    if (this.validatorsService.isValidReviewMessage(reviewMessage,
      /* ShowWarnings= */ true)) {
      this.resolvingSuggestion = true;
      this.siteAnalyticsService.registerContributorDashboardRejectSuggestion(
        'Translation');

      // In case of rejection, the suggestion is not applied, so there is no
      // commit message. Because there is no commit to make.
      this.contributionAndReviewService.reviewExplorationSuggestion(
        this.activeSuggestion.target_id, this.activeSuggestionId,
        AppConstants.ACTION_REJECT_SUGGESTION,
        reviewMessage || this.reviewMessage, null,
        () => {
          this.alertsService.clearMessages();
          this.alertsService.addSuccessMessage('Suggestion rejected.');
          this.resolveSuggestionAndUpdateModal();
        }, (errorMessage) => {
          this.alertsService.clearWarnings();
          this.alertsService.addWarning(`Invalid Suggestion: ${errorMessage}`);
        });
    }
  }

  // Returns whether the active suggestion's exploration_content_html
  // differs from the content_html of the suggestion's change object.
  hasExplorationContentChanged(): boolean {
    return !this.isHtmlContentEqual(
      this.contentHtml, this.explorationContentHtml);
  }

  isHtmlContentEqual(
      first: string | string[] | null,
      second: string | string[] | null
  ): boolean {
    if (Array.isArray(first) && Array.isArray(second)) {
      // Check equality of all array elements.
      return (
        first.length === second.length &&
        first.every(
          (val, index) => this.stripWhitespace(val) === this.stripWhitespace(
            second[index]))
      );
    }
    if (angular.isString(first) && angular.isString(second)) {
      return this.stripWhitespace(first) === this.stripWhitespace(second);
    }
    return false;
  }

  // Strips whitespace (spaces, tabs, line breaks) and '&nbsp;'.
  stripWhitespace(htmlString: string): string {
    return htmlString.replace(/&nbsp;|\s+/g, '');
  }

  editSuggestion(): void {
    this.startedEditing = true;
    this.editedContent.html = this.translationHtml;
  }

  cancelEdit(): void {
    this.errorMessage = '';
    this.startedEditing = false;
    this.errorFound = false;
    this.editedContent.html = this.translationHtml;
  }

  cancel(): void {
    this.activeModal.close(this.resolvedSuggestionIds);
  }

  showTranslationSuggestionUpdateError(error: Error): void {
    this.errorMessage = 'Invalid Suggestion: ' + error.message;
    this.errorFound = true;
    this.startedEditing = true;
    this.translationHtml = this.preEditTranslationHtml;
  }

  isDeprecatedTranslationSuggestionCommand(): boolean {
    return this.activeSuggestion.change_cmd.cmd === 'add_translation';
  }

  doesTranslationContainTags(): boolean {
    return /<.*>/g.test(this.translationHtml);
  }

  getHtmlSchema(): HTMLSchema {
    return this.HTML_SCHEMA;
  }

  getUnicodeSchema(): UnicodeSchema {
    return this.UNICODE_SCHEMA;
  }

  getSetOfStringsSchema(): ListSchema {
    return this.SET_OF_STRINGS_SCHEMA;
  }

  updateHtml(value: string): void {
    if (value !== this.editedContent.html) {
      this.editedContent.html = value;
      this.changeDetectorRef.detectChanges();
    }
  }

  /**
   * Retrieves image information from the given content and
   * returns it as a string.
   * If the content is in the form of a string (not an array),
   * it parses the content using a DOMParser and extracts the HTML
   * for all 'oppia-noninteractive-image' elements. The extracted HTML
   * is returned as a string.
   * @param content The content containing image information (
   * either a string or an array of strings).
   * @returns A string representation of the extracted image information.
   */
  getImageInfoForSuggestion(content: string | string[]): string {
    let htmlString = '';

    // Images are present in form of strings not as Array of strings.
    if (!Array.isArray(content)) {
      this.altTextIsDisplayed = true;
      const doc = new DOMParser().parseFromString(content, 'text/html');
      const imgElements = doc.querySelectorAll('oppia-noninteractive-image');
      htmlString = Array.from(imgElements).map((img) => img.outerHTML).join('');
    }

    return htmlString;
  }
}
