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
import { ContextService } from 'services/context.service';
import { I18nLanguageCodeService, TranslationKeyType } from
  'services/i18n-language-code.service';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { UrlService } from 'services/contextual/url.service';

@Component({
  selector: 'oppia-player-sidebar',
  templateUrl: './player-sidebar.component.html',
  styleUrls: ['./player-sidebar.component.css'],
})
export class PlayerSidebarComponent implements OnInit {
  mobileMenuVisible: boolean = false;
  sidebarIsExpanded: boolean = false;
  explorationId!: string;
  expDescription!: string;
  expDescTranslationKey!: string;
  avgRating!: number | null;
  fullStars: number = 0;
  blankStars: number = 5;

  constructor(
    private mobileMenuService: MobileMenuService,
    private contextService: ContextService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService,
    private urlService: UrlService,
  ) {}

  ngOnInit(): void {
    this.mobileMenuService.getMenuVisibility().subscribe((visibility) => {
      this.mobileMenuVisible = visibility;
    });
    let pathnameArray = this.urlService.getPathname().split('/');
    let explorationContext = false;

    for (let i = 0; i < pathnameArray.length; i++) {
      if (pathnameArray[i] === 'explore' ||
          pathnameArray[i] === 'create' ||
          pathnameArray[i] === 'skill_editor' ||
          pathnameArray[i] === 'embed' ||
          pathnameArray[i] === 'lesson') {
        explorationContext = true;
        break;
      }
    }

    this.explorationId = explorationContext ?
      this.contextService.getExplorationId() : 'test_id';
    this.expDescription = 'Loading...';
    this.readOnlyExplorationBackendApiService.fetchExplorationAsync(
      this.explorationId,
      this.urlService.getExplorationVersionFromUrl(),
      this.urlService.getPidFromUrl())
      .then((response) => {
        this.expDescription = response.exploration.objective;
      });
    this.expDescTranslationKey = (
      this.i18nLanguageCodeService.
        getExplorationTranslationKey(
          this.explorationId, TranslationKeyType.DESCRIPTION)
    );
  }

  toggleSidebar(): void {
    this.sidebarIsExpanded = !this.sidebarIsExpanded;
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
