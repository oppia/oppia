// Copyright 2012 Google Inc. All Rights Reserved.
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
  // The pathname is expected to be: /[exploration_id]
  $scope.explorationId = pathnameArray[2];
  // The following is needed for image displaying to work.
  $rootScope.explorationId = pathnameArray[2];
  $scope.explorationDataUrl = '/explorehandler/init/' + $scope.explorationId;
  if (GLOBALS.explorationVersion) {
    $scope.explorationDataUrl += '?v=' + GLOBALS.explorationVersion;
  }

  $window.onIframeLoad = function() {
    // Show content when the page is loaded.
    $scope.showPage = true;
    $scope.adjustPageHeight(false);
  };

  $scope.urlParams = $scope.getUrlParams();
  $scope.iframed = ($scope.urlParams.hasOwnProperty('iframed') &&
                    $scope.urlParams['iframed']);

  $scope.showPage = !$scope.iframed;

  $scope.getStyle = function() {
    return $scope.showPage ? {} : {opacity: 0};
  };

  $scope.changeInputTemplateIframeHeight = function(height) {
    var iframe = document.getElementById('inputTemplate');
    iframe.height = height + 'px';
  };

  $scope.resetPage = function() {
    messengerService.sendMessage(
      messengerService.EXPLORATION_RESET, $scope.stateName);
    $scope.initializePage();
  };

  $scope.initializePage = function() {
    $scope.responseLog = [];
    $scope.changeInputTemplateIframeHeight(400);
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

  /**
   * Removes the interactive iframe from the page, and replaces it with a new
   *     iframe before adding content. This is a necessary prerequisite for
   *     successful MathJax loading in the interactive iframes.
   *
   * IMPORTANT: This code assumes that the iframe is the only child in its
   *     parent element.
   *
   * @param {string} content The content to inject into the interactive iframe.
  */
  $scope.reloadInteractiveIframe = function(content) {
    var iframe = document.getElementById('inputTemplate');
    if (!iframe) {
      $log.error('No interactive iframe found.');
      return;
    }

    var attrs = iframe.attributes;
    var parentNode = iframe.parentNode;
    parentNode.removeChild(iframe);

    var newIframe = document.createElement('iframe');
    for (var i = 0; i < attrs.length; i++) {
      var attrib = attrs[i];
      if (attrib.specified) {
        newIframe.setAttribute(attrib.name, attrib.value);
      }
    }
    parentNode.appendChild(newIframe);

    var doc = (
      newIframe.contentDocument ? newIframe.contentDocument :
      newIframe.contentWindow ? newIframe.contentWindow.document :
      iframe.document
    );

    doc.open();
    doc.writeln(content);
    doc.close();
  };

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
    // We need to generate the HTML (with the iframe) before populating it.
    $scope.reloadInteractiveIframe($scope.inputTemplate);

    messengerService.sendMessage(messengerService.EXPLORATION_LOADED, null);
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
    $scope.inputTemplate = data.interactive_html;
    $scope.stateName = data.state_name;
    $scope.finished = data.finished;

    $scope.params = data.params;
    $scope.stateHistory = data.state_history;

    $scope.responseLog = $scope.responseLog || [];
    $scope.responseLog.push(
      data.reader_response_html, data.oppia_html
    );

    // This is necessary to apply the changes to $scope.responseLog and
    // make the `iframes` variable a few lines down show the correct length.
    $scope.$apply();

    // We need to generate the HTML (with the iframe) before populating it.
    if ($scope.inputTemplate) {
      // A non-empty interactive_html means that the previous widget
      // is not sticky and should be replaced.
      $scope.reloadInteractiveIframe($scope.inputTemplate);
    }

    if (data.reader_response_iframe) {
      // The previous user response needs to be rendered in a custom html with
      // an iframe.
      var iframes = document.getElementsByClassName('logContent');
      if (iframes.length) {
        $scope.addContentToIframe(
            iframes[iframes.length - 1], data.reader_response_iframe);
      }
    }

    if (document.getElementById('response')) {
      $('html, body, iframe').animate(
          {'scrollTop': document.getElementById('response').offsetTop},
          'slow', 'swing');
    }
    $scope.adjustPageHeight(true);

    if ($scope.finished) {
      messengerService.sendMessage(
        messengerService.EXPLORATION_COMPLETED, null);
    }
  };

  // If the exploration is iframed, send data to its parent about its height so
  // that the parent can be resized as necessary.
  $scope.lastRequestedHeight = 0;
  $scope.lastRequestedScroll = false;
  $scope.adjustPageHeight = function(scroll) {
    var newHeight = document.body.scrollHeight;
    if (Math.abs($scope.lastRequestedHeight - newHeight) <= 10.5 &&
        (!scroll || $scope.lastRequestedScroll)) {
      return;
    }
    // Sometimes setting iframe height to the exact content height still
    // produces scrollbar, so adding 10 extra px.
    newHeight += 10;
    messengerService.sendMessage(messengerService.HEIGHT_CHANGE,
        {height: newHeight, scroll: scroll});
    $scope.lastRequestedHeight = newHeight;
    $scope.lastRequestedScroll = scroll;
  };

  $window.onresize = $scope.adjustPageHeight.bind(null, false);

  $window.addEventListener('message', function(evt) {
    $log.info('Event received.');
    $log.info(evt.data);

    if (evt.origin != $window.location.protocol + '//' + $window.location.host) {
      return;
    }

    if (evt.data.hasOwnProperty('widgetHeight')) {
      // Change the height of the included iframe.
      $scope.changeInputTemplateIframeHeight(
        parseInt(evt.data.widgetHeight, 10) + 2);
    } else {
      // Submit an answer to the server.
      $scope.submitAnswer(JSON.parse(evt.data)['submit'], 'submit');
    }
  }, false);
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
ReaderExploration.$inject = [
  '$scope', '$http', '$rootScope', '$sce', '$timeout', '$modal', '$window', '$log', 'warningsData', 'messengerService', 'oppiaRequestCreator'
];
