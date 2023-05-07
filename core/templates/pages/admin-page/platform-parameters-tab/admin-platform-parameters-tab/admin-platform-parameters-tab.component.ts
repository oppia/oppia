import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';

import { AdminFeaturesTabConstants } from
  'pages/release-coordinator-page/features-tab/admin-features-tab.constants';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PlatformFeatureAdminBackendApiService } from
  'domain/platform_feature/platform-feature-admin-backend-api.service';
import { PlatformFeatureDummyBackendApiService } from
  'domain/platform_feature/platform-feature-dummy-backend-api.service';
import { PlatformFeatureService } from 'services/platform-feature.service';
import {
  PlatformParameterFilterType,
  PlatformParameterFilter,
} from 'domain/platform_feature/platform-parameter-filter.model';
import { PlatformParameter, FeatureStage } from
  'domain/platform_feature/platform-parameter.model';
import { PlatformParameterRule } from
  'domain/platform_feature/platform-parameter-rule.model';
import { HttpErrorResponse } from '@angular/common/http';

type FilterType = keyof typeof PlatformParameterFilterType;

@Component({
  selector: 'admin-platform-parameters-tab',
  templateUrl: './admin-platform-parameters-tab.component.html',
  styleUrls: ['./admin-platform-parameters-tab.component.scss']
})
export class AdminPlatformParametersTabComponent implements OnInit {

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
      optionFilter?: (feature: PlatformParameter, option: string) => boolean;
      placeholder?: string;
      inputRegex?: RegExp;
    }
  } = {
      [PlatformParameterFilterType.ServerMode]: {
        displayName: 'Server Mode',
        options: AdminFeaturesTabConstants.ALLOWED_SERVER_MODES,
        operators: ['='],
        optionFilter: (feature: PlatformParameter, option: string): boolean => {
          switch (feature.featureStage) {
            case FeatureStage.DEV:
              return option === 'dev';
            case FeatureStage.TEST:
              return option === 'dev' || option === 'test';
            case FeatureStage.PROD:
              return true;
            default:
              return false;
          }
        }
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

  constructor() { }

  ngOnInit(): void {
  }

}
