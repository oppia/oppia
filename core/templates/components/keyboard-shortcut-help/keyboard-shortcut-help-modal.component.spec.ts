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
 * @fileoverview Unit tests for KeyboardShortcutHelpModalComponent.
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  async,
} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UrlService} from 'services/contextual/url.service';
import {ContextService} from 'services/context.service';

import {KeyboardShortcutHelpModalComponent} from './keyboard-shortcut-help-modal.component';

class MockActiveModal {
  dismiss(): void {
    return;
  }
}

describe('KeyboardShortcutHelpModalComponent', () => {
  let component: KeyboardShortcutHelpModalComponent;
  let fixture: ComponentFixture<KeyboardShortcutHelpModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let urlService: UrlService;
  let contextService: ContextService;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KeyboardShortcutHelpModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KeyboardShortcutHelpModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.get(NgbActiveModal);
    urlService = TestBed.get(UrlService);
    contextService = TestBed.get(ContextService);
  });

  it('should load the library page shortcut descriptions', () => {
    const mockLibraryPage = spyOn(urlService, 'getPathname').and.returnValue(
      '/community-library'
    );
    component.ngOnInit();
    expect(mockLibraryPage).toHaveBeenCalled();
  });

  it('should load the exploration player shortcut descriptions', () => {
    const mockExplorationPlayerPage = spyOn(
      contextService,
      'isInExplorationPlayerPage'
    ).and.returnValue(true);
    component.ngOnInit();
    expect(mockExplorationPlayerPage).toHaveBeenCalled();
  });

  it('should dismiss the modal when clicked on cancel', fakeAsync(() => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    const closeButtonDE = fixture.debugElement.query(
      By.css('.modal-footer .btn.btn-secondary')
    );

    closeButtonDE.nativeElement.click();

    fixture.detectChanges();
    expect(dismissSpy).toHaveBeenCalled();
  }));
});
