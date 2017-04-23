'use strict';

describe('uiSortable', function() {

  // Ensure the sortable angular module is loaded
  beforeEach(module('ui.sortable'));
  beforeEach(module('ui.sortable.testHelper'));

  var EXTRA_DY_PERCENTAGE, listContent;

  beforeEach(inject(function (sortableTestHelper) {
    EXTRA_DY_PERCENTAGE = sortableTestHelper.EXTRA_DY_PERCENTAGE;
    listContent = sortableTestHelper.listContent;
  }));

  describe('Callbacks related', function() {

    var host;

    beforeEach(inject(function() {
      host = $('<div id="test-host"></div>');
      $('body').append(host);
    }));

    afterEach(function() {
      host.remove();
      host = null;
    });

    it('should cancel sorting of node "Two"', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            update: function(e, ui) {
              if (ui.item.scope().item === 'Two') {
                ui.item.sortable.cancel();
              }
            }
          };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find(':eq(1)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Two', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(0)');
        dy = (2 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'Three', 'One']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(2)');
        dy = -(2 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Two', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        $(element).remove();
      });
    });

    it('should cancel sorting of nodes that contain "Two"', function() {
      inject(function($compile, $rootScope) {
        var elementTop, elementBottom;
        elementTop = $compile('<ul ui-sortable="opts" class="cross-sortable" ng-model="itemsTop"><li ng-repeat="item in itemsTop" id="s-top-{{$index}}">{{ item }}</li></ul>')($rootScope);
        elementBottom = $compile('<ul ui-sortable="opts" class="cross-sortable" ng-model="itemsBottom"><li ng-repeat="item in itemsBottom" id="s-bottom-{{$index}}">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.itemsTop = ['Top One', 'Top Two', 'Top Three'];
          $rootScope.itemsBottom = ['Bottom One', 'Bottom Two', 'Bottom Three'];
          $rootScope.opts = {
            connectWith: '.cross-sortable',
            update: function(e, ui) {
              if (ui.item.scope() &&
                (typeof ui.item.scope().item === 'string') &&
                ui.item.scope().item.indexOf('Two') >= 0) {
                ui.item.sortable.cancel();
              }
            }
          };
        });

        host.append(elementTop).append(elementBottom);

        var li1 = elementTop.find(':eq(1)');
        var li2 = elementBottom.find(':eq(0)');
        var dy = EXTRA_DY_PERCENTAGE * li1.outerHeight() + (li2.position().top - li1.position().top);
        li1.simulate('drag', { dy: dy });
        expect($rootScope.itemsTop).toEqual(['Top One', 'Top Two', 'Top Three']);
        expect($rootScope.itemsBottom).toEqual(['Bottom One', 'Bottom Two', 'Bottom Three']);
        expect($rootScope.itemsTop).toEqual(listContent(elementTop));
        expect($rootScope.itemsBottom).toEqual(listContent(elementBottom));

        li1 = elementBottom.find(':eq(1)');
        li2 = elementTop.find(':eq(1)');
        dy = -EXTRA_DY_PERCENTAGE * li1.outerHeight() - (li1.position().top - li2.position().top);
        li1.simulate('drag', { dy: dy });
        expect($rootScope.itemsTop).toEqual(['Top One', 'Top Two', 'Top Three']);
        expect($rootScope.itemsBottom).toEqual(['Bottom One', 'Bottom Two', 'Bottom Three']);
        expect($rootScope.itemsTop).toEqual(listContent(elementTop));
        expect($rootScope.itemsBottom).toEqual(listContent(elementBottom));

        li1 = elementTop.find(':eq(0)');
        li2 = elementBottom.find(':eq(0)');
        dy = EXTRA_DY_PERCENTAGE * li1.outerHeight() + (li2.position().top - li1.position().top);
        li1.simulate('drag', { dy: dy });
        expect($rootScope.itemsTop).toEqual(['Top Two', 'Top Three']);
        expect($rootScope.itemsBottom).toEqual(['Bottom One', 'Top One', 'Bottom Two', 'Bottom Three']);
        expect($rootScope.itemsTop).toEqual(listContent(elementTop));
        expect($rootScope.itemsBottom).toEqual(listContent(elementBottom));

        li1 = elementBottom.find(':eq(1)');
        li2 = elementTop.find(':eq(1)');
        dy = -EXTRA_DY_PERCENTAGE * li1.outerHeight() - (li1.position().top - li2.position().top);
        li1.simulate('drag', { dy: dy });
        expect($rootScope.itemsTop).toEqual(['Top Two', 'Top One', 'Top Three']);
        expect($rootScope.itemsBottom).toEqual(['Bottom One', 'Bottom Two', 'Bottom Three']);
        expect($rootScope.itemsTop).toEqual(listContent(elementTop));
        expect($rootScope.itemsBottom).toEqual(listContent(elementBottom));

        $(elementTop).remove();
        $(elementBottom).remove();
      });
    });

    it('should update model from update() callback', function() {
      inject(function($compile, $rootScope) {
        var element, logsElement;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}">{{ item }}</li></ul>')($rootScope);
        logsElement = $compile('<ul ng-model="logs"><li ng-repeat="log in logs" id="l-{{$index}}">{{ log }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            update: function(e, ui) {
              $rootScope.logs.push('Moved element ' + ui.item.scope().item);
            }
          };
          $rootScope.items = ['One', 'Two', 'Three'];
          $rootScope.logs = [];
        });

        host.append(element).append(logsElement);

        var li = element.find(':eq(1)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Three', 'Two']);
        expect($rootScope.logs).toEqual(['Moved element Two']);
        expect($rootScope.items).toEqual(listContent(element));
        expect($rootScope.logs).toEqual(listContent(logsElement));

        $(element).remove();
        $(logsElement).remove();
      });
    });

    // ensure scope.apply() is called after a stop() callback
    it('should update model from stop() callback', function() {
      inject(function($compile, $rootScope) {
        var element, logsElement;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}">{{ item }}</li></ul>')($rootScope);
        logsElement = $compile('<ul ng-model="logs"><li ng-repeat="log in logs" id="l-{{$index}}">{{ log }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            stop: function(e, ui) {
              $rootScope.logs.push('Moved element ' + ui.item.scope().item);
            }
          };
          $rootScope.items = ['One', 'Two', 'Three'];
          $rootScope.logs = [];
        });

        host.append(element).append(logsElement);

        var li = element.find(':eq(1)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Three', 'Two']);
        expect($rootScope.logs).toEqual(['Moved element Two']);
        expect($rootScope.items).toEqual(listContent(element));
        expect($rootScope.logs).toEqual(listContent(logsElement));

        $(element).remove();
        $(logsElement).remove();
      });
    });

  });

});