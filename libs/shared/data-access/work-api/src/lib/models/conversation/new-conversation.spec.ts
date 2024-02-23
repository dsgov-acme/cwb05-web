import { NewConversationMock } from './conversation.mock';
import { NewConversationModel } from './new-conversation.model';

describe('NewConversationModel', () => {
  let newConversationModel: NewConversationModel;

  beforeEach(() => {
    newConversationModel = new NewConversationModel(NewConversationMock);
  });

  describe('fromSchema', () => {
    it('should model porperties from schema', () => {
      expect(newConversationModel.subject).toEqual(NewConversationMock.subject);
      expect(newConversationModel.messageBody).toEqual(NewConversationMock.message.body);
      expect(newConversationModel.messageAttachments).toEqual(NewConversationMock.message.attachments);
      expect(newConversationModel.referenceId).toEqual(NewConversationMock.entityReference.entityId);
      expect(newConversationModel.referenceType).toEqual(NewConversationMock.entityReference.type);
    });
  });

  describe('toSchema', () => {
    it('should return the conversation as a schema', () => {
      expect(newConversationModel.toSchema()).toEqual(NewConversationMock);
    });
  });
});
