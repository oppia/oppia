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
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {TranslationTopicService} from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import {UserService} from 'services/user.service';

@Component({
  selector: 'contributor-dashboard-page',
  templateUrl: './contributor-dashboard-page.component.html',
})
export class ContributorDashboardPageComponent implements OnInit {
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
  topicName!: string;
  activeTabName!: string;
  username: string | null = null;

  constructor(
    private contributionAndReviewService: ContributionAndReviewService,
    private contributionOpportunitiesService: ContributionOpportunitiesService,
    private focusManagerService: FocusManagerService,
    private languageUtilService: LanguageUtilService,
    private localStorageService: LocalStorageService,
    private translationLanguageService: TranslationLanguageService,
    private translationTopicService: TranslationTopicService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService
  ) {}

  onTabClick(activeTabName: string): void {
    this.activeTabName = activeTabName;
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
    this.translationLanguageService.setActiveLanguageCode(languageCode);
    this.localStorageService.updateLastSelectedTranslationLanguageCode(
      languageCode
    );
  }

  onChangeTopic(topicName: string): void {
    this.topicName = topicName;
    this.translationTopicService.setActiveTopicName(topicName);
    this.localStorageService.updateLastSelectedTranslationTopicName(topicName);
  }

  showLanguageSelector(): boolean {
    const activeTabDetail =
      this.tabsDetails[
        this.activeTabName as keyof ContributorDashboardTabsDetails
      ];
    return activeTabDetail.customizationOptions.includes('language');
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
    return languageCodes.map(code =>
      this.languageUtilService.getAudioLanguageDescription(code)
    );
  }

  ngOnInit(): void {
    this.userInfoIsLoading = true;
    this.userIsLoggedIn = false;
    this.userIsReviewer = false;
    this.defaultHeaderVisible = true;

    const prevSelectedTopicName =
      this.localStorageService.getLastSelectedTranslationTopicName();

    this.userService
      .getUserContributionRightsDataAsync()
      .then(userContributionRights => {
        if (!userContributionRights) {
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
          this.userCanReviewQuestions ||
          this.userCanReviewTranslationSuggestionsInLanguages.length > 0 ||
          this.userCanReviewVoiceoverSuggestionsInLanguages.length > 0;

        this.tabsDetails.submitQuestionTab.enabled =
          userContributionRights.can_suggest_questions;
      });

    this.userService.getUserInfoAsync().then(userInfo => {
      this.userInfoIsLoading = false;
      this.profilePicturePngDataUrl =
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH
        );
      this.profilePictureWebpDataUrl =
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH
        );

      if (userInfo.isLoggedIn()) {
        this.userIsLoggedIn = true;
        this.username = userInfo.getUsername();
        if (this.username) {
          [this.profilePicturePngDataUrl, this.profilePictureWebpDataUrl] =
            this.userService.getProfileImageDataUrl(this.username);
        }
      }
    });

    //  FIX: Always keep "All" option in topic dropdown
    this.contributionOpportunitiesService
      .getTranslatableTopicNamesAsync()
      .then(topicNames => {
        const allTopicName =
          ContributorDashboardConstants.DEFAULT_OPPORTUNITY_TOPIC_NAME;

        const topicNamesWithAll = [allTopicName, ...topicNames];

        this.topicName = allTopicName;

        if (
          prevSelectedTopicName &&
          topicNamesWithAll.includes(prevSelectedTopicName)
        ) {
          this.topicName = prevSelectedTopicName;
        }

        this.translationTopicService.setActiveTopicName(this.topicName);
      });

    this.activeTabName = 'myContributionTab';

    this.tabsDetails = {
      ...ContributorDashboardConstants.CONTRIBUTOR_DASHBOARD_TABS_DETAILS,
    } as ContributorDashboardTabsDetails;

    this.OPPIA_AVATAR_IMAGE_URL =
      this.urlInterpolationService.getStaticCopyrightedImageUrl(
        '/avatar/oppia_avatar_100px.svg'
      );

    this.languageCode =
      this.translationLanguageService.getActiveLanguageCode();
  }
}