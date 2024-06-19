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
 * @fileoverview Common component for the modals.
 */
import {Component, Injectable} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal-component',
  templateUrl: './common-modal.component.html',
  styleUrls: ['./common-modal.component.css'],
})
@Injectable({
  providedIn: 'root',
})
export class CommonModalComponent {
  startResumemodalvisible: boolean;
  reviewModalVisibility: boolean;
  constructor(private activeModal: NgbActiveModal) {}
  ngOnInit(): void {}
  closeResumeModal(): void {
    this.startResumemodalvisible = false;
    this.activeModal.close();
  }
  resumeAction(): void {
    // Action performed by resume button.
  }

  startAction(): void {
    // Action performed by start button.
  }

  closeReviewModal(): void {
    this.reviewModalVisibility = false;
    this.activeModal.close();
  }

  reviewAction(): void {
    // Action performed by review button.
  }
}
