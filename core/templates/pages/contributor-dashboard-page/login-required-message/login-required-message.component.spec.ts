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
 * @fileoverview Unit tests for loginRequiredMessage.
 */

import { ComponentFixture, flushMicrotasks, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { LoginRequiredMessageComponent } from 'pages/contributor-dashboard-page/login-required-message/login-required-message.component';
import { UserService } from 'services/user.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';


describe('Login required message component', () => {
  let component: LoginRequiredMessageComponent;
  let fixture: ComponentFixture<LoginRequiredMessageComponent>;
  let userService: UserService;
  let windowRef: WindowRef;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [LoginRequiredMessageComponent]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(
      LoginRequiredMessageComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    windowRef = TestBed.inject(WindowRef);
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        reload: ()=>{},
        href: 'starting-url'
      },
      gtag: () => {}
    } as unknown as Window);
    component.ngOnInit();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should initialize controller properties after its initialization',
    () => {
      expect(component.OPPIA_AVATAR_IMAGE_URL).toBe(
        '/assets/images/avatar/oppia_avatar_100px.svg');
    });

  it('should go to login url when login button is clicked', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.resolveTo('login-url');

    component.onLoginButtonClicked();
    flushMicrotasks();
    tick(151);

    expect(windowRef.nativeWindow.location.href).toBe('login-url');
  }));

  it('should refresh page if login url is not provided when login button is' +
    ' clicked', fakeAsync(() => {
    const reloadSpy = spyOn(windowRef.nativeWindow.location, 'reload');
    spyOn(userService, 'getLoginUrlAsync').and.resolveTo('');
    component.onLoginButtonClicked();
    flushMicrotasks();

    expect(reloadSpy).toHaveBeenCalled();
  }));
});
