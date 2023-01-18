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

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, discardPeriodicTasks, fakeAsync, flush, TestBed, waitForAsync } from '@angular/core/testing';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { ExplorationLanguageCodeService } from 'pages/exploration-editor-page/services/exploration-language-code.service';
import { RouterService } from 'pages/exploration-editor-page/services/router.service';
import { GraphDataService } from 'pages/exploration-editor-page/services/graph-data.service';
import { TranslationLanguageService } from '../services/translation-language.service';
import { TranslationStatusService } from '../services/translation-status.service';
import { TranslationTabActiveModeService } from '../services/translation-tab-active-mode.service';
import { TranslatorOverviewComponent } from './translator-overview.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ContextService } from 'services/context.service';
import { EntityTranslationsService } from 'services/entity-translations.services';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        TranslatorOverviewComponent
      ],
      providers: [
        ExplorationLanguageCodeService,
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        WindowRef
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(TranslatorOverviewComponent);
    component = fixture.componentInstance;

    contextService = TestBed.inject(ContextService);
    languageUtilService = TestBed.inject(LanguageUtilService);
    focusManagerService = TestBed.inject(FocusManagerService);
    explorationLanguageCodeService = TestBed.inject(
      ExplorationLanguageCodeService);
    stateEditorService = TestBed.inject(StateEditorService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationStatusService = TestBed.inject(TranslationStatusService);
    graphDataService = TestBed.inject(GraphDataService);
    translationTabActiveModeService = TestBed.inject(
      TranslationTabActiveModeService);
    focusManagerService = TestBed.inject(FocusManagerService);
    routerService = TestBed.inject(RouterService);
    entityTranslationsService = TestBed.inject(EntityTranslationsService);

    spyOn(translationTabActiveModeService, 'isTranslationModeActive').and
      .returnValue(true);
    spyOn(translationTabActiveModeService, 'isVoiceoverModeActive').and
      .returnValue(true);
    spyOn(entityTranslationsService, 'getEntityTranslationsAsync')
      .and.resolveTo();

    explorationLanguageCodeService.init(explorationLanguageCode);
    component.isTranslationTabBusy = false;

    component.ngOnInit();
    fixture.detectChanges();

    flush();
    discardPeriodicTasks();
    expect(
      entityTranslationsService.getEntityTranslationsAsync
    ).toHaveBeenCalled();
  }));

  afterEach(fakeAsync(() => {
    flush();
    discardPeriodicTasks();
  }));

  it('should initialize component properties after controller is initialized',
    () => {
      spyOn(contextService, 'isExplorationLinkedToStory').and.returnValue(true);
      component.canShowTabModeSwitcher();

      expect(component.inTranslationMode).toBe(true);
      expect(component.inVoiceoverMode).toBe(true);
      expect(component.languageCodesAndDescriptions.length).toBe(
        languageUtilService.getAllVoiceoverLanguageCodes().length - 1);
      expect(languageUtilService.getAllVoiceoverLanguageCodes()).toContain(
        explorationLanguageCode);
      expect(component.languageCodesAndDescriptions).not.toContain({
        id: explorationLanguageCode,
        description: languageUtilService.getAudioLanguageDescription(
          explorationLanguageCode)
      });
    });

  it('should change to voiceover active mode when changing translation tab',
    fakeAsync(() => {
      spyOn(translationTabActiveModeService, 'activateVoiceoverMode');
      spyOn(translationStatusService, 'refresh');

      component.changeActiveMode('Voiceover');

      expect(translationTabActiveModeService.activateVoiceoverMode)
        .toHaveBeenCalled();
      expect(translationStatusService.refresh).toHaveBeenCalled();

      flush();
      discardPeriodicTasks();
    })
  );

  it('should change to translation active mode when changing translation tab',
    fakeAsync(() => {
      spyOn(translationTabActiveModeService, 'activateTranslationMode');
      spyOn(graphDataService, 'recompute');
      spyOn(translationStatusService, 'refresh');

      component.changeActiveMode('Translate');

      expect(translationTabActiveModeService.activateTranslationMode)
        .toHaveBeenCalled();
      expect(translationStatusService.refresh).toHaveBeenCalled();

      flush();
      discardPeriodicTasks();
      expect(graphDataService.recompute).toHaveBeenCalled();
    })
  );

  it('should change translation language when translation tab is not busy',
    fakeAsync(() => {
      spyOn(translationLanguageService, 'setActiveLanguageCode');
      component.languageCode = 'es';
      component.changeTranslationLanguage();

      flush();
      discardPeriodicTasks();
      expect(translationLanguageService.setActiveLanguageCode)
        .toHaveBeenCalled();
    })
  );

  it('should not change translation language when translation tab is busy',
    fakeAsync(() => {
      component.isTranslationTabBusy = true;
      let showTranslationTabBusyModalEmitter = new EventEmitter();
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOnProperty(stateEditorService, 'onShowTranslationTabBusyModal').and
        .returnValue(showTranslationTabBusyModalEmitter);
      component.changeTranslationLanguage();

      flush();
      discardPeriodicTasks();
      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();

      // Reset value for isTranslationTabBusy.
      component.isTranslationTabBusy = false;
    }));

  it('should get translation bar progress data when there are more' +
    ' than 1 item to be translated', () => {
    spyOn(translationStatusService, 'getExplorationContentRequiredCount').and
      .returnValue(3);
    spyOn(translationStatusService, 'getExplorationContentNotAvailableCount')
      .and.returnValue(1);
    component.getTranslationProgressStyle();
    expect(component.getTranslationProgressAriaLabel()).toBe(
      '2 items translated out of 3 items');
  });

  it('should get translation bar progress data when there is 1 item to be' +
    ' translated', () => {
    spyOn(translationStatusService, 'getExplorationContentRequiredCount')
      .and.returnValue(2);
    spyOn(translationStatusService, 'getExplorationContentNotAvailableCount')
      .and.returnValue(1);
    component.getTranslationProgressStyle();
    expect(component.getTranslationProgressAriaLabel()).toBe(
      '1 item translated out of 2 items');
  });

  it('should apply autofocus to history tab element when tab is switched',
    fakeAsync(() => {
      spyOn(routerService, 'getActiveTabName').and.returnValue('translation');
      spyOn(focusManagerService, 'setFocus');

      component.ngOnInit();

      flush();
      discardPeriodicTasks();

      expect(focusManagerService.setFocus).toHaveBeenCalledWith(
        'audioTranslationLanguageCodeField');
    }));
});
