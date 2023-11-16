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

import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

@Component({
  selector: 'oppia-roles-and-actions-visualizer',
  templateUrl: './roles-and-actions-visualizer.component.html'
})
export class RolesAndActionsVisualizerComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() roleToActions!: {[role: string]: string[]};
  @Input() viewableRoles!: string[];
  @Input() humanReadableRoles!: Object;

  activeRole!: string;
  activeTab!: string;
  avatarPictureUrl!: string;
  roles!: string[];
  assignUsersToActiveRole!: string[];
  loadingAssignedUsernames: boolean = false;
  TAB_ACTIONS: string = 'TAB_ACTIONS';
  TAB_ASSIGNED_USERS: string = 'TAB_ASSIGNED_USERS';
  roleToReadableActions: Record<string, string[]> = {};

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
      let readableTexts: string[] = [];
      texts.forEach(text => {
        readableTexts.push(
          text.toLowerCase().split('_').join(' ').replace(
            /^\w/, (c) => c.toUpperCase()));
      });
      return readableTexts.sort();
    };

    for (let role in this.roleToActions) {
      this.roleToReadableActions[role] = getSortedReadableTexts(
        this.roleToActions[role]);
    }

    this.roles = Object.keys(this.roleToActions).sort();
    this.activeRole = this.roles[3];
  }
}
