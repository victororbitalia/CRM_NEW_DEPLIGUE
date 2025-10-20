## Why
The current system manages tables through a simple list view without visual representation of table locations. Restaurant staff need a visual floor plan to efficiently manage table assignments, understand table availability at a glance, and optimize seating arrangements based on table locations and capacities.

## What Changes
- Add visual table map component with drag-and-drop table positioning
- Create table zone management system (interior, exterior, terraza, privado)
- Enable table creation directly on the visual map
- Implement capacity-based business rules tied to table locations
- Add real-time table status visualization on the map
- **BREAKING**: Update table management API to support position coordinates

## Impact
- Affected specs: tables (new capability)
- Affected code: app/tables/page.tsx, components/ReservationCard.tsx, lib/prisma.ts, types/index.ts
- New API endpoints: /api/tables/map, /api/zones
- Database schema changes: Add position fields to Table model