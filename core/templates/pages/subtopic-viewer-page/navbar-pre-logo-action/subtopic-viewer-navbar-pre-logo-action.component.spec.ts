// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the subtopic viewer pre logo action
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UrlService } from 'services/contextual/url.service';

import { SubtopicViewerNavbarPreLogoAction } from
  './subtopic-viewer-navbar-pre-logo-action.component';

let component: SubtopicViewerNavbarPreLogoAction;
let fixture: ComponentFixture<SubtopicViewerNavbarPreLogoAction>;
describe('subtopic viewer pre logo action', function() {
  let urlService: UrlService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubtopicViewerNavbarPreLogoAction],
      providers: [UrlService],
    }).compileComponents();
    fixture = TestBed.createComponent(SubtopicViewerNavbarPreLogoAction);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    urlService = TestBed.get(UrlService);
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl')
      .and.returnValue('url-fragment');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('math');
  });

  it('should set topic url fragment from the URL correctly', function() {
    component.ngOnInit();
    expect(component.topicUrlFragment).toEqual('url-fragment');
  });

  it('should set the topic url from the url fragment correctly', function() {
    component.ngOnInit();
    expect(component.topicUrl).toEqual('/learn/math/url-fragment/revision');
  });
});
