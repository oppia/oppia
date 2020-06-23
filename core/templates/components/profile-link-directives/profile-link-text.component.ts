// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directives for creating text links to a user's profile page.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';

@Component({
  selector: 'profile-link-text',
  templateUrl: './profile-link-text.component.html',
  styleUrls: []
})
export class ProfileLinkTextComponent implements OnInit {
  @Input() username: string;

  ngOnInit() {}

  isUsernameLinkable(): boolean {
    return AppConstants.SYSTEM_USER_IDS.indexOf(this.username) === -1;
  }
}

angular.module('oppia').directive('profileLinkText', downgradeComponent(
  {component: ProfileLinkTextComponent}));
