import { Inject, Injectable } from '@angular/core';
import { ENVIRONMENT_CONFIGURATION, IEnvironment } from '@dsg/shared/utils/environment';
import { Loader } from '@googlemaps/js-api-loader';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GoogleMapsService {
  public readonly isLoaded$: Observable<boolean>;

  private readonly _isLoaded: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  private readonly _loader: Loader;

  constructor(@Inject(ENVIRONMENT_CONFIGURATION) private readonly _environment: IEnvironment) {
    this.isLoaded$ = this._isLoaded.asObservable();
    this._loader = new Loader({
      apiKey: this._environment.googlePlacesApiConfiguration?.googleApiKey || '',
    });

    this._initialize();
  }

  private async _initialize() {
    try {
      await this._loadScript();
      this._isLoaded.next(true);
      this._isLoaded.complete();
    } catch (error) {
      this._isLoaded.error(error);
    }
  }

  private _loadScript(): Promise<void> {
    // Check if the Google Maps script has already been loaded
    if (typeof google === 'object' && typeof google.maps === 'object' && typeof google.maps.places === 'object') {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      this._loader
        .importLibrary('places')
        .then(() => {
          resolve();
        })
        .catch(_e => {
          reject();
        });
    });
  }
}
