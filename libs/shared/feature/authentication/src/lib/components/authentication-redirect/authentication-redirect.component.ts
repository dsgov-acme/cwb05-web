import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NuverialButtonComponent, NuverialCardComponent, NuverialSpinnerComponent } from '@dsg/shared/ui/nuverial';
import { tap } from 'rxjs';
import { AuthenticationBaseDirective } from '../../common';
import { AuthenticationProviderActions, IAuthenticatedError } from '../../models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialSpinnerComponent, NuverialCardComponent, NuverialButtonComponent],
  selector: 'dsg-authentication-redirect',
  standalone: true,
  styleUrls: ['./authentication-redirect.component.scss'],
  templateUrl: './authentication-redirect.component.html',
})
export class AuthenticationRedirectComponent extends AuthenticationBaseDirective {
  public providerActions = AuthenticationProviderActions;
  public failureMessage = 'Encountered an error signing in, please try again.';

  public redirectResult$ = this._authenticationService.redirectResult$.pipe(
    tap(result => {
      if (result === null) {
        this.signInWithRedirect();
      } else if ((result as IAuthenticatedError).code) {
        this.failureMessage = this._authenticationService.errorString(result as IAuthenticatedError);
      }
    }),
  );

  public signInWithRedirect() {
    this._authenticationService.signInWithRedirect$();
  }
}
