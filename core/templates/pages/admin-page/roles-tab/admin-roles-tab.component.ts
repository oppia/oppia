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
 * @fileoverview Component for editing user roles.
 */

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminDataService } from '../services/admin-data.service';
import { AdminBackendApiService, HumanReadableRolesBackendResponse, RoleToActionsBackendResponse } from 'domain/admin/admin-backend-api.service';
import { TopicManagerRoleEditorModalComponent } from './topic-manager-role-editor-modal.component';
import { TranslationCoordinatorRoleEditorModalComponent } from './translation-coordinator-role-editor-modal.component';
import { AlertsService } from 'services/alerts.service';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
import constants from 'assets/constants';

@Component({
  selector: 'oppia-admin-roles-tab',
  templateUrl: './admin-roles-tab.component.html'
})
export class AdminRolesTabComponent implements OnInit {
  @Output() setStatusMessage: EventEmitter<string> = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  UPDATABLE_ROLES!: string[];
  VIEWABLE_ROLES!: string[];
  HUMAN_READABLE_ROLES!: HumanReadableRolesBackendResponse;
  topicSummaries!: CreatorTopicSummary[];
  roleToActions!: RoleToActionsBackendResponse;
  errorMessage!: string;
  rolesFetched: boolean = false;
  roleSelectorIsShown: boolean = false;
  username: string = '';
  userRoles: string[] = [];
  possibleRolesToAdd: string[] = [];
  managedTopicIds: string[] = [];
  coordinatedLanguageIds: string[] = [];
  // The roleCurrentlyBeingUpdatedInBackend holds the role which is either being
  // removed or added to user roles. This value is used to present a progress
  // spinner next to the role which is currently being updated in the backend.
  // RoleCurrentlyBeingUpdatedInBackend is null when no role is being updated.
  roleCurrentlyBeingUpdatedInBackend: string | null = null;
  bannedStatusChangeInProgress = false;
  userIsBanned = false;
  roleIsCurrentlyBeingEdited = false;

  constructor(
    private adminDataService: AdminDataService,
    private adminBackendApiService: AdminBackendApiService,
    private alertsService: AlertsService,
    private modalService: NgbModal
  ) {}

  addWarning(errorMessage: string): void {
    this.alertsService.addWarning(
      errorMessage || 'Error communicating with server.');
  }

  startEditing(): void {
    this.roleIsCurrentlyBeingEdited = true;
    this.adminBackendApiService.viewUsersRoleAsync(
      this.username
    ).then((userRoles) => {
      this.rolesFetched = true;
      this.userRoles = userRoles.roles;
      this.managedTopicIds = userRoles.managed_topic_ids;
      this.coordinatedLanguageIds = userRoles.coordinated_language_ids;
      this.userIsBanned = userRoles.banned;
    },
    (errorResponse) => {
      this.roleIsCurrentlyBeingEdited = false;
      this.setStatusMessage.emit(errorResponse);
    });
  }

  showNewRoleSelector(): void {
    this.possibleRolesToAdd = this.UPDATABLE_ROLES.filter(
      role => !this.userRoles.includes(role)).sort();
    this.roleSelectorIsShown = true;
  }

  removeRole(roleToRemove: string): void {
    this.roleCurrentlyBeingUpdatedInBackend = roleToRemove;

    var roleIndex = this.userRoles.indexOf(roleToRemove);
    this.adminBackendApiService.removeUserRoleAsync(
      roleToRemove, this.username).then(() => {
      if (roleToRemove === 'TOPIC_MANAGER') {
        this.managedTopicIds = [];
      }
      if (roleToRemove === 'TRANSLATION_COORDINATOR') {
        this.coordinatedLanguageIds = [];
      }
      this.userRoles.splice(roleIndex, 1);
      this.roleCurrentlyBeingUpdatedInBackend = null;
    });
  }

  openTopicManagerRoleEditor(): void {
    const modalRef = this.modalService.open(
      TopicManagerRoleEditorModalComponent);
    modalRef.componentInstance.managedTopicIds = (
      this.managedTopicIds);
    modalRef.componentInstance.username = this.username;
    let topicIdToName: Record<string, string> = {};
    this.topicSummaries.forEach(
      topicSummary => topicIdToName[topicSummary.id] = topicSummary.name);
    modalRef.componentInstance.topicIdToName = topicIdToName;
    modalRef.result.then(managedTopicIds => {
      this.managedTopicIds = managedTopicIds;
      if (
        !this.userRoles.includes('TOPIC_MANAGER') &&
        managedTopicIds.length) {
        this.userRoles.push('TOPIC_MANAGER');
      }
      this.roleSelectorIsShown = false;
    });
  }

  openTranslationCoordinatorRoleEditor(): void {
    const modalRef = this.modalService.open(
      TranslationCoordinatorRoleEditorModalComponent);
    modalRef.componentInstance.coordinatedLanguageIds = (
      this.coordinatedLanguageIds);
    modalRef.componentInstance.username = this.username;
    let languageIdToName: Record<string, string> = {};
    constants.SUPPORTED_AUDIO_LANGUAGES.forEach(
      language => languageIdToName[language.id] = language.description);
    modalRef.componentInstance.languageIdToName = languageIdToName;
    modalRef.result.then(coordinatedLanguageIds => {
      this.coordinatedLanguageIds = coordinatedLanguageIds;
      if (
        !this.userRoles.includes('TRANSLATION_COORDINATOR') &&
        coordinatedLanguageIds.length) {
        this.userRoles.push('TRANSLATION_COORDINATOR');
      }
      this.roleSelectorIsShown = false;
    });
  }

  addNewRole(role: string): void {
    if (role === 'TOPIC_MANAGER') {
      this.openTopicManagerRoleEditor();
      return;
    }

    if (role === 'TRANSLATION_COORDINATOR') {
      this.openTranslationCoordinatorRoleEditor();
      return;
    }

    this.roleCurrentlyBeingUpdatedInBackend = role;
    this.userRoles.push(role);
    this.roleSelectorIsShown = false;

    this.adminBackendApiService.addUserRoleAsync(
      role, this.username).then(() => {
      this.roleCurrentlyBeingUpdatedInBackend = null;
    }, this.addWarning.bind(this));
  }

  markUserBanned(): void {
    this.bannedStatusChangeInProgress = true;
    this.adminBackendApiService.markUserBannedAsync(this.username).then(() => {
      this.bannedStatusChangeInProgress = false;
      this.userIsBanned = true;
      this.userRoles = [];
    }, this.addWarning.bind(this));
  }

  unmarkUserBanned(): void {
    this.bannedStatusChangeInProgress = true;
    this.adminBackendApiService.unmarkUserBannedAsync(
      this.username).then(() => {
      this.bannedStatusChangeInProgress = false;
      this.userIsBanned = false;
      this.startEditing();
    }, this.addWarning.bind(this));
  }

  clearEditor(): void {
    this.rolesFetched = false;
    this.roleSelectorIsShown = false;
    this.username = '';
    this.userRoles = [];
    this.possibleRolesToAdd = [];
    this.managedTopicIds = [];
    this.roleCurrentlyBeingUpdatedInBackend = null;
    this.bannedStatusChangeInProgress = false;
    this.userIsBanned = false;
    this.roleIsCurrentlyBeingEdited = false;
  }

  ngOnInit(): void {
    this.adminDataService.getDataAsync().then(adminDataObject => {
      this.UPDATABLE_ROLES = adminDataObject.updatableRoles;
      this.VIEWABLE_ROLES = adminDataObject.viewableRoles;
      this.HUMAN_READABLE_ROLES = adminDataObject.humanReadableRoles;
      this.topicSummaries = adminDataObject.topicSummaries;
      this.roleToActions = adminDataObject.roleToActions;
    });
  }
}
