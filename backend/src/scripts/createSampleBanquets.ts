import mongoose from 'mongoose';
import Banquet from '../models/Banquet';

const sampleBanquets = [
  {
    banquetId: 'BH001',
    name: 'Emerald Grand Hall',
    type: 'wedding',
    description: 'Our largest and most luxurious wedding hall featuring crystal chandeliers and elegant décor.',
    capacity: 500,
    pricePerDay: 5000,
    pricePerHour: 800,
    minimumHours: 6,
    amenities: ['Stage/Podium', 'Dance Floor', 'Bridal Room', 'Kitchen Access'],
    facilities: {
      ac: true,
      projector: true,
      soundSystem: true,
      wifi: true,
      parking: true,
      catering: true,
      decoration: true,
      dj: true,
      photography: true,
      powerBackup: true
    },
    seatingArrangements: ['Round Table', 'Theatre Style', 'Banquet'],
    area: '3000 sq ft',
    floor: 2,
    location: 'Main Building - Second Floor',
    isAvailable: true,
    status: 'active',
    images: ['/api/placeholder/600/400', '/api/placeholder/600/401'],
    createdBy: 'Admin'
  },
  {
    banquetId: 'BH002',
    name: 'Sapphire Conference Hall',
    type: 'conference',
    description: 'Modern conference hall equipped with state-of-the-art audio-visual equipment.',
    capacity: 200,
    pricePerDay: 2500,
    pricePerHour: 400,
    minimumHours: 4,
    amenities: ['Projector Setup', 'Green Room', 'Storage Space'],
    facilities: {
      ac: true,
      projector: true,
      soundSystem: true,
      wifi: true,
      parking: true,
      catering: true,
      decoration: false,
      dj: false,
      photography: false,
      powerBackup: true
    },
    seatingArrangements: ['Theatre Style', 'Classroom', 'U-Shape'],
    area: '1500 sq ft',
    floor: 1,
    location: 'Business Center - Ground Floor',
    isAvailable: true,
    status: 'active',
    images: ['/api/placeholder/600/402'],
    createdBy: 'Admin'
  },
  {
    banquetId: 'BH003',
    name: 'Ruby Party Hall',
    type: 'party',
    description: 'Perfect for birthday parties, anniversaries, and social gatherings.',
    capacity: 150,
    pricePerDay: 2000,
    pricePerHour: 300,
    minimumHours: 4,
    amenities: ['Dance Floor', 'Bar Counter', 'Garden View'],
    facilities: {
      ac: true,
      projector: false,
      soundSystem: true,
      wifi: true,
      parking: true,
      catering: true,
      decoration: true,
      dj: true,
      photography: true,
      powerBackup: true
    },
    seatingArrangements: ['Cocktail', 'Round Table'],
    area: '1200 sq ft',
    floor: 1,
    location: 'West Wing - Ground Floor',
    isAvailable: true,
    status: 'active',
    images: ['/api/placeholder/600/403'],
    createdBy: 'Admin'
  }
];

export const createSampleBanquets = async () => {
  try {
    // Clear existing banquets
    await Banquet.deleteMany({});
    
    // Insert sample banquets
    await Banquet.insertMany(sampleBanquets);
    
    console.log('Sample banquets created successfully!');
  } catch (error) {
    console.error('Error creating sample banquets:', error);
  }
};
