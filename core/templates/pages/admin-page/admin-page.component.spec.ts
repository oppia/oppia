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
 * @fileoverview UnitTests for Admin Page component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ChangeDetectorRef, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WindowRef} from 'services/contextual/window-ref.service';
import {AdminPageComponent} from './admin-page.component';
import {AdminRouterService} from './services/admin-router.service';

class MockWindowRef {
  nativeWindow = {
    confirm() {
      return true;
    },
    location: {
      hostname: 'hostname',
      href: 'href',
      pathname: 'pathname',
      search: 'search',
      hash: 'hash',
    },
    open() {
      return;
    },
    onhashchange() {
      return;
    },
  };
}

describe('Admin Page component ', () => {
  let component: AdminPageComponent;
  let fixture: ComponentFixture<AdminPageComponent>;

  let adminRouterService: AdminRouterService;
  let mockWindowRef: MockWindowRef;

  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [AdminPageComponent],
      providers: [
        AdminRouterService,
        ChangeDetectorRef,
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPageComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    adminRouterService = TestBed.inject(AdminRouterService);

    spyOn(adminRouterService, 'showTab').and.callThrough();
  });

  it('should check whether the admin activities tab is open', () => {
    // Setting admin activities tab to be open.
    spyOn(adminRouterService, 'isActivitiesTabOpen').and.returnValue(true);

    let result = component.isActivitiesTabOpen();

    expect(result).toBe(true);
  });

  it('should check whether the admin platform params tab is open', () => {
    // Setting admin platform params tab to be open.
    spyOn(adminRouterService, 'isPlatformParamsTabOpen').and.returnValue(true);

    let result = component.isPlatformParamsTabOpen();

    expect(result).toBe(true);
  });

  it('should check whether the admin roles tab is open', () => {
    // Setting admin roles tab to be open.
    spyOn(adminRouterService, 'isRolesTabOpen').and.returnValue(true);

    let result = component.isRolesTabOpen();

    expect(result).toBe(true);
  });

  it('should check whether the admin misc tab is open', () => {
    // Setting admin misc tab to be open.
    spyOn(adminRouterService, 'isMiscTabOpen').and.returnValue(true);

    let result = component.isMiscTabOpen();

    expect(result).toBe(true);
  });

  it("should set status message when calling 'setStatusMessage'", () => {
    expect(component.statusMessage).toBe('');

    component.ngOnInit();
    mockWindowRef.nativeWindow.onhashchange();
    component.setStatusMessage('message');

    expect(component.statusMessage).toBe('message');
  });
});
