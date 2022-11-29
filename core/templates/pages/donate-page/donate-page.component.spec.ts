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
 * @fileoverview Unit tests for donate page.
 */

import { TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { DonatePageComponent } from './donate-page.component';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { PageTitleService } from 'services/page-title.service';
import { MailingListBackendApiService } from 'domain/mailing-list/mailing-list-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class MockWindowRef {
  _window = {
    location: {
      hash: '#thank-you',
      _href: '',
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
      },
      replace: (val: string) => {}
    },
    gtag: () => {},
    onhashchange: () => {}
  };

  get nativeWindow() {
    return this._window;
  }
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Donate page', () => {
  const siteAnalyticsServiceStub = new SiteAnalyticsService(
    new WindowRef());
  let translateService: TranslateService;
  let pageTitleService: PageTitleService;
  let windowRef: MockWindowRef;
  let mailingListBackendApiService: MailingListBackendApiService;
  let alertsService: AlertsService;
  let ngbModal: NgbModal;

  beforeEach(async() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        DonatePageComponent,
        MockTranslatePipe
      ],
      providers: [
        {provide: SiteAnalyticsService, useValue: siteAnalyticsServiceStub},
        UrlInterpolationService,
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true
          }
        },
        {
          provide: WindowRef,
          useValue: windowRef
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService
        },
        PageTitleService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  let component: DonatePageComponent;

  beforeEach(() => {
    const donatePageComponent = TestBed.createComponent(DonatePageComponent);
    component = donatePageComponent.componentInstance;
    translateService = TestBed.inject(TranslateService);
    pageTitleService = TestBed.inject(PageTitleService);
    alertsService = TestBed.inject(AlertsService);
    mailingListBackendApiService = TestBed.inject(
      MailingListBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
  });

  it('should successfully instantiate the component from beforeEach block',
    () => {
      expect(component).toBeDefined();
    });

  it('should set component properties when ngOnInit() is called', () => {
    spyOn(translateService.onLangChange, 'subscribe');
    component.ngOnInit();

    expect(component.windowIsNarrow).toBe(true);
    expect(component.donateImgUrl).toBe(
      '/assets/images/general/opp_donate_text.svg');
    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
  });

  it('should obtain translated page title whenever the selected' +
  'language changes', () => {
    component.ngOnInit();
    spyOn(component, 'setPageTitle');
    translateService.onLangChange.emit();

    expect(component.setPageTitle).toHaveBeenCalled();
  });

  it('should set new page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_DONATE_PAGE_BROWSER_TAB_TITLE');
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_DONATE_PAGE_BROWSER_TAB_TITLE');
  });

  it('should unsubscribe on component destruction', () => {
    component.directiveSubscriptions.add(
      translateService.onLangChange.subscribe(() => {
        component.setPageTitle();
      })
    );
    component.ngOnDestroy();

    expect(component.directiveSubscriptions.closed).toBe(true);
  });

  it('should validate email address correctly', () => {
    component.emailAddress = 'invalidEmail';
    expect(component.validateEmailAddress()).toBeFalse();

    component.emailAddress = 'validEmail@example.com';
    expect(component.validateEmailAddress()).toBeTrue();
  });

  it('should add user to mailing list and return status',
    fakeAsync(() => {
      spyOn(alertsService, 'addInfoMessage');
      component.ngOnInit();
      tick();
      component.emailAddress = 'validEmail@example.com';
      component.name = 'validName';
      spyOn(mailingListBackendApiService, 'subscribeUserToMailingList')
        .and.returnValue(Promise.resolve(true));

      component.subscribeToMailingList();

      flushMicrotasks();

      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'Done!', 1000);
    }));

  it('should fail to add user to mailing list and return status',
    fakeAsync(() => {
      spyOn(alertsService, 'addInfoMessage');
      component.ngOnInit();
      tick();
      component.emailAddress = 'validEmail@example.com';
      component.name = 'validName';
      spyOn(mailingListBackendApiService, 'subscribeUserToMailingList')
        .and.returnValue(Promise.resolve(false));

      component.subscribeToMailingList();

      flushMicrotasks();

      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'Sorry, an unexpected error occurred. Please email admin@oppia.org ' +
        'to be added to the mailing list.', 10000);
    }));

  it('should reject request to the mailing list correctly',
    fakeAsync(() => {
      spyOn(alertsService, 'addInfoMessage');
      component.ngOnInit();
      tick();
      component.emailAddress = 'validEmail@example.com';
      component.name = 'validName';
      spyOn(mailingListBackendApiService, 'subscribeUserToMailingList')
        .and.returnValue(Promise.reject(false));

      component.subscribeToMailingList();

      flushMicrotasks();

      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'Sorry, an unexpected error occurred. Please email admin@oppia.org ' +
        'to be added to the mailing list.', 10000);
    }));

  it('should get image set', () => {
    spyOn(component, 'getStaticImageUrl');

    component.getImageSet('abc', 'png');

    expect(component.getStaticImageUrl).toHaveBeenCalled();
  });

  it('should show thank you modal on hash change',
    fakeAsync(() => {
      spyOn(ngbModal, 'open');
      component.ngOnInit();

      expect(ngbModal.open).not.toHaveBeenCalled();

      windowRef.nativeWindow.onhashchange();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
    }));
});
