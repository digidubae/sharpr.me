import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/utils/storage';

async function fetchSnapshotData(url: string) {
  try {
    const storageProvider = await getStorageProvider();
    const data = await storageProvider.getSnapshotData(url);

    if (!data) {
      throw new Error('Snapshot not found');
    }

    return data;
  } catch (error) {
    console.error('Error fetching snapshot data:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const spaceId = request.nextUrl.searchParams.get('spaceId');
    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
    }

    const storageProvider = await getStorageProvider();
    const snapshots = await storageProvider.listSnapshots(spaceId);
    
    if (snapshots.length === 0) {
      return NextResponse.json({ snapshots: [] });
    }

    // Handle individual snapshot retrieval
    const url = request.nextUrl.searchParams.get('url');

    if (url) {
      try {
        const data = await fetchSnapshotData(url);
        return NextResponse.json(data);
      } catch (error) {
        console.error('Error fetching snapshot:', error);
        return NextResponse.json({ 
          error: error instanceof Error ? error.message : 'Failed to fetch snapshot data'
        }, { status: 500 });
      }
    }

    // Return list of snapshots with timestamps
    const snapshotsWithTimestamps = snapshots.map(url => {
      const timestamp = url.split('_').pop()?.replace('.json', '') || '';
      return {
        url,
        timestamp: new Date(parseInt(timestamp)).toISOString(),
        filename: url
      };
    });

    return NextResponse.json({ snapshots: snapshotsWithTimestamps });
  } catch (error) {
    console.error('Error listing snapshots:', error);
    return NextResponse.json({ 
      error: 'Failed to list snapshots',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 