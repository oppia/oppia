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
 * @fileoverview Unit tests for autosaveInfoModalsService.
 */

import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { AutosaveInfoModalsService } from './autosave-info-modals.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { LostChange } from 'domain/exploration/LostChangeObjectFactory';
import { LocalStorageService } from 'services/local-storage.service';

class showNonStrictValidationFailModalRef {
  componentInstance!: {
  };
}

class showVersionMismatchModalRef {
  componentInstance!: {
    lostChanges: null;
  };
}

class showLostChangesModalRef {
  componentInstance!: {
    lostChanges: null;
  };
}

describe('AutosaveInfoModalsService', () => {
  let autosaveInfoModalsService: AutosaveInfoModalsService;
  let ngbModal: NgbModal;
  let localStorageService: LocalStorageService;
  let csrfService: CsrfTokenService;
  const explorationId: string = '0';
  const lostChanges: LostChange[] = [];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        AutosaveInfoModalsService,
        LocalStorageService,
        NgbModal
      ]
    });
  });

  beforeEach(() => {
    autosaveInfoModalsService = TestBed.inject(AutosaveInfoModalsService);
    ngbModal = TestBed.inject(NgbModal);
    localStorageService = TestBed.inject(LocalStorageService);
    csrfService = TestBed.inject(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return new Promise((resolve) => {
        resolve('sample-csrf-token');
      });
    });
  });

  it('should call ngbModal open when opening non strict validation fail' +
    ' modal', fakeAsync(() => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return (
        { componentInstance: showNonStrictValidationFailModalRef,
          result: Promise.resolve('success')
        } as NgbModalRef);
    });

    autosaveInfoModalsService.showNonStrictValidationFailModal();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should close non strict validation fail modal successfully',
    fakeAsync(() => {
      expect(autosaveInfoModalsService.isModalOpen()).toBe(false);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
          { componentInstance: showNonStrictValidationFailModalRef,
            result: Promise.resolve('success')
          } as NgbModalRef);
      });

      autosaveInfoModalsService.showNonStrictValidationFailModal();
      expect(autosaveInfoModalsService.isModalOpen()).toBe(true);

      flushMicrotasks();

      expect(autosaveInfoModalsService.isModalOpen()).toBe(false);
      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should handle rejects when closing non strict validation fail modal',
    fakeAsync(() => {
      expect(autosaveInfoModalsService.isModalOpen()).toBe(false);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
          { componentInstance: showNonStrictValidationFailModalRef,
            result: Promise.reject('fail')
          } as NgbModalRef);
      });

      autosaveInfoModalsService.showNonStrictValidationFailModal();
      expect(autosaveInfoModalsService.isModalOpen()).toBe(true);

      flushMicrotasks();

      expect(autosaveInfoModalsService.isModalOpen()).toBe(false);
      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should call ngbModal open when opening version mismatch' +
    ' modal', fakeAsync(() => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return (
        { componentInstance: showLostChangesModalRef,
          result: Promise.resolve('success')
        } as NgbModalRef);
    });

    autosaveInfoModalsService.showVersionMismatchModal(lostChanges);

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should close version mismatch modal successfully', fakeAsync(() => {
    expect(autosaveInfoModalsService.isModalOpen()).toBe(false);
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return (
        { componentInstance: showLostChangesModalRef,
          result: Promise.resolve('success')
        } as NgbModalRef);
    });

    autosaveInfoModalsService.showVersionMismatchModal(lostChanges);
    expect(autosaveInfoModalsService.isModalOpen()).toBe(true);

    flushMicrotasks();

    expect(autosaveInfoModalsService.isModalOpen()).toBe(false);
    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should handle rejects when dismissing save version mismatch modal',
    fakeAsync(() => {
      expect(autosaveInfoModalsService.isModalOpen()).toBe(false);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
          { componentInstance: showVersionMismatchModalRef,
            result: Promise.reject('fail')
          } as NgbModalRef);
      });

      autosaveInfoModalsService.showVersionMismatchModal(lostChanges);
      expect(autosaveInfoModalsService.isModalOpen()).toBe(true);

      flushMicrotasks();

      expect(autosaveInfoModalsService.isModalOpen()).toBe(false);
      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should call ngbModal open when opening show lost changes modal',
    fakeAsync(() => {
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
          { componentInstance: showLostChangesModalRef,
            result: Promise.resolve('success')
          } as NgbModalRef);
      });

      autosaveInfoModalsService.showLostChangesModal(
        lostChanges, explorationId);

      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should close show lost changes modal successfully', fakeAsync(() => {
    expect(autosaveInfoModalsService.isModalOpen()).toBe(false);
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return (
        { componentInstance: showLostChangesModalRef,
          result: Promise.resolve('success')
        } as NgbModalRef);
    });
    autosaveInfoModalsService.showLostChangesModal(lostChanges, explorationId);
    expect(autosaveInfoModalsService.isModalOpen()).toBe(true);

    flushMicrotasks();

    expect(autosaveInfoModalsService.isModalOpen()).toBe(false);
    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should handle reject when dismissing show' +
    'lost changes modal', fakeAsync(() => {
    expect(autosaveInfoModalsService.isModalOpen()).toBe(false);

    const localStorageSpy = spyOn(localStorageService, 'removeExplorationDraft')
      .and.callThrough();
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return (
        { componentInstance: showLostChangesModalRef,
          result: Promise.reject('fail')
        } as NgbModalRef);
    });

    autosaveInfoModalsService.showLostChangesModal(lostChanges, explorationId);
    expect(autosaveInfoModalsService.isModalOpen()).toBe(true);

    flushMicrotasks();

    expect(autosaveInfoModalsService.isModalOpen()).toBe(false);
    expect(localStorageSpy).toHaveBeenCalled();
    expect(modalSpy).toHaveBeenCalled();
  }));
});
