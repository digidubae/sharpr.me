import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/utils/storage';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
    }

    const storageProvider = await getStorageProvider();
    const space = await storageProvider.getSpace(id);

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    // Remove completed subjects
    const updatedSubjects = space.subjects.filter(subject => !subject.completed);
    
    // Save the updated space
    await storageProvider.saveSpace(id, {
      ...space,
      subjects: updatedSubjects
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cleaning up space:', error);
    return NextResponse.json({ 
      error: 'Failed to clean up space',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 