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
 * @fileoverview Directive for the topic editor page.
 */

require('interactions/interactionsQuestionsRequires.ts');
require('objects/objectComponentsRequires.ts');

require('base-components/base-content.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');
require('pages/topic-editor-page/editor-tab/topic-editor-tab.directive.ts');
require(
  'pages/topic-editor-page/questions-tab/topic-questions-tab.directive.ts');
require(
  'pages/topic-editor-page/subtopics-list-tab/subtopics-list-tab.directive.ts');

require('pages/topic-editor-page/services/topic-editor-routing.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/page-title.service.ts');
require('services/contextual/url.service.ts');

require('pages/topic-editor-page/topic-editor-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');

angular.module('oppia').directive('topicEditorPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-editor-page/topic-editor-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', 'PageTitleService', 'TopicEditorRoutingService',
        'TopicEditorStateService', 'UrlService',
        'EVENT_TOPIC_INITIALIZED', 'EVENT_TOPIC_REINITIALIZED',
        function($scope, PageTitleService, TopicEditorRoutingService,
            TopicEditorStateService, UrlService,
            EVENT_TOPIC_INITIALIZED, EVENT_TOPIC_REINITIALIZED) {
          var ctrl = this;
          ctrl.getActiveTabName = TopicEditorRoutingService.getActiveTabName;
          TopicEditorStateService.loadTopic(UrlService.getTopicIdFromUrl());

          var setPageTitle = function() {
            PageTitleService.setPageTitle(
              TopicEditorStateService.getTopic().getName() + ' - Oppia');
          };
          $scope.$on(EVENT_TOPIC_INITIALIZED, setPageTitle);
          $scope.$on(EVENT_TOPIC_REINITIALIZED, setPageTitle);
        }
      ]
    };
  }]);
