'use strict';

describe('uiSortable', function() {

  // Ensure the sortable angular module is loaded
  beforeEach(module('ui.sortable'));
  beforeEach(module('ui.sortable.testHelper'));

  var listContent;

  beforeEach(inject(function (sortableTestHelper) {
    listContent = sortableTestHelper.listContent;
  }));

  describe('Simple use', function() {

    it('should have a ui-sortable class', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable></ul>')($rootScope);
        expect(element.hasClass('ui-sortable')).toBeTruthy();
      });
    });

    it('should log that ngModel was not provided', function() {
      inject(function($compile, $rootScope, $log) {
        var element;
        element = $compile('<ul ui-sortable><li ng-repeat="item in items" id="s-{{$index}}">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        expect($log.info.logs.length).toEqual(1);
        expect($log.info.logs[0].length).toEqual(2);
        expect($log.info.logs[0][0]).toEqual('ui.sortable: ngModel not provided!');
      });
    });

    it('should log an error about jQuery dependency', function() {
      inject(function($compile, $rootScope, $log) {
        var oldAngularElementFn = angular.element.fn;
        var mockJQliteFn = $({}, angular.element.fn, true);
        mockJQliteFn.jquery = null;
        angular.element.fn = mockJQliteFn;

        this.after(function () {
          angular.element.fn = oldAngularElementFn;
        });

        var element;
        element = $compile('<ul ui-sortable><li ng-repeat="item in items" id="s-{{$index}}">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        expect($log.error.logs.length).toEqual(1);
        expect($log.error.logs[0].length).toEqual(1);
        expect($log.error.logs[0][0]).toEqual('ui.sortable: jQuery should be included before AngularJS!');
      });
    });

    it('should refresh sortable properly after an apply', function() {
      inject(function($compile, $rootScope, $timeout) {
        var element;
        var childScope = $rootScope.$new();
        element = $compile('<ul ui-sortable ng-model="items"><li ng-repeat="item in items">{{ item }}</li></ul>')(childScope);
        $rootScope.$apply(function() {
          childScope.items = ['One', 'Two', 'Three'];
        });

        expect(function() {
          $timeout.flush();
        }).not.toThrow();

        expect(childScope.items).toEqual(['One', 'Two', 'Three']);
        expect(childScope.items).toEqual(listContent(element));
      });
    });

    it('should not refresh sortable if destroyed', function() {
      inject(function($compile, $rootScope, $timeout) {
        var element;
        var childScope = $rootScope.$new();
        element = $compile('<div><ul ui-sortable ng-model="items"><li ng-repeat="item in items">{{ item }}</li></ul></div>')(childScope);
        $rootScope.$apply(function() {
          childScope.items = ['One', 'Two', 'Three'];
        });

        element.remove(element.firstChild);
        expect(function() {
          $timeout.flush();
        }).not.toThrow();

      });
    });

    it('should not try to apply options to a destroyed sortable', function() {
      inject(function($compile, $rootScope, $timeout) {
        var element;
        var childScope = $rootScope.$new();
        element = $compile('<div><ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items">{{ item }}</li></ul></div>')(childScope);
        $rootScope.$apply(function() {
          childScope.items = ['One', 'Two', 'Three'];
          childScope.opts = {
            update: function() {}
          };

          element.remove(element.firstChild);
        });

        expect(function() {
          $timeout.flush();
        }).not.toThrow();

      });
    });

  });

});
