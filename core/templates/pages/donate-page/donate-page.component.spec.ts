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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { DonatePageComponent } from './donate-page.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DonationBoxModalComponent } from './donation-box/donation-box-modal.component';
import { ThanksForDonatingModalComponent } from './thanks-for-donating-modal.component';

class MockWindowRef {
  _window = {
    location: {
      _href: '',
      search: '',
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

describe('Donate page', () => {
  let fixture: ComponentFixture<DonatePageComponent>;
  let component: DonatePageComponent;
  let windowRef: MockWindowRef;
  let ngbModal: NgbModal;
  let urlInterpolationService: UrlInterpolationService;

  beforeEach(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [
        DonatePageComponent,
        MockTranslatePipe
      ],
      providers: [
        UrlInterpolationService,
        { provide: WindowRef, useValue: windowRef },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DonatePageComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    spyOn(ngbModal, 'open');
  });

  it('should get image path', () => {
    spyOn(urlInterpolationService, 'getStaticImageUrl');

    component.getStaticImageUrl('abc.webp');

    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
      'abc.webp');
  });

  it('should show thank you modal on query parameters change', () => {
    windowRef.nativeWindow.location.search = '';
    component.ngOnInit();
    expect(ngbModal.open).not.toHaveBeenCalled();

    windowRef.nativeWindow.location.search = '?random';
    component.ngOnInit();
    expect(ngbModal.open).not.toHaveBeenCalled();

    windowRef.nativeWindow.location.search = '?thanks';
    component.ngOnInit();
    expect(ngbModal.open).toHaveBeenCalledWith(
      ThanksForDonatingModalComponent,
      {
        backdrop: 'static',
        size: 'xl',
      }
    );
  });

  it('should open donation box modal', () => {
    component.openDonationBoxModal();

    expect(ngbModal.open).toHaveBeenCalledWith(
      DonationBoxModalComponent, {
        backdrop: 'static',
        size: 'xl',
        windowClass: 'donation-box-modal',
      }
    );
  });

  it('should change learner tile in carousel', () => {
    fixture.detectChanges();
    const randomVal = Math.floor(Math.random() * 5);
    const allTiles = fixture.debugElement.componentInstance.tiles.toArray();
    const nativeElem = allTiles[randomVal].nativeElement;
    spyOn(nativeElem, 'scrollIntoView').and.callThrough();

    component.nextTile(randomVal);
    expect(component.tileShown).toEqual(randomVal);
    expect(nativeElem.scrollIntoView).toHaveBeenCalled();
  });
});
