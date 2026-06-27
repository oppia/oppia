import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AvailableCertificateOfferingPageComponent} from './certificate-offering-available-page.component';

describe('AvailableCertificateOfferingPageComponent', () => {
  let component: AvailableCertificateOfferingPageComponent;
  let fixture: ComponentFixture<AvailableCertificateOfferingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AvailableCertificateOfferingPageComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      AvailableCertificateOfferingPageComponent
    );
    component = fixture.componentInstance;
    component.classroomUrlFragment = 'math';
  });

  it('should render the certificate offering content', () => {
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector(
          '.oppia-certificate-offering-available-page__actions .btn.btn-primary'
        )
        .textContent.trim()
    ).toBe('Continue to assessment');
    expect(
      fixture.nativeElement
        .querySelector('.oppia-certificate-offering-available-page__panel h1')
        .textContent.trim()
    ).toBe('Available certificate offering');
  });
});
