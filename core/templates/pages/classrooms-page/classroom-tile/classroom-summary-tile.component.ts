// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for a classroom tile.
 */

import {Component, Input} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ClassroomSummaryDict} from 'domain/classroom/classroom-backend-api.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {AppConstants} from 'app.constants';

@Component({
  selector: 'oppia-classroom-summary-tile',
  templateUrl: './classroom-summary-tile.component.html',
})
export class ClassroomSummaryTileComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() classroomSummary!: ClassroomSummaryDict;

  classroomThumbnailUrl!: string;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private assetsBackendApiService: AssetsBackendApiService
  ) {}

  isPublished(): boolean {
    return this.classroomSummary.is_published;
  }

  getName(): string {
    if (this.isPublished()) {
      return this.classroomSummary.name;
    }
    return 'Coming soon';
  }

  getClassroomUrl(): string {
    return `/learn/${this.classroomSummary.url_fragment}`;
  }

  getTeaserText(): string {
    if (this.isPublished()) {
      return this.classroomSummary.teaser_text;
    }
    return 'We are working on more classrooms just for you. Check back soon!';
  }

  ngOnInit(): void {
    if (this.isPublished()) {
      this.classroomThumbnailUrl =
        this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.CLASSROOM,
          this.classroomSummary.classroom_id,
          this.classroomSummary.thumbnail_filename
        );
    } else {
      this.classroomThumbnailUrl =
        this.urlInterpolationService.getStaticImageUrl(
          '/classroom/classroom-under-construction.svg'
        );
    }
  }
}
