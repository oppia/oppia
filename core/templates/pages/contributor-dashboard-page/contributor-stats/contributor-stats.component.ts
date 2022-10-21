// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the list view of opportunities.
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

interface PagedStats {
  language?: string;
  currentPage: number;
  totalPages: number;
  pagedStats: Stats[];
}

interface Stats {
  pageNumber?: number;
  // eslint-disable-next-line max-len
  stats: TranslationContributionStats[] | TranslationReviewStats[] | QuestionContributionStats[] | QuestionReviewStats[];
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

  translationContributions: Stats[] = [];
  translationReviews: Stats[] = [];
  questionContributions: Stats[] = [];
  questionReviews: Stats[] = [];

  translationContributionPagedStats: PagedStats[] = [];
  translationReviewPagedStats: PagedStats[] = [];
  questionContributionPagedStats: PagedStats[] = [];
  questionReviewPagedStats: PagedStats[] = [];

  COLUMNS = {
    translationContribution: [
      {
        name: 'Months',
      },
      {
        name: 'Topic Names',
      },
      {
        name: 'Accepted Cards',
      },
      {
        name: 'Accepted Word Count',
      }
    ],
    translationReview: [
      {
        name: 'Months',
      },
      {
        name: 'Topic Names',
      },
      {
        name: 'Reviewed Cards',
      },
      {
        name: 'Reviewed Word Count',
      },
      {
        name: 'Accepted Cards',
      },
      {
        name: 'Accepted Word Count',
      }
    ],
    questionContribution: [
      {
        name: 'Months',
      },
      {
        name: 'Topic Names',
      },
      {
        name: 'Accepted Questions',
      },
      {
        name: 'Accepted Questions WIthout Edits',
      }
    ],
    questionReview: [
      {
        name: 'Months',
      },
      {
        name: 'Topic Names',
      },
      {
        name: 'Reviewed Questions',
      },
      {
        name: 'Accepted Questions',
      }
    ],
  };

  translationContributionOption: Option = {
    displayName:
      AppConstants.CONTRIBUTION_STATS_TYPES
        .TRANSALTION_CONTRIBUTION.DISPLAY_NAME,
    contributionType:
     AppConstants.CONTRIBUTION_STATS_TYPES.TRANSALTION_CONTRIBUTION.NAME
  };

  translationReviewOption: Option = {
    displayName:
      AppConstants.CONTRIBUTION_STATS_TYPES.TRANSALTION_REVIEW.DISPLAY_NAME,
    contributionType:
     AppConstants.CONTRIBUTION_STATS_TYPES.TRANSALTION_REVIEW.NAME
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

  translationContribution: Stats[] = [];
  translationReview: Stats[] = [];
  questionContribution: Stats[] = [];
  questionReview: Stats[] = [];

  statsData = {
    translationContribution: this.translationContributionPagedStats,
    translationReview: this.translationReviewPagedStats,
    questionContribution: this.questionContributionPagedStats,
    questionReview: this.questionReviewPagedStats,
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
    this.translationContributions = [];
    this.translationReviews = [];
    this.questionContributions = [];
    this.questionReviews = [];
    const response = await this.contributionAndReviewStatsService.fetchAllStats(
      this.username);

    if (response.translation_contribution_stats.length > 0) {
      const translationContributionLanguages = this.fetchLanguagesFromStats(
        response.translation_contribution_stats);
      translationContributionLanguages.forEach((language: string) => {
        const translationContributionsStats:
        TranslationContributionStats[] = [];
        response.translation_contribution_stats.map((stat) => {
          if (stat.language_code === language) {
            translationContributionsStats.push(
              this.createTranslationContributionStat(stat)
            );
          }
        });

        const translationContributionSlicedStats: Stats[] =
          this.sliceStatsIntoPage(translationContributionsStats);

        this.translationContributionPagedStats.push(
          this.generatePagedStats(
            translationContributionSlicedStats, language));
      });

      this.statsData.translationContribution = (
        this.translationContributionPagedStats);
    }

    if (response.translation_review_stats.length > 0) {
      const translationReviewLanguages = this.fetchLanguagesFromStats(
        response.translation_review_stats);
      translationReviewLanguages.forEach((language: string) => {
        const translationReviewStats:
            TranslationReviewStats[] = [];
        response.translation_review_stats.map((stat) => {
          if (stat.language_code === language) {
            translationReviewStats.push(
              this.createTranslationReviewStat(stat)
            );
          }
        });

        const translationReviewSlicedStats: Stats[] = this.sliceStatsIntoPage(
          translationReviewStats);

        this.translationReviewPagedStats.push(
          this.generatePagedStats(translationReviewSlicedStats, language));
      });

      this.statsData.translationReview = this.translationReviewPagedStats;
    }

    if (response.question_contribution_stats.length > 0) {
      const questionContributionStats:
        QuestionContributionStats[] = response.
          question_contribution_stats.map((stat) => {
            return this.createQuestionContributionStat(stat);
          });

      const questionContributionSlicedStats: Stats[] = this.sliceStatsIntoPage(
        questionContributionStats);

      this.questionContributionPagedStats.push(
        this.generatePagedStats(questionContributionSlicedStats));

      this.statsData.questionContribution = this.questionContributionPagedStats;
    }

    if (response.question_review_stats.length > 0) {
      const questionReviewStats: QuestionReviewStats[] = response.
        question_review_stats.map((stat) => {
          return this.createQuestionReviewStat(stat);
        });

      const questionReviewSlicedStats: Stats[] = this.sliceStatsIntoPage(
        questionReviewStats);

      this.questionReviewPagedStats.push(
        this.generatePagedStats(questionReviewSlicedStats));

      this.statsData.questionReview = this.questionReviewPagedStats;
    }
  }

  fetchLanguagesFromStats(
      stats:
        TranslationContributionBackendDict[] |
        TranslationReviewBackendDict[]): Set<string> {
    const languages = new Set<string>();
    stats.map((stat) => {
      languages.add(stat.language_code);
    });

    return languages;
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

  sliceStatsIntoPage(
      statsForPage: TranslationContributionStats[] |
        TranslationReviewStats[] |
        QuestionContributionStats[] |
        QuestionReviewStats[]): Stats[] {
    let slicedStats: Stats[] = [];
    const iterations: number = Math.floor(
      statsForPage.length / this.ITEMS_PER_PAGE);

    for (let i = 0; i <= iterations; i++) {
      slicedStats.push({
        pageNumber: i + 1,
        stats: statsForPage.slice(
          (i * this.ITEMS_PER_PAGE),
          (i * this.ITEMS_PER_PAGE) + this.ITEMS_PER_PAGE)
      });
    }

    return slicedStats;
  }

  generatePagedStats(slicedStats: Stats[], language?: string): PagedStats {
    let pagedStats: PagedStats = {
      currentPage: 1,
      totalPages: slicedStats.length,
      pagedStats: slicedStats
    };

    if (language) {
      pagedStats.language =
        this.languageUtilService.getAudioLanguageDescription(language);
    }

    return pagedStats;
  }

  nextPage(block: PagedStats): void {
    block.currentPage += 1;
  }

  previousPage(block: PagedStats): void {
    block.currentPage -= 1;
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
