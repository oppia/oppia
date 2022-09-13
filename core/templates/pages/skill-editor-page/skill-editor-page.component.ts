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
 * @fileoverview Component for the skill editor page.
 */

import { SavePendingChangesModalComponent } from 'components/save-pending-changes/save-pending-changes-modal.component';
import { EntityEditorBrowserTabsInfoDomainConstants } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info-domain.constants';
import { EntityEditorBrowserTabsInfo } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';

require('interactions/interactionsQuestionsRequires.ts');
require('objects/objectComponentsRequires.ts');

require('base-components/base-content.component.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.component.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-editor-main-tab.directive.ts');
require('pages/skill-editor-page/navbar/skill-editor-navbar.component.ts');
require('pages/skill-editor-page/services/skill-editor-routing.service.ts');
require(
  'pages/skill-editor-page/skill-preview-tab/skill-preview-tab.component.ts');
require(
  'pages/skill-editor-page/questions-tab/skill-questions-tab.directive.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');
require('services/bottom-navbar-status.service.ts');
require('services/page-title.service.ts');
require('services/prevent-page-unload-event.service.ts');
require('services/ngb-modal.service.ts');
require('services/local-storage.service.ts');
require(
  'pages/skill-editor-page/services/' +
  'skill-editor-staleness-detection.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('skillEditorPage', {
  template: require('./skill-editor-page.component.html'),
  controller: [
    '$location', '$rootScope', 'BottomNavbarStatusService',
    'LocalStorageService',
    'NgbModal', 'PreventPageUnloadEventService',
    'SkillEditorRoutingService',
    'SkillEditorStalenessDetectionService', 'SkillEditorStateService',
    'UndoRedoService', 'UrlService', 'WindowRef',
    'MAX_COMMIT_MESSAGE_LENGTH',
    function(
        $location, $rootScope, BottomNavbarStatusService, LocalStorageService,
        NgbModal, PreventPageUnloadEventService,
        SkillEditorRoutingService,
        SkillEditorStalenessDetectionService, SkillEditorStateService,
        UndoRedoService, UrlService, WindowRef,
        MAX_COMMIT_MESSAGE_LENGTH) {
      var ctrl = this;
      let skillIsInitialized = false;
      ctrl.MAX_COMMIT_MESSAGE_LENGTH = MAX_COMMIT_MESSAGE_LENGTH;
      ctrl.directiveSubscriptions = new Subscription();

      // When the URL path changes, reroute to the appropriate tab in the
      // Skill editor page if back and forward button pressed in browser.
      $rootScope.$watch(() => $location.path(), (newPath, oldPath) => {
        if (newPath !== '') {
          SkillEditorRoutingService._changeTab(newPath);
          $rootScope.$applyAsync();
        }
      });

      ctrl.getActiveTabName = function() {
        return SkillEditorRoutingService.getActiveTabName();
      };
      ctrl.selectMainTab = function() {
        SkillEditorRoutingService.navigateToMainTab();
      };
      ctrl.selectPreviewTab = function() {
        SkillEditorRoutingService.navigateToPreviewTab();
      };
      ctrl.selectQuestionsTab = function() {
        // This check is needed because if a skill has unsaved changes to
        // misconceptions, then these will be reflected in the questions
        // created at that time, but if page is refreshed/changes are
        // discarded, the misconceptions won't be saved, but there will be
        // some questions with these now non-existent misconceptions.
        if (UndoRedoService.getChangeCount() > 0) {
          const modalRef = NgbModal.open(SavePendingChangesModalComponent, {
            backdrop: true
          });

          modalRef.componentInstance.body = (
            'Please save all pending changes ' +
            'before viewing the questions list.');

          modalRef.result.then(function() {}, function() {
            // Note to developers:
            // This callback is triggered when the Cancel button is clicked.
            // No further action is needed.
          });
        } else {
          SkillEditorRoutingService.navigateToQuestionsTab();
        }
      };
      ctrl.getWarningsCount = function() {
        return ctrl.skill ? ctrl.skill.getValidationIssues().length : 0;
      };

      ctrl.onClosingSkillEditorBrowserTab = function() {
        const skill = SkillEditorStateService.getSkill();

        const skillEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
          LocalStorageService.getEntityEditorBrowserTabsInfo(
            EntityEditorBrowserTabsInfoDomainConstants
              .OPENED_SKILL_EDITOR_BROWSER_TABS, skill.getId()));

        if (skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges() &&
            UndoRedoService.getChangeCount() > 0) {
          skillEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(false);
        }
        skillEditorBrowserTabsInfo.decrementNumberOfOpenedTabs();

        LocalStorageService.updateEntityEditorBrowserTabsInfo(
          skillEditorBrowserTabsInfo,
          EntityEditorBrowserTabsInfoDomainConstants
            .OPENED_SKILL_EDITOR_BROWSER_TABS);
      };

      const createOrUpdateSkillEditorBrowserTabsInfo = function() {
        const skill = SkillEditorStateService.getSkill();

        let skillEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
          LocalStorageService.getEntityEditorBrowserTabsInfo(
            EntityEditorBrowserTabsInfoDomainConstants
              .OPENED_SKILL_EDITOR_BROWSER_TABS, skill.getId()));

        if (skillIsInitialized) {
          skillEditorBrowserTabsInfo.setLatestVersion(skill.getVersion());
          skillEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(false);
        } else {
          if (skillEditorBrowserTabsInfo) {
            skillEditorBrowserTabsInfo.setLatestVersion(skill.getVersion());
            skillEditorBrowserTabsInfo.incrementNumberOfOpenedTabs();
          } else {
            skillEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
              'skill', skill.getId(), skill.getVersion(), 1, false);
          }
          skillIsInitialized = true;
        }

        LocalStorageService.updateEntityEditorBrowserTabsInfo(
          skillEditorBrowserTabsInfo,
          EntityEditorBrowserTabsInfoDomainConstants
            .OPENED_SKILL_EDITOR_BROWSER_TABS);
      };

      const onCreateOrUpdateSkillEditorBrowserTabsInfo = function(event) {
        if (event.key === (
          EntityEditorBrowserTabsInfoDomainConstants
            .OPENED_SKILL_EDITOR_BROWSER_TABS)
        ) {
          SkillEditorStalenessDetectionService
            .staleTabEventEmitter.emit();
          SkillEditorStalenessDetectionService
            .presenceOfUnsavedChangesEventEmitter.emit();
          $rootScope.$applyAsync();
        }
      };

      ctrl.$onInit = function() {
        BottomNavbarStatusService.markBottomNavbarStatus(true);
        PreventPageUnloadEventService.addListener(
          UndoRedoService.getChangeCount.bind(UndoRedoService));
        SkillEditorStateService.loadSkill(UrlService.getSkillIdFromUrl());
        ctrl.skill = SkillEditorStateService.getSkill();
        ctrl.directiveSubscriptions.add(
          SkillEditorStateService.onSkillChange.subscribe(() => {
            createOrUpdateSkillEditorBrowserTabsInfo();
            $rootScope.$applyAsync();
          })
        );
        skillIsInitialized = false;
        SkillEditorStalenessDetectionService.init();
        WindowRef.nativeWindow.addEventListener(
          'beforeunload', ctrl.onClosingSkillEditorBrowserTab);
        LocalStorageService.registerNewStorageEventListener(
          onCreateOrUpdateSkillEditorBrowserTabsInfo);
      };
    }
  ]
});
