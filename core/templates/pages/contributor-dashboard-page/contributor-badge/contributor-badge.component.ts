import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { AppConstants } from 'app.constants';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { UserService } from 'services/user.service';
import { ContributionAndReviewStatsService } from '../services/contribution-and-review-stats.service';

interface TotalContributionsAndReviews {
  language?: string;
  submissions: number;
  reviews: number;
  corrections: number;
  allSubmissionBadgesCreated: boolean;
  allReviewBadgesCreated: boolean;
  allCorrectionBadgesCreated: boolean;
}

interface Badge {
  value: number;
  text: string;
  language?: string;
  badgeUnlocked: boolean;
}
@Component({
  selector: 'contributor-badge',
  templateUrl: './contributor-badge.component.html',
  styleUrls: []
})
export class ContributorBadgeComponent {
  @ViewChild('dropdown', {'static': false}) dropdownRef!: ElementRef;
  @ViewChild(
    'mobileDropdown', {'static': false}
  ) mobileDropdownRef!: ElementRef;

  @ViewChild(
    'mobileBadgeTypeDropdown', {'static': false}
  ) mobileBadgeTypeDropdownRef!: ElementRef;

  totalTranslationStats = {};
  translationBadges = {};
  languages = [];
  questionBadges: Badge[];
  questionSubmissionBadges: Badge[];
  questionReviewBadges: Badge[];
  questionCorrectionBadges: Badge[];
  totalQuestionStats: TotalContributionsAndReviews = {
    submissions: 0,
    reviews: 0,
    corrections: 0,
    allSubmissionBadgesCreated: false,
    allReviewBadgesCreated: false,
    allCorrectionBadgesCreated: false
  };

  dropdownShown = false;
  mobileDropdownShown = false;
  mobileBadgeTypeDropdownShown = false;
  mobileTranslationBadgesShown = true;
  selectedLanguage = '';
  dataLoading = false;
  userCanReviewTranslationSuggestion: boolean;
  userCanReviewQuestionSuggestions: boolean;
  userCanSuggestQuestions: boolean;
  reviewableLanguages = [];
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
    userContributionRights.can_review_translation_for_language_codes.map(
      (code) => {
        const languageDescription = this.languageUtilService
          .getAudioLanguageDescription(
            code);
        this.totalTranslationStats[languageDescription] = {
          language: this.languageUtilService.getShortLanguageDescription(
            languageDescription),
          submissions: 0,
          reviews: 0,
          corrections: 0,
          allSubmissionBadgesCreated: false,
          allReviewBadgesCreated: false,
          allCorrectionBadgesCreated: false
        };
        this.reviewableLanguages.push(languageDescription);
      });
    this.userCanReviewQuestionSuggestions = (
      userContributionRights.can_review_questions);
    this.userCanSuggestQuestions = (
      userContributionRights.can_suggest_questions);

    const response = await this.contributionAndReviewStatsService.fetchAllStats(
      username);

    if (response.translation_contribution_stats.length > 0) {
      await response.translation_contribution_stats.map((stat) => {
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
            corrections: 0,
            allSubmissionBadgesCreated: false,
            allReviewBadgesCreated: false,
            allCorrectionBadgesCreated: false
          };
        } else {
          this.totalTranslationStats[languageDescription].submissions += (
            stat.accepted_translations_count);
        }
      });
    }
    if (response.translation_review_stats.length > 0) {
      await response.translation_review_stats.map((stat) => {
        const languageDescription =
          this.languageUtilService.getAudioLanguageDescription(
            stat.language_code);

        this.totalTranslationStats[languageDescription].reviews += (
          stat.reviewed_translations_count);
        this.totalTranslationStats[languageDescription].corrections += (
          stat.accepted_translations_with_reviewer_edits_count);
      });
    }
    if (response.question_contribution_stats.length > 0) {
      response.question_contribution_stats.map((stat) => {
        this.totalQuestionStats.submissions = stat.accepted_questions_count;
      });
    }
    if (response.question_review_stats.length > 0) {
      response.question_review_stats.map((stat) => {
        this.totalQuestionStats.reviews = stat.reviewed_questions_count;
        this.totalQuestionStats.corrections = (
          stat.accepted_questions_with_reviewer_edits_count);
      });
    }

    for (let language in this.totalTranslationStats) {
      const predefinedTranslationBadges = this.getPredefinedBadges(
        this.totalTranslationStats[language]);
      const nonPredefinedTranslationBadges = this.getNonPredefinedBadges(
        this.totalTranslationStats[language]);
      const allBadges = predefinedTranslationBadges.concat(
        nonPredefinedTranslationBadges);

      this.translationBadges[language] = {};
      this.translationBadges[language][
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION] = allBadges.filter(
        badge => badge.text === AppConstants.
          CONTRIBUTION_STATS_SUBTYPE_SUBMISSION);
      this.translationBadges[language][
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW] = allBadges.filter(
        badge => badge.text === AppConstants.
          CONTRIBUTION_STATS_SUBTYPE_REVIEW);
      this.translationBadges[language][
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION] = allBadges.filter(
        badge => badge.text === AppConstants.
          CONTRIBUTION_STATS_SUBTYPE_CORRECTION);
    }

    const predefinedQuestionBadges = this.getPredefinedBadges(
      this.totalQuestionStats);
    const nonPredefinedQuestionBadges = this.getNonPredefinedBadges(
      this.totalQuestionStats);

    this.questionBadges = predefinedQuestionBadges.concat(
      nonPredefinedQuestionBadges);
    this.questionSubmissionBadges = this.questionBadges.filter(
      badge => badge.text === AppConstants.
        CONTRIBUTION_STATS_SUBTYPE_SUBMISSION);
    this.questionReviewBadges = this.questionBadges.filter(
      badge => badge.text === AppConstants.
        CONTRIBUTION_STATS_SUBTYPE_REVIEW);
    this.questionCorrectionBadges = this.questionBadges.filter(
      badge => badge.text === AppConstants.
        CONTRIBUTION_STATS_SUBTYPE_CORRECTION);

    this.languages = Object.keys(this.totalTranslationStats);

    if (this.languages.length > 0) {
      this.selectedLanguage = this.languages[0];
      this.userCanReviewTranslationSuggestion = (
        this.reviewableLanguages.includes(this.selectedLanguage));
    }
    this.dataLoading = false;
  }

  getPredefinedBadges(data: TotalContributionsAndReviews): Badge[] {
    const badges: Badge[] = [];

    AppConstants.CONTRIBUTOR_BADGE_INITIAL_LEVELS.map((value) => {
      if (!data.allSubmissionBadgesCreated) {
        if (data.submissions >= value) {
          badges.push(
            this.createBadgeObject(
              value,
              AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION,
              true, data.language));
        } else {
          badges.push(
            this.createBadgeObject(
              (value - data.submissions),
              AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION,
              false, data.language));
          data.allSubmissionBadgesCreated = true;
        }
      }
      if (!data.allReviewBadgesCreated) {
        if (data.reviews >= value) {
          badges.push(
            this.createBadgeObject(
              value,
              AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW,
              true, data.language));
        } else {
          badges.push(
            this.createBadgeObject(
              (value - data.reviews),
              AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW,
              false, data.language));
          data.allReviewBadgesCreated = true;
        }
      }
      if (!data.allCorrectionBadgesCreated) {
        if (data.corrections >= value) {
          badges.push(
            this.createBadgeObject(
              value,
              AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION,
              true, data.language));
        } else {
          badges.push(
            this.createBadgeObject(
              (value - data.corrections),
              AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION,
              false, data.language));
          data.allCorrectionBadgesCreated = true;
        }
      }
    });

    return badges;
  }

  getNonPredefinedBadges(data: TotalContributionsAndReviews): Badge[] {
    const badges: Badge[] = [];

    let count = 1000;

    while (
      !data.allSubmissionBadgesCreated ||
      !data.allReviewBadgesCreated ||
      !data.allCorrectionBadgesCreated) {
      if (!data.allSubmissionBadgesCreated) {
        if (data.submissions >= count) {
          badges.push(
            this.createBadgeObject(
              count,
              AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION,
              true, data.language));
        } else {
          badges.push(
            this.createBadgeObject(
              (count - data.submissions),
              AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION,
              false, data.language));
          data.allSubmissionBadgesCreated = true;
        }
      }
      if (!data.allReviewBadgesCreated) {
        if (data.reviews >= count) {
          badges.push(
            this.createBadgeObject(
              count,
              AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW,
              true, data.language));
        } else {
          badges.push(
            this.createBadgeObject(
              (count - data.reviews),
              AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW,
              false, data.language));
          data.allReviewBadgesCreated = true;
        }
      }
      if (!data.allCorrectionBadgesCreated) {
        if (data.corrections >= count) {
          badges.push(
            this.createBadgeObject(
              count,
              AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION,
              true, data.language));
        } else {
          badges.push(
            this.createBadgeObject(
              (count - data.corrections),
              AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION,
              false, data.language));
          data.allCorrectionBadgesCreated = true;
        }
      }

      count += 500;
    }
    return badges;
  }

  createBadgeObject(
      value: number,
      text: string,
      badgeUnlocked: boolean,
      language?: string): Badge {
    const badge: Badge = {
      value,
      text,
      badgeUnlocked
    };
    if (language) {
      badge.language = language;
    }

    return badge;
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

  selectBadgeType(mobileTranslationBadgesShown: boolean): void {
    this.mobileTranslationBadgesShown = mobileTranslationBadgesShown;
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
