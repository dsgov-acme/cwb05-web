import { IPaginationResponse, SchemaModel } from '@dsg/shared/utils/http';

export interface IEmployerProfilePaginationResponse<T> extends IPaginationResponse {
  items: T[];
}

export interface IUserEmployerProfile {
  displayName: string;
  id: string;
  legalName?: string;
  level: string;
  type: string;
}
export class UserEmployerProfileModel implements SchemaModel<IUserEmployerProfile, Partial<IUserEmployerProfile>> {
  public id = '';
  public legalName = '';
  public level = '';
  public type = '';

  private _displayName = '';

  constructor(userEmployerProfileSchema?: IUserEmployerProfile) {
    if (userEmployerProfileSchema) {
      this.fromSchema(userEmployerProfileSchema);
    }
  }

  public get displayName(): string {
    return this._displayName || this.legalName;
  }

  public fromSchema(userEmployerProfileSchema: IUserEmployerProfile) {
    this.type = userEmployerProfileSchema.type;
    this.level = userEmployerProfileSchema.level;
    this.id = userEmployerProfileSchema.id;
    this._displayName = userEmployerProfileSchema.displayName;
    this.legalName = userEmployerProfileSchema.legalName ?? '';
  }

  public toSchema(): Partial<IUserEmployerProfile> {
    return {
      displayName: this.displayName,
      id: this.id,
      level: this.level,
      type: this.type,
    };
  }
}
