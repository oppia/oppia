// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LanguageBannerComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {LanguageBannerComponent} from './language-banner.component';
import {FormsModule} from '@angular/forms';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {CookieService, CookieModule} from 'ngx-cookie';
import {AppConstants} from 'app.constants';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {UserService} from 'services/user.service';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

class MockUserService {
  getUserInfoAsync() {
    return Promise.resolve({
      isLoggedIn: () => false,
    });
  }
}

class MockRouter {
  url: string = '/about';
}

describe('LanguageBannerComponent', () => {
  let component: LanguageBannerComponent;
  let fixture: ComponentFixture<LanguageBannerComponent>;
  let cookieService: CookieService;
  let debugElement: DebugElement;
  let userService: MockUserService;
  let router: MockRouter;

  let originalNavigatorLanguage = navigator.language;

  let COOKIE_NAME_COOKIES_ACKNOWLEDGED = 'OPPIA_COOKIES_ACKNOWLEDGED';
  let NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER =
    'NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        CookieModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      declarations: [LanguageBannerComponent, MockTranslatePipe],
      providers: [
        {provide: Router, useClass: MockRouter},
        {provide: UserService, useClass: MockUserService},
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LanguageBannerComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    fixture.detectChanges();

    userService = TestBed.inject(UserService);
    cookieService = TestBed.inject(CookieService);
    router = TestBed.inject(Router);

    cookieService.put(
      COOKIE_NAME_COOKIES_ACKNOWLEDGED,
      String(AppConstants.COOKIE_POLICY_LAST_UPDATED_MSECS + 100000)
    );
    Object.defineProperty(navigator, 'language', {
      value: 'fr-FR',
      configurable: true,
    });
  });

  afterEach(() => {
    cookieService.removeAll();
  });

  afterAll(() => {
    // Restore original navigator language.
    Object.defineProperty(navigator, 'language', {
      value: originalNavigatorLanguage,
      configurable: true,
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display banner if user is on the login page', fakeAsync(() => {
    router.url = '/login';

    component.ngOnInit();
    tick();

    expect(component.bannerIsVisible).toBeFalse();
  }));

  it('should not display banner if user is on the signup page', fakeAsync(() => {
    router.url = '/signup';

    component.ngOnInit();
    tick();

    expect(component.bannerIsVisible).toBeFalse();
  }));

  it('should not display banner if user is logged in', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve({isLoggedIn: () => true})
    );

    component.ngOnInit();
    tick();

    expect(component.bannerIsVisible).toBeFalse();
  }));

  it("should not display banner if the user's browser language is english", fakeAsync(() => {
    Object.defineProperty(navigator, 'language', {
      value: 'en-US',
      configurable: true,
    });

    component.ngOnInit();
    tick();

    expect(component.bannerIsVisible).toBeFalse();
  }));

  it('should not display banner if user has not accepted cookies', fakeAsync(() => {
    cookieService.remove(COOKIE_NAME_COOKIES_ACKNOWLEDGED);

    component.ngOnInit();
    tick();

    expect(component.bannerIsVisible).toBeFalse();
  }));

  it("should be dislayed if cookies are accepted, browser's language is not english and user is not on the sign in page", fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(component.bannerIsVisible).toBeTrue();
  }));

  it('should decrement the number of times remaining to show the banner', fakeAsync(() => {
    expect(
      cookieService.get(NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER)
    ).toBeUndefined();

    component.ngOnInit();
    tick();

    expect(cookieService.get(NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER)).toBe(
      '4'
    );

    component.ngOnInit();
    tick();
    component.ngOnInit();
    tick();

    expect(cookieService.get(NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER)).toBe(
      '2'
    );

    component.ngOnInit();
    tick();
    component.ngOnInit();
    tick();

    expect(cookieService.get(NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER)).toBe(
      '0'
    );
  }));

  it('should not display banner when component initializes the sixth time', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(component.bannerIsVisible).toBeTrue();

    component.ngOnInit();
    tick();
    component.ngOnInit();
    tick();
    component.ngOnInit();
    tick();
    component.ngOnInit();
    tick();

    expect(component.bannerIsVisible).toBeTrue();

    component.ngOnInit();
    tick();

    expect(component.bannerIsVisible).toBeFalse();
  }));

  it('should not display banner when the banner button is clicked', () => {
    component.bannerIsVisible = true;
    fixture.detectChanges();

    const bannerButton = debugElement.query(
      By.css('.banner-button')
    ).nativeElement;
    bannerButton.click();

    expect(component.bannerIsVisible).toBeFalse();
  });

  it('should set the NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER cookie to 0 when clicked', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(cookieService.get(NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER)).toBe(
      '4'
    );
    fixture.detectChanges();

    const bannerButton = debugElement.query(
      By.css('.banner-button')
    ).nativeElement;
    bannerButton.click();

    expect(cookieService.get(NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER)).toBe(
      '0'
    );
  }));

  it('should return static image URL', () => {
    const imageUrl = component.getStaticImageUrl('/x.svg');

    expect(imageUrl).toBe('/assets/images/x.svg');
  });
});
