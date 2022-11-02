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

import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { ContributionAndReviewStatsService, QuestionContributionBackendDict, QuestionReviewBackendDict, TranslationContributionBackendDict, TranslationReviewBackendDict } from '../services/contribution-and-review-stats.service';
import { UserService } from 'services/user.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { AppConstants } from 'app.constants';

interface Option {
  contributionType: string;
  displayName: string;
}

interface Stats {
  language?: string;
  currentStartingIndex: number;
  currentEndingIndex: number;
  // eslint-disable-next-line max-len
  data: (TranslationContributionStats | TranslationReviewStats | QuestionContributionStats | QuestionReviewStats)[];
}

interface TranslationContributionStats {
  firstContributionDate: string;
  lastContributionDate: string;
  topicName: string;
  acceptedCards: number;
  acceptedWordCount: number;
}

interface TranslationReviewStats {
  firstContributionDate: string;
  lastContributionDate: string;
  topicName: string;
  acceptedCards: number;
  acceptedWordCount: number;
  reviewedCards: number;
  reviewedWordCount: number;
}

interface QuestionContributionStats {
  firstContributionDate: string;
  lastContributionDate: string;
  topicName: string;
  acceptedQuestions: number;
  acceptedQuestionsWithoutEdits: number;
}

interface QuestionReviewStats {
  firstContributionDate: string;
  lastContributionDate: string;
  topicName: string;
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

  translationContributionStats: {[key: string]: Stats} = {};
  translationReviewStats: {[key: string]: Stats} = {};
  questionContributionStats: Stats;
  questionReviewStats: Stats;

  currentStartingIndex = 0;
  currentEndingIndex = 5;

  statsData = {
    translationContribution: {},
    translationReview: {},
    questionContribution: {},
    questionReview: {},
  };

  statsDataAvailability = {
    translationContribution: false,
    translationReview: false,
    questionContribution: false,
    questionReview: false,
  };

  constructor(
    private readonly languageUtilService: LanguageUtilService,
    private readonly contributionAndReviewStatsService:
        ContributionAndReviewStatsService,
    private readonly userService: UserService) {
  }

  async ngOnInit(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();
    const username = userInfo.getUsername();

    if (username === null) {
      throw new Error('Cannot fetch username.');
    }
    this.username = username;
    const currentOption = this.options.filter(
      (option) => option.contributionType === this.type);
    this.selectedContributionType = currentOption[0].displayName;

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
    const currentOption = this.options.filter(
      (option) => option.contributionType === contributionType);
    this.selectedContributionType = currentOption[0].displayName;
    this.dropdownShown = false;
    this.mobileDropdownShown = false;
  }

  async fetchStats(): Promise<void> {
    const response = await this.contributionAndReviewStatsService.fetchAllStats(
      this.username);

    if (response.translation_contribution_stats.length > 0) {
      response.translation_contribution_stats.map((stat) => {
        if (!this.translationContributionStats[stat.language_code]) {
          this.translationContributionStats[stat.language_code] = {
            data: [this.createTranslationContributionStat(stat)],
            language: this.languageUtilService.getAudioLanguageDescription(
              stat.language_code),
            currentStartingIndex: 0,
            currentEndingIndex: 5
          };
        } else {
          this.translationContributionStats[stat.language_code].data.push(
            this.createTranslationContributionStat(stat));
        }
      });
      this.statsData.translationContribution = this.
        translationContributionStats;
      this.statsDataAvailability.translationContribution = true;
    }

    if (response.translation_review_stats.length > 0) {
      response.translation_review_stats.map((stat) => {
        if (!this.translationReviewStats[stat.language_code]) {
          this.translationReviewStats[stat.language_code] = {
            data: [this.createTranslationReviewStat(stat)],
            language: this.languageUtilService.getAudioLanguageDescription(
              stat.language_code),
            currentStartingIndex: 0,
            currentEndingIndex: 5
          };
        } else {
          this.translationReviewStats[stat.language_code].data.push(
            this.createTranslationReviewStat(stat));
        }
      });
      this.statsData.translationReview = this.translationReviewStats;
      this.statsDataAvailability.translationReview = true;
    }

    if (response.question_contribution_stats.length > 0) {
      this.questionContributionStats = {
        data: response.question_contribution_stats.map((stat) => {
          return this.createQuestionContributionStat(stat);
        }),
        currentStartingIndex: 0,
        currentEndingIndex: 5
      };
      this.statsData.questionContribution = this.questionContributionStats;
      this.statsDataAvailability.questionContribution = true;
    }

    if (response.question_review_stats.length > 0) {
      this.questionReviewStats = {
        data: response.question_review_stats.map((stat) => {
          return this.createQuestionReviewStat(stat);
        }),
        currentStartingIndex: 0,
        currentEndingIndex: 5
      };
      this.statsData.questionReview = this.questionReviewStats;
      this.statsDataAvailability.questionReview = true;
    }
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

  nextPage(page: Stats): void {
    page.currentStartingIndex += this.ITEMS_PER_PAGE;
    page.currentEndingIndex += this.ITEMS_PER_PAGE;
  }

  previousPage(page: Stats): void {
    page.currentStartingIndex -= this.ITEMS_PER_PAGE;
    page.currentEndingIndex -= this.ITEMS_PER_PAGE;
  }

  columnSortDirection(): number {
    return 0;
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
