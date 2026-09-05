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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {ExplorationEditorPageConstants} from '../exploration-editor-page.constants';
import {ExplorationTitleService} from '../services/exploration-title.service';
import {RouterService} from '../services/router.service';
import './editor-navbar-breadcrumb.component.css';

@Component({
  selector: 'oppia-editor-navbar-breadcrumb',
  templateUrl: './editor-navbar-breadcrumb.component.html',
  styleUrls: ['./editor-navbar-breadcrumb.component.css'],
})
export class EditorNavbarBreadcrumbComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  navbarTitle: string | null = null;

  constructor(
    private explorationTitleService: ExplorationTitleService,
    private focusManagerService: FocusManagerService,
    private routerService: RouterService
  ) {}

  editTitle(): void {
    this.routerService.navigateToSettingsTab();
    this.focusManagerService.setFocus(
      ExplorationEditorPageConstants.EXPLORATION_TITLE_INPUT_FOCUS_LABEL
    );
  }

  ngOnInit(): void {
    this.setNavbarTitle();
    this.directiveSubscriptions.add(
      this.explorationTitleService.onExplorationPropertyChanged.subscribe(
        () => {
          this.setNavbarTitle();
        }
      )
    );
  }

  setNavbarTitle(): void {
    if (
      this.explorationTitleService.savedMemento === undefined ||
      this.explorationTitleService.savedMemento === null
    ) {
      this.navbarTitle = null;
      return;
    }
    this.navbarTitle = String(this.explorationTitleService.savedMemento);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
