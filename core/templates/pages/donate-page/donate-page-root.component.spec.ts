// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the donate page root component.
 */

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppConstants } from 'app.constants';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { DonatePageRootComponent } from './donate-page-root.component';
import { InsertScriptService, KNOWN_SCRIPTS } from 'services/insert-script.service';
import { TranslateService } from '@ngx-translate/core';

describe('Donate Page Root', () => {
  let fixture: ComponentFixture<DonatePageRootComponent>;
  let component: DonatePageRootComponent;
  let insertScriptService: InsertScriptService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        DonatePageRootComponent,
        MockTranslatePipe,
      ],
      providers: [
        InsertScriptService,
        TranslateService,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(DonatePageRootComponent);
    component = fixture.componentInstance;
    insertScriptService = TestBed.inject(InsertScriptService);
  }));

  it('should be defined', () => {
    expect(component).toBeDefined();
    expect(component.title).toEqual(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.DONATE.TITLE);
    expect(component.meta).toEqual(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.DONATE.META);
  });

  it('should load the script on ngOnInit', () => {
    spyOn(insertScriptService, 'loadScript');
    component.ngOnInit();

    expect(insertScriptService.loadScript).toHaveBeenCalledOnceWith(
      KNOWN_SCRIPTS.DONORBOX);
  });
});
