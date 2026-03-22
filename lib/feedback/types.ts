export type FeedbackRequest = {
  message: string;
  email?: string;
  gameId?: string;
};

export type FeedbackResult = {
  issueNumber: number;
  issueUrl: string;
};

export type FeedbackServiceConfig = {
  githubToken: string;
  githubRepo: string;
  githubLabel: string;
};

export type FeedbackService = {
  submitFeedback(request: FeedbackRequest): Promise<FeedbackResult>;
};
