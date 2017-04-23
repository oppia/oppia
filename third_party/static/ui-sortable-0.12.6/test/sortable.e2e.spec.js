'use strict';

describe('uiSortable', function() {

  // Ensure the sortable angular module is loaded
  beforeEach(module('ui.sortable'));
  beforeEach(module('ui.sortable.testHelper'));

  var EXTRA_DY_PERCENTAGE, listContent, listInnerContent;

  beforeEach(inject(function (sortableTestHelper) {
    EXTRA_DY_PERCENTAGE = sortableTestHelper.EXTRA_DY_PERCENTAGE;
    listContent = sortableTestHelper.listContent;
    listInnerContent = sortableTestHelper.listInnerContent;
  }));

  describe('Drag & Drop simulation', function() {

    var host;

    beforeEach(inject(function() {
      host = $('<div id="test-host"></div>');
      $('body').append(host);
    }));

    afterEach(function() {
      host.remove();
      host = null;
    });

    it('should update model when order changes', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find(':eq(1)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Three', 'Two']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = -(1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Three', 'One', 'Two']);
        expect($rootScope.items).toEqual(listContent(element));

        $(element).remove();
      });
    });

    it('should not allow sorting of "locked" nodes', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}" ng-class="{ sortable: item.sortable }">{{ item.text }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            items:'> .sortable'
          };
          $rootScope.items = [
            { text: 'One', sortable: true },
            { text: 'Two', sortable: true },
            { text: 'Three', sortable: false },
            { text: 'Four', sortable: true }
          ];
        });

        host.append(element);

        var li = element.find(':eq(2)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items.map(function(x){ return x.text; })).toEqual(['One', 'Two', 'Three', 'Four']);
        expect($rootScope.items.map(function(x){ return x.text; })).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (2 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items.map(function(x){ return x.text; })).toEqual(['One', 'Three', 'Four', 'Two']);
        expect($rootScope.items.map(function(x){ return x.text; })).toEqual(listContent(element));

        li = element.find(':eq(2)');
        dy = -(2 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items.map(function(x){ return x.text; })).toEqual(['Four', 'One', 'Three', 'Two']);
        expect($rootScope.items.map(function(x){ return x.text; })).toEqual(listContent(element));

        li = element.find(':eq(3)');
        dy = -(2 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items.map(function(x){ return x.text; })).toEqual(['Four', 'Two', 'One', 'Three']);
        expect($rootScope.items.map(function(x){ return x.text; })).toEqual(listContent(element));

        // also placing right above the locked node seems a bit harder !?!?

        $(element).remove();
      });
    });

    it('should work when "placeholder" option is used', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}" class="sortable-item">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            placeholder: 'sortable-item-placeholder'
          };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find(':eq(1)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Three', 'Two']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = -(1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Three', 'One', 'Two']);
        expect($rootScope.items).toEqual(listContent(element));

        $(element).remove();
      });
    });

    it('should work when "placeholder" option equals the class of items', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}" class="sortable-item">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            placeholder: 'sortable-item'
          };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find(':eq(1)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Three', 'Two']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = -(1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Three', 'One', 'Two']);
        expect($rootScope.items).toEqual(listContent(element));

        $(element).remove();
      });
    });

    it('should continue to work after a drag is reverted', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}" class="sortable-item">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            placeholder: 'sortable-item'
          };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find(':eq(0)');
        var dy = (2 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('dragAndRevert', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Two', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(0)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'One', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'Three', 'One']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'One', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        $(element).remove();
      });
    });

    it('should work when "handle" option is used', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}"><span class="handle">H</span> <span class="itemContent">{{ item }}</span></li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            handle: '.handle'
          };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find('li:eq(1)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.find('.handle').simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Three', 'Two']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        li = element.find('li:eq(1)');
        dy = -(1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.find('.handle').simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Three', 'One', 'Two']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        $(element).remove();
      });
    });

    it('should properly remove elements after a sorting', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}"><span class="handle">H</span> <span class="itemContent">{{ item }}</span> <button type="button" class="removeButton" ng-click="remove(item, $index)">X</button></li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            handle: '.handle'
          };
          $rootScope.items = ['One', 'Two', 'Three'];

          $rootScope.remove = function (item, itemIndex) {
            $rootScope.items.splice(itemIndex, 1);
          };
        });

        host.append(element);

        var li = element.find('li:eq(1)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.find('.handle').simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Three', 'Two']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        li = element.find('li:eq(1)');
        li.find('.removeButton').click();
        expect($rootScope.items).toEqual(['One', 'Two']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        li = element.find('li:eq(0)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.find('.handle').simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'One']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        li = element.find('li:eq(0)');
        li.find('.removeButton').click();
        expect($rootScope.items).toEqual(['One']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        $(element).remove();
      });
    });

    it('should properly remove elements after a drag is reverted', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}"><span class="handle">H</span> <span class="itemContent">{{ item }}</span> <button type="button" class="removeButton" ng-click="remove(item, $index)">X</button></li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            handle: '.handle'
          };
          $rootScope.items = ['One', 'Two', 'Three'];

          $rootScope.remove = function (item, itemIndex) {
            $rootScope.items.splice(itemIndex, 1);
          };
        });

        host.append(element);

        var li = element.find('li:eq(0)');
        var dy = (2 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.find('.handle').simulate('dragAndRevert', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Two', 'Three']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        li = element.find('li:eq(0)');
        li.find('.removeButton').click();
        expect($rootScope.items).toEqual(['Two', 'Three']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        li = element.find('li:eq(0)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.find('.handle').simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Three', 'Two']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        $(element).remove();
      });
    });

    it('should work when "helper: clone" option is used', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}" class="sortable-item">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            helper: 'clone'
          };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find(':eq(1)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Three', 'Two']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = -(1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Three', 'One', 'Two']);
        expect($rootScope.items).toEqual(listContent(element));

        $(element).remove();
      });
    });

    it('should work when "helper: clone" option is used and a drag is reverted', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}" class="sortable-item">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            helper: 'clone'
          };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find(':eq(0)');
        var dy = (2 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('dragAndRevert', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Two', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(0)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'One', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'Three', 'One']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'One', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        $(element).remove();
      });
    });

    it('should work when "helper: clone" and "placeholder" options are used together.', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}" class="sortable-item">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            helper: 'clone',
            placeholder: 'sortable-item'
          };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find(':eq(0)');
        var dy = (2 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('dragAndRevert', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Two', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(0)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'One', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'Three', 'One']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('dragAndRevert', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'Three', 'One']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'One', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        $(element).remove();
      });
    });

    it('should work when "helper: function" option is used', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}" class="sortable-item">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            helper: function (e, item) {
              return item.clone().text('helper');
            }
          };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find(':eq(1)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Three', 'Two']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = -(1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Three', 'One', 'Two']);
        expect($rootScope.items).toEqual(listContent(element));

        $(element).remove();
      });
    });

    it('should work when "helper: function" option is used and a drag is reverted', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}" class="sortable-item">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            helper: function (e, item) {
              return item.clone().text('helper');
            }
          };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find(':eq(0)');
        var dy = (2 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('dragAndRevert', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Two', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(0)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'One', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'Three', 'One']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'One', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        $(element).remove();
      });
    });

    it('should work when "helper: function" and "placeholder" options are used together.', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile('<ul ui-sortable="opts" ng-model="items"><li ng-repeat="item in items" id="s-{{$index}}" class="sortable-item">{{ item }}</li></ul>')($rootScope);
        $rootScope.$apply(function() {
          $rootScope.opts = {
            helper: function (e, item) {
              return item.clone().text('helper');
            },
            placeholder: 'sortable-item'
          };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find(':eq(0)');
        var dy = (2 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('dragAndRevert', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Two', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(0)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'One', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'Three', 'One']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('dragAndRevert', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'Three', 'One']);
        expect($rootScope.items).toEqual(listContent(element));

        li = element.find(':eq(1)');
        dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Two', 'One', 'Three']);
        expect($rootScope.items).toEqual(listContent(element));

        $(element).remove();
      });
    });

  });

});