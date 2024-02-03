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
 * @fileoverview Component for the new lesson player sidebar
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { MobileMenuService } from '../new-lesson-player-services/mobile-menu.service';
import './player-sidebar.component.css';
import { LearnerExplorationSummaryBackendDict } from
  'domain/summary/learner-exploration-summary.model';
import { I18nLanguageCodeService, TranslationKeyType } from
  'services/i18n-language-code.service';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';

@Component({
  selector: 'oppia-player-sidebar',
  templateUrl: './player-sidebar.component.html',
  styleUrls: ['./player-sidebar.component.css'],
})
export class PlayerSidebarComponent implements OnInit {
  mobileMenuVisible: boolean;
  isExpanded = false;
  explorationId!: string;
  expInfo!: LearnerExplorationSummaryBackendDict;
  expDesc!: string;
  expDescTranslationKey!: string;

  constructor(
    private mobileMenuService: MobileMenuService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private contextService: ContextService,
    private readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService,
    private urlService: UrlService,
  ) {}

  ngOnInit() {
    this.mobileMenuService.getMenuVisibility().subscribe((visibility) => {
      this.mobileMenuVisible = visibility;
    });

    this.explorationId = this.contextService.getExplorationId();
    this.expDesc = 'Loading...';
    this.readOnlyExplorationBackendApiService.fetchExplorationAsync(
      this.explorationId,
      this.urlService.getExplorationVersionFromUrl(),
      this.urlService.getPidFromUrl())
      .then((response) => {
        this.expDesc = response.exploration.objective;
      });
    this.expDescTranslationKey = (
      this.i18nLanguageCodeService.
        getExplorationTranslationKey(
          this.explorationId, TranslationKeyType.DESCRIPTION)
    );
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  isHackyExpDescTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.expDescTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }
}

angular.module('oppia').directive('oppiaPlayerHeader',
  downgradeComponent({
    component: PlayerSidebarComponent
  }) as angular.IDirectiveFactory);
