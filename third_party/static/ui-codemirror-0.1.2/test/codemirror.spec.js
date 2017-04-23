describe('uiCodemirror', function () {
  'use strict';

  // declare these up here to be global to all tests
  var scope, $compile, $timeout, uiConfig;

  beforeEach(module('ui.codemirror'));
  beforeEach(inject(function (uiCodemirrorConfig) {
    uiConfig = uiCodemirrorConfig;
  }));

  // inject in angular constructs. Injector knows about leading/trailing underscores and does the right thing
  // otherwise, you would need to inject these into each test
  beforeEach(inject(function (_$rootScope_, _$compile_, _$timeout_) {
    scope = _$rootScope_.$new();
    $compile = _$compile_;
    $timeout = _$timeout_;
  }));

  afterEach(function () {
    uiConfig = {};
  });


  it('should not throw an error when window.CodeMirror is defined', function () {
    function compile() {
      $compile('<div ui-codemirror></div>')(scope);
    }

    var _CodeMirror = window.CodeMirror;
    delete window.CodeMirror;
    expect(window.CodeMirror).toBeUndefined();
    expect(compile).toThrow(new Error('ui-codemirror need CodeMirror to work... (o rly?)'));
    window.CodeMirror = _CodeMirror;
  });

  it('should not throw an error when window.CodeMirror is defined', function () {
    function compile() {
      $compile('<div ui-codemirror></div>')(scope);
    }

    expect(window.CodeMirror).toBeDefined();
    expect(compile).not.toThrow();
  });


  it('should watch all uiCodemirror attribute', function () {
    spyOn(scope, '$watch');
    scope.cmOption = {};
    $compile('<div ui-codemirror="cmOption"  ng-model="foo" ui-refresh="sdf"></div>')(scope);
    expect(scope.$watch.callCount).toEqual(3); // The uiCodemirror+ the ngModel + the uiRefresh
    expect(scope.$watch).toHaveBeenCalledWith('cmOption', jasmine.any(Function), true); // uiCodemirror
    expect(scope.$watch).toHaveBeenCalledWith(jasmine.any(Function)); // ngModel
    expect(scope.$watch).toHaveBeenCalledWith('sdf', jasmine.any(Function)); // uiRefresh
  });

  describe('CodeMirror instance', function () {

    var codemirror = null, spies = angular.noop;

    beforeEach(function () {
      var _constructor = window.CodeMirror;
      spyOn(window, 'CodeMirror').andCallFake(function () {
        codemirror = _constructor.apply(this, arguments);
        spies(codemirror);
        return codemirror;
      });
    });


    it('should call the CodeMirror constructor with a function', function () {
      $compile('<div ui-codemirror></div>')(scope);

      expect(window.CodeMirror.callCount).toEqual(1);
      expect(window.CodeMirror).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Object));

      expect(codemirror).toBeDefined();
    });

    it('should work as an element', function () {
      $compile('<ui-codemirror></ui-codemirror>')(scope);

      expect(window.CodeMirror.callCount).toEqual(1);
      expect(window.CodeMirror).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Object));

      expect(codemirror).toBeDefined();
    });

    it('should replace the element with a div.CodeMirror', function () {
      // Explicit a parent node to support the directive.
      var element = $compile('<div><div ui-codemirror></div></div>')(scope).children();

      expect(element).toBeDefined();
      expect(element.prop('tagName')).toBe('DIV');
      expect(element.prop('classList').length).toEqual(2);
      expect(element.prop('classList')[0]).toEqual('CodeMirror');
      expect(element.prop('classList')[1]).toEqual('cm-s-default');
    });


    describe('setOptions', function () {

      spies = function (codemirror) {
        spyOn(codemirror, 'setOption').andCallThrough();
      };

      it('should not be called', function () {
        $compile('<div ui-codemirror></div>')(scope);
        expect(codemirror.setOption).not.toHaveBeenCalled();
      });

      it('should include the passed options', function () {
        $compile('<div ui-codemirror="{oof: \'baar\'}"></div>')(scope);

        expect(codemirror.setOption).toHaveBeenCalled();
        expect(codemirror.setOption.calls.length).toEqual(1);
        expect(codemirror.setOption).toHaveBeenCalledWith('oof', 'baar');

        $compile('<ui-codemirror ui-codemirror-opts="{oof: \'baar\'}"></ui-codemirror>')(scope);

        expect(codemirror.setOption).toHaveBeenCalled();
        expect(codemirror.setOption.calls.length).toEqual(1);
        expect(codemirror.setOption).toHaveBeenCalledWith('oof', 'baar');
      });

      it('should include the default options', function () {
        $compile('<div ui-codemirror>')(scope);
        uiConfig.codemirror = {bar: 'baz'};
        $compile('<div ui-codemirror></div>')(scope);

        expect(codemirror.setOption).toHaveBeenCalled();
        expect(codemirror.setOption.calls.length).toEqual(1);
        expect(codemirror.setOption).toHaveBeenCalledWith('bar', 'baz');
      });

      it('should extent the default options', function () {
        $compile('<div ui-codemirror>')(scope);
        uiConfig.codemirror = {bar: 'baz'};
        $compile('<div ui-codemirror="{oof: \'baar\'}"></div>')(scope);

        expect(codemirror.setOption).toHaveBeenCalled();
        expect(codemirror.setOption.calls.length).toEqual(2);
        expect(codemirror.setOption).toHaveBeenCalledWith('oof', 'baar');
        expect(codemirror.setOption).toHaveBeenCalledWith('bar', 'baz');
      });

      it('should impact codemirror', function () {
        $compile('<div ui-codemirror>')(scope);
        uiConfig.codemirror = {};
        $compile('<div ui-codemirror="{theme: \'baar\'}"></div>')(scope);
        expect(codemirror.setOption).toHaveBeenCalled();
        expect(codemirror.setOption.calls.length).toEqual(1);
        expect(codemirror.setOption).toHaveBeenCalledWith('theme', 'baar');


        expect(codemirror.getOption('theme')).toEqual('baar');
      });
    });

    it('should not trigger watch ui-refresh', function () {
      spyOn(scope, '$watch');
      $compile('<div ui-codemirror ui-refresh=""></div>')(scope);
      expect(scope.$watch.callCount).toEqual(0);
      expect(scope.$watch).not.toHaveBeenCalled();
    });

    it('should trigger the CodeMirror.refresh() method', function () {
      $compile('<div ui-codemirror ui-refresh="bar"></div>')(scope);


      spyOn(codemirror, 'refresh');
      scope.$apply('bar = null');

      scope.$apply('bar = false');
      expect(scope.bar).toBeFalsy();
      expect(codemirror.refresh).toHaveBeenCalled();
      scope.$apply('bar = true');
      expect(scope.bar).toBeTruthy();
      expect(codemirror.refresh).toHaveBeenCalled();
      scope.$apply('bar = 0');
      expect(scope.bar).toBeFalsy();
      expect(codemirror.refresh).toHaveBeenCalled();
      scope.$apply('bar = 1');
      expect(scope.bar).toBeTruthy();
      expect(codemirror.refresh).toHaveBeenCalled();

      expect(codemirror.refresh.callCount).toEqual(4);
    });


    it('when the IDE changes should update the model', function () {
      var element = $compile('<div ui-codemirror ng-model="foo"></div>')(scope);

      expect(element).toBeDefined();
      expect(element.attr('class')).toEqual('ng-scope ng-pristine ng-valid');

      var value = 'baz';
      codemirror.setValue(value);
      expect(scope.foo).toBe(value);

      expect(element.attr('class')).toEqual('ng-scope ng-valid ng-dirty');

    });

    it('when the model changes should update the IDE', function () {
      var element = $compile('<div ui-codemirror ng-model="foo"></div>')(scope);

      expect(element).toBeDefined();
      expect(element.attr('class')).toEqual('ng-scope ng-pristine ng-valid');

      scope.$apply('foo = "bar"');
      expect(codemirror.getValue()).toBe(scope.foo);

      expect(element.attr('class')).toEqual('ng-scope ng-pristine ng-valid');
    });


    it('when the IDE changes should use ngChange', function () {
      scope.change = angular.noop;
      spyOn(scope, 'change').andCallFake(function() { expect(scope.foo).toBe('baz'); });

      $compile('<div ui-codemirror ng-model="foo" ng-change="change()"></div>')(scope);

      // change shouldn't be called initialy
      expect(scope.change).not.toHaveBeenCalled();


      // change shouldn't be called when the value change is coming from the model.
      scope.$apply('foo = "bar"');
      expect(scope.change).not.toHaveBeenCalled();

      // change should be called when user changes the input.
      codemirror.setValue('baz');
      expect(scope.change.callCount).toBe(1);
      expect(scope.change).toHaveBeenCalledWith();
    });

    it('should runs the onLoad callback', function () {
      scope.codemirrorLoaded = angular.noop;
      spyOn(scope, 'codemirrorLoaded');

      $compile('<div ui-codemirror="{onLoad: codemirrorLoaded}"></div>')(scope);

      expect(scope.codemirrorLoaded).toHaveBeenCalled();
      expect(scope.codemirrorLoaded).toHaveBeenCalledWith(codemirror);
    });

    it('responds to the $broadcast event "CodeMirror"', function () {
      var broadcast = { callback: angular.noop };
      spyOn(broadcast, 'callback');

      $compile('<div ui-codemirror></div>')(scope);
      scope.$broadcast('CodeMirror', broadcast.callback);

      expect(broadcast.callback).toHaveBeenCalled();
      expect(broadcast.callback).toHaveBeenCalledWith(codemirror);
    });


    it('should watch the options', function () {
      spyOn(scope, '$watch').andCallThrough();

      scope.cmOption = { readOnly: true };
      $compile('<div ui-codemirror="cmOption"></div>')(scope);

      expect(scope.$watch.callCount).toEqual(1); // the uiCodemirror option
      expect(scope.$watch).toHaveBeenCalledWith('cmOption', jasmine.any(Function), true);
      expect(codemirror.getOption('readOnly')).toBeTruthy();

      scope.cmOption.readOnly = false;
      scope.$digest();
      expect(codemirror.getOption('readOnly')).toBeFalsy();
    });

    it('should watch the options (object property)', function () {
      spyOn(scope, '$watch').andCallThrough();

      scope.cm = {};
      scope.cm.option = { readOnly: true };
      $compile('<div ui-codemirror="cm.option"></div>')(scope);

      expect(scope.$watch.callCount).toEqual(1); // the uiCodemirror option
      expect(scope.$watch).toHaveBeenCalledWith('cm.option', jasmine.any(Function), true);
      expect(codemirror.getOption('readOnly')).toBeTruthy();

      scope.cm.option.readOnly = false;
      scope.$digest();
      expect(codemirror.getOption('readOnly')).toBeFalsy();
    });

  });

  it('when the model is an object or an array should throw an error', function () {
    function compileWithObject() {
      $compile('<div ui-codemirror ng-model="foo"></div>')(scope);
      scope.foo = {};
      scope.$apply();
    }

    function compileWithArray() {
      $compile('<div ui-codemirror ng-model="foo"></div>')(scope);
      scope.foo = [];
      scope.$apply();
    }

    expect(compileWithObject).toThrow();
    expect(compileWithArray).toThrow();
  });

});
