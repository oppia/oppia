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
 * @fileoverview Component for the new lesson player page.
 */

import { Component, OnDestroy } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { ContextService } from 'services/context.service';
import { MetaTagCustomizationService } from 'services/contextual/meta-tag-customization.service';
import { UrlService } from 'services/contextual/url.service';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { PageTitleService } from 'services/page-title.service';
import './lesson-player-page.component.css';

require('interactions/interactionsRequires.ts');

@Component({
  selector: 'oppia-new-lesson-player-page',
  templateUrl: './lesson-player-page.component.html',
  styleUrls: ['./lesson-player-page.component.css']
})
export class NewLessonPlayerPageComponent implements OnDestroy {
  directiveSubscriptions = new Subscription();
  pageIsIframed: boolean = false;
  explorationTitle!: string;
  isLoadingExploration: boolean = true;

  constructor(
    private contextService: ContextService,
    private keyboardShortcutService: KeyboardShortcutService,
    private metaTagCustomizationService: MetaTagCustomizationService,
    private pageTitleService: PageTitleService,
    private readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService,
    private urlService: UrlService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    let explorationId = this.contextService.getExplorationId();
    this.readOnlyExplorationBackendApiService.fetchExplorationAsync(
      explorationId, null
    ).then((response: FetchExplorationBackendResponse) => {
      this.explorationTitle = response.exploration.title;
      // The onLangChange event is initially fired before the exploration is
      // loaded. Hence the first setpageTitle() call needs to made
      // manually, and the onLangChange subscription is added after
      // the exploration is fetch from the backend.
      this.setPageTitle();
      this.subscribeToOnLangChange();
      this.metaTagCustomizationService.addOrReplaceMetaTags([
        {
          propertyType: 'itemprop',
          propertyValue: 'name',
          content: response.exploration.title
        },
        {
          propertyType: 'itemprop',
          propertyValue: 'description',
          content: response.exploration.objective
        },
        {
          propertyType: 'property',
          propertyValue: 'og:title',
          content: response.exploration.title
        },
        {
          propertyType: 'property',
          propertyValue: 'og:description',
          content: response.exploration.objective
        }
      ]);
    }).finally(() => {
      this.isLoadingExploration = false;
    }
    );

    this.pageIsIframed = this.urlService.isIframed();
    this.keyboardShortcutService.bindExplorationPlayerShortcuts();
  }

  subscribeToOnLangChange(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_EXPLORATION_PLAYER_PAGE_TITLE', {
        explorationTitle: this.explorationTitle
      });
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaNewLessonPlayerPage',
  downgradeComponent({
    component: NewLessonPlayerPageComponent
  }) as angular.IDirectiveFactory
);
