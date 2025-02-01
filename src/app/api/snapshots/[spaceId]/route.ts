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
    // Get spaceId from URL segments
    const segments = request.nextUrl.pathname.split('/');
    const spaceId = segments[segments.length - 1];
    
    console.log('GET /api/snapshots/[spaceId] - Request params:', {
      spaceId,
      pathname: request.nextUrl.pathname,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries())
    });

    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
    }

    const storageProvider = await getStorageProvider();
    console.log('Storage provider initialized');
    
    const snapshots = await storageProvider.listSnapshots(spaceId);
    console.log('Retrieved snapshots:', snapshots);
    
    if (snapshots.length === 0) {
      console.log('No snapshots found for space:', spaceId);
      return NextResponse.json({ snapshots: [] });
    }

    // Handle individual snapshot retrieval
    const url = request.nextUrl.searchParams.get('url');
    console.log('Snapshot URL from request:', url);

    if (url) {
      try {
        console.log('Attempting to fetch snapshot data for URL:', url);
        const data = await fetchSnapshotData(url);
        console.log('Successfully retrieved snapshot data');
        return NextResponse.json(data);
      } catch (error) {
        console.error('Error fetching snapshot data:', error);
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

export async function DELETE(request: NextRequest) {
  try {
    const spaceId = request.nextUrl.pathname.split('/').pop();
    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
    }

    const storageProvider = await getStorageProvider();
    await storageProvider.deleteAllSnapshots(spaceId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting snapshots:', error);
    return NextResponse.json({ 
      error: 'Failed to delete snapshots',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 