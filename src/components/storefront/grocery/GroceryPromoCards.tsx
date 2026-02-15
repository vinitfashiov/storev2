import { Link } from 'react-router-dom';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface GroceryPromoCardsProps {
  storeSlug: string;
}

const promoCards = [
  {
    title: 'Pharmacy at your doorstep!',
    subtitle: 'Cough syrups, pain relief sprays & more',
    cta: 'Order Now',
    bgGradient: 'from-green-500 to-teal-500',
    image: '💊'
  },
  {
    title: 'Pet Care supplies in minutes',
    subtitle: 'Food, treats, toys & more',
    cta: 'Order Now',
    bgGradient: 'from-yellow-400 to-orange-400',
    image: '🐕'
  },
  {
    title: 'No time for a diaper run?',
    subtitle: 'Get baby care essentials in minutes',
    cta: 'Order Now',
    bgGradient: 'from-cyan-400 to-blue-400',
    image: '👶'
  }
];

export function GroceryPromoCards({ storeSlug }: GroceryPromoCardsProps) {
  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  return (
    <div className="mx-6 mb-6">
      <div className="grid grid-cols-3 gap-4">
        {promoCards.map((card, index) => (
          <Link
            key={index}
            to={getLink('/products')}
            className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${card.bgGradient} p-4 h-36 flex flex-col justify-between group hover:shadow-lg transition-shadow`}
          >
            <div className="relative z-10">
              <h3 className="text-white font-bold text-lg leading-tight mb-1">
                {card.title}
              </h3>
              <p className="text-white/90 text-xs leading-tight">
                {card.subtitle}
              </p>
            </div>
            <button className="bg-neutral-900 text-white text-xs font-semibold px-3 py-1.5 rounded w-fit hover:bg-black transition-colors">
              {card.cta}
            </button>
            <div className="absolute right-2 bottom-2 text-5xl opacity-80">
              {card.image}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
