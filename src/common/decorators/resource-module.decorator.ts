import { SetMetadata } from '@nestjs/common';

export const RESOURCE_MODULE_KEY = 'resourceModule';
export const ResourceModuleName = (moduleName: string) => SetMetadata(RESOURCE_MODULE_KEY, moduleName);
