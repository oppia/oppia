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
 * @fileoverview Unit tests for explorationSaveAndPublishButtons.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { UserExplorationPermissionsService } from 'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { EditabilityService } from 'services/editability.service';
import { ChangeListService } from '../services/change-list.service';
import { ExplorationChange } from 'domain/exploration/exploration-draft.model';
import { ExplorationSaveAndPublishButtonsComponent } from './exploration-save-and-publish-buttons.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { InternetConnectivityService } from 'services/internet-connectivity.service';
import { ExplorationRightsService } from '../services/exploration-rights.service';
import { ExplorationSaveService } from '../services/exploration-save.service';
import { ExplorationWarningsService } from '../services/exploration-warnings.service';
import { ExternalSaveService } from 'services/external-save.service';
import { ExplorationSavePromptModalComponent } from '../modal-templates/exploration-save-prompt-modal.component';
import { ExplorationPermissions } from 'domain/exploration/exploration-permissions.model';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ContextService } from 'services/context.service';

describe('Exploration save and publish buttons component', () => {
  let component: ExplorationSaveAndPublishButtonsComponent;
  let fixture: ComponentFixture<ExplorationSaveAndPublishButtonsComponent>;
  let changeListService: ChangeListService;
  let ngbModal: NgbModal;
  let contextService: ContextService;
  let ics: InternetConnectivityService;
  let explorationRightsService: ExplorationRightsService;
  let explorationSaveService: ExplorationSaveService;
  let explorationWarningsService: ExplorationWarningsService;
  let editabilityService: EditabilityService;
  let userExplorationPermissionsService: UserExplorationPermissionsService;
  let fetchPermissionsAsyncSpy;

  let mockExternalSaveEventEmitter = new EventEmitter<void>();
  let mockConnectionServiceEmitter = new EventEmitter<boolean>();

   class MockExternalSaveService {
     onExternalSave = mockExternalSaveEventEmitter;
   }

   class MockNgbModal {
     open() {
       return {
         result: Promise.resolve()
       };
     }
   }

   class MockWindowRef {
     location = { path: '/create/2234' };
     nativeWindow = {
       scrollTo: (value1, value2) => {},
       sessionStorage: {
         promoIsDismissed: null,
         setItem: (testKey1, testKey2) => {},
         removeItem: (testKey) => {}
       },
       gtag: (value1, value2, value3) => {},
       navigator: {
         onLine: true,
         userAgent: null
       },
       location: {
         path: '/create/2234',
         pathname: '/',
         hostname: 'oppiaserver.appspot.com',
         search: '',
         protocol: '',
         reload: () => {},
         hash: '',
         href: '',
       },
       document: {
         documentElement: {
           setAttribute: (value1, value2) => {},
           clientWidth: null,
           clientHeight: null,
         },
         body: {
           clientWidth: null,
           clientHeight: null,
           style: {
             overflowY: ''
           }
         }
       },
       addEventListener: (value1, value2) => {}
     };
   }

   beforeEach(waitForAsync(() => {
     TestBed.configureTestingModule({
       imports: [
         HttpClientTestingModule,
         FormsModule,
         MatCardModule,
         MatMenuModule,
       ],
       declarations: [
         ExplorationSaveAndPublishButtonsComponent,
         ExplorationSavePromptModalComponent
       ],
       providers: [
         ChangeListService,
         {
           provide: ExternalSaveService,
           useClass: MockExternalSaveService
         },
         {
           provide: WindowRef,
           useClass: MockWindowRef
         },
         {
           provide: NgbModal,
           useClass: MockNgbModal
         }
       ],
       schemas: [NO_ERRORS_SCHEMA]
     }).compileComponents();
   }));

   beforeEach(() => {
     fixture = TestBed.createComponent(
       ExplorationSaveAndPublishButtonsComponent);
     component = fixture.componentInstance;

     changeListService = TestBed.inject(ChangeListService);
     contextService = TestBed.inject(ContextService);
     ngbModal = TestBed.inject(NgbModal);
     ics = TestBed.inject(InternetConnectivityService);
     explorationRightsService = TestBed.inject(ExplorationRightsService);
     explorationSaveService = TestBed.inject(ExplorationSaveService);
     explorationWarningsService = TestBed.inject(ExplorationWarningsService);
     spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
     editabilityService = TestBed.inject(EditabilityService);
     userExplorationPermissionsService = TestBed.inject(
       UserExplorationPermissionsService);

     let userPermissions = {
       canPublish: true
     };
     fetchPermissionsAsyncSpy = spyOn(
       userExplorationPermissionsService, 'fetchPermissionsAsync');
     fetchPermissionsAsyncSpy.and
       .returnValue(Promise.resolve(userPermissions as ExplorationPermissions));

     spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
       .returnValue(Promise.resolve({
         canPublish: true
       } as ExplorationPermissions));
     spyOnProperty(ics, 'onInternetStateChange').and.returnValue(
       mockConnectionServiceEmitter);
     spyOn(explorationSaveService, 'saveChangesAsync').and
       .callFake((showCallback, hideCallback) => {
         showCallback();
         hideCallback();
         return Promise.resolve();
       });
     spyOn(explorationSaveService, 'showPublishExplorationModal').and
       .callFake((showCallback, hideCallback) => {
         showCallback();
         hideCallback();
         return Promise.resolve();
       });

     component.ngOnInit();
   });

   afterEach(() => {
     component.ngOnDestroy();
   });

   it('should initialize component properties after controller initialization',
     () => {
       expect(component.saveIsInProcess).toBe(false);
       expect(component.publishIsInProcess).toBe(false);
       expect(component.loadingDotsAreShown).toBe(false);
     });

   it('should save exploration when saving changes', fakeAsync(() => {
     component.saveChanges();
     tick();

     expect(component.saveIsInProcess).toBe(false);
     expect(component.loadingDotsAreShown).toBe(false);
   }));

   it('should check if exploration is editable', () => {
     spyOn(editabilityService, 'isLockedByAdmin').and.returnValue(true);
     expect(component.isLockedByAdmin()).toBe(true);
   });

   it('should publish exploration when show publish exploration is shown',
     fakeAsync(() => {
       component.showPublishExplorationModal();
       tick();

       expect(component.publishIsInProcess).toBe(false);
       expect(component.loadingDotsAreShown).toBe(false);
     }));

   it('should resolve the warnings before saving exploration when exploration' +
     ' has critical warnings', () => {
     spyOn(explorationWarningsService, 'hasCriticalWarnings').and.returnValue(
       true);

     expect(component.getSaveButtonTooltip())
       .toBe('Please resolve the warnings.');
   });

   it('should save exploration draft when it has no warnings and exploration' +
     ' is private', () => {
     spyOn(explorationWarningsService, 'hasCriticalWarnings')
       .and.returnValue(false);
     spyOn(explorationRightsService, 'isPrivate').and.returnValue(true);

     expect(component.getSaveButtonTooltip()).toBe('Save Draft');
   });

   it('should publish exploration changes when it has no warnings and it is' +
     ' public', () => {
     spyOn(explorationWarningsService, 'hasCriticalWarnings').and
       .returnValue(false);
     spyOn(explorationRightsService, 'isPrivate').and.returnValue(false);
     expect(component.getSaveButtonTooltip()).toBe('Publish Changes');
   });

   it('should ask user to resolve the warnings before publishing' +
     ' exploration when exploration has warnings', () => {
     spyOn(explorationWarningsService, 'countWarnings').and.returnValue(1);
     expect(component.getPublishExplorationButtonTooltip()).toBe(
       'Please resolve the warnings before publishing.');
   });

   it('should save exploration changes before publishing it when trying to' +
     ' publish a changed exploration without saving it first', () => {
     spyOn(explorationWarningsService, 'countWarnings').and.returnValue(0);
     spyOn(changeListService, 'isExplorationLockedForEditing').and
       .returnValue(true);
     expect(component.getPublishExplorationButtonTooltip()).toBe(
       'Please save your changes before publishing.');
   });

   it('should publish exploration when it is already saved', () => {
     spyOn(explorationWarningsService, 'countWarnings').and.returnValue(0);
     spyOn(changeListService, 'isExplorationLockedForEditing')
       .and.returnValue(false);
     expect(component.getPublishExplorationButtonTooltip()).toBe(
       'Publish to Oppia Library');
   });

   it('should discard changes when exploration is changed', () => {
     spyOn(explorationSaveService, 'discardChanges');
     component.discardChanges();
     expect(explorationSaveService.discardChanges).toHaveBeenCalled();
   });

   it('should get whether exploration is saveable', () => {
     spyOn(explorationSaveService, 'isExplorationSaveable')
       .and.returnValue(true);
     expect(component.isExplorationSaveable()).toBe(true);
   });

   it('should count changes made in an exploration', () => {
     spyOn(changeListService, 'getChangeList').and.returnValue(
       [{}, {}] as ExplorationChange[]);
     expect(component.getChangeListLength()).toBe(2);
   });

   it('should save or publish exploration when editing outside tutorial mode' +
     ' and exploration is translatable', () => {
     spyOn(editabilityService, 'isEditableOutsideTutorialMode').and
       .returnValue(false);
     spyOn(editabilityService, 'isTranslatable').and.returnValue(true);
     expect(component.isEditableOutsideTutorialMode()).toBe(true);
   });

   it('should save or publish exploration when editing outside tutorial mode' +
     ' and exploration is not translatable', () => {
     spyOn(editabilityService, 'isEditableOutsideTutorialMode').and
       .returnValue(true);
     spyOn(editabilityService, 'isTranslatable').and.returnValue(false);
     expect(component.isEditableOutsideTutorialMode()).toBe(true);
   });

   it('should not save and publish exploration when editing inside tutorial' +
     ' mode and exploration is not translatable', () => {
     spyOn(editabilityService, 'isEditableOutsideTutorialMode').and
       .returnValue(false);
     spyOn(editabilityService, 'isTranslatable').and.returnValue(false);
     expect(component.isEditableOutsideTutorialMode()).toBe(false);
   });

   it('should display publish button when the exploration is unpublished',
     fakeAsync(() => {
       component.explorationCanBePublished = false;

       userExplorationPermissionsService.
         onUserExplorationPermissionsFetched.emit();
       tick();

       expect(userExplorationPermissionsService.getPermissionsAsync)
         .toHaveBeenCalled();
       expect(component.explorationCanBePublished).toBe(true);
     }));

   it('should fetch userExplorationPermissions when ' +
     'showPublishExplorationModal is called', fakeAsync(() => {
     let userPermissions = {
       canPublish: true
     };
     component.explorationCanBePublished = false;
     fetchPermissionsAsyncSpy.and
       .returnValue(Promise.resolve(userPermissions as ExplorationPermissions));

     component.showPublishExplorationModal();
     tick();

     expect(component.publishIsInProcess).toBe(false);
     expect(component.loadingDotsAreShown).toBe(false);
     expect(userExplorationPermissionsService.fetchPermissionsAsync)
       .toHaveBeenCalled();
     expect(component.explorationCanBePublished).toBe(true);
   }));

   it('should open a exploration save prompt modal', fakeAsync(() => {
     spyOn(changeListService, 'getChangeList').and.returnValue(new Array(51));
     spyOn(ngbModal, 'open').and.returnValue({
       result: Promise.resolve()
     } as NgbModalRef);
     spyOn(component, 'saveChanges');

     component.saveIsInProcess = false;
     component.getChangeListLength();
     tick();

     expect(ngbModal.open).toHaveBeenCalled();
     expect(component.saveChanges).toHaveBeenCalled();
   }));

   it('should open a exploration save prompt modal only once',
     fakeAsync(() => {
       spyOn(changeListService, 'getChangeList').and.returnValue(new Array(51));
       spyOn(ngbModal, 'open').and.returnValue({
         result: Promise.reject()
       } as NgbModalRef);
       spyOn(component, 'saveChanges');

       component.saveIsInProcess = false;
       component.getChangeListLength();
       tick();

       expect(ngbModal.open).toHaveBeenCalledTimes(1);
       expect(component.saveChanges).not.toHaveBeenCalled();

       component.getChangeListLength();
       tick();

       expect(ngbModal.open).toHaveBeenCalledTimes(1);
       expect(component.saveChanges).not.toHaveBeenCalled();
     }));

   it('should open a confirmation modal with rejection', fakeAsync(() => {
     spyOn(changeListService, 'getChangeList').and.returnValue(new Array(51));
     spyOn(ngbModal, 'open').and.returnValue({
       result: Promise.reject()
     } as NgbModalRef);
     spyOn(component, 'saveChanges');
     component.saveIsInProcess = false;

     component.getChangeListLength();
     tick();

     expect(ngbModal.open).toHaveBeenCalled();
     expect(component.saveChanges).not.toHaveBeenCalled();
   }));

   it('should change connnection status to ONLINE when internet is connected',
     () => {
       component.connectedToInternet = false;
       mockConnectionServiceEmitter.emit(true);

       expect(component.connectedToInternet).toBe(true);
     });

   it('should change connnection status to OFFLINE when internet disconnects',
     () => {
       component.connectedToInternet = true;
       mockConnectionServiceEmitter.emit(false);

       expect(component.connectedToInternet).toBe(false);
       expect(component.getSaveButtonTooltip()).toBe(
         'You can not save the exploration when offline.');
       expect(component.getPublishExplorationButtonTooltip()).toBe(
         'You can not publish the exploration when offline.');
     });
});
