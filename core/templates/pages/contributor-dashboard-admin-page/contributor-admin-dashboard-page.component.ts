// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the feedback Updates page.
 */

import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, HostListener } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service';
import './contributor-admin-dashboard-page.component.css';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ContributorDashboardAdminStatsBackendApiService, translationReviewersCount } from './services/contributor-dashboard-admin-stats-backend-api.service';
import { AppConstants } from 'app.constants';
import { ContributorAdminDashboardFilter } from './contributor-admin-dashboard-filter.model';
import { UserService } from 'services/user.service';


interface LangaugeChoice {
  id: string;
  language: string;
}

export interface TopicChoice {
  id: string;
  topic: string;
}

@Component({
  selector: 'contributor-admin-dashboard-page',
  styleUrls: ['./contributor-admin-dashboard-page.component.css'],
  templateUrl: './contributor-admin-dashboard-page.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ContributorAdminDashboardPageComponent implements OnInit {
  @ViewChild('languageDropdown', {'static': false}) dropdown1Ref!: ElementRef;
  @ViewChild('activityDropdown', {'static': false}) dropdown2Ref!: ElementRef;

  languageDropdownShown: boolean = false;
  activityDropdownShown: boolean = false;
  activeTab!: string;
  TAB_NAME_TRANSLATION_SUBMITTER: string = 'Translation Submitter';
  TAB_NAME_TRANSLATION_REVIEWER: string = 'Translation Reviewer';
  TAB_NAME_QUESTION_SUBMITTER: string = 'Question Submitter';
  TAB_NAME_QUESTION_REVIEWER: string = 'Question Reviewer';
  translationReviewersCountByLanguage!: translationReviewersCount;
  translationReviewersCount: number = 0;
  questionReviewersCount: number = 0;
  CONTRIBUTION_TYPES: string[] = [];
  assignedLanguageIds: string[] = [];
  selectedContributionType!: string;
  isQuestionCoordinator!: boolean;
  isTranslationCoordinator!: boolean;

  selectedLanguage: string;
  selectedLanguageId: string;
  selectedLastActivity: number;
  selectedTopics: string[] = [];
  allTopicNames: string[] = [];

  languages: LangaugeChoice[] = [];
  lastActivty: number[] = [];
  filter!: ContributorAdminDashboardFilter;

  topics: TopicChoice[] = [];

  constructor(
    private windowRef: WindowRef,
    private changeDetectorRef: ChangeDetectorRef,
    private contributorDashboardAdminStatsBackendApiService:
      ContributorDashboardAdminStatsBackendApiService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.activeTab = this.TAB_NAME_TRANSLATION_SUBMITTER;
    this.contributorDashboardAdminStatsBackendApiService
      .fetchCommunityStats().then(
        (response) => {
          this.translationReviewersCountByLanguage = (
            response.translation_reviewers_count);
          this.questionReviewersCount = response.question_reviewers_count;
        });

    this.languages = AppConstants.SUPPORTED_AUDIO_LANGUAGES.map(
      (languageItem) => {
        return {
          id: languageItem.id,
          language: languageItem.description
        };
      }
    );

    this.userService.getUserInfoAsync().then(userInfo => {
      const username = userInfo.getUsername();
      if (username === null) {
        return;
      }
      this.isQuestionCoordinator = userInfo.isQuestionCoordinator();
      this.isTranslationCoordinator = userInfo.isTranslationCoordinator();

      if (this.isTranslationCoordinator) {
        this.CONTRIBUTION_TYPES.push(
          this.TAB_NAME_TRANSLATION_SUBMITTER,
          this.TAB_NAME_TRANSLATION_REVIEWER);
      }
      if (this.isQuestionCoordinator) {
        this.CONTRIBUTION_TYPES.push(
          this.TAB_NAME_QUESTION_SUBMITTER,
          this.TAB_NAME_QUESTION_REVIEWER);
      }

      this.updateSelectedContributionType(this.CONTRIBUTION_TYPES[0]);


      this.contributorDashboardAdminStatsBackendApiService
        .fetchAssignedLanguageIds(username).then(
          (response) => {
            this.assignedLanguageIds = response;
            this.languages = this.languages.filter((
                languageItem) =>
              this.assignedLanguageIds.includes(languageItem.id));
            this.selectedLanguage = this.languages[0].language;
            this.selectedLanguageId = this.languages[0].id;
          });

      this.filter = new ContributorAdminDashboardFilter(
        [],
        this.selectedLanguageId,
        null,
        this.selectedLastActivity);

      this.changeDetectorRef.detectChanges();
    });

    this.lastActivty = [7, 30, 90];

    this.contributorDashboardAdminStatsBackendApiService
      .fetchTopicsData().then(
        (response) => {
          this.topics = response;
          response.map((
              topic) =>
            this.allTopicNames.push(topic.topic));
        }
      );
  }

  toggleLanguageDropdown(): void {
    this.languageDropdownShown = !this.languageDropdownShown;
  }

  toggleActivityDropdown(): void {
    this.activityDropdownShown = !this.activityDropdownShown;
  }

  applyTopicFilter(): void {
    const selectedTopicsIds: string[] = this.selectedTopics.map((
        selectedTopic) => {
      const matchingTopic = this.topics.find(
        (topicChoice) => topicChoice.topic === selectedTopic);
      return matchingTopic ? matchingTopic.id : '';
    });
    this.filter = new ContributorAdminDashboardFilter(
      selectedTopicsIds,
      this.selectedLanguageId,
      null,
      this.selectedLastActivity);
  }

  selectLanguage(language: string): void {
    const currentOption = this.languages.find(
      (option) => option.language === language);
    this.selectedLanguage = currentOption?.language;
    this.selectedLanguageId = currentOption?.id;
    this.translationReviewersCount = this.translationReviewersCountByLanguage[
      this.selectedLanguageId];
    this.filter = new ContributorAdminDashboardFilter(
      [],
      this.selectedLanguageId,
      null,
      this.selectedLastActivity);
    this.languageDropdownShown = false;
  }

  selectLastActivity(lastActive: number): void {
    this.selectedLastActivity = lastActive;
    this.filter = new ContributorAdminDashboardFilter(
      [],
      this.selectedLanguageId,
      null,
      this.selectedLastActivity);
    this.activityDropdownShown = false;
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
    this.changeDetectorRef.detectChanges();
  }

  checkMobileView(): boolean {
    return (this.windowRef.nativeWindow.innerWidth < 800);
  }


  updateSelectedContributionType(selectedContributionType: string): void {
    this.selectedContributionType = selectedContributionType;
    this.setActiveTab(selectedContributionType);
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
      !this.dropdown1Ref.nativeElement.contains(targetElement)
    ) {
      this.languageDropdownShown = false;
    }
    if (
      targetElement &&
      !this.dropdown2Ref.nativeElement.contains(targetElement)
    ) {
      this.activityDropdownShown = false;
    }
  }
}

angular.module('oppia').directive('contributorAdminDashboardPage',
  downgradeComponent({
    component: ContributorAdminDashboardPageComponent
  }) as angular.IDirectiveFactory);
