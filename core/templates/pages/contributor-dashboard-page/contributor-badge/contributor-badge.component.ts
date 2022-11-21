import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { AppConstants } from 'app.constants';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { UserService } from 'services/user.service';
import { ContributionAndReviewStatsService } from '../services/contribution-and-review-stats.service';

interface ContributionCounts {
  language?: string;
  submissions: number;
  reviews: number;
  corrections: number;
}

interface Badge {
  contributionCount: number;
  text: string;
  language?: string;
  isUnlocked: boolean;
}

export enum MobileBadgeType {
  Question = 'Question',
  Translation = 'Translation',
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

  totalTranslationStats: {[key: string]: ContributionCounts} = {};
  translationBadges: {[key: string]: {[key: string]: Badge[]}} = {};
  languages = [];
  questionSubmissionBadges: Badge[];
  questionReviewBadges: Badge[];
  questionCorrectionBadges: Badge[];
  totalQuestionStats: ContributionCounts = {
    submissions: 0,
    reviews: 0,
    corrections: 0
  };

  dropdownShown = false;
  mobileDropdownShown = false;
  mobileBadgeTypeDropdownShown = false;
  mobileBadgeTypeSelected = MobileBadgeType.Translation;
  selectedLanguage = '';
  dataLoading = false;
  userCanReviewTranslationSuggestion: boolean;
  userCanReviewQuestionSuggestions: boolean;
  userCanSuggestQuestions: boolean;
  userHasQuestionRights: boolean;
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
      (languageCode) => {
        const languageDescription = this.languageUtilService
          .getAudioLanguageDescription(
            languageCode);
        this.totalTranslationStats[languageDescription] = {
          language: this.languageUtilService.getShortLanguageDescription(
            languageDescription),
          submissions: 0,
          reviews: 0,
          corrections: 0
        };
        this.reviewableLanguages.push(languageDescription);
      });
    this.userCanReviewQuestionSuggestions = (
      userContributionRights.can_review_questions);
    this.userCanSuggestQuestions = (
      userContributionRights.can_suggest_questions);
    this.userHasQuestionRights = (
      this.userCanSuggestQuestions ||
      this.userCanReviewQuestionSuggestions);

    const allContributionStats = await this
      .contributionAndReviewStatsService.fetchAllStats(username);

    if (allContributionStats.translation_contribution_stats.length > 0) {
      await allContributionStats.translation_contribution_stats.map((stat) => {
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
      await allContributionStats.translation_review_stats.map((stat) => {
        const languageDescription =
          this.languageUtilService.getAudioLanguageDescription(
            stat.language_code);

        this.totalTranslationStats[languageDescription].reviews += (
          stat.reviewed_translations_count);
        this.totalTranslationStats[languageDescription].corrections += (
          stat.accepted_translations_with_reviewer_edits_count);
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
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION);
    }
    if (this.userCanReviewQuestionSuggestions) {
      this.questionReviewBadges = this.getObtainedBadges(
        this.totalQuestionStats.reviews,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW);
      this.questionCorrectionBadges = this.getObtainedBadges(
        this.totalQuestionStats.corrections,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION);
    }

    this.languages = Object.keys(this.totalTranslationStats);

    if (this.languages.length > 0) {
      this.selectedLanguage = this.languages[0];
      this.userCanReviewTranslationSuggestion = (
        this.reviewableLanguages.includes(this.selectedLanguage));
    }
    this.dataLoading = false;
    console.log(this.translationBadges);
    console.log(this.questionSubmissionBadges);
  }

  getObtainedBadges(
      contributionCount: number,
      contributionSubType: string, language?: string): Badge[] {
    const badges: Badge[] = [];
    let level = 0;
    let index = 0;
    while (contributionCount >= level) {
      if (AppConstants.CONTRIBUTOR_BADGE_INITIAL_LEVELS.length > index) {
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
        return badges;
      }
    }
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
