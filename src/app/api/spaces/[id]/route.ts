import { getStorageProvider } from '@/utils/storage';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { invalidateCache } from '@/utils/cache';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
    }

    const storageProvider = await getStorageProvider();
    await storageProvider.deleteSpace(id);
    storageProvider.deleteAllSnapshots(id); // no await because we don't need to wait for this to complete
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const cacheKey = `user-library-${session.user.email}`;
    invalidateCache(cacheKey);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting space:', error);
    return NextResponse.json({
      error: 'Failed to delete space',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 