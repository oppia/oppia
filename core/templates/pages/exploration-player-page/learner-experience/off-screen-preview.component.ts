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
 * @fileoverview Component for the future tutor card to be shown on conversation
 * skin.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { ExplorationPlayerConstants } from '../exploration-player-page.constants';

@Component({
  selector: 'oppia-off-screen-preview',
  templateUrl: './off-screen-preview.component.html'
})
export class OffScreenPreviewComponent {
  @Input() nextCardContentHtml!: string;
  @Input() upcomingInlineInteractionHtml!: string;

  constructor(
    private windowDimensionsService: WindowDimensionsService
  ) {}

  // Returns whether the screen is wide enough to fit two
  // cards (e.g., the tutor and supplemental cards) side-by-side.
  canWindowShowTwoCards(): boolean {
    return (
      this.windowDimensionsService.getWidth() >
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX);
  }
}

angular.module('oppia').directive('oppiaOffScreenPreview',
  downgradeComponent({
    component: OffScreenPreviewComponent
  }));
