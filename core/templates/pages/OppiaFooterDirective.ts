// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the footer.
 */

import { Component, OnInit } from '@angular/core';
import constants from 'assets/constants';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'oppia-footer',
  templateUrl: './oppia_footer_directive.html',
  styleUrls: []
})

export class OppiaFooterComponent implements OnInit{
  siteFeedbackFormUrl: string
  constructor() {}

  ngOnInit(): void {
  this.siteFeedbackFormUrl = constants.SITE_FEEDBACK_FORM_URL;
  }
}

angular.module('oppia').directive(
  'oppiaFooter', downgradeComponent({component: OppiaFooterComponent}));

