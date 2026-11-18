/**
 * ResourceX – Demo Data
 * Realistic sample data used when CONFIG.DEMO_MODE = true.
 * Replace / augment with real API responses when switching to backend mode.
 *
 * NOTE: All data here is synthetic and for demonstration purposes only.
 *       It does not represent real campus transactions, users, or resources.
 */

const DEMO_DATA = {
  /* ──────────────────────────────────────────────────────────────
     RESOURCES
     ────────────────────────────────────────────────────────────── */
  resources: [
    {
      id: 'r001',
      title: 'Data Structures & Algorithms – 3rd Edition',
      description: 'Comprehensive textbook by Cormen et al. (CLRS). Lightly used, all pages intact. Perfect for CS students preparing for technical interviews and university exams.',
      category: 'books',
      subject: 'Computer Science',
      tags: ['algorithms', 'data structures', 'CLRS', 'textbook'],
      type: 'physical',
      condition: 'Good',
      exchangeMode: 'borrow',
      price: 0,
      deposit: 100,
      availability: 'available',
      location: 'CS Block, Room 204',
      images: [
        'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
      ownerId: 'u_primary',
      ownerName: 'Yugandhar Chandu',
      ownerDept: 'Computer Science & Engineering',
      rating: 4.7,
      reviewCount: 12,
      views: 87,
      createdAt: '2026-09-15T10:30:00Z',
      status: 'approved',
    },
    {
      id: 'r002',
      title: 'Arduino Uno + Sensor Kit (Starter Pack)',
      description: 'Complete Arduino starter kit with Uno R3, breadboard, 40 jumper wires, DHT11 sensor, ultrasonic sensor, IR module, and 16×2 LCD. Ideal for IoT mini-projects.',
      category: 'electronics',
      subject: 'Electronics & IoT',
      tags: ['arduino', 'iot', 'sensors', 'microcontroller'],
      type: 'physical',
      condition: 'Excellent',
      exchangeMode: 'borrow',
      price: 0,
      deposit: 500,
      availability: 'available',
      location: 'EC Lab, Ground Floor',
      images: [
        'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=600&q=80',
      ownerId: 'u_primary',
      ownerName: 'Yugandhar Chandu',
      ownerDept: 'Computer Science & Engineering',
      rating: 4.9,
      reviewCount: 8,
      views: 134,
      createdAt: '2026-09-20T09:00:00Z',
      status: 'approved',
    },
    {
      id: 'r003',
      title: 'Operating Systems Concepts – Silberschatz',
      description: 'Dinosaur book, 10th edition. Some highlighting on chapters 1–4. Very useful for OS exam prep. Happy to lend for one semester.',
      category: 'books',
      subject: 'Computer Science',
      tags: ['operating systems', 'OS', 'silberschatz', 'dinosaur book'],
      type: 'physical',
      condition: 'Fair',
      exchangeMode: 'sell',
      price: 350,
      availability: 'available',
      location: 'Library Lobby',
      images: [
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      ownerId: 'u_primary',
      ownerName: 'Yugandhar Chandu',
      ownerDept: 'Computer Science & Engineering',
      rating: 4.5,
      reviewCount: 3,
      views: 45,
      createdAt: '2026-09-25T14:00:00Z',
      status: 'approved',
    },
    {
      id: 'r004',
      title: 'Machine Learning Lecture Notes – Unit 1–5',
      description: 'Comprehensive handwritten + digital notes covering Supervised Learning, Neural Networks, SVM, Decision Trees, and Clustering. Based on IIT syllabi.',
      category: 'notes',
      subject: 'Machine Learning',
      tags: ['machine learning', 'ML', 'notes', 'neural networks', 'SVM'],
      type: 'digital',
      exchangeMode: 'free',
      price: 0,
      availability: 'available',
      images: [
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
      fileUrl: '#demo-file',
      ownerId: 'u_primary',
      ownerName: 'Yugandhar Chandu',
      ownerDept: 'Computer Science & Engineering',
      rating: 4.8,
      reviewCount: 21,
      views: 312,
      createdAt: '2026-10-01T11:00:00Z',
      status: 'approved',
    },
    {
      id: 'r005',
      title: 'Digital Electronics Previous Year Question Papers (2019–2025)',
      description: 'Collection of 7 years of university question papers for Digital Electronics. Includes answer keys for some years. Great for exam preparation.',
      category: 'papers',
      subject: 'Electronics',
      tags: ['question papers', 'digital electronics', 'exam prep', 'previous year'],
      type: 'digital',
      exchangeMode: 'free',
      price: 0,
      availability: 'available',
      images: [
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
      fileUrl: '#demo-file',
      ownerId: 'u_primary',
      ownerName: 'Yugandhar Chandu',
      ownerDept: 'Computer Science & Engineering',
      rating: 4.6,
      reviewCount: 15,
      views: 198,
      createdAt: '2026-10-03T08:30:00Z',
      status: 'approved',
    },
    {
      id: 'r006',
      title: 'Raspberry Pi 4 (4GB) + Case + Power Supply',
      description: 'Raspberry Pi 4 Model B 4GB RAM with official case, power adapter, and a 32GB pre-loaded SD card. Use for your semester project and return in the same condition.',
      category: 'electronics',
      subject: 'Computer Science & Engineering',
      tags: ['raspberry pi', 'embedded', 'linux', 'IoT'],
      type: 'physical',
      condition: 'Good',
      exchangeMode: 'borrow',
      price: 0,
      deposit: 1500,
      availability: 'borrowed',
      location: 'CSE Department Storeroom',
      images: [
        'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1562975079-50953a925695?auto=format&fit=crop&w=800&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&q=80',
      ownerId: 'u_primary',
      ownerName: 'Yugandhar Chandu',
      ownerDept: 'Computer Science & Engineering',
      rating: 5.0,
      reviewCount: 4,
      views: 76,
      createdAt: '2026-10-05T12:00:00Z',
      status: 'approved',
    },
    {
      id: 'r007',
      title: 'Engineering Mathematics Vol. I & II – R.K. Jain',
      description: 'Set of 2 textbooks for Engineering Mathematics. Covers Calculus, Linear Algebra, ODEs, and PDEs. Useful for first and second year students.',
      category: 'books',
      subject: 'Mathematics',
      tags: ['mathematics', 'engineering maths', 'calculus', 'linear algebra'],
      type: 'physical',
      condition: 'Good',
      exchangeMode: 'sell',
      price: 250,
      availability: 'available',
      location: 'Girls Hostel Block C',
      images: [
        'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
      ownerId: 'u_primary',
      ownerName: 'Yugandhar Chandu',
      ownerDept: 'Computer Science & Engineering',
      rating: 4.3,
      reviewCount: 6,
      views: 52,
      createdAt: '2026-10-07T16:00:00Z',
      status: 'approved',
    },
    {
      id: 'r008',
      title: 'IoT & Embedded Systems – Full Slide Deck',
      description: 'Complete PowerPoint presentation slides covering Introduction to IoT, Protocol Stack, MQTT, Edge Computing, and Case Studies. 220 slides across 8 modules.',
      category: 'slides',
      subject: 'Internet of Things',
      tags: ['IoT', 'embedded systems', 'MQTT', 'slides', 'presentation'],
      type: 'digital',
      exchangeMode: 'free',
      price: 0,
      availability: 'available',
      images: [
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
      fileUrl: '#demo-file',
      ownerId: 'u_primary',
      ownerName: 'Yugandhar Chandu',
      ownerDept: 'Computer Science & Engineering',
      rating: 4.4,
      reviewCount: 9,
      views: 145,
      createdAt: '2026-10-08T10:00:00Z',
      status: 'approved',
    },
    {
      id: 'r009',
      title: 'Vernier Calipers + Micrometer Screw Gauge Set',
      description: 'Precision measuring instruments for Mechanical Engineering lab practicals. Stored in original case. Please return cleaned after use.',
      category: 'lab',
      subject: 'Mechanical Engineering',
      tags: ['vernier', 'micrometer', 'precision', 'metrology', 'ME lab'],
      type: 'physical',
      condition: 'Excellent',
      exchangeMode: 'borrow',
      price: 0,
      deposit: 300,
      availability: 'available',
      location: 'Mech Lab, Building B',
      images: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      ownerId: 'u_primary',
      ownerName: 'Yugandhar Chandu',
      ownerDept: 'Computer Science & Engineering',
      rating: 4.8,
      reviewCount: 5,
      views: 33,
      createdAt: '2026-10-09T09:30:00Z',
      status: 'approved',
    },
    {
      id: 'r010',
      title: 'Analog Communication Lab Manual – 6th Sem',
      description: 'Detailed lab manual with circuit diagrams, procedure, observations, and viva questions for all 10 Analog Communication experiments.',
      category: 'manuals',
      subject: 'Analog Communication',
      tags: ['analog communication', 'lab manual', 'EC', '6th sem'],
      type: 'digital',
      exchangeMode: 'free',
      price: 0,
      availability: 'available',
      images: [
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
      fileUrl: '#demo-file',
      ownerId: 'u_primary',
      ownerName: 'Yugandhar Chandu',
      ownerDept: 'Computer Science & Engineering',
      rating: 4.7,
      reviewCount: 11,
      views: 189,
      createdAt: '2026-10-10T14:00:00Z',
      status: 'approved',
    },
    {
      id: 'r011',
      title: 'Project Materials Kit – Wooden Boards, Wires, Connectors',
      description: 'Assorted project materials including plywood sheets, copper wires (various gauges), terminal connectors, glue gun, and basic hand tools. Great for final-year project builds.',
      category: 'materials',
      subject: 'General',
      tags: ['project materials', 'wood', 'wires', 'connectors', 'tools'],
      type: 'physical',
      condition: 'Good',
      exchangeMode: 'free',
      price: 0,
      availability: 'available',
      location: 'Workshop, Ground Floor',
      images: [
        'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80',
      ownerId: 'u_primary',
      ownerName: 'Yugandhar Chandu',
      ownerDept: 'Computer Science & Engineering',
      rating: 0,
      reviewCount: 0,
      views: 18,
      createdAt: '2026-10-12T11:00:00Z',
      status: 'approved',
    },
    {
      id: 'r012',
      title: 'Database Management Systems – Ramakrishnan & Gehrke',
      description: 'Classic DBMS textbook. Covers relational algebra, SQL, indexing, transactions, and query optimization. 3rd edition, clean condition, no markings.',
      category: 'books',
      subject: 'Database Systems',
      tags: ['DBMS', 'database', 'SQL', 'textbook', 'ramakrishnan'],
      type: 'physical',
      condition: 'Excellent',
      exchangeMode: 'sell',
      price: 420,
      availability: 'available',
      location: 'CS Block, 3rd Floor',
      images: [
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
      ownerId: 'u_primary',
      ownerName: 'Yugandhar Chandu',
      ownerDept: 'Computer Science & Engineering',
      rating: 4.9,
      reviewCount: 7,
      views: 61,
      createdAt: '2026-10-13T13:00:00Z',
      status: 'approved',
    },
  ],

  /* ──────────────────────────────────────────────────────────────
     USERS
     ────────────────────────────────────────────────────────────── */
  users: [],

  /* ──────────────────────────────────────────────────────────────
     DEMO LOGGED-IN USER (simulates an auth session)
     ────────────────────────────────────────────────────────────── */
  currentUser: null,

  /* ──────────────────────────────────────────────────────────────
     RESERVATIONS
     ────────────────────────────────────────────────────────────── */
  reservations: [],

  /* ──────────────────────────────────────────────────────────────
     TRANSACTIONS (Clean - No fake exchanges)
     ────────────────────────────────────────────────────────────── */
  transactions: [],

  /* ──────────────────────────────────────────────────────────────
     NOTIFICATIONS (Clean - No fake notifications)
     ────────────────────────────────────────────────────────────── */
  notifications: [],

  /* ──────────────────────────────────────────────────────────────
     REQUIREMENTS (Clean - No fake requirements)
     ────────────────────────────────────────────────────────────── */
  requirements: [],

  /* ──────────────────────────────────────────────────────────────
     REVIEWS (Clean - No fake reviews)
     ────────────────────────────────────────────────────────────── */
  reviews: [],

  /* ──────────────────────────────────────────────────────────────
     ADMIN ANALYTICS (Clean platform metrics)
     ────────────────────────────────────────────────────────────── */
  analytics: {
    totalUsers: 2,
    totalResources: 12,
    physicalResources: 8,
    digitalResources: 4,
    pendingListings: 0,
    activeReservations: 0,
    completedTransactions: 0,
    reportedContent: 0,
    resourcesByCategory: {
      'Books & Textbooks': 4,
      'Electronics & IoT': 2,
      'Lab Equipment': 2,
      'Project Materials': 1,
      'Notes & PDFs': 1,
      'Question Papers': 1,
      'Presentations': 1,
      'Lab Manuals': 0,
    },
    monthlyListings: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    monthlyReservations: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    months: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
  },
};

// Freeze top-level object (arrays inside are still mutable for demo interactions)
Object.freeze(DEMO_DATA);
window.DEMO_DATA = DEMO_DATA;
