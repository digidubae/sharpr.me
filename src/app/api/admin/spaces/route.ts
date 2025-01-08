import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/utils/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const storageProvider = await getStorageProvider();
    const spaceIds = await storageProvider.listSpaces();
    
    const spaces = await Promise.all(
      spaceIds.map(async (id) => {
        const space = await storageProvider.getSpace(id);
        return space ? {
          id: space.id,
          title: space.title,
          subjectCount: space.subjects?.length || 0,
          isLocked: space.isLocked || false
        } : null;
      })
    );

    return NextResponse.json(spaces.filter(Boolean));
  } catch (error) {
    console.error('Error fetching spaces:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch spaces',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { spaceIds } = await request.json();
    if (!spaceIds || !Array.isArray(spaceIds)) {
      return NextResponse.json({ error: 'Space IDs are required' }, { status: 400 });
    }

    const storageProvider = await getStorageProvider();
    await Promise.all(spaceIds.map(id => storageProvider.deleteSpace(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting spaces:', error);
    return NextResponse.json({ 
      error: 'Failed to delete spaces',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 