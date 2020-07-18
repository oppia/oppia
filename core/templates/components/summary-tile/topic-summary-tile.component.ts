// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for a topic tile.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants.ts';
import { ClassroomDomainConstants } from
  'domain/classroom/classroom-domain.constants';
import { TopicSummary } from 'domain/topic/TopicSummaryObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

const Constants = require('constants.ts');

@Component({
  selector: 'topic-summary-tile',
  templateUrl: './topic-summary-tile.component.html',
  styleUrls: []
})
export class TopicSummaryTileComponent {
  @Input() topicSummary: TopicSummary;
  constructor(
    private urlInterpolationService: UrlInterpolationService) {
  }
  openTopicPage(): string {
    window.open(
      this.urlInterpolationService.interpolateUrl(
        ClassroomDomainConstants.TOPIC_VIEWER_URL_TEMPLATE, {
          topic_name: this.topicSummary.getName()}), '_blank');
  }
  getColorValueInHexForm(colorValue: number): string {
    colorValue = (colorValue < 0) ? 0 : colorValue;
    var colorValueString = colorValue.toString(16);
    return (
      (colorValueString.length === 1) ?
      '0' + colorValueString : colorValueString);
  }
  getDarkerThumbnailBgColor(): string {
    var bgColor = this.topicSummary.getThumbnailBgColor();
    // Remove the '#' from the first position.
    bgColor = bgColor.slice(1);

    // Get RGB values of new darker color.
    var newRValue = this.getColorValueInHexForm(
      parseInt(bgColor.substring(0, 2), 16) - 100);
    var newGValue = this.getColorValueInHexForm(
      parseInt(bgColor.substring(2, 4), 16) - 100);
    var newBValue = this.getColorValueInHexForm(
      parseInt(bgColor.substring(4, 6), 16) - 100);

    return '#' + newRValue + newGValue + newBValue;
  }
  getThumbnailUrl(): string {
    // Since an Angular8 component cannot depend on an AngularJS service,
    // the thumbnail URL is manually built here. This can be reverted to use
    // assets backend api service once that is migrated to Angular 8.
    // The constants used are copied over from AssetsBackendApiService.
    let GCS_PREFIX = ('https://storage.googleapis.com/' +
      Constants.GCS_RESOURCE_BUCKET_NAME);
    let THUMBNAIL_DOWNLOAD_URL_TEMPLATE = (
      (Constants.DEV_MODE ? '/assetsdevhandler' : GCS_PREFIX) +
      '/<entity_type>/<entity_id>/assets/thumbnail/<filename>');
    return (
      this.urlInterpolationService.interpolateUrl(
        THUMBNAIL_DOWNLOAD_URL_TEMPLATE, {
          entity_id: this.topicSummary.getId(),
          entity_type: AppConstants.ENTITY_TYPE.TOPIC,
          filename: this.topicSummary.getThumbnailFilename()
        })
    );
  }
}

angular.module('oppia').directive(
  'topicSummaryTile', downgradeComponent(
    {component: TopicSummaryTileComponent}));
