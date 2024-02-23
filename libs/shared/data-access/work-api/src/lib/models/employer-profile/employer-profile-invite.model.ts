import { SchemaModel } from '@dsg/shared/utils/http';

export interface IEmployerProfileInvite {
  id: string;
  profileId: string;
  profileType: string;
  accessLevel: string;
  email: string;
  claimed: boolean;
  expires: string;
  createdTimestamp?: string;
}

export enum InvitationExpirationStatus {
  Expired = 'expired',
  Imminent = 'imminent',
  Valid = 'valid',
}

export class EmployerProfileInvite implements SchemaModel<IEmployerProfileInvite> {
  public id = '';
  public profileId = '';
  public profileType = '';
  public accessLevel = '';
  public email = '';
  public claimed = false;
  public expires = '';
  public createdTimestamp?: string;

  constructor(linkSchema?: IEmployerProfileInvite) {
    if (linkSchema) {
      this.fromSchema(linkSchema);
    }
  }

  /**
   * Determines if the employer profile invite is expired.
   * @returns {boolean} True if the invite is expired, false otherwise.
   */
  public get isExpired(): boolean {
    return !this.claimed && this._expirationDate.getTime() < this._currentDate.getTime();
  }

  /**
   * Checks if the expiration of the employer profile invite is imminent.
   * @returns {boolean} True if the expiration is imminent, false otherwise.
   */
  public get isExpirationImminent(): boolean {
    const expirationImminentTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    return !this.claimed && this._expirationDate.getTime() > this._currentDate.getTime() && this._timeDifference < expirationImminentTime;
  }

  /**
   * Gets the expiration status of the employer profile invite.
   * @returns {InvitationExpirationStatus} The expiration status of the invite.
   */
  public get expirationStatus(): InvitationExpirationStatus {
    let expirationStatus: InvitationExpirationStatus = InvitationExpirationStatus.Valid;

    if (this.isExpired) {
      expirationStatus = InvitationExpirationStatus.Expired;
    }

    if (this.isExpirationImminent) {
      expirationStatus = InvitationExpirationStatus.Imminent;
    }

    return expirationStatus;
  }

  private get _currentDate(): Date {
    return new Date();
  }

  private get _expirationDate(): Date {
    return new Date(this.expires);
  }

  private get _timeDifference(): number {
    return Math.max(0, this._expirationDate.getTime() - this._currentDate.getTime());
  }

  public fromSchema(linkSchema: IEmployerProfileInvite): void {
    this.id = linkSchema.id;
    this.profileId = linkSchema.profileId;
    this.profileType = linkSchema.profileType;
    this.accessLevel = linkSchema.accessLevel;
    this.email = linkSchema.email;
    this.claimed = linkSchema.claimed;
    this.expires = linkSchema.expires;
    this.createdTimestamp = linkSchema.createdTimestamp;
  }
}
