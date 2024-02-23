/* eslint-disable @typescript-eslint/naming-convention */
import { ElementRef, Renderer2 } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { EnvironmentTestingModule } from '@dsg/shared/utils/environment';
import { initialize } from '@googlemaps/jest-mocks';
import { MockProvider, ngMocks } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { GoogleMapsAutocompleteComponent } from './google-maps-autocomplete.component';
import { GoogleMapsService } from './google-maps.service';

describe('GoogleMapsAutocompleteComponent', () => {
  let component: GoogleMapsAutocompleteComponent;
  let fixture: ComponentFixture<GoogleMapsAutocompleteComponent>;
  const _isLoaded = new BehaviorSubject<boolean>(true);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleMapsAutocompleteComponent, EnvironmentTestingModule, NoopAnimationsModule],
      providers: [
        { provide: ElementRef, useValue: { nativeElement: {} } },
        { provide: Renderer2, useValue: {} },
        MockProvider(NuverialSnackBarService),
        MockProvider(GoogleMapsService, { isLoaded$: _isLoaded.asObservable() }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GoogleMapsAutocompleteComponent);
    component = fixture.componentInstance;
    component.formControl = new FormControl();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it.skip('should initialize Google Maps Autocomplete', async () => {
    // Arrange
    const mockPlace = {
      formatted_address: '123 Main St, Cityville, USA',
      place_id: 'abc123',
      geometry: {
        location: {
          lat: 40.7128,
          lng: -74.006,
        },
      },
      address_components: [],
    } as unknown as google.maps.places.PlaceResult;
    const mockGoogleMaps = {
      places: {
        Autocomplete: jest.fn().mockReturnValue({
          addListener: jest.fn().mockImplementation((event: string, callback: () => void) => {
            if (event === 'place_changed') {
              callback();
            }
          }),
          getPlace: jest.fn().mockReturnValue(mockPlace),
        }),
      },
    };
    const inputElement = { nativeElement: { value: '' } };
    component.inputElement = inputElement;
    const snackbarService = ngMocks.findInstance(NuverialSnackBarService);
    const googleMapsService = ngMocks.findInstance(GoogleMapsService);
    jest.spyOn(snackbarService, 'notifyApplicationError');
    jest.spyOn(googleMapsService.isLoaded$, 'subscribe');
    jest.spyOn(component.gotGoogleAddress, 'emit');
    jest.spyOn(google.maps.places, 'Autocomplete');
    initialize();

    // Act
    component.ngAfterViewInit();
    _isLoaded.next(true);

    // Assert
    expect(googleMapsService.isLoaded$.subscribe).toHaveBeenCalled();
    expect(googleMapsService.isLoaded$.subscribe).toHaveBeenCalledTimes(1);
    expect(mockGoogleMaps.places.Autocomplete).toHaveBeenCalled();
    expect(mockGoogleMaps.places.Autocomplete).toHaveBeenCalledTimes(1);
    expect(mockGoogleMaps.places.Autocomplete).toHaveBeenCalledWith(inputElement.nativeElement, component.autocompleteOptions);
    expect(mockGoogleMaps.places.Autocomplete().addListener).toHaveBeenCalled();
    expect(mockGoogleMaps.places.Autocomplete().addListener).toHaveBeenCalledTimes(1);
    expect(mockGoogleMaps.places.Autocomplete().addListener).toHaveBeenCalledWith('place_changed', expect.any(Function));
    expect(mockGoogleMaps.places.Autocomplete().getPlace).toHaveBeenCalled();
    expect(mockGoogleMaps.places.Autocomplete().getPlace).toHaveBeenCalledTimes(1);
    expect(component.gotGoogleAddress.emit).toHaveBeenCalled();
    expect(component.gotGoogleAddress.emit).toHaveBeenCalledTimes(1);
    // expect(component.gotGoogleAddress.emit).toHaveBeenCalledWith(expect.any(GooglePlace));
    expect(inputElement.nativeElement.value).toBe(mockPlace.formatted_address);
  });

  it('should handle error when Google Maps fails to load', async () => {
    // Arrange
    initialize();
    const snackbarService = ngMocks.findInstance(NuverialSnackBarService);
    const googleMapsService = ngMocks.findInstance(GoogleMapsService);
    jest.spyOn(snackbarService, 'notifyApplicationError');
    jest.spyOn(googleMapsService.isLoaded$, 'subscribe');

    // Act
    _isLoaded.error('Script loading failed');
    component.ngAfterViewInit();

    // Assert
    expect(googleMapsService.isLoaded$.subscribe).toHaveBeenCalled();
    expect(googleMapsService.isLoaded$.subscribe).toHaveBeenCalledTimes(1);
    expect(snackbarService.notifyApplicationError).toHaveBeenCalled();
    expect(snackbarService.notifyApplicationError).toHaveBeenCalledTimes(1);
    expect(snackbarService.notifyApplicationError).toHaveBeenCalledWith('Unable to load Google Maps');
  });

  it('should set inputElement property', () => {
    const inputElement = { nativeElement: {} };
    component.getInputElement(inputElement);
    expect(component.inputElement).toBe(inputElement);
  });

  describe('getCoordinates', () => {
    it('should return coordinates as an array', () => {
      // Arrange
      const mockLocation = {
        lat: '40.7128',
        lng: '-74.0060',
      } as unknown as google.maps.LatLng;

      // Act
      const result = component.getCoordinates(mockLocation);

      // Assert
      expect(result).toEqual(['40.7128', '-74.0060']);
    });
  });

  describe('getGoogleAddress', () => {
    it('should return GoogleAddress object with valid input', () => {
      // Arrange
      const mockPlaceResult = {
        formatted_address: '123 Main St, Cityville, USA',
        place_id: 'abc123',
        geometry: {
          location: {
            lat: 40.7128,
            lng: -74.006,
          },
        },
        address_components: [
          {
            short_name: '123',
            types: ['street_number'],
          },
          {
            short_name: 'Main St',
            types: ['route'],
          },
          {
            short_name: 'Suite 1',
            types: ['subpremise'],
          },
          {
            short_name: 'neighborhood',
            types: ['neighborhood'],
          },
          {
            short_name: 'Troy',
            types: ['locality'],
          },
          {
            short_name: 'Rensselaer County',
            types: ['administrative_area_level_2'],
          },
          {
            short_name: 'NY',
            types: ['administrative_area_level_1'],
          },
          {
            short_name: '55555',
            types: ['postal_code'],
          },
          {
            short_name: '123',
            types: ['postal_code_suffix'],
          },
          {
            short_name: 'USA',
            types: ['country'],
          },
        ],
      } as unknown as google.maps.places.PlaceResult;

      // Act
      const result = component.getGoogleAddress(mockPlaceResult);

      // Assert
      expect(result).toEqual({
        ['0']: 40.7128,
        ['1']: -74.006,
        country: 'USA',
        suite: 'Suite 1',
        neighborhood: 'neighborhood',
        city: 'Troy',
        county: 'Rensselaer County',
        zip: '55555',
        zipSecondary: '123',
        formattedAddress: '123 Main St, Cityville, USA',
        gbpPlacesId: 'abc123',
        state: 'NY',
        streetNumber: '123',
        streetName: 'Main St',
      });
    });

    it('should set the city when both locality and sublocality are provided', () => {
      // Arrange
      const mockPlaceResult = {
        formatted_address: '123 Main St, Cityville, USA',
        place_id: 'abc123',
        geometry: {
          location: {
            lat: 40.7128,
            lng: -74.006,
          },
        },
        address_components: [
          {
            short_name: 'Troy',
            types: ['locality'],
          },
          {
            short_name: 'Brooklyn',
            types: ['sublocality'],
          },
        ],
      } as unknown as google.maps.places.PlaceResult;

      // Act
      const result = component.getGoogleAddress(mockPlaceResult);

      // Assert
      expect(result).toEqual({
        ['0']: 40.7128,
        ['1']: -74.006,
        city: 'Troy',
        formattedAddress: '123 Main St, Cityville, USA',
        gbpPlacesId: 'abc123',
      });
    });

    it('should set the city when only sublocality is provided', () => {
      // Arrange
      const mockPlaceResult = {
        formatted_address: '123 Main St, Cityville, USA',
        place_id: 'abc123',
        geometry: {
          location: {
            lat: 40.7128,
            lng: -74.006,
          },
        },
        address_components: [
          {
            short_name: 'Brooklyn',
            types: ['sublocality'],
          },
        ],
      } as unknown as google.maps.places.PlaceResult;

      // Act
      const result = component.getGoogleAddress(mockPlaceResult);

      // Assert
      expect(result).toEqual({
        ['0']: 40.7128,
        ['1']: -74.006,
        city: 'Brooklyn',
        formattedAddress: '123 Main St, Cityville, USA',
        gbpPlacesId: 'abc123',
      });
    });
  });
});
