import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/utils/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const storageProvider = await getStorageProvider();
    const spaceIds = await storageProvider.listSpaces();
    
    // Get full space data for each space
    const spaces = await Promise.all(
      spaceIds.map(async (id) => {
        const space = await storageProvider.getSpace(id);
        if (!space) return null;
        return {
          id,
          title: space.title,
          addedAt: Date.now(), // This is just for compatibility with existing UI
          userId: session.user.email
        };
      })
    );

    // Filter out any null values from spaces that couldn't be loaded
    const validSpaces = spaces.filter(space => space !== null);
    
    return NextResponse.json(validSpaces);
  } catch (error) {
    console.error('Error fetching spaces:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch spaces',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
