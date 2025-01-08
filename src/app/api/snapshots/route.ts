import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/utils/storage';

export async function POST(request: NextRequest) {
  try {
    // console.log('Received snapshot creation request');
    const { spaceId, data } = await request.json();
    
    if (!spaceId) {
      console.error('Space ID is missing');
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
    }

    // console.log(`Creating snapshot for space ${spaceId}`);
    const storageProvider = await getStorageProvider();
    const snapshotUrl = await storageProvider.createSnapshot(spaceId, data);
    // console.log(`Snapshot created successfully: ${snapshotUrl}`);
    
    return NextResponse.json({ url: snapshotUrl });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json({ 
      error: 'Failed to create snapshot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 