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
 * @fileoverview Component for the Platform Parameters tab in the admin panel.
 */

import { Component, OnInit, EventEmitter, Output } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { Subscription } from 'rxjs';

import { AdminFeaturesTabConstants } from
  'pages/release-coordinator-page/features-tab/features-tab.constants';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminDataService } from
  'pages/admin-page/services/admin-data.service';
import { AdminTaskManagerService } from
  'pages/admin-page/services/admin-task-manager.service';
import { LoaderService } from 'services/loader.service';
import { PlatformFeatureAdminBackendApiService } from
  'domain/platform_feature/platform-feature-admin-backend-api.service';
import {
  PlatformParameterFilterType,
  PlatformParameterFilter,
} from 'domain/platform_feature/platform-parameter-filter.model';
import { PlatformParameter } from
  'domain/platform_feature/platform-parameter.model';
import { PlatformParameterRule } from
  'domain/platform_feature/platform-parameter-rule.model';
import { HttpErrorResponse } from '@angular/common/http';

interface PlatformSchema {
  'type': string;
}

type FilterType = keyof typeof PlatformParameterFilterType;

@Component({
  selector: 'oppia-admin-platform-parameters-tab',
  templateUrl: './admin-platform-parameters-tab.component.html'
})
export class AdminPlatformParametersTabComponent implements OnInit {
  @Output() setStatusMessage = new EventEmitter<string>();

  readonly availableFilterTypes: PlatformParameterFilterType[] = Object
    .keys(PlatformParameterFilterType)
    .map(key => {
      var filterType = key as FilterType;
      return PlatformParameterFilterType[filterType];
    });

  readonly filterTypeToContext: {
    [key in PlatformParameterFilterType]: {
      displayName: string;
      operators: readonly string[];
      options?: readonly string[];
      placeholder?: string;
      inputRegex?: RegExp;
    }
  } = {
      [PlatformParameterFilterType.ServerMode]: {
        displayName: 'Server Mode',
        options: AdminFeaturesTabConstants.ALLOWED_SERVER_MODES,
        operators: ['=']
      },
      [PlatformParameterFilterType.PlatformType]: {
        displayName: 'Platform Type',
        options: AdminFeaturesTabConstants.ALLOWED_PLATFORM_TYPES,
        operators: ['=']
      },
      [PlatformParameterFilterType.BrowserType]: {
        displayName: 'Browser Type',
        options: AdminFeaturesTabConstants.ALLOWED_BROWSER_TYPES,
        operators: ['=']
      },
      [PlatformParameterFilterType.AppVersion]: {
        displayName: 'App Version',
        operators: ['=', '<', '>', '<=', '>='],
        placeholder: 'e.g. 1.0.0',
        inputRegex: AdminFeaturesTabConstants.APP_VERSION_REGEXP
      },
      [PlatformParameterFilterType.AppVersionFlavor]: {
        displayName: 'App Version Flavor',
        options: AdminFeaturesTabConstants.ALLOWED_APP_VERSION_FLAVORS,
        operators: ['=', '<', '>', '<=', '>=']
      }
    };

  private readonly defaultNewFilter: PlatformParameterFilter = (
    PlatformParameterFilter.createFromBackendDict({
      type: PlatformParameterFilterType.ServerMode,
      conditions: []
    })
  );

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  platformParameterNameToBackupMap!: Map<string, PlatformParameter>;
  platformParameters: PlatformParameter[] = [];
  platformParametersAreFetched: boolean = false;
  loadingMessage: string = '';
  directiveSubscriptions = new Subscription();

  constructor(
    private windowRef: WindowRef,
    private adminDataService: AdminDataService,
    private adminTaskManager: AdminTaskManagerService,
    private apiService: PlatformFeatureAdminBackendApiService,
    private loaderService: LoaderService,
  ) { }

  async reloadPlatformParametersAsync(): Promise<void> {
    const data = await this.adminDataService.getDataAsync();
    this.platformParametersAreFetched = false;
    this.platformParameters = data.platformParameters;
    this.platformParameterNameToBackupMap = new Map(
      this.platformParameters.map(param => [param.name, cloneDeep(param)]));
    this.loaderService.hideLoadingScreen();
  }

  getdefaultNewRule(param: PlatformParameter): PlatformParameterRule {
    return PlatformParameterRule.createFromBackendDict({
      filters: [this.defaultNewFilter.toBackendDict()],
      value_when_matched: param.defaultValue
    });
  }

  getPlatformParamSchema(dataType: string): PlatformSchema {
    if (dataType === 'string') {
      return {type: 'unicode'};
    } else if (dataType === 'number') {
      return {type: 'float'};
    }
    return {type: dataType};
  }

  addNewRuleToTop(param: PlatformParameter): void {
    param.rules.unshift(cloneDeep(this.getdefaultNewRule(param)));
  }

  addNewRuleToBottom(param: PlatformParameter): void {
    param.rules.push(cloneDeep(this.getdefaultNewRule(param)));
  }

  addNewFilter(rule: PlatformParameterRule): void {
    rule.filters.push(cloneDeep(this.defaultNewFilter));
  }

  addNewCondition(filter: PlatformParameterFilter): void {
    const context = this.filterTypeToContext[filter.type];
    filter.conditions.push([
      context.operators[0],
      context.options ? context.options[0] : ''
    ]);
  }

  removeRule(param: PlatformParameter, ruleIndex: number): void {
    param.rules.splice(ruleIndex, 1);
  }

  removeFilter(rule: PlatformParameterRule, filterIndex: number): void {
    rule.filters.splice(filterIndex, 1);
  }

  removeCondition(
      filter: PlatformParameterFilter, conditionIndex: number): void {
    filter.conditions.splice(conditionIndex, 1);
  }

  moveRuleUp(param: PlatformParameter, ruleIndex: number): void {
    const rule = param.rules[ruleIndex];
    this.removeRule(param, ruleIndex);
    param.rules.splice(ruleIndex - 1, 0, rule);
  }

  moveRuleDown(param: PlatformParameter, ruleIndex: number): void {
    const rule = param.rules[ruleIndex];
    this.removeRule(param, ruleIndex);
    param.rules.splice(ruleIndex + 1, 0, rule);
  }

  async updateParameterRulesAsync(param: PlatformParameter): Promise<void> {
    const issues = (
      AdminPlatformParametersTabComponent.validatePlatformParam(param));
    if (issues.length > 0) {
      this.windowRef.nativeWindow.alert(issues.join('\n'));
      return;
    }
    if (this.adminTaskManager.isTaskRunning()) {
      return;
    }
    const commitMessage = this.windowRef.nativeWindow.prompt(
      'This action is irreversible. If you insist to proceed, please enter ' +
      'the commit message for the update',
      `Update parameter '${param.name}'.`
    );
    if (commitMessage === null) {
      return;
    }

    try {
      this.adminTaskManager.startTask();

      await this.apiService.updatePlatformParameter(
        param.name, commitMessage, param.rules);

      this.platformParameterNameToBackupMap.set(param.name, cloneDeep(param));

      this.setStatusMessage.emit('Saved successfully.');
    // We use unknown type because we are unsure of the type of error
    // that was thrown. Since the catch block cannot identify the
    // specific type of error, we are unable to further optimise the
    // code by introducing more types of errors.
    } catch (e: unknown) {
      if (e instanceof HttpErrorResponse) {
        if (e.error && e.error.error) {
          this.setStatusMessage.emit(`Update failed: ${e.error.error}`);
        } else {
          this.setStatusMessage.emit('Update failed.');
        }
      } else {
        throw new Error('Unexpected error response.');
      }
    } finally {
      this.adminTaskManager.finishTask();
    }
  }

  clearChanges(param: PlatformParameter): void {
    if (!this.windowRef.nativeWindow.confirm(
      'This will revert all changes you made. Are you sure?')) {
      return;
    }
    const backup = this.platformParameterNameToBackupMap.get(
      param.name
    );

    if (backup) {
      param.rules = cloneDeep(backup.rules);
    }
  }

  clearFilterConditions(filter: PlatformParameterFilter): void {
    filter.conditions.splice(0);
  }

  isPlatformParamRulesChanged(param: PlatformParameter): boolean {
    const original = this.platformParameterNameToBackupMap.get(
      param.name
    );
    if (original === undefined) {
      throw new Error('Backup not found for platform params: ' + param.name);
    }
    return !isEqual(original.rules, param.rules);
  }

  /**
   * Validates platform parameter before updating, checks if there are identical
   * rules, filters or conditions at the same level.
   *
   * @param {PlatformParameter} param - the parameter to be validated.
   *
   * @returns {string[]} - Array of issue messages, if any.
   */
  static validatePlatformParam(param: PlatformParameter): string[] {
    const issues = [];

    const seenRules: PlatformParameterRule[] = [];
    for (const [ruleIndex, rule] of param.rules.entries()) {
      const sameRuleIndex = seenRules.findIndex(
        seenRule => isEqual(seenRule, rule));
      if (sameRuleIndex !== -1) {
        issues.push(
          `The ${sameRuleIndex + 1}-th & ${ruleIndex + 1}-th rules are` +
          ' identical.');
        continue;
      }
      seenRules.push(rule);

      const seenFilters: PlatformParameterFilter[] = [];
      for (const [filterIndex, filter] of rule.filters.entries()) {
        const sameFilterIndex = seenFilters.findIndex(
          seenFilter => isEqual(seenFilter, filter));
        if (sameFilterIndex !== -1) {
          issues.push(
            `In the ${ruleIndex + 1}-th rule: the ${sameFilterIndex + 1}-th` +
            ` & ${filterIndex + 1}-th filters are identical.`);
          continue;
        }
        seenFilters.push(filter);

        const seenConditions: [string, string][] = [];
        for (const [conditionIndex, condition] of filter.conditions
          .entries()) {
          const sameCondIndex = seenConditions.findIndex(
            seenCond => isEqual(seenCond, condition));
          if (sameCondIndex !== -1) {
            issues.push(
              `In the ${ruleIndex + 1}-th rule, ${filterIndex + 1}-th` +
              ` filter: the ${sameCondIndex + 1}-th & ` +
              `${conditionIndex + 1}-th conditions are identical.`);
            continue;
          }

          seenConditions.push(condition);
        }
      }
    }
    return issues;
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.loaderService.onLoadingMessageChange.subscribe(
        (message: string) => {
          this.loadingMessage = message;
        }
      ));
    this.platformParametersAreFetched = true;
    this.loaderService.showLoadingScreen('Loading');
    this.reloadPlatformParametersAsync();
  }
}
