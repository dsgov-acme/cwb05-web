import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { IFormConfigurationSchema } from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService, NuverialTextInputComponent } from '@dsg/shared/ui/nuverial';
import { catchError, EMPTY, take, tap } from 'rxjs';
import { AddressFieldToKeys, GoogleAddress, GoogleAddressAttributes, GooglePlace } from '../models/googleplaces.api.model';
import { AddressField } from './../models/googleplaces.api.model';
import { GoogleMapsService } from './google-maps.service';

declare global {
  interface Window {
    initMap: () => void;
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, NuverialTextInputComponent],
  selector: 'dsg-google-maps-autocomplete',
  standalone: true,
  styleUrls: ['./google-maps-autocomplete.component.scss'],
  templateUrl: './google-maps-autocomplete.component.html',
})
export class GoogleMapsAutocompleteComponent implements AfterViewInit {
  @Output() public readonly gotGoogleAddress = new EventEmitter<GooglePlace>();
  @Output() public readonly gotGoogleAddressTemplate = new EventEmitter<GooglePlace>();
  @Input() public component?: IFormConfigurationSchema;
  @Input() public label: string | undefined;
  @Input() public required: boolean | undefined;
  @Input() public formControl!: FormControl;

  public inputElement: ElementRef | undefined;

  public mapsAutocomplete: google.maps.places.Autocomplete | undefined;
  public autocompleteOptions = {
    componentRestrictions: { country: 'us' },
    strictBounds: true,
    types: ['address'],
  };

  constructor(private readonly _snackbarService: NuverialSnackBarService, private readonly _googleMapsService: GoogleMapsService) {}

  public ngAfterViewInit(): void {
    this._googleMapsService.isLoaded$
      .pipe(
        tap(isLoaded => {
          if (!isLoaded) return;

          this.mapsAutocomplete = new google.maps.places.Autocomplete(this.inputElement?.nativeElement, this.autocompleteOptions);
          this.mapsAutocomplete.addListener('place_changed', () => {
            const place = this.mapsAutocomplete?.getPlace();
            if (place) {
              const googleAddress: GoogleAddress = this.getGoogleAddress(place);
              const googlePlace: GooglePlace = new GooglePlace(googleAddress);
              this.gotGoogleAddress.emit(googlePlace);
              if (this.inputElement) this.inputElement.nativeElement.value = googlePlace.addressLine1;
            }
          });
        }),
        catchError(() => {
          this._snackbarService.notifyApplicationError('Unable to load Google Maps');

          return EMPTY;
        }),
        take(1),
      )
      .subscribe();
  }

  public getInputElement(inputElement: ElementRef) {
    this.inputElement = inputElement;
  }

  public getCoordinates(location: google.maps.LatLng): [string, string] {
    const coordinates = JSON.parse(JSON.stringify(location));
    const lat = coordinates.lat;
    const long = coordinates.lng;

    return [lat, long];
  }

  public getGoogleAddress(place: google.maps.places.PlaceResult): GoogleAddress {
    const googleAddress: GoogleAddress = {
      formattedAddress: place.formatted_address,
      gbpPlacesId: place.place_id,
      ...(place.geometry?.location ? { ...this.getCoordinates(place.geometry.location) } : {}),
    };

    if (place.address_components) {
      place.address_components.forEach(component => {
        const type = component.types.find(_type => GoogleAddressAttributes.has(_type)) as AddressField;
        const addressKey: AddressFieldToKeys = AddressFieldToKeys[type];

        if (type && addressKey) {
          switch (type) {
            case AddressField.city:
            case AddressField.country:
            case AddressField.county:
            case AddressField.neighborhood:
            case AddressField.streetName:
            case AddressField.streetNumber:
            case AddressField.suite:
            case AddressField.zipcode:
            case AddressField.zipcodeSecondary:
              googleAddress[addressKey] = component.short_name;
              break;
            case AddressField.state:
              googleAddress[addressKey] = component.short_name;
              googleAddress.stateLong = component.long_name;
              break;
            case AddressField.subLocal:
              if (!googleAddress.city) {
                googleAddress.city = component.short_name;
              }
              break;
          }
        }
      });
    }

    return googleAddress;
  }
}
