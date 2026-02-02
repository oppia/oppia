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
 * @fileoverview Unit tests for error page.
 */
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {TestBed, ComponentFixture, fakeAsync, tick} from '@angular/core/testing';
import {Router} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';

import {ErrorPageComponent} from './error-page.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UserService} from 'services/user.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UserInfo} from 'domain/user/user-info.model';

describe('ErrorPageComponent', () => {
  let component: ErrorPageComponent;
  let fixture: ComponentFixture<ErrorPageComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;
  let windowRef: WindowRef;

  beforeEach(() => {
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getUserInfoAsync',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', [
      'getCurrentNavigation',
      'navigate',
    ]);

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [ErrorPageComponent],
      providers: [
        UrlInterpolationService,
        {provide: UserService, useValue: userServiceSpy},
        {provide: Router, useValue: routerSpy},
        WindowRef,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorPageComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    windowRef = TestBed.inject(WindowRef);

    // Default setup.
    router.getCurrentNavigation.and.returnValue(null);
  });

  it('should check if status code is a number', () => {
    component.statusCode = '404';
    expect(component.getStatusCode()).toBe(404);
    expect(component.getStatusCode()).toBeInstanceOf(Number);
  });

  it('should get the static image url', () => {
    component.statusCode = '404';
    expect(component.getStaticImageUrl('/general/oops_mint.webp')).toBe(
      '/assets/images/general/oops_mint.webp'
    );
  });

  it('should detect logged in user for 401 error', fakeAsync(() => {
    component.statusCode = '401';
    const mockUserInfo = UserInfo.createFromBackendDict({
      roles: ['USER_ROLE'],
      is_moderator: false,
      is_curriculum_admin: false,
      is_topic_manager: false,
      is_super_admin: false,
      can_create_collections: false,
      preferred_site_language_code: 'en',
      username: 'testuser',
      email: 'test@example.com',
      user_is_logged_in: true,
    });
    userService.getUserInfoAsync.and.returnValue(
      Promise.resolve(mockUserInfo)
    );

    component.ngOnInit();
    tick();

    expect(component.isUserLoggedIn).toBeTrue();
  }));

  it('should detect not logged in user for 401 error', fakeAsync(() => {
    component.statusCode = '401';
    const mockUserInfo = UserInfo.createDefault();
    userService.getUserInfoAsync.and.returnValue(
      Promise.resolve(mockUserInfo)
    );

    component.ngOnInit();
    tick();

    expect(component.isUserLoggedIn).toBeFalse();
  }));

  it('should handle error when checking login status', fakeAsync(() => {
    component.statusCode = '401';
    userService.getUserInfoAsync.and.returnValue(
      Promise.reject(new Error('Network error'))
    );

    component.ngOnInit();
    tick();

    expect(component.isUserLoggedIn).toBeFalse();
  }));

  it('should extract custom error message from navigation state', fakeAsync(() => {
    component.statusCode = '401';
    const mockNavigation = {
      extras: {
        state: {
          errorMessage: 'You must be an admin to access this page.',
        },
      },
    };
    router.getCurrentNavigation.and.returnValue(
      mockNavigation as unknown as ReturnType<Router['getCurrentNavigation']>
    );
    const mockUserInfo = UserInfo.createFromBackendDict({
      roles: ['USER_ROLE'],
      is_moderator: false,
      is_curriculum_admin: false,
      is_topic_manager: false,
      is_super_admin: false,
      can_create_collections: false,
      preferred_site_language_code: 'en',
      username: 'testuser',
      email: 'test@example.com',
      user_is_logged_in: true,
    });
    userService.getUserInfoAsync.and.returnValue(
      Promise.resolve(mockUserInfo)
    );

    component.ngOnInit();
    tick();

    expect(component.customErrorMessage).toBe(
      'You must be an admin to access this page.'
    );
  }));

  it('should redirect to login page with return url', () => {
    component.statusCode = '401';
    spyOnProperty(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      '/admin'
    );

    component.redirectToLogin();

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: {return_url: '/admin'},
    });
  });

  it('should navigate to home page', () => {
    component.statusCode = '401';

    component.navigateToHome();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should not check login status for non-401 errors', fakeAsync(() => {
    component.statusCode = '404';

    component.ngOnInit();
    tick();

    expect(userService.getUserInfoAsync).not.toHaveBeenCalled();
  }));
});
