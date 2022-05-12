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
 * @fileoverview Unit tests for the feature tab in admin page.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, async, TestBed, flushMicrotasks, tick } from
  '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import cloneDeep from 'lodash/cloneDeep';

import { AdminPageData } from 'domain/admin/admin-backend-api.service';
import { AdminFeaturesTabComponent } from
  'pages/admin-page/features-tab/admin-features-tab.component';
import { AdminDataService } from 'pages/admin-page/services/admin-data.service';
import { AdminTaskManagerService } from
  'pages/admin-page/services/admin-task-manager.service';
import { PlatformFeatureAdminBackendApiService } from
  'domain/platform_feature/platform-feature-admin-backend-api.service';
import { PlatformFeatureDummyBackendApiService } from
  'domain/platform_feature/platform-feature-dummy-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PlatformParameterFilterType, ServerMode } from
  'domain/platform_feature/platform-parameter-filter.model';
import { FeatureStage, PlatformParameter } from 'domain/platform_feature/platform-parameter.model';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { HttpErrorResponse } from '@angular/common/http';


let dummyFeatureStatus = false;
const mockDummyFeatureStatus = (status: boolean) => dummyFeatureStatus = status;

class MockPlatformFeatureService {
  get status() {
    return {
      DummyFeature: {
        get isEnabled() {
          return dummyFeatureStatus;
        }
      }
    };
  }
}

describe('Admin page feature tab', function() {
  let component: AdminFeaturesTabComponent;
  let fixture: ComponentFixture<AdminFeaturesTabComponent>;
  let adminDataService: AdminDataService;
  let featureApiService: PlatformFeatureAdminBackendApiService;
  let adminTaskManagerService: AdminTaskManagerService;
  let windowRef: WindowRef;

  let updateApiSpy: jasmine.Spy;

  let mockConfirmResult: (val: boolean) => void;
  let mockPromptResult: (msg: string | null) => void;

  beforeEach(async(() => {
    TestBed
      .configureTestingModule({
        imports: [FormsModule, HttpClientTestingModule],
        declarations: [AdminFeaturesTabComponent],
        providers: [
          {
            provide: PlatformFeatureService,
            useClass: MockPlatformFeatureService
          }
        ]
      })
      .compileComponents();

    fixture = TestBed.createComponent(AdminFeaturesTabComponent);
    component = fixture.componentInstance;
    adminDataService = TestBed.get(AdminDataService);
    featureApiService = TestBed.get(PlatformFeatureAdminBackendApiService);
    windowRef = TestBed.get(WindowRef);
    adminTaskManagerService = TestBed.get(AdminTaskManagerService);

    let confirmResult = true;
    let promptResult: string | null = 'mock msg';
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      confirm: () => confirmResult,
      prompt: () => promptResult,
      alert: () => null
    });
    mockConfirmResult = val => confirmResult = val;
    mockPromptResult = msg => promptResult = msg;

    spyOn(adminDataService, 'getDataAsync').and.resolveTo({
      featureFlags: [
        PlatformParameter.createFromBackendDict({
          data_type: 'bool',
          default_value: false,
          description: 'This is a dummy feature flag.',
          feature_stage: FeatureStage.DEV,
          is_feature: true,
          name: 'dummy_feature',
          rule_schema_version: 1,
          rules: [{
            filters: [
              {
                type: PlatformParameterFilterType.ServerMode,
                conditions: [['=', ServerMode.Dev]]
              }
            ],
            // This does not match the data type of feature flags, but this is
            // intended as string values are more suitable for
            // identifying rules in the following tests.
            value_when_matched: 'original',
          }],
        })
      ]
    } as AdminPageData);

    updateApiSpy = spyOn(featureApiService, 'updateFeatureFlag')
      .and.resolveTo();

    component.ngOnInit();
  }));

  it('should load feature flags on init', () => {
    expect(component.featureFlags.length).toBe(1);
    expect(component.featureFlags[0].name).toEqual('dummy_feature');
  });

  describe('.addNewRuleToTop', () => {
    it('should add new rule to top of rule list', () => {
      const featureFlag = component.featureFlags[0];

      expect(featureFlag.rules.length).toBe(1);

      component.addNewRuleToTop(featureFlag);
      expect(featureFlag.rules.length).toBe(2);
      expect(featureFlag.rules[1].valueWhenMatched).toEqual('original');
    });
  });

  describe('.addNewRuleToBottom', () => {
    it('should add new rule to bottom of rule list', () => {
      const featureFlag = component.featureFlags[0];

      expect(featureFlag.rules.length).toBe(1);

      component.addNewRuleToBottom(featureFlag);
      expect(featureFlag.rules.length).toBe(2);
      expect(featureFlag.rules[0].valueWhenMatched).toEqual('original');
    });
  });

  describe('.removeRule', () => {
    it('should remove rule', () => {
      const featureFlag = component.featureFlags[0];
      component.addNewRuleToBottom(featureFlag);
      featureFlag.rules[1].valueWhenMatched = '1';

      component.removeRule(featureFlag, 0);

      // Original rules order: ['original', '1']
      // Verifies it's ['1'] after removing 'original'.
      expect(featureFlag.rules.length).toBe(1);
      expect(featureFlag.rules[0].valueWhenMatched).toEqual('1');
    });
  });

  describe('.moveRuleUp', () => {
    it('should move rule up', () => {
      const featureFlag = component.featureFlags[0];
      component.addNewRuleToBottom(featureFlag);
      featureFlag.rules[1].valueWhenMatched = '1';
      component.addNewRuleToBottom(featureFlag);
      featureFlag.rules[2].valueWhenMatched = '2';

      component.moveRuleUp(featureFlag, 1);

      // Original rules order: ['original', '1', '2']
      // Verifies it's ['1', 'original', '2'] after removing '1' up.
      expect(featureFlag.rules[0].valueWhenMatched).toEqual('1');
      expect(featureFlag.rules[1].valueWhenMatched).toEqual('original');
      expect(featureFlag.rules[2].valueWhenMatched).toEqual('2');
    });
  });

  describe('.moveRuleDown', () => {
    it('should move rule down', () => {
      const featureFlag = component.featureFlags[0];
      component.addNewRuleToBottom(featureFlag);
      featureFlag.rules[1].valueWhenMatched = '1';
      component.addNewRuleToBottom(featureFlag);
      featureFlag.rules[2].valueWhenMatched = '2';

      component.moveRuleDown(featureFlag, 1);

      // Original rules order: ['original', '1', '2']
      // Verifies it's ['original', '2', '1'] after removing '1' down.
      expect(featureFlag.rules[0].valueWhenMatched).toEqual('original');
      expect(featureFlag.rules[1].valueWhenMatched).toEqual('2');
      expect(featureFlag.rules[2].valueWhenMatched).toEqual('1');
    });
  });

  describe('.addNewFilter', () => {
    it('should add new filter', () => {
      const rule = component.featureFlags[0].rules[0];

      expect(rule.filters.length).toBe(1);

      component.addNewFilter(rule);
      rule.filters[1].type = PlatformParameterFilterType.AppVersion;

      expect(rule.filters.length).toBe(2);
      // Original filter list: ['server_mode']
      // Verifies it's ['server_mode', 'app_version'] after adding a new filter
      // to the end.
      expect(rule.filters[0].type)
        .toEqual(PlatformParameterFilterType.ServerMode);
      expect(rule.filters[1].type)
        .toEqual(PlatformParameterFilterType.AppVersion);
    });
  });

  describe('.removeFilter', () => {
    it('should remove filter', () => {
      const rule = component.featureFlags[0].rules[0];
      component.addNewFilter(rule);
      rule.filters[1].type = PlatformParameterFilterType.AppVersion;

      component.removeFilter(rule, 0);

      // Original filter list: ['server_mode', 'app_version']
      // Verifies it's ['app_version'] after removing the first filter.
      expect(rule.filters.length).toBe(1);
      expect(rule.filters[0].type)
        .toEqual(PlatformParameterFilterType.AppVersion);
    });
  });

  describe('.addNewCondition', () => {
    it('should add new condition', () => {
      const filter = component.featureFlags[0].rules[0].filters[0];

      component.addNewCondition(filter);
      filter.conditions[1] = ['=', 'mock'];

      expect(filter.conditions.length).toBe(2);

      // Original condition list: ['=dev']
      // Verifies it's ['=dev', '=mock'] after adding.
      expect(filter.conditions[0])
        .toEqual(['=', ServerMode.Dev.toString()]);
      expect(filter.conditions[1])
        .toEqual(['=', 'mock']);
    });
  });

  describe('.removeCondition', () => {
    it('should remove condition', () => {
      const filter = component.featureFlags[0].rules[0].filters[0];
      component.addNewCondition(filter);
      filter.conditions[1] = ['=', 'mock'];

      component.removeCondition(filter, 0);

      // Original condition list: ['=dev', '=mock']
      // Verifies it's ['=mock'] after removing the first condition.
      expect(filter.conditions.length).toBe(1);
      expect(filter.conditions[0]).toEqual(['=', 'mock']);
    });
  });

  describe('.clearFilterConditions', () => {
    it('should clear existing conditions', () => {
      const filter = component.featureFlags[0].rules[0].filters[0];
      component.addNewCondition(filter);
      filter.conditions[1] = ['=', 'mock'];

      component.clearFilterConditions(filter);
      expect(filter.conditions.length).toBe(0);
    });
  });

  describe('.clearChanges', () => {
    it('should clear changes', () => {
      const featureFlag = component.featureFlags[0];
      const originalRules = cloneDeep(featureFlag.rules);

      component.addNewRuleToTop(featureFlag);
      component.clearChanges(featureFlag);

      expect(featureFlag.rules.length).toBe(1);
      expect(featureFlag.rules).toEqual(originalRules);
    });

    it('should not proceed if the user doesn\'t confirm', () => {
      mockConfirmResult(false);
      const featureFlag = component.featureFlags[0];

      expect(featureFlag.rules.length).toBe(1);

      component.addNewRuleToTop(featureFlag);
      component.clearChanges(featureFlag);

      expect(featureFlag.rules.length).toBe(2);
    });
  });

  describe('.updateFeatureRulesAsync', () => {
    let setStatusSpy: jasmine.Spy;

    beforeEach(() => {
      setStatusSpy = jasmine.createSpy();
      setStatusSpy = spyOn(component.setStatusMessage, 'emit');

      adminTaskManagerService.finishTask();
    });

    it('should update feature rules', fakeAsync(() => {
      mockPromptResult('mock msg');

      const featureFlag = component.featureFlags[0];

      component.addNewRuleToTop(featureFlag);
      component.updateFeatureRulesAsync(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).toHaveBeenCalledWith(
        featureFlag.name, 'mock msg', featureFlag.rules);
      expect(setStatusSpy).toHaveBeenCalledWith('Saved successfully.');
    }));

    it('should update feature backup after update succeeds', fakeAsync(() => {
      mockPromptResult('mock msg');

      const featureFlag = component.featureFlags[0];

      component.addNewRuleToTop(featureFlag);
      component.updateFeatureRulesAsync(featureFlag);

      flushMicrotasks();

      expect(component.featureFlagNameToBackupMap.get(featureFlag.name))
        .toEqual(featureFlag);
    }));

    it('should not update feature backup if update fails', fakeAsync(() => {
      mockPromptResult('mock msg');
      const errorResponse = new HttpErrorResponse({
        error: 'Error loading exploration 1.',
        status: 500,
        statusText: 'Internal Server Error'
      });
      updateApiSpy.and.rejectWith(errorResponse);

      const featureFlag = component.featureFlags[0];
      const originalFeatureFlag = cloneDeep(featureFlag);

      component.addNewRuleToTop(featureFlag);
      component.updateFeatureRulesAsync(featureFlag);

      flushMicrotasks();

      expect(component.featureFlagNameToBackupMap.get(featureFlag.name))
        .toEqual(originalFeatureFlag);
    }));

    it('should not proceed if there is another task running', fakeAsync(() => {
      mockPromptResult('mock msg');

      adminTaskManagerService.startTask();

      const featureFlag = component.featureFlags[0];

      component.addNewRuleToTop(featureFlag);
      component.updateFeatureRulesAsync(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).not.toHaveBeenCalled();
      expect(setStatusSpy).not.toHaveBeenCalled();

      // We need to do this at the end, otherwise the AdminTaskManager will
      // still think that the task is running (and this can mess up other
      // frontend tests that rely on the starting state to be "nothing is
      // happening").
      adminTaskManagerService.finishTask();
    }));

    it('should not proceed if the user cancels the prompt', fakeAsync(
      () => {
        mockPromptResult(null);

        const featureFlag = component.featureFlags[0];

        component.addNewRuleToTop(featureFlag);
        component.updateFeatureRulesAsync(featureFlag);

        flushMicrotasks();

        expect(updateApiSpy).not.toHaveBeenCalled();
        expect(setStatusSpy).not.toHaveBeenCalled();
      })
    );

    it('should not proceed if there is any validation issue', fakeAsync(() => {
      mockPromptResult(null);

      const featureFlag = component.featureFlags[0];

      // Two identical rules.
      component.addNewRuleToTop(featureFlag);
      component.addNewRuleToTop(featureFlag);
      component.updateFeatureRulesAsync(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).not.toHaveBeenCalled();
      expect(setStatusSpy).not.toHaveBeenCalled();
    }));

    it('should show error if the update fails', fakeAsync(() => {
      mockPromptResult('mock msg');

      const errorResponse = new HttpErrorResponse({
        error: 'Error loading exploration 1.',
        status: 500,
        statusText: 'Internal Server Error'
      });
      updateApiSpy.and.rejectWith(errorResponse);
      const featureFlag = component.featureFlags[0];

      component.addNewRuleToTop(featureFlag);
      component.updateFeatureRulesAsync(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).toHaveBeenCalled();
      expect(setStatusSpy).toHaveBeenCalledWith('Update failed.');
    }));

    it('should show error if the update fails', fakeAsync(() => {
      mockPromptResult('mock msg');

      const errorResponse = new HttpErrorResponse({
        error: {
          error: 'validation error.'
        },
        status: 500,
        statusText: 'Internal Server Error'
      });
      updateApiSpy.and.rejectWith(errorResponse);
      const featureFlag = component.featureFlags[0];

      component.addNewRuleToTop(featureFlag);
      component.updateFeatureRulesAsync(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).toHaveBeenCalled();
      expect(setStatusSpy).toHaveBeenCalledWith(
        'Update failed: validation error.');
    }));

    it('should throw error if error resonse is unexpected', fakeAsync(() => {
      mockPromptResult('mock msg');

      updateApiSpy.and.rejectWith('Error');
      const featureFlag = component.featureFlags[0];

      expect(() => {
        component.updateFeatureRulesAsync(featureFlag);
        tick();
      }).toThrowError();
    }));
  });

  describe('server mode option filter', () => {
    type OptionFilterType = (
      (feature: PlatformParameter, option: string) => boolean);
    let options: readonly string[];
    let optionFilter: OptionFilterType;

    beforeEach(() => {
      options = component
        .filterTypeToContext[PlatformParameterFilterType.ServerMode]
        .options as readonly string[];
      optionFilter = component
        .filterTypeToContext[PlatformParameterFilterType.ServerMode]
        .optionFilter as OptionFilterType;
    });

    it('should return [\'dev\'] for feature in dev stage', () => {
      expect(
        options.filter(option => optionFilter(
          { featureStage: FeatureStage.DEV } as PlatformParameter,
          option))
      )
        .toEqual(['dev']);
    });

    it('should return [\'dev\', \'test\'] for feature in test stage', () => {
      expect(
        options.filter(option => optionFilter(
          { featureStage: FeatureStage.TEST } as PlatformParameter,
          option))
      )
        .toEqual(['dev', 'test']);
    });

    it('should return [\'dev\', \'test\', \'prod\'] for feature in prod stage',
      () => {
        expect(
          options.filter(option => optionFilter(
            { featureStage: FeatureStage.PROD } as PlatformParameter,
            option))
        )
          .toEqual(['dev', 'test', 'prod']);
      }
    );

    it('should return empty array for feature in invalid stage', () => {
      expect(
        options.filter(option => optionFilter(
          { featureStage: null } as PlatformParameter,
          option))
      )
        .toEqual([]);
    });
  });

  describe('.isFeatureFlagRulesChanged', () => {
    it('should return false if the feature is the same as the backup instance',
      () => {
        const featureFlag = component.featureFlags[0];

        expect(component.isFeatureFlagRulesChanged(featureFlag))
          .toBeFalse();
      }
    );

    it(
      'should return true if the feature is different from the backup instance',
      () => {
        const featureFlag = component.featureFlags[0];

        component.addNewRuleToTop(featureFlag);

        expect(component.isFeatureFlagRulesChanged(featureFlag))
          .toBeTrue();
      }
    );

    it('should throw error if the feature username is not found', () => {
      const featureFlag = PlatformParameter.createFromBackendDict({
        data_type: 'bool',
        default_value: false,
        description: 'This is a dummy feature flag.',
        feature_stage: FeatureStage.DEV,
        is_feature: true,
        name: 'invalid',
        rule_schema_version: 1,
        rules: [
          {
            filters: [
              {
                type: PlatformParameterFilterType.ServerMode,
                conditions: [['=', ServerMode.Dev], ['=', ServerMode.Test]]
              },
              {
                type: PlatformParameterFilterType.ServerMode,
                conditions: [['=', ServerMode.Prod]]
              }
            ],
            value_when_matched: true,
          },
          {
            filters: [],
            value_when_matched: true
          }
        ],
      });

      expect(() => {
        component.isFeatureFlagRulesChanged(featureFlag);
      }).toThrowError();
    });
  });

  describe('.validateFeatureFlag', () => {
    it('should return empty array if no issue', () => {
      const issues = component.validateFeatureFlag(
        PlatformParameter.createFromBackendDict({
          data_type: 'bool',
          default_value: false,
          description: 'This is a dummy feature flag.',
          feature_stage: FeatureStage.DEV,
          is_feature: true,
          name: 'dummy_feature',
          rule_schema_version: 1,
          rules: [
            {
              filters: [
                {
                  type: PlatformParameterFilterType.ServerMode,
                  conditions: [['=', ServerMode.Dev], ['=', ServerMode.Test]]
                },
                {
                  type: PlatformParameterFilterType.ServerMode,
                  conditions: [['=', ServerMode.Prod]]
                }
              ],
              value_when_matched: true,
            },
            {
              filters: [],
              value_when_matched: true
            }
          ],
        })
      );

      expect(issues).toEqual([]);
    });

    it('should return issues if there are identical rules', () => {
      const issues = component.validateFeatureFlag(
        PlatformParameter.createFromBackendDict({
          data_type: 'bool',
          default_value: false,
          description: 'This is a dummy feature flag.',
          feature_stage: FeatureStage.DEV,
          is_feature: true,
          name: 'dummy_feature',
          rule_schema_version: 1,
          rules: [
            {
              filters: [],
              value_when_matched: true
            },
            {
              filters: [],
              value_when_matched: true
            },
          ],
        })
      );

      expect(issues).toEqual(['The 1-th & 2-th rules are identical.']);
    });

    it('should return issues if there are identical filters', () => {
      const issues = component.validateFeatureFlag(
        PlatformParameter.createFromBackendDict({
          data_type: 'bool',
          default_value: false,
          description: 'This is a dummy feature flag.',
          feature_stage: FeatureStage.DEV,
          is_feature: true,
          name: 'dummy_feature',
          rule_schema_version: 1,
          rules: [
            {
              filters: [
                {
                  type: PlatformParameterFilterType.ServerMode,
                  conditions: [['=', ServerMode.Dev]]
                },
                {
                  type: PlatformParameterFilterType.ServerMode,
                  conditions: [['=', ServerMode.Dev]]
                }
              ],
              value_when_matched: true
            },
          ],
        })
      );

      expect(issues).toEqual([
        'In the 1-th rule: the 1-th & 2-th filters are identical.']);
    });

    it('should return issues if there are identical conditions', () => {
      const issues = component.validateFeatureFlag(
        PlatformParameter.createFromBackendDict({
          data_type: 'bool',
          default_value: false,
          description: 'This is a dummy feature flag.',
          feature_stage: FeatureStage.DEV,
          is_feature: true,
          name: 'dummy_feature',
          rule_schema_version: 1,
          rules: [
            {
              filters: [
                {
                  type: PlatformParameterFilterType.ServerMode,
                  conditions: [['=', ServerMode.Dev], ['=', ServerMode.Dev]]
                },
              ],
              value_when_matched: true
            },
          ],
        })
      );

      expect(issues).toEqual([
        'In the 1-th rule, 1-th filter: the 1-th & 2-th conditions' +
        ' are identical.']);
    });
  });

  describe('.isDummyFeatureEnabled', () => {
    it('should return true when dummy feature is enabled', () => {
      mockDummyFeatureStatus(true);
      expect(component.isDummyFeatureEnabled).toBeTrue();
    });

    it('should return false when dummy feature is disabled', () => {
      mockDummyFeatureStatus(false);
      expect(component.isDummyFeatureEnabled).toBeFalse();
    });
  });

  describe('.reloadDummyHandlerStatusAsync', () => {
    let dummyApiService: PlatformFeatureDummyBackendApiService;

    let dummyApiSpy: jasmine.Spy;

    beforeEach(() => {
      dummyApiService = TestBed.get(PlatformFeatureDummyBackendApiService);

      dummyApiSpy = spyOn(dummyApiService, 'isHandlerEnabled')
        .and.resolveTo();
    });

    it('should not request dummy handler if the dummy feature is disabled',
      fakeAsync(() => {
        mockDummyFeatureStatus(false);

        component.reloadDummyHandlerStatusAsync();

        flushMicrotasks();

        expect(dummyApiSpy).not.toHaveBeenCalled();
      })
    );

    it('should request dummy handler if the dummy feature is enabled',
      fakeAsync(() => {
        mockDummyFeatureStatus(true);

        component.reloadDummyHandlerStatusAsync();

        flushMicrotasks();

        expect(dummyApiSpy).toHaveBeenCalled();
      })
    );
  });
});
