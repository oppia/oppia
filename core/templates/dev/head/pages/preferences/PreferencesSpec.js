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

describe('Preferences Controller', function() {
  describe('PreferencesCtrl', function() {
    var scope, ctrl, $httpBackend, mockAlertsService;

    beforeEach(function() {
      module('oppia');
    });

    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(inject(function(_$httpBackend_, $http, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/preferenceshandler/data').respond({
        can_receive_email_updates: false,
        can_receive_editor_role_email: true,
        can_receive_feedback_message_email: true
      });

      mockAlertsService = {};

      scope = $rootScope.$new();

      ctrl = $controller('Preferences', {
        $scope: scope,
        $http: $http,
        $rootScope: $rootScope,
        AlertsService: mockAlertsService
      });
    }));

    it('should show that editor role notifications checkbox is true by default',
      function() {
        $httpBackend.flush();
        expect(scope.canReceiveEditorRoleEmail).toBe(true);
      });

    it('should show that feedback message notifications checkbox is true' +
      'by default',
    function() {
      $httpBackend.flush();
      expect(scope.canReceiveFeedbackMessageEmail).toBe(true);
    });
  });
});
