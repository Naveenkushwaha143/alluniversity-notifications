import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/universities - Add a new university
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, shortName, website, state, district, type, description, logo, color } = body;

    if (!name || !shortName || !website || !state) {
      return NextResponse.json(
        { success: false, message: "Name, shortName, website, and state are required!" },
        { status: 400 }
      );
    }

    const existing = await db.university.findFirst({
      where: { shortName }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "University with this shortName already exists!" },
        { status: 409 }
      );
    }

    const university = await db.university.create({
      data: {
        name,
        shortName,
        website,
        state,
        district: district || null,
        type: type || 'State',
        description: description || null,
        logo: logo || null,
        color: color || "#6366f1",
      }
    });

    return NextResponse.json({
      success: true,
      message: "University added successfully!",
      data: university
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding university:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add university", error: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/universities - Get all universities with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const district = searchParams.get('district');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '200');

    // Build where clause
    const where: Record<string, unknown> = { isActive: true };
    if (state) where.state = state;
    if (district) where.district = district;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shortName: { contains: search } },
        { district: { contains: search } },
      ];
    }

    const [universities, stateCounts, districtData] = await Promise.all([
      db.university.findMany({
        where,
        include: {
          _count: {
            select: { notices: true }
          }
        },
        orderBy: [{ state: 'asc' }, { district: 'asc' }, { createdAt: 'asc' }],
        take: limit,
      }),
      db.university.groupBy({
        by: ['state'],
        where: { isActive: true },
        _count: { id: true },
      }),
      db.university.groupBy({
        by: ['state', 'district'],
        where: { isActive: true, district: { not: null } },
        _count: { id: true },
      }),
    ]);

    const stateSummary = stateCounts.map(s => ({
      state: s.state,
      count: s._count.id,
    }));

    const districtsByState: Record<string, { name: string; count: number }[]> = {};
    for (const d of districtData) {
      if (d.district) {
        if (!districtsByState[d.state]) districtsByState[d.state] = [];
        districtsByState[d.state].push({ name: d.district, count: d._count.id });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Universities fetched successfully!",
      total: universities.length,
      stateSummary,
      districtsByState,
      data: universities
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error("Error fetching universities:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch universities", error: String(error) },
      { status: 500 }
    );
  }
}
