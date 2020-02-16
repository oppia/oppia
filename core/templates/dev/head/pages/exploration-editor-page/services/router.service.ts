// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service that handles routing for the exploration editor page.
 */

require(
  'pages/exploration-editor-page/services/' +
  'exploration-init-state-name.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/debug-info-tracker.service.ts');
require('services/exploration-features.service.ts');

angular.module('oppia').factory('RouterService', [
  '$interval', '$location', '$rootScope', '$timeout', '$window',
  'DebugInfoTrackerService', 'ExplorationFeaturesService',
  'ExplorationInitStateNameService', 'ExplorationStatesService',
  'StateEditorService',
  function(
      $interval, $location, $rootScope, $timeout, $window,
      DebugInfoTrackerService, ExplorationFeaturesService,
      ExplorationInitStateNameService, ExplorationStatesService,
      StateEditorService) {
    var TABS = {
      MAIN: {name: 'main', path: '/main'},
      TRANSLATION: {name: 'translation', path: '/translation'},
      PREVIEW: {name: 'preview', path: '/preview'},
      SETTINGS: {name: 'settings', path: '/settings'},
      STATS: {name: 'stats', path: '/stats'},
      IMPROVEMENTS: {name: 'improvements', path: '/improvements'},
      HISTORY: {name: 'history', path: '/history'},
      FEEDBACK: {name: 'feedback', path: '/feedback'},
    };

    var SLUG_GUI = 'gui';
    var SLUG_PREVIEW = 'preview';
    // PREVIEW_TAB_WAIT_TIME_MSEC is the minimum duration to wait
    // before calling _actuallyNavigate. This is done in order to
    // ensure all pending changes are saved before navigating to
    // the preview tab.
    // _savePendingChanges triggers 'externalSave' event which
    // will be caught by appropriate editors that will
    // save pending changes. However, the autosave / saving of
    // changelist is async. Promises cannot be used here to
    // ensure that _actuallyNavigate is called only after
    // _savePendingChanges has completed because there is
    // currently no way to check if all promises returned are
    // resolved after the 'externalSave' is triggered. Therefore,
    // to allow autosave / saving of change list to complete,
    // PREVIEW_TAB_WAIT_TIME_MSEC is provided.
    var PREVIEW_TAB_WAIT_TIME_MSEC = 200;

    var activeTabName = TABS.MAIN.name;

    var isImprovementsTabEnabled =
      ExplorationFeaturesService.isImprovementsTabEnabled;

    // When the URL path changes, reroute to the appropriate tab in the
    // exploration editor page.
    $rootScope.$watch(function() {
      return $location.path();
    }, function(newPath, oldPath) {
      if (newPath === '') {
        $location.path(oldPath);
        return;
      }

      if (!oldPath) {
        // This can happen when clicking on links whose href is "#".
        return;
      }

      // TODO(oparry): Determine whether this is necessary, since
      // _savePendingChanges() is called by each of the navigateTo... functions
      $rootScope.$broadcast('externalSave');

      if (newPath.indexOf(TABS.TRANSLATION.path) === 0) {
        activeTabName = TABS.TRANSLATION.name;
        var waitForStatesToLoad = $interval(function() {
          if (ExplorationStatesService.isInitialized()) {
            $interval.cancel(waitForStatesToLoad);
            if (!StateEditorService.getActiveStateName()) {
              StateEditorService.setActiveStateName(
                ExplorationInitStateNameService.savedMemento);
            }
            $rootScope.$broadcast('refreshTranslationTab');
          }
        }, 300);
      } else if (newPath.indexOf(TABS.PREVIEW.path) === 0) {
        activeTabName = TABS.PREVIEW.name;
        _doNavigationWithState(newPath, SLUG_PREVIEW);
      } else if (newPath === TABS.SETTINGS.path) {
        activeTabName = TABS.SETTINGS.name;
        $rootScope.$broadcast('refreshSettingsTab');
      } else if (newPath === TABS.STATS.path) {
        activeTabName = TABS.STATS.name;
        $rootScope.$broadcast('refreshStatisticsTab');
      } else if (newPath === TABS.IMPROVEMENTS.path) {
        activeTabName = TABS.IMPROVEMENTS.name;
        var waitToCheckThatImprovementsTabIsEnabled = $interval(function() {
          if (ExplorationFeaturesService.isInitialized()) {
            $interval.cancel(waitToCheckThatImprovementsTabIsEnabled);
            if (!ExplorationFeaturesService.isImprovementsTabEnabled()) {
              RouterService.navigateToMainTab(null);
            }
          }
        }, 5);
      } else if (newPath === TABS.HISTORY.path) {
        // TODO(sll): Do this on-hover rather than on-click.
        $rootScope.$broadcast('refreshVersionHistory', {
          forceRefresh: false
        });
        activeTabName = TABS.HISTORY.name;
      } else if (newPath === TABS.FEEDBACK.path) {
        activeTabName = TABS.FEEDBACK.name;
        var waitToCheckThatFeedbackTabIsEnabled = $interval(function() {
          if (ExplorationFeaturesService.isInitialized()) {
            $interval.cancel(waitToCheckThatFeedbackTabIsEnabled);
            if (ExplorationFeaturesService.isImprovementsTabEnabled()) {
              RouterService.navigateToMainTab(null);
            }
          }
        }, 5);
      } else if (newPath.indexOf('/gui/') === 0) {
        activeTabName = TABS.MAIN.name;
        _doNavigationWithState(newPath, SLUG_GUI);
      } else {
        if (ExplorationInitStateNameService.savedMemento) {
          $location.path(
            '/gui/' + ExplorationInitStateNameService.savedMemento);
        }
      }
    });

    var _doNavigationWithState = function(path, pathType) {
      var pathBase = '/' + pathType + '/';
      var putativeStateName = path.substring(pathBase.length);
      var waitForStatesToLoad = $interval(function() {
        if (ExplorationStatesService.isInitialized()) {
          $interval.cancel(waitForStatesToLoad);
          if (ExplorationStatesService.hasState(putativeStateName)) {
            StateEditorService.setActiveStateName(putativeStateName);
            if (pathType === SLUG_GUI) {
              $rootScope.$broadcast('refreshStateEditor');
              // Fire an event to center the Graph in the Editor.
              $rootScope.$broadcast('centerGraph');
            }
          } else {
            $location.path(pathBase +
                           ExplorationInitStateNameService.savedMemento);
          }
        }
      }, 300);
    };

    var _savePendingChanges = function() {
      try {
        $rootScope.$broadcast('externalSave');
      } catch (e) {
        // Sometimes, AngularJS throws a "Cannot read property $$nextSibling of
        // null" error. To get around this we must use $apply().
        $rootScope.$apply(function() {
          $rootScope.$broadcast('externalSave');
        });
      }
    };

    var _getCurrentStateFromLocationPath = function() {
      if ($location.path().indexOf('/gui/') !== -1) {
        return $location.path().substring('/gui/'.length);
      } else {
        return null;
      }
    };

    var _actuallyNavigate = function(pathType, newStateName) {
      if (pathType !== SLUG_GUI && pathType !== SLUG_PREVIEW) {
        return;
      }
      if (newStateName) {
        StateEditorService.setActiveStateName(newStateName);
      }
      $location.path('/' + pathType + '/' +
                     StateEditorService.getActiveStateName());
      $window.scrollTo(0, 0);
    };

    var RouterService = {
      savePendingChanges: function() {
        _savePendingChanges();
      },
      getActiveTabName: function() {
        return activeTabName;
      },
      isLocationSetToNonStateEditorTab: function() {
        var currentPath = $location.path();
        return (
          currentPath === TABS.TRANSLATION.path ||
          currentPath === TABS.PREVIEW.path ||
          currentPath === TABS.STATS.path ||
          currentPath === TABS.IMPROVEMENTS.path ||
          currentPath === TABS.SETTINGS.path ||
          currentPath === TABS.HISTORY.path ||
          currentPath === TABS.FEEDBACK.path);
      },
      getCurrentStateFromLocationPath: function() {
        return _getCurrentStateFromLocationPath();
      },
      navigateToMainTab: function(stateName) {
        DebugInfoTrackerService.reset();
        _savePendingChanges();
        if (_getCurrentStateFromLocationPath() === stateName) {
          return;
        }

        if (activeTabName === TABS.MAIN.name) {
          $('.oppia-editor-cards-container').fadeOut(function() {
            _actuallyNavigate(SLUG_GUI, stateName);
            // We need to use $apply to update all our bindings. However we
            // can't directly use $apply, as there is already another $apply in
            // progress, the one which angular itself has called at the start.
            // So we use $applyAsync to ensure that this $apply is called just
            // after the previous $apply is finished executing. Refer to this
            // link for more information -
            // http://blog.theodybrothers.com/2015/08/getting-inside-angular-scopeapplyasync.html
            $rootScope.$applyAsync();
            $timeout(function() {
              $('.oppia-editor-cards-container').fadeIn();
            }, 150);
          });
        } else {
          _actuallyNavigate(SLUG_GUI, stateName);
        }
      },
      navigateToTranslationTab: function() {
        _savePendingChanges();
        $location.path(TABS.TRANSLATION.path);
      },
      navigateToPreviewTab: function() {
        if (activeTabName !== TABS.PREVIEW.name) {
          _savePendingChanges();
          $timeout(function() {
            _actuallyNavigate(SLUG_PREVIEW, null);
          }, PREVIEW_TAB_WAIT_TIME_MSEC);
        }
      },
      navigateToStatsTab: function() {
        _savePendingChanges();
        $location.path(TABS.STATS.path);
      },
      navigateToImprovementsTab: function() {
        _savePendingChanges();
        $location.path(TABS.IMPROVEMENTS.path);
      },
      navigateToSettingsTab: function() {
        _savePendingChanges();
        $location.path(TABS.SETTINGS.path);
      },
      navigateToHistoryTab: function() {
        _savePendingChanges();
        $location.path(TABS.HISTORY.path);
      },
      navigateToFeedbackTab: function() {
        _savePendingChanges();
        $location.path(TABS.FEEDBACK.path);
      },
    };

    return RouterService;
  }
]);
