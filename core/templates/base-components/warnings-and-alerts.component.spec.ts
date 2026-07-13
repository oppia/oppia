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

/**
 * @fileoverview Unit tests for WarningsAndAlertsComponent.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {AlertMessageComponent} from 'components/common-layout-directives/common-elements/alert-message.component';
import {LimitToPipe} from 'filters/limit-to.pipe';
import {AlertsService, Message, Warning} from 'services/alerts.service';
import {WarningsAndAlertsComponent} from './warnings-and-alerts.component';

class MockNgbModal {
  open = jasmine.createSpy('open').and.returnValue({
    componentInstance: {
      errorMessage: '',
    },
    result: Promise.resolve(),
  });

  hasOpenModals = jasmine.createSpy('hasOpenModals').and.returnValue(false);
}

describe('Warnings and Alert Component', () => {
  let fixture: ComponentFixture<WarningsAndAlertsComponent>;
  let componentInstance: WarningsAndAlertsComponent;
  let alertsService: AlertsService;
  let modalService: NgbModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        WarningsAndAlertsComponent,
        AlertMessageComponent,
        LimitToPipe,
      ],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WarningsAndAlertsComponent);
    componentInstance = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    modalService = TestBed.inject(NgbModal);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should get messages', () => {
    let messages: Message[] = [
      {content: 'Test Message', timeout: 100, type: 'success'},
    ];
    spyOnProperty(alertsService, 'messages').and.returnValue(messages);
    expect(componentInstance.getMessages()).toEqual(messages);
  });

  it('should get warnings', () => {
    let warnings: Warning[] = [{content: 'Test Warning', type: 'success'}];
    spyOnProperty(alertsService, 'warnings').and.returnValue(warnings);
    expect(componentInstance.getWarnings()).toEqual(warnings);
  });

  it('should delete warning', () => {
    spyOn(alertsService, 'deleteWarning');
    let warning: Warning = {content: 'Test Warning', type: 'success'};
    componentInstance.deleteWarning(warning);
    expect(alertsService.deleteWarning).toHaveBeenCalled();
  });

  it('should open modal for initial warnings on initialization', () => {
    let warnings: Warning[] = [{content: 'Initial Warning', type: 'error'}];
    spyOnProperty(alertsService, 'warnings').and.returnValue(warnings);
    spyOn(componentInstance, 'openErrorModal');

    componentInstance.ngOnInit();

    expect(componentInstance.openErrorModal).toHaveBeenCalledWith(
      'Initial Warning'
    );
  });

  it('should open modal when a warning is added dynamically', fakeAsync(() => {
    let mockNgbModalRef = {
      componentInstance: {
        errorMessage: '',
      },
      result: Promise.resolve(),
    };
    (modalService.open as jasmine.Spy).and.returnValue(
      mockNgbModalRef as unknown as NgbModalRef
    );
    (modalService.hasOpenModals as jasmine.Spy).and.returnValue(false);

    let onWarningAddedEmitter = new EventEmitter<string>();
    spyOnProperty(alertsService, 'onWarningAdded').and.returnValue(
      onWarningAddedEmitter
    );

    componentInstance.ngOnInit();
    onWarningAddedEmitter.emit('New Warning Message');
    tick();

    expect(modalService.open).toHaveBeenCalled();
    expect(mockNgbModalRef.componentInstance.errorMessage).toEqual(
      'New Warning Message'
    );
  }));

  it('should open error modal regardless of other open modals', () => {
    (modalService.hasOpenModals as jasmine.Spy).and.returnValue(true);

    componentInstance.openErrorModal('Incoming Warning');

    expect(modalService.open).toHaveBeenCalled();
  });

  it('should process sequential warnings queue when modal settles', fakeAsync(() => {
    let mockNgbModalRef = {
      componentInstance: {
        errorMessage: '',
      },
      result: Promise.resolve(),
    };
    (modalService.open as jasmine.Spy).and.returnValue(
      mockNgbModalRef as unknown as NgbModalRef
    );
    (modalService.hasOpenModals as jasmine.Spy).and.returnValue(false);
    let warnings: Warning[] = [
      {content: 'First Warning', type: 'error'},
      {content: 'Second Warning', type: 'error'},
    ];
    const firstWarning = warnings[0];
    const secondWarning = warnings[1];
    spyOnProperty(alertsService, 'warnings').and.returnValue(warnings);

    spyOn(alertsService, 'deleteWarning').and.callFake(warning => {
      const index = warnings.indexOf(warning);
      if (index > -1) {
        warnings.splice(index, 1);
      }
    });

    componentInstance.openErrorModal('First Warning');
    tick();

    expect(alertsService.deleteWarning).toHaveBeenCalledWith(firstWarning);
    expect(alertsService.deleteWarning).toHaveBeenCalledWith(secondWarning);
    expect(modalService.open).toHaveBeenCalledTimes(2);
  }));
});
