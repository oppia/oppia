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
 * @fileoverview Directive for creating image links to a user's profile page.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'profile-link-picture',
  templateUrl: './profile-link-picture.component.html',
  styleUrls: []
})
export class ProfileLinkPictureComponent {
  @Input() username: string;
  constructor() {}

  isUsernameLinkable(): boolean {
    return !(['admin', 'OppiaMigrationBot'].includes(this.username));
  }
}

angular.module('oppia').directive('profileLinkPicture', downgradeComponent(
  {component: ProfileLinkPictureComponent}));
