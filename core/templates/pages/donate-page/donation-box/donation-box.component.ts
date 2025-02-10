// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Donation box component
 */

import {Component, OnInit} from '@angular/core';

import {
  InsertScriptService,
  KNOWN_SCRIPTS,
} from 'services/insert-script.service';

@Component({
  selector: 'donation-box',
  template: `
    <iframe
      src="https://donorbox.org/embed/oppia-annual-fundraising-campaign-2024"
      class="e2e-test-donate-page-iframe"
      name="donorbox"
      allow="payment"
      seamless="seamless"
      frameborder="0"
      scrolling="no"
      width="100%"
      title="donorbox"
    >
    </iframe>
  `,
})
export class DonationBoxComponent implements OnInit {
  constructor(private insertScriptService: InsertScriptService) {}

  ngOnInit(): void {
    this.insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX);
  }
}
