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

import { fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import $ from 'jquery';
import { Subscription } from 'rxjs';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Router Service', () => {
  var RouterService = null;
  var ExplorationStatesService = null;
  var ExplorationImprovementsService = null;
  var ExplorationInitStateNameService = null;
  var ExternalSaveService = null;
  var StateEditorRefreshService = null;
  var $rootScope = null;
  var $location = null;
  var $timeout = null, $interval = null;
  const centerGraphSpy = jasmine.createSpy('centerGraphSpy');
  var testSubscriptions = null;
  var refreshStatisticsTabSpy = null;
  var refreshSettingsTabSpy = null;
  var refreshTranslationTabSpy = null;
  var externalSaveSpy = null;
  var refreshVersionHistorySpy = null;
  var refreshStateEditorSpy = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));
  importAllAngularServices();
  beforeEach(angular.mock.inject($injector => {
    RouterService = $injector.get('RouterService');
    ExplorationStatesService = $injector.get('ExplorationStatesService');
    ExplorationImprovementsService = $injector.get(
      'ExplorationImprovementsService');
    ExplorationInitStateNameService = $injector.get(
      'ExplorationInitStateNameService');
    ExternalSaveService = $injector.get('ExternalSaveService');
    StateEditorRefreshService = $injector.get('StateEditorRefreshService');
    $rootScope = $injector.get('$rootScope');
    $location = $injector.get('$location');
    $timeout = $injector.get('$timeout');
    $interval = $injector.get('$interval');

    ExplorationInitStateNameService.init('initState');
    ExplorationStatesService.init({
      newState: {
        content: {
          content_id: 'content',
          html: ''
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
          },
        },
        param_changes: [],
        interaction: {
          answer_groups: [{
            rule_specs: [],
            outcome: {
              dest: 'Me Llamo',
              feedback: {
                content_id: 'feedback_1',
                html: 'buen trabajo!',
              },
            },
          }],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 }
          },
          default_outcome: {
            dest: 'Hola',
            feedback: {
              content_id: 'default_outcome',
              html: 'try again!',
            },
            labelled_as_correct: false,
          },
          hints: [],
          id: 'TextInput',
          solution: null,
        },
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
          },
        }
      },
      initState: {
        content: {
          content_id: 'content',
          html: ''
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
          },
        },
        param_changes: [],
        interaction: {
          answer_groups: [{
            rule_specs: [],
            outcome: {
              dest: 'Me Llamo',
              feedback: {
                content_id: 'feedback_1',
                html: 'buen trabajo!',
              },
            },
          }],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 }
          },
          default_outcome: {
            dest: 'Hola',
            feedback: {
              content_id: 'default_outcome',
              html: 'try again!',
            },
            labelled_as_correct: false,
          },
          hints: [],
          id: 'TextInput',
          solution: null,
        },
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
          },
        }
      }
    });
  }));

  beforeEach(() => {
    refreshStatisticsTabSpy = jasmine.createSpy('refreshStatisticsTab');
    refreshSettingsTabSpy = jasmine.createSpy('refreshSettingsTab');
    refreshTranslationTabSpy = jasmine.createSpy('refreshTranslationTab');
    refreshStateEditorSpy = jasmine.createSpy('RefreshStateEditor');
    externalSaveSpy = jasmine.createSpy('externalSpy');
    refreshVersionHistorySpy = jasmine.createSpy('refreshVersionHistory');
    testSubscriptions = new Subscription();
    testSubscriptions.add(RouterService.onCenterGraph.subscribe(
      centerGraphSpy));
    testSubscriptions.add(
      RouterService.onRefreshStatisticsTab.subscribe(refreshStatisticsTabSpy));
    testSubscriptions.add(
      RouterService.onRefreshSettingsTab.subscribe(refreshSettingsTabSpy));
    testSubscriptions.add(
      RouterService.onRefreshTranslationTab.subscribe(
        refreshTranslationTabSpy));
    testSubscriptions.add(
      ExternalSaveService.onExternalSave.subscribe(externalSaveSpy));
    testSubscriptions.add(
      RouterService.onRefreshVersionHistory.subscribe(
        refreshVersionHistorySpy));
    testSubscriptions.add(
      StateEditorRefreshService.onRefreshStateEditor.subscribe(
        refreshStateEditorSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should not navigate to main tab when already there', fakeAsync(() => {
    var jQuerySpy = spyOn(window, '$');
    jQuerySpy.withArgs('.oppia-editor-cards-container').and.returnValue(
      $(document.createElement('div')));
    jQuerySpy.and.callThrough();
    let fadeOutSpy = spyOn($.fn, 'fadeOut').and.callFake(cb => {
      cb();
      $timeout.flush(200);
      return null;
    });

    expect(RouterService.getActiveTabName()).toBe('main');
    RouterService.navigateToMainTab('newState');

    $rootScope.$apply();
    flush();

    expect(externalSaveSpy).toHaveBeenCalled();
    expect(RouterService.getActiveTabName()).toBe('main');

    RouterService.navigateToMainTab('newState');

    $rootScope.$apply();
    flush();

    expect(RouterService.getActiveTabName()).toBe('main');
    expect(fadeOutSpy).toHaveBeenCalled();
  }));

  it('should navigate to main tab when current location is not main', () => {
    // Go to stats tab.
    RouterService.navigateToStatsTab();
    $timeout.flush();
    $rootScope.$apply();

    expect(externalSaveSpy).toHaveBeenCalled();
    expect(RouterService.getActiveTabName()).toBe('stats');
    expect(refreshStatisticsTabSpy).toHaveBeenCalled();

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();

    // Now go to main tab.
    RouterService.navigateToMainTab('newState');
    $rootScope.$apply();
    $rootScope.$apply();

    expect(externalSaveSpy).toHaveBeenCalled();
    expect(RouterService.getActiveTabName()).toBe('main');
    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(false);
    $rootScope.$apply();

    $interval.flush(300);

    expect(refreshStateEditorSpy).toHaveBeenCalled();
    expect(centerGraphSpy).toHaveBeenCalled();
  });

  it('should navigate to translation tab', () => {
    RouterService.navigateToTranslationTab();
    $rootScope.$apply();

    expect(externalSaveSpy).toHaveBeenCalled();
    expect(RouterService.getActiveTabName()).toBe('translation');
    $interval.flush(300);

    expect(refreshTranslationTabSpy).toHaveBeenCalled();

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();
  });

  it('should navigate to preview tab', () => {
    expect(RouterService.getActiveTabName()).toBe('main');
    RouterService.navigateToPreviewTab();
    $timeout.flush(200);
    $rootScope.$apply();

    expect(externalSaveSpy).toHaveBeenCalled();
    expect(RouterService.getActiveTabName()).toBe('preview');

    $interval.flush(300);
    $rootScope.$apply();

    expect(externalSaveSpy).toHaveBeenCalled();
    expect(RouterService.getActiveTabName()).toBe('preview');

    $interval.flush(300);

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(false);
    $rootScope.$apply();
  });

  it('should navigate to stats tab', () => {
    RouterService.navigateToStatsTab();
    $rootScope.$apply();

    expect(externalSaveSpy).toHaveBeenCalled();
    expect(RouterService.getActiveTabName()).toBe('stats');
    expect(refreshStatisticsTabSpy).toHaveBeenCalled();

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();
  });

  it('should navigate to improvements tab', fakeAsync(() => {
    spyOn(ExplorationImprovementsService, 'isImprovementsTabEnabledAsync')
      .and.returnValue(Promise.resolve(true));

    RouterService.navigateToImprovementsTab();
    $rootScope.$apply(); // Apply the change of active tab.
    flushMicrotasks(); // Flush pending promise chains.
    $rootScope.$apply(); // Apply any new changes made to the active tab.

    expect(externalSaveSpy).toHaveBeenCalled();
    expect(RouterService.getActiveTabName()).toEqual('improvements');

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();
  }));

  it(
    'should reroute to main tab after confirming improvements tab is disabled',
    fakeAsync(() => {
      let resolveIsImprovementsTabEnabledPromise: (_: boolean) => void;
      let isImprovementsTabEnabledPromise = new Promise(resolve => {
        resolveIsImprovementsTabEnabledPromise = resolve;
      });
      spyOn(ExplorationImprovementsService, 'isImprovementsTabEnabledAsync')
        .and.returnValue(isImprovementsTabEnabledPromise);

      RouterService.navigateToImprovementsTab();
      $rootScope.$apply(); // Apply the change of active tab.

      // Promise hasn't been fulfilled yet, should still be on improvements tab.
      expect(RouterService.getActiveTabName()).toEqual('improvements');
      expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);

      resolveIsImprovementsTabEnabledPromise(false);
      flushMicrotasks(); // Flush pending promise chains.
      $rootScope.$apply(); // Apply any new changes made to the active tab.

      // Promise has been fulfilled, should be redirected to main tab since
      // we've confirmed the improvements tab is not enabled.
      expect(RouterService.getActiveTabName()).toEqual('main');
      expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(false);
    }));

  it('should reroute to the main tab immediately when improvements tab is ' +
    'disabled', fakeAsync(() => {
    spyOn(ExplorationImprovementsService, 'isImprovementsTabEnabledAsync')
      .and.returnValue(Promise.resolve(false));

    RouterService.navigateToImprovementsTab();
    $rootScope.$apply(); // Apply the change of active tab.
    flushMicrotasks(); // Flush pending promise chains.
    $rootScope.$apply(); // Apply any new changes made to the active tab.

    expect(RouterService.getActiveTabName()).toEqual('main');
    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(false);
  }));

  it(
    'should remain on the improvements tab after confirming it is enabled',
    fakeAsync(() => {
      let resolveIsImprovementsTabEnabledPromise: (_: boolean) => void;
      let isImprovementsTabEnabledPromise = new Promise(resolve => {
        resolveIsImprovementsTabEnabledPromise = resolve;
      });
      spyOn(ExplorationImprovementsService, 'isImprovementsTabEnabledAsync')
        .and.returnValue(isImprovementsTabEnabledPromise);

      RouterService.navigateToImprovementsTab();
      $rootScope.$apply(); // Apply the change of active tab.
      flushMicrotasks(); // Flush pending promise chains.
      $rootScope.$apply(); // Apply any new changes made to the active tab.

      expect(RouterService.getActiveTabName()).toEqual('improvements');
      expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);

      resolveIsImprovementsTabEnabledPromise(true);
      flushMicrotasks(); // Flush pending promise chains.
      $rootScope.$apply(); // Apply any new changes made to the active tab.

      expect(RouterService.getActiveTabName()).toEqual('improvements');
      expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    }));

  it(
    'should not reroute to the main tab after leaving improvements tab',
    fakeAsync(() => {
      let resolveIsImprovementsTabEnabledPromise: (_: boolean) => void;
      let isImprovementsTabEnabledPromise = new Promise(resolve => {
        resolveIsImprovementsTabEnabledPromise = resolve;
      });
      spyOn(ExplorationImprovementsService, 'isImprovementsTabEnabledAsync')
        .and.returnValue(isImprovementsTabEnabledPromise);

      RouterService.navigateToImprovementsTab();
      $rootScope.$apply(); // Apply the change of active tab.

      // Promise hasn't been fulfilled yet, should still be on improvements tab.
      expect(RouterService.getActiveTabName()).toEqual('improvements');

      RouterService.navigateToStatsTab();
      $rootScope.$apply(); // Apply the change of active tab.

      // Have navigated to stats tab before promise was fulfilled.
      expect(RouterService.getActiveTabName()).toEqual('stats');

      resolveIsImprovementsTabEnabledPromise(false);
      flushMicrotasks(); // Flush pending promise chains.
      $rootScope.$apply(); // Apply any new changes made to the active tab.

      // Promise has been fulfilled, but user has navigated away from the
      // improvements tab. They should *not* have been redirected to main tab.
      expect(RouterService.getActiveTabName()).toEqual('stats');
    }));

  it('should navigate to settings tab', () => {
    RouterService.navigateToSettingsTab();
    $rootScope.$apply();

    expect(externalSaveSpy).toHaveBeenCalled();
    expect(RouterService.getActiveTabName()).toBe('settings');
    expect(refreshSettingsTabSpy).toHaveBeenCalled();

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();
  });

  it('should navigate to history tab', () => {
    RouterService.navigateToHistoryTab();
    $rootScope.$apply();

    expect(externalSaveSpy).toHaveBeenCalled();
    expect(refreshVersionHistorySpy).toHaveBeenCalled();
    expect(RouterService.getActiveTabName()).toBe('history');

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();
  });

  it('should navigate to feedback tab', () => {
    RouterService.navigateToFeedbackTab();
    $rootScope.$apply();

    // $watch is called.
    expect(externalSaveSpy).toHaveBeenCalled();
    expect(RouterService.getActiveTabName()).toBe('feedback');

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();
  });

  it('should handle when location redirects to an invalid path', () => {
    var locationPathSpy = spyOn($location, 'path');
    locationPathSpy.and.returnValue('/invalid');

    RouterService.navigateToMainTab(null);
    $rootScope.$apply();
    expect(externalSaveSpy).toHaveBeenCalled();

    // Change to a valid path during the call.
    locationPathSpy.and.returnValue('/gui/initState');

    $rootScope.$apply();
    expect(externalSaveSpy).toHaveBeenCalled();
    expect(RouterService.getActiveTabName()).toBe('main');
    expect(RouterService.getCurrentStateFromLocationPath())
      .toEqual('initState');

    $interval.flush(300);

    expect(refreshStateEditorSpy).toHaveBeenCalled();
    expect(centerGraphSpy).toHaveBeenCalled();
  });

  it('should save pending changes', () => {
    RouterService.savePendingChanges();
    expect(externalSaveSpy).toHaveBeenCalled();
  });
});
