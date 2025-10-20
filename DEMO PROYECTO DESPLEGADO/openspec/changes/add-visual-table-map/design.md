## Context
The restaurant currently manages tables through a simple list interface without visual representation. Staff need to understand table locations, capacities, and availability at a glance to optimize seating arrangements and provide better service. The visual table map will serve as the central interface for table management and reservation assignments.

## Goals / Non-Goals
- Goals: 
  - Provide intuitive visual table management
  - Enable drag-and-drop table positioning
  - Support zone-based organization
  - Integrate with existing reservation system
- Non-Goals:
  - 3D visualization or complex floor plan rendering
  - Advanced seating optimization algorithms
  - Multi-floor support in initial implementation

## Decisions
- Decision: Use HTML5 drag-and-drop API for table positioning
  - Rationale: Native browser support, no additional dependencies
  - Alternatives considered: React DnD (more complex), custom mouse events (more work)
- Decision: Store table positions as relative coordinates (0-100%)
  - Rationale: Responsive design independent of pixel values
  - Alternatives considered: Absolute pixels (not responsive), grid system (less flexible)
- Decision: Implement zones as configurable areas with visual boundaries
  - Rationale: Flexible restaurant layout customization
  - Alternatives considered: Fixed zone layouts (not adaptable), image-based maps (harder to maintain)

## Risks / Trade-offs
- [Risk] Performance with large numbers of tables → Mitigation: Implement virtualization for 50+ tables
- [Trade-off] Simplicity vs. features → Chose simplicity for MVP, can enhance later
- [Risk] Mobile usability of drag-and-drop → Mitigation: Add touch support and alternative positioning methods

## Migration Plan
1. Update database schema with position fields (backward compatible)
2. Deploy new API endpoints alongside existing ones
3. Update frontend to use new endpoints
4. Migrate existing tables to default positions
5. Remove old table management UI after validation

## Open Questions
- Should we support table shapes beyond rectangles (circles, custom shapes)?
- Do we need to save multiple floor plan layouts?
- Should tables have rotation angle in addition to position?