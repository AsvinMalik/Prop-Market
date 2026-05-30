import { ArrowRight, Heart, MapPin, Ruler } from 'lucide-react';
import { Property } from '../contexts/AppContext';
import Card from './ui/Card';
import VerificationBadge from './ui/VerificationBadge';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
  onWishlistToggle?: (e: React.MouseEvent) => void;
  isWishlisted?: boolean;
  showWishlist?: boolean;
  ctaLabel?: string;
}

const PropertyCard = ({
  property,
  onClick,
  onWishlistToggle,
  isWishlisted,
  showWishlist,
  ctaLabel = 'View Full Details',
}: PropertyCardProps) => {
  const formattedPrice = `₹${(property.price / 100000).toFixed(1)}L`;
  const pricePerSqFt = property.price / property.area;
  const pricePerSqYd = pricePerSqFt * 9;

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
    >
      <div className="relative">
        <img
          src={property.image}
          alt={property.location}
          className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/10 to-transparent" />

        {showWishlist && onWishlistToggle && (
          <button
            onClick={onWishlistToggle}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 shadow-soft backdrop-blur-sm transition-transform duration-200 hover:scale-105"
          >
            <Heart
              className={`h-5 w-5 ${
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </button>
        )}

        <div className="absolute inset-x-4 bottom-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="inline-flex items-center rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {property.category}
            </div>
            <VerificationBadge
              variant={property.sellerVerified ? 'verified-user' : 'unverified'}
              className={
                property.sellerVerified
                  ? '!bg-emerald-500 !text-white'
                  : '!bg-white/15 !text-white'
              }
            />
            <VerificationBadge
              variant={property.verified ? 'verified-property' : 'unverified'}
              className={
                property.verified ? '!bg-blue-500 !text-white' : '!bg-white/15 !text-white'
              }
            />
          </div>

          <div className="text-3xl font-extrabold tracking-tight text-white">
            {formattedPrice}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Ruler className="h-4 w-4 text-blue-600" />
            <span>{property.area} sq ft</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              ₹{pricePerSqFt.toFixed(0)}/sq ft
            </div>
            <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              ₹{pricePerSqYd.toFixed(0)}/sq yd
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
            <span className="line-clamp-2">{property.location}</span>
          </div>
        </div>

        <div className="soft-divider pt-4">
          <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 group-hover:bg-blue-600">
            <span>{ctaLabel}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PropertyCard;
