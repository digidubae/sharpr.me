import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { ImportedData, LibraryItem, SpaceData, StorageProvider } from '@/types';
import Cache, { FileSystemCache } from 'file-system-cache';
import { getServerSession } from 'next-auth';
import { GoogleDriveService } from './googleDrive';



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



export class DriveStorageProvider implements StorageProvider {
  private cache: FileSystemCache | undefined

  constructor(private driveService: GoogleDriveService) {
  }

  private async setupCache() { 
    console.log('setting up cache')
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error('User email not found');
      }
      
      this.cache = Cache({
        basePath: `./.cache/${session?.user?.email}`, 
        ns: "sharpr-me",   
        hash: "sha1",       
        ttl: 86400,   // 1 day            
      });
      if (this.cache) {
        console.log('cache setup complete')
      } else {
        console.log('cache setup failed')
      }
  }

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
      console.log(`getting file ${filename} from Google Drive`)
      return await this.driveService.getData(filename);
    } catch (error) {
      console.error(`Error in getFile for ${filename}:`, error);
      throw error;
    }
  }

  async getSnapshotData(fileId: string): Promise<any> {
    console.log('Getting snapshot data for fileId:', fileId);
    // Remove the gdrive:// prefix if it exists
    const cleanFileId = fileId.replace('gdrive://', '');
    console.log('Cleaned fileId:', cleanFileId);
    
    // If the filename already contains 'snapshot_', use it as is
    const filename = cleanFileId.startsWith('snapshot_') ? cleanFileId : `snapshot_${cleanFileId}.json`;
    console.log('Final filename for snapshot:', filename);
    
    try {
      const data = await this.getFile(filename);
      console.log('Successfully retrieved snapshot data');
      return data;
    } catch (error) {
      console.error('Error in getSnapshotData:', error);
      throw error;
    }
  }

  async getSpace(id: string): Promise<SpaceData | null> {
    try {
      // console.log(`Getting space: ${id}`);
      const cachedData = await this.getCache(id);
      if (cachedData) {
        console.log(`cache hit for space ${id}`)
        return cachedData;
      }
      console.log(`cache miss for space ${id}`)
      const data = await this.getFile(`space_${id}.json`);
      // console.log(`Space data retrieved:`, data);
      return data;
    } catch (error) {
      console.error(`Error getting space ${id}:`, error);
      return null;
    }
  }

  private async saveCache(id: string, data: Partial<SpaceData>) {
    return
    if (!this.cache) {
      await this.setupCache();
    }
    if (this.cache) {
      await this.cache.set(`space_${id}`, data)
    } else {
      console.log('Could not save cache.  Cache not initialized');
    }
  }

  async getCache(id: string) {
    return
    if (!this.cache) {
      await this.setupCache();
    }
    if (this.cache) {
      return await this.cache?.get(`space_${id}`);
    } else {
      console.log('Could not get cache.  Cache not initialized');
      return null;
    }
  }

  async removeCache(id: string) {
    if (!this.cache) {
      await this.setupCache();
    }
    if (this.cache) {
      await this.cache?.remove(`space_${id}`);
    }
  }



  async saveSpace(id: string, data: Partial<SpaceData>): Promise<void> {
    try {
      const existingData = await this.getSpace(id);
      const newData = { ...existingData, ...data, id };
      await this.saveFile(`space_${id}.json`, newData);
      await this.saveCache(id, newData);
    } catch (error) {
      console.error(`Error saving space ${id}:`, error);
      throw error;
    }
  }

  async deleteSpace(id: string): Promise<void> {
    await this.driveService.deleteData(`space_${id}.json`);
    await this.removeCache(id);
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
    console.log('Listing snapshots for spaceId:', spaceId);
    try {
      const files = await this.driveService.listFiles(`snapshot_${spaceId}_*.json`);
      console.log('Found snapshot files:', files);
      const snapshots = files.map(f => `gdrive://${f}`);
      // console.log('Mapped snapshot URLs:', snapshots);
      return snapshots;
    } catch (error) {
      console.error('Error in listSnapshots:', error);
      throw error;
    }
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