import { useState } from 'react';
import {
  ArrowLeft,
  Home as HomeIcon,
  Heart,
  MapPin,
  MessageCircle,
  Plus,
  Settings,
  UserCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import DocumentVerificationModal from './DocumentVerificationModal';
import Button from './ui/Button';
import Card from './ui/Card';
import VerificationBadge from './ui/VerificationBadge';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateVerificationStatus } = useAuth();
  const { properties, wishlist } = useApp();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  if (!user) {
    return null;
  }

  const myProperties = properties.filter((property) => property.userId === user.id);
  const savedProperties = properties.filter((property) => wishlist.includes(property.id));

  const identityBadgeVariant =
    user.identityVerificationStatus === 'verified'
      ? 'verified-user'
      : user.identityVerificationStatus === 'pending'
      ? 'pending'
      : user.identityVerificationStatus === 'ai_checked'
      ? 'ai-checked'
      : 'unverified';

  const propertyBadgeVariant =
    user.propertyDocumentStatus === 'verified'
      ? 'verified-property'
      : user.propertyDocumentStatus === 'pending'
      ? 'pending'
      : user.propertyDocumentStatus === 'ai_checked'
      ? 'ai-checked'
      : 'unverified';

  return (
    <div className="app-shell pb-20">
      <header className="hero-gradient pb-20 text-white">
        <div className="page-container py-6">
          <button
            onClick={() => navigate(-1)}
            className="glass-panel mb-6 flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name || 'User'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle2 className="h-14 w-14 text-white" />
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {user.name || user.phone || 'User'}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-blue-100">
                    {user.city && (
                      <div className="inline-flex items-center gap-2 text-sm font-medium">
                        <MapPin className="h-4 w-4" />
                        {user.city}
                      </div>
                    )}
                    {user.email && <div className="text-sm">{user.email}</div>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <VerificationBadge variant={identityBadgeVariant} />
                  <VerificationBadge variant={propertyBadgeVariant}>
                    {user.propertyDocumentStatus === 'verified'
                      ? 'Verified Property'
                      : user.propertyDocumentStatus === 'pending'
                      ? 'Pending Property Verification'
                      : user.propertyDocumentStatus === 'ai_checked'
                      ? 'AI-Checked Property Doc'
                      : 'Property Docs Unverified'}
                  </VerificationBadge>
                  {user.roles.map((role) => (
                    <div
                      key={role}
                      className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                    >
                      {role}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowVerificationModal(true)}
              className="border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              Verify Identity
            </Button>
          </div>
        </div>
      </header>

      <div className="page-container -mt-12 space-y-6">
        <Card className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-950">{myProperties.length}</div>
              <div className="text-sm text-slate-500">Listed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-950">{savedProperties.length}</div>
              <div className="text-sm text-slate-500">Saved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-950">3</div>
              <div className="text-sm text-slate-500">Chats</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Trust & Verification</h2>
              <p className="mt-2 text-sm text-slate-600">
                Build credibility with buyers and sellers by keeping your verification
                profile complete.
              </p>
            </div>
            <Button onClick={() => setShowVerificationModal(true)} variant="secondary">
              Verify Identity
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-500">Identity Status</div>
                  <div className="mt-2">
                    <VerificationBadge variant={identityBadgeVariant} />
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-500">Property Documents</div>
                  <div className="mt-2">
                    <VerificationBadge variant={propertyBadgeVariant} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-950">My Properties</h2>
            <button
              onClick={() => navigate('/add-property')}
              className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              View All
            </button>
          </div>

          {myProperties.length > 0 ? (
            <div className="space-y-4">
              {myProperties.map((property) => (
                <Card
                  key={property.id}
                  onClick={() => navigate(`/property/${property.id}`)}
                  className="cursor-pointer overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <img
                      src={property.image}
                      alt={property.location}
                      className="h-36 w-full object-cover sm:w-44"
                    />
                    <div className="flex-1 p-5">
                      <div className="text-lg font-bold text-slate-950">
                        ₹{(property.price / 100000).toFixed(1)}L
                      </div>
                      <div className="mt-1 text-sm text-slate-500">{property.area} sq ft</div>
                      <div className="mt-1 text-sm text-slate-500">{property.location}</div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <VerificationBadge
                          variant={property.sellerVerified ? 'verified-user' : 'unverified'}
                        />
                        <VerificationBadge
                          variant={property.verified ? 'verified-property' : 'unverified'}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <HomeIcon className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="text-slate-600">No properties listed yet</p>
              <Button onClick={() => navigate('/add-property')} className="mt-4">
                Add Property
              </Button>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-950">Saved Properties</h2>
          {savedProperties.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {savedProperties.map((property) => (
                <Card
                  key={property.id}
                  onClick={() => navigate(`/property/${property.id}`)}
                  className="cursor-pointer overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
                >
                  <img
                    src={property.image}
                    alt={property.location}
                    className="h-44 w-full object-cover"
                  />
                  <div className="p-5">
                    <div className="text-lg font-bold text-slate-950">
                      ₹{(property.price / 100000).toFixed(1)}L
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{property.area} sq ft</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <VerificationBadge
                        variant={property.sellerVerified ? 'verified-user' : 'unverified'}
                      />
                      <VerificationBadge
                        variant={property.verified ? 'verified-property' : 'unverified'}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Heart className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="text-slate-600">No saved properties yet</p>
            </Card>
          )}
        </div>

        <Card className="overflow-hidden p-0">
          <button
            onClick={() => navigate('/home-auth')}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <HomeIcon className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-950">My Listings</span>
            </div>
            <span className="text-slate-400">{'>'}</span>
          </button>
          <button
            onClick={() => navigate('/messages')}
            className="flex w-full items-center justify-between border-t border-slate-100 px-5 py-4 text-left transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-950">Messages</span>
            </div>
            <span className="text-slate-400">{'>'}</span>
          </button>
          <button className="flex w-full items-center justify-between border-t border-slate-100 px-5 py-4 text-left transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-950">Settings</span>
            </div>
            <span className="text-slate-400">{'>'}</span>
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center justify-between border-t border-slate-100 px-5 py-4 text-left text-red-600 transition-colors hover:bg-red-50"
          >
            <span className="font-medium">Logout</span>
            <span className="text-red-400">{'>'}</span>
          </button>
        </Card>
      </div>

      <button
        onClick={() => navigate('/add-property')}
        className="shadow-float fixed bottom-24 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-blue-600"
      >
        <Plus className="h-6 w-6" />
      </button>

      <DocumentVerificationModal
        open={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        identityStatus={user.identityVerificationStatus}
        propertyStatus={user.propertyDocumentStatus}
        onUpdate={updateVerificationStatus}
      />
    </div>
  );
};

export default Profile;
