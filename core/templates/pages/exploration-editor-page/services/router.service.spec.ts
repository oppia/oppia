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

import { UpgradedServices } from 'services/UpgradedServices';
import $ from 'jquery';

describe('Router Service', () => {
  var RouterService = null;
  var ExplorationStatesService = null;
  var ExplorationFeaturesService = null;
  var ExplorationInitStateNameService = null;
  var $rootScope = null;
  var $location = null;
  var $timeout = null, $interval = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', $provide => {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject($injector => {
    RouterService = $injector.get('RouterService');
    ExplorationStatesService = $injector.get('ExplorationStatesService');
    ExplorationFeaturesService = $injector.get('ExplorationFeaturesService');
    ExplorationInitStateNameService = $injector.get(
      'ExplorationInitStateNameService');
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
    ExplorationFeaturesService.init({
      param_changes: []
    }, {
      is_improvements_tab_enabled: false,
      is_exploration_whitelisted: false
    });
  }));

  it('should navigate to main tab when tab is already on main', done => {
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();
    var applyAsyncSpy = spyOn($rootScope, '$applyAsync').and.callThrough();

    // @ts-ignore
    var jQuerySpy = spyOn(window, '$');
    // @ts-ignore
    jQuerySpy.withArgs('.oppia-editor-cards-container').and.returnValue(
      // @ts-ignore
      $(document.createElement('div')));
    jQuerySpy.and.callThrough();

    expect(RouterService.getActiveTabName()).toBe('main');
    RouterService.navigateToMainTab('newState');
    // To $watch the first $location.path call.
    $rootScope.$apply();

    // setTimeout is being used here to not conflict with $timeout.flush
    // for fadeIn Jquery method. This first setTimeout is to wait the default
    // time for fadeOut Jquery method to complete, which is 400 miliseconds.
    // Ref: https://api.jquery.com/fadeout/
    setTimeout(() => {
      // Waiting for $applyAsync be called, which can take ~10 miliseconds
      // according to this ref: https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$applyAsync
      setTimeout(() => {
        expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
        expect(RouterService.getActiveTabName()).toBe('main');

        $interval.flush(300);

        expect(broadcastSpy).toHaveBeenCalled();

        done();

        expect(applyAsyncSpy).toHaveBeenCalled();
      }, 20);
      $timeout.flush(150);
    }, 400);
  });

  it('should not navigate to main tab when already there', done => {
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();
    var applyAsyncSpy = spyOn($rootScope, '$applyAsync').and.callThrough();

    // @ts-ignore
    var jQuerySpy = spyOn(window, '$');
    // @ts-ignore
    jQuerySpy.withArgs('.oppia-editor-cards-container').and.returnValue(
      // @ts-ignore
      $(document.createElement('div')));
    jQuerySpy.and.callThrough();

    expect(RouterService.getActiveTabName()).toBe('main');
    RouterService.navigateToMainTab('newState');
    // To $watch the first $location.path call.
    $rootScope.$apply();

    // setTimeout is being used here to not conflict with $timeout.flush
    // for fadeIn Jquery method. This first setTimeout is to wait the default
    // time for fadeOut Jquery method to complete, which is 400 miliseconds.
    // Ref: https://api.jquery.com/fadeout/
    setTimeout(() => {
      // Waiting for $applyAsync be called, which can take ~10 miliseconds
      // according to this ref: https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$applyAsync
      setTimeout(() => {
        expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
        expect(RouterService.getActiveTabName()).toBe('main');

        $interval.flush(300);

        expect(broadcastSpy).toHaveBeenCalled();

        done();

        expect(applyAsyncSpy).toHaveBeenCalled();

        RouterService.navigateToMainTab('newState');
        $timeout.flush();
        $rootScope.$apply();

        expect(RouterService.getActiveTabName()).toBe('main');
      }, 20);
      $timeout.flush(150);
    }, 400);
  });

  it('should navigate to main tab when current location is not main', () => {
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

    // Go to stats tab.
    RouterService.navigateToStatsTab();
    $timeout.flush();
    $rootScope.$apply();

    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
    expect(RouterService.getActiveTabName()).toBe('stats');
    expect(broadcastSpy).toHaveBeenCalledWith('refreshStatisticsTab');

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();

    // Now go to main tab.
    RouterService.navigateToMainTab('newState');
    $rootScope.$apply();
    $rootScope.$apply();

    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
    expect(RouterService.getActiveTabName()).toBe('main');
    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(false);
    $rootScope.$apply();

    $interval.flush(300);

    expect(broadcastSpy).toHaveBeenCalledWith('refreshStateEditor');
    expect(broadcastSpy).toHaveBeenCalledWith('centerGraph');
  });

  it('should navigate to translation tab', () => {
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

    RouterService.navigateToTranslationTab();
    $rootScope.$apply();

    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
    expect(RouterService.getActiveTabName()).toBe('translation');
    $interval.flush(300);

    expect(broadcastSpy).toHaveBeenCalledWith('refreshTranslationTab');

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();
  });

  it('should navigate to preview tab', () => {
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

    expect(RouterService.getActiveTabName()).toBe('main');
    RouterService.navigateToPreviewTab();
    $timeout.flush(200);
    $rootScope.$apply();

    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
    expect(RouterService.getActiveTabName()).toBe('preview');

    $interval.flush(300);
    $rootScope.$apply();

    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
    expect(RouterService.getActiveTabName()).toBe('preview');

    $interval.flush(300);

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(false);
    $rootScope.$apply();
  });

  it('should navigate to stats tab ', () => {
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

    RouterService.navigateToStatsTab();
    $rootScope.$apply();

    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
    expect(RouterService.getActiveTabName()).toBe('stats');
    expect(broadcastSpy).toHaveBeenCalledWith('refreshStatisticsTab');

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();
  });

  it('should navigate to improvements tab ', () => {
    spyOn(ExplorationFeaturesService, 'isInitialized').and.returnValue(true);
    spyOn(ExplorationFeaturesService, 'isImprovementsTabEnabled')
      .and.returnValue(true);
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

    RouterService.navigateToImprovementsTab();
    $rootScope.$apply();

    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
    expect(RouterService.getActiveTabName()).toBe('improvements');

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();
  });

  it(
    'should reroute to main tab after confirming improvements tab is disabled',
    () => {
      var isInitializedSpy = spyOn(ExplorationFeaturesService, 'isInitialized')
        .and.returnValues(false, false, true);
      spyOn(ExplorationFeaturesService, 'isImprovementsTabEnabled')
        .and.returnValue(false);
      var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

      RouterService.navigateToImprovementsTab();
      $rootScope.$apply();
      expect(broadcastSpy).toHaveBeenCalledWith('externalSave');

      // 1st check to isInitialized returned false. Should see no changes yet.
      expect(isInitializedSpy).toHaveBeenCalledTimes(1);
      expect(RouterService.getActiveTabName()).toBe('improvements');
      expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);

      $timeout.flush(300);
      $rootScope.$apply();

      // 2nd check to isInitialized returned false. Should see no changes yet.
      expect(isInitializedSpy).toHaveBeenCalledTimes(2);
      expect(RouterService.getActiveTabName()).toBe('improvements');
      expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);

      $rootScope.$apply();
      $timeout.flush(300);

      // 3rd check to isInitialized returns true. We should have been navigated
      // away from the improvements tab, because it has been confirmed to not be
      // enabled.
      expect(isInitializedSpy).toHaveBeenCalledTimes(3);
      expect(RouterService.getActiveTabName()).toBe('main');
      expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(false);
    });

  it('should reroute to the main tab when improvements tab is disabled', () => {
    spyOn(ExplorationFeaturesService, 'isInitialized').and.returnValue(true);
    spyOn(ExplorationFeaturesService, 'isImprovementsTabEnabled')
      .and.returnValue(false);
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

    RouterService.navigateToImprovementsTab();
    $rootScope.$apply();

    expect(RouterService.getActiveTabName()).toBe('main');
    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(false);
    $rootScope.$apply();
  });

  it(
    'should remain on the improvements tab after confirming it is enabled',
    () => {
      var isInitializedSpy = spyOn(ExplorationFeaturesService, 'isInitialized')
        .and.returnValues(false, true);
      spyOn(ExplorationFeaturesService, 'isImprovementsTabEnabled')
        .and.returnValue(true);
      var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

      RouterService.navigateToImprovementsTab();
      $rootScope.$apply();

      expect(isInitializedSpy).toHaveBeenCalledTimes(1);
      expect(RouterService.getActiveTabName()).toBe('improvements');
      expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);

      $timeout.flush(300);
      $rootScope.$apply();

      expect(isInitializedSpy).toHaveBeenCalledTimes(2);
      expect(RouterService.getActiveTabName()).toBe('improvements');
      expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    });

  it(
    'should not reroute to the main tab from improvements tab after leaving it',
    () => {
      var isInitializedSpy = spyOn(ExplorationFeaturesService, 'isInitialized')
        .and.returnValues(false, true);
      spyOn(ExplorationFeaturesService, 'isImprovementsTabEnabled')
        .and.returnValue(false);
      var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

      RouterService.navigateToImprovementsTab();
      $rootScope.$apply();

      // 1st check to isInitialized returned false. Should see no changes yet.
      expect(isInitializedSpy).toHaveBeenCalledTimes(1);
      expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
      expect(RouterService.getActiveTabName()).toBe('improvements');

      // Navigate to stats tab before initialization.
      RouterService.navigateToStatsTab();
      $rootScope.$apply();

      $timeout.flush();
      $rootScope.$apply();

      // 2nd check to isInitialized returns true, but user has navigated away
      // from the improvements tab. They should not be redirected to main tab.
      expect(isInitializedSpy).toHaveBeenCalledTimes(2);
      expect(RouterService.getActiveTabName()).toBe('stats');
      expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    });

  it('should navigate to settings tab ', () => {
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

    RouterService.navigateToSettingsTab();
    $rootScope.$apply();

    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
    expect(RouterService.getActiveTabName()).toBe('settings');
    expect(broadcastSpy).toHaveBeenCalledWith('refreshSettingsTab');

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();
  });

  it('should navigate to history tab ', () => {
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

    RouterService.navigateToHistoryTab();
    $rootScope.$apply();

    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
    expect(broadcastSpy).toHaveBeenCalledWith('refreshVersionHistory', {
      forceRefresh: false
    });
    expect(RouterService.getActiveTabName()).toBe('history');

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();
  });

  it('should navigate to feedback tab ', () => {
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

    RouterService.navigateToFeedbackTab();
    $rootScope.$apply();

    // $watch is called
    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
    expect(RouterService.getActiveTabName()).toBe('feedback');

    expect(RouterService.isLocationSetToNonStateEditorTab()).toBe(true);
    $rootScope.$apply();
  });

  it('should handle when location redirects to an invalid path', () => {
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();
    var locationPathSpy = spyOn($location, 'path');
    locationPathSpy.and.returnValue('/invalid');

    RouterService.navigateToMainTab(null);
    $rootScope.$apply();
    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');

    // Change to a valid path during the call.
    locationPathSpy.and.returnValue('/gui/initState');

    $rootScope.$apply();
    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
    expect(RouterService.getActiveTabName()).toBe('main');
    expect(RouterService.getCurrentStateFromLocationPath())
      .toEqual('initState');

    $interval.flush(300);

    expect(broadcastSpy).toHaveBeenCalledWith('refreshStateEditor');
    expect(broadcastSpy).toHaveBeenCalledWith('centerGraph');
  });

  it('should save pending changes', () => {
    var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();
    RouterService.savePendingChanges();
    expect(broadcastSpy).toHaveBeenCalledWith('externalSave');
  });

  it('should save pending changes even when AngularJS throws an error', () => {
    // In savePendingChanges, the $broadcast is called twice. However,
    // sometimes AngularJS throws an error in the first call of $broadcast.
    // That's why there is a try/catch block in the method.
    // In order to reproduce this behavior, a counter was created to
    // handle it.
    var broadcastCallsCounter = 0;
    var EXPECTED_BROADCAST_EXTERNAL_SAVE_CALLS = 2;
    spyOn($rootScope, '$broadcast').and.callFake(message => {
      // AngularJS calls $broadcast with other parameters in its flow,
      // but only with externalSave params is called in the method.
      if (message === 'externalSave') {
        broadcastCallsCounter++;
        if (broadcastCallsCounter === 1) {
          // First call throws an error so the catch block will be executed.
          throw new Error('Cannot read property $$nextSibling of null');
        }
      }
    });
    // Apply is called inside catch block.
    var applySpy = spyOn($rootScope, '$apply').and.callThrough();

    // Checking if the $broadcast is being called as expected before calling
    // savePendingChanges.
    // Check if the first call is really throwing an error.
    expect(() => $rootScope.$broadcast('externalSave'))
      .toThrowError('Cannot read property $$nextSibling of null');
    // Check if the second call will not throw an error.
    expect(() => $rootScope.$broadcast('externalSave'))
      .not.toThrowError('Cannot read property $$nextSibling of null');
    // Reset the counter before calling the method to be tested.
    broadcastCallsCounter = 0;

    RouterService.savePendingChanges();
    expect(applySpy).toHaveBeenCalled();
    expect(broadcastCallsCounter).toBe(
      EXPECTED_BROADCAST_EXTERNAL_SAVE_CALLS);
  });
});
