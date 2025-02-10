// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for translatorOverview.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {ExplorationLanguageCodeService} from 'pages/exploration-editor-page/services/exploration-language-code.service';
import {RouterService} from 'pages/exploration-editor-page/services/router.service';
import {GraphDataService} from 'pages/exploration-editor-page/services/graph-data.service';
import {TranslationLanguageService} from '../services/translation-language.service';
import {TranslationStatusService} from '../services/translation-status.service';
import {TranslationTabActiveModeService} from '../services/translation-tab-active-mode.service';
import {TranslatorOverviewComponent} from './translator-overview.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ContextService} from 'services/context.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {ChangeListService} from '../../services/change-list.service';
import {EntityTranslation} from 'domain/translation/EntityTranslationObjectFactory';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {EntityVoiceovers} from '../../../../domain/voiceover/entity-voiceovers.model';
import {Voiceover} from '../../../../domain/exploration/voiceover.model';
import {LocalStorageService} from 'services/local-storage.service';
import {VoiceoverPlayerService} from '../../../exploration-player-page/services/voiceover-player.service';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

class MockContextService {
  getExplorationId() {
    return 'expId';
  }

  isExplorationLinkedToStory() {
    return true;
  }
}

class MockPlatformFeatureService {
  get status(): object {
    return {
      EnableVoiceoverContribution: {
        isEnabled: true,
      },
      AddVoiceoverWithAccent: {
        isEnabled: false,
      },
    };
  }
}

describe('Translator Overview component', () => {
  let component: TranslatorOverviewComponent;
  let contextService: ContextService;
  let fixture: ComponentFixture<TranslatorOverviewComponent>;
  let explorationLanguageCodeService: ExplorationLanguageCodeService;
  let languageUtilService: LanguageUtilService;
  let stateEditorService: StateEditorService;
  let translationLanguageService: TranslationLanguageService;
  let translationStatusService: TranslationStatusService;
  let graphDataService: GraphDataService;
  let translationTabActiveModeService: TranslationTabActiveModeService;
  let explorationLanguageCode: string = 'hi';
  let focusManagerService: FocusManagerService;
  let routerService: RouterService;
  let entityTranslationsService: EntityTranslationsService;
  let entityVoiceoversService: EntityVoiceoversService;
  let changeListService: ChangeListService;
  let windowRef: WindowRef;
  let entityTranslation: EntityTranslation;
  let voiceoverBackendApiService: VoiceoverBackendApiService;
  let localStorageService: LocalStorageService;
  let voiceoverPlayerService: VoiceoverPlayerService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [TranslatorOverviewComponent],
      providers: [
        ExplorationLanguageCodeService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: ContextService,
          useClass: MockContextService,
        },
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
        WindowRef,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(TranslatorOverviewComponent);
    component = fixture.componentInstance;

    contextService = TestBed.inject(ContextService);
    languageUtilService = TestBed.inject(LanguageUtilService);
    focusManagerService = TestBed.inject(FocusManagerService);
    explorationLanguageCodeService = TestBed.inject(
      ExplorationLanguageCodeService
    );
    stateEditorService = TestBed.inject(StateEditorService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationStatusService = TestBed.inject(TranslationStatusService);
    graphDataService = TestBed.inject(GraphDataService);
    translationTabActiveModeService = TestBed.inject(
      TranslationTabActiveModeService
    );
    focusManagerService = TestBed.inject(FocusManagerService);
    routerService = TestBed.inject(RouterService);
    entityTranslationsService = TestBed.inject(EntityTranslationsService);
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);
    changeListService = TestBed.inject(ChangeListService);
    windowRef = TestBed.inject(WindowRef);
    localStorageService = TestBed.inject(LocalStorageService);
    voiceoverPlayerService = TestBed.inject(VoiceoverPlayerService);

    spyOn(
      translationTabActiveModeService,
      'isTranslationModeActive'
    ).and.returnValue(true);
    spyOn(
      translationTabActiveModeService,
      'isVoiceoverModeActive'
    ).and.returnValue(true);
    spyOn(
      entityTranslationsService,
      'getEntityTranslationsAsync'
    ).and.resolveTo();
    spyOn(entityVoiceoversService, 'fetchEntityVoiceovers').and.resolveTo();
    let languageAccentMasterList = {
      en: {
        'en-IN': 'English (India)',
        'en-US': 'English (United State)',
      },
      hi: {
        'hi-IN': 'Hindi (India)',
      },
    };
    let languageCodesMapping = {
      en: {
        'en-US': true,
      },
      hi: {
        'hi-IN': true,
      },
    };

    let voiceoverAdminDataResponse = {
      languageAccentMasterList: languageAccentMasterList,
      languageCodesMapping: languageCodesMapping,
    };
    spyOn(translationLanguageService, 'setActiveLanguageAccentCode');
    spyOn(
      voiceoverBackendApiService,
      'fetchVoiceoverAdminDataAsync'
    ).and.resolveTo(Promise.resolve(voiceoverAdminDataResponse));
    spyOn(voiceoverPlayerService, 'setLanguageAccentCodesDescriptions');

    explorationLanguageCodeService.init(explorationLanguageCode);
    component.isTranslationTabBusy = false;

    component.ngOnInit();
    fixture.detectChanges();
    tick();

    flush();
    discardPeriodicTasks();
  }));

  afterEach(fakeAsync(() => {
    flush();
    discardPeriodicTasks();
  }));

  describe('when change list contains changes', () => {
    beforeEach(() => {
      entityTranslation = new EntityTranslation(
        'entityId',
        'entityType',
        1,
        'hi',
        {
          content1: new TranslatedContent('translated content', 'html', false),
        }
      );
      entityTranslationsService.languageCodeToLatestEntityTranslations = {
        hi: entityTranslation,
      };
      spyOn(windowRef.nativeWindow.localStorage, 'getItem').and.returnValue(
        'hi'
      );
      entityTranslationsService.getEntityTranslationsAsync = jasmine
        .createSpy()
        .and.returnValue(Promise.resolve(entityTranslation));
    });

    it('should update entity translations with edit translation changes', fakeAsync(() => {
      expect(
        entityTranslationsService.getHtmlTranslations('hi', ['content1'])
      ).toEqual(['translated content']);

      spyOn(changeListService, 'getTranslationChangeList').and.returnValue([
        {
          cmd: 'edit_translation',
          content_id: 'content1',
          language_code: 'hi',
          translation: {
            content_value: 'new translation',
            content_format: 'html',
            needs_update: false,
          },
        },
      ]);

      spyOn(
        translationLanguageService,
        'getActiveLanguageCode'
      ).and.returnValue(undefined as unknown as string);

      component.ngOnInit();
      tick();

      expect(
        entityTranslationsService.getHtmlTranslations('hi', ['content1'])
      ).toEqual(['new translation']);
    }));

    it('should handle mark needs update translation changes', fakeAsync(() => {
      let translatedContent = entityTranslation.getWrittenTranslation(
        'content1'
      ) as TranslatedContent;
      expect(translatedContent.needsUpdate).toBeFalse();

      spyOn(changeListService, 'getTranslationChangeList').and.returnValue([
        {
          cmd: 'mark_translations_needs_update',
          content_id: 'content1',
        },
      ]);

      component.ngOnInit();
      tick();

      translatedContent = entityTranslation.getWrittenTranslation(
        'content1'
      ) as TranslatedContent;
      expect(translatedContent.needsUpdate).toBeTrue();
    }));

    it('should handle mark needs update translation changes for language', fakeAsync(() => {
      let translatedContent = entityTranslation.getWrittenTranslation(
        'content1'
      ) as TranslatedContent;
      expect(translatedContent.needsUpdate).toBeFalse();

      spyOn(changeListService, 'getTranslationChangeList').and.returnValue([
        {
          cmd: 'mark_translation_needs_update_for_language',
          content_id: 'content1',
          language_code: 'hi',
        },
      ]);
      spyOn(
        translationLanguageService,
        'getActiveLanguageCode'
      ).and.returnValue(undefined as unknown as string);

      component.ngOnInit();
      tick();

      translatedContent = entityTranslation.getWrittenTranslation(
        'content1'
      ) as TranslatedContent;
      expect(translatedContent.needsUpdate).toBeTrue();
    }));

    it('should update entity translations with remove translation changes', fakeAsync(() => {
      expect(entityTranslation.hasWrittenTranslation('content1')).toBeTrue();

      spyOn(changeListService, 'getTranslationChangeList').and.returnValue([
        {
          cmd: 'remove_translations',
          content_id: 'content1',
        },
      ]);

      component.ngOnInit();
      tick();

      expect(entityTranslation.hasWrittenTranslation('content1')).toBeFalse();
    }));

    it(
      'should set language code to previously selected one when there is no' +
        'active language code selected',
      fakeAsync(() => {
        spyOn(
          translationLanguageService,
          'getActiveLanguageCode'
        ).and.returnValue(undefined as unknown as string);

        component.ngOnInit();
        tick();

        expect(component.languageCode).toBe('hi');
      })
    );
  });

  it('should initialize component properties after controller is initialized', () => {
    spyOn(contextService, 'isExplorationLinkedToStory').and.returnValue(true);
    component.canShowTabModeSwitcher();

    expect(component.inTranslationMode).toBe(true);
    expect(component.inVoiceoverMode).toBe(true);
    expect(component.languageCodesAndDescriptions.length).toBe(
      languageUtilService.getAllVoiceoverLanguageCodes().length - 1
    );
    expect(languageUtilService.getAllVoiceoverLanguageCodes()).toContain(
      explorationLanguageCode
    );
    expect(component.languageCodesAndDescriptions).not.toContain({
      id: explorationLanguageCode,
      description: languageUtilService.getAudioLanguageDescription(
        explorationLanguageCode
      ),
    });
  });

  describe('when selected language is not exploration language', () => {
    beforeEach(() => {
      component.languageCode = 'hi';
      explorationLanguageCodeService.init('en');
    });

    it('should show mode switcher if exploration is linked to story', () => {
      spyOn(contextService, 'isExplorationLinkedToStory').and.returnValue(true);
      expect(component.canShowTabModeSwitcher()).toBeTrue;
    });

    it('should not show mode switcher if exploration is not linked to story', () => {
      spyOn(contextService, 'isExplorationLinkedToStory').and.returnValue(
        false
      );
      expect(component.canShowTabModeSwitcher()).toBeFalse;
    });
  });

  it('should change to voiceover active mode when changing translation tab', fakeAsync(() => {
    spyOn(translationTabActiveModeService, 'activateVoiceoverMode');
    spyOn(translationStatusService, 'refresh');

    component.changeActiveMode('Voiceover');

    expect(
      translationTabActiveModeService.activateVoiceoverMode
    ).toHaveBeenCalled();
    expect(translationStatusService.refresh).toHaveBeenCalled();

    flush();
    discardPeriodicTasks();
  }));

  it('should change to translation active mode when changing translation tab', fakeAsync(() => {
    spyOn(translationTabActiveModeService, 'activateTranslationMode');
    spyOn(graphDataService, 'recompute');
    spyOn(translationStatusService, 'refresh');

    component.changeActiveMode('Translate');

    expect(
      translationTabActiveModeService.activateTranslationMode
    ).toHaveBeenCalled();
    expect(translationStatusService.refresh).toHaveBeenCalled();

    flush();
    discardPeriodicTasks();
    expect(graphDataService.recompute).toHaveBeenCalled();
  }));

  it('should change translation language when translation tab is not busy', fakeAsync(() => {
    spyOn(translationLanguageService, 'setActiveLanguageCode');
    component.languageCode = 'es';
    component.changeTranslationLanguage();

    flush();
    discardPeriodicTasks();
    expect(translationLanguageService.setActiveLanguageCode).toHaveBeenCalled();
  }));

  it('should not change translation language when translation tab is busy', fakeAsync(() => {
    component.isTranslationTabBusy = true;
    let showTranslationTabBusyModalEmitter = new EventEmitter();
    spyOn(showTranslationTabBusyModalEmitter, 'emit');
    spyOnProperty(
      stateEditorService,
      'onShowTranslationTabBusyModal'
    ).and.returnValue(showTranslationTabBusyModalEmitter);
    component.changeTranslationLanguage();

    flush();
    discardPeriodicTasks();
    expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();

    // Reset value for isTranslationTabBusy.
    component.isTranslationTabBusy = false;
  }));

  it(
    'should get translation bar progress data when there are more' +
      ' than 1 item to be translated',
    () => {
      spyOn(
        translationStatusService,
        'getExplorationContentRequiredCount'
      ).and.returnValue(3);
      spyOn(
        translationStatusService,
        'getExplorationContentNotAvailableCount'
      ).and.returnValue(1);
      component.getTranslationProgressStyle();
      expect(component.getTranslationProgressAriaLabel()).toBe(
        '2 items translated out of 3 items'
      );
    }
  );

  it(
    'should get translation bar progress data when there is 1 item to be' +
      ' translated',
    () => {
      spyOn(
        translationStatusService,
        'getExplorationContentRequiredCount'
      ).and.returnValue(2);
      spyOn(
        translationStatusService,
        'getExplorationContentNotAvailableCount'
      ).and.returnValue(1);
      component.getTranslationProgressStyle();
      expect(component.getTranslationProgressAriaLabel()).toBe(
        '1 item translated out of 2 items'
      );
    }
  );

  it('should apply autofocus to history tab element when tab is switched', fakeAsync(() => {
    spyOn(routerService, 'getActiveTabName').and.returnValue('translation');
    spyOn(focusManagerService, 'setFocus');

    component.ngOnInit();

    flush();
    discardPeriodicTasks();

    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'audioTranslationLanguageCodeField'
    );
  }));

  it('should be able to update language accent dropdown options on language change', fakeAsync(() => {
    let manualVoiceover1 = new Voiceover('a.mp3', 1000, false, 10.0);
    let manualVoiceover2 = new Voiceover('b.mp3', 1000, false, 10.0);

    let entityVoiceovers = new EntityVoiceovers(
      'exp_id',
      'exploration',
      5,
      'en-US',
      {
        content_0: {
          manual: manualVoiceover1,
        },
        content_8: {
          manual: manualVoiceover2,
        },
      }
    );
    component.languageCode = 'en';
    let languageAccentMasterList = {
      en: {
        'en-IN': 'English (India)',
        'en-US': 'English (United States)',
      },
      hi: {
        'hi-IN': 'Hindi (India)',
      },
    };

    let languageCodesMapping = {
      en: {
        'en-US': false,
        'en-IN': false,
      },
      hi: {
        'hi-IN': false,
      },
    };

    component.languageAccentMasterList = languageAccentMasterList;
    component.languageCodesMapping = languageCodesMapping;

    entityVoiceoversService.setLanguageCode('en');
    entityVoiceoversService.addEntityVoiceovers('en-IN', entityVoiceovers);

    localStorageService.setLastSelectedLanguageAccentCode('en-IN');

    component.updateLanguageAccentCodesDropdownOptions();
    tick(5);
    flush();
    discardPeriodicTasks();

    expect(component.selectedLanguageAccentCode).toEqual('en-IN');

    localStorageService.setLastSelectedLanguageAccentCode(undefined);

    component.updateLanguageAccentCodesDropdownOptions();
    tick(5);
    flush();
    discardPeriodicTasks();

    expect(component.selectedLanguageAccentCode).toEqual('en-US');
  }));
});
