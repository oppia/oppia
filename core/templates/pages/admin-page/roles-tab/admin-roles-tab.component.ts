// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the Roles tab in the admin panel.
 */

import { Component, Output, EventEmitter} from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { AdminBackendApiService, RoleToActionsBackendResponse, UserRolesBackendResponse } from 'domain/admin/admin-backend-api.service';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { AdminDataService } from '../services/admin-data.service';
import { AdminTaskManagerService } from '../services/admin-task-manager.service';

export interface ViewUserRolesAction {
    filterCriterion: string;
    role: string;
    username: string;
    isValid: () => boolean;
}

export interface UpdateRoleAction {
    newRole: string;
    username: string;
    topicId: string;
    isValid: () => boolean;
}

export interface ViewContributionReviewersAction {
  category: string;
  filterCriterion: string;
  isValid: () => boolean;
  languageCode: string;
  username: string;
}

export interface AddContributionRightsAction {
  category: string;
  isValid: () => boolean;
  languageCode: string;
  username: string;
}

export interface RemoveContributionRightsAction {
  category: string;
  isValid: () => boolean;
  languageCode: string;
  method: string;
  username: string
}

export interface AdminRolesFormData {
  viewUserRoles: ViewUserRolesAction;
  updateRole: UpdateRoleAction;
  viewContributionReviewers: ViewContributionReviewersAction;
  addContributionReviewer: AddContributionRightsAction;
  removeContributionReviewer: RemoveContributionRightsAction;
}

export interface ContributionReviewersResult {
  usernames: string[] | null;
  translationLanguages: string[];
  voiceoverLanguages: string[];
  questions: boolean | null;
  'can_submit_questions': boolean | null;
}

@Component({
  selector: 'oppia-admin-roles-tab',
  templateUrl: './admin-roles-tab.component.html'
})
export class AdminRolesTabComponent {
  @Output() setStatusMessage: EventEmitter<string> = new EventEmitter();
  userRolesResult: UserRolesBackendResponse = null;
  resultRolesVisible: boolean = false;
  languageCodesAndDescriptions: { id: string; description: string; }[];
  contributionReviewersResult: ContributionReviewersResult = null;
  contributionReviewersDataFetched: boolean = false;
  topicSummaries: CreatorTopicSummary[] = null;
  roleToActions: RoleToActionsBackendResponse = null;
  formData: AdminRolesFormData;
  ACTION_REMOVE_ALL_REVIEW_RIGHTS = (
    AppConstants.ACTION_REMOVE_ALL_REVIEW_RIGHTS);
  ACTION_REMOVE_SPECIFIC_CONTRIBUTION_RIGHTS = (
    AppConstants.ACTION_REMOVE_SPECIFIC_CONTRIBUTION_RIGHTS);
  USER_FILTER_CRITERION_USERNAME = AppConstants.USER_FILTER_CRITERION_USERNAME;
  USER_FILTER_CRITERION_ROLE = AppConstants.USER_FILTER_CRITERION_ROLE;
  UPDATABLE_ROLES: UserRolesBackendResponse = {};
  VIEWABLE_ROLES: UserRolesBackendResponse = {};
  CONTRIBUTION_RIGHT_CATEGORIES = {
    REVIEW_TRANSLATION: (
      AppConstants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION),
    REVIEW_VOICEOVER: AppConstants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER,
    REVIEW_QUESTION: AppConstants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION,
    SUBMIT_QUESTION: AppConstants.CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION
  };

  constructor(
    private adminBackendApiService: AdminBackendApiService,
    private adminDataService: AdminDataService,
    private adminTaskManagerService: AdminTaskManagerService,
    private languageUtilService: LanguageUtilService,
  ) {}

  ngOnInit(): void {
    this.refreshFormData();
    this.setStatusMessage.emit('');

    this.languageCodesAndDescriptions = (
      this.languageUtilService.getAllVoiceoverLanguageCodes().map(
        (languageCode) => {
          return {
            id: languageCode,
            description: (
              this.languageUtilService.getAudioLanguageDescription(
                languageCode))
          };
        }));

    this.adminDataService.getDataAsync().then((adminDataObject) => {
      this.UPDATABLE_ROLES = adminDataObject.updatableRoles;
      this.VIEWABLE_ROLES = adminDataObject.viewableRoles;
      this.topicSummaries = adminDataObject.topicSummaries;
      this.roleToActions = adminDataObject.roleToActions;
    });
  }

  handleErrorResponse(errorResponse: string): void {
    this.setStatusMessage.emit('Server error: ' + errorResponse);
  }

  getLanguageDescriptions(languageCodes: string[]): string[] {
    let languageDescriptions = [];
    languageCodes.forEach((languageCode) => {
      languageDescriptions.push(
        this.languageUtilService.getAudioLanguageDescription(
          languageCode));
    });
    return languageDescriptions;
  }

  isLanguageSpecificReviewCategory(reviewCategory: string): boolean {
    return (
      reviewCategory ===
      AppConstants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION ||
      reviewCategory ===
      AppConstants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER);
  }

  submitRoleViewForm(formResponse: ViewUserRolesAction): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }

    this.setStatusMessage.emit('Processing query...');

    this.adminTaskManagerService.startTask();
    this.userRolesResult = {};
    this.adminBackendApiService.viewUsersRoleAsync(
      formResponse.filterCriterion, formResponse.role,
      formResponse.username
    ).then((userRoles) => {
      this.userRolesResult = userRoles;
      if (Object.keys(this.userRolesResult).length === 0) {
        this.resultRolesVisible = false;
        this.setStatusMessage.emit('No results.');
      } else {
        this.resultRolesVisible = true;
        this.setStatusMessage.emit('Success.');
      }
      this.refreshFormData();
    }, this.handleErrorResponse.bind(this));
    this.adminTaskManagerService.finishTask();
  }

  submitUpdateRoleForm(formResponse: UpdateRoleAction): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    this.setStatusMessage.emit('Updating User Role');
    this.adminTaskManagerService.startTask();
    this.adminBackendApiService.updateUserRoleAsync(
      formResponse.newRole, formResponse.username,
      formResponse.topicId
    ).then(() => {
      this.setStatusMessage.emit(
        'Role of ' + formResponse.username + ' successfully updated to ' +
        formResponse.newRole);
      this.refreshFormData();
    }, this.handleErrorResponse.bind(this));
    this.adminTaskManagerService.finishTask();
  }

  submitAddContributionRightsForm(
      formResponse: AddContributionRightsAction): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    this.setStatusMessage.emit('Adding new reviewer...');
    this.adminTaskManagerService.startTask();
    this.adminBackendApiService.addContributionReviewerAsync(
      formResponse.category, formResponse.username,
      formResponse.languageCode
    ).then(() => {
      this.setStatusMessage.emit(
        'Successfully added "' + formResponse.username + '" as ' +
        formResponse.category + ' reviewer.');
      this.refreshFormData();
    }, this.handleErrorResponse.bind(this));
    this.adminTaskManagerService.finishTask();
  }

  submitViewContributorUsersForm(
      formResponse: ViewContributionReviewersAction): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    this.setStatusMessage.emit('Processing query...');
    this.adminTaskManagerService.startTask();
    this.contributionReviewersResult = {
      usernames: null,
      translationLanguages: [],
      voiceoverLanguages: [],
      questions: null,
      can_submit_questions: null
    };
    if (formResponse.filterCriterion ===
      AppConstants.USER_FILTER_CRITERION_ROLE) {
      this.adminBackendApiService.viewContributionReviewersAsync(
        formResponse.category, formResponse.languageCode
      ).then((usersObject) => {
        this.contributionReviewersResult.usernames = (
          usersObject.usernames);
        if (this.contributionReviewersResult.usernames.length === 0) {
          this.contributionReviewersDataFetched = false;
          this.setStatusMessage.emit('No results.');
        } else {
          this.contributionReviewersDataFetched = true;
          this.setStatusMessage.emit('Success.');
        }
        this.refreshFormData();
      }, this.handleErrorResponse.bind(this));
    } else {
      let translationLanguages = [];
      let voiceoverLanguages = [];
      this.adminBackendApiService.contributionReviewerRightsAsync(
        formResponse.username
      ).then((contributionRights) => {
        translationLanguages = this.getLanguageDescriptions(
          contributionRights.can_review_translation_for_language_codes);
        voiceoverLanguages = this.getLanguageDescriptions(
          contributionRights.can_review_voiceover_for_language_codes);
        this.contributionReviewersResult = {
          usernames: null,
          translationLanguages: translationLanguages,
          voiceoverLanguages: voiceoverLanguages,
          questions: contributionRights.can_review_questions,
          can_submit_questions: contributionRights.can_submit_questions
        };
        this.contributionReviewersDataFetched = true;
        this.setStatusMessage.emit('Success.');
      }, this.handleErrorResponse.bind(this));
    }
    this.adminTaskManagerService.finishTask();
  }

  submitRemoveContributionRightsForm(
      formResponse: RemoveContributionRightsAction): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    this.setStatusMessage.emit('Processing query...');
    this.adminTaskManagerService.startTask();
    this.adminBackendApiService.removeContributionReviewerAsync(
      formResponse.username, formResponse.method,
      formResponse.category, formResponse.languageCode
    ).then(() => {
      this.setStatusMessage.emit('Success.');
      this.refreshFormData();
    }, this.handleErrorResponse.bind(this));
    this.adminTaskManagerService.finishTask();
  }

  refreshFormData(): void {
    let that = this;
    this.formData = {
      viewUserRoles: {
        filterCriterion: AppConstants.USER_FILTER_CRITERION_ROLE,
        role: null,
        username: '',
        isValid: function() {
          if (this.filterCriterion ===
            AppConstants.USER_FILTER_CRITERION_ROLE) {
            return Boolean(this.role);
          }
          if (this.filterCriterion ===
            AppConstants.USER_FILTER_CRITERION_USERNAME) {
            return Boolean(this.username);
          }
          return false;
        }
      },
      updateRole: {
        newRole: null,
        username: '',
        topicId: null,
        isValid: function() {
          if (this.newRole === 'TOPIC_MANAGER') {
            return Boolean(this.topicId);
          } else if (this.newRole) {
            return Boolean(this.username);
          }
          return false;
        }
      },
      viewContributionReviewers: {
        filterCriterion: AppConstants.USER_FILTER_CRITERION_ROLE,
        username: '',
        category: null,
        languageCode: null,
        isValid: function() {
          if (this.filterCriterion ===
            AppConstants.USER_FILTER_CRITERION_ROLE) {
            if (this.category === null) {
              return false;
            }
            if (that.isLanguageSpecificReviewCategory(this.category)) {
              return Boolean(this.languageCode);
            }
            return true;
          }

          if (this.filterCriterion ===
            AppConstants.USER_FILTER_CRITERION_USERNAME) {
            return Boolean(this.username);
          }
        }
      },
      addContributionReviewer: {
        username: '',
        category: null,
        languageCode: null,
        isValid: function() {
          if (this.username === '') {
            return false;
          }
          if (this.category === null) {
            return false;
          }
          if (that.isLanguageSpecificReviewCategory(this.category)) {
            return Boolean(this.languageCode);
          }
          return true;
        }
      },
      removeContributionReviewer: {
        username: '',
        method: AppConstants.ACTION_REMOVE_ALL_REVIEW_RIGHTS,
        category: null,
        languageCode: null,
        isValid: function() {
          if (this.username === '') {
            return false;
          }
          if (this.method === AppConstants.ACTION_REMOVE_ALL_REVIEW_RIGHTS) {
            return Boolean(this.username);
          } else {
            if (this.category === null) {
              return false;
            }
            if (that.isLanguageSpecificReviewCategory(this.category)) {
              return Boolean(this.languageCode);
            }
            return true;
          }
        }
      }
    };
  }

  clearResults(): void {
    this.contributionReviewersDataFetched = false;
    this.resultRolesVisible = false;
    this.userRolesResult = {};
    this.contributionReviewersResult = null;
  }
}

angular.module('oppia').directive('oppiaAdminRolesTab',
  downgradeComponent({
    component: AdminRolesTabComponent
  }) as angular.IDirectiveFactory);
