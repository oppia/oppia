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

import { PlatformLocation } from '@angular/common';
import { Injectable, EventEmitter, NgZone } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { ExplorationInitStateNameService } from 'pages/exploration-editor-page/services/exploration-init-state-name.service';
import { StateEditorRefreshService } from 'pages/exploration-editor-page/services/state-editor-refresh.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { ExplorationImprovementsService } from 'services/exploration-improvements.service';
import { ExternalSaveService } from 'services/external-save.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';

@Injectable({
  providedIn: 'root'
})
export class RouterService {
  TABS = {
    MAIN: { name: 'main', path: '/main' },
    TRANSLATION: { name: 'translation', path: '/translation' },
    PREVIEW: { name: 'preview', path: '/preview' },
    SETTINGS: { name: 'settings', path: '/settings' },
    STATS: { name: 'stats', path: '/stats' },
    IMPROVEMENTS: { name: 'improvements', path: '/improvements' },
    HISTORY: { name: 'history', path: '/history' },
    FEEDBACK: { name: 'feedback', path: '/feedback' },
  };

  /** @private */
  private centerGraphEventEmitter = new EventEmitter();
  private SLUG_GUI = 'gui';
  private SLUG_PREVIEW = 'preview';
  private SLUG_TRANSLATION = 'translation';
  private PREVIEW_TAB_WAIT_TIME_MSEC = 200;
  private _activeTabName = this.TABS.MAIN.name;
  private refreshSettingsTabEventEmitter = new EventEmitter();
  private refreshStatisticsTabEventEmitter = new EventEmitter();
  private refreshTranslationTabEventEmitter = new EventEmitter();
  private refreshVersionHistoryEventEmitter = new EventEmitter();

  constructor(
    private windowRef: WindowRef,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private stateEditorRefreshService: StateEditorRefreshService,
    private explorationStatesService: ExplorationStatesService,
    private explorationImprovementsService: ExplorationImprovementsService,
    private translationLanguagesService: TranslationLanguageService,
    private externalSaveService: ExternalSaveService,
    private stateEditorService: StateEditorService,
    private location: PlatformLocation,
    private ngZone: NgZone
  ) {
    this._changeTab(this.windowRef.nativeWindow.location.hash.split('#')[1]);

    this.location.onPopState(() => {
      if (window.location.hash === '') {
        window.history.go(-1);
      }
    });
  }

  _changeTab(newPath: string): void {
    if (newPath === undefined || newPath === '') {
      this._changeTab('/');
      return;
    }

    this.windowRef.nativeWindow.location.hash = newPath;
    newPath = decodeURI(newPath);

    // TODO(oparry): Determine whether this is necessary, since
    // _savePendingChanges() is called by each of the navigateTo... functions.
    this.externalSaveService.onExternalSave.emit();

    if (newPath.indexOf(this.TABS.TRANSLATION.path) === 0) {
      this._activeTabName = this.TABS.TRANSLATION.name;
      const [stateName, contentId, languageCode] = newPath.substring(
        this.TABS.TRANSLATION.path.length + 1).split('/');
      if (stateName) {
        this.stateEditorService.setActiveStateName(stateName);
      }
      if (contentId) {
        this.stateEditorService.setInitActiveContentId(contentId);
      }
      if (languageCode) {
        this.translationLanguagesService.setActiveLanguageCode(
          languageCode);
      }
      this.windowRef.nativeWindow.location.hash = (
        this.TABS.TRANSLATION.path + '/' + stateName);
      this.refreshTranslationTabEventEmitter.emit();
      this.ngZone.runOutsideAngular(() => {
        let waitForStatesToLoad = setInterval(() => {
          this.ngZone.run(() => {
            if (this.explorationStatesService.isInitialized()) {
              clearInterval(waitForStatesToLoad);
              if (!this.stateEditorService.getActiveStateName()) {
                this.stateEditorService.setActiveStateName(
                  this.explorationInitStateNameService.savedMemento);
              }
              this.refreshTranslationTabEventEmitter.emit();
            }
          });
        }, 300);
      });
    } else if (newPath.indexOf(this.TABS.PREVIEW.path) === 0) {
      this._activeTabName = this.TABS.PREVIEW.name;
      this._doNavigationWithState(newPath, this.SLUG_PREVIEW);
    } else if (newPath === this.TABS.SETTINGS.path) {
      this._activeTabName = this.TABS.SETTINGS.name;
      this.refreshSettingsTabEventEmitter.emit();
    } else if (newPath === this.TABS.STATS.path) {
      this._activeTabName = this.TABS.STATS.name;
      this.refreshStatisticsTabEventEmitter.emit();
    } else if (newPath === this.TABS.IMPROVEMENTS.path) {
      this._activeTabName = this.TABS.IMPROVEMENTS.name;

      Promise.resolve(
        this.explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).then(improvementsTabIsEnabled => {
        if (this._activeTabName === this.TABS.IMPROVEMENTS.name &&
          !improvementsTabIsEnabled) {
          // Redirect to the main tab.
          this._actuallyNavigate(this.SLUG_GUI, null);
        }
      });
    } else if (newPath === this.TABS.HISTORY.path) {
      // TODO(sll): Do this on-hover rather than on-click.
      this.refreshVersionHistoryEventEmitter.emit({
        forceRefresh: false
      });
      this._activeTabName = this.TABS.HISTORY.name;
    } else if (newPath === this.TABS.FEEDBACK.path) {
      this._activeTabName = this.TABS.FEEDBACK.name;
    } else if (newPath.indexOf('/gui/') === 0) {
      this._activeTabName = this.TABS.MAIN.name;
      this._doNavigationWithState(newPath, this.SLUG_GUI);
    } else {
      if (this.explorationInitStateNameService.savedMemento) {
        this._changeTab(
          '/gui/' + this.explorationInitStateNameService.savedMemento);
      }
    }

    // Fire an event to center the Graph in the
    // Editor Tabs, Translation Tab, History Tab.
    this.centerGraphEventEmitter.emit();
  }

  _doNavigationWithState(path: string, pathType: string): void {
    let pathBase = '/' + pathType + '/';
    let putativeStateName = path.substring(pathBase.length);

    this.ngZone.runOutsideAngular(() => {
      let waitForStatesToLoad = setInterval(() => {
        this.ngZone.run(() => {
          if (this.explorationStatesService.isInitialized()) {
            clearInterval(waitForStatesToLoad);
            if (this.explorationStatesService.hasState(putativeStateName)) {
              this.stateEditorService.setActiveStateName(putativeStateName);
              // We need to check this._activeTabName because the user may have
              // navigated to a different tab before the states finish loading.
              // In such a case, we should not switch back to the editor main
              // tab.
              if (pathType === this.SLUG_GUI &&
                  this._activeTabName === this.TABS.MAIN.name) {
                this.windowRef.nativeWindow.location.hash = path;
                this.stateEditorRefreshService.onRefreshStateEditor.emit();
              }
            } else {
              this._changeTab(
                pathBase + this.explorationInitStateNameService.savedMemento);
            }
          }
        });
      }, 300);
    });
  }

  _savePendingChanges(): void {
    this.externalSaveService.onExternalSave.emit();
  }

  _getCurrentStateFromLocationPath(): string | null {
    let location = this.windowRef.nativeWindow.location.hash;
    if (location.indexOf('/gui/') !== -1) {
      return location.substring('/gui/'.length);
    } else {
      return null;
    }
  }

  // New state name is null when navigating to the main tab.
  _actuallyNavigate(pathType: string, newStateName: string): void {
    if (newStateName) {
      this.stateEditorService.setActiveStateName(newStateName);
    }

    this._changeTab(
      '/' + pathType + '/' + this.stateEditorService.getActiveStateName());
    this.windowRef.nativeWindow.scrollTo(0, 0);
  }

  savePendingChanges(): void {
    this._savePendingChanges();
  }

  getActiveTabName(): string {
    return this._activeTabName;
  }

  isLocationSetToNonStateEditorTab(): boolean {
    let currentPath = (
      '/' +
      (
        this.windowRef.nativeWindow.location.hash?.
          split('#')[1]?.split('/')[1]) ??
      '');

    return (
      currentPath === this.TABS.MAIN.path ||
      currentPath === this.TABS.TRANSLATION.path ||
      currentPath === this.TABS.PREVIEW.path ||
      currentPath === this.TABS.STATS.path ||
      currentPath === this.TABS.IMPROVEMENTS.path ||
      currentPath === this.TABS.SETTINGS.path ||
      currentPath === this.TABS.HISTORY.path ||
      currentPath === this.TABS.FEEDBACK.path);
  }

  getCurrentStateFromLocationPath(): string | null {
    return this._getCurrentStateFromLocationPath();
  }

  navigateToMainTab(stateName: string | null): void {
    this._savePendingChanges();
    let oldState = decodeURI(
      this._getCurrentStateFromLocationPath());

    if (oldState === ('/' + stateName)) {
      return;
    }

    if (this._activeTabName === this.TABS.MAIN.name) {
      $('.oppia-editor-cards-container').fadeOut(() => {
        this._actuallyNavigate(this.SLUG_GUI, stateName);
        // We need to use $apply to update all our bindings. However we
        // can't directly use $apply, as there is already another $apply in
        // progress, the one which angular itself has called at the start.
        // So we use $applyAsync to ensure that this $apply is called just
        // after the previous $apply is finished executing. Refer to this
        // link for more information -
        // http://blog.theodybrothers.com/2015/08/getting-inside-angular-scopeapplyasync.html

        setTimeout(() => {
          $('.oppia-editor-cards-container').fadeIn();
        }, 150);
      });
    } else {
      this._actuallyNavigate(this.SLUG_GUI, stateName);
    }
  }

  navigateToTranslationTab(stateName: string = null): void {
    this._savePendingChanges();
    this.stateEditorService.setActiveStateName(stateName);
    this._actuallyNavigate(this.SLUG_TRANSLATION, stateName);
  }

  navigateToPreviewTab(): void {
    if (this._activeTabName !== this.TABS.PREVIEW.name) {
      this._savePendingChanges();
      setTimeout(() => {
        this._actuallyNavigate(this.SLUG_PREVIEW, null);
      }, this.PREVIEW_TAB_WAIT_TIME_MSEC);
    }
  }

  navigateToStatsTab(): void {
    this._savePendingChanges();
    this._changeTab(this.TABS.STATS.path);
  }

  navigateToImprovementsTab(): void {
    this._savePendingChanges();
    this._changeTab(this.TABS.IMPROVEMENTS.path);
  }

  navigateToSettingsTab(): void {
    this._savePendingChanges();
    this._changeTab(this.TABS.SETTINGS.path);
  }

  navigateToHistoryTab(): void {
    this._savePendingChanges();
    this._changeTab(this.TABS.HISTORY.path);
  }

  navigateToFeedbackTab(): void {
    this._savePendingChanges();
    this._changeTab(this.TABS.FEEDBACK.path);
  }

  get onCenterGraph(): EventEmitter<void> {
    return this.centerGraphEventEmitter;
  }

  get onRefreshSettingsTab(): EventEmitter<void> {
    return this.refreshSettingsTabEventEmitter;
  }

  get onRefreshStatisticsTab(): EventEmitter<void> {
    return this.refreshStatisticsTabEventEmitter;
  }

  get onRefreshTranslationTab(): EventEmitter<void> {
    return this.refreshTranslationTabEventEmitter;
  }

  get onRefreshVersionHistory(): EventEmitter<void | {forceRefresh: boolean}> {
    return this.refreshVersionHistoryEventEmitter;
  }
}

angular.module('oppia').factory('RouterService',
  downgradeInjectable(RouterService));
