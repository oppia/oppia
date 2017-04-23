/*!
 * Angular Material Design
 * https://github.com/angular/material
 * @license MIT
 * v0.6.0-rc1
 */
(function() {
'use strict';

/**
 * Initialization function that validates environment
 * requirements.
 */
angular.module('material.core', [])
  .run(MdCoreInitialize)
  .config(MdCoreConfigure);

function MdCoreInitialize() {
  if (typeof Hammer === 'undefined') {
    throw new Error(
      'ngMaterial requires HammerJS to be preloaded.'
    );
  }
}

function MdCoreConfigure($provide) {
  $provide.decorator('$$rAF', ['$delegate', '$rootScope', rAFDecorator]);

  function rAFDecorator($$rAF, $rootScope) {
    /**
     * Use this to debounce events that come in often.
     * The debounced function will always use the *last* invocation before the
     * coming frame.
     *
     * For example, window resize events that fire many times a second:
     * If we set to use an raf-debounced callback on window resize, then
     * our callback will only be fired once per frame, with the last resize
     * event that happened before that frame.
     *
     * @param {function} callback function to debounce
     */
    $$rAF.debounce = function(cb) {
      var queueArgs, alreadyQueued, queueCb, context;
      return function debounced() {
        queueArgs = arguments;
        context = this;
        queueCb = cb;
        if (!alreadyQueued) {
          alreadyQueued = true;
          $$rAF(function() {
            queueCb.apply(context, queueArgs);
            alreadyQueued = false;
          });
        }
      };
    };
    return $$rAF;

  }

}
MdCoreConfigure.$inject = ["$provide"];

})();

(function() {
'use strict';

angular.module('material.core')
.factory('$mdConstant', MdConstantFactory);

function MdConstantFactory($$rAF, $sniffer) {

  var webkit = /webkit/i.test($sniffer.vendorPrefix);
  function vendorProperty(name) {
    return webkit ?  ('webkit' + name.charAt(0).toUpperCase() + name.substring(1)) : name;
  }

  return {
    KEY_CODE: {
      ENTER: 13,
      ESCAPE: 27,
      SPACE: 32,
      LEFT_ARROW : 37,
      UP_ARROW : 38,
      RIGHT_ARROW : 39,
      DOWN_ARROW : 40
    },
    CSS: {
      /* Constants */
      TRANSITIONEND: 'transitionend' + (webkit ? ' webkitTransitionEnd' : ''),
      ANIMATIONEND: 'animationend' + (webkit ? ' webkitAnimationEnd' : ''),

      TRANSFORM: vendorProperty('transform'),
      TRANSITION: vendorProperty('transition'),
      TRANSITION_DURATION: vendorProperty('transitionDuration'),
      ANIMATION_PLAY_STATE: vendorProperty('animationPlayState'),
      ANIMATION_DURATION: vendorProperty('animationDuration'),
      ANIMATION_NAME: vendorProperty('animationName'),
      ANIMATION_TIMING: vendorProperty('animationTimingFunction'),
      ANIMATION_DIRECTION: vendorProperty('animationDirection')
    }
  };
}
MdConstantFactory.$inject = ["$$rAF", "$sniffer"];

})();

(function() {
'use strict';

/* 
 * This var has to be outside the angular factory, otherwise when
 * there are multiple material apps on the same page, each app
 * will create its own instance of this array and the app's IDs 
 * will not be unique.
 */
var nextUniqueId = ['0','0','0'];

angular.module('material.core')
.factory('$mdUtil', ['$cacheFactory', function($cacheFactory) {
  var Util;
  return Util = {
    now: window.performance ? angular.bind(window.performance, window.performance.now) : Date.now,

    /**
     * Publish the iterator facade to easily support iteration and accessors
     * @see iterator below
     */
    iterator: iterator,

    /**
     * @see cacheFactory below
     */
    cacheFactory: cacheFactory,

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    debounce: function debounce(func, wait, immediate) {
      var timeout;
      return function debounced() {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
      };
    },

    // Returns a function that can only be triggered every `delay` milliseconds.
    // In other words, the function will not be called unless it has been more
    // than `delay` milliseconds since the last call.
    throttle: function throttle(func, delay) {
      var recent;
      return function throttled() {
        var context = this;
        var args = arguments;
        var now = Util.now();

        if (!recent || recent - now > delay) {
          func.apply(context, args);
          recent = now;
        }
      };
    },

    /**
     * nextUid, from angular.js.
     * A consistent way of creating unique IDs in angular. The ID is a sequence of alpha numeric
     * characters such as '012ABC'. The reason why we are not using simply a number counter is that
     * the number string gets longer over time, and it can also overflow, where as the nextId
     * will grow much slower, it is a string, and it will never overflow.
     *
     * @returns an unique alpha-numeric string
     */
    nextUid: function() {
      var index = nextUniqueId.length;
      var digit;

      while(index) {
        index--;
        digit = nextUniqueId[index].charCodeAt(0);
        if (digit == 57 /*'9'*/) {
          nextUniqueId[index] = 'A';
          return nextUniqueId.join('');
        }
        if (digit == 90  /*'Z'*/) {
          nextUniqueId[index] = '0';
        } else {
          nextUniqueId[index] = String.fromCharCode(digit + 1);
          return nextUniqueId.join('');
        }
      }
      nextUniqueId.unshift('0');
      return nextUniqueId.join('');
    },

    // Stop watchers and events from firing on a scope without destroying it,
    // by disconnecting it from its parent and its siblings' linked lists.
    disconnectScope: function disconnectScope(scope) {
      if (!scope) return;

      // we can't destroy the root scope or a scope that has been already destroyed
      if (scope.$root === scope) return;
      if (scope.$$destroyed ) return;

      var parent = scope.$parent;
      scope.$$disconnected = true;

      // See Scope.$destroy
      if (parent.$$childHead === scope) parent.$$childHead = scope.$$nextSibling;
      if (parent.$$childTail === scope) parent.$$childTail = scope.$$prevSibling;
      if (scope.$$prevSibling) scope.$$prevSibling.$$nextSibling = scope.$$nextSibling;
      if (scope.$$nextSibling) scope.$$nextSibling.$$prevSibling = scope.$$prevSibling;

      scope.$$nextSibling = scope.$$prevSibling = null;

    },

    // Undo the effects of disconnectScope above.
    reconnectScope: function reconnectScope(scope) {
      if (!scope) return;

      // we can't disconnect the root node or scope already disconnected
      if (scope.$root === scope) return;
      if (!scope.$$disconnected) return;

      var child = scope;

      var parent = child.$parent;
      child.$$disconnected = false;
      // See Scope.$new for this logic...
      child.$$prevSibling = parent.$$childTail;
      if (parent.$$childHead) {
        parent.$$childTail.$$nextSibling = child;
        parent.$$childTail = child;
      } else {
        parent.$$childHead = parent.$$childTail = child;
      }
    }
  };

  /*
   * iterator is a list facade to easily support iteration and accessors
   *
   * @param items Array list which this iterator will enumerate
   * @param reloop Boolean enables iterator to consider the list as an endless reloop
   */
  function iterator(items, reloop) {
    var trueFn = function() { return true; };

    reloop = !!reloop;
    var _items = items || [ ];

    // Published API
    return {
      items: getItems,
      count: count,

      inRange: inRange,
      contains: contains,
      indexOf: indexOf,
      itemAt: itemAt,

      findBy: findBy,

      add: add,
      remove: remove,

      first: first,
      last: last,
      next: next,
      previous: previous,

      hasPrevious: hasPrevious,
      hasNext: hasNext

    };

    /*
     * Publish copy of the enumerable set
     * @returns {Array|*}
     */
    function getItems() {
      return [].concat(_items);
    }

    /*
     * Determine length of the list
     * @returns {Array.length|*|number}
     */
    function count() {
      return _items.length;
    }

    /*
     * Is the index specified valid
     * @param index
     * @returns {Array.length|*|number|boolean}
     */
    function inRange(index) {
      return _items.length && ( index > -1 ) && (index < _items.length );
    }

    /*
     * Can the iterator proceed to the next item in the list; relative to
     * the specified item.
     *
     * @param item
     * @returns {Array.length|*|number|boolean}
     */
    function hasNext(item) {
      return item ? inRange(indexOf(item) + 1) : false;
    }

    /*
     * Can the iterator proceed to the previous item in the list; relative to
     * the specified item.
     *
     * @param item
     * @returns {Array.length|*|number|boolean}
     */
    function hasPrevious(item) {
      return item ? inRange(indexOf(item) - 1) : false;
    }

    /*
     * Get item at specified index/position
     * @param index
     * @returns {*}
     */
    function itemAt(index) {
      return inRange(index) ? _items[index] : null;
    }

    /*
     * Find all elements matching the key/value pair
     * otherwise return null
     *
     * @param val
     * @param key
     *
     * @return array
     */
    function findBy(key, val) {
      return _items.filter(function(item) {
        return item[key] === val;
      });
    }

    /*
     * Add item to list
     * @param item
     * @param index
     * @returns {*}
     */
    function add(item, index) {
      if ( !item ) return -1;

      if (!angular.isNumber(index)) {
        index = _items.length;
      }

      _items.splice(index, 0, item);

      return indexOf(item);
    }

    /*
     * Remove item from list...
     * @param item
     */
    function remove(item) {
      if ( contains(item) ){
        _items.splice(indexOf(item), 1);
      }
    }

    /*
     * Get the zero-based index of the target item
     * @param item
     * @returns {*}
     */
    function indexOf(item) {
      return _items.indexOf(item);
    }

    /*
     * Boolean existence check
     * @param item
     * @returns {boolean}
     */
    function contains(item) {
      return item && (indexOf(item) > -1);
    }

    /*
     * Find the next item. If reloop is true and at the end of the list, it will 
     * go back to the first item. If given ,the `validate` callback will be used
     * determine whether the next item is valid. If not valid, it will try to find the
     * next item again.
     * @param item
     * @param {optional} validate
     * @returns {*}
     */
    function next(item, validate) {
      validate = validate || trueFn;

      if (contains(item)) {
        var index = indexOf(item) + 1,
        found = inRange(index) ? _items[ index ] : (reloop ? first() : null);

        return validate(found) ? found : next(found, validate);
      }

      return null;
    }

    /*
     * Find the previous item. If reloop is true and at the beginning of the list, it will 
     * go back to the last item. If given ,the `validate` callback will be used
     * determine whether the previous item is valid. If not valid, it will try to find the
     * previous item again.
     * @param item
     * @param {optional} validate
     * @returns {*}
     */
    function previous(item, validate) {
      validate = validate || trueFn;

      if (contains(item)) {
        var index = indexOf(item) - 1,
        found = inRange(index) ? _items[ index ] : (reloop ? last() : null);

        return validate(found) ? found : previous(found, validate);
      }

      return null;
    }

    /*
     * Return first item in the list
     * @returns {*}
     */
    function first() {
      return _items.length ? _items[0] : null;
    }

    /*
     * Return last item in the list...
     * @returns {*}
     */
    function last() {
      return _items.length ? _items[_items.length - 1] : null;
    }
  }

  /*
   * Angular's $cacheFactory doesn't have a keys() method,
   * so we add one ourself.
   */
  function cacheFactory(id, options) {
    var cache = $cacheFactory(id, options);

    var keys = {};
    cache._put = cache.put;
    cache.put = function(k,v) {
      keys[k] = true;
      return cache._put(k, v);
    };
    cache._remove = cache.remove;
    cache.remove = function(k) {
      delete keys[k];
      return cache._remove(k);
    };

    cache.keys = function() {
      return Object.keys(keys);
    };

    return cache;
  }
}]);

/* 
 * Since removing jQuery from the demos, some code that uses `element.focus()` is broken.
 *
 * We need to add `element.focus()`, because it's testable unlike `element[0].focus`.
 *
 * TODO(ajoslin): This should be added in a better place later.
 */

angular.element.prototype.focus = angular.element.prototype.focus || function() {
  if (this.length) {
    this[0].focus();
  }
  return this;
};
angular.element.prototype.blur = angular.element.prototype.blur || function() {
  if (this.length) {
    this[0].blur();
  }
  return this;
};

})();

(function() {
'use strict';

angular.module('material.core')
  .service('$mdAria', AriaService);

function AriaService($$rAF, $log) {

  return {
    expect: expect,
    expectAsync: expectAsync,
    expectWithText: expectWithText
  };

  /**
   * Check if expected attribute has been specified on the target element
   * @param element
   * @param attrName
   * @param {optional} defaultValue What to set the attr to if no value is found
   */
  function expect(element, attrName, defaultValue) {
    var node = element[0];
    if (!node.hasAttribute(attrName)) {

      defaultValue = angular.isString(defaultValue) && defaultValue.trim() || '';
      if (defaultValue.length) {
        element.attr(attrName, defaultValue);
      } else {
        $log.warn('ARIA: Attribute "', attrName, '", required for accessibility, is missing on node:', node);
      }

    }
  }

  function expectAsync(element, attrName, defaultValueGetter) {
    // Problem: when retrieving the element's contents synchronously to find the label,
    // the text may not be defined yet in the case of a binding.
    // There is a higher chance that a binding will be defined if we wait one frame.
    $$rAF(function() {
      expect(element, attrName, defaultValueGetter());
    });
  }

  function expectWithText(element, attrName) {
    expectAsync(element, attrName, function() {
      return element.text().trim();
    });
  }

}
AriaService.$inject = ["$$rAF", "$log"];
})();

(function() {
'use strict';

angular.module('material.core')
  .service('$mdCompiler', mdCompilerService);

function mdCompilerService($q, $http, $injector, $compile, $controller, $templateCache) {

  /*
   * @ngdoc service
   * @name $mdCompiler
   * @module material.core
   * @description
   * The $mdCompiler service is an abstraction of angular's compiler, that allows the developer
   * to easily compile an element with a templateUrl, controller, and locals.
   *
   * @usage
   * <hljs lang="js">
   * $mdCompiler.compile({
   *   templateUrl: 'modal.html',
   *   controller: 'ModalCtrl',
   *   locals: {
   *     modal: myModalInstance;
   *   }
   * }).then(function(compileData) {
   *   compileData.element; // modal.html's template in an element
   *   compileData.link(myScope); //attach controller & scope to element
   * });
   * </hljs>
   */

   /*
    * @ngdoc method
    * @name $mdCompiler#compile
    * @description A helper to compile an HTML template/templateUrl with a given controller,
    * locals, and scope.
    * @param {object} options An options object, with the following properties:
    *
    *    - `controller` - `{(string=|function()=}` Controller fn that should be associated with
    *      newly created scope or the name of a registered controller if passed as a string.
    *    - `controllerAs` - `{string=}` A controller alias name. If present the controller will be
    *      published to scope under the `controllerAs` name.
    *    - `template` - `{string=}` An html template as a string.
    *    - `templateUrl` - `{string=}` A path to an html template.
    *    - `transformTemplate` - `{function(template)=}` A function which transforms the template after
    *      it is loaded. It will be given the template string as a parameter, and should
    *      return a a new string representing the transformed template.
    *    - `resolve` - `{Object.<string, function>=}` - An optional map of dependencies which should
    *      be injected into the controller. If any of these dependencies are promises, the compiler
    *      will wait for them all to be resolved, or if one is rejected before the controller is
    *      instantiated `compile()` will fail..
    *      * `key` - `{string}`: a name of a dependency to be injected into the controller.
    *      * `factory` - `{string|function}`: If `string` then it is an alias for a service.
    *        Otherwise if function, then it is injected and the return value is treated as the
    *        dependency. If the result is a promise, it is resolved before its value is 
    *        injected into the controller.
    *
    * @returns {object=} promise A promise, which will be resolved with a `compileData` object.
    * `compileData` has the following properties: 
    *
    *   - `element` - `{element}`: an uncompiled element matching the provided template.
    *   - `link` - `{function(scope)}`: A link function, which, when called, will compile
    *     the element and instantiate the provided controller (if given).
    *   - `locals` - `{object}`: The locals which will be passed into the controller once `link` is
    *     called. If `bindToController` is true, they will be coppied to the ctrl instead
    *   - `bindToController` - `bool`: bind the locals to the controller, instead of passing them in
    */
  this.compile = function(options) {
    var templateUrl = options.templateUrl;
    var template = options.template || '';
    var controller = options.controller;
    var controllerAs = options.controllerAs;
    var resolve = options.resolve || {};
    var locals = options.locals || {};
    var transformTemplate = options.transformTemplate || angular.identity;
    var bindToController = options.bindToController;

    // Take resolve values and invoke them.  
    // Resolves can either be a string (value: 'MyRegisteredAngularConst'),
    // or an invokable 'factory' of sorts: (value: function ValueGetter($dependency) {})
    angular.forEach(resolve, function(value, key) {
      if (angular.isString(value)) {
        resolve[key] = $injector.get(value);
      } else {
        resolve[key] = $injector.invoke(value);
      }
    });
    //Add the locals, which are just straight values to inject
    //eg locals: { three: 3 }, will inject three into the controller
    angular.extend(resolve, locals);

    if (templateUrl) {
      resolve.$template = $http.get(templateUrl, {cache: $templateCache})
        .then(function(response) {
          return response.data;
        });
    } else {
      resolve.$template = $q.when(template);
    }

    // Wait for all the resolves to finish if they are promises
    return $q.all(resolve).then(function(locals) {

      var template = transformTemplate(locals.$template);
      var element = angular.element('<div>').html(template).contents();
      var linkFn = $compile(element);

      //Return a linking function that can be used later when the element is ready
      return {
        locals: locals,
        element: element,
        link: function link(scope) {
          locals.$scope = scope;

          //Instantiate controller if it exists, because we have scope
          if (controller) {
            var ctrl = $controller(controller, locals);
            if (bindToController) {
              angular.extend(ctrl, locals);
            }
            //See angular-route source for this logic
            element.data('$ngControllerController', ctrl);
            element.children().data('$ngControllerController', ctrl);

            if (controllerAs) {
              scope[controllerAs] = ctrl;
            }
          }

          return linkFn(scope);
        }
      };
    });

  };
}
mdCompilerService.$inject = ["$q", "$http", "$injector", "$compile", "$controller", "$templateCache"];
})();

(function() {
'use strict';

angular.module('material.core')
  .provider('$$interimElement', InterimElementProvider);

/*
 * @ngdoc service
 * @name $$interimElement
 * @module material.core
 *
 * @description
 *
 * Factory that contructs `$$interimElement.$service` services.
 * Used internally in material design for elements that appear on screen temporarily.
 * The service provides a promise-like API for interacting with the temporary
 * elements.
 *
 * ```js
 * app.service('$mdToast', function($$interimElement) {
 *   var $mdToast = $$interimElement(toastDefaultOptions);
 *   return $mdToast;
 * });
 * ```
 * @param {object=} defaultOptions Options used by default for the `show` method on the service.
 *
 * @returns {$$interimElement.$service}
 *
 */

function InterimElementProvider() {
  createInterimElementProvider.$get = InterimElementFactory;
  InterimElementFactory.$inject = ["$document", "$q", "$rootScope", "$timeout", "$rootElement", "$animate", "$mdCompiler", "$mdTheming"];
  return createInterimElementProvider;

  /**
   * Returns a new provider which allows configuration of a new interimElement
   * service. Allows configuration of default options & methods for options,
   * as well as configuration of 'preset' methods (eg dialog.basic(): basic is a preset method)
   */
  function createInterimElementProvider(interimFactoryName) {
    var providerConfig = {
      presets: {}
    };
    var provider = {
      setDefaults: setDefaults,
      addPreset: addPreset,
      $get: factory
    };

    /**
     * all interim elements will come with the 'build' preset
     */
    provider.addPreset('build', {
      methods: ['controller', 'controllerAs', 'onRemove', 'onShow', 'resolve',
        'template', 'templateUrl', 'themable', 'transformTemplate', 'parent']
    });

    factory.$inject = ["$$interimElement", "$animate", "$injector"];
    return provider;

    /**
     * Save the configured defaults to be used when the factory is instantiated
     */
    function setDefaults(definition) {
      providerConfig.optionsFactory = definition.options;
      providerConfig.methods = definition.methods;
      return provider;
    }
    /**
     * Save the configured preset to be used when the factory is instantiated
     */
    function addPreset(name, definition) {
      definition = definition || {};
      definition.methods = definition.methods || [];
      definition.options = definition.options || function() { return {}; };

      if (/^cancel|hide|show$/.test(name)) {
        throw new Error("Preset '" + name + "' in " + interimFactoryName + " is reserved!");
      }
      if (definition.methods.indexOf('_options') > -1) {
        throw new Error("Method '_options' in " + interimFactoryName + " is reserved!");
      }
      providerConfig.presets[name] = {
        methods: definition.methods,
        optionsFactory: definition.options
      };
      return provider;
    }

    /**
     * Create a factory that has the given methods & defaults implementing interimElement
     */
    /* @ngInject */
    function factory($$interimElement, $animate, $injector) {
      var defaultMethods;
      var defaultOptions;
      var interimElementService = $$interimElement();

      /*
       * publicService is what the developer will be using.
       * It has methods hide(), cancel(), show(), build(), and any other
       * presets which were set during the config phase.
       */
      var publicService = {
        hide: interimElementService.hide,
        cancel: interimElementService.cancel,
        show: showInterimElement
      };

      defaultMethods = providerConfig.methods || [];
      // This must be invoked after the publicService is initialized
      defaultOptions = invokeFactory(providerConfig.optionsFactory, {});

      angular.forEach(providerConfig.presets, function(definition, name) {
        var presetDefaults = invokeFactory(definition.optionsFactory, {});
        var presetMethods = (definition.methods || []).concat(defaultMethods);

        // Every interimElement built with a preset has a field called `$type`,
        // which matches the name of the preset.
        // Eg in preset 'confirm', options.$type === 'confirm'
        angular.extend(presetDefaults, { $type: name });

        // This creates a preset class which has setter methods for every
        // method given in the `.addPreset()` function, as well as every
        // method given in the `.setDefaults()` function.
        //
        // @example
        // .setDefaults({
        //   methods: ['hasBackdrop', 'clickOutsideToClose', 'escapeToClose', 'targetEvent'],
        //   options: dialogDefaultOptions
        // })
        // .addPreset('alert', {
        //   methods: ['title', 'ok'],
        //   options: alertDialogOptions
        // })
        //
        // Set values will be passed to the options when interimElemnt.show() is called.
        function Preset(opts) {
          this._options = angular.extend({}, presetDefaults, opts);
        }
        angular.forEach(presetMethods, function(name) {
          Preset.prototype[name] = function(value) {
            this._options[name] = value;
            return this;
          };
        });

        // eg $mdDialog.alert() will return a new alert preset
        publicService[name] = function(options) {
          return new Preset(options);
        };
      });

      return publicService;

      function showInterimElement(opts) {
        // opts is either a preset which stores its options on an _options field,
        // or just an object made up of options
        return interimElementService.show(
          angular.extend({}, defaultOptions, (opts || {})._options || opts)
        );
      }

      /**
       * Helper to call $injector.invoke with a local of the factory name for
       * this provider.
       * If an $mdDialog is providing options for a dialog and tries to inject
       * $mdDialog, a circular dependency error will happen.
       * We get around that by manually injecting $mdDialog as a local.
       */
      function invokeFactory(factory, defaultVal) {
        var locals = {};
        locals[interimFactoryName] = publicService;
        return $injector.invoke(factory || function() { return defaultVal; }, {}, locals);
      }

    }

  }

  /* @ngInject */
  function InterimElementFactory($document, $q, $rootScope, $timeout, $rootElement, $animate, $mdCompiler, $mdTheming) {

    return function createInterimElementService() {
      /*
       * @ngdoc service
       * @name $$interimElement.$service
       *
       * @description
       * A service used to control inserting and removing an element into the DOM.
       *
       */
      var stack = [];
      var service;
      return service = {
        show: show,
        hide: hide,
        cancel: cancel,
      };

      function show(options) {
        if (stack.length) {
          service.cancel();
        }

        var interimElement = new InterimElement(options);

        stack.push(interimElement);
        return interimElement.show().then(function() {
          return interimElement.deferred.promise;
        });
      }

      /*
       * @ngdoc method
       * @name $$interimElement.$service#hide
       * @kind function
       *
       * @description
       * Removes the `$interimElement` from the DOM and resolves the promise returned from `show`
       *
       * @param {*} resolveParam Data to resolve the promise with
       *
       * @returns undefined data that resolves after the element has been removed.
       *
       */
      function hide(response) {
        var interimElement = stack.shift();
        interimElement && interimElement.remove().then(function() {
          interimElement.deferred.resolve(response);
        });
      }

      /*
       * @ngdoc method
       * @name $$interimElement.$service#cancel
       * @kind function
       *
       * @description
       * Removes the `$interimElement` from the DOM and rejects the promise returned from `show`
       *
       * @param {*} reason Data to reject the promise with
       *
       * @returns undefined
       *
       */
      function cancel(reason) {
        var interimElement = stack.shift();
        interimElement && interimElement.remove().then(function() {
          interimElement.deferred.reject(reason);
        });
      }


      /*
       * Internal Interim Element Object
       * Used internally to manage the DOM element and related data
       */
      function InterimElement(options) {
        var self;
        var hideTimeout, element;

        options = options || {};
        options = angular.extend({
          scope: options.scope || $rootScope.$new(options.isolateScope),
          onShow: function(scope, element, options) {
            return $animate.enter(element, options.parent);
          },
          onRemove: function(scope, element, options) {
            // Element could be undefined if a new element is shown before
            // the old one finishes compiling.
            return element && $animate.leave(element) || $q.when();
          }
        }, options);

        return self = {
          options: options,
          deferred: $q.defer(),
          show: function() {
            return $mdCompiler.compile(options).then(function(compileData) {
              angular.extend(compileData.locals, self.options);

              // Search for parent at insertion time, if not specified
              if (angular.isString(options.parent)) {
                options.parent = angular.element($document[0].querySelector(options.parent));
              } else if (!options.parent) {
                options.parent = $rootElement.find('body');
                if (!options.parent.length) options.parent = $rootElement;
              }

              element = compileData.link(options.scope);
              if (options.themable) $mdTheming(element);
              var ret = options.onShow(options.scope, element, options);
              return $q.when(ret)
                .then(function(){
                  // Issue onComplete callback when the `show()` finishes
                  (options.onComplete || angular.noop)(options.scope, element, options);
                  startHideTimeout();
                });

              function startHideTimeout() {
                if (options.hideDelay) {
                  hideTimeout = $timeout(service.cancel, options.hideDelay) ;
                }
              }
            });
          },
          cancelTimeout: function() {
            if (hideTimeout) {
              $timeout.cancel(hideTimeout);
              hideTimeout = undefined;
            }
          },
          remove: function() {
            self.cancelTimeout();
            var ret = options.onRemove(options.scope, element, options);
            return $q.when(ret).then(function() {
              options.scope.$destroy();
            });
          }
        };
      }
    };
  }

}

})();

(function() {
'use strict';

angular.module('material.core')
  .factory('$mdInkRipple', InkRippleService)
  .directive('mdInkRipple', InkRippleDirective)
  .directive('mdNoInk', attrNoDirective())
  .directive('mdNoBar', attrNoDirective())
  .directive('mdNoStretch', attrNoDirective());

function InkRippleDirective($mdInkRipple) {
  return function(scope, element, attr) {
    if (attr.mdInkRipple == 'checkbox') {
      $mdInkRipple.attachCheckboxBehavior(element);
    } else {
      $mdInkRipple.attachButtonBehavior(element);
    }
  };
}
InkRippleDirective.$inject = ["$mdInkRipple"];

function InkRippleService($window, $timeout) {

  return {
    attachButtonBehavior: attachButtonBehavior,
    attachCheckboxBehavior: attachCheckboxBehavior,
    attach: attach
  };

  function attachButtonBehavior(element) {
    return attach(element, {
      center: element.hasClass('md-fab'),
      dimBackground: true
    });
  }

  function attachCheckboxBehavior(element) {
    return attach(element, {
      center: true,
      dimBackground: false
    });
  }

  function attach(element, options) {

    if (element.controller('mdNoInk')) return angular.noop;

    var rippleContainer, rippleEl,
        node = element[0],
        hammertime = new Hammer(node),
        contentParent = element.controller('mdContent');

    options = angular.extend({
      mousedown: true,
      hover: true,
      focus: true,
      center: false,
      mousedownPauseTime: 150,
      dimBackground: false
    }, options || {});

    options.mousedown && hammertime.on('hammer.input', onInput);

    // Publish self-detach method if desired...
    return function detach() {
      hammertime.destroy();
      rippleContainer && rippleContainer.remove();
    };

    function rippleIsAllowed() {
      var parent;
      return !element[0].hasAttribute('disabled') &&
          !((parent = element[0].parentNode) && parent.hasAttribute('disabled'));
    }

    function removeElement(element, wait) {
      $timeout(function () {
        element.remove();
      }, wait, false);
    }

    function createRipple(left, top, positionsAreAbsolute) {

      var rippleEl = angular.element('<div class="md-ripple">');

      if (!rippleContainer) {
        rippleContainer = angular.element('<div class="md-ripple-container">');
        element.append(rippleContainer);
      }
      rippleContainer.append(rippleEl);

      var containerWidth = rippleContainer.prop('offsetWidth'),
          containerHeight = rippleContainer.prop('offsetHeight'),
          multiplier = element.hasClass('md-fab') ? 1.1 : 0.8,
          diagonalWidth = Math.max(containerWidth, containerHeight) * multiplier;

      if (contentParent) {
        top += contentParent.$element.prop('scrollTop');
      }

      var css = {
        backgroundColor: $window.getComputedStyle(rippleEl[0]).color ||  $window.getComputedStyle(node).color,
        width: diagonalWidth + 'px',
        height: diagonalWidth + 'px',
        marginLeft: (diagonalWidth * -0.5) + 'px',
        marginTop: (diagonalWidth * -0.5) + 'px'
      };

      if (options.center) {
        css.left = '50%';
        css.top = '50%';
      } else if (positionsAreAbsolute) {
        var elementRect = node.getBoundingClientRect();
        left -= elementRect.left;
        top -= elementRect.top;
        css.left = Math.round(left / containerWidth * 100) + '%';
        css.top = Math.round(top / containerHeight * 100) + '%';
      }

      rippleEl.css(css);

      //-- Use minimum timeout to trigger CSS animation
      $timeout(function () {
        if (options.dimBackground) {
          rippleContainer.addClass('md-ripple-full md-ripple-visible');
          rippleContainer.css({ backgroundColor: css.backgroundColor.replace(')', ', 0.1').replace('(', 'a(') });
        }
        rippleEl.addClass('md-ripple-placed md-ripple-visible md-ripple-scaled md-ripple-full');
        rippleEl.css({ left: '50%', top: '50%' });
        $timeout(function () {
          if (rippleEl) {
            rippleEl.removeClass('md-ripple-full');
            if (!rippleEl.hasClass('md-ripple-visible')) {
              removeElement(rippleEl, 650);
              rippleEl = null;
            }
          }
          rippleEl && rippleEl.removeClass('md-ripple-full');
          if (rippleContainer && options.dimBackground) {
            rippleContainer.removeClass('md-ripple-full');
            if (!rippleContainer.hasClass('md-ripple-visible')) rippleContainer.css({ backgroundColor: '' });
          }
        }, 225, false);
      }, 0, false);
      return rippleEl;
    }

    function onInput(ev) {
      if (ev.eventType === Hammer.INPUT_START && ev.isFirst && rippleIsAllowed()) {
        rippleEl = createRipple(ev.center.x, ev.center.y, true);
      } else if (ev.eventType === Hammer.INPUT_END && ev.isFinal) {
        if (rippleEl) {
          rippleEl.removeClass('md-ripple-visible');
          removeElement(rippleEl, 650);
          rippleEl = null;
        }
        if (rippleContainer && options.dimBackground) {
          rippleContainer.removeClass('md-ripple-visible');
          if (!rippleContainer.hasClass('md-ripple-full')) rippleContainer.css({ backgroundColor: '' });
        }
      }
    }
  }
}
InkRippleService.$inject = ["$window", "$timeout"];

/**
 * noink/nobar/nostretch directive: make any element that has one of
 * these attributes be given a controller, so that other directives can 
 * `require:` these and see if there is a `no<xxx>` parent attribute.
 *
 * @usage
 * <hljs lang="html">
 * <parent md-no-ink>
 *   <child detect-no>
 *   </child>
 * </parent>
 * </hljs>
 *
 * <hljs lang="js">
 * myApp.directive('detectNo', function() {
 *   return {
 *     require: ['^?mdNoInk', ^?mdNoBar'],
 *     link: function(scope, element, attr, ctrls) {
 *       var noinkCtrl = ctrls[0];
 *       var nobarCtrl = ctrls[1];
 *       if (noInkCtrl) {
 *         alert("the md-no-ink flag has been specified on an ancestor!");
 *       }
 *       if (nobarCtrl) {
 *         alert("the md-no-bar flag has been specified on an ancestor!");
 *       }
 *     }
 *   };
 * });
 * </hljs>
 */
function attrNoDirective() {
  return function() {
    return {
      controller: angular.noop
    };
  };
}
})();

(function() {
'use strict';


angular.module('material.core')
  .directive('mdTheme', ThemingDirective)
  .directive('mdThemable', ThemableDirective)
  .provider('$mdTheming', ThemingProvider);

/**
 * @ngdoc provider
 * @name $mdThemingProvider
 * @module material.core
 *
 * @description Provider to configure the `$mdTheming` service.
 */

/**
 * @ngdoc method
 * @name $mdThemingProvider#setDefaultTheme
 * @param {string} themeName Default theme name to be applied to elements. Default value is `default`.
 */

/**
 * @ngdoc method
 * @name $mdThemingProvider#alwaysWatchTheme
 * @param {boolean} watch Whether or not to always watch themes for changes and re-apply
 * classes when they change. Default is `false`. Enabling can reduce performance.
 */

function ThemingProvider() {
  var defaultTheme = 'default';
  var alwaysWatchTheme = false;
  return {
    setDefaultTheme: function(theme) {
      defaultTheme = theme;
    },
    alwaysWatchTheme: function(alwaysWatch) {
      alwaysWatchTheme = alwaysWatch;
    },
    $get: ['$rootScope', ThemingService]
  };

  /**
   * @ngdoc service
   * @name $mdTheming
   *
   * @description
   *
   * Service that makes an element apply theming related classes to itself.
   *
   * ```js
   * app.directive('myFancyDirective', function($mdTheming) {
   *   return {
   *     restrict: 'e',
   *     link: function(scope, el, attrs) {
   *       $mdTheming(el);
   *     }
   *   };
   * });
   * ```
   * @param {el=} element to apply theming to
   */
  function ThemingService($rootScope) {
    applyTheme.inherit = function(el, parent) {
      var ctrl = parent.controller('mdTheme');

      var attrThemeValue = el.attr('md-theme-watch');
      if ( (alwaysWatchTheme || angular.isDefined(attrThemeValue)) && attrThemeValue != 'false') {
        var deregisterWatch = $rootScope.$watch(function() {
          return ctrl && ctrl.$mdTheme || defaultTheme;
        }, changeTheme);
        el.on('$destroy', deregisterWatch);
      } else {
        var theme = ctrl && ctrl.$mdTheme || defaultTheme;
        changeTheme(theme);
      }

      function changeTheme(theme) {
        var oldTheme = el.data('$mdThemeName');
        if (oldTheme) el.removeClass('md-' + oldTheme +'-theme');
        el.addClass('md-' + theme + '-theme');
        el.data('$mdThemeName', theme);
      }
    };

    return applyTheme;

    function applyTheme(scope, el) {
      // Allow us to be invoked via a linking function signature.
      if (el === undefined) {
        el = scope;
        scope = undefined;
      }
      if (scope === undefined) {
        scope = $rootScope;
      }
      applyTheme.inherit(el, el);
    }
  }
}



function ThemingDirective($interpolate) {
  return {
    priority: 100,
    link: {
      pre: function(scope, el, attrs) {
        var ctrl = {
          $setTheme: function(theme) {
            ctrl.$mdTheme = theme;
          }
        };
        el.data('$mdThemeController', ctrl);
        ctrl.$setTheme($interpolate(attrs.mdTheme)(scope));
        attrs.$observe('mdTheme', ctrl.$setTheme);
      }
    }
  };
}
ThemingDirective.$inject = ["$interpolate"];

function ThemableDirective($mdTheming) {
  return $mdTheming;
}
ThemableDirective.$inject = ["$mdTheming"];
})();
