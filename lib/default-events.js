module.exports = [
  {
    id: 'evt-001',
    title: 'Coldplay: Music of the Spheres',
    category: 'Concert',
    venue: 'DY Patil Stadium, Mumbai',
    date: '2026-05-15',
    time: '19:30',
    image: 'concert',
    description: 'Experience the world-famous Coldplay live in concert with their spectacular light show and iconic hits spanning two decades.',
    tickets: [
      { type: 'General', price: 2500, total: 200, booked: 45 },
      { type: 'Premium', price: 6500, total: 100, booked: 30 },
      { type: 'VIP', price: 15000, total: 30, booked: 12 }
    ]
  },
  {
    id: 'evt-002',
    title: 'IPL 2026: MI vs CSK',
    category: 'Sports',
    venue: 'Wankhede Stadium, Mumbai',
    date: '2026-05-22',
    time: '20:00',
    image: 'sports',
    description: 'The ultimate clash of titans! Mumbai Indians face Chennai Super Kings in this high-voltage IPL encounter.',
    tickets: [
      { type: 'General Stand', price: 1200, total: 500, booked: 210 },
      { type: 'Pavilion', price: 3500, total: 200, booked: 88 },
      { type: 'Corporate Box', price: 12000, total: 50, booked: 20 }
    ]
  },
  {
    id: 'evt-003',
    title: 'The Dark Knight Returns - Live Score',
    category: 'Movie',
    venue: 'PVR IMAX, Delhi',
    date: '2026-05-10',
    time: '18:00',
    image: 'movie',
    description: "A cinematic event like no other - Batman's legendary tale screened with Hans Zimmer's iconic score performed live by a full orchestra.",
    tickets: [
      { type: 'Standard', price: 400, total: 150, booked: 60 },
      { type: 'IMAX', price: 850, total: 80, booked: 35 },
      { type: 'Gold Lounge', price: 2200, total: 20, booked: 8 }
    ]
  },
  {
    id: 'evt-004',
    title: 'Arijit Singh Live 2026',
    category: 'Concert',
    venue: 'NSCI Dome, Mumbai',
    date: '2026-06-01',
    time: '20:00',
    image: 'concert',
    description: "India's most loved singer performs his greatest hits in an intimate acoustic evening that will leave you spellbound.",
    tickets: [
      { type: 'Standing', price: 1800, total: 300, booked: 95 },
      { type: 'Seated', price: 4500, total: 150, booked: 40 },
      { type: 'Front Row', price: 9999, total: 40, booked: 15 }
    ]
  },
  {
    id: 'evt-005',
    title: 'Pro Kabaddi League Finals',
    category: 'Sports',
    venue: 'EKA Arena, Ahmedabad',
    date: '2026-05-28',
    time: '21:00',
    image: 'sports',
    description: 'The most anticipated night in kabaddi - two powerhouse teams battle for the ultimate Pro Kabaddi League trophy.',
    tickets: [
      { type: 'East Stand', price: 800, total: 400, booked: 120 },
      { type: 'West Pavilion', price: 2000, total: 180, booked: 60 },
      { type: 'VIP Lounge', price: 8000, total: 40, booked: 18 }
    ]
  },
  {
    id: 'evt-006',
    title: 'Dune: Awakening - Premiere',
    category: 'Movie',
    venue: 'Cinepolis, Bangalore',
    date: '2026-05-05',
    time: '21:30',
    image: 'movie',
    description: 'Be among the first to witness the next chapter of the Dune saga on the grandest screen with Dolby Atmos sound.',
    tickets: [
      { type: 'Standard', price: 350, total: 200, booked: 70 },
      { type: '4DX', price: 950, total: 60, booked: 25 },
      { type: 'Luxury Recliner', price: 1800, total: 30, booked: 10 }
    ]
  }
];
