// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Alerts Service.
 */

describe('Alerts Service', function() {
  var alertsService;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    alertsService = $injector.get('alertsService');
  }));

  describe('Warnings', function() {
    it('should add a warning', function() {
      expect(alertsService.warnings.length).toBe(0);
      alertsService.addWarning('Warning 1');
      expect(alertsService.warnings.length).toBe(1);
    });

    it('should delete a warning (no duplicates)', function() {
      var warning = 'Warning 1';
      // Warning message to be deleted
      alertsService.addWarning(warning);
      // Add a few other warning message
      alertsService.addWarning('Warning 2');
      alertsService.addWarning('Warning 3');

      expect(alertsService.warnings.length).toBe(3);
      alertsService.deleteWarning({
        type: 'warning',
        content: warning
      });
      expect(alertsService.warnings.length).toBe(2);

      // Search for the deleted warning message
      var found = false;
      for (var i = 0; i < alertsService.warnings.length; i++) {
        if (alertsService.warnings[i].content === warning) {
          found = true;
        }
      }
      expect(found).toBe(false);
      expect(alertsService.warnings[0].content).toBe('Warning 2');
      expect(alertsService.warnings[1].content).toBe('Warning 3');
    });

    it('should delete a warning (with duplicates)', function() {
      var warning = 'Warning 1';
      // Warning message to be deleted
      alertsService.addWarning(warning);
      // Add a few other warning message
      alertsService.addWarning('Warning 2');
      alertsService.addWarning(warning);
      alertsService.addWarning('Warning 3');

      expect(alertsService.warnings.length).toBe(4);
      alertsService.deleteWarning({
        type: 'warning',
        content: warning
      });
      expect(alertsService.warnings.length).toBe(2);

      // Search for the deleted warning message
      var found = false;
      for (var i = 0; i < alertsService.warnings.length; i++) {
        if (alertsService.warnings[i].content === warning) {
          found = true;
        }
      }
      expect(found).toBe(false);
      expect(alertsService.warnings[0].content).toBe('Warning 2');
      expect(alertsService.warnings[1].content).toBe('Warning 3');
    });

    it('should not add more than 10 warnings', function() {
      var warning = 'Warning ';
      for (var i = 1; i < 15; i++) {
        alertsService.addWarning(warning + i);
      }
      expect(alertsService.warnings.length).toBe(10);
    });

    it('should clear all the warning messages', function() {
      alertsService.addWarning('Warning 1');
      alertsService.addWarning('Warning 2');
      alertsService.addWarning('Warning 3');
      alertsService.clearWarnings();
      expect(alertsService.warnings.length).toBe(0);
    });
  });

  describe('Messages', function() {
    it('should add an info message', function() {
      var message = 'Info 1';
      expect(alertsService.messages.length).toBe(0);
      alertsService.addInfoMessage(message);
      expect(alertsService.messages.length).toBe(1);
      expect(alertsService.messages[0].type).toBe('info');
      expect(alertsService.messages[0].content).toBe(message);
    });

    it('should add a success message', function() {
      var message = 'Success 1';
      expect(alertsService.messages.length).toBe(0);
      alertsService.addSuccessMessage(message);
      alertsService.addInfoMessage('Info 1');
      expect(alertsService.messages.length).toBe(2);
      expect(alertsService.messages[0].type).toBe('success');
      expect(alertsService.messages[0].content).toBe(message);
    });

    it('should delete a message (no duplicates)', function() {
      var message = 'Info 1';
      // Info Message to be deleted
      alertsService.addInfoMessage(message);
      // Add a few other messages
      alertsService.addInfoMessage('Info 2');
      alertsService.addSuccessMessage('Success 1');

      expect(alertsService.messages.length).toBe(3);
      alertsService.deleteMessage({
        type: 'info',
        content: message
      });
      expect(alertsService.messages.length).toBe(2);

      // Search for the message
      var found = false;
      for (var i = 0; i < alertsService.messages.length; i++) {
        if (alertsService.messages[i].content === message &&
            alertsService.messages[i].type === 'info') {
          found = true;
        }
      }
      expect(found).toBe(false);
      expect(alertsService.messages[0].content).toBe('Info 2');
      expect(alertsService.messages[1].content).toBe('Success 1');
    });

    it('should delete a message (with duplicates)', function() {
      var message = 'Info 1';
      // Info Message to be deleted
      alertsService.addInfoMessage(message);
      // Add a few other messages
      alertsService.addInfoMessage('Info 2');
      alertsService.addSuccessMessage('Success 1');
      alertsService.addInfoMessage(message);

      expect(alertsService.messages.length).toBe(4);
      alertsService.deleteMessage({
        type: 'info',
        content: message
      });
      expect(alertsService.messages.length).toBe(2);

      // Search for the message
      var found = false;
      for (var i = 0; i < alertsService.messages.length; i++) {
        if (alertsService.messages[i].content === message &&
            alertsService.messages[i].type === 'info') {
          found = true;
        }
      }
      expect(found).toBe(false);
      expect(alertsService.messages[0].content).toBe('Info 2');
      expect(alertsService.messages[1].content).toBe('Success 1');
    });

    it('should not add more than 10 messages', function() {
      var message = 'Info ';
      for (var i = 1; i < 15; i++) {
        alertsService.addInfoMessage(message + i);
      }
      alertsService.addSuccessMessage('Success 1');
      expect(alertsService.messages.length).toBe(10);
    });

    it('should clear all the messages', function() {
      alertsService.addInfoMessage('Info 1');
      alertsService.addInfoMessage('Info 2');
      alertsService.addSuccessMessage('Success 1');
      alertsService.clearMessages();
      expect(alertsService.messages.length).toBe(0);
    });
  });
});
