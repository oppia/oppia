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
 * @fileoverview Invalid modal component test: two ngbModal.open() calls both
 * missing backdrop: 'static', but two unrelated backdrop: 'static' strings
 * elsewhere in the file. The old file-wide count approach would give a false
 * pass; the per-call extraction approach must correctly flag this.
 */

import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'mock-component',
  template: ''
})
export class MockComponent {
  constructor(
    private ngbModal: NgbModal,
    private matBottomSheet: MatBottomSheet
  ) {}

  openFirst(): void {
    this.ngbModal.open(SomeModalComponent, { backdrop: true });
  }

  openSecond(): void {
    this.ngbModal.open(AnotherModalComponent, { backdrop: true });
  }

  // These are unrelated config objects that happen to contain
  // backdrop: 'static' — they must not satisfy the linter check.
  dummyConfig1 = { backdrop: 'static' };
  dummyConfig2 = { backdrop: 'static' };
}
