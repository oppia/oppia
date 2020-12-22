import { TestBed } from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/auth';
import { of } from 'rxjs';
import { AuthService } from 'services/auth.service';


describe('Auth service', () => {
  let authService: AuthService;
  let angularFireAuthSpy: jasmine.SpyObj<AngularFireAuth>;

  beforeEach(() => {
    angularFireAuthSpy = jasmine.createSpyObj<AngularFireAuth>(
      'AngularFireAuth', ['signOut', 'signInWithPopup'], {idToken: of(null)});
    angularFireAuthSpy.signInWithPopup.and.callFake(() => {
      console.log(':o');
      return Promise.resolve({credential: null, user: null});
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {provide: AngularFireAuth, useValue: angularFireAuthSpy}
      ]
    });

    authService = TestBed.inject(AuthService);
  });

  it('should sign out successfully', async() => {
    angularFireAuthSpy.signOut.and.resolveTo();

    await expectAsync(authService.signOutAsync()).toBeResolvedTo();
  });
});
