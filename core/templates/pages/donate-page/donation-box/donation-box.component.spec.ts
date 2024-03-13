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
 * @fileoverview Tests for the donation box component
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {
  InsertScriptService,
  KNOWN_SCRIPTS,
} from 'services/insert-script.service';
import {DonationBoxComponent} from './donation-box.component';

describe('Donation box', () => {
  let component: DonationBoxComponent;
  let fixture: ComponentFixture<DonationBoxComponent>;
  let insertScriptService: InsertScriptService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DonationBoxComponent],
      providers: [InsertScriptService],
    }).compileComponents();
    fixture = TestBed.createComponent(DonationBoxComponent);
    component = fixture.componentInstance;
    insertScriptService = TestBed.inject(InsertScriptService);
  });

  it('should load the script on ngOnInit', () => {
    spyOn(insertScriptService, 'loadScript');
    component.ngOnInit();

    expect(insertScriptService.loadScript).toHaveBeenCalledOnceWith(
      KNOWN_SCRIPTS.DONORBOX
    );
  });
});
