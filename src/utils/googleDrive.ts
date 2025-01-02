import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import { GaxiosError } from 'gaxios';

export class GoogleDriveService {
  private static FOLDER_NAME = 'Sharpr.me Data';
  private static MIME_TYPE = 'application/json';
  private static SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata'
  ];

  private constructor(private auth: any) {}

  static async initialize(accessToken: string) {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ 
        access_token: accessToken,
        scope: GoogleDriveService.SCOPES.join(' ')
      });
      return new GoogleDriveService(auth);
    } catch (error) {
      console.error('Error initializing GoogleDriveService:', error);
      throw error;
    }
  }

  private async findOrCreateFolder() {
    const drive = google.drive({ version: 'v3', auth: this.auth });
    
    try {
      // console.log('Searching for folder:', GoogleDriveService.FOLDER_NAME);
      // Search for existing folder
      const response = await drive.files.list({
        q: `name='${GoogleDriveService.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name)',
      });

      if (response.data.files && response.data.files.length > 0) {
        // console.log('Found existing folder');
        return response.data.files[0].id!;
      }

      console.log('Creating new folder');
      // Create new folder if it doesn't exist
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
    const drive = google.drive({ version: 'v3', auth: this.auth });
    const folderId = await this.findOrCreateFolder();
    
    try {
      // Convert glob pattern to regex-like query
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
    // console.log(`Saving file: ${filename}`);
    const drive = google.drive({ version: 'v3', auth: this.auth });
    const folderId = await this.findOrCreateFolder();

    try {
      // Check if file already exists
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
        // Update existing file
        // console.log(`Updating existing file: ${filename}`);
        const fileId = existingFile.data.files[0].id!;
        
        // For updates, we only include the name in the metadata
        const updateMetadata: drive_v3.Schema$File = {
          name: filename
        };

        const file = await drive.files.update({
          fileId,
          requestBody: updateMetadata,
          media,
          fields: 'id',
        });
        
        // console.log(`File updated successfully: ${filename}`);
        return file.data.id!;
      } else {
        // Create new file
        // console.log(`Creating new file: ${filename}`);
        const createMetadata: drive_v3.Schema$File = {
          name: filename,
          parents: [folderId], // Only include parents when creating
        };

        const file = await drive.files.create({
          requestBody: createMetadata,
          media,
          fields: 'id',
        });
        // console.log(`File created successfully: ${filename}`);
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
    // console.log(`Getting file: ${filename}`);
    const drive = google.drive({ version: 'v3', auth: this.auth });
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

      // console.log(`File retrieved successfully: ${filename}`);
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
    const drive = google.drive({ version: 'v3', auth: this.auth });
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