const isDevelopment = process.env.NODE_ENV !== 'production';

export function getCollectionName(baseName: string): string {
  const prefix = isDevelopment ? 'dev_' : 'prod_';
  return `${prefix}${baseName}`;
} 