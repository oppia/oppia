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
 * @fileoverview Directive for the Video rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { AutoplayedVideosService } from 'services/autoplayed-videos.service';
import { ContextService } from 'services/context.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ServicesConstants } from 'services/services.constants';

@Component({
  selector: 'oppia-noninteractive-video',
  templateUrl: './video.component.html',
  styleUrls: []
})
export class NoninteractiveVideo implements OnInit {
  @Input() autoplayWithValue: string;
  @Input() endWithValue: string;
  @Input() startWithValue: string;
  @Input() videoIdWithValue: string;

  autoplaySuffix: string = '&autoplay=0';
  tabIndexVal: number;
  timingParams: string;
  videoId: string;
  videoUrl: SafeResourceUrl;

  constructor(
    private autoplayedVideosService: AutoplayedVideosService,
    private contextService: ContextService,
    private domSantizer: DomSanitizer,
    private el: ElementRef,
    private htmlEscaperService: HtmlEscaperService
  ) {}

  ngOnInit(): void {
    const start = this.htmlEscaperService.escapedJsonToObj(this.startWithValue);
    const end = this.htmlEscaperService.escapedJsonToObj(this.endWithValue);
    this.videoId = this.htmlEscaperService.escapedJsonToObj(
      this.videoIdWithValue) as string;
    this.timingParams = '&start=' + start + '&end=' + end;

    setTimeout(() => {
    // Check whether creator wants to autoplay this video or not.
      const autoplayVal = this.htmlEscaperService.escapedJsonToObj(
        this.autoplayWithValue);

      // This code helps in visibility of video. It checks whether
      // mid point of video frame is in the view or not.
      const rect = this.el.nativeElement.getBoundingClientRect();
      const clientHeight = window.innerHeight;
      const clientWidth = window.innerWidth;
      const isVisible = (
        (rect.left + rect.right) / 2 < clientWidth &&
      (rect.top + rect.bottom) / 2 < clientHeight) &&
      (rect.left > 0 && rect.right > 0);

      // Autoplay if user is in learner view and creator has specified
      // to autoplay given video.
      if (this.contextService.getPageContext() ===
      ServicesConstants.PAGE_CONTEXT.EXPLORATION_PLAYER && autoplayVal) {
      // If it has been autoplayed then do not autoplay again.
        if (
          !this.autoplayedVideosService.hasVideoBeenAutoplayed(
            this.videoId) && isVisible) {
          this.autoplaySuffix = '&autoplay=1';
          this.autoplayedVideosService.addAutoplayedVideo(this.videoId);
        }
      }

      this.videoUrl = this.domSantizer.bypassSecurityTrustResourceUrl(
        'https://www.youtube.com/embed/' + this.videoId + '?rel=0' +
      this.timingParams + this.autoplaySuffix);
    }, 900);
    // (^)Here timeout is set to 900ms. This is time it takes to bring
    // the frame to correct point in browser and bring user to the main
    // content. Smaller delay causes checks to be performed even before
    // the player displays the content of the new card.

    // This following check disables the video in Editor being caught
    // by tabbing while in Exploration Editor mode.
    if (this.contextService.isInExplorationEditorMode()) {
      this.tabIndexVal = -1;
    }
  }
}

angular.module('oppia').directive(
  'oppiaNoninteractiveVideo', downgradeComponent({
    component: NoninteractiveVideo
  }) as angular.IDirectiveFactory);
