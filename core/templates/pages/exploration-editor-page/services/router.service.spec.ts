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
 * @fileoverview Unit tests for RouterService.
 */

import { RouterService } from './router.service';
import { Subscription } from 'rxjs';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { fakeAsync, flush, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import $ from 'jquery';

class MockActiveModal {
  dismiss(): void {
    return;
  }
}
// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Router Service', () => {
  let routerService: RouterService;
  let testSubscriptions: Subscription;

  beforeEach((() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RouterService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ]
    });

    routerService = TestBed.inject(RouterService);
  }));

  beforeEach(() => {
    testSubscriptions = new Subscription();
  });
  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should not navigate to main tab when already there', fakeAsync(() => {
    let jQuerySpy = spyOn(window, '$');
    jQuerySpy.withArgs('.oppia-editor-cards-container').and.returnValue(
      $(document.createElement('div')));
    jQuerySpy.and.callThrough();

    let fadeOutSpy = spyOn($.fn, 'fadeOut').and.callFake(cb => {
      cb();
      setTimeout(() => {},);
      return null;
    });

    expect(routerService.getActiveTabName()).toBe('main');
    routerService.navigateToMainTab('settings');

    tick(3000);
    flush();
    flushMicrotasks();
    tick(3000);
    flush();
    flushMicrotasks();


    expect(routerService.getActiveTabName()).toBe('main');

    routerService.navigateToMainTab('settings');

    tick(3000);
    flush();
    flushMicrotasks();
    tick(3000);
    flush();
    flushMicrotasks();


    expect(routerService.getActiveTabName()).toBe('main');
    expect(fadeOutSpy).toHaveBeenCalled();
  }));
});
