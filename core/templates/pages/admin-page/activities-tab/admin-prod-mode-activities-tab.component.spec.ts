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
 * @fileoverview Unit tests for oppiaAdminProdModeActivitiesTabComponent.
 */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { oppiaAdminProdModeActivitiesTabComponent } from
 './admin-prod-mode-activities-tab.component';

describe('oppiaAdminProdModeActivitiesTabComponent', () => {
  let component: oppiaAdminProdModeActivitiesTabComponent;
  let fixture: ComponentFixture<oppiaAdminProdModeActivitiesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ oppiaAdminProdModeActivitiesTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(oppiaAdminProdModeActivitiesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
