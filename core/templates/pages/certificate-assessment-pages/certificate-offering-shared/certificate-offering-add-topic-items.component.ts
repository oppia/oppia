// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Topic selection step for certificate offering flows.
 */

import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'oppia-certificate-offering-add-topic-items',
  templateUrl: './certificate-offering-add-topic-items.component.html',
})
export class CertificateOfferingAddTopicItemsComponent {
  @Input() selectedTopicIds: string[] = [];
  @Output() selectedTopicIdsChange = new EventEmitter<string[]>();
  @Output() navigateToReviewAndAvailabilitySection = new EventEmitter<void>();
  @Output() navigateToDetailsSection = new EventEmitter<void>();

  onNextClicked(): void {
    this.selectedTopicIdsChange.emit(this.selectedTopicIds);
    this.navigateToReviewAndAvailabilitySection.emit();
  }

  onBackClicked(): void {
    this.selectedTopicIdsChange.emit(this.selectedTopicIds);
    this.navigateToDetailsSection.emit();
  }
}
