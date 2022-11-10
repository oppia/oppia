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
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from 'modules/material.module';

import { AdminBackendApiService, AdminPageData } from 'domain/admin/admin-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminDataService } from '../services/admin-data.service';
import { AdminTaskManagerService } from '../services/admin-task-manager.service';
import { AdminDevModeActivitiesTabComponent } from './admin-dev-mode-activities-tab.component';

describe('Admin dev mode activities tab', () => {
  let component: AdminDevModeActivitiesTabComponent;
  let fixture: ComponentFixture<AdminDevModeActivitiesTabComponent>;
  let adminBackendApiService: AdminBackendApiService;
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
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        AdminDevModeActivitiesTabComponent
      ]
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AdminDevModeActivitiesTabComponent);
    component = fixture.componentInstance;
    adminBackendApiService = TestBed.get(AdminBackendApiService);
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
      let adminBackendSpy = spyOn(
        adminBackendApiService, 'reloadExplorationAsync');
      spyOn(
        adminTaskManagerService, 'isTaskRunning').and.returnValue(true);
      expect(component.reloadExploration('expId')).toBeUndefined();
      expect(adminBackendSpy).not.toHaveBeenCalled();
    });

    it('should not procees if user doesn\'t confirm', () => {
      mockConfirmResult(false);

      let adminBackendSpy = spyOn(
        adminBackendApiService, 'reloadExplorationAsync');

      expect(component.reloadExploration('expId')).toBeUndefined();
      expect(adminBackendSpy).not.toHaveBeenCalled();
    });

    it('should load explorations', async(() => {
      const expId = component.demoExplorationIds[0];

      spyOn(adminBackendApiService, 'reloadExplorationAsync')
        .and.returnValue(Promise.resolve());
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
      spyOn(component.setStatusMessage, 'emit');

      mockConfirmResult(true);
      component.reloadExploration(expId);

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...');

      fixture.whenStable().then(() => {
        expect(component.setStatusMessage.emit)
          .toHaveBeenCalledWith('Data reloaded successfully.');
      });
    }));

    it('should not load explorations with wrong exploration ID', async(() => {
      const expId = 'wrong-exp-id';

      spyOn(adminBackendApiService, 'reloadExplorationAsync')
        .and.returnValue(Promise.reject('Exploration not found.'));
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
      spyOn(component.setStatusMessage, 'emit');

      mockConfirmResult(true);
      component.reloadExploration(expId);

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...');

      fixture.whenStable().then(() => {
        expect(component.setStatusMessage.emit)
          .toHaveBeenCalledWith('Server error: Exploration not found.');
      });
    }));
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
      'reloading all exploration is not possible', () => {
      component.reloadingAllExplorationPossible = false;
      let adminBackendSpy = spyOn(
        adminBackendApiService, 'reloadExplorationAsync');

      component.reloadAllExplorations();

      expect(adminBackendSpy).not.toHaveBeenCalled();
      expect(component.reloadAllExplorations()).toBeUndefined();
    });

    it('should not reload all exploration if any task is running', () => {
      let adminBackendSpy = spyOn(
        adminBackendApiService, 'reloadExplorationAsync');
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

      component.reloadAllExplorations();

      expect(component.reloadAllExplorations()).toBeUndefined();
      expect(adminBackendSpy).not.toHaveBeenCalled();
    });

    it('should not reload all exploration without user\'s confirmation', () => {
      let adminBackendSpy = spyOn(
        adminBackendApiService, 'reloadExplorationAsync');
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);

      component.reloadingAllExplorationPossible = true;
      mockConfirmResult(false);

      component.reloadAllExplorations();

      expect(component.reloadAllExplorations()).toBeUndefined();
      expect(adminBackendSpy).not.toHaveBeenCalled();
    });

    it('should reload all explorations', async(() => {
      const demoExplorationIds = ['expId'];
      component.demoExplorationIds = demoExplorationIds;
      component.reloadingAllExplorationPossible = true;

      spyOn(adminBackendApiService, 'reloadExplorationAsync')
        .and.returnValue(Promise.resolve());
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
      spyOn(component.setStatusMessage, 'emit');

      mockConfirmResult(true);
      component.reloadAllExplorations();

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...');

      fixture.whenStable().then(() => {
        expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
          'Reloaded 1 explorations: 1 succeeded, 0 failed.');
      });
    }));

    it('should not reload all exploration if exploration ID is wrong',
      async(() => {
        const demoExplorationIds = ['wrongId'];
        component.demoExplorationIds = demoExplorationIds;
        component.reloadingAllExplorationPossible = true;

        spyOn(adminBackendApiService, 'reloadExplorationAsync')
          .and.returnValue(Promise.reject('Exploration not found.'));
        spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
        spyOn(component.setStatusMessage, 'emit');

        mockConfirmResult(true);
        component.reloadAllExplorations();

        expect(component.setStatusMessage.emit)
          .toHaveBeenCalledWith('Processing...');

        fixture.whenStable().then(() => {
          expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
            'Reloaded 1 explorations: 0 succeeded, 1 failed.');
        });
      }));
  });

  describe('.generateDummyExploration', () => {
    it('should not generate dummy exploration if publish count is greater' +
      'than generate count', () => {
      let adminBackendSpy = spyOn(
        adminBackendApiService, 'generateDummyExplorationsAsync');

      component.numDummyExpsToPublish = 2;
      component.numDummyExpsToGenerate = 1;

      spyOn(component.setStatusMessage, 'emit');

      component.generateDummyExplorations();

      expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
        'Publish count should be less than or equal to generate count');
      expect(adminBackendSpy).not.toHaveBeenCalled();
    });

    it('should generate dummy explorations', async(() => {
      component.numDummyExpsToPublish = 1;
      component.numDummyExpsToGenerate = 2;

      spyOn(adminBackendApiService, 'generateDummyExplorationsAsync')
        .and.returnValue(Promise.resolve());
      spyOn(component.setStatusMessage, 'emit');

      component.generateDummyExplorations();

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...');

      fixture.whenStable().then(() => {
        expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
          'Dummy explorations generated successfully.');
      });
    }));

    it('should show error message when dummy explorations' +
      'are not generated', async(() => {
      component.numDummyExpsToPublish = 2;
      component.numDummyExpsToGenerate = 2;

      spyOn(adminBackendApiService, 'generateDummyExplorationsAsync')
        .and.returnValue(Promise.reject('Dummy explorations not generated.'));
      spyOn(component.setStatusMessage, 'emit');

      component.generateDummyExplorations();

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...');

      fixture.whenStable().then(() => {
        expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
          'Server error: Dummy explorations not generated.');
      });
    }));
  });

  describe('.loadNewStructuresData', () => {
    it('should generate structures data', async(() => {
      spyOn(adminBackendApiService, 'generateDummyNewStructuresDataAsync')
        .and.returnValue(Promise.resolve());
      spyOn(component.setStatusMessage, 'emit');
      component.loadNewStructuresData();

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...');

      fixture.whenStable().then(() => {
        expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
          'Dummy new structures data generated successfully.');
      });
    }));

    it('should show error message if new structues data' +
      'is not generated', async(() => {
      spyOn(adminBackendApiService, 'generateDummyNewStructuresDataAsync')
        .and.returnValue(Promise.reject('New structures not generated.'));
      spyOn(component.setStatusMessage, 'emit');
      component.loadNewStructuresData();

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...');

      fixture.whenStable().then(() => {
        expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
          'Server error: New structures not generated.');
      });
    }));
  });

  describe('.generateNewSkillData', () => {
    it('should generate structures data', async(() => {
      spyOn(adminBackendApiService, 'generateDummyNewSkillDataAsync')
        .and.returnValue(Promise.resolve());
      spyOn(component.setStatusMessage, 'emit');
      component.generateNewSkillData();

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...');

      fixture.whenStable().then(() => {
        expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
          'Dummy new skill and questions generated successfully.');
      });
    }));

    it('should show error message if new structues data' +
      'is not generated', async(() => {
      spyOn(adminBackendApiService, 'generateDummyNewSkillDataAsync')
        .and.returnValue(Promise.reject('New skill data not generated.'));
      spyOn(component.setStatusMessage, 'emit');
      component.generateNewSkillData();

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...');

      fixture.whenStable().then(() => {
        expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
          'Server error: New skill data not generated.');
      });
    }));
  });

  describe('.generateNewClassroom', () => {
    it('should generate classroom data', async(() => {
      spyOn(adminBackendApiService, 'generateDummyClassroomDataAsync')
        .and.returnValue(Promise.resolve());
      spyOn(component.setStatusMessage, 'emit');

      component.generateNewClassroom();

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...');

      // The status message changes after the completion of the asynchronous
      // call, thus the whenStable method is used to detect the changes and
      // validate accordingly.
      fixture.whenStable().then(() => {
        expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
          'Dummy new classroom generated successfully.');
      });
    }));

    it(
      'should show error message if new classroom data is not generated',
      async(() => {
        spyOn(adminBackendApiService, 'generateDummyClassroomDataAsync')
          .and.returnValue(Promise.reject('New classroom data not generated.'));
        spyOn(component.setStatusMessage, 'emit');
        component.generateNewClassroom();

        expect(component.setStatusMessage.emit)
          .toHaveBeenCalledWith('Processing...');

        // The status message changes after the completion of the asynchronous
        // call, thus the whenStable method is used to detect the changes and
        // validate accordingly.
        fixture.whenStable().then(() => {
          expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
            'Server error: New classroom data not generated.');
        });
      }));
  });

  describe('.reloadCollection', () => {
    it('should not reload collection if a task is already running', () => {
      let adminBackendSpy = spyOn(
        adminBackendApiService, 'reloadCollectionAsync');
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

      expect(component.reloadCollection(component.DEMO_COLLECTIONS[0][0]))
        .toBeUndefined();
      expect(adminBackendSpy).not.toHaveBeenCalled();
    });

    it('should not reload collection without user\'s confirmation', () => {
      let adminBackendSpy = spyOn(
        adminBackendApiService, 'reloadCollectionAsync');
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);

      mockConfirmResult(false);
      component.reloadCollection(component.DEMO_COLLECTIONS[0][0]);

      expect(component.reloadCollection(component.DEMO_COLLECTIONS[0][0]))
        .toBeUndefined();
      expect(adminBackendSpy).not.toHaveBeenCalled();
    });

    it('should reload collection', async(() => {
      spyOn(adminBackendApiService, 'reloadCollectionAsync')
        .and.returnValue(Promise.resolve());
      spyOn(component.setStatusMessage, 'emit');
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);

      mockConfirmResult(true);
      component.reloadCollection(component.DEMO_COLLECTIONS[0][0]);

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...');

      fixture.whenStable().then(() => {
        expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
          'Data reloaded successfully.');
      });
    }));

    it('should show error message is collection is not reloaded', async(() => {
      const wrongCollectionId = 'wrongCollectionId';

      spyOn(adminBackendApiService, 'reloadCollectionAsync')
        .and.returnValue(Promise.reject('Wrong collection ID.'));
      spyOn(component.setStatusMessage, 'emit');
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);

      mockConfirmResult(true);
      component.reloadCollection(wrongCollectionId);

      expect(component.setStatusMessage.emit)
        .toHaveBeenCalledWith('Processing...');

      fixture.whenStable().then(() => {
        expect(component.setStatusMessage.emit).toHaveBeenCalledWith(
          'Server error: Wrong collection ID.');
      });
    }));
  });
});
