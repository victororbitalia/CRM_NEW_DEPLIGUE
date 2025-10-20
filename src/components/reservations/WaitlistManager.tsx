'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { useNotifications } from '@/hooks/useNotifications';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isVip?: boolean;
}

interface Area {
  id: string;
  name: string;
}

interface WaitlistEntry {
  id: string;
  customer: Customer;
  date: Date;
  partySize: number;
  preferredTime?: string;
  area?: Area;
  specialRequests?: string;
  status: 'waiting' | 'offered' | 'declined' | 'expired';
  priority: number;
  offeredAt?: Date;
  expiresAt: Date;
  notes?: string;
  createdAt: Date;
}

interface WaitlistManagerProps {
  waitlistEntries: WaitlistEntry[];
  onOfferTable?: (entryId: string, tableId: string) => void;
  onUpdateStatus?: (entryId: string, status: string) => void;
  onDelete?: (entryId: string) => void;
  onCreateEntry?: (entry: Partial<WaitlistEntry>) => void;
  isLoading?: boolean;
}

const statusColors = {
  waiting: 'bg-warning-100 text-warning-800 border-warning-200',
  offered: 'bg-primary-100 text-primary-800 border-primary-200',
  declined: 'bg-error-100 text-error-800 border-error-200',
  expired: 'bg-secondary-100 text-secondary-800 border-secondary-200',
};

const statusLabels = {
  waiting: 'Waiting',
  offered: 'Offered',
  declined: 'Declined',
  expired: 'Expired',
};

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'offered', label: 'Offered' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
];

export default function WaitlistManager({
  waitlistEntries,
  onOfferTable,
  onUpdateStatus,
  onDelete,
  onCreateEntry,
  isLoading = false,
}: WaitlistManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredEntries, setFilteredEntries] = useState(waitlistEntries);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    customerId: '',
    partySize: 2,
    preferredTime: '',
    areaId: '',
    specialRequests: '',
    priority: 0,
  });
  const { showSuccess, showError } = useNotifications();

  // Mock data for customers and areas
  const [customers] = useState<Customer[]>([
    { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '555-1234', isVip: true },
    { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '555-5678' },
  ]);

  const [areas] = useState<Area[]>([
    { id: '1', name: 'Interior' },
    { id: '2', name: 'Terrace' },
  ]);

  const [tables] = useState([
    { id: '1', number: '1', capacity: 4, areaId: '1' },
    { id: '2', number: '2', capacity: 2, areaId: '1' },
    { id: '3', number: '3', capacity: 6, areaId: '2' },
  ]);

  const timeOptions = [
    { value: '', label: 'No preference' },
    { value: '19:00', label: '19:00' },
    { value: '19:30', label: '19:30' },
    { value: '20:00', label: '20:00' },
    { value: '20:30', label: '20:30' },
    { value: '21:00', label: '21:00' },
    { value: '21:30', label: '21:30' },
    { value: '22:00', label: '22:00' },
  ];

  // Filter entries
  useEffect(() => {
    let filtered = [...waitlistEntries];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.customer.phone && entry.customer.phone.includes(searchTerm)) ||
        (entry.specialRequests && entry.specialRequests.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => entry.status === statusFilter);
    }

    // Sort by priority and creation time
    filtered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Earlier first
    });

    setFilteredEntries(filtered);
  }, [waitlistEntries, searchTerm, statusFilter]);

  const handleCreateEntry = async () => {
    try {
      if (!newEntry.customerId) {
        showError('Please select a customer');
        return;
      }

      if (onCreateEntry) {
        const entryData = {
          ...newEntry,
          date: new Date(),
          status: 'waiting' as const,
          expiresAt: new Date(new Date().setHours(23, 59, 59, 999)), // End of day
        };
        
        await onCreateEntry(entryData);
        showSuccess('Waitlist entry created successfully');
        
        // Reset form
        setNewEntry({
          customerId: '',
          partySize: 2,
          preferredTime: '',
          areaId: '',
          specialRequests: '',
          priority: 0,
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      showError('Failed to create waitlist entry');
      console.error('Error creating waitlist entry:', error);
    }
  };

  const handleOfferTable = async (entryId: string) => {
    try {
      // In a real implementation, this would show a modal to select a table
      // For now, we'll just simulate offering the first available table
      const availableTable = tables[0];
      
      if (onOfferTable && availableTable) {
        await onOfferTable(entryId, availableTable.id);
        showSuccess(`Table ${availableTable.number} offered to customer`);
      }
    } catch (error) {
      showError('Failed to offer table');
      console.error('Error offering table:', error);
    }
  };

  const handleUpdateStatus = async (entryId: string, newStatus: string) => {
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(entryId, newStatus);
        showSuccess('Waitlist entry status updated successfully');
      }
    } catch (error) {
      showError('Failed to update waitlist entry status');
      console.error('Error updating waitlist entry status:', error);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (confirm('Are you sure you want to remove this entry from the waitlist?')) {
      try {
        if (onDelete) {
          await onDelete(entryId);
          showSuccess('Waitlist entry removed successfully');
        }
      } catch (error) {
        showError('Failed to remove waitlist entry');
        console.error('Error removing waitlist entry:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt: Date) => {
    return new Date() > new Date(expiresAt);
  };

  const getAvailableTables = (partySize: number, areaId?: string) => {
    return tables.filter(table => {
      const matchesArea = !areaId || table.areaId === areaId;
      const hasCapacity = table.capacity >= partySize;
      return matchesArea && hasCapacity;
    });
  };

  const customerOptions = customers.map(customer => ({
    value: customer.id,
    label: `${customer.firstName} ${customer.lastName} (${customer.email})`,
  }));

  const areaOptions = [
    { value: '', label: 'No preference' },
    ...areas.map(area => ({
      value: area.id,
      label: area.name,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-secondary-900">Waitlist Management</h2>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="primary"
          >
            Add to Waitlist
          </Button>
        </div>
      </div>

      {/* Create Entry Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Customer to Waitlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Customer
                </label>
                <Select
                  value={newEntry.customerId}
                  onChange={(value) => setNewEntry({ ...newEntry, customerId: value as string })}
                  options={customerOptions}
                  placeholder="Select a customer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Party Size
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={newEntry.partySize}
                  onChange={(e) => setNewEntry({ ...newEntry, partySize: parseInt(e.target.value) || 1 })}
                  placeholder="Number of guests"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Preferred Time
                </label>
                <Select
                  value={newEntry.preferredTime}
                  onChange={(value) => setNewEntry({ ...newEntry, preferredTime: value as string })}
                  options={timeOptions}
                  placeholder="Select preferred time"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Preferred Area
                </label>
                <Select
                  value={newEntry.areaId}
                  onChange={(value) => setNewEntry({ ...newEntry, areaId: value as string })}
                  options={areaOptions}
                  placeholder="Select preferred area"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Special Requests
                </label>
                <Input
                  value={newEntry.specialRequests}
                  onChange={(e) => setNewEntry({ ...newEntry, specialRequests: e.target.value })}
                  placeholder="Any special requests or requirements"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreateEntry} disabled={isLoading}>
                Add to Waitlist
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search waitlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as string)}
                options={statusOptions}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Waitlist Entries ({filteredEntries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-secondary-500">Loading waitlist...</div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-secondary-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                No waitlist entries found
              </h3>
              <p className="text-secondary-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No customers are currently on the waitlist'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Party Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Preferences
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-secondary-50 ${isExpired(entry.expiresAt) ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-secondary-900">
                            {entry.customer.firstName} {entry.customer.lastName}
                          </div>
                          <div className="text-sm text-secondary-500">
                            {entry.customer.email}
                          </div>
                          {entry.customer.phone && (
                            <div className="text-sm text-secondary-500">
                              {entry.customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">
                          {entry.partySize} {entry.partySize === 1 ? 'guest' : 'guests'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">
                          {entry.preferredTime || 'No preference'}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {entry.area?.name || 'No area preference'}
                        </div>
                        {entry.specialRequests && (
                          <div className="text-xs text-secondary-500">
                            {entry.specialRequests}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-secondary-900">
                            {entry.priority}
                          </span>
                          {entry.customer.isVip && (
                            <Badge className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                              VIP
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={statusColors[entry.status]}>
                          {statusLabels[entry.status]}
                        </Badge>
                        {isExpired(entry.expiresAt) && entry.status === 'waiting' && (
                          <div className="text-xs text-error-600 mt-1">
                            Expired
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col gap-1">
                          {entry.status === 'waiting' && !isExpired(entry.expiresAt) && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOfferTable(entry.id)}
                              disabled={getAvailableTables(entry.partySize, entry.area?.id).length === 0}
                            >
                              Offer Table
                            </Button>
                          )}
                          
                          {entry.status === 'offered' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleUpdateStatus(entry.id, 'seated')}
                            >
                              Mark as Seated
                            </Button>
                          )}
                          
                          {entry.status === 'waiting' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(entry.id, 'declined')}
                            >
                              Decline
                            </Button>
                          )}
                          
                          {onDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(entry.id)}
                              className="text-error-600 border-error-200 hover:bg-error-50"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}