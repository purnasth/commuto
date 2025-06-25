import { getCurrentYear } from '../utils/functions';

import rider from '../assets/vector/hero-rider.svg';
import passenger from '../assets/vector/passenger.svg';

import type { RedeemableReward } from '../interfaces/types';

export const mockLocations = [
  // Educational Institutions
  {
    id: '1',
    name: 'Kathmandu BernHardt College',
    address: 'Bafal, Kathmandu',
    type: 'College',
    lat: 27.705235,
    lng: 85.282379,
  },
  {
    id: '2',
    name: 'Tribhuvan University',
    address: 'Kirtipur, Kathmandu',
    type: 'University',
    lat: 27.680588,
    lng: 85.277428,
  },
  {
    id: '3',
    name: 'Nepal Engineering College',
    address: 'Changunarayan, Bhaktapur',
    type: 'College',
    lat: 27.721506,
    lng: 85.427964,
  },
  {
    id: '4',
    name: 'Kathmandu University',
    address: 'Dhulikhel, Kavre',
    type: 'University',
    lat: 27.622882,
    lng: 85.544922,
  },

  // Religious Sites
  {
    id: '5',
    name: 'Boudhanath Stupa',
    address: 'Boudha, Kathmandu',
    type: 'UNESCO World Heritage Site',
    lat: 27.721506,
    lng: 85.362056,
  },
  {
    id: '6',
    name: 'Pashupatinath Temple',
    address: 'Gaushala, Kathmandu',
    type: 'Hindu Temple',
    lat: 27.710446,
    lng: 85.348838,
  },
  {
    id: '7',
    name: 'Swayambhunath Temple',
    address: 'Swayambhu, Kathmandu',
    type: 'Buddhist Temple',
    lat: 27.71493,
    lng: 85.29018,
  },
  {
    id: '8',
    name: 'Changu Narayan Temple',
    address: 'Bhaktapur District',
    type: 'UNESCO World Heritage Site',
    lat: 27.717245,
    lng: 85.427964,
  },

  // Historical Sites
  {
    id: '9',
    name: 'Kathmandu Durbar Square',
    address: 'Kathmandu',
    type: 'Historical Square',
    lat: 27.704589,
    lng: 85.307732,
  },
  {
    id: '10',
    name: 'Patan Durbar Square',
    address: 'Lalitpur, Kathmandu Valley',
    type: 'Historical Square',
    lat: 27.673197,
    lng: 85.325247,
  },
  {
    id: '11',
    name: 'Bhaktapur Durbar Square',
    address: 'Bhaktapur',
    type: 'Historical Square',
    lat: 27.672812,
    lng: 85.428038,
  },
  {
    id: '12',
    name: 'Narayanhiti Palace Museum',
    address: 'Kathmandu',
    type: 'Museum',
    lat: 27.717245,
    lng: 85.317497,
  },

  // Malls and Shopping
  {
    id: '13',
    name: 'Civil Mall',
    address: 'New Baneshwor, Kathmandu',
    type: 'Shopping Mall',
    lat: 27.693773,
    lng: 85.323213,
  },
  {
    id: '14',
    name: 'Bhatbhateni Supermarket',
    address: 'Multiple Locations, Kathmandu',
    type: 'Supermarket',
    lat: 27.717245,
    lng: 85.324028,
  },
  {
    id: '15',
    name: 'Kathmandu Mall',
    address: 'New Road, Kathmandu',
    type: 'Shopping Mall',
    lat: 27.705235,
    lng: 85.312329,
  },
  {
    id: '16',
    name: 'Thamel Market',
    address: 'Thamel, Kathmandu',
    type: 'Tourist Shopping Area',
    lat: 27.715393,
    lng: 85.312329,
  },

  // Parks and Natural Sites
  {
    id: '17',
    name: 'Shivapuri-Nagarjun National Park',
    address: 'Kathmandu Valley',
    type: 'National Park',
    lat: 27.801389,
    lng: 85.366667,
  },
  {
    id: '18',
    name: 'Garden of Dreams',
    address: 'Kaiser Mahal, Kathmandu',
    type: 'Urban Park',
    lat: 27.715393,
    lng: 85.316666,
  },
  {
    id: '19',
    name: 'Nagarkot',
    address: 'Bhaktapur District',
    type: 'Scenic Viewpoint',
    lat: 27.715833,
    lng: 85.520833,
  },
  {
    id: '20',
    name: 'Chandragiri Hills',
    address: 'Southwest of Kathmandu',
    type: 'Hill Station',
    lat: 27.666667,
    lng: 85.233333,
  },

  // Cultural Centers
  {
    id: '21',
    name: 'Nepal Academy',
    address: 'Kamaladi, Kathmandu',
    type: 'Cultural Institution',
    lat: 27.709911,
    lng: 85.320091,
  },
  {
    id: '22',
    name: 'Kopan Monastery',
    address: 'Kopan, Kathmandu',
    type: 'Buddhist Monastery',
    lat: 27.7481,
    lng: 85.3556,
  },
  {
    id: '23',
    name: 'National Museum of Nepal',
    address: 'Chhauni, Kathmandu',
    type: 'Museum',
    lat: 27.7101,
    lng: 85.2896,
  },
  {
    id: '24',
    name: 'Patan Museum',
    address: 'Patan Durbar Square',
    type: 'Art Museum',
    lat: 27.6727,
    lng: 85.3252,
  },

  // Additional Landmarks
  {
    id: '25',
    name: 'Budha Nilkant Temple',
    address: 'Budhanilkantha, Kathmandu',
    type: 'Hindu Temple',
    lat: 27.7891,
    lng: 85.3621,
  },
  {
    id: '26',
    name: 'Jagannath Temple',
    address: 'Kathmandu',
    type: 'Hindu Temple',
    lat: 27.7046,
    lng: 85.3077,
  },
  {
    id: '27',
    name: 'Dakshinkali Temple',
    address: 'Pharping, Kathmandu',
    type: 'Hindu Temple',
    lat: 27.6136,
    lng: 85.2647,
  },
  {
    id: '28',
    name: 'Tribhuven Museum',
    address: 'Kathmandu Durbar Square',
    type: 'Museum',
    lat: 27.7046,
    lng: 85.3077,
  },

  // Additional Locations
  {
    id: '29',
    name: 'Itum Bahal',
    address: 'Thamel, Kathmandu',
    type: 'Historical Site',
    lat: 27.7136,
    lng: 85.3123,
  },
  {
    id: '30',
    name: 'Asan Bazaar',
    address: 'Asan, Kathmandu',
    type: 'Traditional Market',
    lat: 27.7086,
    lng: 85.3122,
  },
  {
    id: '31',
    name: 'Taudaha Lake',
    address: 'Taudaha, Kathmandu Valley',
    type: 'Natural Site',
    lat: 27.6501,
    lng: 85.2737,
  },
  {
    id: '32',
    name: 'White Gumba (Seto Gumba)',
    address: 'Boudha, Kathmandu',
    type: 'Buddhist Monastery',
    lat: 27.7481,
    lng: 85.3556,
  },
  {
    id: '33',
    name: 'Kirtipur',
    address: 'Kirtipur, Kathmandu',
    type: 'Historical Town',
    lat: 27.6781,
    lng: 85.2774,
  },
  {
    id: '34',
    name: 'Pharping',
    address: 'Pharping, Kathmandu',
    type: 'Pilgrimage Site',
    lat: 27.6136,
    lng: 85.2647,
  },

  // Educational and Research Centers
  {
    id: '35',
    name: 'Central Department of Geology, TU',
    address: 'Kirtipur, Kathmandu',
    type: 'Research Center',
    lat: 27.680588,
    lng: 85.277428,
  },
  {
    id: '36',
    name: 'Nepal Academy of Science and Technology',
    address: 'Lalitpur, Kathmandu',
    type: 'Research Institute',
    lat: 27.6674,
    lng: 85.3206,
  },
  {
    id: '37',
    name: 'Kathmandu University School of Arts',
    address: 'Dhulikhel, Kavre',
    type: 'Educational Institution',
    lat: 27.622882,
    lng: 85.544922,
  },
  {
    id: '38',
    name: 'Nepal Engineering College',
    address: 'Bhaktapur',
    type: 'Technical College',
    lat: 27.721506,
    lng: 85.427964,
  },

  // Additional Cultural and Historical Sites
  {
    id: '39',
    name: 'Kumari Ghar',
    address: 'Kumari Ghar, Kathmandu',
    type: 'Cultural Landmark',
    lat: 27.704589,
    lng: 85.307732,
  },
  {
    id: '40',
    name: 'Hanuman Dhoka Palace',
    address: 'Basantapur, Kathmandu',
    type: 'Historical Palace',
    lat: 27.704589,
    lng: 85.307732,
  },
  {
    id: '41',
    name: 'Kasthamandap',
    address: 'Kasthamandap, Kathmandu',
    type: 'Historical Pavilion',
    lat: 27.704589,
    lng: 85.307732,
  },
  {
    id: '42',
    name: 'Maju Deval',
    address: 'Kathmandu Durbar Square',
    type: 'Historic Temple',
    lat: 27.704589,
    lng: 85.307732,
  },

  // Modern Attractions
  {
    id: '43',
    name: 'Thamel Chowk',
    address: 'Thamel, Kathmandu',
    type: 'Tourist Hub',
    lat: 27.715393,
    lng: 85.312329,
  },
  {
    id: '44',
    name: 'Basantapur Tower',
    address: 'Kathmandu Durbar Square',
    type: 'Historical Landmark',
    lat: 27.704589,
    lng: 85.307732,
  },
  {
    id: '45',
    name: 'Freak Street',
    address: 'Kathmandu',
    type: 'Historical Neighborhood',
    lat: 27.7036,
    lng: 85.3077,
  },

  // Additional Religious Sites
  {
    id: '46',
    name: 'Krishna Mandir',
    address: 'Patan Durbar Square',
    type: 'Hindu Temple',
    lat: 27.6727,
    lng: 85.3252,
  },
  {
    id: '47',
    name: 'Mahaboudha Temple',
    address: 'Patan, Kathmandu',
    type: 'Buddhist Temple',
    lat: 27.6727,
    lng: 85.3252,
  },
  {
    id: '48',
    name: 'Kumbeshwar Temple',
    address: 'Lalitpur, Kathmandu',
    type: 'Hindu Temple',
    lat: 27.6761,
    lng: 85.3246,
  },

  // Natural and Scenic Locations
  {
    id: '49',
    name: 'Godavari Botanical Garden',
    address: 'Lalitpur District',
    type: 'Nature Reserve',
    lat: 27.5916,
    lng: 85.3902,
  },
  {
    id: '50',
    name: 'Shivapuri Peak',
    address: 'Shivapuri-Nagarjun National Park',
    type: 'Hiking Destination',
    lat: 27.8333,
    lng: 85.3833,
  },
  {
    id: '51',
    name: 'Sundarijal',
    address: 'Kathmandu Valley',
    type: 'Scenic Waterfall',
    lat: 27.7931,
    lng: 85.4231,
  },
  {
    id: '52',
    name: 'Chobhar Gorge',
    address: 'Kirtipur, Kathmandu',
    type: 'Natural Landmark',
    lat: 27.65,
    lng: 85.2833,
  },

  // Additional Modern Facilities
  {
    id: '53',
    name: 'Tribhuvan International Airport',
    address: 'Kathmandu',
    type: 'Transportation Hub',
    lat: 27.6981,
    lng: 85.3591,
  },
  {
    id: '54',
    name: 'Nepal Stock Exchange',
    address: 'Kathmandu',
    type: 'Financial Institution',
    lat: 27.7017,
    lng: 85.3206,
  },
  {
    id: '55',
    name: 'National Stadium',
    address: 'Kathmandu',
    type: 'Sports Facility',
    lat: 27.6939,
    lng: 85.3232,
  },
  {
    id: '56',
    name: 'Nepal Telecom Headquarters',
    address: 'Kathmandu',
    type: 'Telecommunications',
    lat: 27.7058,
    lng: 85.3267,
  },

  // Final Unique Locations
  {
    id: '57',
    name: 'Kathmandu Guest House',
    address: 'Thamel, Kathmandu',
    type: 'Accommodation',
    lat: 27.715393,
    lng: 85.312329,
  },
  {
    id: '58',
    name: 'Ratna Rajya Library',
    address: 'Kathmandu',
    type: 'Public Library',
    lat: 27.7052,
    lng: 85.3123,
  },
  {
    id: '59',
    name: 'National Archives',
    address: 'Kathmandu',
    type: 'Historical Repository',
    lat: 27.7052,
    lng: 85.3123,
  },
  {
    id: '60',
    name: 'Rato Machindranath Temple',
    address: 'Patan, Kathmandu',
    type: 'Religious Site',
    lat: 27.6727,
    lng: 85.3252,
  },

  {
    id: '61',
    name: 'Islington College',
    address: 'Kathmandu',
    type: 'IT College',
    lat: 27.7126,
    lng: 85.3282,
  },
  {
    id: '62',
    name: 'Ace Institute of Management',
    address: 'Kathmandu',
    type: 'Management & IT College',
    lat: 27.7126,
    lng: 85.3282,
  },
  {
    id: '63',
    name: 'Kathmandu Institute of Technology',
    address: 'Dhapasi, Kathmandu',
    type: 'Technology College',
    lat: 27.7406,
    lng: 85.3247,
  },
  {
    id: '64',
    name: 'Chelsea International Academy',
    address: 'Kathmandu',
    type: 'International IT College',
    lat: 27.7126,
    lng: 85.3282,
  },
  {
    id: '65',
    name: 'Global College International',
    address: 'Kathmandu',
    type: 'IT and Management College',
    lat: 27.7126,
    lng: 85.3282,
  },
  {
    id: '66',
    name: 'Orient College of Science and Management',
    address: 'Kathmandu',
    type: 'Technology College',
    lat: 27.7126,
    lng: 85.3282,
  },
  {
    id: '67',
    name: 'Malpi Institute',
    address: 'Kathmandu',
    type: 'IT and Technical Institute',
    lat: 27.7126,
    lng: 85.3282,
  },
  {
    id: '68',
    name: 'Nami College',
    address: 'Kathmandu',
    type: 'Technical College',
    lat: 27.7126,
    lng: 85.3282,
  },
  {
    id: '69',
    name: 'Kaasthamandap A Level Academy',
    address: 'Kathmandu',
    type: 'Advanced Technology College',
    lat: 27.7126,
    lng: 85.3282,
  },
  {
    id: '70',
    name: 'Victoria Technical College',
    address: 'Koteshwor, Kathmandu',
    type: 'Technical Institute',
    lat: 27.6781,
    lng: 85.3535,
  },

  // Additional Educational Institutions
  {
    id: '71',
    name: 'All Nepal College of Technical Education',
    address: 'Gaushala, Kathmandu',
    type: 'Technical College',
    lat: 27.7058,
    lng: 85.3466,
  },
  {
    id: '72',
    name: 'Kantipur Community Health Services',
    address: 'Balaju, Kathmandu',
    type: 'Technical Institute',
    lat: 27.7286,
    lng: 85.2971,
  },
  {
    id: '73',
    name: 'Sumnima Polytechnic Institute',
    address: 'Kathmandu',
    type: 'Polytechnic College',
    lat: 27.7126,
    lng: 85.3282,
  },
  {
    id: '74',
    name: 'Emerald Technical School',
    address: 'Balaju, Kathmandu',
    type: 'Technical School',
    lat: 27.7286,
    lng: 85.2971,
  },
  {
    id: '75',
    name: 'Singh Academy',
    address: 'Samakhushi, Kathmandu',
    type: 'Educational Institute',
    lat: 27.7306,
    lng: 85.3206,
  },
  {
    id: '76',
    name: 'Technical Training & Research Institute',
    address: 'Kumaripati, Lalitpur',
    type: 'Research and Training Center',
    lat: 27.6674,
    lng: 85.3206,
  },
  {
    id: '77',
    name: 'Kantipur Technical College',
    address: 'Balaju, Kathmandu',
    type: 'Technical College',
    lat: 27.7286,
    lng: 85.2971,
  },
  {
    id: '78',
    name: 'United Technical School',
    address: 'Kumaripati, Lalitpur',
    type: 'Technical School',
    lat: 27.6674,
    lng: 85.3206,
  },
  {
    id: '79',
    name: 'Spark Institute of Technology',
    address: 'Kathmandu',
    type: 'Technology Institute',
    lat: 27.7126,
    lng: 85.3282,
  },
  {
    id: '80',
    name: 'Norvic Institute of Nursing Education',
    address: 'Maharajgunj, Kathmandu',
    type: 'Specialized Education Institute',
    lat: 27.7396,
    lng: 85.3352,
  },

  // University Campuses and Specialized Institutions
  {
    id: '81',
    name: 'Tribhuvan University School of Engineering',
    address: 'Kirtipur, Kathmandu',
    type: 'University Campus',
    lat: 27.680588,
    lng: 85.277428,
  },
  {
    id: '82',
    name: 'Kathmandu University School of Computing',
    address: 'Dhulikhel, Kavre',
    type: 'Technology School',
    lat: 27.622882,
    lng: 85.544922,
  },
  {
    id: '83',
    name: 'Tribhuvan University Central Department of Computer Science',
    address: 'Kirtipur, Kathmandu',
    type: 'Research Department',
    lat: 27.680588,
    lng: 85.277428,
  },
  {
    id: '84',
    name: 'Nepal Engineering College',
    address: 'Kathmandu Valley',
    type: 'Engineering Institute',
    lat: 27.721506,
    lng: 85.427964,
  },
  {
    id: '85',
    name: 'Advanced College of Technology',
    address: 'Kathmandu',
    type: 'Technology College',
    lat: 27.7126,
    lng: 85.3282,
  },

  // Addition of Software companies
  {
    id: '86',
    name: 'Leapfrog Technology',
    address: 'Dilllibazar, Kathmandu',
    type: 'Software Company',
    lat: 27.7073192,
    lng: 85.3274236,
  },
  {
    id: '87',
    name: 'Deerwalk Institute of Technology',
    address: 'Jaya Bageshwori Road, Bhaktapur',
    type: 'Software Company',
    lat: 27.671,
    lng: 85.4278,
  },
  {
    id: '88',
    name: 'CloudFactory',
    address: 'Lalitpur, Nepal',
    type: 'Software Company',
    lat: 27.6644,
    lng: 85.3188,
  },
  {
    id: '89',
    name: 'Verisk Nepal',
    address: 'Pulchowk, Kathmandu',
    type: 'Software Company',
    lat: 27.6781,
    lng: 85.3188,
  },
  {
    id: '90',
    name: 'F1Soft International',
    address: 'Group Tower, Lalitpur, Kathmandu',
    type: 'Software Company',
    lat: 27.6781,
    lng: 85.3188,
  },
];

export const faqContents = [
  {
    question: 'What is the purpose of this web app?',
    answer:
      'This web app helps connect riders and passengers, allowing them to coordinate commutes efficiently. ',
  },
  {
    question: 'Which technologies are used in this project?',
    answer:
      'The frontend uses Vite, React.js, TypeScript, TailwindCSS, and pnpm, while the backend uses .NET Core with C#.',
  },
  {
    question: 'How can I post or search for a ride?',
    answer:
      "Simply fill in the 'From' and 'To' locations, select your role (Rider/Passenger), and confirm your ride details.",
  },
  {
    question: 'Is there real-time suggestion functionality?',
    answer:
      "Yes, the app provides real-time suggestions for 'From' and 'To' locations based on your input.",
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes, we prioritize data security and use secure communication protocols.',
  },
  {
    question: 'Can I change my role from Rider to Passenger later?',
    answer:
      'Yes, you can update your role anytime from your profile or while posting a ride.',
  },
  {
    question: 'Why was Commuto developed?',
    answer:
      'Commuto was developed to make daily commutes easier and more efficient by connecting riders and passengers.',
  },
  {
    question: 'What is the vision and mission of Commuto?',
    answer:
      'Our Vision is to live in a world where we all share resources to better preserve our economy and planet. Our Mission is to fill the empty seats in our ride and make our commute more affordable and sustainable.',
  },
  {
    question: 'Is Commuto profit-oriented?',
    answer:
      "Commuto is non profit-oriented and aims to provide a free service to the community and help reduce carbon emissions. It doesn't generate any revenue from the platform.",
  },
];

export const quickMessages = [
  "I'm leaving now",
  "I'll be there in 5 minutes",
  'See you at the location',
];

export const footerLinks = [
  {
    id: 'policies',
    title: 'Terms & Policies',
    link: '/legal/policies',
  },
  {
    id: 'copyright',
    title: 'Trademark & Copyright',
    link: '/legal/copyright',
  },
  {
    id: 'brand',
    title: 'Brand Guidelines',
    link: '/brand',
  },
];

export const policies = [
  {
    id: 'terms',
    title: 'Terms of Service',
    description:
      'By using Commuto, you agree to abide by the following terms and conditions. These terms are designed to ensure a safe, respectful, and reliable experience for all users.',
    list: [
      'Provide accurate and up-to-date information when creating your account and booking rides.',
      'Respect other users and adhere to community guidelines at all times.',
      'Do not misuse the platform for fraudulent, illegal, or harmful activities.',
      'Any misuse of the platform may result in account suspension or termination.',
      'Commuto reserves the right to update these terms at any time. Continued use of the platform constitutes acceptance of any changes.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    description:
      'Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.',
    list: [
      'We collect only the necessary information to provide our services, such as your name, email, and ride details.',
      'Your data is stored securely and is not shared with third parties without your explicit consent, except as required by law.',
      'We use industry-standard security measures to protect your information from unauthorized access.',
      'You can request to delete your account and associated data at any time by contacting support.',
      'We may use anonymized data for analytics and service improvement.',
    ],
  },
  {
    id: 'cancellation',
    title: 'Ride Cancellation Policy',
    description:
      'We understand that plans can change. Our cancellation policy is designed to be fair to both riders and passengers.',
    list: [
      'Cancellations made within 30 minutes of the ride start time may incur a penalty or affect your reliability rating.',
      'Repeated last-minute cancellations may result in temporary suspension of your account.',
      'If you need to cancel due to an emergency, please contact support for assistance.',
      'We encourage timely communication with your ride partners if you need to cancel or reschedule.',
    ],
  },
  {
    id: 'community',
    title: 'Community Guidelines',
    description:
      'To foster a positive and respectful community, all users are expected to:',
    list: [
      'Treat others with respect, kindness, and consideration.',
      'Communicate clearly and promptly with your ride partners.',
      'Report any inappropriate behavior or safety concerns to Commuto support.',
      'Help maintain a safe, inclusive, and welcoming environment for everyone.',
    ],
  },
  {
    id: 'safety',
    title: 'Safety Policy',
    description:
      'Your safety is our top priority. Please follow these guidelines to ensure a safe commute:',
    list: [
      'Verify the identity of your ride partners before starting a trip.',
      'Share your trip details with a trusted contact if possible.',
      'Follow all local traffic laws and safety regulations.',
      'Do not share sensitive personal information with strangers.',
      'Contact support immediately if you feel unsafe or experience any issues during your ride.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact & Support',
    description:
      'If you have any questions, concerns, or need assistance regarding our policies or your experience on Commuto, please contact us.',
    list: [],
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    description:
      'The information provided on this page is for general guidance only and does not constitute legal advice. For specific legal concerns, please consult a qualified attorney.',
    list: [],
  },
];

export const copyrightSections = [
  {
    id: 'trademark',
    title: 'Commuto Trademark',
    description:
      'The name Commuto, its logo, and all related brand assets are trademarks of Commuto. These trademarks are protected by applicable intellectual property laws and may not be used, reproduced, or distributed without explicit written permission from the Commuto team.',
    list: [
      'Do not use the Commuto name or logo in a way that suggests endorsement or partnership without permission.',
      'Do not modify, distort, or alter the Commuto logo or brand assets in any way.',
      'Do not use Commuto trademarks as part of your own product, service, or company name.',
    ],
  },
  {
    id: 'copyright',
    title: 'Copyright Notice',
    description:
      '© ' +
      getCurrentYear() +
      ' Commuto. All rights reserved. All content, including but not limited to text, graphics, logos, icons, images, and software, is the property of Commuto or its content suppliers and is protected by international copyright laws.',
    list: [
      'You may not copy, reproduce, republish, upload, post, transmit, or distribute any material from this website without prior written consent from Commuto.',
      'Content may be used for personal, non-commercial reference only, provided that all copyright and proprietary notices remain intact.',
      'Any unauthorized use of the content may violate copyright, trademark, and other laws.',
    ],
  },
  {
    id: 'thirdparty',
    title: 'Third-Party Content & Attribution',
    description:
      'Some images, icons, or other assets used on this website may be the property of third parties and are used under license or with permission. All such content is credited to its respective owners where required.',
    list: [
      'If you believe your copyrighted work has been used in a way that constitutes copyright infringement, please contact us with details for prompt resolution.',
    ],
  },
  {
    id: 'reporting',
    title: 'Reporting Violations',
    description:
      'If you notice any misuse of Commuto trademarks or copyrighted materials, or have questions about proper use, please contact us at hello@commuto.app.',
    list: [],
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    description:
      'The information provided on this page is for general guidance only and does not constitute legal advice. For specific legal concerns, please consult a qualified attorney.',
    list: [],
  },
];

export const legalPages = [
  {
    id: 'policies',
    title: 'Terms, Policies & Legal',
    intro:
      'This page outlines the key policies, terms, and legal information for using Commuto. Please read carefully to understand your rights, responsibilities, and our commitment to your privacy, safety, and a positive community experience.',
    sections: policies,
  },
  {
    id: 'copyright',
    title: 'Trademark and Copyright Notice',
    intro:
      "This page outlines the trademark and copyright policies for Commuto. Unauthorized use of our trademarks or copyrighted materials may result in legal action. Please read carefully to understand your rights and responsibilities regarding the use of Commuto's intellectual property.",
    sections: copyrightSections,
  },
];

export const userRoles = [
  {
    id: 'rider',
    router: '/roles/rider',
    title: 'Post a ride & Make an Impact',
    description:
      'Share your ride with your co-workers and students sharing the same route and utilize the resources and empty seats of your vehicle. Save money, time and the environment. Your ride can make a difference. Share your ride now & be a hero!',
    rulesSpan: 'Rules when posting a ride',
    rulesTitle: 'Share a ride, Be a hero & Save the Environment',
    heroImage: rider,
    rules: [
      {
        title: 'Carry Documents',
        description:
          'Owning a valid driving license is a must to post a ride & you should be carrying them.',
      },
      {
        title: 'Be Reliable',
        description:
          "Only post a ride if you are sure you're going to the destination and be on time.",
      },
      {
        title: 'Be Courteous',
        description:
          'Be polite to your passengers and respect their time and comfort.',
      },
      {
        title: 'Drive Safely',
        description:
          'Stick to the speed limit and follow the traffic rules. Safety of you and your passengers is important.',
      },
    ],
  },
  {
    id: 'passenger',
    router: '/roles/passenger',
    title: 'Share a ride & Save the Environment',
    description:
      'Search for a hero who is going to the same destination as you and share a ride with them. Save money, time and the environment. Your ride can make an impact for an environment. Share the ride. Share the memories.',
    rulesSpan: 'Rules when requesting a ride',
    rulesTitle: 'Share a ride, Save the Environment',
    heroImage: passenger,
    rules: [
      {
        title: 'Be Accessible',
        description:
          'Be on the location on time and be ready for pickup when the hero',
      },
      {
        title: 'Be Courteous',
        description:
          'Be polite to your rider and respect their time and comfort.',
      },
      {
        title: 'Be Friendly',
        description:
          'Engage in pleasant conversation and make the ride enjoyable for everyone.',
      },
      {
        title: 'Be Safe',
        description:
          'Follow all safety guidelines as a passenger and ensure the ride is safe for everyone.',
      },
    ],
  },
];

export const navLinks = [
  {
    id: 1,
    title: 'Get Home',
    link: '/',
  },
  {
    id: 2,
    title: 'Find a Ride',
    link: '/role/passenger',
  },
  {
    id: 3,
    title: 'Post a Ride',
    link: '/role/rider',
  },
];

export const findRideFormFields: Array<{
  name: 'from' | 'to' | 'message' | 'role';
  label: string;
  type: string;
  placeholder?: string;
  options?: string[];
}> = [
  {
    name: 'from',
    label: 'From',
    type: 'text',
    placeholder: 'Current Location',
  },
  {
    name: 'to',
    label: 'To',
    type: 'text',
    placeholder: 'Kathmandu BernHardt College',
  },
  {
    name: 'message',
    label: 'Message',
    type: 'text',
    placeholder: "I'm leaving in 5 minutes",
  },
  {
    name: 'role',
    label: "I'm a",
    type: 'select',
    options: ['Rider', 'Passenger'],
  },
];

export const redeemables: RedeemableReward[] = [
  {
    name: 'College T-Shirt',
    points: 100,
    description: 'Official college T-shirt. Show your pride!',
  },
  {
    name: 'College Mug',
    points: 60,
    description: 'Reusable mug for your daily coffee or tea.',
  },
  {
    name: 'Library Voucher',
    points: 40,
    description: 'Voucher for late fee waivers or book borrowing.',
  },
  {
    name: 'Canteen Coupon',
    points: 30,
    description: 'Free meal or snack at the college canteen.',
  },
  {
    name: 'Lab Access Pass',
    points: 80,
    description: 'Priority access to computer labs for your projects.',
  },
  {
    name: 'Event Ticket',
    points: 50,
    description: 'Entry to college fests, concerts, or sports events.',
  },
  {
    name: 'Bus Pass',
    points: 120,
    description: 'Monthly bus pass for easy campus commute.',
  },
  {
    name: 'Bicycle Rental',
    points: 25,
    description: 'One-day free bicycle rental on campus.',
  },
  {
    name: 'WiFi Booster',
    points: 35,
    description: 'High-speed WiFi access for a week.',
  },
  {
    name: 'Star Student Badge',
    points: 200,
    description: 'Special badge for your student profile.',
  },
  {
    name: 'Graduation Photo Print',
    points: 70,
    description: 'Free print of your graduation photo.',
  },
  {
    name: 'Game Room Pass',
    points: 45,
    description: 'One-hour access to the student game room.',
  },
  {
    name: 'Music Night Ticket',
    points: 55,
    description: 'Entry to the next campus music night.',
  },
  {
    name: 'Swimming Pool Pass',
    points: 65,
    description: 'One-day access to the college swimming pool.',
  },
  {
    name: 'Wellness Spa Voucher',
    points: 90,
    description: 'Relax with a wellness spa session.',
  },
  {
    name: 'Workshop Entry',
    points: 35,
    description: 'Attend a skill-building workshop.',
  },
  {
    name: 'Parking Spot',
    points: 110,
    description: 'Reserved parking spot for a week.',
  },
  {
    name: 'Movie Night Ticket',
    points: 40,
    description: 'Free ticket to campus movie night.',
  },
  {
    name: 'Eco-Friendly Kit',
    points: 60,
    description: 'Kit with reusable bottle, bag, and utensils.',
  },
  {
    name: 'Coffee Coupon',
    points: 20,
    description: 'Free coffee at the campus café.',
  },
  {
    name: 'Fruit Basket',
    points: 30,
    description: 'Fresh fruit basket from the canteen.',
  },
  {
    name: 'Basketball Court Pass',
    points: 25,
    description: 'One-hour basketball court booking.',
  },
  {
    name: 'Book Club Membership',
    points: 50,
    description: 'Join the campus book club for a semester.',
  },
  {
    name: 'Stationery Pack',
    points: 15,
    description: 'Essential stationery for your studies.',
  },
];
