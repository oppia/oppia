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

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'profile-link-text',
  templateUrl: './profile-link-text.component.html',
  styleUrls: []
})
export class ProfileLinkTextComponent {
  @Input() username: string;
  constructor() {}
  isUsernameLinkable(username: string): boolean {
    return ['admin', 'OppiaMigrationBot'].indexOf(username) === -1;
  }
}

angular.module('oppia').directive(
  'profileLinkText', downgradeComponent(
    {component: ProfileLinkTextComponent}));
