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

import {AppConstants} from 'app.constants';

import {Component, Input, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {ExplorationEmbedButtonModalComponent} from 'components/button-directives/exploration-embed-button-modal.component';
import {WindowRef} from 'services/contextual/window-ref.service';

@Component({
  selector: 'sharing-links',
  templateUrl: './sharing-links.component.html',
  styleUrls: [],
})
export class SharingLinksComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() layoutType!: string;
  @Input() layoutAlignType!: string;
  @Input() shareType!: ShareType;
  @Input() explorationId!: string;
  @Input() collectionId!: string;
  @Input() smallFont!: boolean;
  @Input() blogPostUrl!: string;
  classroomUrl!: string;
  activityId: string | undefined = undefined;
  activityUrlFragment: string | undefined = undefined;
  serverName!: string;
  escapedTwitterText!: string;

  constructor(
    private nbgModal: NgbModal,
    private urlInterpolationService: UrlInterpolationService,
    private siteAnalyticsService: SiteAnalyticsService,
    private htmlEscaperService: HtmlEscaperService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    if (this.shareType === 'exploration') {
      this.activityId = this.explorationId;
      this.activityUrlFragment = 'explore';
    } else if (this.shareType === 'collection') {
      this.activityId = this.collectionId;
      this.activityUrlFragment = 'collection';
    } else if (this.shareType !== 'blog') {
      // TODO(#13122): Remove this code to throw error. Remove @Input to
      // this component and use ContextService directly to determine if the
      // collection or exploration page is active and render accordingly.
      throw new Error(
        'SharingLinks component can only be used in the ' +
          'collection player, exploration player or the blog post page.'
      );
    }

    this.serverName =
      this.windowRef.nativeWindow.location.protocol +
      '//' +
      this.windowRef.nativeWindow.location.host;

    if (this.shareType === 'blog') {
      this.escapedTwitterText =
        this.htmlEscaperService.unescapedStrToEscapedStr(
          AppConstants.DEFUALT_BLOG_POST_SHARE_TWITTER_TEXT
        );
    } else {
      this.escapedTwitterText =
        this.htmlEscaperService.unescapedStrToEscapedStr(
          AppConstants.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR
        );
    }

    this.classroomUrl = this.urlInterpolationService.getStaticImageUrl(
      '/general/classroom.png'
    );
  }

  getFontAndFlexClass(): string {
    let classes = '';
    classes += this.smallFont ? 'font-small' : 'font-big';
    classes += ' fx-' + this.layoutType;
    if (this.layoutAlignType) {
      classes += ' fx-main-' + this.layoutAlignType.split(' ')[0];
      if (this.layoutAlignType.split(' ')[1]) {
        classes += ' fx-cross-' + this.layoutAlignType.split(' ')[1];
      }
    }
    return classes;
  }

  getUrl(network: SharingPlatform): string {
    let queryString: string;
    let url: string;
    if (this.shareType === 'blog') {
      url = `${this.serverName}/blog/${this.blogPostUrl}`;
    } else {
      url = `${this.serverName}/${this.activityUrlFragment}/${this.activityId}`;
    }
    switch (network) {
      case 'facebook':
        queryString =
          'sdk=joey&' +
          `u=${url}&` +
          'display=popup&' +
          'ref=plugin&' +
          'src=share_button';
        return `https://www.facebook.com/sharer/sharer.php?${queryString}`;

      case 'twitter':
        queryString = `text=${this.escapedTwitterText}&` + `url=${url}`;
        return `https://twitter.com/share?${queryString}`;

      case 'classroom':
        queryString = `url=${url}`;
        return `https://classroom.google.com/share?${queryString}`;

      case 'linkedin':
        queryString = `url=${url}`;
        return `https://www.linkedin.com/sharing/share-offsite/?${queryString.replace('http:', 'https:')}`;
    }
  }

  showEmbedExplorationModal(): void {
    const modelRef = this.nbgModal.open(ExplorationEmbedButtonModalComponent, {
      backdrop: true,
    });
    modelRef.componentInstance.serverName = this.serverName;
    modelRef.componentInstance.explorationId = this.explorationId;
  }

  registerShareEvent(network: SharingPlatform): void {
    if (this.shareType === 'exploration') {
      this.siteAnalyticsService.registerShareExplorationEvent(network);
    } else if (this.shareType === 'collection') {
      this.siteAnalyticsService.registerShareCollectionEvent(network);
    } else if (this.shareType === 'blog') {
      this.siteAnalyticsService.registerShareBlogPostEvent(network);
    }
    this.windowRef.nativeWindow.open(
      this.getUrl(network),
      '',
      'height=460, width=640'
    );
  }
}

type ShareType = 'exploration' | 'collection' | 'blog';
type SharingPlatform = 'facebook' | 'twitter' | 'classroom' | 'linkedin';
