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
 * @fileoverview Tests for Admin misc tab component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';

import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminTaskManagerService } from '../services/admin-task-manager.service';
import { AdminMiscTabComponent } from './admin-misc-tab.component';

fdescribe('Admin misc tab component ', () => {
  let component: AdminMiscTabComponent;
  let fixture: ComponentFixture<AdminMiscTabComponent>;

  let adminBackendApiService: AdminBackendApiService;
  let adminTaskManagerService: AdminTaskManagerService;
  let windowRef: WindowRef;

  let statusMessageSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [AdminMiscTabComponent],
      providers: [
        AdminBackendApiService,
        AdminTaskManagerService,
        WindowRef
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMiscTabComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    adminBackendApiService = TestBed.inject(AdminBackendApiService);
    adminTaskManagerService = TestBed.inject(AdminTaskManagerService);
    windowRef = TestBed.inject(WindowRef);

    statusMessageSpy = spyOn(component.setStatusMessage, 'emit')
      .and.returnValue(null);
  });

  it('should initialize', () => {
    expect(component).toBeDefined();
  });
});