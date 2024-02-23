import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { INuverialBreadCrumb, NuverialBreadcrumbComponent } from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, Observable, filter, map, switchMap, tap } from 'rxjs';

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NuverialBreadcrumbComponent],
  selector: 'dsg-transaction-messages',
  standalone: true,
  styleUrls: ['./transaction-messages.component.scss'],
  templateUrl: './transaction-messages.component.html',
})
export class TransactionMessagesComponent implements OnInit {
  public hasBreadcrumb: Observable<boolean>;
  public breadCrumbs: INuverialBreadCrumb[] = [{ label: 'Back to all Messages', navigationPath: `./`, relative: true }];
  private readonly _hasBreadcrumbs: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private readonly _router: Router, private readonly _route: ActivatedRoute) {
    this.hasBreadcrumb = this._hasBreadcrumbs.asObservable();
    this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => event as NavigationEnd),
        switchMap(() => this._route.children[0].url),
        tap(url => this._hasBreadcrumbs.next(!!url.length)),
        untilDestroyed(this),
      )
      .subscribe();
  }

  public ngOnInit(): void {
    this._hasBreadcrumbs.next(!!this._route.snapshot.children[0].url.length);
  }
}
