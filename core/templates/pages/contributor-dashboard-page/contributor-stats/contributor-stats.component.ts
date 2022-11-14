// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the contribution stats view.
 */

import { Component, ElementRef, HostListener, Injector, Input, ViewChild } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { ContributionAndReviewStatsService, QuestionContributionBackendDict, QuestionReviewBackendDict, TranslationContributionBackendDict, TranslationReviewBackendDict } from '../services/contribution-and-review-stats.service';
import { UserService } from 'services/user.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { AppConstants } from 'app.constants';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CertificateDownloadModalComponent } from '../modal-templates/certificate-download-modal.component';

interface Option {
  contributionType: string;
  displayName: string;
}

interface StatsPage {
  language?: string;
  currentPageStartIndex: number;
  currentPageEndIndex: number;
  // eslint-disable-next-line max-len
  data: (TranslationContributionStats | TranslationReviewStats | QuestionContributionStats | QuestionReviewStats)[];
}

interface Stat {
  topicName: string;
  firstContributionDate: string;
  lastContributionDate: string;
}

interface TranslationContributionStats extends Stat {
  acceptedCards: number;
  acceptedWordCount: number;
}

interface TranslationReviewStats extends Stat {
  acceptedCards: number;
  acceptedWordCount: number;
  reviewedCards: number;
  reviewedWordCount: number;
}

interface QuestionContributionStats extends Stat {
  acceptedQuestions: number;
  acceptedQuestionsWithoutEdits: number;
}

interface QuestionReviewStats extends Stat {
  reviewedQuestions: number;
  acceptedQuestions: number;
}

@Component({
  selector: 'contributor-stats',
  templateUrl: './contributor-stats.component.html',
  styleUrls: []
})
export class ContributorStatsComponent {
  @Input() type!: string;
  @ViewChild('dropdown', {'static': false}) dropdownRef!: ElementRef;
  @ViewChild('mobileDropdown', {'static': false}) mobileDropdownRef!:
    ElementRef;

  dropdownShown: boolean = false;
  mobileDropdownShown: boolean = false;
  selectedContributionType: string;
  username: string;
  endPage: number;
  ITEMS_PER_PAGE: number = 5;

  userCanReviewTranslationSuggestions: boolean = false;
  userCanReviewQuestionSuggestions: boolean = false;
  userCanSuggestQuestions: boolean = false;

  COLUMNS = {
    translationContribution: {
      months: 'Months',
      topicNames: 'Topic Names',
      acceptedCards: 'Accepted Cards',
      acceptedWordCount: 'Accepted Word Count'
    },
    translationReview: {
      months: 'Months',
      topicNames: 'Topic Names',
      reviewedCards: 'Reviewed Cards',
      reviewedWordCount: 'Reviewed Word Count',
      acceptedCards: 'Accepted Cards',
      acceptedWordCount: 'Accepted Word Count'
    },
    questionContribution: {
      months: 'Months',
      topicNames: 'Topic Names',
      acceptedQuestions: 'Accepted Questions',
      acceptedQuestionsWithoutEdits: 'Accepted Questions Without Edits'
    },
    questionReview: {
      months: 'Months',
      topicNames: 'Topic Names',
      reviewedQuestions: 'Reviewed Questions',
      acceptedQuestions: 'Accepted Questions'
    }
  };

  translationContributionOption: Option = {
    displayName:
      AppConstants.CONTRIBUTION_STATS_TYPES
        .TRANSLATION_CONTRIBUTION.DISPLAY_NAME,
    contributionType:
     AppConstants.CONTRIBUTION_STATS_TYPES.TRANSLATION_CONTRIBUTION.NAME
  };

  translationReviewOption: Option = {
    displayName:
      AppConstants.CONTRIBUTION_STATS_TYPES.TRANSLATION_REVIEW.DISPLAY_NAME,
    contributionType:
     AppConstants.CONTRIBUTION_STATS_TYPES.TRANSLATION_REVIEW.NAME
  };

  questionContributionOption: Option = {
    displayName:
      AppConstants.CONTRIBUTION_STATS_TYPES.QUESTION_CONTRIBUTION.DISPLAY_NAME,
    contributionType:
     AppConstants.CONTRIBUTION_STATS_TYPES.QUESTION_CONTRIBUTION.NAME
  };

  questionReviewOption: Option = {
    displayName:
      AppConstants.CONTRIBUTION_STATS_TYPES.QUESTION_REVIEW.DISPLAY_NAME,
    contributionType:
     AppConstants.CONTRIBUTION_STATS_TYPES.QUESTION_REVIEW.NAME
  };

  options: Option[] = [
    this.translationContributionOption
  ];

  statsData = {
    translationContribution: {},
    translationReview: {},
    questionContribution: {},
    questionReview: {},
  };

  constructor(
    private readonly languageUtilService: LanguageUtilService,
    private readonly contributionAndReviewStatsService:
        ContributionAndReviewStatsService,
    private readonly userService: UserService,
    private readonly modalService: NgbModal,
    private readonly injector: Injector) {
  }

  async ngOnInit(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();
    const username = userInfo.getUsername();

    if (username === null) {
      throw new Error('Cannot fetch username.');
    }
    this.username = username;
    const currentOption = this.options.find(
      (option) => option.contributionType === this.type);
    this.selectedContributionType = currentOption.displayName;

    const userContributionRights =
      await this.userService.getUserContributionRightsDataAsync();
    this.userCanReviewTranslationSuggestions = (
      userContributionRights
        .can_review_translation_for_language_codes.length > 0);
    this.userCanReviewQuestionSuggestions = (
      userContributionRights.can_review_questions);
    this.userCanSuggestQuestions = (
      userContributionRights.can_suggest_questions);

    if (this.userCanReviewTranslationSuggestions) {
      this.options.push(this.translationReviewOption);
    }
    if (this.userCanSuggestQuestions) {
      this.options.push(this.questionContributionOption);
    }
    if (this.userCanReviewQuestionSuggestions) {
      this.options.push(this.questionReviewOption);
    }

    await this.fetchStats();
  }

  toggleDropdown(): void {
    this.dropdownShown = !this.dropdownShown;
  }

  toggleMobileDropdown(): void {
    this.mobileDropdownShown = !this.mobileDropdownShown;
  }

  async selectOption(contributionType: string): Promise<void> {
    this.type = contributionType;
    const currentOption = this.options.find(
      (option) => option.contributionType === contributionType);
    this.selectedContributionType = currentOption.displayName;
    this.dropdownShown = false;
    this.mobileDropdownShown = false;
  }

  async fetchStats(): Promise<void> {
    const response = await this.contributionAndReviewStatsService.fetchAllStats(
      this.username);

    if (response.translation_contribution_stats.length > 0) {
      response.translation_contribution_stats.map((stat) => {
        if (!this.statsData.translationContribution[stat.language_code]) {
          this.statsData.translationContribution[stat.language_code] = this
            .createTranslationContributionStatsPage(stat);
        } else {
          this.statsData.translationContribution[stat.language_code].data.push(
            this.createTranslationContributionStat(stat));
        }
      });
    }

    if (response.translation_review_stats.length > 0) {
      response.translation_review_stats.map((stat) => {
        if (!this.statsData.translationReview[stat.language_code]) {
          this.statsData.translationReview[stat.language_code] = this
            .createTranslationReviewStatsPage(stat);
        } else {
          this.statsData.translationReview[stat.language_code].data.push(
            this.createTranslationReviewStat(stat));
        }
      });
    }

    if (response.question_contribution_stats.length > 0) {
      this.statsData.questionContribution = this
        .createQuestionContributionStatsPage(
          response.question_contribution_stats);
    }

    if (response.question_review_stats.length > 0) {
      this.statsData.questionReview = this.createQuestionReviewStatsPage(
        response.question_review_stats);
    }
  }

  createTranslationContributionStatsPage(
      stat: TranslationContributionBackendDict): StatsPage {
    return {
      data: [this.createTranslationContributionStat(stat)],
      language: this.languageUtilService.getAudioLanguageDescription(
        stat.language_code),
      currentPageStartIndex: 0,
      currentPageEndIndex: 5
    };
  }

  createTranslationReviewStatsPage(
      stat: TranslationReviewBackendDict): StatsPage {
    return {
      data: [this.createTranslationReviewStat(stat)],
      language: this.languageUtilService.getAudioLanguageDescription(
        stat.language_code),
      currentPageStartIndex: 0,
      currentPageEndIndex: 5
    };
  }

  createQuestionContributionStatsPage(
      stats: QuestionContributionBackendDict[]): StatsPage {
    return {
      data: stats.map((stat) => {
        return this.createQuestionContributionStat(stat);
      }),
      currentPageStartIndex: 0,
      currentPageEndIndex: 5
    };
  }

  createQuestionReviewStatsPage(
      stat: QuestionReviewBackendDict[]): StatsPage {
    return {
      data: stat.map((stat) => {
        return this.createQuestionReviewStat(stat);
      }),
      currentPageStartIndex: 0,
      currentPageEndIndex: 5
    };
  }

  createTranslationContributionStat(
      stat: TranslationContributionBackendDict): TranslationContributionStats {
    return {
      firstContributionDate: stat.first_contribution_date,
      lastContributionDate: stat.last_contribution_date,
      topicName: stat.topic_name,
      acceptedCards: stat.accepted_translations_count,
      acceptedWordCount: stat.accepted_translation_word_count
    };
  }

  createTranslationReviewStat(
      stat: TranslationReviewBackendDict): TranslationReviewStats {
    return {
      firstContributionDate: stat.first_contribution_date,
      lastContributionDate: stat.last_contribution_date,
      topicName: stat.topic_name,
      acceptedCards: stat.accepted_translations_count,
      acceptedWordCount: stat.accepted_translation_word_count,
      reviewedCards: stat.reviewed_translations_count,
      reviewedWordCount: stat.reviewed_translation_word_count
    };
  }

  createQuestionContributionStat(
      stat: QuestionContributionBackendDict): QuestionContributionStats {
    return {
      firstContributionDate: stat.first_contribution_date,
      lastContributionDate: stat.last_contribution_date,
      topicName: stat.topic_name,
      acceptedQuestions: stat.accepted_questions_count,
      acceptedQuestionsWithoutEdits: (
        stat.accepted_questions_without_reviewer_edits_count)
    };
  }

  createQuestionReviewStat(
      stat: QuestionReviewBackendDict): QuestionReviewStats {
    return {
      firstContributionDate: stat.first_contribution_date,
      lastContributionDate: stat.last_contribution_date,
      topicName: stat.topic_name,
      reviewedQuestions: stat.reviewed_questions_count,
      acceptedQuestions: stat.accepted_questions_count
    };
  }

  goToNextPage(page: StatsPage): void {
    page.currentPageStartIndex += this.ITEMS_PER_PAGE;
    page.currentPageEndIndex += this.ITEMS_PER_PAGE;
  }

  goToPreviousPage(page: StatsPage): void {
    page.currentPageStartIndex -= this.ITEMS_PER_PAGE;
    page.currentPageEndIndex -= this.ITEMS_PER_PAGE;
  }

  getColumnSortDirection(): number {
    return 0;
  }

  openCertificateDownloadModal(
      suggestionType: string, languageCode?: string): void {
    const modalRef = this.modalService.open(
      CertificateDownloadModalComponent, {
        size: 'lg',
        backdrop: 'static',
        injector: this.injector,
        // TODO(#12768): Remove the backdropClass & windowClass once the
        // rte-component-modal is migrated to Angular. Currently, the custom
        // class is used for correctly stacking AngularJS modal on top of
        // Angular modal.
        backdropClass: 'forced-modal-stack',
        windowClass: 'forced-modal-stack'
      });
    modalRef.componentInstance.suggestionType = suggestionType;
    modalRef.componentInstance.username = this.username;
    modalRef.componentInstance.languageCode = languageCode;
  }

  /**
   * Close dropdown when outside elements are clicked
   * @param event mouse click event
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    if (
      targetElement &&
      !this.dropdownRef.nativeElement.contains(targetElement)
    ) {
      this.dropdownShown = false;
    }
    if (
      targetElement &&
      !this.mobileDropdownRef.nativeElement.contains(targetElement)
    ) {
      this.mobileDropdownShown = false;
    }
  }
}

angular.module('oppia').directive(
  'oppiaOpportunitiesList', downgradeComponent(
    {component: ContributorStatsComponent}));
