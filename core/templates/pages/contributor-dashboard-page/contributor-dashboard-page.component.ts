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
 * @fileoverview Component for the contributor dashboard page.
 */

import {AppConstants} from 'app.constants';
import {Component, OnInit} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {
  ContributorDashboardConstants,
  ContributorDashboardTabsDetails,
} from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';
import {ContributionAndReviewService} from './services/contribution-and-review.service';
import {ContributionOpportunitiesService} from './services/contribution-opportunities.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {LocalStorageService} from 'services/local-storage.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {TranslationTopicService} from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import {UserService} from 'services/user.service';

@Component({
  selector: 'contributor-dashboard-page',
  templateUrl: './contributor-dashboard-page.component.html',
  styleUrls: ['./contributor-dashboard-page.component.css'],
})
export class ContributorDashboardPageComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  defaultHeaderVisible!: boolean;
  profilePicturePngDataUrl!: string;
  profilePictureWebpDataUrl!: string;
  userInfoIsLoading!: boolean;
  userIsLoggedIn!: boolean;
  userIsReviewer!: boolean;
  userCanReviewTranslationSuggestionsInLanguages!: string[];
  userCanReviewVoiceoverSuggestionsInLanguages!: string[];
  userCanReviewQuestions!: boolean;
  tabsDetails!: ContributorDashboardTabsDetails;
  OPPIA_AVATAR_IMAGE_URL!: string;
  languageCode!: string;
  topicId!: string;
  activeEntityType: string =
    ContributorDashboardConstants.ENTITY_TYPE_SENTINEL_ALL;
  activeTabName!: string;
  // The following property is set to null when the
  // user is not logged in.
  username: string | null = null;

  constructor(
    private contributionAndReviewService: ContributionAndReviewService,
    private contributionOpportunitiesService: ContributionOpportunitiesService,
    private focusManagerService: FocusManagerService,
    private languageUtilService: LanguageUtilService,
    private localStorageService: LocalStorageService,
    private platformFeatureService: PlatformFeatureService,
    private translationLanguageService: TranslationLanguageService,
    private translationTopicService: TranslationTopicService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService
  ) {}

  onTabClick(activeTabName: string): void {
    this.activeTabName = activeTabName;

    // The setTimeout is required to ensure that focus is applied only
    // after all the functions in main thread have executed.
    if (this.activeTabName === 'translateTextTab') {
      setTimeout(() => {
        this.focusManagerService.setFocusWithoutScroll('selectLangDropDown');
      }, 5);
    }
  }

  provideLanguageForProtractorClass(languageDescription: string): string {
    const lang = languageDescription.split(' ').join('-').toLowerCase();
    return lang.replace(/\(?\)?/g, '');
  }

  onChangeLanguage(languageCode: string): void {
    this.languageCode = languageCode;
    this.translationLanguageService.setActiveLanguageCode(this.languageCode);
    this.localStorageService.updateLastSelectedTranslationLanguageCode(
      this.languageCode
    );
  }

  showLanguageSelector(): boolean {
    const activeTabDetail =
      this.tabsDetails[
        this.activeTabName as keyof ContributorDashboardTabsDetails
      ];
    return activeTabDetail.customizationOptions.includes('language');
  }

  onChangeEntityType(entityType: string): void {
    this.activeEntityType = entityType;
  }

  showEntityTypeSelector(): boolean {
    // My Contributions also holds the question lists and the accomplishments
    // pages, and none of those can be filtered by content type, so the
    // selector is shown there only while translations are on screen. The
    // Translate Text tab lists nothing but translation opportunities.
    const userIsViewingTranslationSuggestions =
      this.contributionAndReviewService.getActiveSuggestionType() ===
      'translate_content';

    return (
      (this.activeTabName === 'translateTextTab' ||
        ((this.activeTabName === 'myContributionTab' || !this.activeTabName) &&
          userIsViewingTranslationSuggestions)) &&
      this.platformFeatureService.status.EnableTranslationOppsWithNewOppModels
        .isEnabled
    );
  }

  onChangeTopic(topicId: string): void {
    this.topicId = topicId;
    this.translationTopicService.setActiveTopicId(this.topicId);
    this.localStorageService.updateLastSelectedTranslationTopicId(this.topicId);
  }

  showTopicSelector(): boolean {
    const activeTabDetail =
      this.tabsDetails[
        this.activeTabName as keyof ContributorDashboardTabsDetails
      ];
    const activeSuggestionType =
      this.contributionAndReviewService.getActiveSuggestionType();
    const activeTabType = this.contributionAndReviewService.getActiveTabType();

    const userIsReviewingQuestionSuggestions =
      activeTabType === 'reviews' &&
      activeSuggestionType === 'add_question' &&
      this.activeTabName !== 'submitQuestionTab';
    const userIsReviewingTranslationSuggestions =
      activeTabType === 'reviews' &&
      activeSuggestionType === 'translate_content' &&
      this.activeTabName !== 'submitQuestionTab';

    return (
      activeTabDetail.customizationOptions.includes('topic') ||
      userIsReviewingQuestionSuggestions ||
      userIsReviewingTranslationSuggestions
    );
  }

  getLanguageDescriptions(languageCodes: string[]): string[] {
    const languageDescriptions: string[] = [];
    languageCodes.forEach(languageCode => {
      languageDescriptions.push(
        this.languageUtilService.getAudioLanguageDescription(languageCode)
      );
    });
    return languageDescriptions;
  }

  ngOnInit(): void {
    this.username = '';
    this.userInfoIsLoading = true;
    this.userIsLoggedIn = false;
    this.userIsReviewer = false;
    this.userCanReviewTranslationSuggestionsInLanguages = [];
    this.userCanReviewVoiceoverSuggestionsInLanguages = [];
    this.userCanReviewQuestions = false;
    this.defaultHeaderVisible = true;

    const prevSelectedTopicId =
      this.localStorageService.getLastSelectedTranslationTopicId();

    this.userService
      .getUserContributionRightsDataAsync()
      .then(userContributionRights => {
        if (userContributionRights === null) {
          throw new Error('User contribution rights not found.');
        }
        this.userCanReviewTranslationSuggestionsInLanguages =
          this.getLanguageDescriptions(
            userContributionRights.can_review_translation_for_language_codes
          );

        this.userCanReviewVoiceoverSuggestionsInLanguages =
          this.getLanguageDescriptions(
            userContributionRights.can_review_voiceover_for_language_codes
          );

        this.userCanReviewQuestions =
          userContributionRights.can_review_questions;

        this.userIsReviewer =
          this.userCanReviewTranslationSuggestionsInLanguages.length > 0 ||
          this.userCanReviewVoiceoverSuggestionsInLanguages.length > 0 ||
          this.userCanReviewQuestions;

        this.tabsDetails.submitQuestionTab.enabled =
          userContributionRights.can_suggest_questions;
      });

    this.userService.getUserInfoAsync().then(userInfo => {
      this.userInfoIsLoading = false;
      this.profilePictureWebpDataUrl =
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH
        );
      this.profilePicturePngDataUrl =
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH
        );
      if (userInfo.isLoggedIn()) {
        this.userIsLoggedIn = true;
        this.username = userInfo.getUsername();
        if (this.username !== null) {
          [this.profilePicturePngDataUrl, this.profilePictureWebpDataUrl] =
            this.userService.getProfileImageDataUrl(this.username);
        }
      } else {
        this.userIsLoggedIn = false;
        this.username = '';
      }
    });

    this.contributionOpportunitiesService
      .getTranslatableTopicsAsync()
      .then(topics => {
        // TODO(#15710): Set default active topic to 'All'.
        if (topics.length <= 0) {
          this.translationTopicService.setActiveTopicId(
            ContributorDashboardConstants.TOPIC_SENTINEL_ID_ALL
          );
          return;
        }
        this.topicId = topics[0].id;
        if (
          prevSelectedTopicId &&
          topics.some(topic => topic.id === prevSelectedTopicId)
        ) {
          this.topicId = prevSelectedTopicId;
        }
        this.translationTopicService.setActiveTopicId(this.topicId);
      });

    this.activeTabName = 'myContributionTab';

    this.tabsDetails = {
      ...ContributorDashboardConstants.CONTRIBUTOR_DASHBOARD_TABS_DETAILS,
      // TODO(#13015): Remove use of unknown as a type.
    } as unknown as ContributorDashboardTabsDetails;
    this.OPPIA_AVATAR_IMAGE_URL =
      this.urlInterpolationService.getStaticCopyrightedImageUrl(
        '/avatar/oppia_avatar_100px.svg'
      );
    this.languageCode = this.translationLanguageService.getActiveLanguageCode();
  }
}
