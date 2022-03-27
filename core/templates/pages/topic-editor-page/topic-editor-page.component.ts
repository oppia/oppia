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
 * @fileoverview Component for the topic editor page.
 */

require('interactions/interactionsQuestionsRequires.ts');
require('objects/objectComponentsRequires.ts');

require('base-components/base-content.component.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');
require('services/bottom-navbar-status.service.ts');
require('pages/topic-editor-page/editor-tab/topic-editor-tab.directive.ts');
require(
  'pages/topic-editor-page/subtopic-editor/subtopic-preview-tab.component.ts');
require(
  'pages/topic-editor-page/subtopic-editor/subtopic-editor-tab.component.ts');
require(
  'pages/topic-editor-page/questions-tab/topic-questions-tab.component.ts');

require('pages/topic-editor-page/services/topic-editor-routing.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/context.service.ts');
require('services/contextual/url.service.ts');
require('services/page-title.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('pages/topic-editor-page/topic-editor-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');
require('pages/topic-editor-page/preview-tab/topic-preview-tab.component.ts');
require('services/loader.service.ts');
require('services/prevent-page-unload-event.service.ts');
require('services/local-storage.service.ts');
require('services/favicon.service.ts');

import { EntityEditorBrowserTabsInfoDomainConstants } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info-domain.constants';
import { EntityEditorBrowserTabsInfo, EntityEditorBrowserTabsInfoDict } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { Subscription } from 'rxjs';

angular.module('oppia').directive('topicEditorPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-editor-page/topic-editor-page.component.html'),
      controllerAs: '$ctrl',
      controller: [
        '$rootScope', 'BottomNavbarStatusService', 'ContextService',
        'FaviconService', 'LoaderService', 'LocalStorageService',
        'PageTitleService', 'PreventPageUnloadEventService',
        'TopicEditorRoutingService', 'TopicEditorStateService',
        'UndoRedoService', 'UrlService', 'WindowRef',
        function(
            $rootScope, BottomNavbarStatusService, ContextService,
            FaviconService, LoaderService, LocalStorageService,
            PageTitleService, PreventPageUnloadEventService,
            TopicEditorRoutingService, TopicEditorStateService,
            UndoRedoService, UrlService, WindowRef) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          ctrl.getActiveTabName = function() {
            return TopicEditorRoutingService.getActiveTabName();
          };
          ctrl.getEntityType = function() {
            return ContextService.getEntityType();
          };

          var setDocumentTitle = function() {
            let topicName = TopicEditorStateService.getTopic().getName();
            PageTitleService.setDocumentTitle(
              topicName + ' - Oppia');
            PageTitleService.setNavbarSubtitleForMobileView(topicName);
            ctrl.topic = TopicEditorStateService.getTopic();
            ctrl._validateTopic();
          };

          ctrl.getChangeListLength = function() {
            return UndoRedoService.getChangeCount();
          };
          ctrl.isInTopicEditorTabs = function() {
            var activeTab = TopicEditorRoutingService.getActiveTabName();
            return !activeTab.startsWith('subtopic');
          };
          ctrl.openTopicViewer = function() {
            var activeTab = TopicEditorRoutingService.getActiveTabName();
            var lastSubtopicIdVisited = (
              TopicEditorRoutingService.getLastSubtopicIdVisited());
            if (!activeTab.startsWith('subtopic') && !lastSubtopicIdVisited) {
              TopicEditorRoutingService.navigateToTopicPreviewTab();
            } else {
              var subtopicId = TopicEditorRoutingService.getSubtopicIdFromUrl();
              TopicEditorRoutingService.navigateToSubtopicPreviewTab(
                subtopicId);
            }
          };
          ctrl.isInPreviewTab = function() {
            var activeTab = TopicEditorRoutingService.getActiveTabName();
            return (
              activeTab === 'subtopic_preview' ||
                activeTab === 'topic_preview');
          };
          ctrl.selectMainTab = function() {
            const activeTab = ctrl.getActiveTabName();
            const subtopicId = (
              TopicEditorRoutingService.getSubtopicIdFromUrl() ||
                TopicEditorRoutingService.getLastSubtopicIdVisited());
            const lastTabVisited = (
              TopicEditorRoutingService.getLastTabVisited());
            if (activeTab.startsWith('subtopic') ||
                lastTabVisited === 'subtopic') {
              TopicEditorRoutingService.navigateToSubtopicEditorWithId(
                subtopicId);
              return;
            }
            TopicEditorRoutingService.navigateToMainTab();
          };
          ctrl.isMainEditorTabSelected = function() {
            const activeTab = ctrl.getActiveTabName();
            return activeTab === 'main' || activeTab === 'subtopic_editor';
          };
          ctrl.selectQuestionsTab = function() {
            TopicEditorRoutingService.navigateToQuestionsTab();
          };
          ctrl.getNavbarText = function() {
            if (TopicEditorStateService.hasLoadedTopic()) {
              const activeTab = ctrl.getActiveTabName();
              if (activeTab === 'main') {
                return 'Topic Editor';
              } else if (activeTab === 'subtopic_editor') {
                return 'Subtopic Editor';
              } else if (activeTab === 'subtopic_preview') {
                return 'Subtopic Preview';
              } else if (activeTab === 'questions') {
                return 'Question Editor';
              } else if (activeTab === 'topic_preview') {
                return 'Topic Preview';
              }
            }
          };
          ctrl._validateTopic = function() {
            ctrl.validationIssues = ctrl.topic.validate();
            if (TopicEditorStateService.getTopicWithNameExists()) {
              ctrl.validationIssues.push(
                'A topic with this name already exists.');
            }
            if (TopicEditorStateService.getTopicWithUrlFragmentExists()) {
              ctrl.validationIssues.push(
                'Topic URL fragment already exists.');
            }
            var prepublishTopicValidationIssues = (
              ctrl.topic.prepublishValidate());
            var subtopicPrepublishValidationIssues = (
              [].concat.apply([], ctrl.topic.getSubtopics().map(
                (subtopic) => subtopic.prepublishValidate())));
            ctrl.prepublishValidationIssues = (
              prepublishTopicValidationIssues.concat(
                subtopicPrepublishValidationIssues));
          };

          ctrl.getWarningsCount = function() {
            return ctrl.validationIssues.length;
          };

          ctrl.getTotalWarningsCount = function() {
            var validationIssuesCount = ctrl.validationIssues.length;
            var prepublishValidationIssuesCount = (
              ctrl.prepublishValidationIssues.length);
            return validationIssuesCount + prepublishValidationIssuesCount;
          };

          var createTopicEditorBrowserTabsInfo = function() {
            var topic = TopicEditorStateService.getTopic();

            var topicEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
              LocalStorageService.getEntityEditorBrowserTabsInfo(
                EntityEditorBrowserTabsInfoDomainConstants
                  .OPENED_TOPIC_EDITOR_BROWSER_TABS, topic.getId()));

            if (topicEditorBrowserTabsInfo) {
              topicEditorBrowserTabsInfo.setLatestVersion(topic.getVersion());
              topicEditorBrowserTabsInfo.incrementNumberOfOpenedTabs();
              topicEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(false);
            } else {
              topicEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
                'topic', topic.getId(), topic.getVersion(), 1, false);
            }

            LocalStorageService.updateEntityEditorBrowserTabsInfo(
              topicEditorBrowserTabsInfo,
              EntityEditorBrowserTabsInfoDomainConstants
                .OPENED_TOPIC_EDITOR_BROWSER_TABS);
          };

          var updateTopicEditorBrowserTabsInfo = function() {
            const topic = TopicEditorStateService.getTopic();

            const topicEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
              LocalStorageService.getEntityEditorBrowserTabsInfo(
                EntityEditorBrowserTabsInfoDomainConstants
                  .OPENED_TOPIC_EDITOR_BROWSER_TABS, topic.getId()));

            topicEditorBrowserTabsInfo.setLatestVersion(topic.getVersion());
            topicEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(false);

            LocalStorageService.updateOpenedEntityEditorBrowserTabsInfo(
              topicEditorBrowserTabsInfo,
              EntityEditorBrowserTabsInfoDomainConstants
                .OPENED_TOPIC_EDITOR_BROWSER_TABS);
          };

          var onClosingTopicEditorBrowserTab = function() {
            const topic = TopicEditorStateService.getTopic();

            const topicEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
              LocalStorageService.getEntityEditorBrowserTabsInfo(
                EntityEditorBrowserTabsInfoDomainConstants
                  .OPENED_TOPIC_EDITOR_BROWSER_TABS, topic.getId()));

            if (topicEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges() &&
                UndoRedoService.getChangeCount() > 0) {
              topicEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(false);
            }
            topicEditorBrowserTabsInfo.decrementNumberOfOpenedTabs();

            LocalStorageService.updateOpenedEntityEditorBrowserTabsInfo(
              topicEditorBrowserTabsInfo,
              EntityEditorBrowserTabsInfoDomainConstants
                .OPENED_TOPIC_EDITOR_BROWSER_TABS);
          };

          var onCreateOrUpdateTopicEditorBrowserTabsInfo = function(event) {
            const topic = TopicEditorStateService.getTopic();
            if (event.key === (
              EntityEditorBrowserTabsInfoDomainConstants
                .OPENED_TOPIC_EDITOR_BROWSER_TABS)
            ) {
              const oldTopicEditorBrowserTabsInfoDict:
                EntityEditorBrowserTabsInfoDict = (
                  JSON.parse(event.oldValue) || {});
              const newOpenedTopicEditorPagesObject:
                EntityEditorBrowserTabsInfoDict = (
                  JSON.parse(event.newValue));

              const oldOpenedTopicEditorBrowserTabsInfo = {};
              for (let topicId in oldTopicEditorBrowserTabsInfoDict) {
                oldOpenedTopicEditorBrowserTabsInfo[topicId] = (
                  EntityEditorBrowserTabsInfo.fromLocalStorageDict(
                    oldTopicEditorBrowserTabsInfoDict[topicId], topicId)
                );
              }

              const newOpenedTopicEditorBrowserTabsInfo = {};
              for (let topicId in newOpenedTopicEditorPagesObject) {
                newOpenedTopicEditorBrowserTabsInfo[topicId] = (
                  EntityEditorBrowserTabsInfo.fromLocalStorageDict(
                    newOpenedTopicEditorPagesObject[topicId], topicId)
                );
              }

              const oldTopicEditorBrowserTabInfo = (
                oldOpenedTopicEditorBrowserTabsInfo[topic.getId()]);
              const newTopicEditorBrowserTabInfo = (
                newOpenedTopicEditorBrowserTabsInfo[topic.getId()]);

              if (
                newTopicEditorBrowserTabInfo
                  .getLatestVersion() !== topic.getVersion()
              ) {
                FaviconService.setFavicon(
                  '/assets/images/favicon_alert/favicon_alert.ico');
                $rootScope.$applyAsync();
              }
              if (oldTopicEditorBrowserTabInfo &&
                    oldTopicEditorBrowserTabInfo
                      .doesSomeTabHaveUnsavedChanges() !==
                        newTopicEditorBrowserTabInfo
                          .doesSomeTabHaveUnsavedChanges()
              ) {
                $rootScope.$applyAsync();
              }
            }
          };

          ctrl.$onInit = function() {
            LoaderService.showLoadingScreen('Loading Topic');
            ctrl.directiveSubscriptions.add(
              TopicEditorStateService.onTopicInitialized.subscribe(
                () => {
                  LoaderService.hideLoadingScreen();
                  setDocumentTitle();
                  createTopicEditorBrowserTabsInfo();
                  $rootScope.$applyAsync();
                }
              ));
            ctrl.directiveSubscriptions.add(
              TopicEditorStateService.onTopicReinitialized.subscribe(
                () => {
                  setDocumentTitle();
                  updateTopicEditorBrowserTabsInfo();
                  $rootScope.$applyAsync();
                }
              ));
            // This subscription can be removed once this component is migrated.
            ctrl.directiveSubscriptions.add(
              TopicEditorRoutingService.updateViewEventEmitter.subscribe(
                () => {
                  $rootScope.$applyAsync();
                }
              )
            );
            TopicEditorStateService.loadTopic(UrlService.getTopicIdFromUrl());
            PageTitleService.setNavbarTitleForMobileView('Topic Editor');
            PreventPageUnloadEventService.addListener(
              UndoRedoService.getChangeCount.bind(UndoRedoService));
            ctrl.validationIssues = [];
            ctrl.prepublishValidationIssues = [];
            ctrl.warningsAreShown = false;
            BottomNavbarStatusService.markBottomNavbarStatus(true);
            ctrl.directiveSubscriptions.add(
              UndoRedoService.getUndoRedoChangeEventEmitter().subscribe(
                () => setDocumentTitle()
              )
            );
            WindowRef.nativeWindow.addEventListener('beforeunload', (event) => {
              onClosingTopicEditorBrowserTab();
            });
            LocalStorageService.registerNewStorageEventListener(
              onCreateOrUpdateTopicEditorBrowserTabsInfo);
          };

          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }]);
