// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the social buttons displayed in the footer.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { PlatformFeatureService } from 'services/platform-feature.service';

import './social-buttons.component.css';


@Component({
  selector: 'oppia-social-buttons',
  templateUrl: './social-buttons.component.html',
  styleUrls: []
})
export class SocialButtonsComponent {
  androidAppButtonIsShown = (
    this.platformFeatureService.status.AndroidBetaLandingPage.isEnabled
  );

  constructor(private platformFeatureService: PlatformFeatureService) {}
}

angular.module('oppia').directive('oppiaSocialButtons',
  downgradeComponent({
    component: SocialButtonsComponent
  }) as angular.IDirectiveFactory);
