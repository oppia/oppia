// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Diagnostic test player component.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';


@Component({
  selector: 'oppia-diagnostic-test-player',
  templateUrl: './diagnostic-test-player.component.html'
})
export class DiagnosticTestPlayerComponent implements OnInit {
  OPPIA_AVATAR_IMAGE_URL: string = '';

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private preventPageUnloadEventService: PreventPageUnloadEventService
  ) {}

  ngOnInit(): void {
    this.preventPageUnloadEventService.addListener();
    this.OPPIA_AVATAR_IMAGE_URL = (
      this.urlInterpolationService.getStaticImageUrl(
        '/avatar/oppia_avatar_100px.svg'));
  }
}

angular.module('oppia').directive(
  'oppiaDiagnosticTestPlayer', downgradeComponent(
    {component: DiagnosticTestPlayerComponent}));
