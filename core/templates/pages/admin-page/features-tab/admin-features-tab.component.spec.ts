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

import { ComponentFixture, fakeAsync, async, TestBed, flushMicrotasks } from
  '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { AdminDataService } from '../services/admin-data.service';
import { AdminFeaturesTabComponent } from './admin-features-tab.component';
import { AdminPageData } from 'domain/admin/admin-backend-api.service';
import { AdminTaskManagerService } from
  '../services/admin-task-manager.service';
import { PlatformFeatureAdminBackendApiService } from
  'domain/platform_feature/platform-feature-admin-backend-api.service';
import { PlatformParameterObjectFactory, FeatureStage, PlatformParameter } from
  'domain/platform_feature/platform-parameter-object.factory';
import { PlatformParameterFilterType, ServerMode } from
  'domain/platform_feature/platform-parameter-filter-object.factory';
import { WindowRef } from 'services/contextual/window-ref.service';


describe('Admin page feature tab', function() {
  let component: AdminFeaturesTabComponent;
  let fixture: ComponentFixture<AdminFeaturesTabComponent>;

  let paramFactory: PlatformParameterObjectFactory;
  let adminDataService: AdminDataService;
  let featureApiService: PlatformFeatureAdminBackendApiService;
  let adminTaskManagerService: AdminTaskManagerService;
  let windowRef: WindowRef;

  let updateApiSpy: jasmine.Spy;

  let mockConfirmResult: (val: boolean) => void;
  let mockPromptResult: (msg: string) => void;

  beforeEach(async(() => {
    TestBed
      .configureTestingModule({
        imports: [FormsModule, HttpClientTestingModule],
        declarations: [AdminFeaturesTabComponent],
      })
      .compileComponents();

    paramFactory = TestBed.get(PlatformParameterObjectFactory);
    adminDataService = TestBed.get(AdminDataService);
    featureApiService = TestBed.get(PlatformFeatureAdminBackendApiService);
    windowRef = TestBed.get(WindowRef);
    adminTaskManagerService = TestBed.get(AdminTaskManagerService);

    let confirmResult = true;
    let promptResult = 'mock msg';
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      confirm: () => confirmResult,
      prompt: () => promptResult
    });
    mockConfirmResult = val => confirmResult = val;
    mockPromptResult = msg => promptResult = msg;

    spyOn(adminDataService, 'getDataAsync').and.resolveTo(<AdminPageData>{
      featureFlags: [
        paramFactory.createFromBackendDict({
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
            value_when_matched: true,
          }],
        })
      ]
    });

    updateApiSpy = spyOn(featureApiService, 'updateFeatureFlag')
      .and.resolveTo(null);
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AdminFeaturesTabComponent);
    component = fixture.componentInstance;

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
      expect(featureFlag.rules[0].valueWhenMatched).toBeFalse();
    });
  });

  describe('.addNewRuleToBottom', () => {
    it('should add new rule to bottom of rule list', () => {
      const featureFlag = component.featureFlags[0];

      expect(featureFlag.rules.length).toBe(1);

      component.addNewRuleToBottom(featureFlag);
      expect(featureFlag.rules.length).toBe(2);
      expect(featureFlag.rules[1].valueWhenMatched).toBeFalse();
    });
  });

  describe('.removeRule', () => {
    it('should remove rule', () => {
      const featureFlag = component.featureFlags[0];

      expect(featureFlag.rules.length).toBe(1);
      component.removeRule(featureFlag, 0);
      expect(featureFlag.rules.length).toBe(0);
    });
  });

  describe('.moveRuleUp', () => {
    it('should move rule up', () => {
      const featureFlag = component.featureFlags[0];
      component.addNewRuleToBottom(featureFlag);

      component.moveRuleUp(featureFlag, 1);
      expect(featureFlag.rules[0].valueWhenMatched).toBeFalse();
    });
  });

  describe('.moveRuleDown', () => {
    it('should move rule down', () => {
      const featureFlag = component.featureFlags[0];
      component.addNewRuleToBottom(featureFlag);

      component.moveRuleDown(featureFlag, 0);
      expect(featureFlag.rules[1].valueWhenMatched).toBeTrue();
    });
  });

  describe('.addNewFilter', () => {
    it('should add new filter', () => {
      const rule = component.featureFlags[0].rules[0];

      expect(rule.filters.length).toBe(1);
      component.addNewFilter(rule);
      expect(rule.filters.length).toBe(2);
    });
  });

  describe('.removeFilter', () => {
    it('should remove filter', () => {
      const rule = component.featureFlags[0].rules[0];

      expect(rule.filters.length).toBe(1);
      component.removeFilter(rule, 0);
      expect(rule.filters.length).toBe(0);
    });
  });

  describe('.addNewCondition', () => {
    it('should add new condition', () => {
      const filter = component.featureFlags[0].rules[0].filters[0];

      expect(filter.conditions.length).toBe(1);
      component.addNewCondition(filter);
      expect(filter.conditions.length).toBe(2);
    });
  });

  describe('.removeCondition', () => {
    it('should remove condition', () => {
      const filter = component.featureFlags[0].rules[0].filters[0];

      expect(filter.conditions.length).toBe(1);
      component.removeCondition(filter, 0);
      expect(filter.conditions.length).toBe(0);
    });
  });


  describe('.onFilterTypeSelectionChanged', () => {
    it('should clear existing conditions', () => {
      const filter = component.featureFlags[0].rules[0].filters[0];

      expect(filter.conditions.length).toBe(1);
      component.onFilterTypeSelectionChanged(filter);
      expect(filter.conditions.length).toBe(0);
    });
  });

  describe('.clearChanges', () => {
    it('should clear changes', () => {
      const featureFlag = component.featureFlags[0];

      expect(featureFlag.rules.length).toBe(1);

      component.addNewRuleToTop(featureFlag);
      component.clearChanges(featureFlag);

      expect(featureFlag.rules.length).toBe(1);
    });

    it('should not proceed if the user does\'t confirm', () => {
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
      component.setStatusMessage = setStatusSpy;

      adminTaskManagerService.finishTask();
      mockConfirmResult(true);
      mockPromptResult('mock msg');
    });

    it('should update feature rules', fakeAsync(() => {
      const featureFlag = component.featureFlags[0];

      component.addNewRuleToTop(featureFlag);
      component.updateFeatureRulesAsync(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).toHaveBeenCalledWith(
        featureFlag.name, 'mock msg', featureFlag.rules);
      expect(setStatusSpy).toHaveBeenCalledWith('Saved successfully.');
    }));

    it('should not proceed if there is another task running', fakeAsync(() => {
      adminTaskManagerService.startTask();

      const featureFlag = component.featureFlags[0];

      component.addNewRuleToTop(featureFlag);
      component.updateFeatureRulesAsync(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).not.toHaveBeenCalled();
      expect(setStatusSpy).not.toHaveBeenCalled();
    }));

    it('should not proceed if the user does\'t confirm', fakeAsync(() => {
      mockConfirmResult(false);

      const featureFlag = component.featureFlags[0];

      component.addNewRuleToTop(featureFlag);
      component.updateFeatureRulesAsync(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).not.toHaveBeenCalled();
      expect(setStatusSpy).not.toHaveBeenCalled();
    }));

    it('should not proceed if the user does\'t cancels the prompt', fakeAsync(
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

    it('should show error if the update fails', fakeAsync(() => {
      updateApiSpy.and.rejectWith('unknown error');
      const featureFlag = component.featureFlags[0];

      component.addNewRuleToTop(featureFlag);
      component.updateFeatureRulesAsync(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).toHaveBeenCalled();
      expect(setStatusSpy).toHaveBeenCalledWith('Update failed.');
    }));

    it('should show error if the update fails', fakeAsync(() => {
      updateApiSpy.and.rejectWith({
        error: {
          error: 'validation error.'
        }
      });
      const featureFlag = component.featureFlags[0];

      component.addNewRuleToTop(featureFlag);
      component.updateFeatureRulesAsync(featureFlag);

      flushMicrotasks();

      expect(updateApiSpy).toHaveBeenCalled();
      expect(setStatusSpy).toHaveBeenCalledWith(
        'Update failed: validation error.');
    }));
  });

  describe('server mode option filter', () => {
    let options: string[];
    let optionFilter: (feature: PlatformParameter, option: string) => boolean;

    beforeEach(() => {
      options = component
        .filterTypeToContext[PlatformParameterFilterType.ServerMode]
        .options;
      optionFilter = component
        .filterTypeToContext[PlatformParameterFilterType.ServerMode]
        .optionFilter;
    });

    it('should return [\'dev\'] for feature in dev stage', () => {
      expect(
        options.filter(option => optionFilter(
          <PlatformParameter>{featureStage: FeatureStage.DEV},
          option))
      )
        .toEqual(['dev']);
    });

    it('should return [\'dev\', \'test\'] for feature in test stage', () => {
      expect(
        options.filter(option => optionFilter(
          <PlatformParameter>{featureStage: FeatureStage.TEST},
          option))
      )
        .toEqual(['dev', 'test']);
    });

    it('should return [\'dev\', \'test\', \'prod\'] for feature in prod stage',
      () => {
        expect(
          options.filter(option => optionFilter(
            <PlatformParameter>{featureStage: FeatureStage.PROD},
            option))
        )
          .toEqual(['dev', 'test', 'prod']);
      }
    );
  });
});
