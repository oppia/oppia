// Copyright 2018 The Oppia Authors. All Rights Reserved.
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

oppia.factory('QuestionRouterService', [
  '$rootScope', '$location', '$window', '$timeout', '$interval',
  'QuestionEditorStateService',
  function(
      $rootScope, $location, $window, $timeout, $interval,
      QuestionEditorStateService) {
    var MAIN_TAB = 'main';
    var PREVIEW_TAB = 'preview';
    var SETTINGS_TAB = 'settings';
    var STATS_TAB = 'stats';
    var HISTORY_TAB = 'history';
    var FEEDBACK_TAB = 'feedback';

    var SLUG_GUI = 'gui';
    var SLUG_PREVIEW = 'preview';

    var _tabs = {
      active: MAIN_TAB
    };

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

      if (newPath.indexOf('/preview/') === 0) {
        _tabs.active = PREVIEW_TAB;
        // _doNavigationWithState(newPath, SLUG_PREVIEW);
      } else if (newPath === '/settings') {
        _tabs.active = SETTINGS_TAB;
        $rootScope.$broadcast('refreshSettingsTab');
      } else if (newPath === '/stats') {
        _tabs.active = STATS_TAB;
        $rootScope.$broadcast('refreshStatisticsTab');
      } else if (newPath === '/history') {
        // TODO(sll): Do this on-hover rather than on-click.
        $rootScope.$broadcast('refreshVersionHistory', {
          forceRefresh: false
        });
        _tabs.active = HISTORY_TAB;
      } else if (newPath === '/feedback') {
        _tabs.active = FEEDBACK_TAB;
      } else if (newPath.indexOf('/gui/') === 0) {
        _tabs.active = MAIN_TAB;
        // _doNavigationWithState(newPath, SLUG_GUI);
      } //  else {
    //     if (ExplorationInitStateNameService.savedMemento) {
    //       $location.path(
    //         '/gui/' + ExplorationInitStateNameService.savedMemento);
    //     }
    //   }
    });

    // var _doNavigationWithState = function(path, pathType) {
    //   var pathBase = '/' + pathType + '/';
    //   var putativeStateName = path.substring(pathBase.length);
    //   var waitForStatesToLoad = $interval(function() {
    //     if (ExplorationStatesService.isInitialized()) {
    //       $interval.cancel(waitForStatesToLoad);
    //       if (ExplorationStatesService.hasState(putativeStateName)) {
    //         QuestionEditorStateService.setActiveStateName(putativeStateName);
    //         if (pathType === SLUG_GUI) {
    //           $rootScope.$broadcast('refreshStateEditor');
    //         }
    //         // TODO(sll): Fire an event to center the graph, in the case
    //         // where another tab is loaded first and then the user switches
    //         // to the editor tab. We used to redraw the graph completely but
    //         // this is taking lots of time and is probably not worth it.
    //       } else {
    //         $location.path(pathBase +
    //                        ExplorationInitStateNameService.savedMemento);
    //       }
    //     }
    //   }, 300);
    // };

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
        QuestionEditorStateService.setActiveStateName(newStateName);
      }
      $location.path('/' + pathType + '/' +
                     QuestionEditorStateService.getActiveStateName());
      $window.scrollTo(0, 0);
    };

    var QuestionRouterService = {
      savePendingChanges: function() {
        _savePendingChanges();
      },
      getTabStatuses: function() {
        return _tabs;
      },
      isLocationSetToNonStateEditorTab: function() {
        var currentPath = $location.path();
        return (
          currentPath === '/preview' || currentPath === '/stats' ||
          currentPath === '/settings' || currentPath === '/history' ||
          currentPath === '/feedback');
      },
      getCurrentStateFromLocationPath: function() {
        return _getCurrentStateFromLocationPath();
      },
      navigateToMainTab: function(stateName) {
        _savePendingChanges();
        if (_getCurrentStateFromLocationPath() === stateName) {
          return;
        }

        if (_tabs.active === MAIN_TAB) {
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
      navigateToPreviewTab: function() {
        if (_tabs.active !== PREVIEW_TAB) {
          _savePendingChanges();
          _actuallyNavigate(SLUG_PREVIEW, null);
        }
      },
      navigateToStatsTab: function() {
        _savePendingChanges();
        $location.path('/stats');
      },
      navigateToSettingsTab: function() {
        _savePendingChanges();
        $location.path('/settings');
      },
      navigateToHistoryTab: function() {
        _savePendingChanges();
        $location.path('/history');
      },
      navigateToFeedbackTab: function() {
        _savePendingChanges();
        $location.path('/feedback');
      }
    };

    return QuestionRouterService;
  }
]);
