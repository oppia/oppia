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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

import {ExplorationCreationService} from 'components/entity-creation-services/exploration-creation.service';
import {CreateActivityModalComponent} from 'pages/creator-dashboard-page/modal-templates/create-activity-modal.component';
import {UrlParamsType, UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UserService} from 'services/user.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {CreateActivityButtonComponent} from './create-activity-button.component';
import {PrimaryButtonComponent} from './primary-button.component';

/**
 * @fileoverview Unit tests for CreateActivityButtonComponent.
 */

class MockWindowRef {
  _window = {
    location: {
      _href: '',
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
      },
      replace: (val: string) => {},
    },
    gtag: () => {},
  };

  get nativeWindow() {
    return this._window;
  }
}

class MockUrlService {
  getPathname(): string {
    return '/creator-dashboard';
  }

  getUrlParams(): UrlParamsType {
    return {
      mode: 'create',
    };
  }
}

describe('CreateActivityButtonComponent', () => {
  let component: CreateActivityButtonComponent;
  let fixture: ComponentFixture<CreateActivityButtonComponent>;
  let userService: UserService;
  let urlService: MockUrlService;
  let explorationCreationService: ExplorationCreationService;
  let siteAnalyticsService: SiteAnalyticsService;
  let windowRef: MockWindowRef;
  let ngbModal: NgbModal;

  let userInfoForCollectionCreator = {
    _roles: ['USER_ROLE'],
    _isModerator: true,
    _isCurriculumAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isCurriculumAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    isTranslationAdmin: () => false,
    isBlogAdmin: () => false,
    isBlogPostEditor: () => false,
    isQuestionAdmin: () => false,
    isQuestionCoordinator: () => false,
    isTranslationCoordinator: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () => 'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true,
    isVoiceoverAdmin: () => false,
  };

  let userInfoForNonCollectionCreator = {
    _roles: ['USER_ROLE'],
    _isModerator: true,
    _isCurriculumAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isCurriculumAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    isTranslationAdmin: () => false,
    isQuestionAdmin: () => false,
    isQuestionCoordinator: () => false,
    isTranslationCoordinator: () => false,
    isBlogAdmin: () => false,
    isBlogPostEditor: () => false,
    canCreateCollections: () => false,
    getPreferredSiteLanguageCode: () => 'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true,
    isVoiceoverAdmin: () => false,
  };

  beforeEach(waitForAsync(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        CreateActivityButtonComponent,
        PrimaryButtonComponent,
        MockTranslatePipe,
      ],
      providers: [
        UserService,
        {
          provide: UrlService,
          useClass: MockUrlService,
        },
        {
          provide: WindowRef,
          useValue: windowRef,
        },
        ExplorationCreationService,
        SiteAnalyticsService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateActivityButtonComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    urlService = TestBed.inject(UrlService);
    explorationCreationService = TestBed.inject(ExplorationCreationService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    ngbModal = TestBed.inject(NgbModal);
    fixture.detectChanges();
  });

  it('should successfully instantiate the component from beforeEach block', () => {
    expect(component).toBeDefined();
  });

  describe('when user can create collections', () => {
    it(
      'should begin activity creation process if the' +
        " url parameter 'mode' is set as 'create'",
      fakeAsync(() => {
        spyOn(userService, 'getUserInfoAsync').and.returnValue(
          Promise.resolve(userInfoForCollectionCreator)
        );
        spyOn(urlService, 'getUrlParams').and.returnValue({
          mode: 'create',
        });
        spyOn(component, 'initCreationProcess');

        expect(component.userIsLoggedIn).toBe(false);
        expect(component.canCreateCollections).toBe(false);

        component.ngOnInit();
        tick();
        fixture.detectChanges();

        expect(component.userIsLoggedIn).toBe(true);
        expect(component.canCreateCollections).toBe(true);
        expect(urlService.getUrlParams).toHaveBeenCalled();
        expect(component.initCreationProcess).toHaveBeenCalled();
      })
    );

    it(
      'should redirect user to creator dashboard page when the user' +
        ' clicks on the create button',
      () => {
        component.creationInProgress = false;
        component.canCreateCollections = true;
        spyOn(urlService, 'getPathname').and.returnValue(
          'not/creator-dashboard'
        );
        spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
          location: {
            _href: '',
            href: '',
            replace: (val: string) => {},
          },
          gtag: () => '',
        });
        const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
          return {
            result: Promise.resolve('success'),
          } as NgbModalRef;
        });
        const replaceSpy = spyOn(windowRef.nativeWindow.location, 'replace');

        component.initCreationProcess();

        expect(replaceSpy).toHaveBeenCalledWith(
          '/creator-dashboard?mode=create'
        );
        expect(modalSpy).not.toHaveBeenCalled();
      }
    );

    it(
      'should not redirect user but open a create activity modal if user' +
        ' is on the creator dashboard page',
      () => {
        component.creationInProgress = false;
        component.canCreateCollections = true;
        spyOn(urlService, 'getPathname').and.returnValue('/creator-dashboard');
        const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
          return {
            result: Promise.resolve('success'),
          } as NgbModalRef;
        });
        const replaceSpy = spyOn(windowRef.nativeWindow.location, 'replace');

        component.initCreationProcess();

        expect(replaceSpy).not.toHaveBeenCalled();
        expect(modalSpy).toHaveBeenCalled();
      }
    );

    it(
      'should stop the creation process when there is an error with' +
        ' the create activity modal opening',
      fakeAsync(() => {
        component.creationInProgress = false;
        component.canCreateCollections = true;
        spyOn(urlService, 'getPathname').and.returnValue('/creator-dashboard');
        const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
          return {
            result: Promise.reject('cancel'),
          } as NgbModalRef;
        });

        component.initCreationProcess();
        tick();

        expect(modalSpy).toHaveBeenCalledWith(CreateActivityModalComponent, {
          backdrop: true,
        });
        expect(component.creationInProgress).toBe(false);
      })
    );

    it(
      'should create new exploration when clicked on CREATE' +
        ' EXPLORATION button',
      () => {
        spyOn(explorationCreationService, 'createNewExploration');
        component.createNewExploration();
        expect(
          explorationCreationService.createNewExploration
        ).toHaveBeenCalled();
      }
    );
  });

  describe('when user cannot create collection', () => {
    it(
      'should create a new exploration automatically if' +
        " url parameter 'mode' is set as 'create'",
      fakeAsync(() => {
        spyOn(userService, 'getUserInfoAsync').and.returnValue(
          Promise.resolve(userInfoForNonCollectionCreator)
        );
        const explorationCreationServiceSpy = spyOn(
          explorationCreationService,
          'createNewExploration'
        );
        spyOn(urlService, 'getUrlParams').and.returnValue({
          mode: 'create',
        });

        expect(component.userIsLoggedIn).toBe(false);
        expect(component.canCreateCollections).toBe(false);

        component.ngOnInit();
        tick();
        fixture.detectChanges();

        expect(component.userIsLoggedIn).toBe(true);
        expect(component.canCreateCollections).toBe(false);
        expect(urlService.getUrlParams).toHaveBeenCalled();
        expect(explorationCreationServiceSpy).toHaveBeenCalled();
      })
    );

    it(
      'should create new exploration when the user clicks' +
        ' on the create button',
      () => {
        component.creationInProgress = false;
        component.canCreateCollections = false;
        const explorationCreationServiceSpy = spyOn(
          explorationCreationService,
          'createNewExploration'
        );

        component.initCreationProcess();

        expect(explorationCreationServiceSpy).toHaveBeenCalled();
      }
    );
  });

  it(
    'should not start a new creation process if another' +
      ' creation is in progress',
    () => {
      component.canCreateCollections = false;
      component.creationInProgress = false;

      const explorationCreationServiceSpy = spyOn(
        explorationCreationService,
        'createNewExploration'
      );

      component.initCreationProcess();
      expect(component.creationInProgress).toBe(true);
      expect(explorationCreationServiceSpy).toHaveBeenCalledTimes(1);

      component.initCreationProcess();
      expect(explorationCreationServiceSpy).toHaveBeenCalledTimes(1);
    }
  );

  it('should show upload exploration modal', () => {
    const showUploadExplorationModalSpy = spyOn(
      explorationCreationService,
      'showUploadExplorationModal'
    );

    component.showUploadExplorationModal();

    expect(showUploadExplorationModalSpy).toHaveBeenCalled();
  });

  it(
    'should redirect to login page when user creates exploration' +
      ' and is not logged in',
    fakeAsync(() => {
      windowRef.nativeWindow.location.href = '';
      const siteAnalyticsServiceSpy = spyOn(
        siteAnalyticsService,
        'registerStartLoginEvent'
      );

      component.onRedirectToLogin('login-url');
      tick(150);
      fixture.detectChanges();

      expect(siteAnalyticsServiceSpy).toHaveBeenCalledWith(
        'createActivityButton'
      );
      expect(windowRef.nativeWindow.location.href).toBe('login-url');
    })
  );

  it(
    'should call the site analytics service on redirect' + ' to login',
    fakeAsync(() => {
      const siteAnalyticsServiceSpy = spyOn(
        siteAnalyticsService,
        'registerStartLoginEvent'
      );

      component.onRedirectToLogin('login-url');
      tick(150);
      fixture.detectChanges();

      expect(siteAnalyticsServiceSpy).toHaveBeenCalledWith(
        'createActivityButton'
      );
    })
  );
});
