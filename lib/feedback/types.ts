export type FeedbackRequest = {
  message: string;
  email?: string;
  gameId?: string;
};

export type FeedbackResult = {
  cardId: string;
  cardUrl: string;
};

export type FeedbackServiceConfig = {
  trelloApiKey: string;
  trelloApiToken: string;
  trelloListId: string;
};

export type FeedbackService = {
  submitFeedback(request: FeedbackRequest): Promise<FeedbackResult>;
};
