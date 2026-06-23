import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL') ?? '';
    const key = this.configService.get<string>('SUPABASE_SERVICE_KEY') ?? '';

    this.supabase = createClient(url, key);
  }

  /**
   * Upload a file to a Supabase Storage bucket.
   * @param file - Multer file object (buffer, mimetype)
   * @returns Public URL of the uploaded file.
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: { buffer: Buffer; mimetype: string },
  ): Promise<string> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Failed to upload file to ${bucket}/${path}`, error);
      throw new InternalServerErrorException('File upload failed');
    }

    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Delete a file from a Supabase Storage bucket.
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);

    if (error) {
      this.logger.error(`Failed to delete file ${bucket}/${path}`, error);
      throw new InternalServerErrorException('File deletion failed');
    }
  }
}
