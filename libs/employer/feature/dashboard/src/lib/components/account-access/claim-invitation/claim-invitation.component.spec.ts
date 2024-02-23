import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import {
  EmployerProfileInvite,
  EmployerProfileInviteMock,
  EnumMapType,
  IEnumData,
  ProfileAccessLevelsMock,
  UserEmployerProfileModel,
  UserEmployerProfiles,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService, UserStateService } from '@dsg/shared/feature/app-state';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { HttpTestingModule } from '@dsg/shared/utils/http';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { ClaimInvitationComponent } from './claim-invitation.component';

describe('ClaimInvitationComponent', () => {
  let component: ClaimInvitationComponent;
  let fixture: ComponentFixture<ClaimInvitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimInvitationComponent, RouterTestingModule, HttpTestingModule],
      providers: [
        MockProvider(WorkApiRoutesService, {
          getEmployerInvitationById$: jest.fn().mockImplementation(() => of(new EmployerProfileInvite(EmployerProfileInviteMock))),
          getEmployerProfileById$: jest.fn().mockImplementation(() => of(new UserEmployerProfileModel(UserEmployerProfiles))),
        }),
        MockProvider(NuverialSnackBarService),
        MockProvider(EnumerationsStateService, {
          getDataFromEnum$: jest.fn().mockReturnValue(of(ProfileAccessLevelsMock.get('ADMIN'))),
        }),
        MockProvider(UserStateService, {
          getUserProfiles$: jest.fn().mockImplementation(() => of([])),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClaimInvitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Accessability', () => {
    it('should have no violations', async () => {
      const axeResults = await axe(fixture.nativeElement);
      expect.extend(toHaveNoViolations);
      expect(axeResults).toHaveNoViolations();
    });
  });

  describe('onFooterActionClick', () => {
    it('should navigate to /dashboard when event is "Continue"', () => {
      // Arrange
      const navigateSpy = jest.spyOn(component['_router'], 'navigate');

      // Act
      component.onFooterActionClick('continue');

      // Assert
      expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should not navigate when event is not "Continue"', () => {
      // Arrange
      const navigateSpy = jest.spyOn(component['_router'], 'navigate');

      // Act
      component.onFooterActionClick('Cancel');

      // Assert
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  it('should load invitation details', fakeAsync(() => {
    // Arrange
    const invitationId = '';
    const invitation = new EmployerProfileInvite(EmployerProfileInviteMock);
    const userProfile = new UserEmployerProfileModel(UserEmployerProfiles);

    jest.spyOn(component['_loadInvitation'], 'next');
    jest.spyOn(component['_workApiRoutesService'], 'getEmployerInvitationById$').mockReturnValue(of(invitation));
    jest.spyOn(component['_workApiRoutesService'], 'getEmployerProfileById$').mockReturnValue(of(userProfile));
    jest.spyOn(component['_enumerationService'], 'getDataFromEnum$');

    // Act
    (component as any)['_invitationId'] = invitationId;
    fixture.detectChanges();
    tick();

    // Assert
    expect(component['_workApiRoutesService'].getEmployerInvitationById$).toHaveBeenCalledWith(invitationId);
    expect(component['_workApiRoutesService'].getEmployerProfileById$).toHaveBeenCalledWith(invitation.profileId);
    expect(component['_enumerationService'].getDataFromEnum$).toHaveBeenCalledWith(EnumMapType.ProfileAccessLevels, invitation.accessLevel);
  }));

  describe('claimInvitation', () => {
    it('should claim the employer invitation and notify success', fakeAsync(() => {
      // Arrange
      const claimEmployerInvitationByIdSpy = jest
        .spyOn(component['_workApiRoutesService'], 'claimEmployerInvitationById$')
        .mockReturnValue(of(new EmployerProfileInvite(EmployerProfileInviteMock)));
      const notifyApplicationErrorSpy = jest.spyOn(component['_snackBarService'], 'notifyApplicationError');
      jest.spyOn(component['_loadInvitation'], 'next');
      jest.spyOn(component['_userStateService'], 'setCurrentEmployerId');
      jest.spyOn(component['_userStateService'], 'getUserProfiles$');

      // Act
      component.claimInvitation();
      tick();

      // Assert
      expect(claimEmployerInvitationByIdSpy).toHaveBeenCalledWith(component['_invitationId']);
      expect(notifyApplicationErrorSpy).not.toHaveBeenCalled();
      expect(component['_loadInvitation'].next).toHaveBeenCalled();
      expect(component['_userStateService'].setCurrentEmployerId).toHaveBeenCalled();
      expect(component['_userStateService'].getUserProfiles$).toHaveBeenCalled();
    }));

    it('should handle 404 error and notify appropriate error message', fakeAsync(() => {
      // Arrange
      const claimEmployerInvitationByIdSpy = jest.spyOn(component['_workApiRoutesService'], 'claimEmployerInvitationById$').mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
            }),
        ),
      );
      const notifyApplicationErrorSpy = jest.spyOn(component['_snackBarService'], 'openConfigured');

      // Act
      component.claimInvitation();
      tick();

      // Assert
      expect(claimEmployerInvitationByIdSpy).toHaveBeenCalledWith(component['_invitationId']);
      expect(notifyApplicationErrorSpy).toHaveBeenCalled();
    }));

    it('should handle other errors and notify default error message', fakeAsync(() => {
      // Arrange
      const claimEmployerInvitationByIdSpy = jest.spyOn(component['_workApiRoutesService'], 'claimEmployerInvitationById$').mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
            }),
        ),
      );
      const notifyApplicationErrorSpy = jest.spyOn(component['_snackBarService'], 'openConfigured');

      // Act
      component.claimInvitation();
      tick();

      // Assert
      expect(claimEmployerInvitationByIdSpy).toHaveBeenCalledWith(component['_invitationId']);
      expect(notifyApplicationErrorSpy).toHaveBeenCalled();
    }));
  });

  describe('_details$', () => {
    it('should load invitation details', fakeAsync(() => {
      // Arrange
      const invitationId = '';
      const invitation = new EmployerProfileInvite(EmployerProfileInviteMock);
      const userProfile = new UserEmployerProfileModel(UserEmployerProfiles);
      const accessLevel = ProfileAccessLevelsMock.get('ADMIN') as IEnumData;

      jest.spyOn(component['_loadInvitation'], 'next');
      jest.spyOn(component['_workApiRoutesService'], 'getEmployerInvitationById$').mockReturnValue(of(invitation));
      jest.spyOn(component as any, '_profile$').mockReturnValue(of(userProfile));
      jest.spyOn(component['_enumerationService'], 'getDataFromEnum$').mockReturnValue(of(accessLevel));

      // Act
      (component as any)['_invitationId'] = invitationId;
      fixture.detectChanges();
      tick();

      // Assert
      expect(component['_workApiRoutesService'].getEmployerInvitationById$).toHaveBeenCalledWith(invitationId);
      // expect(component['_profile$']).toHaveBeenCalledWith(invitation.profileId);
      expect(component['_enumerationService'].getDataFromEnum$).toHaveBeenCalledWith(EnumMapType.ProfileAccessLevels, invitation.accessLevel);
    }));

    it('should handle error and notify application error', fakeAsync(() => {
      // Arrange
      const invitationId = '';
      const errorMessage = 'Unable to load the invitation, Please contact the sender to resend the invitation.';
      jest.spyOn(component['_loadInvitation'], 'next');
      jest.spyOn(component['_errorMessageSubject'], 'next');
      jest.spyOn(component['_workApiRoutesService'], 'getEmployerInvitationById$').mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
            }),
        ),
      );
      jest.spyOn(component['_snackBarService'], 'notifyApplicationError');

      // Act
      (component as any)['_invitationId'] = invitationId;
      (component as any)['_loadInvitation'].next();
      fixture.detectChanges();
      tick();

      // Assert
      expect(component['_workApiRoutesService'].getEmployerInvitationById$).toHaveBeenCalledWith(invitationId);
      expect(component['_snackBarService'].notifyApplicationError).toHaveBeenCalledWith(errorMessage);
      expect(component['_errorMessageSubject'].next).toHaveBeenCalledWith(true);
    }));
  });
});
