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

import { Component, OnInit } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import AppConstants from 'assets/constants';
import { ContributorDashboardConstants, ContributorDashboardTabsDetails } from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';
import { ContributionAndReviewService } from './services/contribution-and-review.service';
import { ContributionOpportunitiesService } from './services/contribution-opportunities.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { LocalStorageService } from 'services/local-storage.service';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { TranslationTopicService } from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import { UserService } from 'services/user.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'contributor-dashboard-page',
  templateUrl: './contributor-dashboard-page.component.html'
})
export class ContributorDashboardPageComponent
  implements OnInit {
  OPPIA_AVATAR_LINK_URL: string = AppConstants.OPPIA_AVATAR_LINK_URL;
  defaultHeaderVisible: boolean;
  profilePictureDataUrl: SafeUrl | string;
  username: string;
  userInfoIsLoading: boolean;
  userIsLoggedIn: boolean;
  userIsReviewer: boolean;
  userCanReviewTranslationSuggestionsInLanguages: string[];
  userCanReviewVoiceoverSuggestionsInLanguages: string[];
  userCanReviewQuestions: boolean;
  tabsDetails: ContributorDashboardTabsDetails;
  OPPIA_AVATAR_IMAGE_URL: string;
  languageCode: string;
  topicName: string;
  activeTabName: string;

  constructor(
    private contributionAndReviewService: ContributionAndReviewService,
    private contributionOpportunitiesService: ContributionOpportunitiesService,
    private focusManagerService: FocusManagerService,
    private languageUtilService: LanguageUtilService,
    private localStorageService: LocalStorageService,
    private svgSanitizerService: SvgSanitizerService,
    private translationLanguageService: TranslationLanguageService,
    private translationTopicService: TranslationTopicService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
    private windowRef: WindowRef,
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
      this.languageCode);
  }

  showLanguageSelector(): boolean {
    const activeTabDetail = this.tabsDetails[this.activeTabName];
    return activeTabDetail.customizationOptions.includes('language');
  }

  onChangeTopic(topicName: string): void {
    this.topicName = topicName;
    this.translationTopicService.setActiveTopicName(this.topicName);
    this.localStorageService.updateLastSelectedTranslationTopicName(
      this.topicName);
  }

  showTopicSelector(): boolean {
    const activeTabDetail = this.tabsDetails[this.activeTabName];
    const activeSuggestionType =
      this.contributionAndReviewService.getActiveSuggestionType();
    const activeTabType = this.contributionAndReviewService.getActiveTabType();
    return activeTabDetail.customizationOptions.includes('topic') ||
      (
        activeTabType === 'reviews' &&
        activeSuggestionType === 'translate_content' &&
        this.activeTabName !== 'submitQuestionTab'
      );
  }

  scrollFunction(): void {
    if (this.windowRef.nativeWindow.pageYOffset >= 80) {
      this.defaultHeaderVisible = false;
    } else {
      this.defaultHeaderVisible = true;
    }
  }

  getLanguageDescriptions(languageCodes: string[]): string[] {
    const languageDescriptions = [];
    languageCodes.forEach((languageCode) => {
      languageDescriptions.push(
        this.languageUtilService.getAudioLanguageDescription(
          languageCode));
    });
    return languageDescriptions;
  }

  ngOnInit(): void {
    this.profilePictureDataUrl = null;
    this.username = null;
    this.userInfoIsLoading = true;
    this.userIsLoggedIn = false;
    this.userIsReviewer = false;
    this.userCanReviewTranslationSuggestionsInLanguages = [];
    this.userCanReviewVoiceoverSuggestionsInLanguages = [];
    this.userCanReviewQuestions = false;
    this.defaultHeaderVisible = true;

    const prevSelectedTopicName = (
      this.localStorageService.getLastSelectedTranslationTopicName());

    this.windowRef.nativeWindow.addEventListener('scroll', () => {
      this.scrollFunction();
    });

    this.userService.getUserContributionRightsDataAsync().then(
      (userContributionRights) => {
        this.userCanReviewTranslationSuggestionsInLanguages = (
          this.getLanguageDescriptions(
            userContributionRights
              .can_review_translation_for_language_codes));

        this.userCanReviewVoiceoverSuggestionsInLanguages = (
          this.getLanguageDescriptions(
            userContributionRights
              .can_review_voiceover_for_language_codes));

        this.userCanReviewQuestions = (
          userContributionRights.can_review_questions);

        this.userIsReviewer = (
          this.userCanReviewTranslationSuggestionsInLanguages
            .length > 0 ||
          this.userCanReviewVoiceoverSuggestionsInLanguages
            .length > 0 ||
          this.userCanReviewQuestions);

        this.tabsDetails.submitQuestionTab.enabled = (
          userContributionRights.can_suggest_questions);
      });

    this.userService.getUserInfoAsync().then((userInfo) => {
      this.userInfoIsLoading = false;
      if (userInfo.isLoggedIn()) {
        this.userIsLoggedIn = true;
        this.username = userInfo.getUsername();
      } else {
        this.userIsLoggedIn = false;
        this.username = '';
      }
    });

    this.userService.getProfileImageDataUrlAsync().then(
      (dataUrl) => {
        this.profilePictureDataUrl = this.svgSanitizerService
          .getTrustedSvgResourceUrl(dataUrl);
      });

    this.contributionOpportunitiesService.getTranslatableTopicNamesAsync()
      .then((topicNames) => {
        if (topicNames.indexOf(prevSelectedTopicName) !== -1) {
          this.topicName = prevSelectedTopicName;
          this.translationTopicService.setActiveTopicName(this.topicName);
        }
      });

    this.activeTabName = 'myContributionTab';

    this.tabsDetails = {
      ...ContributorDashboardConstants.CONTRIBUTOR_DASHBOARD_TABS_DETAILS
    } as unknown as ContributorDashboardTabsDetails;
    this.OPPIA_AVATAR_IMAGE_URL = (
      this.urlInterpolationService.getStaticImageUrl(
        '/avatar/oppia_avatar_100px.svg'));
    this.languageCode = this.translationLanguageService.getActiveLanguageCode();
  }
}

angular.module('oppia').directive('contributorDashboardPage',
  downgradeComponent({
    component: ContributorDashboardPageComponent
  }) as angular.IDirectiveFactory);
