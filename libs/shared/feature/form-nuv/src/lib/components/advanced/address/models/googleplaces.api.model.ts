export enum AddressField {
  city = 'locality',
  country = 'country',
  county = 'administrative_area_level_2',
  neighborhood = 'neighborhood',
  state = 'administrative_area_level_1',
  streetName = 'route',
  streetNumber = 'street_number',
  subLocal = 'sublocality', // city fallback
  suite = 'subpremise',
  zipcode = 'postal_code',
  zipcodeSecondary = 'postal_code_suffix',
}

export enum AddressFieldToKeys {
  locality = 'city',
  country = 'country',
  administrative_area_level_2 = 'county',
  neighborhood = 'neighborhood',
  administrative_area_level_1 = 'state',
  route = 'streetName',
  street_number = 'streetNumber',
  subpremise = 'suite',
  sublocality = 'city',
  postal_code = 'zip',
  postal_code_suffix = 'zipSecondary',
}

export const GoogleAddressAttributes = new Set<string>([
  'administrative_area_level_1',
  'administrative_area_level_2',
  'country',
  'locality',
  'neighborhood',
  'postal_code',
  'postal_code_suffix',
  'route',
  'street_number',
  'sublocality',
  'subpremise',
]);

export interface GoogleAddress {
  city?: string;
  country?: string;
  county?: string;
  formattedAddress?: string;
  gbpPlacesId?: string;
  latitude?: string;
  longitude?: string;
  neighborhood?: string;
  state?: string;
  stateLong?: string;
  streetName?: string;
  streetNumber?: string;
  suite?: string;
  zip?: string;
  zipSecondary?: string;
}

export class GooglePlace {
  private _formattedAddress: string;
  private _streetNumber: string;
  private _streetName: string;
  private _suite: string;
  private _neighborhood: string;
  private _city: string;
  private _county: string;
  private _state: string;
  private _stateLong: string;
  private _zip: string;
  private _zipSecondary: string;
  private _country: string;
  private _latitude: string;
  private _longitude: string;
  private _gbpPlacesId: string;

  private _cityId: number;
  private _countyId: number;
  private _stateId: number;

  constructor(address: GoogleAddress) {
    this._formattedAddress = address.formattedAddress || '';
    this._streetNumber = address.streetNumber || '';
    this._streetName = address.streetName || '';
    this._suite = address.suite || '';
    this._neighborhood = address.neighborhood || '';
    this._city = address.city || '';
    this._county = address.county || '';
    this._state = address.state || '';
    this._stateLong = address.stateLong || '';
    this._zip = address.zip || '';
    this._zipSecondary = address.zipSecondary || '';
    this._country = address.country || '';
    this._latitude = address.latitude || '';
    this._longitude = address.longitude || '';
    this._gbpPlacesId = address.gbpPlacesId || '';
    this._cityId = 0;
    this._countyId = 0;
    this._stateId = 0;
  }

  public get formattedAddress(): string {
    if (this._formattedAddress) return this._formattedAddress;
    let address = '';

    if (this._streetNumber && this._streetName) address += `${this._streetNumber} ${this._streetName}`;
    if (this._suite) address += ` ${this._suite}`;
    if (this._city) address += `, ${this._city}`;
    if (this._state) address += `, ${this._state}`;
    if (this._zip) address += ` ${this._zip}`;
    if (this._country) address += `, ${this._country}`;

    return address;
  }
  public set formattedAddress(value: string) {
    this._formattedAddress = value;
  }

  public get streetNumber(): string {
    return this._streetNumber;
  }
  public set streetNumber(value: string) {
    this._streetNumber = value;
  }

  public get streetName(): string {
    return this._streetName;
  }
  public set streetName(value: string) {
    this._streetName = value;
  }

  public get suite(): string {
    return this._suite;
  }
  public set suite(value: string) {
    this._suite = value;
  }

  public get neighborhood(): string {
    return this._neighborhood;
  }
  public set neighborhood(value: string) {
    this._neighborhood = value;
  }

  public get city(): string {
    return this._city;
  }
  public set city(value: string) {
    this._city = value;
  }

  public get county(): string {
    return this._county;
  }
  public set county(value: string) {
    this._county = value;
  }

  public get state(): string {
    return this._state;
  }
  public set state(value: string) {
    this._state = value;
  }

  public get stateLong(): string {
    return this._stateLong;
  }
  public set stateLong(value: string) {
    this._stateLong = value;
  }

  public get zip(): string {
    return this._zip;
  }
  public set zip(value: string) {
    this._zip = value;
  }

  public get zipSecondary(): string {
    return this._zipSecondary;
  }
  public set zipSecondary(value: string) {
    this._zipSecondary = value;
  }

  public get country(): string {
    return this._country;
  }
  public set country(value: string) {
    this._country = value;
  }

  public get latitude(): string {
    return this._latitude;
  }
  public set latitude(value: string) {
    this._latitude = value;
  }

  public get longitude(): string {
    return this._longitude;
  }
  public set longitude(value: string) {
    this._longitude = value;
  }

  public get gbpPlacesId(): string {
    return this._gbpPlacesId;
  }
  public set gbpPlacesId(value: string) {
    this._gbpPlacesId = value;
  }

  public get cityId(): number {
    return this._cityId;
  }
  public set cityId(value: number) {
    this._cityId = value;
  }

  public get countyId(): number {
    return this._countyId;
  }
  public set countyId(value: number) {
    this._countyId = value;
  }

  public get stateId(): number {
    return this._stateId;
  }
  public set stateId(value: number) {
    this._stateId = value;
  }

  public get addressLine1(): string {
    if (this._streetNumber && this._streetName) return `${this._streetNumber} ${this._streetName}`;

    return '';
  }

  public get addressLine2(): string {
    if (this._suite) return this._suite;

    return '';
  }

  public get postalCode(): string {
    if (this._zip) return this._zip;

    return '';
  }

  public get stateCode(): string {
    if (this._state) return this._state;

    return '';
  }

  public get countryCode(): string {
    if (this._country) return this._country;

    return '';
  }

  public get postalCodeExtension(): string {
    if (this._zipSecondary) return this._zipSecondary;

    return '';
  }
}
