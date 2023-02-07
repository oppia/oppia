// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for showing Editor Navbar breadcrumb
 * in editor navbar.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Subscription } from 'rxjs';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { ExplorationEditorPageConstants } from '../exploration-editor-page.constants';
import { ExplorationTitleService } from '../services/exploration-title.service';
import { RouterService } from '../services/router.service';

@Component({
  selector: 'oppia-editor-navbar-breadcrumb',
  templateUrl: './editor-navbar-breadcrumb.component.html'
})
export class EditorNavbarBreadcrumbComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  navbarTitle!: string;
  _TAB_NAMES_TO_HUMAN_READABLE_NAMES: object = {
    main: 'Edit',
    translation: 'Translation',
    preview: 'Preview',
    settings: 'Settings',
    stats: 'Statistics',
    improvements: 'Improvements',
    history: 'History',
    feedback: 'Feedback',
  };

  constructor(
    private explorationTitleService: ExplorationTitleService,
    private focusManagerService: FocusManagerService,
    private routerService: RouterService,
  ) {}

  editTitle(): void {
    this.routerService.navigateToSettingsTab();
    this.focusManagerService.setFocus(
      ExplorationEditorPageConstants.EXPLORATION_TITLE_INPUT_FOCUS_LABEL);
  }

  getCurrentTabName(): string {
    const that = this;
    type TabNamesToHumanReadableNamesKeys = (
      keyof typeof that._TAB_NAMES_TO_HUMAN_READABLE_NAMES);
    if (!this.routerService.getActiveTabName()) {
      return '';
    } else {
      return this._TAB_NAMES_TO_HUMAN_READABLE_NAMES[
        this.routerService.getActiveTabName() as
          TabNamesToHumanReadableNamesKeys
      ];
    }
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.explorationTitleService.onExplorationPropertyChanged.subscribe(
        (propertyName) => {
          const _MAX_TITLE_LENGTH = 20;
          this.navbarTitle = String(this.explorationTitleService.savedMemento);
          if (this.navbarTitle.length > _MAX_TITLE_LENGTH) {
            this.navbarTitle = (
              this.navbarTitle.substring(
                0, _MAX_TITLE_LENGTH - 3) + '...');
          }
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaEditorNavbarBreadcrumb',
  downgradeComponent({
    component: EditorNavbarBreadcrumbComponent
  }) as angular.IDirectiveFactory);
