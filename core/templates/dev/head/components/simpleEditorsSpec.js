describe('List directive', function() {
  var elm, scope, $httpBackend;

  LIST_COMPONENT_HTML_PATH = 'core/templates/dev/head/components/list.html';

  beforeEach(module('oppia', LIST_COMPONENT_HTML_PATH));

  beforeEach(inject(function($templateCache) {
    template = $templateCache.get(LIST_COMPONENT_HTML_PATH);
    $templateCache.put('/templates/list', template);
  }));

  // TODO(sll): Add E2E tests.

  it('should check largeInput works correctly', inject(function($rootScope, $compile) {
    scope = $rootScope;
    scope.val = ['first list value'];

    elm = $compile('<list items="val" large-input="true"></list>')($rootScope);
    scope.$apply();

    var listControllerScope = elm.scope();
    expect(listControllerScope.largeInput).toEqual('true');

    elm = $compile('<list items="val"></list>')($rootScope);
    scope.$apply();

    listControllerScope = elm.scope();
    // TODO(sll): Doesn't this get changed to false in the interior scope?
    expect(listControllerScope.largeInput).toBeUndefined();
  }));

  it('should add a new item to the list', inject(function($rootScope, $compile) {
    scope = $rootScope;
    scope.val = [];

    elm = $compile('<list items="val"></list>')($rootScope);
    scope.$apply();

    var listControllerScope = elm.scope();
    listControllerScope.addItem();
    expect(listControllerScope.items).toEqual(['']);
  }));

  it('should replace a list item', inject(function($rootScope, $compile) {
    scope = $rootScope;
    scope.val = ['first item'];

    elm = $compile('<list items="val"></list>')($rootScope);
    scope.$apply();

    var listControllerScope = elm.scope();
    expect(listControllerScope.items).toEqual(['first item']);
    listControllerScope.replaceItem(0, 'replacement item');
    expect(listControllerScope.items).toEqual(['replacement item']);
  }));
});
