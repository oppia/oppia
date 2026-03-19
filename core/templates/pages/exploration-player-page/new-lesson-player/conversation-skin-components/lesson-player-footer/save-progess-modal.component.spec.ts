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
 * @fileoverview Unit tests for SaveProgressModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {SaveProgressModalComponent} from './save-progress-modal.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {UserService} from 'services/user.service';
import {LocalStorageService} from 'services/local-storage.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/learn/math',
      href: '',
      reload: () => {},
      toString: () => {
        return 'http://localhost:8181/?lang=es';
      },
    },
    localStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {},
    },
    gtag: () => {},
    history: {
      pushState(data: object, title: string, url?: string | null) {},
    },
    document: {
      body: {
        style: {
          overflowY: 'auto',
        },
      },
    },
  };
}

describe('SaveProgressModalComponent', () => {
  let fixture: ComponentFixture<SaveProgressModalComponent>;
  let componentInstance: SaveProgressModalComponent;
  let userService: UserService;
  let mockWindowRef: MockWindowRef;
  let localStorageService: LocalStorageService;
  let ngbActiveModal: NgbActiveModal;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SaveProgressModalComponent, MockTranslatePipe],
      providers: [
        UserService,
        LocalStorageService,
        I18nLanguageCodeService,
        {
          provide: NgbActiveModal,
          useValue: {
            dismiss: jasmine.createSpy('dismiss'),
          },
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    fixture = TestBed.createComponent(SaveProgressModalComponent);
    componentInstance = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    localStorageService = TestBed.inject(LocalStorageService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    mockWindowRef = TestBed.inject(WindowRef) as MockWindowRef;
  });

  it('should create', () => {
    expect(componentInstance).toBeTruthy();
  });

  it('should return correct RTL status from i18nLanguageCodeService', () => {
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );

    const result = componentInstance.isLanguageRTL();

    expect(i18nLanguageCodeService.isCurrentLanguageRTL).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should return false when language is not RTL', () => {
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      false
    );

    const result = componentInstance.isLanguageRTL();

    expect(i18nLanguageCodeService.isCurrentLanguageRTL).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('should store unique progress URL ID and redirect when login button is clicked', fakeAsync(() => {
    const loginUrl = 'https://oppia.org/login';
    const uniqueUrlId = 'abcdef';

    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      Promise.resolve(loginUrl)
    );
    spyOn(localStorageService, 'updateUniqueProgressIdOfLoggedOutLearner');

    componentInstance.loggedOutProgressUniqueUrlId = uniqueUrlId;

    expect(mockWindowRef.nativeWindow.location.href).toEqual('');

    componentInstance.onLoginButtonClicked();
    tick();

    expect(userService.getLoginUrlAsync).toHaveBeenCalled();
    expect(
      localStorageService.updateUniqueProgressIdOfLoggedOutLearner
    ).toHaveBeenCalledWith(uniqueUrlId);
    expect(mockWindowRef.nativeWindow.location.href).toEqual(loginUrl);
  }));

  it('should close modal when closeModal is called', () => {
    componentInstance.closeModal();

    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
  });

  it('should set input properties correctly', () => {
    const testUrlId = 'test-unique-id';
    const testUrl = 'https://test-url.com';

    componentInstance.loggedOutProgressUniqueUrlId = testUrlId;
    componentInstance.loggedOutProgressUniqueUrl = testUrl;

    expect(componentInstance.loggedOutProgressUniqueUrlId).toBe(testUrlId);
    expect(componentInstance.loggedOutProgressUniqueUrl).toBe(testUrl);
  });

  it('should handle null loggedOutProgressUniqueUrlId input', () => {
    componentInstance.loggedOutProgressUniqueUrlId = null;

    expect(componentInstance.loggedOutProgressUniqueUrlId).toBeNull();
  });
});
