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

import { ContributionAndReviewStatsService } from '../services/contribution-and-review-stats.service';
import { UserService } from 'services/user.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';

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
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Topic Names',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Accepted Cards',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Accepted Word Count',
        styles: 'dashboard-table-headings stats-data'
      }
    ],
    translationReview: [
      {
        name: 'Months',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Topic Names',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Reviewed Cards',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Reviewed Word Count',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Accepted Cards',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Accepted Word Count',
        styles: 'dashboard-table-headings stats-data'
      }
    ],
    questionContribution: [
      {
        name: 'Months',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Topic Names',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Accepted Questions',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Accepted Questions WIthout Edits',
        styles: 'dashboard-table-headings stats-data'
      }
    ],
    questionReview: [
      {
        name: 'Months',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Topic Names',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Reviewed Questions',
        styles: 'dashboard-table-headings stats-data'
      },
      {
        name: 'Accepted Questions',
        styles: 'dashboard-table-headings stats-data'
      }
    ],
  };

  options = [
    {
      displayName: 'Translation Contributions',
      contributionType: 'translationContribution'
    },
    {
      displayName: 'Translation Review',
      contributionType: 'translationReview'
    },
    {
      displayName: 'Question Contributions',
      contributionType: 'questionContribution'
    },
    {
      displayName: 'Question Review',
      contributionType: 'questionReview'
    },
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
      (option) => option.contributionType === this.type);
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
      const translationContributionLanguages = new Set();
      response.translation_contribution_stats.map((stat) => {
        translationContributionLanguages.add(stat.language_code);
      });

      translationContributionLanguages.forEach((language: string) => {
        const translationContributionsStats:
        TranslationContributionStats[] = [];
        response.translation_contribution_stats.map((stat) => {
          if (stat.language_code === language) {
            translationContributionsStats.push(
              {
                firstContributionDate: stat.first_contribution_date,
                lastContributionDate: stat.last_contribution_date,
                topicName: stat.topic_name,
                acceptedCards: stat.accepted_translations_count,
                acceptedWordCount: stat.accepted_translation_word_count
              }
            );
          }
        });

        const iterations: number = Math.floor(
          translationContributionsStats.length / this.ITEMS_PER_PAGE);
        let translationContributionSlicedStats: Stats[] = [];

        for (let i = 0; i <= iterations; i++) {
          translationContributionSlicedStats.push({
            pageNumber: i + 1,
            stats: translationContributionsStats.slice(
              (i * this.ITEMS_PER_PAGE),
              (i * this.ITEMS_PER_PAGE) + this.ITEMS_PER_PAGE)
          });
        }

        this.translationContributionPagedStats.push({
          language: this.languageUtilService.getAudioLanguageDescription(
            language),
          currentPage: 1,
          totalPages: translationContributionSlicedStats.length,
          pagedStats: translationContributionSlicedStats
        });
      });

      this.statsData.translationContribution = (
        this.translationContributionPagedStats);
    }

    if (response.translation_review_stats.length > 0) {
      const translationReviewLanguages = new Set();
      response.translation_review_stats.map((stat) => {
        translationReviewLanguages.add(stat.language_code);
      });

      translationReviewLanguages.forEach((language: string) => {
        const translationReviewStats:
            TranslationReviewStats[] = [];
        response.translation_review_stats.map((stat) => {
          if (stat.language_code === language) {
            translationReviewStats.push(
              {
                firstContributionDate: stat.first_contribution_date,
                lastContributionDate: stat.last_contribution_date,
                topicName: stat.topic_name,
                acceptedCards: stat.accepted_translations_count,
                acceptedWordCount: stat.accepted_translation_word_count,
                reviewedCards: stat.reviewed_translations_count,
                reviewedWordCount: stat.reviewed_translation_word_count
              }
            );
          }
        });

        const iterations: number = Math.floor(
          translationReviewStats.length / this.ITEMS_PER_PAGE);
        let translationReviewSlicedStats: Stats[] = [];

        for (let i = 0; i <= iterations; i++) {
          translationReviewSlicedStats.push({
            pageNumber: i + 1,
            stats: translationReviewStats.slice(
              (i * this.ITEMS_PER_PAGE),
              (i * this.ITEMS_PER_PAGE) + this.ITEMS_PER_PAGE)
          });
        }

        this.translationReviewPagedStats.push({
          language: this.languageUtilService.getAudioLanguageDescription(
            language),
          currentPage: 1,
          totalPages: translationReviewSlicedStats.length,
          pagedStats: translationReviewSlicedStats
        });
      });

      this.statsData.translationReview = this.translationReviewPagedStats;
    }

    if (response.question_contribution_stats.length > 0) {
      let questionContributionStats:
        QuestionContributionStats[] = [];

      questionContributionStats = response.
        question_contribution_stats.map((stat) => {
          return {
            firstContributionDate: stat.first_contribution_date,
            lastContributionDate: stat.last_contribution_date,
            topicName: stat.topic_name,
            acceptedQuestions: stat.accepted_questions_count,
            acceptedQuestionsWithoutEdits: (
              stat.accepted_questions_without_reviewer_edits_count)
          };
        });

      const iterations: number = Math.floor(
        questionContributionStats.length / this.ITEMS_PER_PAGE);
      let questionContributionSlicedStats: Stats[] = [];

      for (let i = 0; i <= iterations; i++) {
        questionContributionSlicedStats.push({
          pageNumber: i + 1,
          stats: questionContributionStats.slice(
            (i * this.ITEMS_PER_PAGE),
            (i * this.ITEMS_PER_PAGE) + this.ITEMS_PER_PAGE)
        });
      }

      this.questionContributionPagedStats.push({
        currentPage: 1,
        totalPages: questionContributionSlicedStats.length,
        pagedStats: questionContributionSlicedStats
      });

      this.statsData.questionContribution = this.questionContributionPagedStats;
    }

    if (response.question_review_stats.length > 0) {
      let questionReviewStats:
        QuestionReviewStats[] = [];
      questionReviewStats = response.
        question_review_stats.map((stat) => {
          return {
            firstContributionDate: stat.first_contribution_date,
            lastContributionDate: stat.last_contribution_date,
            topicName: stat.topic_name,
            reviewedQuestions: stat.reviewed_questions_count,
            acceptedQuestions: stat.accepted_questions_count
          };
        });

      const iterations: number = Math.floor(
        questionReviewStats.length / this.ITEMS_PER_PAGE);
      let questionReviewSlicedStats: Stats[] = [];

      for (let i = 0; i <= iterations; i++) {
        questionReviewSlicedStats.push({
          pageNumber: i + 1,
          stats: questionReviewStats.slice(
            (i * this.ITEMS_PER_PAGE),
            (i * this.ITEMS_PER_PAGE) + this.ITEMS_PER_PAGE)
        });
      }

      this.questionReviewPagedStats.push({
        currentPage: 1,
        totalPages: questionReviewSlicedStats.length,
        pagedStats: questionReviewSlicedStats
      });

      this.statsData.questionReview = this.questionReviewPagedStats;
    }
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
