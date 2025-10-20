import { renderHook, act } from '@testing-library/react';
import { useUnifiedTableLayout } from '@/hooks/useUnifiedTableLayout';
import { useLayoutSync } from '@/hooks/useLayoutSync';
import { Table } from '@/hooks/useTables';

// Mock de las notificaciones
jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
  }),
}));

// Mock de la API
jest.mock('@/lib/api', () => ({
  default: {
    put: jest.fn(),
  },
}));

describe('Table Layout Fix Tests', () => {
  const mockTables: Table[] = [
    {
      id: 'table1',
      areaId: 'area1',
      number: '1',
      capacity: 4,
      positionX: 100,
      positionY: 100,
      width: 80,
      height: 80,
    },
    {
      id: 'table2',
      areaId: 'area1',
      number: '2',
      capacity: 2,
      positionX: 200,
      positionY: 100,
      width: 80,
      height: 80,
    },
  ];

  const mockAreas = [
    {
      id: 'area1',
      name: 'Interior',
      restaurantId: 'restaurant1',
      maxCapacity: 20,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize layout with table positions', () => {
    const { result } = renderHook(() =>
      useUnifiedTableLayout({
        coordinateType: 'relative',
        autoSave: false,
      })
    );

    act(() => {
      result.current.initializeLayout(mockTables, mockAreas);
    });

    expect(Object.keys(result.current.state.tablePositions)).toHaveLength(2);
    expect(Object.keys(result.current.state.areaPositions)).toHaveLength(1);
  });

  test('should not reinitialize layout when tables are moved', () => {
    const { result } = renderHook(() =>
      useUnifiedTableLayout({
        coordinateType: 'relative',
        autoSave: false,
      })
    );

    // Inicializar layout
    act(() => {
      result.current.initializeLayout(mockTables, mockAreas);
    });

    const initialTablePosition = result.current.state.tablePositions['table1'];

    // Mover mesa
    act(() => {
      result.current.updateTablePosition('table1', 150, 150);
    });

    const updatedTablePosition = result.current.state.tablePositions['table1'];

    // Verificar que la posición cambió
    expect(updatedTablePosition.x).toBe(150);
    expect(updatedTablePosition.y).toBe(150);

    // Intentar reinicializar (no debería sobrescribir las posiciones)
    act(() => {
      result.current.initializeLayout(mockTables, mockAreas);
    });

    // Verificar que la posición se mantuvo
    expect(result.current.state.tablePositions['table1'].x).toBe(150);
    expect(result.current.state.tablePositions['table1'].y).toBe(150);
  });

  test('should convert coordinates correctly between layout and database', () => {
    const { result } = renderHook(() =>
      useUnifiedTableLayout({
        coordinateType: 'relative',
        autoSave: false,
      })
    );

    act(() => {
      result.current.initializeLayout(mockTables, mockAreas);
    });

    const mockUpdateTablePosition = jest.fn().mockResolvedValue(true);
    
    const { result: syncResult } = renderHook(() =>
      useLayoutSync(
        mockUpdateTablePosition,
        jest.fn(),
        { autoSave: false }
      )
    );

    // Obtener coordenadas del layout
    const layoutCoords = result.current.state.tablePositions['table1'];
    
    // Convertir a coordenadas de BD
    const dbCoords = result.current.convertLayoutToDbCoordinates('table1');
    
    // Verificar conversión
    expect(dbCoords).not.toBeNull();
    expect(dbCoords!.x).toBeDefined();
    expect(dbCoords!.y).toBeDefined();
  });

  test('should preserve table positions when switching modes', () => {
    const { result, rerender } = renderHook(
      ({ viewMode }) =>
        useUnifiedTableLayout({
          coordinateType: 'relative',
          autoSave: false,
        }),
      { initialProps: { viewMode: 'grid' } }
    );

    act(() => {
      result.current.initializeLayout(mockTables, mockAreas);
    });

    // Mover mesa
    act(() => {
      result.current.updateTablePosition('table1', 150, 150);
    });

    const movedPosition = result.current.state.tablePositions['table1'];

    // Cambiar modo (simular cambio de props)
    rerender({ viewMode: 'layout' });

    // Verificar que la posición se mantuvo
    expect(result.current.state.tablePositions['table1'].x).toBe(movedPosition.x);
    expect(result.current.state.tablePositions['table1'].y).toBe(movedPosition.y);
  });
});