import { ImportedData, LibrarySpace, Subject, Category } from '@/types';
import { GoogleDriveService } from './googleDrive';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

// Extend the Session type to include accessToken
declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accessToken?: string;
    };
  }
}

export interface SpaceData {
  id: string;
  title: string;
  subjects: Subject[];
  categories: Category[];
  isLocked?: boolean;
}

export interface LibraryItem {
  isPinned?: boolean;
}

export interface StorageProvider {
  // Space data operations
  getSpace: (id: string) => Promise<SpaceData | null>;
  saveSpace: (id: string, data: Partial<SpaceData>) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  listSpaces: () => Promise<string[]>;
  
  // Library operations
  updateLibraryItem: (userId: string, spaceId: string, data: LibraryItem) => Promise<void>;
  
  // Snapshot operations
  createSnapshot: (spaceId: string, data: ImportedData) => Promise<string>;
  listSnapshots: (spaceId: string) => Promise<string[]>;
  deleteAllSnapshots: (spaceId: string) => Promise<void>;
  getSnapshotData: (fileId: string) => Promise<any>;
}

export class DriveStorageProvider implements StorageProvider {
  constructor(private driveService: GoogleDriveService) {}

  private async saveFile(filename: string, data: any): Promise<string> {
    try {
      return await this.driveService.saveData(filename, data);
    } catch (error) {
      console.error(`Error in saveFile for ${filename}:`, error);
      throw error;
    }
  }

  private async getFile(filename: string): Promise<any> {
    try {
      return await this.driveService.getData(filename);
    } catch (error) {
      console.error(`Error in getFile for ${filename}:`, error);
      throw error;
    }
  }

  async getSnapshotData(fileId: string): Promise<any> {
    // Remove the gdrive:// prefix if it exists
    const cleanFileId = fileId.replace('gdrive://', '');
    // If the filename already contains 'snapshot_', use it as is
    const filename = cleanFileId.startsWith('snapshot_') ? cleanFileId : `snapshot_${cleanFileId}.json`;
    return this.getFile(filename);
  }

  async getSpace(id: string): Promise<SpaceData | null> {
    try {
      // console.log(`Getting space: ${id}`);
      const data = await this.getFile(`space_${id}.json`);
      // console.log(`Space data retrieved:`, data);
      return data;
    } catch (error) {
      console.error(`Error getting space ${id}:`, error);
      return null;
    }
  }

  async saveSpace(id: string, data: Partial<SpaceData>): Promise<void> {
    try {
      // console.log(`Saving space: ${id}`);
      const existingData = await this.getSpace(id);
      // console.log(`Existing data:`, existingData);
      const newData = { ...existingData, ...data, id };
      // console.log(`New data to save:`, newData);
      await this.saveFile(`space_${id}.json`, newData);
      // console.log(`Space saved successfully: ${id}`);
    } catch (error) {
      console.error(`Error saving space ${id}:`, error);
      throw error;
    }
  }

  async deleteSpace(id: string): Promise<void> {
    await this.driveService.deleteData(`space_${id}.json`);
  }

  async listSpaces(): Promise<string[]> {
    const files = await this.driveService.listFiles('space_*.json');
    return files.map(f => f.replace('space_', '').replace('.json', ''));
  }

  async createSnapshot(spaceId: string, data: ImportedData): Promise<string> {
    try {
      // Get existing snapshots
      const snapshots = await this.listSnapshots(spaceId);
      
      // Sort snapshots by timestamp (newest first)
      const sortedSnapshots = snapshots.sort((a, b) => {
        const timestampA = parseInt(a.split('_').pop()?.replace('.json', '') || '0');
        const timestampB = parseInt(b.split('_').pop()?.replace('.json', '') || '0');
        return timestampB - timestampA;
      });

      // If we already have 5 snapshots, delete the oldest one before creating a new one
      if (sortedSnapshots.length >= 5) {
        const oldestSnapshot = sortedSnapshots[sortedSnapshots.length - 1];
        const filename = oldestSnapshot.replace('gdrive://', '');
        await this.driveService.deleteData(filename);
      }

      // Create new snapshot
      const filename = `snapshot_${spaceId}_${Date.now()}.json`;
      const fileId = await this.driveService.saveData(filename, data);
      return `gdrive://${fileId}`;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw error;
    }
  }

  async listSnapshots(spaceId: string): Promise<string[]> {
    const files = await this.driveService.listFiles(`snapshot_${spaceId}_*.json`);
    return files.map(f => `gdrive://${f}`);
  }

  async deleteAllSnapshots(spaceId: string): Promise<void> {
    const files = await this.driveService.listFiles(`snapshot_${spaceId}_*.json`);
    await Promise.all(files.map(f => this.driveService.deleteData(f)));
  }

  async updateLibraryItem(userId: string, spaceId: string, data: LibraryItem): Promise<void> {
    try {
      const libraryFile = `library_${userId}.json`;
      let library: Record<string, LibraryItem> = {};
      
      try {
        library = await this.getFile(libraryFile);
      } catch (error) {
        // If file doesn't exist, start with empty library
        library = {};
      }

      library[spaceId] = { ...library[spaceId], ...data };
      await this.saveFile(libraryFile, library);
    } catch (error) {
      console.error(`Error updating library item for user ${userId}, space ${spaceId}:`, error);
      throw error;
    }
  }
}

export async function getStorageProvider(): Promise<StorageProvider> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !session.user.accessToken) {
    throw new Error('Authentication required');
  }
  
  const driveService = await GoogleDriveService.initialize(session.user.accessToken);
  return new DriveStorageProvider(driveService);
} 