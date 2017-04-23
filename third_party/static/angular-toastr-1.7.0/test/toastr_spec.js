describe('toastr', function() {
  var $animate, $document, $rootScope, $timeout, $interval;
  var toastr, toastrConfig, originalConfig = {};

  beforeEach(module('ngAnimateMock'));
  beforeEach(module('toastr'));

  beforeEach(inject(function(_$animate_, _$document_, _$rootScope_, _$interval_, _$timeout_, _toastr_, _toastrConfig_) {
    $animate = _$animate_;
    $document = _$document_;
    $rootScope = _$rootScope_;
    $interval = _$interval_;
    $timeout = _$timeout_;
    toastr = _toastr_;
    angular.copy(_toastrConfig_, originalConfig);
    toastrConfig = _toastrConfig_;
  }));

  afterEach(function() {
    $document.find('#toast-container').remove();
    angular.copy(originalConfig, toastrConfig);
  });

  beforeEach(function() {
    jasmine.addMatchers({
      toHaveA: function() {
        return {
          compare: function(toast, tag) {
            var el = toast.el.find(tag);
            return {
              pass: el.length > 0
            };
          }
        };
      },

      toHaveButtonWith: function(util, customEqualityTesters) {
        return {
          compare: function(toast, text) {
            var buttomDomEl = toast.el.find('.toast-close-button');
            return {
              pass: util.equals(buttomDomEl.text(), text, customEqualityTesters)
            };
          }
        };
      },

      toHaveClass: function() {
        return {
          compare: function(toast, klass) {
            return {
              pass: toast.el.hasClass(klass)
            };
          }
        };
      },

      toHaveProgressBar: function(util, customEqualityTesters) {
        return {
          compare: function(toast) {
            var progressBarEl = toast.el.find('.toast-progress');
            return {
              pass: util.equals(progressBarEl.length, 1, customEqualityTesters)
            };
          }
        };
      },

      toHaveToastContainer: function(util, customEqualityTesters) {
        return {
          compare: function(document, target) {
            target = target || 'body';
            var containerDomEl = document.find(target + ' > #toast-container');
            return {
              pass: util.equals(containerDomEl.length, 1, customEqualityTesters)
            };
          }
        };
      },

      toHaveToastOpen: function(util, customEqualityTesters) {
        return {
          compare: function(document, noOfToasts, target) {
            target = target || 'body';
            var toastDomEls = document.find(target + ' > #toast-container > .toast');
            return {
              pass: util.equals(toastDomEls.length, noOfToasts, customEqualityTesters)
            };
          }
        };
      },

      toHaveTitle: function(util, customEQualityTesters) {
        return {
          compare: function(toast) {
            var title = toast.el.find('.toast-title');
            return {
              pass: util.equals(title.length, 1, customEQualityTesters)
            };
          }
        };
      },

      toHaveAriaLabelOnTitle: function() {
        return {
          compare: function(toast) {
            var title = toast.el.find('.toast-title');
            return {
              pass: title.is('[aria-label]')
            };
          }
        };
      },

      toHaveAriaLabelOnMessage: function() {
        return {
          compare: function(toast) {
            var message = toast.el.find('.toast-message');
            return {
              pass: message.is('[aria-label]')
            };
          }
        };
      },

      toHaveType: function() {
        return {
          compare: function(toast, type) {
            var typeClass = 'toast-' + type;
            return {
              pass: toast.el.hasClass(typeClass)
            };
          }
        };
      },

      toHaveToastWithMessage: function(util, customEqualityTesters) {
        return {
          compare: function(document, message, toast, target) {
            target = target || 'body';
            var found,
              contentToCompare,
              toastsDomEl = document.find(target + ' > #toast-container > .toast');

            if (toast) {
              contentToCompare = toastsDomEl.eq(toast).find('.toast-message').eq(0).html();

              found = util.equals(contentToCompare, message, customEqualityTesters);
            } else {
              for (var i = 0, l = toastsDomEl.length; i < l; i++) {
                contentToCompare = toastsDomEl.eq(i).find('.toast-message').eq(0).html();

                found = util.equals(contentToCompare, message, customEqualityTesters);

                if (found) {
                  break;
                }
              }
            }

            return {
              pass: found
            };
          }
        };
      },

      toHaveToastWithTitle: function(util, customEqualityTesters) {
        return {
          compare: function(document, title, toast, target) {
            target = target || 'body';
            var found,
              contentToCompare,
              toastsDomEl = document.find(target + ' > #toast-container > .toast');

            if (toast) {
              contentToCompare = toastsDomEl.eq(toast).find('.toast-title').eq(0).html();

              found = util.equals(contentToCompare, title, customEqualityTesters);
            } else {
              for (var i = 0, l = toastsDomEl.length; i < l; i++) {
                contentToCompare = toastsDomEl.eq(i).find('.toast-title').eq(0).html();

                found = util.equals(contentToCompare, title, customEqualityTesters);

                if (found) {
                  break;
                }
              }
            }

            return {
              pass: found
            };
          }
        };
      }
    });
  });

  function _findToast(toast, target) {
    target = target || 'body';
    return $document.find(target + ' > #toast-container > .toast').eq(toast || 0);
  }

  function _findToastCloseButton(toast, target) {
    target = target || 'body';
    return $document.find(target + ' > #toast-container > .toast > .toast-close-button').eq(toast || 0);
  }

  // Needed when we want to run the callback of enter or leave.
  function animationFlush() {
    // This is not compatible with all the tests
    // But it is easier to swallow the errors, tests still run and pass.
    try {
      $animate.flush();
      $rootScope.$digest();
    } catch (e) {

    }
  }

  function clickToast(noOfToast) {
    var toast = _findToast(noOfToast);
    toast.click();

    $rootScope.$digest();
    animationFlush();
  }

  function clickToastCloseButton(noOfToast) {
    var toastCloseButton = _findToastCloseButton(noOfToast);
    toastCloseButton.click();
    $rootScope.$digest();
    animationFlush();
  }

  function hoverToast(noOfToast) {
    var toast = _findToast(noOfToast);
    toast.trigger('mouseenter');
  }

  function leaveToast(noOfToast) {
    var toast = _findToast(noOfToast);
    toast.trigger('mouseleave');
  }

  function openToast(type, message, title, options) {
    var toast = toastr[type](message, title, options);

    $rootScope.$digest();
    animationFlush();
    animationFlush();

    return toast;
  }

  function openToasts(noOfToast, optionsOverride) {
    for (var i = 0; i < noOfToast; i++) {
      toastr.success('message', 'title', optionsOverride);
    }
    $rootScope.$digest();
    animationFlush();
    animationFlush();
  }

  function removeToast(toast) {
    toastr.clear(toast);
    $rootScope.$digest();
    animationFlush();
  }

  function intervalFlush(millis) {
    $interval.flush(millis || 5000);
  }

  describe('basic scenarios', function() {
    it('should be able to open a toast in the container', function() {
      openToasts(1);
      expect($document).toHaveToastOpen(1);
      intervalFlush();
      expect($document).toHaveToastOpen(0);
    });

    it('should be able to stack more than one toast', function() {
      openToasts(5);
      expect($document).toHaveToastOpen(5);
      intervalFlush();
      expect($document).toHaveToastOpen(0);
    });

    it('should close a toast upon click', function () {
      openToasts(1);
      expect($document).toHaveToastOpen(1);
      clickToast();
      expect($document).toHaveToastOpen(0);
    });

    it('should not close a toast with !tapToDismiss upon click', function () {
      openToasts(1, { tapToDismiss: false });
      expect($document).toHaveToastOpen(1);
      clickToast();
      expect($document).toHaveToastOpen(1);
    });

    it('should close a toast clicking the close button', function () {
      openToasts(1, { tapToDismiss: false, closeButton: true });
      expect($document).toHaveToastOpen(1);
      clickToastCloseButton();
      expect($document).toHaveToastOpen(0);
    });

    it('should contain a title and a message', function () {
      openToast('success', 'World', 'Hello');
      expect($document).toHaveToastWithMessage('World');
      expect($document).toHaveToastWithTitle('Hello');
    });

    it('have an optional title', function() {
      openToasts(5);
      var toast = openToast('success', 'Hello');
      expect(toast).not.toHaveTitle();
    });

    it('has a flag indicating whether it is opened or not', function() {
      var toast = toastr.success('foo');

      expect(toast.isOpened).toBe(false);

      $rootScope.$digest();
      animationFlush();
      animationFlush();

      expect(toast.isOpened).toBe(true);

      intervalFlush();

      expect(toast.isOpened).toBe(false);
    });

    it('has multiple types of toasts', function() {
      var toast = openToast('success', 'foo');
      expect(toast).toHaveType('success');
      intervalFlush();
      toast = openToast('error', 'foo');
      expect(toast).toHaveType('error');
      intervalFlush();
      toast = openToast('info', 'foo');
      expect(toast).toHaveType('info');
      intervalFlush();
      toast = openToast('warning', 'foo');
      expect(toast).toHaveType('warning');
      intervalFlush();
    });

    it('allows to manually close a toast in code', function() {
      var toast = openToast('success', 'foo');
      expect($document).toHaveToastOpen(1);
      toastr.clear(toast);
      $rootScope.$digest();
      expect($document).toHaveToastOpen(0);
      animationFlush();
      expect($document).not.toHaveToastContainer();
    });

    it('allows to close all toasts at once', function() {
      openToasts(10);
      expect($document).toHaveToastOpen(10);
      toastr.clear();
      $rootScope.$digest();
      expect($document).toHaveToastOpen(0);
      animationFlush();
      expect($document).not.toHaveToastContainer();
    });

    it('has a list of active toasts', function() {
      openToasts(5);
      expect(toastr.active()).toBe(5);
      clickToast();
      clickToast();
      expect(toastr.active()).toBe(3);
      intervalFlush();
      animationFlush();
      expect(toastr.active()).toBe(0);
    });
  });

  describe('container', function() {
    it('should create a new toastr container when the first toast is created', function() {
      expect($document).not.toHaveToastContainer();
      openToasts(1);
      expect($document).toHaveToastContainer();
    });

    it('should delete the toastr container when the last toast is gone', function() {
      expect($document).not.toHaveToastContainer();
      openToasts(2);
      expect($document).toHaveToastContainer();
      clickToast();
      expect($document).toHaveToastContainer();
      clickToast();
      expect($document).not.toHaveToastContainer();
    });

    it('is created again if it gets deleted', function() {
      expect($document).not.toHaveToastContainer();
      openToasts(2);
      expect($document).toHaveToastContainer();
      clickToast();
      expect($document).toHaveToastContainer();
      clickToast();
      expect($document).not.toHaveToastContainer();
      openToasts(1);
      expect($document).toHaveToastContainer();
    });

    it('can add the container to a custom target', function() {
      toastrConfig.target = '#toast-target';
      var target = angular.element('<div id="toast-target"/>');
      $document.find('body').append(target);

      var toast = openToast('success', 'toast');

      expect($document).toHaveToastContainer('#toast-target');

      expect($document).toHaveToastOpen(1, '#toast-target');

      intervalFlush();

      expect($document).toHaveToastOpen(0, '#toast-target');
      animationFlush();
      expect($document).not.toHaveToastContainer('#toast-target');
    });

    it('should throw an exception if the custom target doesn\'t exist', function() {
      toastrConfig.target = '#no-exist';

      expect(function() {
        openToast('success', 'foo');
      }).toThrow('Target for toasts doesn\'t exist');
    });
  });

  describe('directive behavior', function() {
    it('should not close a toast if hovered', function() {
      openToasts(1);
      hoverToast();
      intervalFlush();
      expect($document).toHaveToastOpen(1);
    });

    it('should close all the toasts but the hovered one', function() {
      openToasts(5);
      hoverToast(2);
      intervalFlush(); // Closing others...
      intervalFlush();
      expect($document).toHaveToastOpen(1);
    });

    it('should re-enable the timeout of a toast if you leave it', function() {
       openToasts(1);
       hoverToast();
       intervalFlush();
       expect($document).toHaveToastOpen(1);
       leaveToast();
       intervalFlush();
       expect($document).toHaveToastOpen(0);
    });
  });

  describe('options overriding', function() {
    it('can change the type of the toast', function() {
      var options = {
        iconClass: 'toast-pink'
      };
      var toast = openToast('success', 'message', 'title', options);
      expect(toast).toHaveClass(options.iconClass);
    });

    it('can override the toast class', function() {
      var options = {
        toastClass: 'my-toast'
      };
      var toast = openToast('error', 'message', 'title', options);
      expect(toast).toHaveClass(options.toastClass);
    });

    it('title and message should contain aria-label', function() {
      var toast = openToast('error', 'message', 'title');
      expect(toast).toHaveAriaLabelOnMessage();
      expect(toast).toHaveAriaLabelOnTitle();
    });

    it('can make a toast stick until is clicked or hovered (extended timeout)', function() {
       var options = {
         timeOut: 0
       };
       openToast('info', 'I don\'t want to go...', options);
       intervalFlush();
       expect($document).toHaveToastOpen(1);
       clickToast();
       expect($document).toHaveToastOpen(0);

       openToast('info', 'I don\'t want to go...', options);
       intervalFlush();
       expect($document).toHaveToastOpen(1);
       hoverToast();
       leaveToast();
       intervalFlush();
       expect($document).toHaveToastOpen(0);
    });

    it('can make a toast stick until is clicked', function() {
       var options = {
         timeOut: 0,
         extendedTimeOut: 0
       };
       openToast('info', 'I don\'t want to go...', options);
       intervalFlush();
       expect($document).toHaveToastOpen(1);
       hoverToast();
       leaveToast();
       expect($document).toHaveToastOpen(1);
       clickToast();
       expect($document).toHaveToastOpen(0);
    });

    it('can show custom html on the toast message', function() {
      var toast = openToast('success', 'I like to have a <button>button</button>', {
        allowHtml: true
      });
      expect(toast).toHaveA('button');
    });

    it('can show custom html on the toast title', function() {
      var toast = openToast('success', 'I want a surprise', '<button>button</button> Surprise', {
        allowHtml: true
      });
      expect(toast).toHaveA('button');
    });

    it('can limit the maximum opened toasts', function() {
      toastrConfig.maxOpened = 3;
      var toast1 = openToast('success', 'Toast 1');
      var toast2 = openToast('success', 'Toast 2');
      openToast('success', 'Toast 3');
      expect($document).toHaveToastOpen(3);
      openToast('success', 'Toast 4');
      expect($document).toHaveToastOpen(3);
      removeToast(toast1);
      expect($document).toHaveToastOpen(3);
      expect($document).not.toHaveToastWithMessage('Toast 1');
      openToast('success', 'Toast 5');
      expect($document).toHaveToastOpen(3);
      removeToast(toast2);
      expect($document).not.toHaveToastWithMessage('Toast 2');
    });

    it('can limit the maximum opened toasts with newestOnTop false', function() {
      toastrConfig.maxOpened = 3;
      toastrConfig.newestOnTop = false;
      var toast1 = openToast('success', 'Toast 1');
      openToast('success', 'Toast 2');
      openToast('success', 'Toast 3');
      expect($document).toHaveToastOpen(3);
      openToast('success', 'Toast 4');
      expect($document).toHaveToastOpen(3);
      removeToast(toast1);
      expect($document).not.toHaveToastWithMessage('Toast 1');
    });

    it('can auto dismiss old toasts', function() {
      toastrConfig.maxOpened = 1;
      toastrConfig.autoDismiss = true;
      var toast1 = openToast('success', 'Toast 1');
      openToast('success', 'Toast 2');
      openToast('success', 'Toast 3');
      expect($document).toHaveToastOpen(1);
      expect($document).toHaveToastWithMessage('Toast 3');
    });

    it('maxOpened and autoDimiss works together #95', function() {
      toastrConfig.maxOpened = 3;
      toastrConfig.autoDismiss = true;
      var toast1 = openToast('success', 'Toast 1');
      openToast('success', 'Toast 2');
      openToast('success', 'Toast 3');
      expect($document).toHaveToastOpen(3);
    });

    it('has not limit if maxOpened is 0', function() {
      toastrConfig.maxOpened = 0;
      openToast('success', 'Toast 1');
      openToast('success', 'Toast 2');
      openToast('success', 'Toast 3');
      expect($document).toHaveToastOpen(3);
      openToast('success', 'Toast 4');
      animationFlush();
      expect($document).toHaveToastOpen(4);
      expect($document).toHaveToastWithMessage('Toast 1');
    });

    it('can prevent duplicate toasts', function() {
      toastrConfig.preventDuplicates = true;
      openToast('success', 'Toast 1');
      expect($document).toHaveToastOpen(1);
      intervalFlush();
      openToast('success', 'Toast 1');
      expect($document).toHaveToastOpen(0);
    });

    it('can prevent duplicate of open toasts', function() {
      toastrConfig.preventDuplicates = false;
      toastrConfig.preventOpenDuplicates = true;
      var toast1 = openToast('success', 'Toast 1');
      var toast2 = openToast('success', 'Toast 2');
      openToast('success', 'Toast 1');
      openToast('success', 'Toast 2');
      var toast3 = openToast('success', 'Toast 3');
      openToast('success', 'Toast 1');
      expect($document).toHaveToastOpen(3);
      removeToast(toast1);
      removeToast(toast2);
      removeToast(toast3);
      openToast('success', 'Toast 1');
      expect($document).toHaveToastOpen(1);
    });

    it('does not merge options not meant for concrete toasts', function() {
      openToasts(2, {
        maxOpened: 2 // this is not meant for the toasts and gives weird side effects
      });
      expect($document).toHaveToastOpen(2);
      intervalFlush();
      openToasts(2, {
        maxOpened: 2
      });
      expect($document).toHaveToastOpen(2);
    });

    it('allows to change the templates of the directives', inject(function($templateCache) {
      $templateCache.put('foo/bar/template.html', '<div>This is my Template</div>');
      toastrConfig.timeOut = 200000;
      toastrConfig.templates.toast = 'foo/bar/template.html';

      var toast = openToast('success', 'foo');
      expect(toast.el.text()).toBe('This is my Template');
    }));

    it('allows to pass global extra data to the toastr directive', inject(function($templateCache) {
      $templateCache.put('foo/bar/template.html', '<div>{{extraData.foo}}</div>');
      toastrConfig.extraData = {foo: 'Hello!'};
      toastrConfig.templates.toast = 'foo/bar/template.html';

      var toast = openToast('success', 'foo');
      expect(toast.el.text()).toBe('Hello!');
    }));

    it('allows to pass extra data per toast to the toastr directive', inject(function($templateCache) {
      $templateCache.put('foo/bar/template.html', '<div>{{extraData.msg}}</div>');
      toastrConfig.templates.toast = 'foo/bar/template.html';
      var toast = openToast('success', 'foo', {
        extraData: {msg: 'First toast'}
      });

      var toast2 = openToast('info', 'bar', {
        extraData: {msg: 'Second toast'}
      });

      expect(toast.el.text()).toBe('First toast');
      expect(toast2.el.text()).toBe('Second toast');
    }));

    it('allows to override the global extra data per toast', inject(function($templateCache) {
      $templateCache.put('foo/bar/template.html', '<div>{{extraData.msg}}</div>');
      toastrConfig.extraData = {msg: 'Hello!'};
      toastrConfig.templates.toast = 'foo/bar/template.html';
      var toast = openToast('success', 'foo');

      var toast2 = openToast('info', 'bar', {
        extraData: {msg: 'Second toast'}
      });

      expect(toast.el.text()).toBe('Hello!');
      expect(toast2.el.text()).toBe('Second toast');
    }));
  });

  describe('close button', function() {
    it('should contain a close button with × if you add it', function() {
      var toast = openToast('info', 'I have a button', {
        closeButton: true
      });

      expect(toast).toHaveButtonWith('×');
    });

    it('allows custom button text on the close button', function() {
      var toast = openToast('info', 'I have a button', {
        closeButton: true,
        closeHtml: '<button>1</button>'
      });

      expect(toast).toHaveButtonWith('1');
    });

    it('allows custom element as the close button', function() {
      var toast = openToast('info', 'I have a button', {
        closeButton: true,
        closeHtml: '<span>1</span>'
      });

      expect(toast).toHaveButtonWith('1');
    });
  });

  describe('toast order', function() {
    it('adds the newest toasts on top by default', function() {
      var toast1 = openToast('success', 'I will be on the bottom');
      var toast2 = openToast('info', 'I like the top part!');
      expect($document).toHaveToastWithMessage(toast2.scope.message, 0);
      expect($document).toHaveToastWithMessage(toast1.scope.message, 1);
    });

    it('adds the older toasts on top setting newestOnTop to false', function() {
      toastrConfig.newestOnTop = false;

      var toast1 = openToast('success', 'I will be on the top now');
      var toast2 = openToast('info', 'I dont like the bottom part!');
      expect($document).toHaveToastWithMessage(toast2.scope.message, 1);
      expect($document).toHaveToastWithMessage(toast1.scope.message, 0);
    });
  });

  describe('callbacks', function() {
    it('calls the onShown callback when showing a toast', function() {
      var callback = jasmine.createSpy();
      var toast = openToast('success', 'A toast', { onShown: callback });
      expect(callback).toHaveBeenCalledWith(toast);
    });

    it('calls the onHidden callback after a toast is closed on click', function() {
      var callback = jasmine.createSpy();
      var toast = openToast('success', 'A toast', { onHidden: callback });
      expect(callback).not.toHaveBeenCalled();
      clickToast();
      expect(callback).toHaveBeenCalledWith(true, toast);
    });

    it('calls the onHidden callback after a toast is closed by timeout', function() {
      var callback = jasmine.createSpy();
      var toast = openToast('success', 'A toast', { onHidden: callback });
      expect(callback).not.toHaveBeenCalled();
      intervalFlush();
      animationFlush();
      expect(callback).toHaveBeenCalledWith(false, toast);
    });

    it('calls the onHidden callback with "true" if the button was clicked', function() {
      var callback = jasmine.createSpy();
      var toast = openToast('info', 'I have a button', {
        onHidden: callback,
        closeButton: true
      });
      clickToastCloseButton();
      expect(callback).toHaveBeenCalledWith(true, toast);
    });

    it('can call the callbacks even if the title is set to null', function() {
      var callback = jasmine.createSpy();
      var toast = openToast('success', 'some message', null, {onShown: callback});
      expect(callback).toHaveBeenCalledWith(toast);
    });

    it('calls the onTap callback when toast is clicked', function() {
      var callback = jasmine.createSpy();
      var toast = openToast('success', 'A toast', { onTap: callback });
      expect(callback).not.toHaveBeenCalled();
      clickToast();
      expect(callback).toHaveBeenCalledWith(toast);
    });
  });

  describe('toast controller', function() {
    var ctrl;

    beforeEach(inject(function($controller) {
      ctrl = $controller('ToastController');
    }));

    it('does not register a progressbar by default', function() {
      expect(ctrl.progressBar).toBeNull();
    });

    it('can start the progressbar', function() {
      var scope = {
        start: jasmine.createSpy()
      };
      ctrl.progressBar = scope;
      ctrl.startProgressBar(5000);

      expect(scope.start).toHaveBeenCalledWith(5000);
    });

    it('can stop the progressbar', function() {
      var scope = {
        stop: jasmine.createSpy()
      };
      ctrl.progressBar = scope;
      ctrl.stopProgressBar();

      expect(scope.stop).toHaveBeenCalled();
    });
  });

  describe('progressbar', function() {
    beforeEach(function() {
      toastrConfig.progressBar = true;
    });

    it('contains a progressBar if the option is set to true', function() {
      var toast = openToast('success', 'foo');
      expect(toast).toHaveProgressBar();
      intervalFlush();
    });

    it('removes the progressBar if the toast is hovered', function() {
      var toast = openToast('success', 'foo');
      expect(toast).toHaveProgressBar();
      hoverToast();
      intervalFlush();
      $rootScope.$digest();
      expect(toast).not.toHaveProgressBar();
      leaveToast();
      expect(toast).toHaveProgressBar();
      intervalFlush();
    });
  });
});
