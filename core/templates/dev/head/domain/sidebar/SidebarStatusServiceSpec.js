describe('SidebarStatusService', function() {
  var SidebarStatusService;
  var sidebarIsShown;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector, $rootScope, $controller) {
    SidebarStatusService = $injector.get('SidebarStatusService');
  }));

  it('should open the sidebar', function() {
    SidebarStatusService.openSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
    SidebarStatusService.toggleSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });

  it('should close the sidebar', function() {
    SidebarStatusService.openSidebar();
    SidebarStatusService.closeSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
    SidebarStatusService.toggleSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
  });
});