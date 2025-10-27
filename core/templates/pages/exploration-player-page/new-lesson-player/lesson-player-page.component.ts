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

import {Component, OnDestroy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {PageContextService} from 'services/page-context.service';
import {MetaTagCustomizationService} from 'services/contextual/meta-tag-customization.service';
import {UrlService} from 'services/contextual/url.service';
import {KeyboardShortcutService} from 'services/keyboard-shortcut.service';
import {PageTitleService} from 'services/page-title.service';
import './lesson-player-page.component.css';
import {ExplorationPermissionsBackendApiService} from 'domain/exploration/exploration-permissions-backend-api.service';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {ContentTranslationManagerService} from '../services/content-translation-manager.service';
import {NewSwitchContentLanguageRefreshRequiredModalComponent} from './conversation-skin-components/conversation-display-components/new-switch-content-language-refresh-required-modal.component';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ContentTranslationLanguageService} from '../services/content-translation-language.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {I18nService} from 'i18n/i18n.service';
import {MobileMenuService} from 'pages/exploration-player-page/services/mobile-menu.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';

require('interactions/interactionsRequires.ts');

@Component({
  selector: 'oppia-new-lesson-player-page',
  templateUrl: './lesson-player-page.component.html',
  styleUrls: ['./lesson-player-page.component.css'],
})
export class NewLessonPlayerPageComponent implements OnDestroy {
  directiveSubscriptions = new Subscription();
  pageIsIframed: boolean = false;
  explorationTitle!: string;
  isLoadingExploration: boolean = true;
  explorationIsUnpublished: boolean = false;
  voiceoversAreLoaded: boolean = false;

  constructor(
    private pageContextService: PageContextService,
    private explorationPermissionsBackendApiService: ExplorationPermissionsBackendApiService,
    private keyboardShortcutService: KeyboardShortcutService,
    private mobileMenuService: MobileMenuService,
    private metaTagCustomizationService: MetaTagCustomizationService,
    private pageTitleService: PageTitleService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private entityVoiceoversService: EntityVoiceoversService,
    private urlService: UrlService,
    private translateService: TranslateService,
    private ngbModal: NgbModal,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private i18nService: I18nService,
    private contentTranslationLanguageService: ContentTranslationLanguageService,
    private playerTranscriptService: PlayerTranscriptService,
    private contentTranslationManagerService: ContentTranslationManagerService
  ) {}

  ngOnInit(): void {
    let explorationId = this.pageContextService.getExplorationId();
    this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(explorationId, null)
      .then((response: FetchExplorationBackendResponse) => {
        this.explorationTitle = response.exploration.title;
        // The onLangChange event is initially fired before the exploration is
        // loaded. Hence the first setpageTitle() call needs to made
        // manually, and the onLangChange subscription is added after
        // the exploration is fetch from the backend.
        this.setPageTitle();
        const currentSiteLanugage =
          this.i18nLanguageCodeService.getCurrentI18nLanguageCode();
        this.entityVoiceoversService.init(
          explorationId,
          'exploration',
          response.version,
          currentSiteLanugage
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

    this.directiveSubscriptions.add(
      this.contentTranslationManagerService.onLanguageChange.subscribe(
        languageCode => {
          const switchLanguageModalPromise =
            this.onLanguageChange(languageCode);

          if (switchLanguageModalPromise) {
            switchLanguageModalPromise.result.then(() => {
              this.i18nService.handleLanguageUpdate(languageCode);
            });
          } else {
            this.i18nService.handleLanguageUpdate(languageCode);
          }
        }
      )
    );
  }

  subscribeToOnLangChange(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  getSidebarIsExpanded(): boolean {
    return this.mobileMenuService.getSidebarIsExpanded();
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

  shouldPromptForRefresh(): boolean {
    const firstCard = this.playerTranscriptService.getCard(0);
    return firstCard.getInputResponsePairs().length > 0;
  }

  showLanguageSwitchModal(modalText: string): NgbModalRef {
    const modalRef = this.ngbModal.open(
      NewSwitchContentLanguageRefreshRequiredModalComponent
    );
    modalRef.componentInstance.modalText = modalText;
    return modalRef;
  }

  onLanguageChange(newLanguageCode: string): NgbModalRef | void {
    const lessonLanguageOptions =
      this.contentTranslationLanguageService.getLanguageOptionsForDropdown();
    const userHasMadeProgress = this.shouldPromptForRefresh();
    let lessonIsTranslatedIntoSelectedLanguage = false;
    for (const option of lessonLanguageOptions) {
      if (option.value === newLanguageCode) {
        if (!userHasMadeProgress) {
          this.contentTranslationManagerService.changeCurrentContentLanguage(
            newLanguageCode
          );
        } else {
          return this.showLanguageSwitchModal(
            'I18N_SWITCH_LANGUAGES_PAGE_REFRESH_NOTICE'
          );
        }
        lessonIsTranslatedIntoSelectedLanguage = true;
        break;
      }
    }
    if (!lessonIsTranslatedIntoSelectedLanguage && !userHasMadeProgress) {
      return this.showLanguageSwitchModal(
        'I18N_SWITCH_LANGUAGES_ENGLISH_ONLY_NOTICE'
      );
    } else if (!lessonIsTranslatedIntoSelectedLanguage && userHasMadeProgress) {
      return this.showLanguageSwitchModal(
        'I18N_SWITCH_LANGUAGES_RESET_AND_ENGLISH_RESTART'
      );
    }
    return;
  }
}
