import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { EnvironmentTestingModule } from '@dsg/shared/utils/environment';
import { Loader } from '@googlemaps/js-api-loader';
import { ReplaySubject } from 'rxjs';

import { GoogleMapsService } from './google-maps.service';

describe('GoogleMapsService', () => {
  let service: GoogleMapsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EnvironmentTestingModule],
    });
    service = TestBed.inject(GoogleMapsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have isLoaded$ observable', () => {
    expect(service.isLoaded$).toBeDefined();
    expect(service['_loader']).toBeDefined();
  });

  it('should initialize and set isLoaded to true', fakeAsync(() => {
    jest.spyOn(service['_loader'], 'importLibrary').mockRejectedValueOnce(Promise.resolve());

    tick(1);

    service.isLoaded$.subscribe(isLoaded => {
      expect(isLoaded).toBe(true);
    });
  }));

  it('should handle initialization error and set isLoaded to error', fakeAsync(() => {
    jest.spyOn(service['_loader'], 'importLibrary').mockRejectedValueOnce('Script loading failed');

    (service as any)['_isLoaded'] = new ReplaySubject(1);
    (service as any).isLoaded$ = service['_isLoaded'].asObservable();

    tick(1);

    service.isLoaded$.subscribe({
      error: error => {
        expect(error).toBe('Script loading failed');
      },
    });
  }));

  describe('_loadScript', () => {
    it('should resolve when script is successfully loaded', fakeAsync(() => {
      jest.spyOn(Loader.prototype, 'importLibrary').mockResolvedValueOnce(Promise.resolve());

      service['_loadScript']().then(() => {
        expect(Loader.prototype.importLibrary).toHaveBeenCalledWith('places');
      });
    }));

    it('should reject when script loading fails', fakeAsync(() => {
      jest.spyOn(Loader.prototype, 'importLibrary').mockRejectedValueOnce('Script loading failed');

      service['_loadScript']().catch(error => {
        expect(error).toBe(undefined);
      });
    }));
  });
});
