// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the welcome translation modal.
 */

import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContextService } from 'services/context.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

@Component({
  selector: 'oppia-welcome-translation-modal',
  templateUrl: './welcome-translation-modal.component.html'
})

export class WelcomeTranslationModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  explorationId!: string;
  translationWelcomeImgUrl!: string;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private urlInterpolationService: UrlInterpolationService,
    private contextService: ContextService,
    private siteAnalyticsService: SiteAnalyticsService,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.explorationId = this.contextService.getExplorationId();
    this.siteAnalyticsService.registerTutorialModalOpenEvent(
      this.explorationId);
    this.translationWelcomeImgUrl = this.urlInterpolationService
      .getStaticImageUrl('/general/editor_welcome.svg');
  }
}
