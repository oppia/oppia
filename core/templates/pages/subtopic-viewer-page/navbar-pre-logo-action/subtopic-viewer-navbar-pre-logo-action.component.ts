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
 * @fileoverview Directive for the navbar pre-logo-action
 *  of the subtopic viewer.
 */

import {Component, OnInit} from '@angular/core';

import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';

@Component({
  selector: 'subtopic-viewer-navbar-pre-logo-action',
  templateUrl: './subtopic-viewer-navbar-pre-logo-action.component.html',
  styleUrls: [],
})
export class SubtopicViewerNavbarPreLogoActionComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  topicUrlFragment!: string;
  topicUrl!: string;
  constructor(
    private urlService: UrlService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  ngOnInit(): void {
    this.topicUrlFragment = this.urlService.getTopicUrlFragmentFromLearnerUrl();
    this.topicUrl = this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.TOPIC_VIEWER_REVISION_URL_TEMPLATE,
      {
        topic_url_fragment: this.topicUrlFragment,
        classroom_url_fragment:
          this.urlService.getClassroomUrlFragmentFromLearnerUrl(),
      }
    );
  }
}
