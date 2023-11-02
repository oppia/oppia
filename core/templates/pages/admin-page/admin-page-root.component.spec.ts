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
 * @fileoverview Unit tests for Admin Page Root component.
 */

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  flush,
} from '@angular/core/testing';

import { UserService } from 'services/user.service';
import { PageHeadService } from 'services/page-head.service';
import { AdminPageRootComponent } from './admin-page-root.component';
import { UserInfo } from 'domain/user/user-info.model';
import { BaseRootComponent } from 'pages/base-root.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('AdminPageRootComponent', () => {
  let fixture: ComponentFixture<AdminPageRootComponent>;
  let component: AdminPageRootComponent;
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      declarations: [AdminPageRootComponent],
      providers: [PageHeadService, UserService, TranslateService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    userService = TestBed.inject(UserService);
    fixture = TestBed.createComponent(AdminPageRootComponent);
    component = fixture.componentInstance;
  });

  it('should call parent ngOnInit and show ' +
  'error page if not super admin', fakeAsync(() => {
    expect(component.isSuperAdmin).toBeFalse();
    expect(component.loading).toBeTrue();

    const parentNgOnInitSpy = spyOn(BaseRootComponent.prototype, 'ngOnInit');
    const userInfo = UserInfo.createDefault();
    const getUserInfoAsyncSpy = spyOn(
      userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo)
    );

    component.ngOnInit();
    flush();

    expect(getUserInfoAsyncSpy).toHaveBeenCalledTimes(1);
    expect(parentNgOnInitSpy).toHaveBeenCalledTimes(1);
    expect(component.isSuperAdmin).toEqual(false);
    expect(component.loading).toBeFalse();

    fixture.detectChanges();

    const nativeElement = fixture.debugElement.nativeElement;
    expect(nativeElement.querySelector('oppia-admin-page')).toBeNull();
    expect(nativeElement.querySelector('oppia-error-page-root')).toBeTruthy();
  }));

  it('should call parent ngOnInit and show ' +
  'admin page if super admin', fakeAsync(() => {
    expect(component.isSuperAdmin).toBeFalse();
    expect(component.loading).toBeTrue();

    const parentNgOnInitSpy = spyOn(BaseRootComponent.prototype, 'ngOnInit');
    const userInfo = new UserInfo(
      [], false, false, true, false, false, '', '', '', true);
    const getUserInfoAsyncSpy = spyOn(
      userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo)
    );

    component.ngOnInit();
    flush();

    expect(getUserInfoAsyncSpy).toHaveBeenCalledTimes(1);
    expect(parentNgOnInitSpy).toHaveBeenCalledTimes(1);
    expect(component.isSuperAdmin).toEqual(true);
    expect(component.loading).toBeFalse();

    fixture.detectChanges();

    const nativeElement = fixture.debugElement.nativeElement;
    expect(nativeElement.querySelector('oppia-admin-page')).toBeTruthy();
    expect(nativeElement.querySelector('oppia-error-page-root')).toBeNull();
  }));
});
