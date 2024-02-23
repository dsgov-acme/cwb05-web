import { GoogleAddress, GooglePlace } from './googleplaces.api.model';

describe('GooglePlace', () => {
  let address: GoogleAddress;
  let googlePlace: GooglePlace;

  beforeEach(() => {
    address = {
      city: 'City',
      country: 'Country',
      county: '',
      formattedAddress: '123 Main St, City, State, 12345, Country',
      gbpPlacesId: '',
      latitude: '',
      longitude: '',
      neighborhood: '',
      state: 'State',
      stateLong: '',
      streetName: 'Main St',
      streetNumber: '123',
      suite: '',
      zip: '12345',
      zipSecondary: '',
    };
    googlePlace = new GooglePlace(address);
  });

  it('should create a GooglePlace instance', () => {
    expect(googlePlace).toBeTruthy();
  });

  it('should return the formatted address', () => {
    expect(googlePlace.formattedAddress).toBe('123 Main St, City, State, 12345, Country');
  });

  it('should set the formatted address', () => {
    googlePlace.formattedAddress = '456 Second St, City, State, 67890, Country';
    expect(googlePlace.formattedAddress).toBe('456 Second St, City, State, 67890, Country');
  });

  it('should return the formatted address 2', () => {
    const _googlePlace = new GooglePlace({});
    _googlePlace.streetNumber = '123';
    _googlePlace.streetName = 'Main St';
    _googlePlace.suite = 'Suite 1';
    _googlePlace.city = 'City';
    _googlePlace.state = 'State';
    _googlePlace.zip = '12345';
    _googlePlace.country = 'Country';

    expect(_googlePlace.formattedAddress).toBe('123 Main St Suite 1, City, State 12345, Country');
  });

  it('should return an empty string for formatted address if all address components are missing', () => {
    const _googlePlace = new GooglePlace({});

    expect(_googlePlace.formattedAddress).toBe('');
  });

  it('should return the street number', () => {
    expect(googlePlace.streetNumber).toBe('123');
  });

  it('should set the street number', () => {
    googlePlace.streetNumber = '456';
    expect(googlePlace.streetNumber).toBe('456');
  });

  it('should return the suite', () => {
    expect(googlePlace.suite).toBe('');
  });

  it('should set the suite', () => {
    googlePlace.suite = 'Suite 1';
    expect(googlePlace.suite).toBe('Suite 1');
  });

  it('should return the neighborhood', () => {
    expect(googlePlace.neighborhood).toBe('');
  });

  it('should set the neighborhood', () => {
    googlePlace.neighborhood = 'Neighborhood';
    expect(googlePlace.neighborhood).toBe('Neighborhood');
  });

  it('should return the city', () => {
    expect(googlePlace.city).toBe('City');
  });

  it('should set the city', () => {
    googlePlace.city = 'New City';
    expect(googlePlace.city).toBe('New City');
  });

  it('should return the county', () => {
    expect(googlePlace.county).toBe('');
  });

  it('should set the county', () => {
    googlePlace.county = 'County';
    expect(googlePlace.county).toBe('County');
  });

  it('should return the state', () => {
    expect(googlePlace.state).toBe('State');
  });

  it('should set the state', () => {
    googlePlace.state = 'New State';
    expect(googlePlace.state).toBe('New State');
  });

  it('should return the state long', () => {
    expect(googlePlace.stateLong).toBe('');
  });

  it('should set the state long', () => {
    googlePlace.stateLong = 'New State Long';
    expect(googlePlace.stateLong).toBe('New State Long');
  });

  it('should return the zip', () => {
    expect(googlePlace.zip).toBe('12345');
  });

  it('should set the zip', () => {
    googlePlace.zip = '54321';
    expect(googlePlace.zip).toBe('54321');
  });

  it('should return the zip secondary', () => {
    expect(googlePlace.zipSecondary).toBe('');
  });

  it('should set the zip secondary', () => {
    googlePlace.zipSecondary = '98765';
    expect(googlePlace.zipSecondary).toBe('98765');
  });

  it('should return the country', () => {
    expect(googlePlace.country).toBe('Country');
  });

  it('should set the country', () => {
    googlePlace.country = 'New Country';
    expect(googlePlace.country).toBe('New Country');
  });

  it('should return the latitude', () => {
    expect(googlePlace.latitude).toBe('');
  });

  it('should set the latitude', () => {
    googlePlace.latitude = '123.456';
    expect(googlePlace.latitude).toBe('123.456');
  });

  it('should return the longitude', () => {
    expect(googlePlace.longitude).toBe('');
  });

  it('should set the longitude', () => {
    googlePlace.longitude = '789.012';
    expect(googlePlace.longitude).toBe('789.012');
  });

  it('should return the gbp places id', () => {
    expect(googlePlace.gbpPlacesId).toBe('');
  });

  it('should set the gbp places id', () => {
    googlePlace.gbpPlacesId = '1234567890';
    expect(googlePlace.gbpPlacesId).toBe('1234567890');
  });

  it('should return the city id', () => {
    expect(googlePlace.cityId).toBe(0);
  });

  it('should set the city id', () => {
    googlePlace.cityId = 1;
    expect(googlePlace.cityId).toBe(1);
  });

  it('should return the county id', () => {
    expect(googlePlace.countyId).toBe(0);
  });

  it('should set the county id', () => {
    googlePlace.countyId = 2;
    expect(googlePlace.countyId).toBe(2);
  });

  it('should return the state id', () => {
    expect(googlePlace.stateId).toBe(0);
  });

  it('should set the state id', () => {
    googlePlace.stateId = 3;
    expect(googlePlace.stateId).toBe(3);
  });

  it('should return the address line 1', () => {
    expect(googlePlace.addressLine1).toBe('123 Main St');
  });

  it('should return an empty string for address line 1 if street number is missing', () => {
    googlePlace.streetNumber = '';
    expect(googlePlace.addressLine1).toBe('');
  });

  it('should return an empty string for address line 1 if street name is missing', () => {
    googlePlace.streetName = '';
    expect(googlePlace.addressLine1).toBe('');
  });

  it('should return the suite for address line 2', () => {
    expect(googlePlace.addressLine2).toBe('');
  });

  it('should set the suite for address line 2', () => {
    googlePlace.suite = 'Suite 2';
    expect(googlePlace.addressLine2).toBe('Suite 2');
  });

  it('should return the postal code', () => {
    expect(googlePlace.postalCode).toBe('12345');
  });

  it('should set the postal code', () => {
    googlePlace.zip = '54321';
    expect(googlePlace.postalCode).toBe('54321');
  });

  it('should return the state code', () => {
    expect(googlePlace.stateCode).toBe('State');
  });

  it('should set the state code', () => {
    googlePlace.state = 'New State';
    expect(googlePlace.stateCode).toBe('New State');
  });

  it('should return the country code', () => {
    expect(googlePlace.countryCode).toBe('Country');
  });

  it('should set the country code', () => {
    googlePlace.country = 'New Country';
    expect(googlePlace.countryCode).toBe('New Country');
  });

  it('should return the postal code extension', () => {
    expect(googlePlace.postalCodeExtension).toBe('');
  });

  it('should set the postal code extension', () => {
    googlePlace.zipSecondary = '98765';
    expect(googlePlace.postalCodeExtension).toBe('98765');
  });
});
