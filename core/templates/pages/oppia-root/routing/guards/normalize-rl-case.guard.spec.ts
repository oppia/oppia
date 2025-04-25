// normalize-url-case.guard.spec.ts
it('redirects mixed-case /learn slug to lowercase', () => {
  const mockRouter = jasmine.createSpyObj('Router', ['parseUrl']);
  const guard = new NormalizeUrlCaseGuard(mockRouter as any);

  const tree = {} as UrlTree;
  mockRouter.parseUrl.and.returnValue(tree);

  const result = guard.canActivate({} as any, {url: '/learn/MaTh'} as any);
  expect(mockRouter.parseUrl).toHaveBeenCalledWith('/learn/math');
  expect(result).toEqual(tree);
});
