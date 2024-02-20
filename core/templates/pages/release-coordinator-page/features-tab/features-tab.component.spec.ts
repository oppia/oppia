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
 * @fileoverview Unit tests for the feature tab in release coordinator page.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, async, TestBed, flushMicrotasks, tick } from
  '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import cloneDeep from 'lodash/cloneDeep';

import { FeaturesTabComponent } from
  'pages/release-coordinator-page/features-tab/features-tab.component';
import { FeatureFlagDummyBackendApiService } from
  'domain/feature-flag/feature-flag-dummy-backend-api.service';
import { FeatureFlagBackendApiService, FeatureFlagsResponse } from
  'domain/feature-flag/feature-flag-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { FeatureStage } from 'domain/platform-parameter/platform-parameter.model';
import { FeatureFlag } from 'domain/feature-flag/feature-flag.model';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { HttpErrorResponse } from '@angular/common/http';


let dummyFeatureStatus = false;
const mockDummyFeatureFlagForE2ETestsStatus = (status: boolean) => {
  dummyFeatureStatus = status;
};

class MockPlatformFeatureService {
  get status() {
    return {
      DummyFeatureFlagForE2ETests: {
        get isEnabled() {
          return dummyFeatureStatus;
        }
      }
    };
  }
}

describe('Release coordinator page feature tab', function() {
  let component: FeaturesTabComponent;
  let fixture: ComponentFixture<FeaturesTabComponent>;
  let featureApiService: FeatureFlagBackendApiService;
  let windowRef: WindowRef;

  let updateApiSpy: jasmine.Spy;

  let mockConfirmResult: (val: boolean) => void;

  beforeEach(async(() => {
    TestBed
      .configureTestingModule({
        imports: [FormsModule, HttpClientTestingModule],
        declarations: [FeaturesTabComponent],
        providers: [
          {
            provide: PlatformFeatureService,
            useClass: MockPlatformFeatureService
          }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      })
      .compileComponents();

    fixture = TestBed.createComponent(FeaturesTabComponent);
    component = fixture.componentInstance;
    featureApiService = TestBed.get(FeatureFlagBackendApiService);
    windowRef = TestBed.get(WindowRef);

    let confirmResult = true;
    let promptResult: string | null = 'mock msg';
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      confirm: () => confirmResult,
      prompt: () => promptResult,
      alert: () => null
    } as unknown as Window);
    mockConfirmResult = val => confirmResult = val;

    spyOn(featureApiService, 'getFeatureFlags').and.resolveTo({
      featureFlags: [
        FeatureFlag.createFromBackendDict({
          description: 'This is a dummy feature flag.',
          feature_stage: FeatureStage.DEV,
          name: 'dummy_feature_flag_for_e2e_tests',
          force_enable_for_all_users: false,
          rollout_percentage: 0,
          user_group_ids: [],
          last_updated: null
        })
      ],
      serverStage: 'dev'
    } as FeatureFlagsResponse);

    updateApiSpy = spyOn(featureApiService, 'updateFeatureFlag')
      .and.resolveTo();

    component.ngOnInit();
  }));

  it('should load feature flags on init', () => {
    expect(component.featureFlags.length).toBe(1);
    expect(component.featureFlags[0].name).toEqual(
      'dummy_feature_flag_for_e2e_tests');
  });

  describe('.clearChanges', () => {
    it('should clear changes', () => {
      const featureFlag = component.featureFlags[0];

      featureFlag.forceEnableForAllUsers = true;
      component.clearChanges(featureFlag);

      expect(featureFlag.forceEnableForAllUsers).toBeFalse();
    });

    it('should not proceed if the user doesn\'t confirm', () => {
      mockConfirmResult(false);
      const featureFlag = component.featureFlags[0];

      expect(featureFlag.forceEnableForAllUsers).toBeFalse();

      featureFlag.forceEnableForAllUsers = true;
      component.clearChanges(featureFlag);

      expect(featureFlag.forceEnableForAllUsers).toBeTrue();
    });
  });

  describe('.getSchema', () => {
    it('should return the schema for rollout-percentage', () => {
      expect(component.getSchema()).toEqual(
        {
          type: 'int',
          validators: [{
            id: 'is_at_least',
            min_value: 1
          }, {
            id: 'is_at_most',
            max_value: 100
          }]
        }
      );
    });
  });

  describe('.getLastUpdatedDate', () => {
    it('should return the string when the feature has not been ' +
    'updated yet', (() => {
      expect(component.getLastUpdatedDate(
        component.featureFlags[0])).toEqual(
        'The feature has not been updated yet.');
    }));

    it('should return the human readable last updated string from date-time ' +
    'object string', () => {
      let featureFlag = FeatureFlag.createFromBackendDict({
        description: 'This is a dummy feature flag.',
        feature_stage: FeatureStage.PROD,
        name: 'dummy_feature_flag_for_e2e_tests',
        force_enable_for_all_users: false,
        rollout_percentage: 0,
        user_group_ids: [],
        last_updated: '08/17/2023, 15:30:45:123456'
      });

      expect(component.getLastUpdatedDate(featureFlag)).toEqual(
        'Aug 17, 2023');
    });
  });

  describe('.getFeatureStageString()', () => {
    it('should return text for dev feature stage', () => {
      expect(component.getFeatureStageString(
        component.featureFlags[0])).toBe(
        'Dev (can only be enabled on dev server).');
    });

    it('should return text for test feature stage', () => {
      let featureFlagTestStage = FeatureFlag.createFromBackendDict({
        description: 'This is a dummy feature flag.',
        feature_stage: FeatureStage.TEST,
        name: 'dummy_feature_flag_for_e2e_tests',
        force_enable_for_all_users: false,
        rollout_percentage: 0,
        user_group_ids: [],
        last_updated: null
      });
      expect(component.getFeatureStageString(
        featureFlagTestStage)).toBe(
        'Test (can only be enabled on dev and test server).');
    });

    it('should return text for prod feature stage', () => {
      let featureFlagProdStage = FeatureFlag.createFromBackendDict({
        description: 'This is a dummy feature flag.',
        feature_stage: FeatureStage.PROD,
        name: 'dummy_feature_flag_for_e2e_tests',
        force_enable_for_all_users: false,
        rollout_percentage: 0,
        user_group_ids: [],
        last_updated: null
      });
      expect(component.getFeatureStageString(
        featureFlagProdStage)).toBe(
        'Prod (can only be enabled on dev, test and prod server).');
    });
  });

  describe('.getFeatureValidOnCurrentServer', () => {
    let featureFlagDevStage = FeatureFlag.createFromBackendDict({
      description: 'This is a dummy feature flag.',
      feature_stage: FeatureStage.DEV,
      name: 'dummy_feature_flag_for_e2e_tests',
      force_enable_for_all_users: false,
      rollout_percentage: 0,
      user_group_ids: [],
      last_updated: null
    });

    let featureFlagProdStage = FeatureFlag.createFromBackendDict({
      description: 'This is a dummy feature flag.',
      feature_stage: FeatureStage.PROD,
      name: 'dummy_feature_flag_for_e2e_tests',
      force_enable_for_all_users: false,
      rollout_percentage: 0,
      user_group_ids: [],
      last_updated: null
    });

    afterEach(() => {
      component.serverStage = '';
    });

    it('should return true when the server in dev stage and feature ' +
    'stage is dev too', (() => {
      component.serverStage = 'dev';

      expect(component.getFeatureValidOnCurrentServer(
        featureFlagDevStage)).toBe(true);
    }));

    it('should return false when the server in test stage and feature ' +
    'stage is dev', (() => {
      component.serverStage = 'test';

      expect(component.getFeatureValidOnCurrentServer(
        featureFlagDevStage)).toBe(false);
    }));

    it('should return true when the server in test stage and feature ' +
    'stage is prod', (() => {
      component.serverStage = 'test';

      expect(component.getFeatureValidOnCurrentServer(
        featureFlagProdStage)).toBe(true);
    }));

    it('should return true when the server in prod stage and feature ' +
    'stage is prod', (() => {
      component.serverStage = 'prod';

      expect(component.getFeatureValidOnCurrentServer(
        featureFlagProdStage)).toBe(true);
    }));

    it('should return false when the server in prod stage and feature ' +
    'stage is dev', (() => {
      component.serverStage = 'prod';

      expect(component.getFeatureValidOnCurrentServer(
        featureFlagDevStage)).toBe(false);
    }));

    it('should return false when the server stage is unknown', (() => {
      component.serverStage = 'unknown';

      expect(component.getFeatureValidOnCurrentServer(
        featureFlagDevStage)).toBe(false);
    }));
  });

  describe('.updateFeatureFlag', () => {
    let setStatusSpy: jasmine.Spy;

    beforeEach(() => {
      setStatusSpy = jasmine.createSpy();
      setStatusSpy = spyOn(component.setStatusMessage, 'emit');
    });

    it('should update the feature', fakeAsync(() => {
      mockConfirmResult(true);

      const featureFlag = component.featureFlags[0];

      featureFlag.userGroupIds = ['user_group_1'];
      component.updateFeatureFlag(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).toHaveBeenCalledWith(
        featureFlag.name, featureFlag.forceEnableForAllUsers,
        featureFlag.rolloutPercentage, featureFlag.userGroupIds
      );
      expect(setStatusSpy).toHaveBeenCalledWith('Saved successfully.');
    }));

    it('should update feature backup after update succeeds', fakeAsync(() => {
      mockConfirmResult(true);

      const featureFlag = component.featureFlags[0];

      featureFlag.userGroupIds = ['user_group_1'];
      component.updateFeatureFlag(featureFlag);

      flushMicrotasks();

      expect(component.featureFlagNameToBackupMap.get(featureFlag.name))
        .toEqual(featureFlag);
    }));

    it('should not update feature backup if update fails', fakeAsync(() => {
      mockConfirmResult(true);
      const errorResponse = new HttpErrorResponse({
        error: 'Error loading exploration 1.',
        status: 500,
        statusText: 'Internal Server Error'
      });
      updateApiSpy.and.rejectWith(errorResponse);

      const featureFlag = component.featureFlags[0];
      const originalFeatureFlag = cloneDeep(featureFlag);

      featureFlag.userGroupIds = ['user_group_1'];
      component.updateFeatureFlag(featureFlag);

      flushMicrotasks();

      expect(component.featureFlagNameToBackupMap.get(featureFlag.name))
        .toEqual(originalFeatureFlag);
    }));

    it('should not proceed if the user cancels the prompt', fakeAsync(
      () => {
        mockConfirmResult(false);

        const featureFlag = component.featureFlags[0];

        featureFlag.userGroupIds = ['user_group_1'];
        component.updateFeatureFlag(featureFlag);

        flushMicrotasks();

        expect(updateApiSpy).not.toHaveBeenCalled();
        expect(setStatusSpy).not.toHaveBeenCalled();
      })
    );

    it('should not proceed if there is any validation issue', fakeAsync(() => {
      mockConfirmResult(true);

      const featureFlag = component.featureFlags[0];

      featureFlag.rolloutPercentage = 110;
      component.updateFeatureFlag(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).not.toHaveBeenCalled();
      expect(setStatusSpy).not.toHaveBeenCalled();
    }));

    it('should show error if the update fails', fakeAsync(() => {
      mockConfirmResult(true);

      const errorResponse = new HttpErrorResponse({
        error: 'Error loading exploration 1.',
        status: 500,
        statusText: 'Internal Server Error'
      });
      updateApiSpy.and.rejectWith(errorResponse);
      const featureFlag = component.featureFlags[0];

      featureFlag.userGroupIds = ['user_group_1'];
      component.updateFeatureFlag(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).toHaveBeenCalled();
      expect(setStatusSpy).toHaveBeenCalledWith('Update failed.');
    }));

    it('should show error if the update fails', fakeAsync(() => {
      mockConfirmResult(true);

      const errorResponse = new HttpErrorResponse({
        error: {
          error: 'validation error.'
        },
        status: 500,
        statusText: 'Internal Server Error'
      });
      updateApiSpy.and.rejectWith(errorResponse);
      const featureFlag = component.featureFlags[0];

      featureFlag.userGroupIds = ['user_group_1'];
      component.updateFeatureFlag(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).toHaveBeenCalled();
      expect(setStatusSpy).toHaveBeenCalledWith(
        'Update failed: validation error.');
    }));

    it('should throw error if error resonse is unexpected', fakeAsync(() => {
      mockConfirmResult(true);

      updateApiSpy.and.rejectWith('Error');
      const featureFlag = component.featureFlags[0];

      expect(() => {
        component.updateFeatureFlag(featureFlag);
        tick();
      }).toThrowError();
    }));
  });

  describe('.isFeatureFlagChanged', () => {
    it('should return false if the feature is the same as the backup instance',
      () => {
        const featureFlag = component.featureFlags[0];

        expect(component.isFeatureFlagChanged(featureFlag))
          .toBeFalse();
      }
    );

    it(
      'should return true if the feature is different from the backup instance',
      () => {
        const featureFlag = component.featureFlags[0];

        featureFlag.userGroupIds = ['user_group_1'];

        expect(component.isFeatureFlagChanged(featureFlag))
          .toBeTrue();
      }
    );

    it('should throw error if the feature name is not found', () => {
      const featureFlag = FeatureFlag.createFromBackendDict({
        description: 'This is a dummy feature flag.',
        feature_stage: FeatureStage.DEV,
        name: 'invalid',
        force_enable_for_all_users: false,
        rollout_percentage: 0,
        user_group_ids: [],
        last_updated: null
      });

      expect(() => {
        component.isFeatureFlagChanged(featureFlag);
      }).toThrowError();
    });
  });

  describe('.validateFeatureFlag', () => {
    it('should return empty array if no issue', () => {
      const issues = component.validateFeatureFlag(
        FeatureFlag.createFromBackendDict({
          description: 'This is a dummy feature flag.',
          feature_stage: FeatureStage.DEV,
          name: 'dummy_feature_flag_for_e2e_tests',
          force_enable_for_all_users: false,
          rollout_percentage: 0,
          user_group_ids: [],
          last_updated: null
        })
      );

      expect(issues).toEqual([]);
    });

    it('should return issues if rollout percentage is not between 10 and 100',
      () => {
        const issues = component.validateFeatureFlag(
          FeatureFlag.createFromBackendDict({
            description: 'This is a dummy feature flag.',
            feature_stage: FeatureStage.DEV,
            name: 'dummy_feature_flag_for_e2e_tests',
            force_enable_for_all_users: false,
            rollout_percentage: 110,
            user_group_ids: [],
            last_updated: null
          })
        );

        expect(issues).toEqual(
          ['Rollout percentage should be between 0 to 100.']);
      });
  });

  describe('.dummyFeatureFlagForE2eTestsIsEnabled', () => {
    it('should return true when dummy feature is enabled', () => {
      mockDummyFeatureFlagForE2ETestsStatus(true);
      expect(component.dummyFeatureFlagForE2eTestsIsEnabled).toBeTrue();
    });

    it('should return false when dummy feature is disabled', () => {
      mockDummyFeatureFlagForE2ETestsStatus(false);
      expect(component.dummyFeatureFlagForE2eTestsIsEnabled).toBeFalse();
    });
  });

  describe('.reloadDummyHandlerStatusAsync', () => {
    let dummyApiService: FeatureFlagDummyBackendApiService;

    let dummyApiSpy: jasmine.Spy;

    beforeEach(() => {
      dummyApiService = TestBed.get(FeatureFlagDummyBackendApiService);

      dummyApiSpy = spyOn(dummyApiService, 'isHandlerEnabled')
        .and.resolveTo();
    });

    it('should not request dummy handler if the dummy feature is disabled',
      fakeAsync(() => {
        mockDummyFeatureFlagForE2ETestsStatus(false);

        component.reloadDummyHandlerStatusAsync();

        flushMicrotasks();

        expect(dummyApiSpy).not.toHaveBeenCalled();
      })
    );

    it('should request dummy handler if the dummy feature is enabled',
      fakeAsync(() => {
        mockDummyFeatureFlagForE2ETestsStatus(true);

        component.reloadDummyHandlerStatusAsync();

        flushMicrotasks();

        expect(dummyApiSpy).toHaveBeenCalled();
      })
    );
  });
});
