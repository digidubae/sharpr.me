import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/utils/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
    }

    const storageProvider = await getStorageProvider();
    
    // Get all snapshots for this space
    const snapshots = await storageProvider.listSnapshots(id);
    
    // Delete all snapshots
    await storageProvider.deleteAllSnapshots(id);
    
    // Delete the space
    await storageProvider.deleteSpace(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting space:', error);
    return NextResponse.json({ 
      error: 'Failed to delete space',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 