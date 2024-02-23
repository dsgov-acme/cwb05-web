import { Injectable } from '@angular/core';
import { DEFAULT_LOCALE } from '@dsg/shared/data-access/portal-api';
import { IUsersPaginationResponse, UserApiRoutesService, UserModel, UserPreferencesModel } from '@dsg/shared/data-access/user-api';
import { UserEmployerProfileModel, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { LRUCache } from 'lru-cache';
import { BehaviorSubject, Observable, ReplaySubject, catchError, concat, last, map, of, take, tap } from 'rxjs';
import { isUserId } from './user.util';

export const CurrentEmployerIdStorageKey = 'currentEmployerId';

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  public user$: Observable<UserModel | null>;
  public userProfile$: Observable<UserEmployerProfileModel | undefined>;
  public userEmployerProfiles$: Observable<UserEmployerProfileModel[]>;

  private readonly _cacheOptions = {
    allowStale: false, // return stale items before removing from cache?
    max: 200,
    maxSize: 2000000, // for use with tracking overall storage size
    sizeCalculation: (value: UserModel, key: string) => key.length + JSON.stringify(value).length,
    updateAgeOnGet: true,
    updateAgeOnHas: false,
  };

  private readonly _user: ReplaySubject<UserModel | null> = new ReplaySubject<UserModel | null>(1);
  private readonly _userProfile: BehaviorSubject<UserEmployerProfileModel | undefined> = new BehaviorSubject<UserEmployerProfileModel | undefined>(undefined);
  private readonly _userEmployerProfiles: BehaviorSubject<UserEmployerProfileModel[]> = new BehaviorSubject<UserEmployerProfileModel[]>([]);
  private readonly _usersCache: LRUCache<string, UserModel> = new LRUCache<string, UserModel>(this._cacheOptions);

  constructor(protected readonly _userApiRoutesService: UserApiRoutesService, protected readonly _workApiRoutesService: WorkApiRoutesService) {
    this.user$ = this._user.asObservable();
    this.userProfile$ = this._userProfile.asObservable();
    this.userEmployerProfiles$ = this._userEmployerProfiles.asObservable();
  }

  /**
   * Loads the initial user state
   */
  public initializeUser() {
    this.getUser$().pipe(take(1)).subscribe();
  }

  /**
   * Load user profiles
   */
  public initializeUserProfile() {
    this.getUserProfiles$()
      .pipe(
        take(1),
        tap(profiles => {
          if (this.getCurrentEmployerId()) {
            const currentProfile = profiles.find(profile => profile.id === this.getCurrentEmployerId());
            if (currentProfile) {
              this._userProfile.next(currentProfile);

              return;
            }
          }
          this.setCurrentEmployerId(profiles[0].id);
        }),
      )
      .subscribe();
  }

  /**
   * Loads an initial users cache with agency users
   */
  public initializeUsersCache$(): Observable<IUsersPaginationResponse<UserModel>> {
    return this._userApiRoutesService.getUsers$([{ field: 'userType', value: 'agency' }]).pipe(
      tap(usersSchema => {
        usersSchema.users.forEach((user: UserModel) => {
          this._usersCache.set(user.id, user);
        });
      }),
    );
  }

  /**
   * Clear the user state variables
   */
  public clearUserState() {
    this._user.next(null);
    this._usersCache.clear();
  }

  /**
   * Get the currentUser and set the user accordingly
   */
  public getUser$(): Observable<UserModel> {
    return this._userApiRoutesService.getUser$().pipe(
      tap(user => {
        this._user.next(user);
      }),
    );
  }

  /**
   * Get the user from the cache first and then from the api
   */
  public getUserById$(userId?: string): Observable<UserModel | undefined> {
    if (!userId || !isUserId(userId)) return of(undefined);

    const user = this._usersCache.get(userId);

    if (!user) {
      return this._userApiRoutesService.getUserById$(userId).pipe(
        tap(userModel => this._usersCache.set(userId, userModel)),
        catchError(_error => {
          return of(undefined);
        }),
      );
    }

    return of(user);
  }

  /**
   * Get the displayName from the users cache
   */
  public getUserDisplayName$(userId?: string): Observable<string> {
    if (!userId) return of('');

    return this.getUserById$(userId).pipe(map(user => user?.displayName || userId));
  }

  /**
   * Get the displayName from the users cache
   */
  public getUserEmail$(userId?: string): Observable<string> {
    if (!userId) return of('');

    return this.getUserById$(userId).pipe(map(user => user?.email || userId));
  }

  /**
   * Set the currentUser when createUpdateProfile is called
   */
  public saveUser$(payload: UserModel): Observable<UserModel> {
    payload.preferences.preferredLanguage = payload.preferences.preferredLanguage || DEFAULT_LOCALE;
    const preferences = new UserPreferencesModel(payload.preferences);

    const updateUserPreferences$ = this._userApiRoutesService.createUpdateUserPreferences$(payload.id, preferences);
    const updateUserProfile$ = this._userApiRoutesService.createUpdateProfile$(payload);

    // last() doesn't know that only the type of the 2nd observable is being returned
    return (concat(updateUserPreferences$, updateUserProfile$) as Observable<UserModel>).pipe(
      last(),
      tap(user => {
        this._user.next(user);
      }),
    );
  }

  public getUserProfiles$() {
    return this._workApiRoutesService.getUserProfiles$('employer').pipe(
      tap(profiles => {
        this._userEmployerProfiles.next(profiles);
      }),
    );
  }

  public getCurrentEmployerId(): string | null {
    return this._userProfile.value?.id || localStorage.getItem(CurrentEmployerIdStorageKey);
  }
  public setCurrentEmployerId(employerId: string): void {
    localStorage.setItem(CurrentEmployerIdStorageKey, employerId);
    const currentEmployer = this._userEmployerProfiles.value.find(profile => profile.id === employerId);
    this._userProfile.next(currentEmployer);
  }
}
