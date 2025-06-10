import { getCurrentYear } from '../utils/functions';

import rider from '../assets/vector/hero-rider.svg';
import passenger from '../assets/vector/passenger.svg';

export const mockLocations = [
  // Educational Institutions
  {
    id: '1',
    name: 'Kathmandu BernHardt College',
    address: 'Bafal, Kathmandu',
    type: 'College',
  },
  {
    id: '2',
    name: 'Tribhuvan University',
    address: 'Kirtipur, Kathmandu',
    type: 'University',
  },
  {
    id: '3',
    name: 'Nepal Engineering College',
    address: 'Changunarayan, Bhaktapur',
    type: 'College',
  },
  {
    id: '4',
    name: 'Kathmandu University',
    address: 'Dhulikhel, Kavre',
    type: 'University',
  },

  // Religious Sites
  {
    id: '5',
    name: 'Boudhanath Stupa',
    address: 'Boudha, Kathmandu',
    type: 'UNESCO World Heritage Site',
  },
  {
    id: '6',
    name: 'Pashupatinath Temple',
    address: 'Gaushala, Kathmandu',
    type: 'Hindu Temple',
  },
  {
    id: '7',
    name: 'Swayambhunath Temple',
    address: 'Swayambhu, Kathmandu',
    type: 'Buddhist Temple',
  },
  {
    id: '8',
    name: 'Changu Narayan Temple',
    address: 'Bhaktapur District',
    type: 'UNESCO World Heritage Site',
  },

  // Historical Sites
  {
    id: '9',
    name: 'Kathmandu Durbar Square',
    address: 'Kathmandu',
    type: 'Historical Square',
  },
  {
    id: '10',
    name: 'Patan Durbar Square',
    address: 'Lalitpur, Kathmandu Valley',
    type: 'Historical Square',
  },
  {
    id: '11',
    name: 'Bhaktapur Durbar Square',
    address: 'Bhaktapur',
    type: 'Historical Square',
  },
  {
    id: '12',
    name: 'Narayanhiti Palace Museum',
    address: 'Kathmandu',
    type: 'Museum',
  },

  // Malls and Shopping
  {
    id: '13',
    name: 'Civil Mall',
    address: 'New Baneshwor, Kathmandu',
    type: 'Shopping Mall',
  },
  {
    id: '14',
    name: 'Bhatbhateni Supermarket',
    address: 'Multiple Locations, Kathmandu',
    type: 'Supermarket',
  },
  {
    id: '15',
    name: 'Kathmandu Mall',
    address: 'New Road, Kathmandu',
    type: 'Shopping Mall',
  },
  {
    id: '16',
    name: 'Thamel Market',
    address: 'Thamel, Kathmandu',
    type: 'Tourist Shopping Area',
  },

  // Parks and Natural Sites
  {
    id: '17',
    name: 'Shivapuri-Nagarjun National Park',
    address: 'Kathmandu Valley',
    type: 'National Park',
  },
  {
    id: '18',
    name: 'Garden of Dreams',
    address: 'Kaiser Mahal, Kathmandu',
    type: 'Urban Park',
  },
  {
    id: '19',
    name: 'Nagarkot',
    address: 'Bhaktapur District',
    type: 'Scenic Viewpoint',
  },
  {
    id: '20',
    name: 'Chandragiri Hills',
    address: 'Southwest of Kathmandu',
    type: 'Hill Station',
  },

  // Cultural Centers
  {
    id: '21',
    name: 'Nepal Academy',
    address: 'Kamaladi, Kathmandu',
    type: 'Cultural Institution',
  },
  {
    id: '22',
    name: 'Kopan Monastery',
    address: 'Kopan, Kathmandu',
    type: 'Buddhist Monastery',
  },
  {
    id: '23',
    name: 'National Museum of Nepal',
    address: 'Chhauni, Kathmandu',
    type: 'Museum',
  },
  {
    id: '24',
    name: 'Patan Museum',
    address: 'Patan Durbar Square',
    type: 'Art Museum',
  },

  // Additional Landmarks
  {
    id: '25',
    name: 'Budha Nilkant Temple',
    address: 'Budhanilkantha, Kathmandu',
    type: 'Hindu Temple',
  },
  {
    id: '26',
    name: 'Jagannath Temple',
    address: 'Kathmandu',
    type: 'Hindu Temple',
  },
  {
    id: '27',
    name: 'Dakshinkali Temple',
    address: 'Pharping, Kathmandu',
    type: 'Hindu Temple',
  },
  {
    id: '28',
    name: 'Tribhuven Museum',
    address: 'Kathmandu Durbar Square',
    type: 'Museum',
  },

  // Additional Locations
  {
    id: '29',
    name: 'Itum Bahal',
    address: 'Thamel, Kathmandu',
    type: 'Historical Site',
  },
  {
    id: '30',
    name: 'Asan Bazaar',
    address: 'Asan, Kathmandu',
    type: 'Traditional Market',
  },
  {
    id: '31',
    name: 'Taudaha Lake',
    address: 'Taudaha, Kathmandu Valley',
    type: 'Natural Site',
  },
  {
    id: '32',
    name: 'White Gumba (Seto Gumba)',
    address: 'Boudha, Kathmandu',
    type: 'Buddhist Monastery',
  },
  {
    id: '33',
    name: 'Kirtipur',
    address: 'Kirtipur, Kathmandu',
    type: 'Historical Town',
  },
  {
    id: '34',
    name: 'Pharping',
    address: 'Pharping, Kathmandu',
    type: 'Pilgrimage Site',
  },

  // Educational and Research Centers
  {
    id: '35',
    name: 'Central Department of Geology, TU',
    address: 'Kirtipur, Kathmandu',
    type: 'Research Center',
  },
  {
    id: '36',
    name: 'Nepal Academy of Science and Technology',
    address: 'Lalitpur, Kathmandu',
    type: 'Research Institute',
  },
  {
    id: '37',
    name: 'Kathmandu University School of Arts',
    address: 'Dhulikhel, Kavre',
    type: 'Educational Institution',
  },
  {
    id: '38',
    name: 'Nepal Engineering College',
    address: 'Bhaktapur',
    type: 'Technical College',
  },

  // Additional Cultural and Historical Sites
  {
    id: '39',
    name: 'Kumari Ghar',
    address: 'Kumari Ghar, Kathmandu',
    type: 'Cultural Landmark',
  },
  {
    id: '40',
    name: 'Hanuman Dhoka Palace',
    address: 'Basantapur, Kathmandu',
    type: 'Historical Palace',
  },
  {
    id: '41',
    name: 'Kasthamandap',
    address: 'Kasthamandap, Kathmandu',
    type: 'Historical Pavilion',
  },
  {
    id: '42',
    name: 'Maju Deval',
    address: 'Kathmandu Durbar Square',
    type: 'Historic Temple',
  },

  // Modern Attractions
  {
    id: '43',
    name: 'Thamel Chowk',
    address: 'Thamel, Kathmandu',
    type: 'Tourist Hub',
  },
  {
    id: '44',
    name: 'Basantapur Tower',
    address: 'Kathmandu Durbar Square',
    type: 'Historical Landmark',
  },
  {
    id: '45',
    name: 'Freak Street',
    address: 'Kathmandu',
    type: 'Historical Neighborhood',
  },

  // Additional Religious Sites
  {
    id: '46',
    name: 'Krishna Mandir',
    address: 'Patan Durbar Square',
    type: 'Hindu Temple',
  },
  {
    id: '47',
    name: 'Mahaboudha Temple',
    address: 'Patan, Kathmandu',
    type: 'Buddhist Temple',
  },
  {
    id: '48',
    name: 'Kumbeshwar Temple',
    address: 'Lalitpur, Kathmandu',
    type: 'Hindu Temple',
  },

  // Natural and Scenic Locations
  {
    id: '49',
    name: 'Godavari Botanical Garden',
    address: 'Lalitpur District',
    type: 'Nature Reserve',
  },
  {
    id: '50',
    name: 'Shivapuri Peak',
    address: 'Shivapuri-Nagarjun National Park',
    type: 'Hiking Destination',
  },
  {
    id: '51',
    name: 'Sundarijal',
    address: 'Kathmandu Valley',
    type: 'Scenic Waterfall',
  },
  {
    id: '52',
    name: 'Chobhar Gorge',
    address: 'Kirtipur, Kathmandu',
    type: 'Natural Landmark',
  },

  // Additional Modern Facilities
  {
    id: '53',
    name: 'Tribhuvan International Airport',
    address: 'Kathmandu',
    type: 'Transportation Hub',
  },
  {
    id: '54',
    name: 'Nepal Stock Exchange',
    address: 'Kathmandu',
    type: 'Financial Institution',
  },
  {
    id: '55',
    name: 'National Stadium',
    address: 'Kathmandu',
    type: 'Sports Facility',
  },
  {
    id: '56',
    name: 'Nepal Telecom Headquarters',
    address: 'Kathmandu',
    type: 'Telecommunications',
  },

  // Final Unique Locations
  {
    id: '57',
    name: 'Kathmandu Guest House',
    address: 'Thamel, Kathmandu',
    type: 'Accommodation',
  },
  {
    id: '58',
    name: 'Ratna Rajya Library',
    address: 'Kathmandu',
    type: 'Public Library',
  },
  {
    id: '59',
    name: 'National Archives',
    address: 'Kathmandu',
    type: 'Historical Repository',
  },
  {
    id: '60',
    name: 'Rato Machindranath Temple',
    address: 'Patan, Kathmandu',
    type: 'Religious Site',
  },

  {
    id: '61',
    name: 'Islington College',
    address: 'Kathmandu',
    type: 'IT College',
  },
  {
    id: '62',
    name: 'Ace Institute of Management',
    address: 'Kathmandu',
    type: 'Management & IT College',
  },
  {
    id: '63',
    name: 'Kathmandu Institute of Technology',
    address: 'Dhapasi, Kathmandu',
    type: 'Technology College',
  },
  {
    id: '64',
    name: 'Chelsea International Academy',
    address: 'Kathmandu',
    type: 'International IT College',
  },
  {
    id: '65',
    name: 'Global College International',
    address: 'Kathmandu',
    type: 'IT and Management College',
  },
  {
    id: '66',
    name: 'Orient College of Science and Management',
    address: 'Kathmandu',
    type: 'Technology College',
  },
  {
    id: '67',
    name: 'Malpi Institute',
    address: 'Kathmandu',
    type: 'IT and Technical Institute',
  },
  {
    id: '68',
    name: 'Nami College',
    address: 'Kathmandu',
    type: 'Technical College',
  },
  {
    id: '69',
    name: 'Kaasthamandap A Level Academy',
    address: 'Kathmandu',
    type: 'Advanced Technology College',
  },
  {
    id: '70',
    name: 'Victoria Technical College',
    address: 'Koteshwor, Kathmandu',
    type: 'Technical Institute',
  },

  // Additional Educational Institutions
  {
    id: '71',
    name: 'All Nepal College of Technical Education',
    address: 'Gaushala, Kathmandu',
    type: 'Technical College',
  },
  {
    id: '72',
    name: 'Kantipur Community Health Services',
    address: 'Balaju, Kathmandu',
    type: 'Technical Institute',
  },
  {
    id: '73',
    name: 'Sumnima Polytechnic Institute',
    address: 'Kathmandu',
    type: 'Polytechnic College',
  },
  {
    id: '74',
    name: 'Emerald Technical School',
    address: 'Balaju, Kathmandu',
    type: 'Technical School',
  },
  {
    id: '75',
    name: 'Singh Academy',
    address: 'Samakhushi, Kathmandu',
    type: 'Educational Institute',
  },
  {
    id: '76',
    name: 'Technical Training & Research Institute',
    address: 'Kumaripati, Lalitpur',
    type: 'Research and Training Center',
  },
  {
    id: '77',
    name: 'Kantipur Technical College',
    address: 'Balaju, Kathmandu',
    type: 'Technical College',
  },
  {
    id: '78',
    name: 'United Technical School',
    address: 'Kumaripati, Lalitpur',
    type: 'Technical School',
  },
  {
    id: '79',
    name: 'Spark Institute of Technology',
    address: 'Kathmandu',
    type: 'Technology Institute',
  },
  {
    id: '80',
    name: 'Norvic Institute of Nursing Education',
    address: 'Maharajgunj, Kathmandu',
    type: 'Specialized Education Institute',
  },

  // University Campuses and Specialized Institutions
  {
    id: '81',
    name: 'Tribhuvan University School of Engineering',
    address: 'Kirtipur, Kathmandu',
    type: 'University Campus',
  },
  {
    id: '82',
    name: 'Kathmandu University School of Computing',
    address: 'Dhulikhel, Kavre',
    type: 'Technology School',
  },
  {
    id: '83',
    name: 'Tribhuvan University Central Department of Computer Science',
    address: 'Kirtipur, Kathmandu',
    type: 'Research Department',
  },
  {
    id: '84',
    name: 'Nepal Engineering College',
    address: 'Kathmandu Valley',
    type: 'Engineering Institute',
  },
  {
    id: '85',
    name: 'Advanced College of Technology',
    address: 'Kathmandu',
    type: 'Technology College',
  },

  // Addition of Software companies
  {
    id: '86',
    name: 'Leapfrog Technology',
    address: 'Dilllibazar, Kathmandu',
    type: 'Software Company',
  },
  {
    id: '87',
    name: 'Deerwalk Institute of Technology',
    address: 'Jaya Bageshwori Road, Bhaktapur',
    type: 'Software Company',
  },
  {
    id: '88',
    name: 'CloudFactory',
    address: 'Lalitpur, Nepal',
    type: 'Software Company',
  },
  {
    id: '89',
    name: 'Verisk Nepal',
    address: 'Pulchowk, Kathmandu',
    type: 'Software Company',
  },
  {
    id: '90',
    name: 'F1Soft International',
    address: 'Group Tower, Lalitpur, Kathmandu',
    type: 'Software Company',
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

export const authorizedUsers = [
  {
    user_id: 1,
    fullname: 'Purna Shrestha',
    email: 'purna@kbc.edu.np',
    role: 'Rider',
    phone: '+9779808021753',
    address: 'Kathmandu, Nepal',
    profilePicture: 'https://www.purnashrestha.com.np/assets/hero-vz7SbapX.png',
    ratings: 4,
  },
  {
    user_id: 2,
    fullname: 'Mridani Pandey',
    email: 'mridani@kbc.edu.np',
    role: 'User',
    phone: '9847654321',
    address: 'Lalitpur, Nepal',
    profilePicture: '/assets/images/mridani.jpg',
    ratings: 5,
  },
  {
    user_id: 3,
    fullname: 'Priyanka Luitel',
    email: 'priyanka@kbc.edu.np',
    role: 'User',
    phone: '9801234567',
    address: 'Bhaktapur, Nepal',
    profilePicture: '/assets/images/priyanka.jpg',
    ratings: 5,
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
