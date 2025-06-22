import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserKarmaPoints } from '../utils/karma';
import { getStoredUser } from '../utils/functions';
import Title from '../components/ui/Title';
import {
  FaTshirt,
  FaMugHot,
  FaBook,
  FaGift,
  FaLaptop,
  FaTicketAlt,
  FaUtensils,
  FaBus,
  FaBicycle,
  FaWifi,
  FaStar,
  FaUserGraduate,
  FaGamepad,
  FaMusic,
  FaSwimmer,
  FaSpa,
  FaChalkboardTeacher,
  FaParking,
  FaFilm,
  FaLeaf,
  FaCoffee,
  FaAppleAlt,
  FaBasketballBall,
  FaBookOpen,
  FaClipboardList,
} from 'react-icons/fa';

const redeemables = [
  {
    name: 'College T-Shirt',
    points: 100,
    icon: <FaTshirt className="text-xl text-teal-600 md:text-2xl" />,
    description: 'Official college T-shirt. Show your pride!',
  },
  {
    name: 'College Mug',
    points: 60,
    icon: <FaMugHot className="text-xl text-amber-600 md:text-2xl" />,
    description: 'Reusable mug for your daily coffee or tea.',
  },
  {
    name: 'Library Voucher',
    points: 40,
    icon: <FaBook className="text-xl text-sky-600 md:text-2xl" />,
    description: 'Voucher for late fee waivers or book borrowing.',
  },
  {
    name: 'Canteen Coupon',
    points: 30,
    icon: <FaUtensils className="text-xl text-pink-600 md:text-2xl" />,
    description: 'Free meal or snack at the college canteen.',
  },
  {
    name: 'Lab Access Pass',
    points: 80,
    icon: <FaLaptop className="text-xl text-green-600 md:text-2xl" />,
    description: 'Priority access to computer labs for your projects.',
  },
  {
    name: 'Event Ticket',
    points: 50,
    icon: <FaTicketAlt className="text-xl text-amber-500 md:text-2xl" />,
    description: 'Entry to college fests, concerts, or sports events.',
  },
  {
    name: 'Bus Pass',
    points: 120,
    icon: <FaBus className="text-xl text-teal-700 md:text-2xl" />,
    description: 'Monthly bus pass for easy campus commute.',
  },
  {
    name: 'Bicycle Rental',
    points: 25,
    icon: <FaBicycle className="text-xl text-green-700 md:text-2xl" />,
    description: 'One-day free bicycle rental on campus.',
  },
  {
    name: 'WiFi Booster',
    points: 35,
    icon: <FaWifi className="text-xl text-sky-500 md:text-2xl" />,
    description: 'High-speed WiFi access for a week.',
  },
  {
    name: 'Star Student Badge',
    points: 200,
    icon: <FaStar className="text-xl text-yellow-400 md:text-2xl" />,
    description: 'Special badge for your student profile.',
  },
  {
    name: 'Graduation Photo Print',
    points: 70,
    icon: <FaUserGraduate className="text-xl text-teal-500 md:text-2xl" />,
    description: 'Free print of your graduation photo.',
  },
  {
    name: 'Game Room Pass',
    points: 45,
    icon: <FaGamepad className="text-xl text-pink-500 md:text-2xl" />,
    description: 'One-hour access to the student game room.',
  },
  {
    name: 'Music Night Ticket',
    points: 55,
    icon: <FaMusic className="text-xl text-indigo-500 md:text-2xl" />,
    description: 'Entry to the next campus music night.',
  },
  {
    name: 'Swimming Pool Pass',
    points: 65,
    icon: <FaSwimmer className="text-xl text-blue-400 md:text-2xl" />,
    description: 'One-day access to the college swimming pool.',
  },
  {
    name: 'Wellness Spa Voucher',
    points: 90,
    icon: <FaSpa className="text-xl text-green-400 md:text-2xl" />,
    description: 'Relax with a wellness spa session.',
  },
  {
    name: 'Workshop Entry',
    points: 35,
    icon: <FaChalkboardTeacher className="text-xl text-teal-400 md:text-2xl" />,
    description: 'Attend a skill-building workshop.',
  },
  {
    name: 'Parking Spot',
    points: 110,
    icon: <FaParking className="text-xl text-gray-500 md:text-2xl" />,
    description: 'Reserved parking spot for a week.',
  },
  {
    name: 'Movie Night Ticket',
    points: 40,
    icon: <FaFilm className="text-xl text-purple-400 md:text-2xl" />,
    description: 'Free ticket to campus movie night.',
  },
  {
    name: 'Eco-Friendly Kit',
    points: 60,
    icon: <FaLeaf className="text-xl text-green-500 md:text-2xl" />,
    description: 'Kit with reusable bottle, bag, and utensils.',
  },
  {
    name: 'Coffee Coupon',
    points: 20,
    icon: <FaCoffee className="text-xl text-amber-700 md:text-2xl" />,
    description: 'Free coffee at the campus café.',
  },
  {
    name: 'Fruit Basket',
    points: 30,
    icon: <FaAppleAlt className="text-xl text-red-400 md:text-2xl" />,
    description: 'Fresh fruit basket from the canteen.',
  },
  {
    name: 'Basketball Court Pass',
    points: 25,
    icon: <FaBasketballBall className="text-xl text-orange-400 md:text-2xl" />,
    description: 'One-hour basketball court booking.',
  },
  {
    name: 'Book Club Membership',
    points: 50,
    icon: <FaBookOpen className="text-xl text-sky-700 md:text-2xl" />,
    description: 'Join the campus book club for a semester.',
  },
  {
    name: 'Stationery Pack',
    points: 15,
    icon: <FaClipboardList className="text-xl text-teal-300 md:text-2xl" />,
    description: 'Essential stationery for your studies.',
  },
];

const gradientStyles = [
  'from-amber-200 to-amber-50',
  'from-teal-200 to-teal-50',
  'from-sky-200 to-blue-50',
  'from-pink-200 to-pink-50',
  'from-green-200 to-green-50',
  'from-yellow-100 to-yellow-200',
  'from-purple-100 to-purple-200',
  'from-red-100 to-red-200',
  'from-indigo-100 to-indigo-200',
  'from-emerald-100 to-emerald-200',
  'from-orange-100 to-orange-200',
  'from-cyan-100 to-cyan-200',
  'from-lime-100 to-lime-200',
  'from-fuchsia-100 to-fuchsia-200',
  'from-blue-100 to-blue-200',
  'from-rose-100 to-rose-200',
  'from-violet-100 to-violet-200',
  'from-gray-100 to-gray-200',
  'from-amber-100 to-amber-200',
  'from-green-100 to-green-200',
  'from-sky-100 to-sky-200',
  'from-pink-100 to-pink-200',
  'from-teal-100 to-teal-200',
  'from-blue-50 to-blue-100',
];

const getProgressBarColor = (progress: number, enoughPoints: boolean) => {
  if (enoughPoints) return 'from-green-400 to-green-300';
  if (progress > 0) return 'from-teal-400 to-teal-300';
  return 'from-gray-300 to-gray-200';
};

const RedeemPage = () => {
  const navigate = useNavigate();
  const [karmaPoints, setKarmaPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.id) {
      fetchUserKarmaPoints(user.id).then((points) => {
        setKarmaPoints(points);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <main className="">
      <div className="w-full">
        <Title
          title="Redeem Your Karma Points"
          description="Exchange your hard-earned karma points for exclusive college rewards! The more you contribute, the more you can claim."
        />
        <div className="flex items-center justify-between gap-2 p-3">
          <button
            className="text-sm font-medium text-teal-600 hover:underline"
            onClick={() => navigate(-1)}
          >
            ← Back to Dashboard
          </button>
          <p className="text-sm font-medium text-teal-600">
            Available:{' '}
            <span className="text-lg font-bold text-green-600">
              {karmaPoints}
            </span>{' '}
            Karma Points
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 px-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {redeemables.map((item, idx) => {
            const enoughPoints = karmaPoints >= item.points;
            const progress = Math.min(karmaPoints / item.points, 1);
            const progressBarColor = getProgressBarColor(
              progress,
              enoughPoints,
            );
            const cardGradient = gradientStyles[idx % gradientStyles.length];
            return (
              <div
                key={item.name}
                className={`group flex flex-col items-center rounded-2xl border border-teal-100 bg-gradient-to-br ${cardGradient} p-4 shadow-lg transition hover:shadow-xl dark:from-dark dark:to-teal-900 md:p-6`}
                style={{ minHeight: 270 }}
              >
                <div className="mb-2 transition-transform group-hover:scale-110">
                  {item.icon}
                </div>
                <h2 className="mb-1 text-center text-base font-bold text-teal-800 dark:text-teal-200 md:text-lg">
                  {item.name}
                </h2>
                <p className="mb-2 text-center text-xs text-gray-600 dark:text-gray-300 md:text-sm">
                  {item.description}
                </p>
                <span className="mb-2 inline-block rounded-full bg-teal-100 px-4 py-1 text-xs font-semibold text-teal-800">
                  {item.points} Karma Points
                </span>
                <div className="mb-2 w-full">
                  <div className="flex items-center justify-between text-xs font-medium text-teal-700">
                    <span>
                      {Math.min(karmaPoints, item.points)}/{item.points}
                    </span>
                    <span>
                      {enoughPoints
                        ? 'Ready!'
                        : `${Math.max(item.points - karmaPoints, 0)} left`}
                    </span>
                  </div>
                  <div className="relative mt-1 h-3 w-full rounded-full bg-teal-50">
                    <div
                      className={`absolute left-0 top-0 h-3 rounded-full bg-gradient-to-r ${progressBarColor} transition-all`}
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
                <button
                  className={`mt-2 rounded-full border border-green-400 bg-green-100 px-6 py-1.5 text-xs font-bold text-green-700 shadow transition hover:bg-green-200 disabled:opacity-50 md:text-sm ${
                    enoughPoints ? 'hover:bg-green-300' : ''
                  }`}
                  disabled={!enoughPoints}
                >
                  {enoughPoints ? 'Redeem' : 'Not enough points'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default RedeemPage;
