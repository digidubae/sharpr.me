import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/utils/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { spaceId, isPinned } = await request.json();
    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
    }

    const storageProvider = await getStorageProvider();
    await storageProvider.updateLibraryItem(session.user.email, spaceId, { isPinned });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating pin status:', error);
    return NextResponse.json({ 
      error: 'Failed to update pin status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 