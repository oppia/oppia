// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the exploration player page.
 */

import {Component, OnDestroy} from '@angular/core';
import {ExplorationPermissionsBackendApiService} from 'domain/exploration/exploration-permissions-backend-api.service';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {ContextService} from 'services/context.service';
import {MetaTagCustomizationService} from 'services/contextual/meta-tag-customization.service';
import {UrlService} from 'services/contextual/url.service';
import {KeyboardShortcutService} from 'services/keyboard-shortcut.service';
import {PageTitleService} from 'services/page-title.service';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';

require('interactions/interactionsRequires.ts');

@Component({
  selector: 'oppia-exploration-player-page',
  templateUrl: './exploration-player-page.component.html',
})
export class ExplorationPlayerPageComponent implements OnDestroy {
  directiveSubscriptions = new Subscription();
  pageIsIframed: boolean = false;
  explorationTitle!: string;
  isLoadingExploration: boolean = true;
  explorationIsUnpublished: boolean = false;
  voiceoversAreLoaded: boolean = false;

  constructor(
    private contextService: ContextService,
    private explorationPermissionsBackendApiService: ExplorationPermissionsBackendApiService,
    private keyboardShortcutService: KeyboardShortcutService,
    private metaTagCustomizationService: MetaTagCustomizationService,
    private pageTitleService: PageTitleService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private entityVoiceoversService: EntityVoiceoversService,
    private urlService: UrlService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    let explorationId = this.contextService.getExplorationId();
    this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(explorationId, null)
      .then((response: FetchExplorationBackendResponse) => {
        this.explorationTitle = response.exploration.title;
        // The onLangChange event is initially fired before the exploration is
        // loaded. Hence the first setpageTitle() call needs to made
        // manually, and the onLangChange subscription is added after
        // the exploration is fetch from the backend.
        this.setPageTitle();
        this.entityVoiceoversService.init(
          explorationId,
          'exploration',
          response.version,
          response.exploration.language_code
        );

        this.entityVoiceoversService.fetchEntityVoiceovers().then(() => {
          this.voiceoversAreLoaded = true;
        });
        this.subscribeToOnLangChange();
        this.metaTagCustomizationService.addOrReplaceMetaTags([
          {
            propertyType: 'itemprop',
            propertyValue: 'name',
            content: response.exploration.title,
          },
          {
            propertyType: 'itemprop',
            propertyValue: 'description',
            content: response.exploration.objective,
          },
          {
            propertyType: 'property',
            propertyValue: 'og:title',
            content: response.exploration.title,
          },
          {
            propertyType: 'property',
            propertyValue: 'og:description',
            content: response.exploration.objective,
          },
        ]);
      })
      .finally(() => {
        this.isLoadingExploration = false;
      });

    this.pageIsIframed = this.urlService.isIframed();
    this.keyboardShortcutService.bindExplorationPlayerShortcuts();

    this.explorationPermissionsBackendApiService
      .getPermissionsAsync()
      .then(response => {
        this.explorationIsUnpublished = response.canPublish;
      });
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
      'I18N_EXPLORATION_PLAYER_PAGE_TITLE',
      {
        explorationTitle: this.explorationTitle,
      }
    );
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
