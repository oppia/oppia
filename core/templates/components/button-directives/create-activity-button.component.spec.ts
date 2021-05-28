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

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ExplorationCreationService } from 'components/entity-creation-services/exploration-creation.service';
import { TranslatePipe } from 'filters/translate.pipe';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserService } from 'services/user.service';
import { CreateActivityButtonComponent } from './create-activity-button.component';

/**
 * @fileoverview Unit tests for CreateActivityButtonComponent.
 */

class MockWindowRef {
  _window = {
    location: {
      _hash: '',
      _hashChange: null,
      _href: '',
      get hash() {
        return this._hash;
      },
      set hash(val) {
        this._hash = val;
        if (this._hashChange === null) {
          return;
        }
        this._hashChange();
      },
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
      },
      reload: (val) => val,
      replace: (val) => {}
    },
    get onhashchange() {
      return this.location._hashChange;
    },

    set onhashchange(val) {
      this.location._hashChange = val;
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

interface UrlParamsType {
  [param: string]: string
}

class MockUrlService {
  getPathname(): string {
    return '/creator-dashboard';
  }

  getUrlParams(): UrlParamsType {
    return {
      mode: 'create'
    };
  }
}

describe('CreateActivityButtonComponent', () => {
  let component: CreateActivityButtonComponent;
  let fixture: ComponentFixture<CreateActivityButtonComponent>;
  let userService: UserService;
  let urlService: MockUrlService;
  let explorationCreationService: ExplorationCreationService;
  let windowRef: MockWindowRef;
  let ngbModal: NgbModal;

  beforeEach(waitForAsync(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [
        CreateActivityButtonComponent,
        TranslatePipe
      ],
      providers: [
        UserService,
        {
          provide: UrlService,
          useClass: MockUrlService
        },
        {
          provide: WindowRef,
          useValue: windowRef
        },
        ExplorationCreationService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateActivityButtonComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    urlService = TestBed.inject(UrlService);
    explorationCreationService = TestBed.inject(ExplorationCreationService);
    ngbModal = TestBed.inject(NgbModal);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize and call initCreationProcess()', fakeAsync(() => {
    const userServiceSpy = spyOn(userService, 'getUserInfoAsync')
      // This throws "Argument of type 'Promise<{ isLoggedIn: () => boolean;
      // canCreateCollections: () => boolean; }>' is not assignable to parameter
      // of type 'Promise<UserInfo>'.". This is because the actual
      // 'getUserInfoAsync' returns more properties than required. We need to
      // suppress this error because we need only "isLoggedIn" and
      // "canCreateCollections" functions for testing.
      // @ts-expect-error
      .and.returnValue(Promise.resolve({
        isLoggedIn: () => true,
        canCreateCollections: () => true
      }));
    const urlParamsSpy = spyOn(urlService, 'getUrlParams').and.returnValue({
      mode: 'create'
    });
    spyOn(component, 'initCreationProcess');

    expect(component.canCreateCollections).toBe(false);
    expect(component.userIsLoggedIn).toBe(false);

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(userServiceSpy).toHaveBeenCalled();
    expect(urlParamsSpy).toHaveBeenCalled();
    expect(component.initCreationProcess).toHaveBeenCalled();
    expect(component.canCreateCollections).toBe(true);
    expect(component.userIsLoggedIn).toBe(true);
  }));

  it('should initialize and call createNewExploration()', fakeAsync(() => {
    const userServiceSpy = spyOn(userService, 'getUserInfoAsync')
      // This throws "Argument of type 'Promise<{ isLoggedIn: () => boolean;
      // canCreateCollections: () => boolean; }>' is not assignable to parameter
      // of type 'Promise<UserInfo>'.". This is because the actual
      // 'getUserInfoAsync' returns more properties than required. We need to
      // suppress this error because we need only "isLoggedIn" and
      // "canCreateCollections" functions for testing.
      // @ts-expect-error
      .and.returnValue(Promise.resolve({
        isLoggedIn: () => true,
        canCreateCollections: () => false
      }));
    const urlParamsSpy = spyOn(urlService, 'getUrlParams').and.returnValue({
      mode: 'create'
    });
    const explorationCreationServiceSpy = spyOn(
      explorationCreationService, 'createNewExploration');

    expect(component.canCreateCollections).toBe(false);
    expect(component.userIsLoggedIn).toBe(false);

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(userServiceSpy).toHaveBeenCalled();
    expect(urlParamsSpy).toHaveBeenCalled();
    expect(explorationCreationServiceSpy).toHaveBeenCalled();
    expect(component.canCreateCollections).toBe(false);
    expect(component.userIsLoggedIn).toBe(true);
  }));

  it('should return from initCreateProcess() when' +
    ' creation is in progress', () => {
    component.creationInProgress = true;
    expect(component.initCreationProcess()).toBe();
  });

  it('should create new exploration if user cannot create collections', () => {
    component.creationInProgress = false;
    component.canCreateCollections = false;
    const explorationCreationServiceSpy = spyOn(
      explorationCreationService, 'createNewExploration');

    component.initCreationProcess();

    expect(explorationCreationServiceSpy).toHaveBeenCalled();
  });

  it('should replace location', () => {
    component.creationInProgress = false;
    component.canCreateCollections = true;
    const urlServiceSpy = spyOn(urlService, 'getPathname').and.returnValue(
      'not/creator-dashboard');
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        replace: (val: string) => {}
      }
    });
    const replaceSpy = spyOn(windowRef.nativeWindow.location, 'replace');

    component.initCreationProcess();

    expect(urlServiceSpy).toHaveBeenCalled();
    expect(replaceSpy).toHaveBeenCalledWith('/creator-dashboard?mode=create');
  });

  it('should open a create activity modal', () => {
    component.creationInProgress = false;
    component.canCreateCollections = true;
    const urlServiceSpy = spyOn(urlService, 'getPathname').and.returnValue(
      '/creator-dashboard');
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return <NgbModalRef>({
        result: Promise.resolve('success')
      });
    });

    component.initCreationProcess();

    expect(urlServiceSpy).toHaveBeenCalled();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should set creationInProgress as false when cancel' +
    ' button is clicked', fakeAsync(() => {
    component.creationInProgress = false;
    component.canCreateCollections = true;
    const urlServiceSpy = spyOn(urlService, 'getPathname').and.returnValue(
      '/creator-dashboard');
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return <NgbModalRef>({
        result: Promise.reject('cancel')
      });
    });

    component.initCreationProcess();
    tick();

    expect(urlServiceSpy).toHaveBeenCalled();
    expect(modalSpy).toHaveBeenCalled();
    expect(component.creationInProgress).toBe(false);
  }));

  it('should show upload exploration modal', () => {
    const explorationCreationServiceSpy = spyOn(
      explorationCreationService, 'showUploadExplorationModal');

    component.showUploadExplorationModal();

    expect(explorationCreationServiceSpy).toHaveBeenCalled();
  });

  it('should register login event and set href', fakeAsync(() => {
    windowRef.nativeWindow.location.href = '';

    component.onRedirectToLogin('string');
    tick(150);
    fixture.detectChanges();

    expect(windowRef.nativeWindow.location.href).toBe('string');
  }));
});
