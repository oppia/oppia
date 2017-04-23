'use strict';

describe('uiSortable', function() {

  // Ensure the sortable angular module is loaded
  beforeEach(module('ui.sortable'));
  beforeEach(module('ui.sortable.testHelper'));
  beforeEach(module('ui.sortable.testDirectives'));

  var EXTRA_DY_PERCENTAGE, listContent, listInnerContent;

  beforeEach(inject(function (sortableTestHelper) {
    EXTRA_DY_PERCENTAGE = sortableTestHelper.EXTRA_DY_PERCENTAGE;
    listContent = sortableTestHelper.listContent;
    listInnerContent = sortableTestHelper.listInnerContent;
  }));

  describe('Inner directives related', function() {

    var host;

    beforeEach(inject(function() {
      host = $('<div id="test-host"></div>');
      $('body').append(host);
    }));

    afterEach(function() {
      host.remove();
      host = null;
    });

    it('should work when inner directives are used', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile(''.concat(
          '<ul ui-sortable="opts" ng-model="items">',
            '<li ng-repeat="item in items" id="s-{{$index}}" class="sortable-item">',
              '<ui-sortable-simple-test-directive ng-model="item"></ui-sortable-simple-test-directive>',
            '</li>',
          '</ul>'))($rootScope);

        $rootScope.$apply(function() {
          $rootScope.opts = { };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find('> :eq(1)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Three', 'Two']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        li = element.find('> :eq(1)');
        dy = -(1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Three', 'One', 'Two']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        $(element).remove();
      });
    });

    it('should not $destroy directives after sorting.', function() {
      inject(function($compile, $rootScope) {
        var element;
        element = $compile(''.concat(
          '<ul ui-sortable="opts" ng-model="items">',
            '<li ng-repeat="item in items" id="s-{{$index}}" class="sortable-item">',
              '<ui-sortable-destroyable-test-directive ng-model="item"></ui-sortable-destroyable-test-directive>',
            '</li>',
          '</ul>'))($rootScope);

        $rootScope.$apply(function() {
          $rootScope.opts = { };
          $rootScope.items = ['One', 'Two', 'Three'];
        });

        host.append(element);

        var li = element.find('> :eq(1)');
        var dy = (1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['One', 'Three', 'Two']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        li = element.find('> :eq(1)');
        dy = -(1 + EXTRA_DY_PERCENTAGE) * li.outerHeight();
        li.simulate('drag', { dy: dy });
        expect($rootScope.items).toEqual(['Three', 'One', 'Two']);
        expect($rootScope.items).toEqual(listInnerContent(element));

        $(element).remove();
      });
    });

  });

});