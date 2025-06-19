// src/services/api/offices-service.ts
import { Office } from '@/types';
import { fetcher } from './http-client';

export const officesService = {
  getAll: async () => {
    try {
      const offices = await fetcher<Office[]>('/api/v1/offices');
      
      return offices.map(office => ({
        ...office,
        createdAt: office.createdAt instanceof Date ? office.createdAt : new Date(office.createdAt),
        updatedAt: office.updatedAt instanceof Date ? office.updatedAt : new Date(office.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to fetch offices:', error);
      // For now, return mock offices since the backend endpoint doesn't exist yet
      return [
        {
          id: '1',
          name: 'Paris Office',
          location: 'Paris, France',
          contactEmail: 'paris@recruitmentplus.com',
          contactPhone: '+33145678901',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Lyon Office',
          location: 'Lyon, France',
          contactEmail: 'lyon@recruitmentplus.com',
          contactPhone: '+33478901234',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: 'Marseille Office',
          location: 'Marseille, France',
          contactEmail: 'marseille@recruitmentplus.com',
          contactPhone: '+33491234567',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
    }
  },
    
  getById: async (id: string) => {
    try {
      const office = await fetcher<Office>(`/api/v1/offices/${id}`);
      
      return {
        ...office,
        createdAt: office.createdAt instanceof Date ? office.createdAt : new Date(office.createdAt),
        updatedAt: office.updatedAt instanceof Date ? office.updatedAt : new Date(office.updatedAt),
      };
    } catch (error) {
      console.error('Failed to fetch office:', error);
      // Return a mock office since the backend endpoint doesn't exist yet
      return {
        id,
        name: `Office ${id}`,
        location: ['Paris, France', 'Lyon, France', 'Marseille, France'][parseInt(id) % 3],
        contactEmail: `office${id}@recruitmentplus.com`,
        contactPhone: '+33123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  },
};

export default officesService;