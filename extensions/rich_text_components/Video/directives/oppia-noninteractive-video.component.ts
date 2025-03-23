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
 *
 * All of the RTE components follow this pattern of updateView and ngOnChanges.
 * This is because these are also web-components (So basically, we can create
 * this component using document.createElement). CKEditor creates instances of
 * these on the fly and runs ngOnInit before we can set the @Input properties.
 * When the input properties are not set, we get errors in the console.
 * The `if` condition in update view prevents that from happening.
 * The `if` condition in the updateView and ngOnChanges might look like the
 * literal opposite but that's not the case. We know from the previous
 * statements above that the if condition in the updateView is for preventing
 * the code to run until all the values needed for successful execution are
 * present. The if condition in ngOnChanges is to optimize the re-runs of
 * updateView and only re-run when a property we care about has changed in
 * value.
 */

import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {AutoplayedVideosService} from 'services/autoplayed-videos.service';
import {ContextService} from 'services/context.service';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {ServicesConstants} from 'services/services.constants';

/**
 * The "apiLoaded" variable only changes once during the lifetime of
 * the application. If it is inside the component we would end up fetching and
 * loading the YouTube embed script every-time time this component was created.
 * If this were a feature used in multiple places, keeping it in a service would
 * be a better place. But currently restricted to this component. This
 * syntax/ code is taken from the example given in the angular repo.
 * https://github.com/angular/components/tree/master/src/youtube-player#example
 */

let apiLoaded = false;
@Component({
  selector: 'oppia-noninteractive-video',
  templateUrl: './video.component.html',
  styleUrls: [],
})
export class NoninteractiveVideo implements OnInit, OnChanges {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() autoplayWithValue!: string;
  @Input() endWithValue!: string;
  @Input() startWithValue!: string;
  @Input() videoIdWithValue!: string;
  start!: number;
  end!: number;
  tabIndexVal!: number;
  videoId!: string;
  width!: number;

  playerVars = {
    autoplay: 0,
    origin: 'http://localhost:8181',
  };

  constructor(
    private autoplayedVideosService: AutoplayedVideosService,
    private contextService: ContextService,
    private elementRed: ElementRef,
    private htmlEscaperService: HtmlEscaperService
  ) {}

  private _updateViewOnNewVideo(): void {
    if (
      !this.autoplayWithValue ||
      !this.endWithValue ||
      !this.startWithValue ||
      !this.videoIdWithValue
    ) {
      return;
    }
    if (!apiLoaded) {
      // This code loads the IFrame Player API code asynchronously, according to
      // the instructions at
      // https://developers.google.com/youtube/iframe_api_reference#Getting_Started
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      apiLoaded = true;
    }
    const start = this.htmlEscaperService.escapedJsonToObj(
      this.startWithValue
    ) as string;
    const end = this.htmlEscaperService.escapedJsonToObj(
      this.endWithValue
    ) as string;
    this.start = Number(start);
    this.end = Number(end);
    this.videoId = this.htmlEscaperService.escapedJsonToObj(
      this.videoIdWithValue
    ) as string;

    // Check whether creator wants to autoplay this video or not.
    const autoplayVal = this.htmlEscaperService.escapedJsonToObj(
      this.autoplayWithValue
    );

    // This code helps in visibility of video. It checks whether
    // mid point of video frame is in the view or not.
    const rect = this.elementRed.nativeElement.getBoundingClientRect();
    const clientHeight = window.innerHeight;
    const clientWidth = window.innerWidth;
    this.width = this.elementRed.nativeElement.width;
    const isVisible =
      (rect.left + rect.right) / 2 < clientWidth &&
      (rect.top + rect.bottom) / 2 < clientHeight &&
      rect.left > 0 &&
      rect.right > 0;

    // Autoplay if user is in learner view and creator has specified
    // to autoplay given video.
    if (
      this.contextService.getPageContext() ===
        ServicesConstants.PAGE_CONTEXT.EXPLORATION_PLAYER &&
      autoplayVal
    ) {
      // If it has been autoplayed then do not autoplay again.
      if (
        !this.autoplayedVideosService.hasVideoBeenAutoplayed(this.videoId) &&
        isVisible
      ) {
        this.playerVars.autoplay = 1;
        this.autoplayedVideosService.addAutoplayedVideo(this.videoId);
      }
    }

    // This following check disables the video in Editor being caught
    // by tabbing while in Exploration Editor mode.
    if (this.contextService.isInExplorationEditorMode()) {
      this.tabIndexVal = -1;
    }
  }

  ngOnInit(): void {
    this._updateViewOnNewVideo();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.autoplayWithValue ||
      changes.endWithValue ||
      changes.startWithValue ||
      changes.videoIdWithValue
    ) {
      this._updateViewOnNewVideo();
    }
  }
}
