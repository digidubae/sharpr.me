import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/utils/storage';
import { SpaceData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
    }

    const storageProvider = await getStorageProvider();
    const space = await storageProvider.getSpace(id);
    
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    return NextResponse.json({
      title: space.title,
      subjects: space.subjects || [],
      categories: space.categories || [],
      isLocked: space.isLocked || false,
      encryptedData: space.encryptedData
    });
  } catch (error) {
    console.error('Error fetching space:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch space data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, title, subjects, categories, isLocked, encryptedData } = await request.json();
    
    if (!id || !title) {
      return NextResponse.json({ error: 'Space ID and title are required' }, { status: 400 });
    }

    const storageProvider = await getStorageProvider();
    
    const spaceData: Partial<SpaceData> = {
      id,
      title,
      subjects: subjects || [],
      categories: categories || [],
      isLocked: isLocked || false,
      encryptedData: isLocked ? encryptedData : null
    };

    await storageProvider.saveSpace(id, spaceData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating space:', error);
    return NextResponse.json({ 
      error: 'Failed to create space',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 