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

import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

@Component({
  selector: 'oppia-roles-and-actions-visualizer',
  templateUrl: './roles-and-actions-visualizer.component.html'
})
export class RolesAndActionsVisualizerComponent implements OnInit {
  @Input() roleToActions;

  activeRole: string;
  avatarPictureUrl: string;
  roles: string[];

  constructor(private urlInterpolationService: UrlInterpolationService) {}

  setActiveRole(role: string): void {
    this.activeRole = role;
  }

  ngOnInit(): void {
    this.avatarPictureUrl = this.urlInterpolationService.getStaticImageUrl(
      '/avatar/user_blue_72px.png');

    let getSortedReadableTexts = (texts: string[]): string[] => {
      let readableTexts = [];
      texts.forEach(text => {
        readableTexts.push(
          text.toLowerCase().split('_').join(' ').replace(
            /^\w/, (c) => c.toUpperCase()));
      });
      return readableTexts.sort();
    };

    for (let role in this.roleToActions) {
      let readableRole = getSortedReadableTexts([role])[0];
      this.roleToActions[readableRole] = getSortedReadableTexts(
        this.roleToActions[role]);
      delete this.roleToActions[role];
    }

    this.roles = Object.keys(this.roleToActions).sort();
    this.activeRole = this.roles[3];
  }
}

angular.module('oppia').directive(
  'oppiaRolesAndActionsVisualizer', downgradeComponent(
    { component: RolesAndActionsVisualizerComponent }));
