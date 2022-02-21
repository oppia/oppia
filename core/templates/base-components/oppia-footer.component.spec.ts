// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the Base Transclusion Component.
 */

import { AppConstants } from 'app.constants';
import { OppiaFooterComponent } from './oppia-footer.component';

describe('OppiaFooterComponent', ()=>{
  let component: OppiaFooterComponent;
  beforeEach(()=>{
    component = new OppiaFooterComponent();
  });

  it('should get the siteFeedbackFormURL', () => {
    expect(component.siteFeedbackFormUrl)
      .toBe(AppConstants.SITE_FEEDBACK_FORM_URL);
  });

  it('should get the pages registered with frontend', ()=>{
    expect(component.PAGES_REGISTERED_WITH_FRONTEND)
      .toBe(AppConstants.PAGES_REGISTERED_WITH_FRONTEND);
  });
});
