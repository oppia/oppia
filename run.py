import os
from string import Template

def write_to_file(r_apth, content, i_dict):
    
    # Ensure the directory exists
    os.makedirs(os.path.dirname(r_apth), exist_ok=True)

    # Perform string interpolation
    template = Template(content)
    c = template.substitute(i_dict)

    with open(r_apth, 'w') as f:
        f.write(c)

left = [
        "console-errors.htm",
    "email-dashboard-result.mai",
    "error-iframed.mai",
    "error-page-400.mai",
    "error-page-401.mai",
    "error-page-500.mai",
        "lightweight-oppia-root.mai",
         "oppia-root.mai",
]

compContent = """// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview $fileoverview component.
 */

import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppConstants } from 'app.constants';
import { PageHeadService } from 'services/page-head.service';
import { BaseRootComponent } from 'pages/BaseRootComponentClass';


@Component({
  selector: '$selector',
  templateUrl: '$templateUrl',
})
export class $classname extends BaseRootComponent {
  constructor(
      pageHeadService: PageHeadService,
      translateService: TranslateService
  ) {
    super(
      pageHeadService,
      translateService,
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.$appConstant.TITLE,
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.$appConstant.META
    );
  }
}
"""

compHtml = """<oppia-angular-root>
    <oppia-base-content>
      <navbar-breadcrumb>
        <ul class="nav navbar-nav oppia-navbar-breadcrumb">
          <li>
            <span class="oppia-navbar-breadcrumb-separator"></span>
            <span [innerHTML]="'I18N_ABOUT_PAGE_BREADCRUMB' | translate"></span>
          </li>
        </ul>
      </navbar-breadcrumb>
      <content>
        <oppia-$text-page></oppia-$text-page>
      </content>
    </oppia-base-content>
</oppia-angular-root>
"""

# specify your relative path, file name, content and interpolation dictionary here
abc = [
    "blog-admin",
    "classroom-admin",
    "diagnostic-test-player",
    "blog-dashboard",
    "collection-editor",
    "collection-player",
    "creator-dashboard",
    "contributor-dashboard-admin",
    "contributor-dashboard",
    "email-dashboard",
    "exploration-editor",
    "learner-dashboard",
    "maintenance",
    "moderator",
    "practice-session",
    "review-test",
    "skill-editor",
    "story-editor",
    "subtopic-viewer",
    "topic-editor",
    "topics-and-skills-dashboard",
    "topic-viewer",
    "facilitator-dashboard",
    "create-learner-group",
    "edit-learner-group"
]

comps = [
    "./core/templates/pages/blog-admin-page/blog-admin-page-root.component.html",
    "./core/templates/pages/classroom-admin-page/classroom-admin-page-root.component.html",
    "./core/templates/pages/diagnostic-test-player-page/diagnostic-test-player-page-root.component.html",
    "./core/templates/pages/blog-dashboard-page/blog-dashboard-page-root.component.html",
    "./core/templates/pages/collection-editor-page/collection-editor-page-root.component.html",
    "./core/templates/pages/collection-player-page/collection-player-page-root.component.html",
    "./core/templates/pages/creator-dashboard-page/creator-dashboard-page-root.component.html",
    "./core/templates/pages/contributor-dashboard-admin-page/contributor-dashboard-admin-page-root.component.html",
    "./core/templates/pages/contributor-dashboard-page/contributor-dashboard-page-root.component.html",
    "./core/templates/pages/email-dashboard-page/email-dashboard-page-root.component.html",
    "./core/templates/pages/exploration-editor-page/exploration-editor-page-root.component.html",
    "./core/templates/pages/learner-dashboard-page/learner-dashboard-page-root.component.html",
    "./core/templates/pages/maintenance-page/maintenance-page-root.component.html",
    "./core/templates/pages/moderator-page/moderator-page-root.component.html",
    "./core/templates/pages/practice-session-page/practice-session-page-root.component.html",
    "./core/templates/pages/review-test-page/review-test-page-root.component.html",
    "./core/templates/pages/skill-editor-page/skill-editor-page-root.component.html",
    "./core/templates/pages/story-editor-page/story-editor-page-root.component.html",
    "./core/templates/pages/subtopic-viewer-page/subtopic-viewer-page-root.component.html",
    "./core/templates/pages/topic-editor-page/topic-editor-page-root.component.html",
    "./core/templates/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-root.component.html",
    "./core/templates/pages/topic-viewer-page/topic-viewer-page-root.component.html",
    "./core/templates/pages/facilitator-dashboard-page/facilitator-dashboard-page-root.component.html",
    "./core/templates/pages/create-learner-group-page/create-learner-group-page-root.component.html",
    "./core/templates/pages/edit-learner-group-page/edit-learner-group-page-root.component.html"
]

for i in range(len(comps)):
    comp = comps[i]
    page_name = abc[i]
    interpolation_dict = {
        'fileoverview': page_name.title() + '-page-root component',
        'selector': 'oppia-' + page_name + '-page-root',
        'templateUrl': './' + page_name + '-page-root.component.html',
        'classname': page_name.replace("-", " ").title().replace(" ", "") + 'PageRootComponent',
        'appConstant': page_name.replace("-", "_").upper(),
        'text': page_name,
        'f': comp.split('./core/templates/')[1].split('-root.component.html')[0] + '.module',
        'moduleName': page_name.replace("-", " ").title().replace(" ", "") + 'PageModule',
      }
    # write_to_file(comp, compHtml, interpolation_dict)
    print(Template("""  {
    path: (
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.$appConstant.ROUTE
    ),
    pathMatch: 'full',
    loadChildren: () => import(
      '$f')
      .then(m => m.$moduleName)
  },""").substitute(interpolation_dict))

