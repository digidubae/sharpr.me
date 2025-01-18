import { getStorageProvider } from '@/utils/storage';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
    }

    const storageProvider = await getStorageProvider();
    // Get all snapshots for this space
    // const snapshots = await storageProvider.listSnapshots(id);
    // console.log(`TOK: delete snapshots for ${id}`)
    // Delete all snapshots
    // console.log(`TOK: delete space for ${id}`)
    // Delete the space
    await storageProvider.deleteSpace(id);
    storageProvider.deleteAllSnapshots(id); // no await because we don't need to wait for this to complete

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting space:', error);
    return NextResponse.json({ 
      error: 'Failed to delete space',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 