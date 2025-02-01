import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { invalidateCache } from '@/utils/cache';
import type { drive_v3 } from 'googleapis';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

const FOLDER_NAME = 'Sharpr.me Data';

function generateSpaceId(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !session.user.accessToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { title } = await request.json();
    const spaceId = generateSpaceId(title);
    const fileName = `space_${spaceId}.json`;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: session.user.accessToken
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Find or create the Sharpr.me Data folder
    const folderResponse = await drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    let folderId;
    if (folderResponse.data.files && folderResponse.data.files.length > 0) {
      folderId = folderResponse.data.files[0].id;
    } else {
      const folderMetadata: drive_v3.Schema$File = {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      };
      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
      });
      folderId = folder.data.id;
    }
    
    // Check if file already exists in the folder
    const searchResponse = await drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Space already exists',
          spaceId
        }), 
        { status: 409 }
      );
    }

    // Create new file in the folder
    const fileMetadata: drive_v3.Schema$File = {
      name: fileName,
      mimeType: 'application/json',
      parents: [folderId!]
    };

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify({
        id: spaceId,
        title,
        subjects: [],
        categories: []
      })
    };

    await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });

    const cacheKey = `user-library-${session.user.email}`;
    invalidateCache(cacheKey);

    return new NextResponse(
      JSON.stringify({ spaceId }), 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating space:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to create space. Please try again later.' 
      }), 
      { status: 500 }
    );
  }
} 