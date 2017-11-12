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
  var AlertsService;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    AlertsService = $injector.get('AlertsService');
  }));

  describe('Warnings', function() {
    it('should add a warning', function() {
      expect(AlertsService.warnings.length).toBe(0);
      AlertsService.addWarning('Warning 1');
      expect(AlertsService.warnings.length).toBe(1);
    });

    it('should delete a warning (no duplicates)', function() {
      var warning = 'Warning 1';
      // Warning message to be deleted
      AlertsService.addWarning(warning);
      // Add a few other warning message
      AlertsService.addWarning('Warning 2');
      AlertsService.addWarning('Warning 3');

      expect(AlertsService.warnings.length).toBe(3);
      AlertsService.deleteWarning({
        type: 'warning',
        content: warning
      });
      expect(AlertsService.warnings.length).toBe(2);

      // Search for the deleted warning message
      var found = false;
      for (var i = 0; i < AlertsService.warnings.length; i++) {
        if (AlertsService.warnings[i].content === warning) {
          found = true;
        }
      }
      expect(found).toBe(false);
      expect(AlertsService.warnings[0].content).toBe('Warning 2');
      expect(AlertsService.warnings[1].content).toBe('Warning 3');
    });

    it('should delete a warning (with duplicates)', function() {
      var warning = 'Warning 1';
      // Warning message to be deleted
      AlertsService.addWarning(warning);
      // Add a few other warning message
      AlertsService.addWarning('Warning 2');
      AlertsService.addWarning(warning);
      AlertsService.addWarning('Warning 3');

      expect(AlertsService.warnings.length).toBe(4);
      AlertsService.deleteWarning({
        type: 'warning',
        content: warning
      });
      expect(AlertsService.warnings.length).toBe(2);

      // Search for the deleted warning message
      var found = false;
      for (var i = 0; i < AlertsService.warnings.length; i++) {
        if (AlertsService.warnings[i].content === warning) {
          found = true;
        }
      }
      expect(found).toBe(false);
      expect(AlertsService.warnings[0].content).toBe('Warning 2');
      expect(AlertsService.warnings[1].content).toBe('Warning 3');
    });

    it('should not add more than 10 warnings', function() {
      var warning = 'Warning ';
      for (var i = 1; i < 15; i++) {
        AlertsService.addWarning(warning + i);
      }
      expect(AlertsService.warnings.length).toBe(10);
    });

    it('should clear all the warning messages', function() {
      AlertsService.addWarning('Warning 1');
      AlertsService.addWarning('Warning 2');
      AlertsService.addWarning('Warning 3');
      AlertsService.clearWarnings();
      expect(AlertsService.warnings.length).toBe(0);
    });
  });

  describe('Messages', function() {
    it('should add an info message', function() {
      var message = 'Info 1';
      expect(AlertsService.messages.length).toBe(0);
      AlertsService.addInfoMessage(message);
      expect(AlertsService.messages.length).toBe(1);
      expect(AlertsService.messages[0].type).toBe('info');
      expect(AlertsService.messages[0].content).toBe(message);
    });

    it('should add a success message', function() {
      var message = 'Success 1';
      expect(AlertsService.messages.length).toBe(0);
      AlertsService.addSuccessMessage(message);
      AlertsService.addInfoMessage('Info 1');
      expect(AlertsService.messages.length).toBe(2);
      expect(AlertsService.messages[0].type).toBe('success');
      expect(AlertsService.messages[0].content).toBe(message);
    });

    it('should delete a message (no duplicates)', function() {
      var message = 'Info 1';
      // Info Message to be deleted
      AlertsService.addInfoMessage(message);
      // Add a few other messages
      AlertsService.addInfoMessage('Info 2');
      AlertsService.addSuccessMessage('Success 1');

      expect(AlertsService.messages.length).toBe(3);
      AlertsService.deleteMessage({
        type: 'info',
        content: message
      });
      expect(AlertsService.messages.length).toBe(2);

      // Search for the message
      var found = false;
      for (var i = 0; i < AlertsService.messages.length; i++) {
        if (AlertsService.messages[i].content === message &&
            AlertsService.messages[i].type === 'info') {
          found = true;
        }
      }
      expect(found).toBe(false);
      expect(AlertsService.messages[0].content).toBe('Info 2');
      expect(AlertsService.messages[1].content).toBe('Success 1');
    });

    it('should delete a message (with duplicates)', function() {
      var message = 'Info 1';
      // Info Message to be deleted
      AlertsService.addInfoMessage(message);
      // Add a few other messages
      AlertsService.addInfoMessage('Info 2');
      AlertsService.addSuccessMessage('Success 1');
      AlertsService.addInfoMessage(message);

      expect(AlertsService.messages.length).toBe(4);
      AlertsService.deleteMessage({
        type: 'info',
        content: message
      });
      expect(AlertsService.messages.length).toBe(2);

      // Search for the message
      var found = false;
      for (var i = 0; i < AlertsService.messages.length; i++) {
        if (AlertsService.messages[i].content === message &&
            AlertsService.messages[i].type === 'info') {
          found = true;
        }
      }
      expect(found).toBe(false);
      expect(AlertsService.messages[0].content).toBe('Info 2');
      expect(AlertsService.messages[1].content).toBe('Success 1');
    });

    it('should not add more than 10 messages', function() {
      var message = 'Info ';
      for (var i = 1; i < 15; i++) {
        AlertsService.addInfoMessage(message + i);
      }
      AlertsService.addSuccessMessage('Success 1');
      expect(AlertsService.messages.length).toBe(10);
    });

    it('should clear all the messages', function() {
      AlertsService.addInfoMessage('Info 1');
      AlertsService.addInfoMessage('Info 2');
      AlertsService.addSuccessMessage('Success 1');
      AlertsService.clearMessages();
      expect(AlertsService.messages.length).toBe(0);
    });
  });
});
