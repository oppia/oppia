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
 * @fileoverview Unit tests for RouterService.
 */

import {RouterService} from './router.service';
import {Subscription} from 'rxjs';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  discardPeriodicTasks,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import $ from 'jquery';
import {ContextService} from 'services/context.service';
import {ExplorationImprovementsService} from 'services/exploration-improvements.service';
import {ExplorationStatesService} from './exploration-states.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {ExplorationInitStateNameService} from './exploration-init-state-name.service';
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {WindowRef} from 'services/contextual/window-ref.service';

class MockContextService {
  getExplorationId() {
    return 'expID';
  }
}

class MockExplorationInitStateNameService {
  savedMemento = 'main';
}

class MockActiveModal {
  dismiss(): void {
    return;
  }
}

describe('Router Service', () => {
  let routerService: RouterService;
  let testSubscriptions: Subscription;
  let explorationImprovementsService: ExplorationImprovementsService;
  let explorationStatesService: ExplorationStatesService;
  let stateEditorService: StateEditorService;
  let translationLanguageService: TranslationLanguageService;
  let windowRef: WindowRef;
  let hasStateSpy: jasmine.Spy;
  let isInitializedSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RouterService,
        WindowRef,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        ExplorationImprovementsService,
        ExplorationStatesService,
        StateEditorService,
        TranslationLanguageService,
        {
          provide: ContextService,
          useClass: MockContextService,
        },
        {
          provide: ExplorationInitStateNameService,
          useClass: MockExplorationInitStateNameService,
        },
      ],
    });

    routerService = TestBed.inject(RouterService);
    explorationImprovementsService = TestBed.inject(
      ExplorationImprovementsService
    );
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    windowRef = TestBed.inject(WindowRef);
    stateEditorService = TestBed.inject(StateEditorService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
  });

  beforeEach(() => {
    isInitializedSpy = spyOn(explorationStatesService, 'isInitialized');
    isInitializedSpy.and.returnValue(true);
    hasStateSpy = spyOn(explorationStatesService, 'hasState');
    hasStateSpy.and.returnValue(true);
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(null);

    testSubscriptions = new Subscription();
    routerService.navigateToMainTab('first card');
  });
  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should not navigate to main tab when already there', fakeAsync(() => {
    let jQuerySpy = spyOn(window, '$');
    jQuerySpy
      .withArgs('.oppia-editor-cards-container')
      .and.returnValue($(document.createElement('div')));
    jQuerySpy.and.callThrough();

    spyOn($.fn, 'fadeOut').and.callFake(cb => {
      cb();
      setTimeout(() => {});
      return null;
    });

    expect(routerService.getActiveTabName()).toBe('main');
    routerService.navigateToPreviewTab();
    tick(300);

    routerService.navigateToMainTab('first card');

    tick(300);

    expect(routerService.getActiveTabName()).toBe('main');

    routerService.navigateToMainTab('first card');

    tick(300);

    expect(routerService.getActiveTabName()).toBe('main');

    flush();
    discardPeriodicTasks();
  }));

  it('should navigate to main tab if path is ""', fakeAsync(() => {
    window.location.hash = '';
    routerService._changeTab('');

    tick(300);

    routerService.onCenterGraph.emit();
    expect(routerService.getActiveTabName()).toBe('main');

    flush();
    discardPeriodicTasks();
  }));

  it('should navigate to setting tab', fakeAsync(() => {
    expect(routerService.getActiveTabName()).toBe('main');
    routerService.navigateToSettingsTab();

    tick(300);

    routerService.onRefreshSettingsTab.emit();
    expect(routerService.getActiveTabName()).toBe('settings');

    flush();
    discardPeriodicTasks();
  }));

  it('should navigate to translation tab', fakeAsync(() => {
    expect(routerService.getActiveTabName()).toBe('main');
    routerService.navigateToTranslationTab();

    routerService.onRefreshTranslationTab.emit();
    tick(300);

    expect(routerService.getActiveTabName()).toBe('translation');

    flush();
    discardPeriodicTasks();
  }));

  it('should navigate to translation tab', fakeAsync(() => {
    window.location.hash = '/translation/Start/ca_buttonText_6';
    routerService._changeTab('/translation/Start/ca_buttonText_6');

    tick(300);

    expect(stateEditorService.getInitActiveContentId()).toBe('ca_buttonText_6');
  }));

  it('should navigate to translation tab with correct voiceover language', fakeAsync(() => {
    window.location.hash = '/translation/Start/ca_buttonText_6/ak';
    routerService._changeTab('/translation/Start/ca_buttonText_6/ak');

    tick(300);

    expect(translationLanguageService.getActiveLanguageCode()).toBe('ak');
  }));

  it('should navigate to preview tab', fakeAsync(() => {
    expect(routerService.getActiveTabName()).toBe('main');
    routerService.navigateToPreviewTab();

    tick(300);

    expect(routerService.getActiveTabName()).toBe('preview');

    flush();
    discardPeriodicTasks();
  }));

  it('should navigate to preview tab', fakeAsync(() => {
    hasStateSpy.and.returnValue(false);
    isInitializedSpy.and.returnValue(true);
    tick();
    expect(routerService.getActiveTabName()).toBe('main');
    routerService.navigateToPreviewTab();

    tick(3000);

    expect(routerService.getActiveTabName()).toBe('preview');

    flush();
    discardPeriodicTasks();
  }));

  it('should navigate to stats tab', fakeAsync(() => {
    expect(routerService.getActiveTabName()).toBe('main');
    routerService.navigateToStatsTab();

    tick(300);

    routerService.onRefreshStatisticsTab.emit();
    expect(routerService.getActiveTabName()).toBe('stats');

    flush();
    discardPeriodicTasks();
  }));

  it('should navigate to main tab if improvements tab is not enabled', fakeAsync(() => {
    spyOn(
      explorationImprovementsService,
      'isImprovementsTabEnabledAsync'
    ).and.returnValue(Promise.resolve(false));

    expect(routerService.getActiveTabName()).toBe('main');

    routerService.navigateToImprovementsTab();
    tick(300);

    expect(routerService.getActiveTabName()).toBe('main');

    flush();
    discardPeriodicTasks();
  }));

  it('should navigate to improvements tab is not enabled', fakeAsync(() => {
    spyOn(
      explorationImprovementsService,
      'isImprovementsTabEnabledAsync'
    ).and.returnValue(Promise.resolve(true));

    expect(routerService.getActiveTabName()).toBe('main');
    routerService.navigateToImprovementsTab();

    tick(300);

    expect(routerService.getActiveTabName()).toBe('improvements');

    flush();
    discardPeriodicTasks();
  }));

  it('should navigate to history tab', fakeAsync(() => {
    expect(routerService.getActiveTabName()).toBe('main');
    routerService.navigateToHistoryTab();

    tick(300);

    routerService.onRefreshVersionHistory.emit();
    expect(routerService.getActiveTabName()).toBe('history');

    flush();
    discardPeriodicTasks();
  }));

  it('should navigate to feedback tab', fakeAsync(() => {
    expect(routerService.getActiveTabName()).toBe('main');
    routerService.navigateToFeedbackTab();

    tick(300);

    expect(routerService.getActiveTabName()).toBe('feedback');

    flush();
    discardPeriodicTasks();
  }));

  it('should navigate to main tab when newpath is unknow', fakeAsync(() => {
    expect(routerService.getActiveTabName()).toBe('main');

    routerService._changeTab('error-page');
    tick(300);

    expect(routerService.getActiveTabName()).toBe('main');

    flush();
    discardPeriodicTasks();
  }));

  it('should tell isLocationSetToNonStateEditorTab', fakeAsync(() => {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        hash: '#/settings',
      },
    });

    expect(routerService.isLocationSetToNonStateEditorTab()).toBeTrue();

    flush();
    discardPeriodicTasks();
  }));

  it('should tell current State From Location Path to be null', fakeAsync(() => {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        hash: '#/gui/Introduction',
      },
    });

    routerService.savePendingChanges();
    expect(routerService.getCurrentStateFromLocationPath()).toBe(
      '/Introduction'
    );

    routerService.navigateToMainTab('/Introduction');
    flush();
    discardPeriodicTasks();
  }));

  it('should not navigate to main tab', () => {
    spyOn(routerService, '_getCurrentStateFromLocationPath').and.returnValue(
      '/main'
    );

    routerService.navigateToMainTab('main');

    expect(routerService._getCurrentStateFromLocationPath).toHaveBeenCalled();
  });
});
