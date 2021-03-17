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
 * @fileoverview Unit tests for the admin dev mode activities tab component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'components/material.module';

import { AdminBackendApiService, AdminPageData } from 'domain/admin/admin-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminDataService } from '../services/admin-data.service';
import { AdminTaskManagerService } from '../services/admin-task-manager.service';
import { AdminDevModeActivitiesTabComponent } from './admin-dev-mode-activities-tab.component';

let loadNewStructuresData: boolean = true;
let generateNewSkillData: boolean = true;

class MockAdminBackendApiService {
  private reloadExplorationAsync(explorationId: string) {
    return {
      then: (
          succesCallback: () => void,
          errorCallback: (err: object) => void
      ) => {
        if (explorationId === 'expId') {
          succesCallback();
        }
        if (errorCallback) {
          errorCallback({
            data: {
              error: 'Exploration not found.'
            }
          });
        }
      }
    };
  }

  private generateDummyExplorationsAsync(
      numDummyExpsToGenerate: number, numDummyExpsToPublish: number) {
    return {
      then: (
          succesCallback: () => void,
          errorCallback: (err: object) => void
      ) => {
        if (numDummyExpsToGenerate === 2 && numDummyExpsToPublish === 1) {
          succesCallback();
        }
        if (errorCallback) {
          errorCallback({
            data: {
              error: 'Dummy explorations not generated.'
            }
          });
        }
      }
    };
  }

  private generateDummyNewStructuresDataAsync() {
    return {
      then: (
          succesCallback: () => void,
          errorCallback: (err: object) => void
      ) => {
        if (loadNewStructuresData) {
          succesCallback();
        }
        if (errorCallback) {
          errorCallback({
            data: {
              error: 'New structures not generated.'
            }
          });
        }
      }
    };
  }

  private generateDummyNewSkillDataAsync() {
    return {
      then: (
          succesCallback: () => void,
          errorCallback: (err: object) => void
      ) => {
        if (generateNewSkillData) {
          succesCallback();
        }
        if (errorCallback) {
          errorCallback({
            data: {
              error: 'New skill data not generated.'
            }
          });
        }
      }
    };
  }

  private reloadCollectionAsync(collectionId: string) {
    return {
      then: (
          succesCallback: () => void,
          errorCallback: (err: object) => void
      ) => {
        if (collectionId === 'collectionId') {
          succesCallback();
        }
        if (errorCallback) {
          errorCallback({
            data: {
              error: 'Wrong collection ID.'
            }
          });
        }
      }
    };
  }
}

describe('Admin dev mode activities tab', () => {
  let component: AdminDevModeActivitiesTabComponent;
  let fixture: ComponentFixture<AdminDevModeActivitiesTabComponent>;
  let adminDataService: AdminDataService;
  let adminTaskManagerService: AdminTaskManagerService;
  let windowRef: WindowRef;
  let adminDataObject = {
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
  } as AdminPageData;
  let mockConfirmResult: (val: boolean) => void;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: AdminBackendApiService,
          useClass: MockAdminBackendApiService
        },
      ],
      declarations: [
        AdminDevModeActivitiesTabComponent
      ]
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AdminDevModeActivitiesTabComponent);
    component = fixture.componentInstance;
    adminDataService = TestBed.get(AdminDataService);
    adminTaskManagerService = TestBed.get(AdminTaskManagerService);
    windowRef = TestBed.get(WindowRef);

    spyOn(adminDataService, 'getDataAsync').and.resolveTo(adminDataObject);

    let confirmResult = true;
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      confirm: () => confirmResult
    });

    mockConfirmResult = (val) => {
      confirmResult = val;
    };

    fixture.detectChanges();
    component.ngOnInit();
  }));

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize data correctly', () => {
    expect(component.reloadingAllExplorationPossible).toEqual(true);
    expect(component.demoExplorationIds).toEqual(['expId']);
    expect(component.DEMO_COLLECTIONS).toEqual([['collectionId']]);
    expect(component.DEMO_EXPLORATIONS).toEqual([['0', 'welcome.yaml']]);
  });

  describe('.reloadExploration', () => {
    it('should not reload a specific exploration if task is running', () => {
      spyOn(
        adminTaskManagerService, 'isTaskRunning').and.returnValue(true);
      expect(component.reloadExploration('expId')).toBeUndefined();
    });

    it('should not procees if user doesn\'t confirm', () => {
      mockConfirmResult(false);
      expect(component.reloadExploration('expId')).toBeUndefined();
    });

    it('should load explorations', () => {
      const expId = component.demoExplorationIds[0];
      component =
        component as jasmine.SpyObj<AdminDevModeActivitiesTabComponent>;

      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
      spyOn(component.setStatusMessage, 'emit');

      component.reloadExploration(expId);
      mockConfirmResult(true);

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Data reloaded successfully.');
    });

    it('should not load explorations with wrong exploration ID', () => {
      const expId = 'wrong-exp-id';
      component =
        component as jasmine.SpyObj<AdminDevModeActivitiesTabComponent>;

      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
      spyOn(component.setStatusMessage, 'emit');

      component.reloadExploration(expId);
      mockConfirmResult(true);

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Server error: Exploration not found.');
    });
  });

  describe('.printResult', () => {
    it('should print correct message when numTried' +
      'is less the number of exploration', () => {
      const numSucceeded = 0;
      const numFailed = 0;
      const numTried = 0;
      spyOn(component.setStatusMessage, 'emit');

      component.printResult(numSucceeded, numFailed, numTried);

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...0/1');
    });

    it('should print correct message when numTried' +
      'is not less than the number of exploration', () => {
      const numSucceeded = 1;
      const numFailed = 0;
      const numTried = 1;
      spyOn(component.setStatusMessage, 'emit');

      component.printResult(numSucceeded, numFailed, numTried);

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Reloaded 1 explorations: 1 succeeded, 0 failed.');
    });
  });

  describe('.reloadAllExplorations', () => {
    it('should not reload all exploration if' +
      'reloading all exploration is possible', () => {
      component.reloadingAllExplorationPossible = false;

      component.reloadAllExplorations();

      expect(component.reloadAllExplorations()).toBeUndefined();
    });

    it('should not reload all exploration if any task is running', () => {
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

      component.reloadAllExplorations();

      expect(component.reloadAllExplorations()).toBeUndefined();
    });

    it('should not reload all exploration without user\'s confirmation', () => {
      component.reloadAllExplorations();
      mockConfirmResult(false);

      expect(component.reloadAllExplorations()).toBeUndefined();
    });

    it('should reload all explorations', () => {
      const demoExplorationIds = ['expId'];
      component.demoExplorationIds = demoExplorationIds;
      component.reloadingAllExplorationPossible = true;
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
      spyOn(component.setStatusMessage, 'emit');

      component.reloadAllExplorations();
      mockConfirmResult(true);

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Reloaded 1 explorations: 1 succeeded, 0 failed.');
    });

    it('should not reload all exploration if exploration ID is wrong', () => {
      const demoExplorationIds = ['expId', 'wrongId'];
      component.demoExplorationIds = demoExplorationIds;
      component.reloadingAllExplorationPossible = true;
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
      spyOn(component.setStatusMessage, 'emit');

      component.reloadAllExplorations();
      mockConfirmResult(true);

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Reloaded 2 explorations: 1 succeeded, 1 failed.');
    });
  });

  describe('.generateDummyExploration', () => {
    it('should not generate dummy exploration if publish count is greater' +
      'than generate count', () => {
      component.numDummyExpsToPublish = 2;
      component.numDummyExpsToGenerate = 1;

      spyOn(component.setStatusMessage, 'emit');

      component.generateDummyExplorations();

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Publish count should be less than or equal to generate count');
    });

    it('should generate dummy explorations', () => {
      component.numDummyExpsToPublish = 1;
      component.numDummyExpsToGenerate = 2;

      spyOn(component.setStatusMessage, 'emit');

      component.generateDummyExplorations();

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Dummy explorations generated successfully.');
    });

    it('should show error message when dummy explorations' +
      'are not generated', () => {
      component.numDummyExpsToPublish = 2;
      component.numDummyExpsToGenerate = 2;

      spyOn(component.setStatusMessage, 'emit');

      component.generateDummyExplorations();

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Server error: Dummy explorations not generated.');
    });
  });

  describe('.loadNewStructuresData', () => {
    it('should generate structures data', () => {
      loadNewStructuresData = true;
      spyOn(component.setStatusMessage, 'emit');
      component.loadNewStructuresData();

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Dummy new structures data generated successfully.');
    });

    it('should show error message if new structues data' +
      'is not generated', () => {
      loadNewStructuresData = false;
      spyOn(component.setStatusMessage, 'emit');
      component.loadNewStructuresData();

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Server error: New structures not generated.');
    });
  });

  describe('.generateNewSkillData', () => {
    it('should generate structures data', () => {
      generateNewSkillData = true;
      spyOn(component.setStatusMessage, 'emit');
      component.generateNewSkillData();

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Dummy new skill and questions generated successfully.');
    });

    it('should show error message if new structues data' +
      'is not generated', () => {
      generateNewSkillData = false;
      spyOn(component.setStatusMessage, 'emit');
      component.generateNewSkillData();

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Server error: New skill data not generated.');
    });
  });

  describe('.reloadCollection', () => {
    it('should not reload collection if a task is already running', () => {
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

      expect(component.reloadCollection(component.DEMO_COLLECTIONS[0][0]))
        .toBeUndefined();
    });

    it('should not reload collection without user\'s confirmation', () => {
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
      component.reloadCollection(component.DEMO_COLLECTIONS[0][0]);
      mockConfirmResult(false);

      expect(component.reloadCollection(component.DEMO_COLLECTIONS[0][0]))
        .toBeUndefined();
    });

    it('should reload collection', () => {
      spyOn(component.setStatusMessage, 'emit');
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
      component.reloadCollection(component.DEMO_COLLECTIONS[0][0]);
      mockConfirmResult(true);

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Data reloaded successfully.');
    });

    it('should show error message is collection is not reloaded', () => {
      const wrongCollectionId = 'wrongCollectionId';
      spyOn(component.setStatusMessage, 'emit');
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
      component.reloadCollection(wrongCollectionId);
      mockConfirmResult(true);

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Server error: Wrong collection ID.');
    });
  });
});
