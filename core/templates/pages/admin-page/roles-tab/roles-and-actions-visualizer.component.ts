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
 * @fileoverview Component for displaying roles and actions.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

@Component({
  selector: 'oppia-roles-and-actions-visualizer',
  templateUrl: './roles-and-actions-visualizer.component.html'
})
export class RolesAndActionsVisualizerComponent implements OnInit {
  @Input() roleToActions;
  @Input() viewableRoles;
  @Input() humanReadableRoles;

  TAB_ACTIONS: string = 'TAB_ACTIONS';
  TAB_ASSIGNED_USERS: string = 'TAB_ASSIGNED_USERS';
  activeRole: string;
  activeTab: string;
  avatarPictureUrl: string;
  loadingAssignedUsernames: boolean;
  roles: string[];
  roleToReadableActions = {};
  assignUsersToActiveRole: string[];

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private adminBackendApiService: AdminBackendApiService) {}

  setActiveRole(role: string): void {
    this.activeRole = role;
    this.activeTab = this.TAB_ACTIONS;
  }

  showAssignedUsers(): void {
    this.loadingAssignedUsernames = true;
    this.adminBackendApiService.fetchUsersAssignedToRoleAsync(
      this.activeRole).then((response) => {
      this.assignUsersToActiveRole = response.usernames;
      this.loadingAssignedUsernames = false;
    });
  }

  ngOnInit(): void {
    this.loadingAssignedUsernames = false;
    this.avatarPictureUrl = this.urlInterpolationService.getStaticImageUrl(
      '/avatar/user_blue_72px.png');
    this.activeTab = this.TAB_ACTIONS;

    let getSortedReadableTexts = (texts: string[]): string[] => {
      let readableTexts = [];
      texts.forEach(text => {
        readableTexts.push(
          text.toLowerCase().split('_').join(' ').replace(
            /^\w/, (c) => c.toUpperCase()));
      });
      return readableTexts.sort();
    };
    
    this.roleToActions.forEach(role => {
      this.roleToReadableActions[role] = getSortedReadableTexts(
        this.roleToActions[role]);      
    });

    this.roles = Object.keys(this.roleToActions).sort();
    this.activeRole = this.roles[3];
  }
}

angular.module('oppia').directive(
  'oppiaRolesAndActionsVisualizer', downgradeComponent(
    { component: RolesAndActionsVisualizerComponent }));
