// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for embed exploration modal.
 */

import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SiteAnalyticsService } from 'services/site-analytics.service';

@Component({
  selector: 'exploration-embed-button-modal',
  templateUrl: './exploration-embed-button-modal.component.html',
  styleUrls: []
})
export class ExplorationEmbedButtonModalComponent implements OnInit {
  @Input() explorationId: string;
  @Input() serverName: string;

  constructor(
    private activeModal: NgbActiveModal,
    private siteAnalyticsService: SiteAnalyticsService) {}

  ngOnInit(): void {
    this.siteAnalyticsService.registerOpenEmbedInfoEvent(this.explorationId);
  }

  cancel(): void {
    this.activeModal.dismiss();
  }

  selectText(event: MouseEvent): void {
    const codeDiv = event.currentTarget;
    const range = document.createRange();
    range.setStartBefore((<HTMLDivElement>codeDiv).firstChild);
    range.setEndAfter((<HTMLDivElement>codeDiv).lastChild);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
