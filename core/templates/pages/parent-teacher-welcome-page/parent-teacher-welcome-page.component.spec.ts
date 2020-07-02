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
 * @fileoverview Unit tests for the parent and teacher welcome guide page.
 */

import { WindowRef } from 'services/contextual/window-ref.service';

require ('pages/parent-teacher-welcome-page/' + 'parent-teacher-welcome-page.component.ts');

// TODO(diana): Change to be for the right page

describe('Parents and Teachers Welcome Page', function() {
  var ctrl = null;
  var windowRef = new WindowRef();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('WindowRef', windowRef);
  }));
  beforeEach(angular.mock.inject(function($componentController) {
  	ctrl = $componentController('parentTeacherWelcomePage')
  }));

  afterEach(function() {
    // onhashchange and location.hash are reassigned because it shares
    // same memory reference to all test blocks and the controller itself
    // because $provide.value of WindowRef refers to windowRef as well.
    // Once location.hash or onhashchange is set in the controller,
    // the value will be only available in the test block itself, not affecting
    // others test block.
    windowRef.nativeWindow.onhashchange = null;
    windowRef.nativeWindow.location.hash = '';
  });

  it('should contain the right classes and i18n information for ' +
	'the bullet points', function(done) {
  	ctrl.$onInit();
    expect(ctrl.arr).toBe([
	  {pClass: 'oppia-parent-teacher-welcome-guide-numbers',
	    spanClass: 'oppia-parent-teacher-welcome-guide-blue',
	    I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_1'},
	  {pClass: 'oppia-parent-teacher-welcome-guide-numbers',
	    spanClass: 'oppia-parent-teacher-welcome-guide-purple',
	    I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_2'},
	  {pClass: 'oppia-parent-teacher-welcome-guide-numbers',
	    spanClass: 'oppia-parent-teacher-welcome-guide-red',
	    I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_3'},
	  {pClass: 'oppia-parent-teacher-welcome-guide-numbers',
	    spanClass: 'oppia-parent-teacher-welcome-guide-orange',
	    I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_4'},
	  {pClass: 'oppia-parent-teacher-welcome-guide-numbers',
	    spanClass: 'oppia-parent-teacher-welcome-guide-green',
	    I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_5'}
	]);
  });

  it('should return the Fraction Exploration PNG URL', function(done) {
  	ctrl.$onInit();
    expect(ctrl.fractionExplorationPngImageUrl).toBe(
      '/parent_teacher_welcome_page/fractions_exploration.png');
  });

  it('should return the Fraction Exploration Webp Image URL', function(done) {
  	ctrl.$onInit();
    expect(ctrl.fractionExplorationPngImageUrl).toBe(
      '/parent_teacher_welcome_page/fractions_exploration.webp');
  });

  it('should return the Oppia Users PNG URL', function(done) {
  	ctrl.$onInit();
    expect(ctrl.fractionExplorationPngImageUrl).toBe(
      '/parent_teacher_welcome_page/oppia_users.png');
  });

  it('should return the Oppia Users Webp Image URL', function(done) {
  	ctrl.$onInit();
    expect(ctrl.fractionExplorationPngImageUrl).toBe(
      '/parent_teacher_welcome_page/oppia_users.webp');
  });

  it('should return the Library PNG URL', function(done) {
  	ctrl.$onInit();
    expect(ctrl.fractionExplorationPngImageUrl).toBe(
      '/parent_teacher_welcome_page/exploration_library.png');
  });

  it('should return the Library Webp Image URL', function(done) {
  	ctrl.$onInit();
    expect(ctrl.fractionExplorationPngImageUrl).toBe(
      '/parent_teacher_welcome_page/exploration_library.webp');
  });
});
