## ADDED Requirements

### Requirement: Visual Table Map
The system SHALL provide a visual representation of restaurant tables arranged by zones.

#### Scenario: View table map
- **WHEN** restaurant staff navigates to the tables page
- **THEN** they see a visual floor plan with all tables positioned by zone
- **AND** each table displays its number, capacity, and current status

#### Scenario: Responsive table map
- **WHEN** viewing the table map on different screen sizes
- **THEN** the map adjusts to fit the viewport
- **AND** table positions maintain relative spacing

### Requirement: Table Positioning
The system SHALL allow staff to position tables within zones using drag-and-drop.

#### Scenario: Reposition table
- **WHEN** staff drags a table to a new position
- **THEN** the table position updates visually
- **AND** the new position is saved to the database

#### Scenario: Add table to map
- **WHEN** staff clicks "Add Table" and selects a zone
- **THEN** a new table appears in the selected zone
- **AND** staff can position it by dragging

### Requirement: Zone Management
The system SHALL allow configuration of restaurant zones with visual boundaries.

#### Scenario: Configure zones
- **WHEN** staff accesses zone configuration
- **THEN** they can define zone names, colors, and boundaries
- **AND** zones are visually distinct on the table map

#### Scenario: Filter by zone
- **WHEN** staff selects a specific zone filter
- **THEN** only tables in that zone are highlighted
- **AND** other tables appear dimmed

### Requirement: Table Status Visualization
The system SHALL provide real-time visual indicators of table status.

#### Scenario: Table status colors
- **WHEN** viewing the table map
- **THEN** available tables appear in green
- **AND** occupied tables appear in red
- **AND** reserved tables appear in yellow
- **AND** tables being cleaned appear in blue

#### Scenario: Table information tooltip
- **WHEN** staff hovers over a table
- **THEN** a tooltip shows table details
- **AND** includes current reservation if applicable

### Requirement: Capacity-Based Business Rules
The system SHALL enforce business rules based on table capacity and location.

#### Scenario: Reservation validation
- **WHEN** creating a reservation
- **THEN** only tables with sufficient capacity are suggested
- **AND** zone preferences are considered in table assignment

#### Scenario: Zone availability
- **WHEN** checking availability for a specific time
- **THEN** the system shows available tables by zone
- **AND** considers current reservations and table status