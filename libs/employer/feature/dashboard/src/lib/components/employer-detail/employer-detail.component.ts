import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmployerDetailModel, TransactionModel } from '@dsg/shared/data-access/work-api';
import { FormRendererComponent, FormRendererService } from '@dsg/shared/feature/form-nuv';
import { MessagingService } from '@dsg/shared/feature/messaging';
import {
  INavigableTab,
  INuverialBreadCrumb,
  INuverialSelectOption,
  LoadingService,
  NuverialBreadcrumbComponent,
  NuverialCopyButtonComponent,
  NuverialFooterActionsComponent,
  NuverialIconComponent,
  NuverialNavigableTabsComponent,
  NuverialPillComponent,
  NuverialSelectComponent,
  NuverialSnackBarService,
  NuverialTabKeyDirective,
} from '@dsg/shared/ui/nuverial';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EMPTY, Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { DashboardService } from '../../services';
import { EmployerDetailService } from './employer-detail.service';

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormRendererComponent,
    FormsModule,
    ReactiveFormsModule,
    NuverialCopyButtonComponent,
    NuverialBreadcrumbComponent,
    NuverialIconComponent,
    NuverialTabKeyDirective,
    NuverialSelectComponent,
    NuverialPillComponent,
    RouterModule,
    NuverialFooterActionsComponent,
    NuverialNavigableTabsComponent,
  ],
  selector: 'dsg-employer-detail',
  standalone: true,
  styleUrls: ['./employer-detail.component.scss'],
  templateUrl: './employer-detail.component.html',
})
export class EmployerDetailComponent implements OnDestroy {
  public breadCrumbs: INuverialBreadCrumb[] = [{ label: 'Back To Dashboard', navigationPath: `/dashboard` }];
  public employer$: Observable<EmployerDetailModel> = this._employerDetailService
    .getEmployerDetails$()
    .pipe(tap(employer => this.assignedToControl.setValue(employer.assignedTo)));

  public baseRoute = '';
  public subCategoryTabs: INavigableTab[] = [];
  public transaction?: TransactionModel;

  public assignedToControl = new FormControl();
  public assignedToSelectOptions: INuverialSelectOption[] = [];
  public agentsSelectOptions$: Observable<INuverialSelectOption[]> = this._employerDetailService.getEmployerAgents$().pipe(
    map(agents => {
      return agents.map(agent => {
        return {
          disabled: false,
          displayTextValue: agent.displayName === agent.email ? agent.email : `${agent.displayName} - ${agent.email}`,
          key: agent.id,
          selected: false,
        };
      });
    }),
  );

  public loadTransaction$ = this._route.paramMap.pipe(
    tap(params => {
      const transactionId = params.get('transactionId') ?? '';
      this._messagingService.initialize('TRANSACTION', transactionId);
    }),
    switchMap(params => {
      const transactionId = params.get('transactionId') ?? '';
      if (transactionId) {
        return this._formRendererService.loadTransactionDetails$(transactionId);
      }

      return of([undefined, undefined]);
    }),
    tap(([_, transactionModel]) => {
      if (transactionModel) {
        this.transaction = transactionModel;
      }
    }),
    catchError(() => {
      this._nuverialSnackBarService.notifyApplicationError();
      this._router.navigate(['/dashboard']);

      return EMPTY;
    }),
  );

  public loadSubCategories$ = this._route.paramMap.pipe(
    this._loadingService.switchMapWithLoading(params => {
      this._categoryRoute = params.get('category') ?? '';
      const transactionId = params.get('transactionId') ?? '';
      const dashboardCategory = this._dashboardService.getDashboardCategoryByRoute(this._categoryRoute);
      if (dashboardCategory) {
        this.subCategoryTabs = dashboardCategory.subCategories;
        if (dashboardCategory.hasTransactionList) {
          this.breadCrumbs = [{ label: 'Back To Transactions', navigationPath: `/dashboard/${this._categoryRoute}/transactions` }];
          if (!transactionId) {
            this._router.navigate(['transactions'], { relativeTo: this._route });
          }
        }
      } else {
        this._nuverialSnackBarService.notifyApplicationError();
        this._router.navigate(['/dashboard']);

        return EMPTY;
      }

      this.baseRoute = `/dashboard/${this._categoryRoute}`;
      if (transactionId) {
        this.baseRoute = this.baseRoute.concat(`/transaction/${transactionId}`);
      }

      return of(dashboardCategory.subCategories);
    }),
  );

  private _categoryRoute = '';

  constructor(
    private readonly _employerDetailService: EmployerDetailService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _dashboardService: DashboardService,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _formRendererService: FormRendererService,
    private readonly _messagingService: MessagingService,
    private readonly _loadingService: LoadingService,
  ) {}

  public copyId(id: string): void {
    navigator.clipboard.writeText(id);
  }

  public ngOnDestroy(): void {
    this._formRendererService.cleanUp();
  }
}
