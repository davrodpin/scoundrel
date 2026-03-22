export type AxiomSinkConfig = {
  apiToken: string;
  dataset: string;
};

export type AxiomEvent = {
  _time: string;
  level: string;
  category: string;
  message: string;
  [key: string]: unknown;
};
