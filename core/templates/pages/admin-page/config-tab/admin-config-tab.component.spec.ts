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
 * @fileoverview Tests for Admin config tab component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { AdminBackendApiService, AdminPageData } from 'domain/admin/admin-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminTaskManagerService } from '../services/admin-task-manager.service';
import { AdminConfigTabComponent } from './admin-config-tab.component';

class MockWindowRef {
  nativeWindow = {
    confirm() {
      return true;
    },
    location: {
      hostname: 'hostname',
      href: 'href',
      pathname: 'pathname',
      search: 'search',
      hash: 'hash'
    },
    open() {
      return;
    }
  };
}

describe('Admin config tab component ', () => {
  let component: AdminConfigTabComponent;
  let fixture: ComponentFixture<AdminConfigTabComponent>;

  let adminBackendApiService: AdminBackendApiService;
  let adminTaskManagerService: AdminTaskManagerService;
  let mockWindowRef: MockWindowRef;


  let statusMessageSpy: jasmine.Spy;
  let confirmSpy: jasmine.Spy;

  const adminPageData: AdminPageData = {
    demoExplorationIds: ['expId'],
    demoExplorations: [
      [
        '0',
        'welcome.yaml'
      ]
    ],
    demoCollections: [
      ['collectionId']
    ],
    updatableRoles: ['MODERATOR'],
    roleToActions: {
      Admin: ['Accept any suggestion', 'Access creator dashboard']
    },
    configProperties: {
      configProperty1: {
        description: 'description1',
        schema: {
          type: 'custom',
          obj_type: 'CustomType',
        },
        value: 'val1'
      },
      configProperty2: {
        description: 'description2',
        schema: {
          type: 'custom',
          obj_type: 'CustomType',
        },
        value: 'val2'
      },
      configProperty3: {
        description: 'description3',
        schema: {
          type: 'custom',
          obj_type: 'CustomType',
        },
        value: 'val3'
      }
    },
    viewableRoles: ['MODERATOR'],
    humanReadableRoles: {
      MODERATOR: 'moderator'
    },
    topicSummaries: [],
    platformParameters: []
  };

  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [AdminConfigTabComponent],
      providers: [
        AdminBackendApiService,
        AdminTaskManagerService,
        {
          provide: WindowRef,
          useValue: mockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminConfigTabComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    adminBackendApiService = TestBed.inject(AdminBackendApiService);
    adminTaskManagerService = TestBed.inject(AdminTaskManagerService);

    statusMessageSpy = spyOn(component.setStatusMessage, 'emit')
      .and.callThrough();
    spyOn(adminTaskManagerService, 'startTask').and.callThrough();
    spyOn(adminTaskManagerService, 'finishTask').and.callThrough();
    spyOn(adminBackendApiService, 'getDataAsync').and.resolveTo(adminPageData);
    confirmSpy = spyOn(mockWindowRef.nativeWindow, 'confirm');
  });

  it('should reload config properties when initialized', fakeAsync(() => {
    expect(component.configProperties).toEqual({});

    component.ngOnInit();
    tick();

    expect(component.configProperties).toEqual(adminPageData.configProperties);
  }));

  it('should check whether an object is non empty when calling ' +
    '\'isNonemptyObject\'', () => {
    let result = component.isNonemptyObject({});
    expect(result).toBe(false);

    result = component.isNonemptyObject({description: 'description'});
    expect(result).toBe(true);
  });

  it('should return schema callback when calling ' +
    '\'getSchemaCallback\'', () => {
    let result = component.getSchemaCallback({type: 'bool'});
    expect(result()).toEqual({type: 'bool'});
  });

  describe('when clicking on revert to default button ', () => {
    it('should revert to default config property ' +
      'successfully', fakeAsync(() => {
      // Setting confirm button clicked to be true.
      confirmSpy.and.returnValue(true);
      spyOn(adminBackendApiService, 'revertConfigPropertyAsync')
        .and.returnValue(Promise.resolve());

      component.revertToDefaultConfigPropertyValue('configId1');
      tick();

      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Config property reverted successfully.');
    }));

    it('should not revert to default config property ' +
      'in case of backend error', fakeAsync(() => {
      // Setting confirm button clicked to be true.
      confirmSpy.and.returnValue(true);
      spyOn(adminBackendApiService, 'revertConfigPropertyAsync')
        .and.returnValue(Promise.reject('Internal Server Error.'));

      component.revertToDefaultConfigPropertyValue('configId1');
      tick();

      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Server error: Internal Server Error.');
    }));

    it('should not request backend to revert to default config property ' +
      'if cancel button is clicked in the alert', fakeAsync(() => {
      // Setting confirm button clicked to be false.
      confirmSpy.and.returnValue(false);
      let revertConfigSpy = spyOn(
        adminBackendApiService, 'revertConfigPropertyAsync');

      component.revertToDefaultConfigPropertyValue('configId1');
      tick();

      expect(revertConfigSpy).not.toHaveBeenCalled();
    }));
  });

  describe('when clicking on save button ', () => {
    it('should save config properties successfully', fakeAsync(() => {
      // Setting confirm button clicked to be true.
      confirmSpy.and.returnValue(true);
      spyOn(adminBackendApiService, 'saveConfigPropertiesAsync')
        .and.returnValue(Promise.resolve());

      component.configProperties = adminPageData.configProperties;
      component.saveConfigProperties();
      tick();

      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Data saved successfully.');
    }));

    it('should not save config properties ' +
      'in case of backend error', fakeAsync(() => {
      // Setting confirm button clicked to be true.
      confirmSpy.and.returnValue(true);
      spyOn(adminBackendApiService, 'saveConfigPropertiesAsync')
        .and.returnValue(Promise.reject('Internal Server Error.'));

      component.saveConfigProperties();
      tick();

      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Server error: Internal Server Error.');
    }));

    it('should not save config properties ' +
      'if a task is still running in the queue', fakeAsync(() => {
      // Setting task is still running to be true.
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);
      let saveConfigSpy = spyOn(
        adminBackendApiService, 'saveConfigPropertiesAsync');

      component.saveConfigProperties();
      tick();

      expect(saveConfigSpy).not.toHaveBeenCalled();
    }));

    it('should not request backend to save config properties ' +
      'if cancel button is clicked in the alert', fakeAsync(() => {
      // Setting confirm button clicked to be false.
      confirmSpy.and.returnValue(false);
      let saveConfigSpy = spyOn(
        adminBackendApiService, 'saveConfigPropertiesAsync');

      component.saveConfigProperties();
      tick();

      expect(saveConfigSpy).not.toHaveBeenCalled();
    }));
  });
});
