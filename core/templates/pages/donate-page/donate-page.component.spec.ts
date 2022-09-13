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

import { TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
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
      replace: (val: string) => {}
    },
    gtag: () => {}
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

  beforeEach(async() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
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
      ]
    }).compileComponents();
  });

  let component: DonatePageComponent;

  beforeEach(() => {
    const donatePageComponent = TestBed.createComponent(DonatePageComponent);
    component = donatePageComponent.componentInstance;
    translateService = TestBed.inject(TranslateService);
    pageTitleService = TestBed.inject(PageTitleService);
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

  it('should donate throught amazon sucessfully', (done) => {
    spyOn(siteAnalyticsServiceStub, 'registerGoToDonationSiteEvent')
      .and.callThrough();

    component.onDonateThroughAmazon();
    expect(siteAnalyticsServiceStub.registerGoToDonationSiteEvent)
      .toHaveBeenCalledWith('Amazon');

    setTimeout(() => {
      expect(windowRef.nativeWindow.location.href).toBe(
        'https://smile.amazon.com/ch/81-1740068');

      done();
    }, 150);
  });

  it('should donate throught paypal sucessfully', () => {
    spyOn(siteAnalyticsServiceStub, 'registerGoToDonationSiteEvent')
      .and.callThrough();

    component.onDonateThroughPayPal();
    expect(siteAnalyticsServiceStub.registerGoToDonationSiteEvent)
      .toHaveBeenCalledWith('PayPal');
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
});
