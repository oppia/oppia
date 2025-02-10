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
 * @fileoverview Controller for upload activity modal.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AlertsService} from 'services/alerts.service';

interface ExplorationObj {
  yamlFile: File | null;
}

@Component({
  selector: 'upload-activity-modal',
  templateUrl: './upload-activity-modal.component.html',
})
export class UploadActivityModalComponent {
  constructor(
    private alertsService: AlertsService,
    private activeModal: NgbActiveModal
  ) {}

  save(): void {
    let returnObj: ExplorationObj = {
      yamlFile: null,
    };
    let label = document.getElementById('newFileInput') as HTMLInputElement;
    if (label === null) {
      throw new Error('No label found for uploading files.');
    }
    if (label.files === null) {
      throw new Error('No files found.');
    }
    let file = label.files[0];
    if (!file || !file.size) {
      this.alertsService.addWarning('Empty file detected.');
      return;
    }
    returnObj.yamlFile = file;
    this.activeModal.close(returnObj);
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
