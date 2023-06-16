// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Admin Platform Parameters tab component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, async, TestBed, flushMicrotasks, tick } from
  '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import cloneDeep from 'lodash/cloneDeep';

import { AdminPageData } from 'domain/admin/admin-backend-api.service';
import { AdminDataService } from 'pages/admin-page/services/admin-data.service';
import { AdminTaskManagerService } from
  'pages/admin-page/services/admin-task-manager.service';
import { PlatformFeatureAdminBackendApiService } from
  'domain/platform_feature/platform-feature-admin-backend-api.service';
import { AdminPlatformParametersTabComponent } from
  // eslint-disable-next-line max-len
  'pages/admin-page/platform-parameters-tab/admin-platform-parameters-tab.component';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PlatformParameterFilterType, ServerMode } from
  'domain/platform_feature/platform-parameter-filter.model';
import { FeatureStage, PlatformParameter } from 'domain/platform_feature/platform-parameter.model';
import { HttpErrorResponse } from '@angular/common/http';

class MockWindowRef {
  nativeWindow = {
    confirm() {
      return true;
    },
    alert() {
      return null;
    },
    prompt() {
      return 'mock msg';
    }
  };
}


describe('Admin page platform parameters tab', () => {
  let component: AdminPlatformParametersTabComponent;
  let fixture: ComponentFixture<AdminPlatformParametersTabComponent>;
  let adminDataService: AdminDataService;
  let featureApiService: PlatformFeatureAdminBackendApiService;
  let adminTaskManagerService: AdminTaskManagerService;
  let mockWindowRef: MockWindowRef;

  let updateApiSpy: jasmine.Spy;

  beforeEach(async(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [AdminPlatformParametersTabComponent],
      providers: [
        AdminTaskManagerService,
        {
          provide: WindowRef,
          useValue: mockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPlatformParametersTabComponent);
    component = fixture.componentInstance;
    adminDataService = TestBed.get(AdminDataService);
    featureApiService = TestBed.get(PlatformFeatureAdminBackendApiService);
    adminTaskManagerService = TestBed.get(AdminTaskManagerService);

    spyOn(adminDataService, 'getDataAsync').and.resolveTo({
      platformParameters: [
        PlatformParameter.createFromBackendDict({
          data_type: 'bool',
          default_value: false,
          description: 'This is a dummy platform parameter.',
          feature_stage: null,
          is_feature: false,
          name: 'dummy_platform_parameter',
          rule_schema_version: 1,
          rules: [{
            filters: [
              {
                type: PlatformParameterFilterType.ServerMode,
                conditions: [['=', ServerMode.Dev]]
              }
            ],
            // This does not match the data type of platform param, but this is
            // intended as string values are more suitable for
            // identifying rules in the following tests.
            value_when_matched: 'original',
          }],
        })
      ]
    } as AdminPageData);

    updateApiSpy = spyOn(featureApiService, 'updatePlatformParameter')
      .and.resolveTo();

    component.ngOnInit();
  }));

  it('should load platform parameters on init', () => {
    expect(component.platformParameters.length).toBe(1);
    expect(component.platformParameters[0].name).toEqual(
      'dummy_platform_parameter');
  });

  describe('.getPlatformParamSchema', () => {
    it('should return unicode schema for string data type', () => {
      const schema = component.getPlatformParamSchema('string');
      expect(schema).toEqual({type: 'unicode'});
    });

    it('should return float schema for number data type', () => {
      const schema = component.getPlatformParamSchema('number');
      expect(schema).toEqual({type: 'float'});
    });

    it('should return the schema according to the data type', () => {
      const schema = component.getPlatformParamSchema('bool');
      expect(schema).toEqual({type: 'bool'});
    });
  });

  describe('.addNewRuleToTop', () => {
    it('should add new rule to top of rule list', () => {
      const platformParameter = component.platformParameters[0];

      expect(platformParameter.rules.length).toBe(1);

      component.addNewRuleToTop(platformParameter);
      expect(platformParameter.rules.length).toBe(2);
      expect(platformParameter.rules[1].valueWhenMatched).toEqual('original');
    });
  });

  describe('.addNewRuleToBottom', () => {
    it('should add new rule to bottom of rule list', () => {
      const platformParameter = component.platformParameters[0];

      expect(platformParameter.rules.length).toBe(1);

      component.addNewRuleToBottom(platformParameter);
      expect(platformParameter.rules.length).toBe(2);
      expect(platformParameter.rules[0].valueWhenMatched).toEqual('original');
    });
  });

  describe('.removeRule', () => {
    it('should remove rule', () => {
      const platformParameter = component.platformParameters[0];
      component.addNewRuleToBottom(platformParameter);
      platformParameter.rules[1].valueWhenMatched = '1';

      component.removeRule(platformParameter, 0);

      // Original rules order: ['original', '1']
      // Verifies it's ['1'] after removing 'original'.
      expect(platformParameter.rules.length).toBe(1);
      expect(platformParameter.rules[0].valueWhenMatched).toEqual('1');
    });
  });

  describe('.moveRuleUp', () => {
    it('should move rule up', () => {
      const platformParameter = component.platformParameters[0];
      component.addNewRuleToBottom(platformParameter);
      platformParameter.rules[1].valueWhenMatched = '1';
      component.addNewRuleToBottom(platformParameter);
      platformParameter.rules[2].valueWhenMatched = '2';

      component.moveRuleUp(platformParameter, 1);

      // Original rules order: ['original', '1', '2']
      // Verifies it's ['1', 'original', '2'] after removing '1' up.
      expect(platformParameter.rules[0].valueWhenMatched).toEqual('1');
      expect(platformParameter.rules[1].valueWhenMatched).toEqual('original');
      expect(platformParameter.rules[2].valueWhenMatched).toEqual('2');
    });
  });

  describe('.moveRuleDown', () => {
    it('should move rule down', () => {
      const platformParameter = component.platformParameters[0];
      component.addNewRuleToBottom(platformParameter);
      platformParameter.rules[1].valueWhenMatched = '1';
      component.addNewRuleToBottom(platformParameter);
      platformParameter.rules[2].valueWhenMatched = '2';

      component.moveRuleDown(platformParameter, 1);

      // Original rules order: ['original', '1', '2']
      // Verifies it's ['original', '2', '1'] after removing '1' down.
      expect(platformParameter.rules[0].valueWhenMatched).toEqual('original');
      expect(platformParameter.rules[1].valueWhenMatched).toEqual('2');
      expect(platformParameter.rules[2].valueWhenMatched).toEqual('1');
    });
  });

  describe('.addNewFilter', () => {
    it('should add new filter', () => {
      const rule = component.platformParameters[0].rules[0];

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
      const rule = component.platformParameters[0].rules[0];
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
      const filter = component.platformParameters[0].rules[0].filters[0];

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
      const filter = component.platformParameters[0].rules[0].filters[0];
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
      const filter = component.platformParameters[0].rules[0].filters[0];
      component.addNewCondition(filter);
      filter.conditions[1] = ['=', 'mock'];

      component.clearFilterConditions(filter);
      expect(filter.conditions.length).toBe(0);
    });
  });

  describe('.clearChanges', () => {
    it('should clear changes', () => {
      spyOn(mockWindowRef.nativeWindow, 'confirm').and.returnValue(true);
      const platformParameter = component.platformParameters[0];
      const originalRules = cloneDeep(platformParameter.rules);

      component.addNewRuleToTop(platformParameter);
      component.clearChanges(platformParameter);

      expect(platformParameter.rules.length).toBe(1);
      expect(platformParameter.rules).toEqual(originalRules);
    });

    it('should not proceed if the user doesn\'t confirm', () => {
      spyOn(mockWindowRef.nativeWindow, 'confirm').and.returnValue(false);
      const platformParameter = component.platformParameters[0];

      expect(platformParameter.rules.length).toBe(1);

      component.addNewRuleToTop(platformParameter);
      component.clearChanges(platformParameter);

      expect(platformParameter.rules.length).toBe(2);
    });
  });

  describe('.updateParameterRulesAsync', () => {
    let setStatusSpy: jasmine.Spy;
    let promptSpy: jasmine.Spy;

    beforeEach(() => {
      setStatusSpy = jasmine.createSpy();
      setStatusSpy = spyOn(component.setStatusMessage, 'emit');
      promptSpy = spyOn(mockWindowRef.nativeWindow, 'prompt');

      adminTaskManagerService.finishTask();
    });

    it('should update platform parameter rules', fakeAsync(() => {
      promptSpy.and.returnValue('mock msg');

      const platformParameter = component.platformParameters[0];

      component.addNewRuleToTop(platformParameter);
      component.updateParameterRulesAsync(platformParameter);

      flushMicrotasks();

      expect(updateApiSpy).toHaveBeenCalledWith(
        platformParameter.name, 'mock msg', platformParameter.rules);
      expect(setStatusSpy).toHaveBeenCalledWith('Saved successfully.');
    }));

    it('should update platform param backup after update succeeds',
      fakeAsync(() => {
        promptSpy.and.returnValue('mock msg');

        const platformParameter = component.platformParameters[0];

        component.addNewRuleToTop(platformParameter);
        component.updateParameterRulesAsync(platformParameter);

        flushMicrotasks();

        expect(component.platformParameterNameToBackupMap.get(
          platformParameter.name)).toEqual(platformParameter);
      }));

    it('should not update platform param backup if update fails',
      fakeAsync(() => {
        promptSpy.and.returnValue('mock msg');
        const errorResponse = new HttpErrorResponse({
          error: 'Error loading exploration 1.',
          status: 500,
          statusText: 'Internal Server Error'
        });
        updateApiSpy.and.rejectWith(errorResponse);

        const platformParameter = component.platformParameters[0];
        const originalFeatureFlag = cloneDeep(platformParameter);

        component.addNewRuleToTop(platformParameter);
        component.updateParameterRulesAsync(platformParameter);

        flushMicrotasks();

        expect(component.platformParameterNameToBackupMap.get(
          platformParameter.name)).toEqual(originalFeatureFlag);
      }));

    it('should not proceed if there is another task running', fakeAsync(() => {
      promptSpy.and.returnValue('mock msg');

      adminTaskManagerService.startTask();

      const platformParameter = component.platformParameters[0];

      component.addNewRuleToTop(platformParameter);
      component.updateParameterRulesAsync(platformParameter);

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
        promptSpy.and.returnValue(null);

        const platformParameter = component.platformParameters[0];

        component.addNewRuleToTop(platformParameter);
        component.updateParameterRulesAsync(platformParameter);

        flushMicrotasks();

        expect(updateApiSpy).not.toHaveBeenCalled();
        expect(setStatusSpy).not.toHaveBeenCalled();
      })
    );

    it('should not proceed if there is any validation issue', fakeAsync(() => {
      promptSpy.and.returnValue(null);

      const platformParameter = component.platformParameters[0];

      // Two identical rules.
      component.addNewRuleToTop(platformParameter);
      component.addNewRuleToTop(platformParameter);
      component.updateParameterRulesAsync(platformParameter);

      flushMicrotasks();

      expect(updateApiSpy).not.toHaveBeenCalled();
      expect(setStatusSpy).not.toHaveBeenCalled();
    }));

    it('should show error if the update fails', fakeAsync(() => {
      promptSpy.and.returnValue('mock msg');

      const errorResponse = new HttpErrorResponse({
        error: 'Error loading exploration 1.',
        status: 500,
        statusText: 'Internal Server Error'
      });
      updateApiSpy.and.rejectWith(errorResponse);
      const platformParameter = component.platformParameters[0];

      component.addNewRuleToTop(platformParameter);
      component.updateParameterRulesAsync(platformParameter);

      flushMicrotasks();

      expect(updateApiSpy).toHaveBeenCalled();
      expect(setStatusSpy).toHaveBeenCalledWith('Update failed.');
    }));

    it('should show error if the update fails', fakeAsync(() => {
      promptSpy.and.returnValue('mock msg');

      const errorResponse = new HttpErrorResponse({
        error: {
          error: 'validation error.'
        },
        status: 500,
        statusText: 'Internal Server Error'
      });
      updateApiSpy.and.rejectWith(errorResponse);
      const platformParameter = component.platformParameters[0];

      component.addNewRuleToTop(platformParameter);
      component.updateParameterRulesAsync(platformParameter);

      flushMicrotasks();

      expect(updateApiSpy).toHaveBeenCalled();
      expect(setStatusSpy).toHaveBeenCalledWith(
        'Update failed: validation error.');
    }));

    it('should throw error if error resonse is unexpected', fakeAsync(() => {
      promptSpy.and.returnValue('mock msg');

      updateApiSpy.and.rejectWith('Error');
      const platformParameter = component.platformParameters[0];

      expect(() => {
        component.updateParameterRulesAsync(platformParameter);
        tick();
      }).toThrowError();
    }));
  });

  describe('.isPlatformParamRulesChanged', () => {
    it('should return false if the parameter is same as the backup instance',
      () => {
        const platformParameter = component.platformParameters[0];

        expect(component.isPlatformParamRulesChanged(platformParameter))
          .toBeFalse();
      }
    );

    it(
      'should return true if the parameter is different from backup instance',
      () => {
        const platformParameter = component.platformParameters[0];

        component.addNewRuleToTop(platformParameter);

        expect(component.isPlatformParamRulesChanged(platformParameter))
          .toBeTrue();
      }
    );

    it('should throw error if the platform param username is not found', () => {
      const platformParameter = PlatformParameter.createFromBackendDict({
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
        component.isPlatformParamRulesChanged(platformParameter);
      }).toThrowError();
    });
  });

  describe('.validatePlatformParam', () => {
    it('should return empty array if no issue', () => {
      const issues = AdminPlatformParametersTabComponent.validatePlatformParam(
        PlatformParameter.createFromBackendDict({
          data_type: 'bool',
          default_value: false,
          description: 'This is a dummy platform param.',
          feature_stage: FeatureStage.DEV,
          is_feature: true,
          name: 'dummy_platform_parameter',
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
      const issues = AdminPlatformParametersTabComponent.validatePlatformParam(
        PlatformParameter.createFromBackendDict({
          data_type: 'bool',
          default_value: false,
          description: 'This is a dummy platform param.',
          feature_stage: FeatureStage.DEV,
          is_feature: true,
          name: 'dummy_platform_parameter',
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
      const issues = AdminPlatformParametersTabComponent.validatePlatformParam(
        PlatformParameter.createFromBackendDict({
          data_type: 'bool',
          default_value: false,
          description: 'This is a dummy platform param.',
          feature_stage: FeatureStage.DEV,
          is_feature: true,
          name: 'dummy_platform_parameter',
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
      const issues = AdminPlatformParametersTabComponent.validatePlatformParam(
        PlatformParameter.createFromBackendDict({
          data_type: 'bool',
          default_value: false,
          description: 'This is a dummy platform param.',
          feature_stage: FeatureStage.DEV,
          is_feature: true,
          name: 'dummy_platform_parameter',
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
});
