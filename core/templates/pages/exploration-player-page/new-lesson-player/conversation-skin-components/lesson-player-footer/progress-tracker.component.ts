// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for an input/response pair in the learner view.
 */

import {Component, Input, OnInit} from '@angular/core';
import './progress-tracker.component.css';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {SaveProgressModalComponent} from './save-progress-modal.component';
import {ProgressUrlService} from 'pages/exploration-player-page/services/progress-url.service';
import {UrlService} from 'services/contextual/url.service';

@Component({
  selector: 'oppia-progress-tracker',
  templateUrl: './progress-tracker.component.html',
  styleUrls: ['./progress-tracker.component.css'],
})
export class ProgressTrackerComponent implements OnInit {
  @Input() userIsLoggedIn: boolean = false;
  loggedOutProgressUniqueUrlId!: string | null;
  loggedOutProgressUniqueUrl!: string;

  constructor(
    private ngbModal: NgbModal,
    private progressUrlService: ProgressUrlService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    const urlParams = this.urlService.getUrlParams();
    this.loggedOutProgressUniqueUrlId =
      urlParams.pid || this.progressUrlService.getUniqueProgressUrlId();
    if (this.loggedOutProgressUniqueUrlId) {
      this.loggedOutProgressUniqueUrl =
        this.urlService.getOrigin() +
        '/progress/' +
        this.loggedOutProgressUniqueUrlId;
    }
  }

  showSaveProgressModal(): void {
    const modalInstance: NgbModalRef = this.ngbModal.open(
      SaveProgressModalComponent,
      {
        backdrop: 'static',
      }
    );
    modalInstance.componentInstance.loggedOutProgressUniqueUrlId =
      this.loggedOutProgressUniqueUrlId;
    modalInstance.componentInstance.loggedOutProgressUniqueUrl =
      this.loggedOutProgressUniqueUrl;
  }

  async saveLoggedOutProgress(): Promise<void> {
    console.log(this.loggedOutProgressUniqueUrlId);
    if (!this.loggedOutProgressUniqueUrlId) {
      this.progressUrlService.setUniqueProgressUrlId().then(() => {
        this.loggedOutProgressUniqueUrlId =
          this.progressUrlService.getUniqueProgressUrlId();
        this.loggedOutProgressUniqueUrl =
          this.urlService.getOrigin() +
          '/progress/' +
          this.loggedOutProgressUniqueUrlId;
        this.showSaveProgressModal();
      });
    } else {
      this.showSaveProgressModal();
    }
  }
}
