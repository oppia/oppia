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
import { ContributorDashboardAdminBackendApiService } from './services/contributor-dashboard-admin-backend-api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UsernameInputModal } from './username-input-modal/username-input-modal.component';
import { CdAdminQuestionRoleEditorModal } from './question-role-editor-modal/cd-admin-question-role-editor-modal.component';
import { CdAdminTranslationRoleEditorModal } from './translation-role-editor-modal/cd-admin-translation-role-editor-modal.component';
import isEqual from 'lodash/isEqual';

export interface LanguageChoice {
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
    trigger('lastActivityDropdown', [
      state('expanded', style({ transform: 'rotate(180deg)' })),
      state('collapsed', style({ transform: 'rotate(0)' })),
      transition('expanded => collapsed', animate('200ms ease-out')),
      transition('collapsed => expanded', animate('200ms ease-in')),
    ]),
    trigger('languageDropdownTrigger', [
      state('expanded', style({ transform: 'rotate(180deg)' })),
      state('collapsed', style({ transform: 'rotate(0)' })),
      transition('expanded => collapsed', animate('200ms ease-out')),
      transition('collapsed => expanded', animate('200ms ease-in')),
    ]),
  ],
})
export class ContributorAdminDashboardPageComponent implements OnInit {
  @ViewChild(
    'languageDropdown', {'static': false}) languageDropdownRef!: ElementRef;

  @ViewChild(
    'activityDropdown', {'static': false}) activityDropdownRef!: ElementRef;

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
  selectedContributionType!: string;
  isQuestionCoordinator!: boolean;
  isTranslationCoordinator!: boolean;
  loadingMessage!: string;
  selectedLastActivity!: number;
  allTopicNames: string[] = [];
  lastActivity: number[] = [];
  selectedTopicIds: string[] = [];
  selectedTopicNames: string[] = [];
  languageChoices: LanguageChoice[] = [];
  topics: TopicChoice[] = [];
  topicsAreFetched: string = 'false';
  filter: ContributorAdminDashboardFilter = (
    ContributorAdminDashboardFilter.createDefault());

  selectedLanguage: LanguageChoice = {
    language: '',
    id: ''
  };


  constructor(
    private windowRef: WindowRef,
    private changeDetectorRef: ChangeDetectorRef,
    private contributorDashboardAdminStatsBackendApiService:
      ContributorDashboardAdminStatsBackendApiService,
    private userService: UserService,
    private contributorDashboardAdminBackendApiService:
      ContributorDashboardAdminBackendApiService,
    private modalService: NgbModal,
  ) {}

  ngOnInit(): void {
    this.loadingMessage = 'Loading';
    this.activeTab = this.TAB_NAME_TRANSLATION_SUBMITTER;
    this.contributorDashboardAdminStatsBackendApiService
      .fetchCommunityStats().then(
        response => {
          this.translationReviewersCountByLanguage = (
            response.translation_reviewers_count);
          this.questionReviewersCount = response.question_reviewers_count;

          this.languageChoices = AppConstants.SUPPORTED_AUDIO_LANGUAGES.map(
            languageItem => {
              return {
                id: languageItem.id,
                language:
                  this.putEnglishLanguageNameAtFront(languageItem.description),
              };
            }
          );

          this.selectedLastActivity = 0;

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

              this.contributorDashboardAdminStatsBackendApiService
                .fetchAssignedLanguageIds(username).then(
                  response => {
                    this.languageChoices = this.languageChoices.filter((
                        languageItem) =>
                      response.includes(languageItem.id));
                    this.selectedLanguage = this.languageChoices[0];
                    if (!this.selectedLanguage) {
                      throw new Error(
                        'No languages are assigned to user.');
                    }
                    this.translationReviewersCount = (
                      this.translationReviewersCountByLanguage[
                        this.selectedLanguage.id]);
                  });
            }
            if (this.isQuestionCoordinator) {
              this.CONTRIBUTION_TYPES.push(
                this.TAB_NAME_QUESTION_SUBMITTER,
                this.TAB_NAME_QUESTION_REVIEWER);
            }

            this.createFilter();

            this.updateSelectedContributionType(this.CONTRIBUTION_TYPES[0]);

            this.loadingMessage = '';
            this.changeDetectorRef.detectChanges();
            this.lastActivity = [0, 7, 30, 90];

            this.contributorDashboardAdminStatsBackendApiService
              .fetchTopicChoices().then(
                response => {
                  this.topics = this.filterTopicChoices(response.flat());
                  this.allTopicNames = this.topics.map(
                    topic => topic.topic);
                  this.applyTopicFilter();
                  this.topicsAreFetched = 'true';
                }
              );
          });
        });
  }

  filterTopicChoices(topic: TopicChoice[]): TopicChoice[] {
    let filteredTopic: TopicChoice[] = [];

    topic.forEach((topicItem) => {
      let isTopicPresent: boolean = false;
      filteredTopic.forEach((filteredTopicItem) => {
        if (filteredTopicItem.id === topicItem.id) {
          isTopicPresent = true;
        }
      });
      if (!isTopicPresent) {
        filteredTopic.push(topicItem);
      }
    });

    return filteredTopic;
  }

  private putEnglishLanguageNameAtFront(language: string): string {
    // Check if the language matches the expected format 'abc (something)'.
    const pattern = /(.*)\s*\(([a-zA-Z ]+)\)/;
    const match = language.match(pattern);
    if (!match) {
      return language;
    }
    const originalLanguageName = match[1].trim();
    const englishLanguageName = match[2].trim();
    return `${englishLanguageName} (${originalLanguageName})`;
  }

  toggleLanguageDropdown(): void {
    this.languageDropdownShown = !this.languageDropdownShown;
  }

  toggleActivityDropdown(): void {
    this.activityDropdownShown = !this.activityDropdownShown;
  }

  createFilter(): void {
    const tempFilter = new ContributorAdminDashboardFilter(
      this.selectedTopicIds,
      this.selectedLanguage.id,
      null,
      this.selectedLastActivity);

    if (this.filter === undefined || !isEqual(tempFilter, this.filter)) {
      this.filter = tempFilter;
    }
  }

  applyTopicFilter(): void {
    this.selectedTopicIds = this.selectedTopicNames.map(
      selectedTopic => {
        const matchingTopic = this.topics.find(
          topicChoice => topicChoice.topic === selectedTopic);
        if (!matchingTopic && this.selectedTopicNames.length) {
          throw new Error(
            'Selected Topic Id doesn\'t match any valid topic.');
        }
        return matchingTopic ? matchingTopic.id : '';
      });
    this.createFilter();
  }

  selectLanguage(language: string): void {
    const currentOption: LanguageChoice = this.languageChoices.find(
      option => option.language === language) || {
      language: 'English',
      id: 'en'
    };
    this.selectedLanguage = currentOption;
    this.translationReviewersCount = this.translationReviewersCountByLanguage[
      this.selectedLanguage.id];
    this.createFilter();
  }

  selectLastActivity(lastActive: number): void {
    this.selectedLastActivity = lastActive;
    this.createFilter();
  }

  setActiveTab(tabName: string): void {
    this.createFilter();
    this.activeTab = tabName;
  }

  checkMobileView(): boolean {
    return (this.windowRef.nativeWindow.innerWidth < 800);
  }


  updateSelectedContributionType(selectedContributionType: string): void {
    this.selectedContributionType = selectedContributionType;
    this.setActiveTab(selectedContributionType);
  }

  openUsernameInputModal(): void {
    const modalRef = this.modalService.open(
      UsernameInputModal);
    modalRef.componentInstance.activeTab = this.activeTab;
    modalRef.result.then(results => this.openRoleEditor(results), () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  openCdAdminQuestionRoleEditorModal(username: string): void {
    this.contributorDashboardAdminBackendApiService
      .contributionReviewerRightsAsync(username).then(response => {
        const modelRef = this.modalService.open(
          CdAdminQuestionRoleEditorModal);
        modelRef.componentInstance.username = username;
        modelRef.componentInstance.rights = {
          isQuestionSubmitter: response.can_submit_questions,
          isQuestionReviewer: response.can_review_questions
        };
        modelRef.result.then(results => {
          if (results.isQuestionSubmitter !== response.can_submit_questions) {
            if (results.isQuestionSubmitter) {
              this.contributorDashboardAdminBackendApiService
                .addContributionReviewerAsync(
                  AppConstants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION,
                  username,
                  null
                );
            } else {
              this.contributorDashboardAdminBackendApiService
                .removeContributionReviewerAsync(
                  username,
                  AppConstants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION,
                  null
                );
            }
          }
          if (results.isQuestionReviewer !== response.can_review_questions) {
            if (results.isQuestionReviewer) {
              this.contributorDashboardAdminBackendApiService
                .addContributionReviewerAsync(
                  AppConstants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION,
                  username,
                  null
                );
            } else {
              this.contributorDashboardAdminBackendApiService
                .removeContributionReviewerAsync(
                  username,
                  AppConstants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION,
                  null
                );
            }
          }
        }, () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      });
  }

  openCdAdminTranslationRoleEditorModal(username: string): void {
    this.contributorDashboardAdminBackendApiService
      .contributionReviewerRightsAsync(username).then(response => {
        const modalRef = this.modalService.open(
          CdAdminTranslationRoleEditorModal);
        modalRef.componentInstance.username = username;
        modalRef.componentInstance.assignedLanguageIds = (
          response.can_review_translation_for_language_codes);
        let languageIdToName: Record<string, string> = {};
        AppConstants.SUPPORTED_AUDIO_LANGUAGES.forEach(
          language => languageIdToName[language.id] = language.description);
        modalRef.componentInstance.languageIdToName = languageIdToName;
      });
  }

  openRoleEditor(username: string): void {
    if (this.activeTab === this.TAB_NAME_TRANSLATION_REVIEWER ||
      this.activeTab === this.TAB_NAME_TRANSLATION_SUBMITTER) {
      this.openCdAdminTranslationRoleEditorModal(username);
    } else if (this.activeTab === this.TAB_NAME_QUESTION_SUBMITTER ||
      this.activeTab === this.TAB_NAME_QUESTION_REVIEWER) {
      this.openCdAdminQuestionRoleEditorModal(username);
    }
  }

  /**
  * Close dropdown when outside elements are clicked
  * @param event mouse click event
  */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    if (this.checkMobileView()) {
      return;
    }
    if (this.activeTab === this.TAB_NAME_TRANSLATION_SUBMITTER ||
      this.activeTab === this.TAB_NAME_TRANSLATION_REVIEWER) {
      if (
        targetElement &&
        !this.languageDropdownRef.nativeElement.contains(targetElement)
      ) {
        this.languageDropdownShown = false;
      }
    }
    if (
      targetElement &&
      !this.activityDropdownRef.nativeElement.contains(targetElement)
    ) {
      this.activityDropdownShown = false;
    }
  }
}

angular.module('oppia').directive('contributorAdminDashboardPage',
  downgradeComponent({
    component: ContributorAdminDashboardPageComponent
  }) as angular.IDirectiveFactory);
