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

 function ReaderExploration($scope, $http, $timeout, warningsData) {
  // The pathname is expected to be: /[exploration_id]
  $scope.explorationId = pathnameArray[2];
  $scope.explorationDataUrl = '/learn/' + $scope.explorationId + '/data';

  $scope.urlParams = $scope.getUrlParams();
  $scope.iframed = ($scope.urlParams.hasOwnProperty('iframed') &&
      $scope.urlParams['iframed']);

  // Initializes the story page using data from the server.
  $scope.initializePage = function() {
    $http.get($scope.explorationDataUrl)
        .success(function(data) {
          $scope.explorationTitle = data.title;
          $scope.loadPage(data);
          window.scrollTo(0, 0);
        }).error(function(data) {
          warningsData.addWarning(
              data.error || 'There was an error loading the exploration.');
        });
  };

  $scope.initializePage();

  $scope.answerIsBeingProcessed = false;

  $scope.loadPage = function(data) {
    console.log(data);
    $scope.answer = data.default_answer;
    $scope.blockNumber = data.block_number;
    $scope.categories = data.categories;
    $scope.finished = data.finished;
    $scope.inputTemplate = data.interactive_widget_html;
    $scope.oppiaHtml = data.oppia_html;
    $scope.html = '';
    $scope.params = data.params;
    $scope.stateId = data.state_id;
    $scope.title = data.title;
    $scope.widgets = data.widgets;
    // We need to generate the HTML (with the iframe) before populating it.
    // TODO(sll): Try and get rid of the "$digest already in progress" error here.
    $scope.addContentToIframe('inputTemplate', $scope.inputTemplate);

    $scope.$apply();
    $scope.updateMath();

    if (data.widgets.length > 0) {
      $scope.addContentToIframe('widgetCompiled' + data.widgets[0].blockIndex + '-' +
          data.widgets[0].index, data.widgets[0].code);
    }
  };

  $scope.submitAnswer = function(answer, handler) {
    if ($scope.answerIsBeingProcessed) {
      return;
    }

    var requestMap = {
      answer: answer,
      block_number: $scope.blockNumber,
      handler: handler,
      params: $scope.params
    };

    $scope.answerIsBeingProcessed = true;

    $http.post(
        '/learn/' + $scope.explorationId + '/' + $scope.stateId,
        $scope.createRequest(requestMap),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success($scope.refreshPage)
    .error(function(data) {
      $scope.answerIsBeingProcessed = false;
      warningsData.addWarning(
        data.error || 'There was an error processing your input.');
    });
  };

  $scope.refreshPage = function(data) {
    $scope.answerIsBeingProcessed = false;

    console.log(data);
    $scope.blockNumber = data.block_number;
    $scope.categories = data.categories;
    $scope.inputTemplate = data.interactive_widget_html;
    $scope.stateId = data.state_id;
    $scope.finished = data.finished;

    $scope.params = data.params;

    $scope.html += $scope.oppiaHtml;
    $scope.html += data.reader_html;
    $scope.oppiaHtml = data.oppia_html;

    $scope.answer = data.default_answer;
    // We need to generate the HTML (with the iframe) before populating it.
    // TODO(sll): Try and get rid of the "$digest already in progress" error here.
    if (!data.sticky_interactive_widget) {
      $scope.addContentToIframe('inputTemplate', $scope.inputTemplate);
    }

    $scope.$apply();
    $scope.updateMath();

    if ($scope.widgets.length > 0) {
      $scope.addContentToIframe('widgetCompiled' + $scope.widgets[0].blockIndex + '-' +
          $scope.widgets[0].index, $scope.widgets[0].code);
    }

    var currentScrollTop = $('body').scrollTop();
    // TODO(sll): This should actually scroll to the location of #oppiaHtml.
    $('html,body').animate({scrollTop: Math.max(
        $(document).height() - 1000, currentScrollTop + 50)});
  };

  window.addEventListener('message', receiveMessage, false);

  function receiveMessage(evt) {
    console.log('Event received.');
    if (evt.origin == window.location.protocol + '//' + window.location.host) {
      $scope.submitAnswer(JSON.parse(evt.data)['submit'], 'submit');
    }
  }
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
ReaderExploration.$inject = ['$scope', '$http', '$timeout', 'warningsData'];
