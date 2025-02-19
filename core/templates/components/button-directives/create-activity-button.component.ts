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
 * @fileoverview Component for the Create Exploration/Collection button.
 */

import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ExplorationCreationService} from 'components/entity-creation-services/exploration-creation.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UserService} from 'services/user.service';
import {CreateActivityModalComponent} from 'pages/creator-dashboard-page/modal-templates/create-activity-modal.component';
import {AppConstants} from 'app.constants';

@Component({
  selector: 'oppia-create-activity-button',
  templateUrl: './create-activity-button.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class CreateActivityButtonComponent implements OnInit {
  creationInProgress: boolean = false;
  canCreateCollections: boolean = false;
  allowYamlFileUpload: boolean = false;
  userIsLoggedIn: boolean = false;

  constructor(
    private userService: UserService,
    private siteAnalyticsService: SiteAnalyticsService,
    private urlService: UrlService,
    private explorationCreationService: ExplorationCreationService,
    private ngbModal: NgbModal,
    private windowRef: WindowRef
  ) {}

  onRedirectToLogin(destinationUrl: string): boolean {
    this.siteAnalyticsService.registerStartLoginEvent('createActivityButton');
    setTimeout(() => {
      this.windowRef.nativeWindow.location.href = destinationUrl;
    }, 150);
    return false;
  }

  createNewExploration(): void {
    this.explorationCreationService.createNewExploration();
  }

  checkTabletView(): boolean {
    return this.windowRef.nativeWindow.innerWidth < 768;
  }

  initCreationProcess(): void {
    // Without this, the modal keeps reopening when the window is
    // resized.
    if (this.creationInProgress) {
      return;
    }

    this.creationInProgress = true;

    if (!this.canCreateCollections) {
      this.explorationCreationService.createNewExploration();
    } else if (this.urlService.getPathname() !== '/creator-dashboard') {
      this.windowRef.nativeWindow.location.replace(
        '/creator-dashboard?mode=create'
      );
    } else {
      this.ngbModal
        .open(CreateActivityModalComponent, {backdrop: true})
        .result.then(
          () => {},
          () => {
            this.creationInProgress = false;
          }
        );
    }
  }

  showUploadExplorationModal(): void {
    this.explorationCreationService.showUploadExplorationModal();
  }

  ngOnInit(): void {
    this.creationInProgress = false;
    this.allowYamlFileUpload = AppConstants.ALLOW_YAML_FILE_UPLOAD;

    this.userService.getUserInfoAsync().then(userInfo => {
      this.canCreateCollections = userInfo.canCreateCollections();
      this.userIsLoggedIn = userInfo.isLoggedIn();

      // If the user clicked on a 'create' button to get to the dashboard,
      // open the create modal immediately (or redirect to the exploration
      // editor if the create modal does not need to be shown).
      if (this.urlService.getUrlParams().mode === 'create') {
        if (!this.canCreateCollections) {
          this.explorationCreationService.createNewExploration();
        } else {
          this.initCreationProcess();
        }
      }
    });
  }
}
