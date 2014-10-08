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
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.factory('routerService', [
    '$rootScope', '$location', '$log', 'explorationInitStateNameService',
    'editorContextService', 'explorationStatesService',
    function($rootScope, $location, $log, explorationInitStateNameService,
             editorContextService, explorationStatesService) {

  var _tabs = {
    main: {
      active: true
    },
    stats: {
      active: false
    },
    settings: {
      active: false
    },
    history: {
      active: false
    },
    feedback: {
      active: false
    }
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

    $rootScope.$broadcast('externalSave');

    if (newPath === '/stats') {
      _tabs.stats.active = true;
    } else if (newPath === '/settings') {
      _tabs.settings.active = true;
    } else if (newPath === '/history') {
      _tabs.history.active = true;
    } else if (newPath === '/feedback') {
      _tabs.feedback.active = true;
    } else if (newPath.indexOf('/gui/') !== -1) {
      _tabs.main.active = true;
      var putativeStateName = newPath.substring('/gui/'.length);
      if (!explorationStatesService.getStates()) {
        return;
      } else if (explorationStatesService.getState(putativeStateName)) {
        editorContextService.setActiveStateName(putativeStateName);
      } else {
        $location.path('/gui/' + explorationInitStateNameService.savedMemento);
      }
      $rootScope.$broadcast('refreshStateEditor');
    } else {
      if (explorationInitStateNameService.savedMemento) {
        $location.path('/gui/' + explorationInitStateNameService.savedMemento);
      }
    }
  });

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

  var routerService = {
    savePendingChanges: function() {
      _savePendingChanges();
    },
    getTabStatuses: function() {
      return _tabs;
    },
    isLocationSetToNonStateEditorTab: function() {
      var currentPath = $location.path();
      return (
        currentPath === '/stats' || currentPath === '/settings' ||
        currentPath === '/history' || currentPath === '/feedback');
    },
    getCurrentStateFromLocationPath: function() {
      if ($location.path().indexOf('/gui/') !== -1) {
        return $location.path().substring('/gui/'.length);
      } else {
        return null;
      }
    },
    navigateToMainTab: function(stateName) {
      _savePendingChanges();
      if (stateName) {
        editorContextService.setActiveStateName(stateName);
      }
      $location.path('/gui/' + editorContextService.getActiveStateName());
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

  return routerService;
}]);
