import Service from 'serverless/classes/Service';

export interface ServerlessFunctionDefinition {
  name: string;
  handler: string;
  custom?: Service.Custom;
}

export interface IFileNameAndPath {
  name: string;
  absPath: string;
}

export type CompiledAsset = {
  source: Buffer;
  permissions: number;
  name: string;
};
