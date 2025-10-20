'use client';

import React, { useState } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface Reservation {
  id: string;
  customerName: string;
  customerPhone?: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: string;
  specialRequests?: string;
  occasion?: string;
}

interface TableDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: {
    id: string;
    number: string;
    capacity: number;
    areaName: string;
    status: string;
    shape?: string;
    isAccessible?: boolean;
  };
  currentReservation?: Reservation | null;
  reservationHistory: Reservation[];
  onReleaseTable: (tableId: string) => void;
  onEditReservation: (reservationId: string) => void;
  onCancelReservation: (reservationId: string) => void;
}

const statusColors = {
  available: 'bg-green-100 text-green-800',
  occupied: 'bg-red-100 text-red-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  maintenance: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  available: 'Disponible',
  occupied: 'Ocupada',
  reserved: 'Reservada',
  maintenance: 'Mantenimiento',
};

export default function TableDetailsModal({
  isOpen,
  onClose,
  table,
  currentReservation,
  reservationHistory,
  onReleaseTable,
  onEditReservation,
  onCancelReservation,
}: TableDetailsModalProps) {
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2023-01-01T${startTime}`);
    const end = new Date(`2023-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Detalles de Mesa {table.number}</h2>
          <Badge className={statusColors[table.status as keyof typeof statusColors]}>
            {statusLabels[table.status as keyof typeof statusLabels]}
          </Badge>
        </div>
      </ModalHeader>
      
      <ModalBody>
        <div className="space-y-6">
          {/* Table Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Mesa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Número</p>
                  <p className="font-medium">{table.number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacidad</p>
                  <p className="font-medium">{table.capacity} personas</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Área</p>
                  <p className="font-medium">{table.areaName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Forma</p>
                  <p className="font-medium">
                    {table.shape === 'round' ? 'Redonda' : 
                     table.shape === 'rectangle' ? 'Rectangular' : 'Cuadrada'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Accesibilidad</p>
                  <p className="font-medium">
                    {table.isAccessible ? 'Sí' : 'No'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Reservation */}
          {currentReservation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reserva Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Cliente</p>
                      <p className="font-medium">{currentReservation.customerName}</p>
                      {currentReservation.customerPhone && (
                        <p className="text-sm text-gray-600">{currentReservation.customerPhone}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hora</p>
                      <p className="font-medium">
                        {formatTime(currentReservation.startTime)} - {formatTime(currentReservation.endTime)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Duración: {calculateDuration(currentReservation.startTime, currentReservation.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Personas</p>
                      <p className="font-medium">{currentReservation.partySize}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <Badge className={
                        currentReservation.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        currentReservation.status === 'seated' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {currentReservation.status === 'confirmed' ? 'Confirmada' :
                         currentReservation.status === 'seated' ? 'Sentada' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                  
                  {currentReservation.specialRequests && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Solicitudes Especiales</p>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {currentReservation.specialRequests}
                      </p>
                    </div>
                  )}
                  
                  {currentReservation.occasion && (
                    <div>
                      <p className="text-sm text-gray-500">Ocasión</p>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {currentReservation.occasion === 'birthday' ? 'Cumpleaños' :
                         currentReservation.occasion === 'anniversary' ? 'Aniversario' :
                         currentReservation.occasion === 'business' ? 'Negocios' :
                         currentReservation.occasion === 'date' ? 'Cita' :
                         currentReservation.occasion === 'celebration' ? 'Celebración' :
                         'Otra'}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    {currentReservation.status !== 'seated' && (
                      <Button
                        size="sm"
                        onClick={() => onEditReservation(currentReservation.id)}
                      >
                        Editar Reserva
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCancelReservation(currentReservation.id)}
                    >
                      Cancelar Reserva
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onReleaseTable(table.id)}
                    >
                      Liberar Mesa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reservation History */}
          {reservationHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historial de Reservas del Día</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reservationHistory.map((reservation) => (
                    <div key={reservation.id} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{reservation.customerName}</p>
                            <Badge className={
                              reservation.status === 'completed' ? 'bg-green-100 text-green-800' :
                              reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {reservation.status === 'completed' ? 'Completada' :
                               reservation.status === 'cancelled' ? 'Cancelada' :
                               reservation.status === 'no_show' ? 'No se presentó' :
                               reservation.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>{formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}</span>
                            <span>{reservation.partySize} personas</span>
                            {reservation.occasion && (
                              <span>
                                {reservation.occasion === 'birthday' ? 'Cumpleaños' :
                                 reservation.occasion === 'anniversary' ? 'Aniversario' :
                                 reservation.occasion === 'business' ? 'Negocios' :
                                 reservation.occasion === 'date' ? 'Cita' :
                                 reservation.occasion === 'celebration' ? 'Celebración' :
                                 'Otra'}
                              </span>
                            )}
                          </div>
                          {reservation.specialRequests && (
                            <p className="text-sm text-gray-500 mt-1 italic">
                              {reservation.specialRequests}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ModalBody>
      
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  );
}