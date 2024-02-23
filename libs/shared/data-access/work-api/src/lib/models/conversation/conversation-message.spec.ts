import { ConversationMessageModel } from './conversation-message.model';
import { ConversationMessageMock } from './conversation.mock';

describe('ConversationMessageModel', () => {
  let conversationMessageModel: ConversationMessageModel;

  beforeEach(() => {
    conversationMessageModel = new ConversationMessageModel(ConversationMessageMock);
  });

  describe('fromSchema', () => {
    it('should model porperties from schema', () => {
      expect(conversationMessageModel.id).toEqual(ConversationMessageMock.id);
      expect(conversationMessageModel.senderDisplayName).toEqual(ConversationMessageMock.sender.displayName);
      expect(conversationMessageModel.timestamp).toEqual(ConversationMessageMock.timestamp);
      expect(conversationMessageModel.body).toEqual(ConversationMessageMock.body);
      expect(conversationMessageModel.attachments).toEqual(ConversationMessageMock.attachments);
    });
  });

  describe('toSchema', () => {
    it('should return the model as a schema', () => {
      expect(conversationMessageModel.toSchema()).toEqual({
        attachments: ConversationMessageMock.attachments,
        body: ConversationMessageMock.body,
      });
    });
  });

  describe('noFormatBody', () => {
    it('should strip the body of any HTML tags', () => {
      expect(conversationMessageModel.noFormatBody).toEqual('test');
    });
  });
});
