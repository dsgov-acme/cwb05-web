import { EmployerProfileInvite, InvitationExpirationStatus } from './employer-profile-invite.model';
import { EmployerProfileInviteMock } from './employer-profile.mock';

describe('EmployerProfileInviteModel', () => {
  let inviteModel: EmployerProfileInvite;

  beforeEach(() => {
    inviteModel = new EmployerProfileInvite(EmployerProfileInviteMock);
  });

  describe('fromSchema', () => {
    it('should model porperties from schema', () => {
      expect(inviteModel.id).toEqual(EmployerProfileInviteMock.id);
      expect(inviteModel.profileId).toEqual(EmployerProfileInviteMock.profileId);
      expect(inviteModel.profileType).toEqual(EmployerProfileInviteMock.profileType);
      expect(inviteModel.accessLevel).toEqual(EmployerProfileInviteMock.accessLevel);
      expect(inviteModel.email).toEqual(EmployerProfileInviteMock.email);
      expect(inviteModel.claimed).toEqual(EmployerProfileInviteMock.claimed);
      expect(inviteModel.expires).toEqual(EmployerProfileInviteMock.expires);
      expect(inviteModel.createdTimestamp).toEqual(EmployerProfileInviteMock.createdTimestamp);
    });
  });

  describe('isExpired', () => {
    it('should return true if the invite is not claimed and the expiration date is in the past', () => {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() - 1);
      inviteModel.claimed = false;
      inviteModel.expires = expirationDate.toISOString();
      expect(inviteModel.isExpired).toBe(true);
    });

    it('should return false if the invite is not claimed and the expiration date is in the future', () => {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 1);
      inviteModel.claimed = false;
      inviteModel.expires = expirationDate.toISOString();
      expect(inviteModel.isExpired).toBe(false);
    });

    it('should return false if the invite is claimed', () => {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() - 1);
      inviteModel.claimed = true;
      inviteModel.expires = expirationDate.toISOString();
      expect(inviteModel.isExpired).toBe(false);
    });
  });

  describe('isExpirationImminent', () => {
    it('should return true if the invite is not claimed, the expiration date is in the future, and the time difference is less than 24 hours', () => {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 1);
      inviteModel.claimed = false;
      inviteModel.expires = expirationDate.toISOString();
      expect(inviteModel.isExpirationImminent).toBe(true);
    });

    it('should return false if the invite is not claimed, the expiration date is in the future, but the time difference is greater than 24 hours', () => {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 25);
      inviteModel.claimed = false;
      inviteModel.expires = expirationDate.toISOString();
      expect(inviteModel.isExpirationImminent).toBe(false);
    });

    it('should return false if the invite is claimed', () => {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 1);
      inviteModel.claimed = true;
      inviteModel.expires = expirationDate.toISOString();
      expect(inviteModel.isExpirationImminent).toBe(false);
    });

    it('should return false if the invite is not claimed, the expiration date is in the past', () => {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() - 1);
      inviteModel.claimed = false;
      inviteModel.expires = expirationDate.toISOString();
      expect(inviteModel.isExpirationImminent).toBe(false);
    });
  });

  describe('expirationStatus', () => {
    it('should return InvitationExpirationStatus.Valid if the invite is not expired and not imminent', () => {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 25);
      inviteModel.claimed = false;
      inviteModel.expires = expirationDate.toISOString();
      expect(inviteModel.expirationStatus).toBe(InvitationExpirationStatus.Valid);
    });

    it('should return InvitationExpirationStatus.Expired if the invite is expired', () => {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() - 1);
      inviteModel.claimed = false;
      inviteModel.expires = expirationDate.toISOString();
      expect(inviteModel.expirationStatus).toBe(InvitationExpirationStatus.Expired);
    });

    it('should return InvitationExpirationStatus.Imminent if the invite is not expired but imminent', () => {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 1);
      inviteModel.claimed = false;
      inviteModel.expires = expirationDate.toISOString();
      expect(inviteModel.expirationStatus).toBe(InvitationExpirationStatus.Imminent);
    });

    it('should return InvitationExpirationStatus.Imminent if the invite is not expired but imminent 2', () => {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 23);
      inviteModel.claimed = false;
      inviteModel.expires = expirationDate.toISOString();
      expect(inviteModel.expirationStatus).toBe(InvitationExpirationStatus.Imminent);
    });
  });
});
