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
 * @fileoverview Component for the Social Sharing Links.
 */
import constants from 'assets/constants';

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ExplorationEmbedButtonModalComponent } from
  'components/button-directives/exploration-embed-button-modal.component';

@Component({
  selector: 'sharing-links',
  templateUrl: './sharing-links.component.html',
  styleUrls: []
})
export class SharingLinksComponent implements OnInit {
  @Input() layoutType: string;
  @Input() layoutAlignType: string;
  @Input() shareType: ShareType;
  @Input() explorationId: string;
  @Input() collectionId: string;
  @Input() smallFont: boolean;
  classroomUrl: string;
  activityId: string;
  activityUrlFragment: string;
  serverName: string;
  escapedTwitterText: string;

  constructor(
    private nbgModal: NgbModal,
    private urlInterpolationService: UrlInterpolationService,
    private siteAnalyticsService: SiteAnalyticsService,
    private htmlEscaperService: HtmlEscaperService) {}

  ngOnInit(): void {
    if (this.shareType === 'exploration') {
      this.activityId = this.explorationId;
      this.activityUrlFragment = 'explore';
    } else if (this.shareType === 'collection') {
      this.activityId = this.collectionId;
      this.activityUrlFragment = 'collection';
    } else {
      throw new Error(
        'SharingLinks directive can only be used either in the' +
        'collection player or the exploration player');
    }

    this.serverName = (
      window.location.protocol + '//' + window.location.host);

    this.escapedTwitterText = (
      this.htmlEscaperService.unescapedStrToEscapedStr(
        constants.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR));

    this.classroomUrl = this.urlInterpolationService.getStaticImageUrl(
      '/general/classroom.png');
  }

  getFontAndFlexClass(): string {
    let classes = '';
    classes += this.smallFont ? 'font-small' : 'font-big';
    classes += ' fx-' + this.layoutType;
    classes += ' fx-main-' + this.layoutAlignType.split('-')[0];
    classes += ' fx-cross-' + this.layoutAlignType.split('-')[1];
    return classes;
  }

  getUrl(network: SharingPlatform): string {
    if (network === 'facebook') {
      return `https://www.facebook.com/sharer/sharer.php?sdk=joey&u=${this.serverName}/${this.activityUrlFragment}/${this.activityId}&display=popup&ref=plugin&src=share_button`;
    }

    if (network === 'twitter') {
      return `https://twitter.com/share?text=${this.escapedTwitterText}&url=${this.serverName}/${this.activityUrlFragment}/${this.activityId}`;
    }

    if (network === 'classroom') {
      return `https://classroom.google.com/share?url=${this.serverName}/${this.activityUrlFragment}/${this.activityId}`;
    }
  }

  showEmbedExplorationModal(): void {
    const modelRef = this.nbgModal.open(
      ExplorationEmbedButtonModalComponent, {backdrop: true});
    modelRef.componentInstance.serverName = this.serverName;
    modelRef.componentInstance.explorationId = this.explorationId;
  }

  registerShareEvent(network: SharingPlatform): void {
    if (this.shareType === 'exploration') {
      this.siteAnalyticsService.registerShareExplorationEvent(network);
    } else if (this.shareType === 'collection') {
      this.siteAnalyticsService.registerShareCollectionEvent(network);
    }
    window.open(this.getUrl(network), '', 'height=460, width=640');
  }
}

type ShareType = 'exploration' | 'collection';
type SharingPlatform = 'facebook' | 'twitter' | 'classroom';

angular.module('oppia').directive('sharingLinks', downgradeComponent(
  {component: SharingLinksComponent}));
