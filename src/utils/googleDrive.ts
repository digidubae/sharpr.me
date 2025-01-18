import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import { GaxiosError } from 'gaxios';
import { EventEmitter } from 'events';

// Set max listeners to 20 to prevent warning
EventEmitter.defaultMaxListeners = 20;

export class GoogleDriveService {
  private static FOLDER_NAME = 'Sharpr.me Data';
  private static MIME_TYPE = 'application/json';
  private static SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
  ];

  private static instance: GoogleDriveService | null = null;
  private static driveInstance: drive_v3.Drive | null = null;
  private static connectionTimeout: NodeJS.Timeout | null = null;
  private static CLEANUP_TIMEOUT = 60000; // 60 seconds

  private constructor(private auth: any) {}

  static async initialize(accessToken: string) {
    try {
      // Reuse existing instance if the access token matches and the instance is still valid
      if (this.instance && 
          this.instance.auth.credentials.access_token === accessToken && 
          this.driveInstance) {
        // Reset the cleanup timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = setTimeout(() => this.cleanup(), this.CLEANUP_TIMEOUT);
        }
        return this.instance;
      }

      // Clean up existing instance if it exists
      await this.cleanup();

      const auth = new google.auth.OAuth2();
      auth.setCredentials({ 
        access_token: accessToken,
        scope: GoogleDriveService.SCOPES.join(' ')
      });

      this.instance = new GoogleDriveService(auth);
      this.driveInstance = google.drive({ version: 'v3', auth });

      // Set up cleanup timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
      }
      this.connectionTimeout = setTimeout(() => this.cleanup(), this.CLEANUP_TIMEOUT);

      return this.instance;
    } catch (error) {
      console.error('Error initializing GoogleDriveService:', error);
      throw error;
    }
  }

  private static async cleanup() {
    if (this.instance) {
      try {
        // Clear the timeout if it exists
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        // Clear the instances
        this.instance = null;
        this.driveInstance = null;
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
  }

  private getDrive(): drive_v3.Drive {
    if (!GoogleDriveService.driveInstance) {
      GoogleDriveService.driveInstance = google.drive({ version: 'v3', auth: this.auth });
    }
    return GoogleDriveService.driveInstance;
  }

  private async findOrCreateFolder() {
    const drive = this.getDrive();
    
    try {
      const response = await drive.files.list({
        q: `name='${GoogleDriveService.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name)',
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id!;
      }

      console.log('Creating new folder');
      const folderMetadata: drive_v3.Schema$File = {
        name: GoogleDriveService.FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });

      console.log('New folder created');
      return folder.data.id!;
    } catch (error: unknown) {
      console.error('Error in findOrCreateFolder:', error);
      if (error instanceof GaxiosError && error.response) {
        console.error('Response error:', error.response.data);
      }
      throw error;
    }
  }

  async listFiles(pattern: string): Promise<string[]> {
    const drive = this.getDrive();
    const folderId = await this.findOrCreateFolder();
    
    try {
      const nameQuery = pattern
        .replace('*', '')
        .split('.')
        .filter(Boolean)
        .map(part => `name contains '${part}'`)
        .join(' and ');

      const response = await drive.files.list({
        q: `${nameQuery} and '${folderId}' in parents and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name)',
      });

      return (response.data.files || []).map(file => file.name!);
    } catch (error: unknown) {
      console.error('Error listing files:', error);
      if (error instanceof GaxiosError && error.response) {
        console.error('Response error:', error.response.data);
      }
      throw error;
    }
  }

  async saveData(filename: string, data: any): Promise<string> {
    const drive = this.getDrive();
    const folderId = await this.findOrCreateFolder();

    try {
      const existingFile = await drive.files.list({
        q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
        spaces: 'drive',
        fields: 'files(id)',
      });

      const media = {
        mimeType: GoogleDriveService.MIME_TYPE,
        body: JSON.stringify(data),
      };

      if (existingFile.data.files && existingFile.data.files.length > 0) {
        const fileId = existingFile.data.files[0].id!;
        
        const updateMetadata: drive_v3.Schema$File = {
          name: filename
        };

        const file = await drive.files.update({
          fileId,
          requestBody: updateMetadata,
          media,
          fields: 'id',
        });
        
        return file.data.id!;
      } else {
        const createMetadata: drive_v3.Schema$File = {
          name: filename,
          parents: [folderId],
        };

        const file = await drive.files.create({
          requestBody: createMetadata,
          media,
          fields: 'id',
        });
        return file.data.id!;
      }
    } catch (error: unknown) {
      console.error(`Error saving file ${filename}:`, error);
      if (error instanceof GaxiosError && error.response) {
        console.error('Response error:', error.response.data);
      }
      throw error;
    }
  }

  async getData(filename: string): Promise<any> {
    const drive = this.getDrive();
    const folderId = await this.findOrCreateFolder();

    try {
      const response = await drive.files.list({
        q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
        spaces: 'drive',
        fields: 'files(id)',
      });

      if (!response.data.files || response.data.files.length === 0) {
        console.log(`File not found: ${filename}`);
        return null;
      }

      const file = await drive.files.get({
        fileId: response.data.files[0].id!,
        alt: 'media',
      });

      return file.data;
    } catch (error: unknown) {
      console.error(`Error getting file ${filename}:`, error);
      if (error instanceof GaxiosError && error.response) {
        console.error('Response error:', error.response.data);
      }
      throw error;
    }
  }

  async deleteData(filename: string): Promise<void> {
    const drive = this.getDrive();
    const folderId = await this.findOrCreateFolder();

    try {
      const response = await drive.files.list({
        q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
        spaces: 'drive',
        fields: 'files(id)',
      });

      if (response.data.files && response.data.files.length > 0) {
        await drive.files.delete({
          fileId: response.data.files[0].id!,
        });
      }
    } catch (error: unknown) {
      console.error(`Error deleting file ${filename}:`, error);
      if (error instanceof GaxiosError && error.response) {
        console.error('Response error:', error.response.data);
      }
      throw error;
    }
  }
} 