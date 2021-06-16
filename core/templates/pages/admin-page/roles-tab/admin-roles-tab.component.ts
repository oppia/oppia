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
import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AdminDataService } from '../services/admin-data.service';
import { AdminTaskManagerService } from '../services/admin-task-manager.service';

@Component({
  selector: 'oppia-admin-roles-tab',
  templateUrl: './admin-roles-tab.component.html'
})
export class AdminRolesTabComponent {
  @Output() setStatusMessage: EventEmitter<string> = new EventEmitter();
  userRolesResult = {};
  resultRolesVisible: boolean = false;
  languageCodesAndDescriptions: { id: string; description: string; }[];
  contributionReviewersResult = {};
  contributionReviewersDataFetched: boolean = false;
  formData: { viewUserRoles: { filterCriterion: any; role: any; username: string; isValid: () => boolean; }; updateRole: { newRole: any; username: string; topicId: any; isValid: () => boolean; }; viewContributionReviewers: { ...; }; addContributionReviewer: { ...; }; removeContributionReviewer: { ...; }; };
  topicSummaries = {};
  roleToActions;

  ACTION_REMOVE_ALL_REVIEW_RIGHTS = AppConstants.ACTION_REMOVE_ALL_REVIEW_RIGHTS;
  ACTION_REMOVE_SPECIFIC_CONTRIBUTION_RIGHTS = AppConstants.ACTION_REMOVE_SPECIFIC_CONTRIBUTION_RIGHTS;
  USER_FILTER_CRITERION_USERNAME = AppConstants.USER_FILTER_CRITERION_USERNAME;
  USER_FILTER_CRITERION_ROLE = AppConstants.USER_FILTER_CRITERION_ROLE;
  UPDATABLE_ROLES = {};
  VIEWABLE_ROLES = {};
  CONTRIBUTION_RIGHT_CATEGORIES = {
    REVIEW_TRANSLATION: AppConstants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION,
    REVIEW_VOICEOVER: AppConstants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER,
    REVIEW_QUESTION: AppConstants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION,
    SUBMIT_QUESTION: AppConstants.CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION
  };


  constructor(
    private adminBackendApiService: AdminBackendApiService,
    private adminDataService: AdminDataService,
    private adminTaskManagerService: AdminTaskManagerService,
    private languageUtilService: LanguageUtilService,
    private urlInterpolationService: UrlInterpolationService
  ) {}


  ngOnInit(): void {
    console.log('ngOnInit');
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
      console.log(adminDataObject);
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
    languageCodes.forEach(function(languageCode) {
      languageDescriptions.push(
        this.languageUtilService.getAudioLanguageDescription(
          languageCode));
    });
    return languageDescriptions;
  }

  isLanguageSpecificReviewCategory(reviewCategory): boolean {
    return (
      reviewCategory === AppConstants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION ||
      reviewCategory === AppConstants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER);
  }

  submitRoleViewForm(formResponse): void {
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
    }, this.handleErrorResponse);
    this.adminTaskManagerService.finishTask();
  }


  submitUpdateRoleForm(formResponse): void {
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
    }, this.handleErrorResponse);
    this.adminTaskManagerService.finishTask();
  }

  submitAddContributionRightsForm(formResponse): void {
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
    }, this.handleErrorResponse);
    this.adminTaskManagerService.finishTask();
  }

  submitViewContributorUsersForm(formResponse): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    this.setStatusMessage.emit('Processing query...');
    this.adminTaskManagerService.startTask();
    this.contributionReviewersResult = {};
    if (formResponse.filterCriterion === AppConstants.USER_FILTER_CRITERION_ROLE) {
      this.adminBackendApiService.viewContributionReviewersAsync(
        formResponse.category, formResponse.languageCode
      ).then((usersObject) => {
        this.contributionReviewersResult.usernames = (
          usersObject.usernames);
        this.contributionReviewersDataFetched = true;
        this.setStatusMessage.emit('Success.');
        this.refreshFormData();
      }, this.handleErrorResponse);
    } else {
      var translationLanguages = [];
      var voiceoverLanguages = [];
      this.adminBackendApiService.contributionReviewerRightsAsync(
        formResponse.username
      ).then((contributionRights) => {
        translationLanguages = this.getLanguageDescriptions(
          contributionRights.can_review_translation_for_language_codes);
        voiceoverLanguages = this.getLanguageDescriptions(
          contributionRights.can_review_voiceover_for_language_codes);
        this.contributionReviewersResult = {
          translationLanguages: translationLanguages,
          voiceoverLanguages: voiceoverLanguages,
          questions: contributionRights.can_review_questions,
          can_submit_questions: contributionRights.can_submit_questions
        };
        this.contributionReviewersDataFetched = true;
        this.setStatusMessage.emit('Success.');
        this.refreshFormData();
      }, this.handleErrorResponse);
    }
    this.adminTaskManagerService.finishTask();
  }


  submitRemoveContributionRightsForm(formResponse): void {
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
    }, this.handleErrorResponse);
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
          if (this.filterCriterion === AppConstants.USER_FILTER_CRITERION_ROLE) {
            return Boolean(this.role);
          }
          if (this.filterCriterion === AppConstants.USER_FILTER_CRITERION_USERNAME) {
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
          if (this.filterCriterion === AppConstants.USER_FILTER_CRITERION_ROLE) {
            if (this.category === null) {
              return false;
            }
            if (that.isLanguageSpecificReviewCategory(this.category)) {
              return Boolean(this.languageCode);
            }
            return true;
          }

          if (this.filterCriterion === AppConstants.USER_FILTER_CRITERION_USERNAME) {
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

  clearResults = function() {
    this.contributionReviewersDataFetched = false;
    this.resultRolesVisible = false;
    this.userRolesResult = {};
    this.contributionReviewersResult = {};
  };
}

angular.module('oppia').directive('oppiaAdminRolesTab',
  downgradeComponent({
    component: AdminRolesTabComponent
  }) as angular.IDirectiveFactory);

// angular.module('oppia').directive('adminRolesTab', [
//   '$rootScope', 'AdminBackendApiService',
//   'AdminDataService', 'AdminTaskManagerService',
//   'LanguageUtilService', 'UrlInterpolationService',
//   'ACTION_REMOVE_ALL_REVIEW_RIGHTS',
//   'ACTION_REMOVE_SPECIFIC_CONTRIBUTION_RIGHTS',
//   'CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION',
//   'CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION',
//   'CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER',
//   'CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION',
//   'USER_FILTER_CRITERION_ROLE', 'USER_FILTER_CRITERION_USERNAME',
//   function(
//       $rootScope, AdminBackendApiService,
//       AdminDataService, AdminTaskManagerService,
//       LanguageUtilService, UrlInterpolationService,
//       ACTION_REMOVE_ALL_REVIEW_RIGHTS,
//       ACTION_REMOVE_SPECIFIC_CONTRIBUTION_RIGHTS,
//       CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION,
//       CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION,
//       CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER,
//       CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION,
//       USER_FILTER_CRITERION_ROLE, USER_FILTER_CRITERION_USERNAME,) {
//     return {
//       restrict: 'E',
//       scope: {},
//       bindToController: {
//         setStatusMessage: '='
//       },
//       templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
//         '/pages/admin-page/roles-tab/admin-roles-tab.directive.html'),
//       controllerAs: '$ctrl',
//       controller: [function() {
//         var ctrl = this;

//         var handleErrorResponse = function(errorResponse) {
//           ctrl.setStatusMessage(
//             'Server error: ' + errorResponse);
//           // TODO(#8521): Remove the use of $rootScope.$apply()
//           // once the directive is migrated to angular.
//           $rootScope.$apply();
//         };

//         var getLanguageDescriptions = function(languageCodes) {
//           var languageDescriptions = [];
//           languageCodes.forEach(function(languageCode) {
//             languageDescriptions.push(
//               LanguageUtilService.getAudioLanguageDescription(
//                 languageCode));
//           });
//           return languageDescriptions;
//         };

//         ctrl.isLanguageSpecificReviewCategory = function(reviewCategory) {
//           return (
//             reviewCategory === CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION ||
//             reviewCategory === CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER);
//         };

//         ctrl.submitRoleViewForm = function(formResponse) {
//           if (AdminTaskManagerService.isTaskRunning()) {
//             return;
//           }

//           ctrl.setStatusMessage('Processing query...');

//           AdminTaskManagerService.startTask();
//           ctrl.userRolesResult = {};
//           AdminBackendApiService.viewUsersRoleAsync(
//             formResponse.filterCriterion, formResponse.role,
//             formResponse.username
//           ).then((userRoles) => {
//             ctrl.userRolesResult = userRoles;
//             if (Object.keys(ctrl.userRolesResult).length === 0) {
//               ctrl.resultRolesVisible = false;
//               ctrl.setStatusMessage('No results.');
//             } else {
//               ctrl.resultRolesVisible = true;
//               ctrl.setStatusMessage('Success.');
//             }
//             // TODO(#8521): Remove the use of $rootScope.$apply()
//             // once the directive is migrated to angular.
//             $rootScope.$apply();
//             refreshFormData();
//           }, handleErrorResponse);
//           AdminTaskManagerService.finishTask();
//         };

//         ctrl.submitUpdateRoleForm = function(formResponse) {
//           if (AdminTaskManagerService.isTaskRunning()) {
//             return;
//           }
//           ctrl.setStatusMessage('Updating User Role');
//           AdminTaskManagerService.startTask();
//           AdminBackendApiService.updateUserRoleAsync(
//             formResponse.newRole, formResponse.username,
//             formResponse.topicId
//           ).then(() => {
//             ctrl.setStatusMessage(
//               'Role of ' + formResponse.username + ' successfully updated to ' +
//               formResponse.newRole);
//             refreshFormData();
//             // TODO(#8521): Remove the use of $rootScope.$apply()
//             // once the directive is migrated to angular.
//             $rootScope.$apply();
//           }, handleErrorResponse);
//           AdminTaskManagerService.finishTask();
//         };

//         ctrl.submitAddContributionRightsForm = function(formResponse) {
//           if (AdminTaskManagerService.isTaskRunning()) {
//             return;
//           }
//           ctrl.setStatusMessage('Adding new reviewer...');
//           AdminTaskManagerService.startTask();
//           AdminBackendApiService.addContributionReviewerAsync(
//             formResponse.category, formResponse.username,
//             formResponse.languageCode
//           ).then(() => {
//             ctrl.setStatusMessage(
//               'Successfully added "' + formResponse.username + '" as ' +
//               formResponse.category + ' reviewer.');
//             refreshFormData();
//             // TODO(#8521): Remove the use of $rootScope.$apply()
//             // once the directive is migrated to angular.
//             $rootScope.$apply();
//           }, handleErrorResponse);
//           AdminTaskManagerService.finishTask();
//         };

//         ctrl.submitViewContributorUsersForm = function(formResponse) {
//           if (AdminTaskManagerService.isTaskRunning()) {
//             return;
//           }
//           ctrl.setStatusMessage('Processing query...');
//           AdminTaskManagerService.startTask();
//           ctrl.contributionReviewersResult = {};
//           if (formResponse.filterCriterion === USER_FILTER_CRITERION_ROLE) {
//             AdminBackendApiService.viewContributionReviewersAsync(
//               formResponse.category, formResponse.languageCode
//             ).then((usersObject) => {
//               ctrl.contributionReviewersResult.usernames = (
//                 usersObject.usernames);
//               ctrl.contributionReviewersDataFetched = true;
//               ctrl.setStatusMessage('Success.');
//               refreshFormData();
//               // TODO(#8521): Remove the use of $rootScope.$apply()
//               // once the directive is migrated to angular.
//               $rootScope.$apply();
//             }, handleErrorResponse);
//           } else {
//             var translationLanguages = [];
//             var voiceoverLanguages = [];
//             AdminBackendApiService.contributionReviewerRightsAsync(
//               formResponse.username
//             ).then((contributionRights) => {
//               translationLanguages = getLanguageDescriptions(
//                 contributionRights.can_review_translation_for_language_codes);
//               voiceoverLanguages = getLanguageDescriptions(
//                 contributionRights.can_review_voiceover_for_language_codes);
//               ctrl.contributionReviewersResult = {
//                 translationLanguages: translationLanguages,
//                 voiceoverLanguages: voiceoverLanguages,
//                 questions: contributionRights.can_review_questions,
//                 can_submit_questions: contributionRights.can_submit_questions
//               };
//               ctrl.contributionReviewersDataFetched = true;
//               ctrl.setStatusMessage('Success.');
//               // TODO(#8521): Remove the use of $rootScope.$apply()
//               // once the directive is migrated to angular.
//               $rootScope.$apply();
//               refreshFormData();
//             }, handleErrorResponse);
//           }
//           AdminTaskManagerService.finishTask();
//         };

//         ctrl.submitRemoveContributionRightsForm = function(formResponse) {
//           if (AdminTaskManagerService.isTaskRunning()) {
//             return;
//           }
//           ctrl.setStatusMessage('Processing query...');
//           AdminTaskManagerService.startTask();
//           AdminBackendApiService.removeContributionReviewerAsync(
//             formResponse.username, formResponse.method,
//             formResponse.category, formResponse.languageCode
//           ).then(() => {
//             ctrl.setStatusMessage('Success.');
//             refreshFormData();
//             // TODO(#8521): Remove the use of $rootScope.$apply()
//             // once the directive is migrated to angular.
//             $rootScope.$apply();
//           }, handleErrorResponse);
//           AdminTaskManagerService.finishTask();
//         };

//         var refreshFormData = function() {
//           ctrl.formData = {
//             viewUserRoles: {
//               filterCriterion: USER_FILTER_CRITERION_ROLE,
//               role: null,
//               username: '',
//               isValid: function() {
//                 if (this.filterCriterion === USER_FILTER_CRITERION_ROLE) {
//                   return Boolean(this.role);
//                 }
//                 if (this.filterCriterion === USER_FILTER_CRITERION_USERNAME) {
//                   return Boolean(this.username);
//                 }
//                 return false;
//               }
//             },
//             updateRole: {
//               newRole: null,
//               username: '',
//               topicId: null,
//               isValid: function() {
//                 if (this.newRole === 'TOPIC_MANAGER') {
//                   return Boolean(this.topicId);
//                 } else if (this.newRole) {
//                   return Boolean(this.username);
//                 }
//                 return false;
//               }
//             },
//             viewContributionReviewers: {
//               filterCriterion: USER_FILTER_CRITERION_ROLE,
//               username: '',
//               category: null,
//               languageCode: null,
//               isValid: function() {
//                 if (this.filterCriterion === USER_FILTER_CRITERION_ROLE) {
//                   if (this.category === null) {
//                     return false;
//                   }
//                   if (ctrl.isLanguageSpecificReviewCategory(this.category)) {
//                     return Boolean(this.languageCode);
//                   }
//                   return true;
//                 }

//                 if (this.filterCriterion === USER_FILTER_CRITERION_USERNAME) {
//                   return Boolean(this.username);
//                 }
//               }
//             },
//             addContributionReviewer: {
//               username: '',
//               category: null,
//               languageCode: null,
//               isValid: function() {
//                 if (this.username === '') {
//                   return false;
//                 }
//                 if (this.category === null) {
//                   return false;
//                 }
//                 if (ctrl.isLanguageSpecificReviewCategory(this.category)) {
//                   return Boolean(this.languageCode);
//                 }
//                 return true;
//               }
//             },
//             removeContributionReviewer: {
//               username: '',
//               method: ACTION_REMOVE_ALL_REVIEW_RIGHTS,
//               category: null,
//               languageCode: null,
//               isValid: function() {
//                 if (this.username === '') {
//                   return false;
//                 }
//                 if (this.method === ACTION_REMOVE_ALL_REVIEW_RIGHTS) {
//                   return Boolean(this.username);
//                 } else {
//                   if (this.category === null) {
//                     return false;
//                   }
//                   if (ctrl.isLanguageSpecificReviewCategory(this.category)) {
//                     return Boolean(this.languageCode);
//                   }
//                   return true;
//                 }
//               }
//             }
//           };
//         };

//         ctrl.$onInit = function() {
//           ctrl.ACTION_REMOVE_ALL_REVIEW_RIGHTS = (
//             ACTION_REMOVE_ALL_REVIEW_RIGHTS);
//           ctrl.ACTION_REMOVE_SPECIFIC_CONTRIBUTION_RIGHTS = (
//             ACTION_REMOVE_SPECIFIC_CONTRIBUTION_RIGHTS);
//           ctrl.USER_FILTER_CRITERION_USERNAME = USER_FILTER_CRITERION_USERNAME;
//           ctrl.USER_FILTER_CRITERION_ROLE = USER_FILTER_CRITERION_ROLE;
//           ctrl.UPDATABLE_ROLES = {};
//           ctrl.VIEWABLE_ROLES = {};
//           ctrl.CONTRIBUTION_RIGHT_CATEGORIES = {
//             REVIEW_TRANSLATION: CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION,
//             REVIEW_VOICEOVER: CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER,
//             REVIEW_QUESTION: CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION,
//             SUBMIT_QUESTION: CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION
//           };
//           refreshFormData();
//           ctrl.resultRolesVisible = false;
//           ctrl.contributionReviewersDataFetched = false;
//           ctrl.userRolesResult = {};
//           ctrl.contributionReviewersResult = {};
//           ctrl.setStatusMessage('');

//           ctrl.languageCodesAndDescriptions = (
//             LanguageUtilService.getAllVoiceoverLanguageCodes().map(
//               function(languageCode) {
//                 return {
//                   id: languageCode,
//                   description: (
//                     LanguageUtilService.getAudioLanguageDescription(
//                       languageCode))
//                 };
//               }));
//           ctrl.topicSummaries = {};
//           ctrl.roleToActions = null;
//           AdminDataService.getDataAsync().then(function(adminDataObject) {
//             ctrl.UPDATABLE_ROLES = adminDataObject.updatableRoles;
//             ctrl.VIEWABLE_ROLES = adminDataObject.viewableRoles;
//             ctrl.topicSummaries = adminDataObject.topicSummaries;
//             ctrl.roleToActions = adminDataObject.roleToActions;

//             // TODO(#8521): Remove the use of $rootScope.$apply()
//             // once the directive is migrated to angular.
//             $rootScope.$apply();
//           });
//         };

//         ctrl.clearResults = function() {
//           ctrl.contributionReviewersDataFetched = false;
//           ctrl.resultRolesVisible = false;
//           ctrl.userRolesResult = {};
//           ctrl.contributionReviewersResult = {};
//         };
//       }]
//     };
//   }
// ]);
