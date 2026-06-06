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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {ExplorationPermissionsBackendApiService} from 'domain/exploration/exploration-permissions-backend-api.service';
import {PageContextService} from 'services/page-context.service';
import {MetaTagCustomizationService} from 'services/contextual/meta-tag-customization.service';
import {UrlService} from 'services/contextual/url.service';
import {KeyboardShortcutService} from 'services/keyboard-shortcut.service';
import {PageTitleService} from 'services/page-title.service';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {MobileMenuService} from 'pages/exploration-player-page/services/mobile-menu.service';
import {ContentTranslationManagerService} from '../services/content-translation-manager.service';
import {ContentTranslationLanguageService} from '../services/content-translation-language.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {I18nService} from 'i18n/i18n.service';
import {NewLessonPlayerPageComponent} from './lesson-player-page.component';
import {NewSwitchContentLanguageRefreshRequiredModalComponent} from './conversation-skin-components/conversation-display-components/new-switch-content-language-refresh-required-modal.component';
import {CookieService} from 'ngx-cookie';
import {TranslateCacheService} from 'ngx-translate-cache';

/**
 * @fileoverview Unit tests for new lesson player page component.
 */

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

class MockCard {
  private inputResponsePairs: unknown[] = [];

  constructor(inputResponsePairs: unknown[] = []) {
    this.inputResponsePairs = inputResponsePairs;
  }

  getInputResponsePairs(): unknown[] {
    return this.inputResponsePairs;
  }
}

class MockTranslateCacheService {
  init(): void {}
  getCachedLanguage(): string {
    return 'cached_lang';
  }
}

class MockCookieService {
  get(key: string): string {
    return '';
  }

  set(key: string, value: string): void {}

  remove(key: string): void {}
}

describe('New Lesson Player Page', () => {
  let fixture: ComponentFixture<NewLessonPlayerPageComponent>;
  let componentInstance: NewLessonPlayerPageComponent;
  let pageContextService: PageContextService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let keyboardShortcutService: KeyboardShortcutService;
  let metaTagCustomizationService: MetaTagCustomizationService;
  let pageTitleService: PageTitleService;
  let readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService;
  let explorationPermissionsBackendApiService: ExplorationPermissionsBackendApiService;
  let entityVoiceoversService: EntityVoiceoversService;
  let urlService: UrlService;
  let mobileMenuService: MobileMenuService;
  let translateService: TranslateService;
  let ngbModal: NgbModal;
  let i18nService: I18nService;
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let playerTranscriptService: PlayerTranscriptService;
  let contentTranslationManagerService: ContentTranslationManagerService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [NewLessonPlayerPageComponent],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: TranslateCacheService,
          useClass: MockTranslateCacheService,
        },
        {
          provide: CookieService,
          useClass: MockCookieService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NewLessonPlayerPageComponent);
    componentInstance = fixture.componentInstance;
    pageContextService = TestBed.inject(PageContextService);
    mobileMenuService = TestBed.inject(MobileMenuService);
    keyboardShortcutService = TestBed.inject(KeyboardShortcutService);
    metaTagCustomizationService = TestBed.inject(MetaTagCustomizationService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    pageTitleService = TestBed.inject(PageTitleService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    );
    explorationPermissionsBackendApiService = TestBed.inject(
      ExplorationPermissionsBackendApiService
    );
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    urlService = TestBed.inject(UrlService);
    translateService = TestBed.inject(TranslateService);
    ngbModal = TestBed.inject(NgbModal);
    i18nService = TestBed.inject(I18nService);
    contentTranslationLanguageService = TestBed.inject(
      ContentTranslationLanguageService
    );
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    contentTranslationManagerService = TestBed.inject(
      ContentTranslationManagerService
    );
  }));

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should return sidebar expanded state from mobileMenuService', () => {
    spyOn(mobileMenuService, 'getSidebarIsExpanded').and.returnValue(true);
    expect(componentInstance.getSidebarIsExpanded()).toBe(true);

    (mobileMenuService.getSidebarIsExpanded as jasmine.Spy).and.returnValue(
      false
    );
    expect(componentInstance.getSidebarIsExpanded()).toBe(false);
  });

  it('should initialize component successfully', fakeAsync(() => {
    const expId = 'exp_id';
    const response = {
      exploration: {
        title: 'Test',
        objective: 'test objective',
        language_code: 'en',
      },
      version: 1,
    };
    const permissionsResponse = {
      canPublish: false,
    };

    spyOn(pageContextService, 'getExplorationId').and.returnValue(expId);
    spyOn(
      i18nLanguageCodeService,
      'getCurrentI18nLanguageCode'
    ).and.returnValue('en');
    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(
      Promise.resolve(response as FetchExplorationBackendResponse)
    );
    spyOn(
      explorationPermissionsBackendApiService,
      'getPermissionsAsync'
    ).and.returnValue(Promise.resolve(permissionsResponse));
    spyOn(entityVoiceoversService, 'init');
    spyOn(entityVoiceoversService, 'fetchEntityVoiceovers').and.returnValue(
      Promise.resolve()
    );
    spyOn(componentInstance, 'setPageTitle');
    spyOn(componentInstance, 'subscribeToOnLangChange');
    spyOn(metaTagCustomizationService, 'addOrReplaceMetaTags');
    spyOn(keyboardShortcutService, 'bindExplorationPlayerShortcuts');
    spyOn(urlService, 'isIframed').and.returnValue(false);
    spyOn(
      contentTranslationManagerService.onLanguageChange,
      'subscribe'
    ).and.returnValue({
      unsubscribe: jasmine.createSpy('unsubscribe'),
    });

    componentInstance.ngOnInit();
    tick();

    expect(pageContextService.getExplorationId).toHaveBeenCalled();
    expect(
      readOnlyExplorationBackendApiService.fetchExplorationAsync
    ).toHaveBeenCalledWith(expId, null);
    expect(entityVoiceoversService.init).toHaveBeenCalledWith(
      expId,
      'exploration',
      response.version,
      response.exploration.language_code
    );
    expect(entityVoiceoversService.fetchEntityVoiceovers).toHaveBeenCalled();
    expect(componentInstance.setPageTitle).toHaveBeenCalled();
    expect(componentInstance.subscribeToOnLangChange).toHaveBeenCalled();
    expect(
      metaTagCustomizationService.addOrReplaceMetaTags
    ).toHaveBeenCalledWith([
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
    expect(urlService.isIframed).toHaveBeenCalled();
    expect(
      keyboardShortcutService.bindExplorationPlayerShortcuts
    ).toHaveBeenCalled();
    expect(
      explorationPermissionsBackendApiService.getPermissionsAsync
    ).toHaveBeenCalled();
    expect(componentInstance.explorationTitle).toBe(response.exploration.title);
    expect(componentInstance.isLoadingExploration).toBe(false);
    expect(componentInstance.explorationIsUnpublished).toBe(false);
    expect(componentInstance.pageIsIframed).toBe(false);
    expect(componentInstance.voiceoversAreLoaded).toBe(true);
  }));

  it('should set explorationIsUnpublished to true when canPublish is true', fakeAsync(() => {
    const expId = 'exp_id';
    const response = {
      exploration: {
        title: 'Test',
        objective: 'test objective',
        language_code: 'en',
      },
      version: 1,
    };
    const permissionsResponse = {
      canPublish: true,
    };

    spyOn(pageContextService, 'getExplorationId').and.returnValue(expId);
    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(
      Promise.resolve(response as FetchExplorationBackendResponse)
    );
    spyOn(
      explorationPermissionsBackendApiService,
      'getPermissionsAsync'
    ).and.returnValue(Promise.resolve(permissionsResponse));
    spyOn(entityVoiceoversService, 'init');
    spyOn(entityVoiceoversService, 'fetchEntityVoiceovers').and.returnValue(
      Promise.resolve()
    );
    spyOn(componentInstance, 'setPageTitle');
    spyOn(componentInstance, 'subscribeToOnLangChange');
    spyOn(metaTagCustomizationService, 'addOrReplaceMetaTags');
    spyOn(keyboardShortcutService, 'bindExplorationPlayerShortcuts');
    spyOn(urlService, 'isIframed').and.returnValue(true);
    spyOn(
      contentTranslationManagerService.onLanguageChange,
      'subscribe'
    ).and.returnValue({
      unsubscribe: jasmine.createSpy('unsubscribe'),
    });

    componentInstance.ngOnInit();
    tick();

    expect(componentInstance.explorationIsUnpublished).toBe(true);
    expect(componentInstance.pageIsIframed).toBe(true);
  }));

  it('should handle content translation language change with modal acceptance', fakeAsync(() => {
    const mockModalRef = {
      result: Promise.resolve(),
      componentInstance: {},
    } as NgbModalRef;

    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp_id');
    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(
      Promise.resolve({
        exploration: {
          title: 'Test',
          objective: 'test objective',
          language_code: 'en',
        },
        version: 1,
      } as FetchExplorationBackendResponse)
    );
    spyOn(
      explorationPermissionsBackendApiService,
      'getPermissionsAsync'
    ).and.returnValue(Promise.resolve({canPublish: false}));
    spyOn(entityVoiceoversService, 'init');
    spyOn(entityVoiceoversService, 'fetchEntityVoiceovers').and.returnValue(
      Promise.resolve()
    );
    spyOn(componentInstance, 'setPageTitle');
    spyOn(componentInstance, 'subscribeToOnLangChange');
    spyOn(metaTagCustomizationService, 'addOrReplaceMetaTags');
    spyOn(keyboardShortcutService, 'bindExplorationPlayerShortcuts');
    spyOn(urlService, 'isIframed').and.returnValue(false);
    spyOn(componentInstance, 'onLanguageChange').and.returnValue(mockModalRef);
    spyOn(i18nService, 'handleLanguageUpdate');

    let languageChangeCallback: (languageCode: string) => void;
    spyOn(
      contentTranslationManagerService.onLanguageChange,
      'subscribe'
    ).and.callFake((callback: (languageCode: string) => void) => {
      languageChangeCallback = callback;
      return {
        unsubscribe: jasmine.createSpy('unsubscribe'),
      };
    });

    componentInstance.ngOnInit();
    tick();

    languageChangeCallback('es');
    tick();

    expect(componentInstance.onLanguageChange).toHaveBeenCalledWith('es');
    expect(i18nService.handleLanguageUpdate).toHaveBeenCalledWith('es');
  }));

  it('should handle content translation language change without modal', fakeAsync(() => {
    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp_id');
    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(
      Promise.resolve({
        exploration: {
          title: 'Test',
          objective: 'test objective',
          language_code: 'en',
        },
        version: 1,
      } as FetchExplorationBackendResponse)
    );
    spyOn(
      explorationPermissionsBackendApiService,
      'getPermissionsAsync'
    ).and.returnValue(Promise.resolve({canPublish: false}));
    spyOn(entityVoiceoversService, 'init');
    spyOn(entityVoiceoversService, 'fetchEntityVoiceovers').and.returnValue(
      Promise.resolve()
    );
    spyOn(componentInstance, 'setPageTitle');
    spyOn(componentInstance, 'subscribeToOnLangChange');
    spyOn(metaTagCustomizationService, 'addOrReplaceMetaTags');
    spyOn(keyboardShortcutService, 'bindExplorationPlayerShortcuts');
    spyOn(urlService, 'isIframed').and.returnValue(false);
    spyOn(componentInstance, 'onLanguageChange').and.returnValue(undefined);
    spyOn(i18nService, 'handleLanguageUpdate');

    let languageChangeCallback: (languageCode: string) => void;
    spyOn(
      contentTranslationManagerService.onLanguageChange,
      'subscribe'
    ).and.callFake((callback: (languageCode: string) => void) => {
      languageChangeCallback = callback;
      return {
        unsubscribe: jasmine.createSpy('unsubscribe'),
      };
    });

    componentInstance.ngOnInit();
    tick();

    languageChangeCallback('es');

    expect(componentInstance.onLanguageChange).toHaveBeenCalledWith('es');
    expect(i18nService.handleLanguageUpdate).toHaveBeenCalledWith('es');
  }));

  it('should obtain translated page title whenever the selected language changes', () => {
    componentInstance.subscribeToOnLangChange();
    spyOn(componentInstance, 'setPageTitle');
    translateService.onLangChange.emit();

    expect(componentInstance.directiveSubscriptions.closed).toBe(false);
    expect(componentInstance.setPageTitle).toHaveBeenCalled();
  });

  it('should set new page title', () => {
    spyOn(pageTitleService, 'setDocumentTitle');
    componentInstance.explorationTitle = 'dummy_name';
    componentInstance.setPageTitle();

    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_EXPLORATION_PLAYER_PAGE_TITLE'
    );
  });

  it('should show language switch modal', () => {
    const mockModalRef = {
      componentInstance: {},
    } as NgbModalRef;
    const modalText = 'Test modal text';

    spyOn(ngbModal, 'open').and.returnValue(mockModalRef);

    const result = componentInstance.showLanguageSwitchModal(modalText);

    expect(ngbModal.open).toHaveBeenCalledWith(
      NewSwitchContentLanguageRefreshRequiredModalComponent
    );
    expect(result.componentInstance.modalText).toBe(modalText);
    expect(result).toBe(mockModalRef);
  });

  it('should handle language change when lesson is translated and no progress made', () => {
    const newLanguageCode = 'es';
    const languageOptions = [
      {value: 'en', displayed: 'English'},
      {value: 'es', displayed: 'Spanish'},
    ];

    spyOn(
      contentTranslationLanguageService,
      'getLanguageOptionsForDropdown'
    ).and.returnValue(languageOptions);
    spyOn(componentInstance, 'shouldPromptForRefresh').and.returnValue(false);
    spyOn(contentTranslationManagerService, 'changeCurrentContentLanguage');
    spyOn(componentInstance, 'showLanguageSwitchModal');

    const result = componentInstance.onLanguageChange(newLanguageCode);

    expect(
      contentTranslationLanguageService.getLanguageOptionsForDropdown
    ).toHaveBeenCalled();
    expect(componentInstance.shouldPromptForRefresh).toHaveBeenCalled();
    expect(
      contentTranslationManagerService.changeCurrentContentLanguage
    ).toHaveBeenCalledWith(newLanguageCode);
    expect(componentInstance.showLanguageSwitchModal).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('should handle language change when lesson is translated and progress made', () => {
    const newLanguageCode = 'es';
    const languageOptions = [
      {value: 'en', displayed: 'English'},
      {value: 'es', displayed: 'Spanish'},
    ];
    const mockModalRef = {} as NgbModalRef;

    spyOn(
      contentTranslationLanguageService,
      'getLanguageOptionsForDropdown'
    ).and.returnValue(languageOptions);
    spyOn(componentInstance, 'shouldPromptForRefresh').and.returnValue(true);
    spyOn(contentTranslationManagerService, 'changeCurrentContentLanguage');
    spyOn(componentInstance, 'showLanguageSwitchModal').and.returnValue(
      mockModalRef
    );

    const result = componentInstance.onLanguageChange(newLanguageCode);

    expect(
      contentTranslationLanguageService.getLanguageOptionsForDropdown
    ).toHaveBeenCalled();
    expect(componentInstance.shouldPromptForRefresh).toHaveBeenCalled();
    expect(
      contentTranslationManagerService.changeCurrentContentLanguage
    ).not.toHaveBeenCalled();
    expect(componentInstance.showLanguageSwitchModal).toHaveBeenCalledWith(
      'I18N_SWITCH_LANGUAGES_PAGE_REFRESH_NOTICE'
    );
    expect(result).toBe(mockModalRef);
  });

  it('should handle language change when lesson is not translated and no progress made', () => {
    const newLanguageCode = 'fr';
    const languageOptions = [
      {value: 'en', displayed: 'English'},
      {value: 'es', displayed: 'Spanish'},
    ];
    const mockModalRef = {} as NgbModalRef;

    spyOn(
      contentTranslationLanguageService,
      'getLanguageOptionsForDropdown'
    ).and.returnValue(languageOptions);
    spyOn(componentInstance, 'shouldPromptForRefresh').and.returnValue(false);
    spyOn(contentTranslationManagerService, 'changeCurrentContentLanguage');
    spyOn(componentInstance, 'showLanguageSwitchModal').and.returnValue(
      mockModalRef
    );

    const result = componentInstance.onLanguageChange(newLanguageCode);

    expect(
      contentTranslationLanguageService.getLanguageOptionsForDropdown
    ).toHaveBeenCalled();
    expect(componentInstance.shouldPromptForRefresh).toHaveBeenCalled();
    expect(
      contentTranslationManagerService.changeCurrentContentLanguage
    ).not.toHaveBeenCalled();
    expect(componentInstance.showLanguageSwitchModal).toHaveBeenCalledWith(
      'I18N_SWITCH_LANGUAGES_ENGLISH_ONLY_NOTICE'
    );
    expect(result).toBe(mockModalRef);
  });

  it('should handle language change when lesson is not translated and progress made', () => {
    const newLanguageCode = 'fr';
    const languageOptions = [
      {value: 'en', displayed: 'English'},
      {value: 'es', displayed: 'Spanish'},
    ];
    const mockModalRef = {} as NgbModalRef;

    spyOn(
      contentTranslationLanguageService,
      'getLanguageOptionsForDropdown'
    ).and.returnValue(languageOptions);
    spyOn(componentInstance, 'shouldPromptForRefresh').and.returnValue(true);
    spyOn(contentTranslationManagerService, 'changeCurrentContentLanguage');
    spyOn(componentInstance, 'showLanguageSwitchModal').and.returnValue(
      mockModalRef
    );

    const result = componentInstance.onLanguageChange(newLanguageCode);

    expect(
      contentTranslationLanguageService.getLanguageOptionsForDropdown
    ).toHaveBeenCalled();
    expect(componentInstance.shouldPromptForRefresh).toHaveBeenCalled();
    expect(
      contentTranslationManagerService.changeCurrentContentLanguage
    ).not.toHaveBeenCalled();
    expect(componentInstance.showLanguageSwitchModal).toHaveBeenCalledWith(
      'I18N_SWITCH_LANGUAGES_RESET_AND_ENGLISH_RESTART'
    );
    expect(result).toBe(mockModalRef);
  });

  it('should return true when shouldPromptForRefresh has input response pairs', () => {
    const mockCard = new MockCard([{input: 'test', response: 'test'}]);
    spyOn(playerTranscriptService, 'getCard').and.returnValue(mockCard);

    const result = componentInstance.shouldPromptForRefresh();

    expect(playerTranscriptService.getCard).toHaveBeenCalledWith(0);
    expect(result).toBe(true);
  });

  it('should return false when shouldPromptForRefresh has no input response pairs', () => {
    const mockCard = new MockCard([]);
    spyOn(playerTranscriptService, 'getCard').and.returnValue(mockCard);

    const result = componentInstance.shouldPromptForRefresh();

    expect(playerTranscriptService.getCard).toHaveBeenCalledWith(0);
    expect(result).toBe(false);
  });

  it('should unsubscribe on component destruction', () => {
    componentInstance.subscribeToOnLangChange();
    expect(componentInstance.directiveSubscriptions.closed).toBe(false);
    componentInstance.ngOnDestroy();

    expect(componentInstance.directiveSubscriptions.closed).toBe(true);
  });
});
