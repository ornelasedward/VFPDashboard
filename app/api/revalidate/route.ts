import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Revalidate the home page to refresh all cached data
    revalidatePath('/', 'layout');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache revalidated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to revalidate cache' 
    }, { status: 500 });
  }
}

export async function GET() {
  // Also support GET for easy browser refresh
  try {
    revalidatePath('/', 'layout');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache revalidated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to revalidate cache' 
    }, { status: 500 });
  }
}
