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
 * @fileoverview Module having all essentials for creating a oppia page.
 */

// Modules.
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CookieModule } from 'ngx-cookie';

import { DirectivesModule } from 'directives/directives.module';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { I18nModule } from 'i18n/i18n.module';

// Components.
import { CreateActivityButtonComponent } from 'components/button-directives/create-activity-button.component';
import { SocialButtonsComponent } from 'components/button-directives/social-buttons.component';
import { AlertMessageComponent } from 'components/common-layout-directives/common-elements/alert-message.component';
import { PromoBarComponent } from 'components/common-layout-directives/common-elements/promo-bar.component';
import { SideNavigationBarComponent } from 'components/common-layout-directives/navigation-bars/side-navigation-bar.component';
import { TopNavigationBarComponent } from 'components/common-layout-directives/navigation-bars/top-navigation-bar.component';
import { LoadingMessageComponent } from './loading-message.component';
import { OppiaFooterComponent } from './oppia-footer.component';
import { WarningsAndAlertsComponent } from './warnings-and-alerts.component';

// Directives.
import {
  BaseContentComponent,
  BaseContentNavBarBreadCrumbDirective,
  BaseContentNavBarPreLogoActionDirective,
  BaseContentNavOptionsDirective,
  BaseContentPageFooterDirective
} from './base-content.component';

// Miscellaneous.
import { SmartRouterModule } from 'hybrid-router-module-provider';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';

@NgModule({
  imports: [
    CommonModule,
    CookieModule.forChild(),
    DirectivesModule,
    I18nModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    SmartRouterModule,
    SharedPipesModule,
  ],

  declarations: [
    AlertMessageComponent,
    BaseContentComponent,
    BaseContentNavBarBreadCrumbDirective,
    BaseContentNavBarPreLogoActionDirective,
    BaseContentNavOptionsDirective,
    BaseContentPageFooterDirective,
    CreateActivityButtonComponent,
    LoadingMessageComponent,
    OppiaAngularRootComponent,
    OppiaFooterComponent,
    PromoBarComponent,
    SideNavigationBarComponent,
    SocialButtonsComponent,
    TopNavigationBarComponent,
    WarningsAndAlertsComponent,
  ],

  entryComponents: [
    AlertMessageComponent,
    BaseContentComponent,
    CreateActivityButtonComponent,
    LoadingMessageComponent,
    OppiaAngularRootComponent,
    OppiaFooterComponent,
    PromoBarComponent,
    SideNavigationBarComponent,
    SocialButtonsComponent,
    TopNavigationBarComponent,
    WarningsAndAlertsComponent,
  ],

  exports: [
    // Modules.
    CookieModule,
    DirectivesModule,
    I18nModule,
    SharedPipesModule,

    // Components and Directives.
    AlertMessageComponent,
    BaseContentComponent,
    BaseContentNavBarBreadCrumbDirective,
    BaseContentNavBarPreLogoActionDirective,
    BaseContentNavOptionsDirective,
    BaseContentPageFooterDirective,
    CreateActivityButtonComponent,
    LoadingMessageComponent,
    OppiaAngularRootComponent,
    OppiaFooterComponent,
    SideNavigationBarComponent,
    SocialButtonsComponent,
    TopNavigationBarComponent,
    WarningsAndAlertsComponent,
  ],
})
export class BaseModule {}
