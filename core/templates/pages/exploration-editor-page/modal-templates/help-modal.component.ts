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
 * @fileoverview Component for help modal.
 */

import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ContextService } from 'services/context.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';

@Component({
  selector: 'oppia-help-modal',
  templateUrl: './help-modal.component.html',
})
export class HelpModalComponent implements OnInit {
  EDITOR_TUTORIAL_MODE: string = 'editor';
  TRANSLATION_TUTORIAL_MODE: string = 'translation';
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  explorationId!: string;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private siteAnalyticsService: SiteAnalyticsService,
    private contextService: ContextService
  ) {}

  ngOnInit(): void {
    this.explorationId = (
      this.contextService.getExplorationId());
  }

  beginEditorTutorial(): void {
    this.siteAnalyticsService
      .registerOpenTutorialFromHelpCenterEvent(
        this.explorationId);
    this.ngbActiveModal.close(this.EDITOR_TUTORIAL_MODE);
  }

  beginTranslationTutorial(): void {
    this.siteAnalyticsService
      .registerOpenTutorialFromHelpCenterEvent(
        this.explorationId);
    this.ngbActiveModal.close(this.TRANSLATION_TUTORIAL_MODE);
  }

  goToHelpCenter(): void {
    this.siteAnalyticsService.registerVisitHelpCenterEvent(
      this.explorationId);
    this.ngbActiveModal.dismiss('cancel');
  }
}
