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

import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlService } from 'services/contextual/url.service.ts';
import { ContextService } from 'services/context.service.ts';

@Component({
  selector: 'keyboard-shortcut-help-modal',
  templateUrl: './keyboard-shortcut-help-modal.component.html',
  styleUrls: []
})
export class KeyboardShortcutHelpModalComponent implements OnInit {
  constructor(
    private activeModal: NgbActiveModal,
    private urlService: UrlService,
    private contextService: ContextService) {}

    KEYBOARD_SHORTCUTS = {};

  ngOnInit(): void {
    if (this.urlService.getPathname() === '/community-library' {
      this.KEYBOARD_SHORTCUTS = {
        '?': 'Show this help dialog',
         '/': 'Search',
         s: 'Select skip to main content button',
         c: 'Select exploration category'

      };
    } else if (this.contextService.isInExplorationPlayerPage()) {
      this.KEYBOARD_SHORTCUTS = {
        '?': 'Show this help dialog',
        s: 'Select skip to main content button',
        j: 'Select the continue button',
        k: 'Select the back button',
      };
    }
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
