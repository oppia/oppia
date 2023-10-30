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
 * @fileoverview Component for the contributor badges.
 */

import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { AppConstants } from 'app.constants';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { UserService } from 'services/user.service';
import { ContributionAndReviewStatsService } from '../services/contribution-and-review-stats.service';

interface ContributionCounts {
  language: string | null;
  submissions: number;
  reviews: number;
  corrections: number;
}

interface Badge {
  contributionCount: number;
  text: string;
  language: string | null;
  isUnlocked: boolean;
}

export enum MobileBadgeType {
  Question = 'Question',
  Translation = 'Translation',
}

@Component({
  selector: 'contributor-badges',
  templateUrl: './contributor-badges.component.html',
  styleUrls: []
})
export class ContributorBadgesComponent {
  @ViewChild('dropdown', {'static': false}) dropdownRef!: ElementRef;

  @ViewChild(
    'mobileDropdown', {'static': false}
  ) mobileDropdownRef!: ElementRef;

  @ViewChild(
    'mobileBadgeTypeDropdown', {'static': false}
  ) mobileBadgeTypeDropdownRef!: ElementRef;

  totalTranslationStats: {[key: string]: ContributionCounts} = {};
  translationBadges: {[key: string]: {[key: string]: Badge[]}} = {};
  languages: string[] = [];
  questionSubmissionBadges: Badge[] = [];
  questionReviewBadges: Badge[] = [];
  questionCorrectionBadges: Badge[] = [];
  selectedLanguage!: string;
  totalQuestionStats: ContributionCounts = {
    language: null,
    submissions: 0,
    reviews: 0,
    corrections: 0
  };

  dropdownShown = false;
  mobileDropdownShown = false;
  mobileBadgeTypeDropdownShown = false;
  mobileBadgeTypeSelected = MobileBadgeType.Translation;
  dataLoading = false;
  userCanReviewTranslationSuggestion: boolean = false;
  userCanReviewQuestionSuggestions: boolean = false;
  userCanSuggestQuestions: boolean = false;
  userHasQuestionRights: boolean = false;
  reviewableLanguages: string[] = [];

  constructor(
    private readonly languageUtilService: LanguageUtilService,
    private readonly contributionAndReviewStatsService:
      ContributionAndReviewStatsService,
    private readonly userService: UserService) {}

  async ngOnInit(): Promise<void> {
    this.dataLoading = true;
    const userInfo = await this.userService.getUserInfoAsync();
    const username = userInfo.getUsername();

    if (username === null) {
      throw new Error('Cannot fetch username.');
    }

    const userContributionRights =
      await this.userService.getUserContributionRightsDataAsync();

    if (userContributionRights === null) {
      throw new Error('Cannot fetch user contribution rights.');
    }

    const allContributionStats = await this
      .contributionAndReviewStatsService.fetchAllStats(username);

    this.userCanReviewQuestionSuggestions = (
      userContributionRights.can_review_questions);
    this.userCanSuggestQuestions = (
      userContributionRights.can_suggest_questions);
    this.userHasQuestionRights = (
      this.userCanSuggestQuestions ||
      this.userCanReviewQuestionSuggestions);

    if (allContributionStats.translation_contribution_stats.length > 0) {
      allContributionStats.translation_contribution_stats.forEach((stat) => {
        const languageDescription =
          this.languageUtilService.getAudioLanguageDescription(
            stat.language_code);

        // There can be languages that the contributor has translation
        // contribution stats but not translation review stats. Hence we need to
        // initialize TotalTranslationStats objects for those languages.
        if (!this.totalTranslationStats[languageDescription]) {
          this.totalTranslationStats[languageDescription] = {
            language: this.languageUtilService.getShortLanguageDescription(
              languageDescription),
            submissions: stat.accepted_translations_count,
            reviews: 0,
            corrections: 0
          };
        } else {
          this.totalTranslationStats[languageDescription].submissions += (
            stat.accepted_translations_count);
        }
      });
    }
    if (allContributionStats.translation_review_stats.length > 0) {
      allContributionStats.translation_review_stats.forEach((stat) => {
        const languageDescription =
          this.languageUtilService.getAudioLanguageDescription(
            stat.language_code);

        if (!this.totalTranslationStats[languageDescription]) {
          this.totalTranslationStats[languageDescription] = {
            language: this.languageUtilService.getShortLanguageDescription(
              languageDescription),
            submissions: 0,
            reviews: stat.reviewed_translations_count,
            corrections: stat.accepted_translations_with_reviewer_edits_count
          };
          this.reviewableLanguages.push(languageDescription);
        } else {
          this.totalTranslationStats[languageDescription].reviews += (
            stat.reviewed_translations_count);
          this.totalTranslationStats[languageDescription].corrections += (
            stat.accepted_translations_with_reviewer_edits_count);
        }
      });
    }
    if (allContributionStats.question_contribution_stats.length > 0) {
      allContributionStats.question_contribution_stats.map((stat) => {
        this.totalQuestionStats.submissions += stat.accepted_questions_count;
      });
    }
    if (allContributionStats.question_review_stats.length > 0) {
      allContributionStats.question_review_stats.map((stat) => {
        this.totalQuestionStats.reviews += stat.reviewed_questions_count;
        this.totalQuestionStats.corrections += (
          stat.accepted_questions_with_reviewer_edits_count);
      });
    }

    for (let language in this.totalTranslationStats) {
      this.translationBadges[language] = {};

      this.translationBadges[language][
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION] =
          this.getObtainedBadges(
            this.totalTranslationStats[language].submissions,
            AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION,
            this.totalTranslationStats[language].language);
      this.translationBadges[language][
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW] =
          this.getObtainedBadges(
            this.totalTranslationStats[language].reviews,
            AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW,
            this.totalTranslationStats[language].language);
      this.translationBadges[language][
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION] =
          this.getObtainedBadges(
            this.totalTranslationStats[language].corrections,
            AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION,
            this.totalTranslationStats[language].language);
    }

    if (this.userCanSuggestQuestions) {
      this.questionSubmissionBadges = this.getObtainedBadges(
        this.totalQuestionStats.submissions,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION, null);
    }
    if (this.userCanReviewQuestionSuggestions) {
      this.questionReviewBadges = this.getObtainedBadges(
        this.totalQuestionStats.reviews,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW, null);
      this.questionCorrectionBadges = this.getObtainedBadges(
        this.totalQuestionStats.corrections,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION, null);
    }

    this.languages = Object.keys(this.totalTranslationStats);

    if (this.languages.length > 0) {
      this.selectedLanguage = this.languages[0];
      this.userCanReviewTranslationSuggestion = (
        this.reviewableLanguages.includes(this.selectedLanguage));
    }
    this.dataLoading = false;
  }

  getObtainedBadges(
      contributionCount: number,
      contributionSubType: string,
      language: string | null
  ): Badge[] {
    const badges: Badge[] = [];
    let level = 0;
    let index = 0;
    while (contributionCount >= level) {
      if (index < AppConstants.CONTRIBUTOR_BADGE_INITIAL_LEVELS.length) {
        level = AppConstants.CONTRIBUTOR_BADGE_INITIAL_LEVELS[index];
        index += 1;
      } else {
        level += 500;
      }

      if (contributionCount >= level) {
        badges.push(
          {
            contributionCount: level,
            text: contributionSubType,
            isUnlocked: true,
            language
          }
        );
      } else {
        // Add a locked badge for the next unachieved milestone.
        badges.push(
          {
            contributionCount: level - contributionCount,
            text: contributionSubType,
            isUnlocked: false,
            language
          }
        );
        break;
      }
    }
    return badges;
  }

  toggleLanguageDropdown(): void {
    this.dropdownShown = !this.dropdownShown;
  }

  toggleMobileLanguageDropdown(): void {
    this.mobileDropdownShown = !this.mobileDropdownShown;
  }

  toggleMobileBadgeTypeDropdown(): void {
    this.mobileBadgeTypeDropdownShown = !this.mobileBadgeTypeDropdownShown;
  }

  selectLanguageOption(language: string): void {
    this.selectedLanguage = language;
    this.userCanReviewTranslationSuggestion = (
      this.reviewableLanguages.includes(this.selectedLanguage));
    this.dropdownShown = false;
    this.mobileDropdownShown = false;
  }

  selectBadgeType(mobileBadgeType: MobileBadgeType): void {
    this.mobileBadgeTypeSelected = mobileBadgeType;
    this.mobileBadgeTypeDropdownShown = false;
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
    if (
      targetElement &&
      !this.mobileBadgeTypeDropdownRef.nativeElement.contains(targetElement)
    ) {
      this.mobileBadgeTypeDropdownShown = false;
    }
  }
}
