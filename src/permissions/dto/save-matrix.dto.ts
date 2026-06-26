import { IsObject } from 'class-validator';

export class RoleMatrixData {
  permissions: string[];
  version: number;
}

export class SaveMatrixDto {
  @IsObject()
  matrix: Record<string, RoleMatrixData>;
}
