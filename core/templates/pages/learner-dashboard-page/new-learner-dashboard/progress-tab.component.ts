// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for progress tab in the Learner Dashboard page.
 */

import { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { StorySummary } from 'domain/story/story-summary.model';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';


 @Component({
   selector: 'oppia-progress-tab',
   templateUrl: './progress-tab.component.html'
 })
export class ProgressTabComponent implements OnInit {
  @Input() completedStoriesList: StorySummary[];
  @Input() partiallyLearntTopicsList: LearnerTopicSummary[];
  widthConst: number = 233;
  width: number;

  constructor(
    private deviceInfoService: DeviceInfoService,
    private urlInterpolationService: UrlInterpolationService,
  ) {}

  ngOnInit(): void {
    this.width = this.widthConst * (this.completedStoriesList.length);
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  checkMobileView(): boolean {
    return this.deviceInfoService.isMobileDevice();
  }
}
