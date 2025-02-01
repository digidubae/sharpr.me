import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/utils/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { getCached, setCached } from '@/utils/cache';

const CACHE_TTL = 8 * 60 * 60 * 1000; // 8 hours


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const cacheKey = `user-library-${session.user.email}`;
    const cachedResponse = getCached(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const storageProvider = await getStorageProvider();
    const spaceIds = await storageProvider.listSpaces();

    // Convert space IDs to library items
    const spaces = spaceIds.map(id => ({
      id,
      title: id, // The ID is derived from the title during space creation
      addedAt: Date.now(), // We don't track this anymore for simplicity
      userId: session.user.email
    }));

    setCached(cacheKey, spaces, CACHE_TTL);


    return NextResponse.json(spaces);
  } catch (error) {
    console.error('Error fetching spaces:', error);

    // Check for insufficient permissions error
    if (error instanceof Error && error.message.includes('Insufficient Permission')) {
      return NextResponse.json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, { status: 403 });
    }

    return NextResponse.json({
      error: 'Failed to fetch spaces',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
