import 'mousetrap';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutService {
  moveFocusToSearch() {
    Mousetrap.bind('/', function() {
      document.getElementById('searchBar').focus();
      return false;
    });
  }

  moveFocusToCategory() {
    Mousetrap.bind('c', function() {
      document.getElementById('categoryBar').focus();
      return false;
    });
  }

  moveFocusToSkipButton() {
    Mousetrap.bind('s', function() {
      document.getElementById('skipToMainContentId').focus();
      return false;
    });
  }

  moveFocusToBackButton = function() {
    Mousetrap.bind('k', function() {
      var previousButton = document.getElementById('backButtonId');

      if (previousButton !== null) {
        previousButton.focus();
      }

      return false;
    });
  };

  moveFocusToNextButton = function() {
    Mousetrap.bind('j', function() {
      var nextButton = <HTMLElement>document.querySelector(
        '.protractor-test-next-button');

      if (nextButton !== null) {
        nextButton.focus();
      }

      return false;
    });
  };

  bindExplorationPlayerShortcuts() {
    Mousetrap.bind('s', function() {
      document.getElementById('skipToMainContentId').focus();
      return false;
    });

    Mousetrap.bind('k', function() {
      var previousButton = document.getElementById('backButtonId');
      if (previousButton !== null) {
        previousButton.focus();
      }
      return false;
    });

    Mousetrap.bind('j', function() {
      var nextButton = <HTMLElement>document.querySelector(
        '.protractor-test-next-button');
      if (nextButton !== null) {
        nextButton.focus();
      }
      return false;
    });
  }

  bindLibraryPageShortcuts() {
    Mousetrap.bind('/', function() {
      document.getElementById('searchBar').focus();
      return false;
    });

    Mousetrap.bind('c', function() {
      document.getElementById('categoryBar').focus();
      return false;
    });

    Mousetrap.bind('s', function() {
      document.getElementById('skipToMainContentId').focus();
      return false;
    });
  }

  bindNavigationShortcuts() {
    Mousetrap.bind('ctrl+mod+0', function() {
      window.location.href = '/get-started';
    });

    Mousetrap.bind('ctrl+mod+1', function() {
      window.location.href = '/community-library';
    });

    Mousetrap.bind('ctrl+mod+2', function() {
      window.location.href = '/creator-dashboard';
    });

    Mousetrap.bind('ctrl+mod+3', function() {
      window.location.href = '/creator-dashboard';
    });

    Mousetrap.bind('ctrl+mod+4', function() {
      window.location.href = '/';
    });

    Mousetrap.bind('ctrl+mod+5', function() {
      window.location.href = '/notifications';
    });

    Mousetrap.bind('ctrl+mod+6', function() {
      window.location.href = '/preferences';
    });
  }
}

angular.module('oppia').factory(
  'KeyboardShortcutService', downgradeInjectable(KeyboardShortcutService));
