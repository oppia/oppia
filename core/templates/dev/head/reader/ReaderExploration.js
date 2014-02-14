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
 * @fileoverview Controllers for the reader's view of an exploration.
 *
 * @author sll@google.com (Sean Lip)
 */

function ReaderExploration(
    $scope, $http, $rootScope, $sce, $timeout, $modal, $window, $log, warningsData,
    messengerService, oppiaRequestCreator) {

  // The pathname should be: .../explore/{exploration_id}
  $scope.pathnameArray = window.location.pathname.split('/');
  for (var i = 0; i < $scope.pathnameArray.length; i++) {
    if ($scope.pathnameArray[i] === 'explore') {
      $scope.explorationId = $scope.pathnameArray[i + 1];
      break;
    }
  }

  // The following is needed for image displaying to work.
  $rootScope.explorationId = $scope.explorationId;
  $scope.explorationDataUrl = '/explorehandler/init/' + $scope.explorationId;
  if (GLOBALS.explorationVersion) {
    $scope.explorationDataUrl += '?v=' + GLOBALS.explorationVersion;
  }

  $scope.urlParams = $scope.getUrlParams();
  $scope.iframed = ($scope.urlParams.hasOwnProperty('iframed') &&
                    $scope.urlParams['iframed']);

  $scope.showPage = !$scope.iframed;

  $scope.getStyle = function() {
    return $scope.showPage ? {} : {opacity: 0};
  };

  $scope.resetPage = function() {
    messengerService.sendMessage(
      messengerService.EXPLORATION_RESET, $scope.stateName);
    $scope.initializePage();
  };

  $scope.initializePage = function() {
    $scope.responseLog = [];
    $http.get($scope.explorationDataUrl)
      .success(function(data) {
        $scope.explorationTitle = data.title;
        $scope.loadPage(data);
        $window.scrollTo(0, 0);
      }).error(function(data) {
        warningsData.addWarning(
            data.error || 'There was an error loading the exploration.');
      });
  };

  $scope.initializePage();

  $scope.showFeedbackModal = function() {
    warningsData.clear();

    var modalInstance = $modal.open({
      templateUrl: 'modals/readerFeedback',
      backdrop: 'static',
      resolve: {},
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
        $scope.submit = function(feedback) {
          $modalInstance.close({feedback: feedback});
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    });

    modalInstance.result.then(function(result) {
      if (result.feedback) {
        $scope.submitFeedback(result.feedback);
        $scope.showFeedbackConfirmationModal();
      } else {
        warningsData.addWarning('No feedback was submitted.');
      }
    });
  };

  $scope.showFeedbackConfirmationModal = function() {
    warningsData.clear();

    var modalInstance = $modal.open({
      templateUrl: 'modals/readerFeedbackConfirmation',
      backdrop: 'static',
      resolve: {},
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    });
  };

  $scope.submitFeedback = function(feedback) {
    var requestMap = {
      feedback: feedback,
      state_history: angular.copy($scope.stateHistory),
      version: GLOBALS.explorationVersion
    };

    $http.post(
        '/explorehandler/give_feedback/' + $scope.explorationId + '/' + encodeURIComponent($scope.stateName),
        oppiaRequestCreator.createRequest(requestMap),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function() {
      $scope.feedback = '';
      $('#feedbackModal').modal('hide');
    }).error(function(data) {
      warningsData.addWarning(
        data.error || 'There was an error processing your input.');
    });
  };

  $scope.answerIsBeingProcessed = false;

  $scope.loadPage = function(data) {
    $scope.blockNumber = data.block_number;
    $scope.categories = data.categories;
    $scope.finished = data.finished;
    $scope.inputTemplate = data.interactive_html;
    $scope.responseLog = [data.init_html];
    $scope.params = data.params;
    $scope.stateName = data.state_name;
    $scope.title = data.title;
    $scope.stateHistory = data.state_history;

    messengerService.sendMessage(messengerService.EXPLORATION_LOADED, null);
    $scope.showPage = true;
    $scope.adjustPageHeight(false, null);
  };

  $scope.submitAnswer = function(answer, handler) {
    if ($scope.answerIsBeingProcessed) {
      return;
    }

    var requestMap = {
      answer: answer,
      block_number: $scope.blockNumber,
      handler: handler,
      params: $scope.params,
      state_history: $scope.stateHistory,
      version: GLOBALS.explorationVersion
    };

    $scope.answerIsBeingProcessed = true;

    $http.post(
        '/explorehandler/transition/' + $scope.explorationId + '/' + encodeURIComponent($scope.stateName),
        oppiaRequestCreator.createRequest(requestMap),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      messengerService.sendMessage(messengerService.STATE_TRANSITION, {
        oldStateName: $scope.stateName,
        jsonAnswer: JSON.stringify(answer),
        newStateName: data.state_name
      });
      $scope.refreshPage(data);
    })
    .error(function(data) {
      $scope.answerIsBeingProcessed = false;
      warningsData.addWarning(
        data.error || 'There was an error processing your input.');
    });
  };

  $scope.refreshPage = function(data) {
    warningsData.clear();
    $scope.answerIsBeingProcessed = false;

    $scope.blockNumber = data.block_number;
    $scope.categories = data.categories;
    if (data.interactive_html) {
      // This is a bit of a hack. When a refresh happens, AngularJS compares
      // $scope.inputTemplate to the previous value of $scope.inputTemplate.
      // If they are the same, then $scope.inputTemplate is not updated, and
      // the reader's previous answers still remain present. The random suffix
      // makes the new template different from the previous one, and thus
      // indirectly forces a refresh.
      var randomSuffix = '';
      var N = Math.round(Math.random() * 1000);
      for (var i = 0; i < N; i++) {
        randomSuffix += ' ';
      }

      // A non-empty interactive_html means that the previous widget
      // is not sticky and should be replaced.
      $scope.inputTemplate = data.interactive_html + randomSuffix;
    }

    $scope.stateName = data.state_name;
    $scope.finished = data.finished;

    $scope.params = data.params;
    $scope.stateHistory = data.state_history;

    $scope.responseLog = $scope.responseLog || [];
    $scope.responseLog.push(
      data.reader_response_html, data.oppia_html
    );

    $scope.adjustPageHeight(true, function() {
      if (document.getElementById('response')) {
        $('html, body, iframe').animate({
          'scrollTop': document.getElementById('response').offsetTop
        }, 'slow', 'swing');
      }
    });

    if ($scope.finished) {
      messengerService.sendMessage(
        messengerService.EXPLORATION_COMPLETED, null);
    }
  };

  // If the exploration is iframed, send data to its parent about its height so
  // that the parent can be resized as necessary.
  $scope.lastRequestedHeight = 0;
  $scope.lastRequestedScroll = false;
  $scope.adjustPageHeight = function(scroll, callback) {
    window.setTimeout(function() {
      var newHeight = document.body.scrollHeight;
      if (Math.abs($scope.lastRequestedHeight - newHeight) <= 50.5 &&
          (!scroll || $scope.lastRequestedScroll)) {
        return;
      }
      // Sometimes setting iframe height to the exact content height still
      // produces scrollbar, so adding 50 extra px.
      newHeight += 50;
      messengerService.sendMessage(messengerService.HEIGHT_CHANGE,
        {height: newHeight, scroll: scroll});
      $scope.lastRequestedHeight = newHeight;
      $scope.lastRequestedScroll = scroll;

      if (callback) {
        callback();
      }
    }, 500);
  };

  $window.onresize = $scope.adjustPageHeight.bind(null, false, null);
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
ReaderExploration.$inject = [
  '$scope', '$http', '$rootScope', '$sce', '$timeout', '$modal', '$window', '$log', 'warningsData', 'messengerService', 'oppiaRequestCreator'
];
