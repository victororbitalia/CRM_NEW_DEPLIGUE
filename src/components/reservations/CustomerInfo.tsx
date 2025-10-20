'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useNotifications } from '@/hooks/useNotifications';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: Date;
  preferences?: Record<string, any>;
  notes?: string;
  isVip?: boolean;
  isBlacklisted?: boolean;
  blacklistReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Reservation {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  table?: {
    number: string;
    area?: {
      name: string;
    };
  };
  specialRequests?: string;
  occasion?: string;
  notes?: string;
  createdAt: Date;
}

interface CustomerInfoProps {
  customerId: string;
  onEdit?: (customer: Customer) => void;
  onCreateReservation?: (customerId: string) => void;
  isLoading?: boolean;
}

const statusColors = {
  pending: 'bg-warning-100 text-warning-800 border-warning-200',
  confirmed: 'bg-primary-100 text-primary-800 border-primary-200',
  seated: 'bg-success-100 text-success-800 border-success-200',
  completed: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  cancelled: 'bg-error-100 text-error-800 border-error-200',
  no_show: 'bg-error-100 text-error-800 border-error-200',
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  seated: 'Seated',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export default function CustomerInfo({
  customerId,
  onEdit,
  onCreateReservation,
  isLoading = false,
}: CustomerInfoProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer>>({});
  const { showSuccess, showError } = useNotifications();

  // Mock customer data
  useEffect(() => {
    // In a real implementation, this would fetch data from the API
    const mockCustomer: Customer = {
      id: customerId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      address: '123 Main St',
      city: 'New York',
      postalCode: '10001',
      country: 'USA',
      dateOfBirth: new Date('1980-01-01'),
      preferences: {
        seatingPreference: 'window',
        dietaryRestrictions: ['vegetarian'],
        favoriteDishes: ['pasta', 'salad'],
      },
      notes: 'Regular customer, prefers quiet seating',
      isVip: true,
      isBlacklisted: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-12-01'),
    };

    const mockReservations: Reservation[] = [
      {
        id: '1',
        date: new Date('2023-12-15'),
        startTime: '19:00',
        endTime: '21:00',
        partySize: 4,
        status: 'completed',
        table: {
          number: '5',
          area: {
            name: 'Interior',
          },
        },
        specialRequests: 'Window seat preferred',
        occasion: 'birthday',
        createdAt: new Date('2023-12-10'),
      },
      {
        id: '2',
        date: new Date('2023-12-20'),
        startTime: '20:00',
        endTime: '22:00',
        partySize: 2,
        status: 'confirmed',
        table: {
          number: '2',
          area: {
            name: 'Terrace',
          },
        },
        createdAt: new Date('2023-12-05'),
      },
      {
        id: '3',
        date: new Date('2023-11-25'),
        startTime: '19:30',
        endTime: '21:30',
        partySize: 3,
        status: 'cancelled',
        createdAt: new Date('2023-11-20'),
      },
    ];

    setCustomer(mockCustomer);
    setReservations(mockReservations);
  }, [customerId]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateOfBirth = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    try {
      // In a real implementation, this would call the API
      const updatedCustomer = {
        ...customer!,
        notes: customer?.notes ? `${customer.notes}\n\n${newNote}` : newNote,
        updatedAt: new Date(),
      };
      
      setCustomer(updatedCustomer);
      setNewNote('');
      setShowAddNote(false);
      showSuccess('Note added successfully');
    } catch (error) {
      showError('Failed to add note');
      console.error('Error adding note:', error);
    }
  };

  const handleEdit = () => {
    if (customer) {
      setEditData(customer);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    try {
      // In a real implementation, this would call the API
      const updatedCustomer = {
        ...customer!,
        ...editData,
        updatedAt: new Date(),
      };
      
      setCustomer(updatedCustomer);
      setIsEditing(false);
      setEditData({});
      showSuccess('Customer information updated successfully');
    } catch (error) {
      showError('Failed to update customer information');
      console.error('Error updating customer:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleToggleVip = () => {
    if (!customer) return;

    try {
      // In a real implementation, this would call the API
      const updatedCustomer = {
        ...customer,
        isVip: !customer.isVip,
        updatedAt: new Date(),
      };
      
      setCustomer(updatedCustomer);
      showSuccess(`Customer ${updatedCustomer.isVip ? 'marked as' : 'unmarked as'} VIP`);
    } catch (error) {
      showError('Failed to update VIP status');
      console.error('Error updating VIP status:', error);
    }
  };

  const handleToggleBlacklist = () => {
    if (!customer) return;

    const action = customer.isBlacklisted ? 'remove from blacklist' : 'add to blacklist';
    
    if (!confirm(`Are you sure you want to ${action} this customer?`)) return;

    try {
      // In a real implementation, this would call the API
      const updatedCustomer = {
        ...customer,
        isBlacklisted: !customer.isBlacklisted,
        blacklistReason: !customer.isBlacklisted ? 'Reason for blacklisting' : undefined,
        updatedAt: new Date(),
      };
      
      setCustomer(updatedCustomer);
      showSuccess(`Customer ${action}ed successfully`);
    } catch (error) {
      showError(`Failed to ${action} customer`);
      console.error('Error updating blacklist status:', error);
    }
  };

  const getReservationStats = () => {
    const total = reservations.length;
    const completed = reservations.filter(r => r.status === 'completed').length;
    const cancelled = reservations.filter(r => r.status === 'cancelled').length;
    const noShow = reservations.filter(r => r.status === 'no_show').length;
    const upcoming = reservations.filter(r => 
      ['pending', 'confirmed'].includes(r.status) && 
      new Date(r.date) >= new Date()
    ).length;

    return { total, completed, cancelled, noShow, upcoming };
  };

  const stats = getReservationStats();

  if (!customer) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-secondary-500">Customer not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">
            {customer.firstName} {customer.lastName}
          </h2>
          <p className="text-secondary-600">
            Customer since {formatDate(customer.createdAt)}
          </p>
        </div>
        
        <div className="flex gap-2">
          {onCreateReservation && (
            <Button variant="primary" onClick={() => onCreateReservation(customer.id)}>
              Create Reservation
            </Button>
          )}
          
          {onEdit && (
            <Button variant="outline" onClick={handleEdit}>
              Edit Customer
            </Button>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2">
        {customer.isVip && (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            VIP Customer
          </Badge>
        )}
        
        {customer.isBlacklisted && (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Blacklisted
          </Badge>
        )}
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    First Name
                  </label>
                  <Input
                    value={editData.firstName || ''}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Last Name
                  </label>
                  <Input
                    value={editData.lastName || ''}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Phone
                  </label>
                  <Input
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Address
                  </label>
                  <Input
                    value={editData.address || ''}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    City
                  </label>
                  <Input
                    value={editData.city || ''}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Postal Code
                  </label>
                  <Input
                    value={editData.postalCode || ''}
                    onChange={(e) => setEditData({ ...editData, postalCode: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} disabled={isLoading}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-secondary-700">Email</h3>
                  <p className="text-sm text-secondary-900">{customer.email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-700">Phone</h3>
                  <p className="text-sm text-secondary-900">{customer.phone || 'Not provided'}</p>
                </div>
                
                {customer.address && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-secondary-700">Address</h3>
                    <p className="text-sm text-secondary-900">
                      {customer.address}
                      {customer.city && `, ${customer.city}`}
                      {customer.postalCode && ` ${customer.postalCode}`}
                      {customer.country && `, ${customer.country}`}
                    </p>
                  </div>
                )}
                
                {customer.dateOfBirth && (
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Date of Birth</h3>
                    <p className="text-sm text-secondary-900">
                      {formatDateOfBirth(customer.dateOfBirth)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      {customer.preferences && Object.keys(customer.preferences).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(customer.preferences).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm font-medium text-secondary-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-sm text-secondary-900">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Notes</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddNote(!showAddNote)}>
              {showAddNote ? 'Cancel' : 'Add Note'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customer.notes && (
            <div className="mb-4 p-3 bg-secondary-50 rounded-md">
              <p className="text-sm text-secondary-700 whitespace-pre-line">
                {customer.notes}
              </p>
            </div>
          )}
          
          {showAddNote && (
            <div className="space-y-2">
              <textarea
                className="w-full p-3 border border-secondary-300 rounded-md text-sm text-gray-900"
                rows={3}
                placeholder="Add a note about this customer..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                Add Note
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reservation Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Reservation Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900">{stats.total}</div>
              <div className="text-sm text-secondary-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">{stats.completed}</div>
              <div className="text-sm text-secondary-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-error-600">{stats.cancelled}</div>
              <div className="text-sm text-secondary-600">Cancelled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-error-600">{stats.noShow}</div>
              <div className="text-sm text-secondary-600">No Show</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.upcoming}</div>
              <div className="text-sm text-secondary-600">Upcoming</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reservations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-secondary-500">No reservations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Party Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">
                          {formatDate(reservation.date)}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {reservation.startTime} - {reservation.endTime}
                        </div>
                        {reservation.occasion && (
                          <div className="text-xs text-secondary-500">
                            {reservation.occasion}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">
                          {reservation.partySize} {reservation.partySize === 1 ? 'guest' : 'guests'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">
                          {reservation.table ? `Table ${reservation.table.number}` : 'Not assigned'}
                        </div>
                        {reservation.table?.area && (
                          <div className="text-sm text-secondary-500">
                            {reservation.table.area.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={statusColors[reservation.status]}>
                          {statusLabels[reservation.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={customer.isVip ? 'secondary' : 'primary'}
              onClick={handleToggleVip}
            >
              {customer.isVip ? 'Remove VIP Status' : 'Mark as VIP'}
            </Button>
            
            <Button
              variant={customer.isBlacklisted ? 'secondary' : 'error'}
              onClick={handleToggleBlacklist}
            >
              {customer.isBlacklisted ? 'Remove from Blacklist' : 'Add to Blacklist'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}