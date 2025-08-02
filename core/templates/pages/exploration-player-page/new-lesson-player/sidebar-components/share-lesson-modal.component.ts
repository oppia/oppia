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
 * @fileoverview Component for share lesson modal in the new lesson player.
 */

import {Component} from '@angular/core';
import './share-lesson-modal.component.css';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'oppia-share-lesson-modal',
  templateUrl: './share-lesson-modal.component.html',
  styleUrls: ['./share-lesson-modal.component.css'],
})
export class ShareLessonModalComponent {
  explorationTitle!: string;
  constructor(private ngbActiveModal: NgbActiveModal) {}

  closeModal(): void {
    this.ngbActiveModal.dismiss('cancel');
  }
}
