describe('List directive', function() {
  var elm, scope;

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


describe('RTE directive', function() {
  var elm, scope, template, $httpBackend;

  var INTERNAL_RTE_CONTENT_PATH = 'core/templates/dev/head/components/rte.html';

  beforeEach(module('oppia', INTERNAL_RTE_CONTENT_PATH));

  beforeEach(inject(function($rootScope, $compile, $templateCache, _$httpBackend_) {
    template = $templateCache.get(INTERNAL_RTE_CONTENT_PATH);
    $templateCache.put('/templates/rte', template);

    $httpBackend = _$httpBackend_;
    $httpBackend.whenGET('/templates/rte').respond(template);
    $httpBackend.expectGET('/templates/rte');

    elm = angular.element('<rich-text-editor></rich-text-editor>');
    scope = $rootScope;
    $compile(elm)(scope);
    scope.$digest();
  }));

  it('should convert correctly between HTML and RTE', inject(function($rootScope, $compile) {
    var testData = [
      ['<div></div>', '<div></div>'],
      ['<div>abc</div>', '<div>abc</div>'],
      ['<div>abc</div><br>', '<div>abc</div><br>'],
      ['<div>abc<span>def</span></div><b>ghi</b>', '<div>abc<span>def</span></div><b>ghi</b>'],
      // TODO(sll): This needs to be changed to carry along the attributes.
      ['<oppia-noninteractive-image></oppia-noninteractive-image>',
       '<img src="/rte_assets/picture.png" class="oppia-noninteractive-image">']
    ];

    var rteControllerScope = elm.scope();
    for (var i = 0; i < testData.length; i++) {
      expect(rteControllerScope.convertHtmlToRte(testData[i][0]))
          .toEqual(testData[i][1]);
      expect(rteControllerScope.convertRteToHtml(testData[i][1]))
          .toEqual(testData[i][0]);
    }
  }));
});
