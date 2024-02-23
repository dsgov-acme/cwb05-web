import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EnumMapType, InvitationExpirationStatus, UserEmployerProfileModel, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService, UserStateService } from '@dsg/shared/feature/app-state';
import {
  FooterAction,
  LoadingService,
  NuverialButtonComponent,
  NuverialFooterActionsComponent,
  NuverialIconComponent,
  NuverialPillComponent,
  NuverialSnackBarService,
  NuverialTimeRemainingPipe,
} from '@dsg/shared/ui/nuverial';
import { BehaviorSubject, catchError, EMPTY, forkJoin, map, Observable, of, startWith, Subject, switchMap, take, tap } from 'rxjs';

enum Actions {
  Continue = 'continue',
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialButtonComponent, NuverialPillComponent, NuverialIconComponent, NuverialFooterActionsComponent, NuverialTimeRemainingPipe],
  selector: 'dsg-claim-invitation',
  standalone: true,
  styleUrls: ['./claim-invitation.component.scss'],
  templateUrl: './claim-invitation.component.html',
})
export class ClaimInvitationComponent {
  public expirationStatus = InvitationExpirationStatus;
  public details$;
  public errorMessage$: Observable<boolean>;
  public actions: FooterAction[] = [
    {
      key: Actions.Continue,
      uiClass: 'Primary',
      uiLabel: 'CONTINUE TO DASHBOARD',
    },
  ];

  private readonly _invitationId = this._route.snapshot.paramMap.get('invitationId') ?? '';
  private readonly _loadInvitation: Subject<void> = new Subject<void>();
  private readonly _profileSubject: BehaviorSubject<UserEmployerProfileModel | null> = new BehaviorSubject<UserEmployerProfileModel | null>(null);
  private readonly _errorMessageSubject: Subject<boolean> = new Subject<boolean>();

  private readonly _details$ = this._loadInvitation
    .asObservable()
    .pipe(startWith(undefined))
    .pipe(
      this._loadingService.switchMapWithLoading(() => {
        return this._workApiRoutesService.getEmployerInvitationById$(this._invitationId).pipe(
          this._loadingService.switchMapWithLoading(invitation =>
            forkJoin([
              this._profile$(invitation.profileId),
              this._enumerationService.getDataFromEnum$(EnumMapType.ProfileAccessLevels, invitation.accessLevel).pipe(take(1)),
            ]).pipe(
              map(([userProfile, accessLevel]) => {
                const roleLabel = accessLevel?.label ?? '';
                const expirationStatus: InvitationExpirationStatus = invitation.expirationStatus;

                return { expirationStatus, invitation, roleLabel, userProfile };
              }),
            ),
          ),
          catchError(() => {
            const errorMessage = 'Unable to load the invitation, Please contact the sender to resend the invitation.';

            this._snackBarService.notifyApplicationError(errorMessage);
            this._errorMessageSubject.next(true);

            return EMPTY;
          }),
        );
      }),
    );

  constructor(
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _workApiRoutesService: WorkApiRoutesService,
    private readonly _loadingService: LoadingService,
    private readonly _enumerationService: EnumerationsStateService,
    private readonly _snackBarService: NuverialSnackBarService,
    private readonly _userStateService: UserStateService,
  ) {
    this.details$ = this._details$;
    this.errorMessage$ = this._errorMessageSubject;
  }

  public claimInvitation() {
    this._workApiRoutesService
      .claimEmployerInvitationById$(this._invitationId)
      .pipe(
        take(1),
        this._loadingService.withLoading(),
        this._loadingService.switchMapWithLoading(() => this._userStateService.getUserProfiles$()),
        tap(() => {
          this._loadInvitation.next();
          this._userStateService.setCurrentEmployerId(this._profileSubject.value?.id ?? '');
        }),
        catchError(error => {
          let errorMessage = 'Unable to link your account to the Employer Profile. Please try again in a few minutes.';

          if (error.status === 404) {
            errorMessage = 'The invitation is attached to another account. Please contact the sender to resend the invitation.';
          }

          this._snackBarService.openConfigured({
            dismissible: false,
            duration: Infinity,
            horizontalPosition: 'center',
            message: errorMessage,
            nuverialActions: [
              {
                ariaLabel: 'Accept',
                buttonStyle: 'outlined',
                colorTheme: 'primary',
                context: 'claimInvitation',
                label: 'Accept',
              },
            ],
            type: 'error',
            verticalPosition: 'top',
          });

          return EMPTY;
        }),
      )
      .subscribe();
  }

  public onFooterActionClick(event: string) {
    switch (event) {
      case Actions.Continue:
        this._router.navigate(['/dashboard']);
        break;
    }
  }

  private _profile$(profileId: string): Observable<UserEmployerProfileModel> {
    return this._profileSubject.asObservable().pipe(
      take(1),
      switchMap(profile =>
        profile ? of(profile) : this._workApiRoutesService.getEmployerProfileById$(profileId).pipe(tap(_profile => this._profileSubject.next(_profile))),
      ),
    );
  }
}
