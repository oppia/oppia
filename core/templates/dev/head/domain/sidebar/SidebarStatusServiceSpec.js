describe('SidebarStatusService', function() {
  var SidebarStatusService;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    SidebarStatusService = $injector.get('SidebarStatusService');
  }));

  it('should open the sidebar if it is not open', function() {
    SidebarStatusService.openSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
  });

  it('should not open the sidebar if it is open', function() {
    SidebarStatusService.openSidebar();
    SidebarStatusService.openSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
  });

  it('should close the sidebar if it is open', function() {
    SidebarStatusService.openSidebar();
    SidebarStatusService.closeSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });

  it('should not close the sidebar if it is not open', function() {
    SidebarStatusService.closeSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });

  it('should toggle sidebar to open', function(){
    SidebarStatusService.toggleSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
  });

  it('should toggle sidebar to close', function(){
    SidebarStatusService.openSidebar();
    SidebarStatusService.toggleSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });

  it('should close sidebar if pendingSidebarClick is false', function(){
    SidebarStatusService.onDocumentClick();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });

  it('should toggle endingSidebarClick', function(){
    SidebarStatusService.openSidebar();
    SidebarStatusService.onDocumentClick();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
  });
});