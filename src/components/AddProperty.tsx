import { ChangeEvent, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  FileText,
  Home,
  ImagePlus,
  Map,
  ShieldCheck,
  Trees,
  Upload,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Button from './ui/Button';
import Card from './ui/Card';
import FieldShell, { TextArea, TextInput } from './ui/Field';

type Step = 1 | 2 | 3 | 4 | 5;

const MAX_PROPERTY_IMAGES = 10;
const categories = ['Agricultural', 'Residential', 'Commercial'];
const residentialTypes = ['Plot', 'House', 'Flat', 'Builder Floor'];
const stepLabels = ['Category', 'Type', 'Details', 'Images', 'Documents'];
const verificationBenefits = [
  'Get a Verified Badge',
  'Improve ranking in listings',
  'Increase buyer trust',
  'Attract more inquiries',
];

type UploadedImage = {
  name: string;
  url: string;
};

type DocumentType = 'identity' | 'property';

const AddProperty = () => {
  const navigate = useNavigate();
  const { addProperty } = useApp();
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [propertyImages, setPropertyImages] = useState<UploadedImage[]>([]);
  const [imageError, setImageError] = useState('');
  const [identityDocumentName, setIdentityDocumentName] = useState('');
  const [propertyDocumentName, setPropertyDocumentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [details, setDetails] = useState({
    price: '',
    area: '',
    location: '',
    description: '',
  });

  const progress = (step / 5) * 100;
  const detailsStepVisible = (step === 2 && category !== 'Residential') || step === 3;
  const primaryImage = propertyImages[0]?.url;

  const handleNext = () => {
    if (step < 5) {
      setStep((previous) => (previous + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((previous) => (previous - 1) as Step);
    } else {
      navigate(-1);
    }
  };

  const getCategoryIcon = (value: string) => {
    if (value === 'Agricultural') {
      return Trees;
    }

    if (value === 'Commercial') {
      return Building2;
    }

    return Home;
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }

        reject(new Error('Unable to read image.'));
      };
      reader.onerror = () => reject(new Error('Unable to read image.'));
      reader.readAsDataURL(file);
    });

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const remainingSlots = Math.max(MAX_PROPERTY_IMAGES - propertyImages.length, 0);
    if (!remainingSlots) {
      setImageError(`You can upload up to ${MAX_PROPERTY_IMAGES} images.`);
      event.target.value = '';
      return;
    }

    const nextFiles = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      setImageError(`Only ${remainingSlots} more image(s) can be added. Limit is ${MAX_PROPERTY_IMAGES}.`);
    } else {
      setImageError('');
    }

    void Promise.all(
      nextFiles.map(async (file) => ({
        name: file.name,
        url: await readFileAsDataUrl(file),
      }))
    )
      .then((uploadedImages) => {
        setPropertyImages((currentImages) => [...currentImages, ...uploadedImages]);
      })
      .catch(() => {
        setImageError('Unable to process one or more images. Please try again.');
      })
      .finally(() => {
        event.target.value = '';
      });
  };

  const removeImage = (imageUrl: string) => {
    setPropertyImages((currentImages) =>
      currentImages.filter((image) => image.url !== imageUrl)
    );
    setImageError('');
  };

  const handleImageStepContinue = () => {
    if (!propertyImages.length) {
      setImageError('Add at least one property image before continuing.');
      return;
    }

    setImageError('');
    handleNext();
  };

  const handleDocumentUpload =
    (documentType: DocumentType) => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (documentType === 'identity') {
        setIdentityDocumentName(file.name);
        return;
      }

      setPropertyDocumentName(file.name);
    };

  const handleSubmitProperty = async (_submitWithoutVerification = false) => {
    try {
      setSubmitting(true);
      setSubmissionError('');

      await addProperty({
        image: primaryImage || undefined,
        price: Number(details.price),
        area: Number(details.area),
        location: details.location,
        category: category as 'Agricultural' | 'Residential' | 'Commercial',
        type: type || undefined,
        description: details.description || undefined,
      });

      navigate('/home-auth');
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : 'Unable to submit property right now.'
      );
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  };

  return (
    <div className="app-shell pb-16">
      <header className="hero-gradient sticky top-0 z-40 border-b border-white/10 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
        <div className="page-container py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={handleBack}
                className="glass-panel flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-colors hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-100">List a property</p>
                <h1 className="text-3xl font-extrabold text-white">Add Property</h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50">
                  Complete each step to create a polished property listing without losing track of
                  progress.
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-3xl px-5 py-4 text-white">
              <div className="text-xs uppercase tracking-[0.2em] text-blue-100">Step</div>
              <div className="mt-2 text-2xl font-bold">{step} of 5</div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {stepLabels.map((label, index) => {
                const currentStep = index + 1;
                const isActive = currentStep === step;
                const isCompleted = currentStep < step;

                return (
                  <div
                    key={label}
                    className={`rounded-2xl px-3 py-3 text-center text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-slate-950 shadow-soft'
                        : isCompleted
                          ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-blue-100'
                    }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="page-container pt-8">
        {step === 1 && (
          <section className="animate-slide-up space-y-6">
            <div className="space-y-2">
              <h2 className="section-title">Select Property Category</h2>
              <p className="section-copy">
                Start with the broad type of property you want to list.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {categories.map((item) => {
                const Icon = getCategoryIcon(item);
                const isSelected = category === item;

                return (
                  <button
                    key={item}
                    onClick={() => {
                      setCategory(item);
                      setStep(2);
                    }}
                    className={`rounded-[28px] border p-6 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-300 bg-blue-50 shadow-float'
                        : 'bg-white shadow-soft hover:-translate-y-1 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-slate-950">{item}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {item === 'Agricultural' &&
                        'Ideal for plots, farmland, and land opportunities.'}
                      {item === 'Residential' &&
                        'Best for houses, flats, and other living spaces.'}
                      {item === 'Commercial' &&
                        'Best for offices, retail spaces, and business properties.'}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && category === 'Residential' && (
          <section className="animate-slide-up space-y-6">
            <div className="space-y-2">
              <h2 className="section-title">Select Property Type</h2>
              <p className="section-copy">
                Choose the residential format to tailor the rest of the listing flow. You will
                continue automatically after selection.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {residentialTypes.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setType(item);
                    setStep(3);
                  }}
                  className={`rounded-[28px] border p-6 text-left transition-all duration-200 ${
                    type === item
                      ? 'border-blue-300 bg-blue-50 shadow-float'
                      : 'bg-white shadow-soft hover:-translate-y-1 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg font-bold text-slate-950">{item}</div>
                  <p className="mt-2 text-sm text-slate-500">
                    This helps buyers narrow their search faster.
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {detailsStepVisible && (
          <section className="animate-slide-up grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
            <Card className="p-6 sm:p-8">
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
                  <Map className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">Property Details</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Add the basic information buyers expect to see first.
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <div className="text-sm font-medium text-slate-500">Selected Category</div>
                  <div className="mt-2 text-lg font-bold text-slate-950">{category}</div>
                  {type && (
                    <>
                      <div className="mt-4 text-sm font-medium text-slate-500">Selected Type</div>
                      <div className="mt-2 text-lg font-bold text-slate-950">{type}</div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="grid gap-5">
                <FieldShell label="Price (in INR)" hint="Enter the total expected selling price.">
                  <TextInput
                    type="number"
                    value={details.price}
                    onChange={(event) => setDetails({ ...details, price: event.target.value })}
                    placeholder="5000000"
                  />
                </FieldShell>

                <FieldShell label="Area (in sq ft)" hint="Add the built-up or plot area.">
                  <TextInput
                    type="number"
                    value={details.area}
                    onChange={(event) => setDetails({ ...details, area: event.target.value })}
                    placeholder="1200"
                  />
                </FieldShell>

                <FieldShell label="Location" hint="Use the exact neighborhood or landmark.">
                  <TextInput
                    type="text"
                    value={details.location}
                    onChange={(event) => setDetails({ ...details, location: event.target.value })}
                    placeholder="Model Town, Rohtak"
                  />
                </FieldShell>

                <FieldShell
                  label="Description"
                  hint="Summarize key selling points, access, and condition."
                >
                  <TextArea
                    value={details.description}
                    onChange={(event) =>
                      setDetails({ ...details, description: event.target.value })
                    }
                    placeholder="Describe your property..."
                    rows={5}
                    className="resize-none"
                  />
                </FieldShell>

                <Button
                  onClick={() => setStep(4)}
                  disabled={!details.price || !details.area || !details.location}
                  size="lg"
                >
                  Continue
                </Button>
              </div>
            </Card>
          </section>
        )}

        {step === 4 && (
          <section className="animate-slide-up grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
            <Card className="p-6 sm:p-8">
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 text-amber-700">
                  <ImagePlus className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">Upload Images</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Add your property images here.
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <div className="text-sm font-medium text-slate-500">Images selected</div>
                  <div className="mt-2 text-lg font-bold text-slate-950">
                    {propertyImages.length} / {MAX_PROPERTY_IMAGES}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    The first image becomes the main cover for the listing.
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <label className="block cursor-pointer rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition-colors hover:border-blue-400 hover:bg-blue-50">
                <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-white text-slate-500 shadow-soft">
                  <Upload className="h-8 w-8" />
                </div>
                <p className="mt-5 text-base font-semibold text-slate-950">
                  {propertyImages.length ? 'Add more property images' : 'Click to upload property images'}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  PNG, JPG up to 10MB each. Maximum {MAX_PROPERTY_IMAGES} images.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>

              {imageError && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  {imageError}
                </div>
              )}

              {!!propertyImages.length && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {propertyImages.map((image, index) => (
                    <div
                      key={`${image.name}-${index}`}
                      className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-soft"
                    >
                      <img
                        src={image.url}
                        alt={`Property upload ${index + 1}`}
                        className="h-40 w-full object-cover"
                      />
                      <div className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white">
                        {index === 0 ? 'Cover' : `Image ${index + 1}`}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(image.url)}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-soft transition hover:bg-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="p-4">
                        <div className="truncate text-sm font-medium text-slate-700">{image.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleImageStepContinue} size="lg" className="mt-6">
                Continue
              </Button>
            </Card>
          </section>
        )}

        {step === 5 && (
          <section className="animate-slide-up grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
            <Card className="p-6 sm:p-8">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-emerald-100 via-white to-blue-100 text-emerald-700 shadow-soft">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified Badge
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    Boost Your Listing with Verification
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Upload your identity and property documents to get verified. Verified listings
                    rank higher, build trust, and attract more serious buyers.
                  </p>
                </div>

                <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Why verify?
                  </div>
                  <div className="mt-4 grid gap-3">
                    {verificationBenefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-[0_10px_25px_rgba(15,23,42,0.06)]"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="h-4 w-4" />
                        </div>
                        <div className="text-sm font-medium text-slate-700">{benefit}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 text-blue-600" />
                    <p className="text-sm leading-6 text-slate-600">
                      All documents are securely processed and used only for verification purposes.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="grid gap-5">
                <label className="group block cursor-pointer rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-float">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-950">User Verification</h3>
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Identity proof
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Upload Aadhaar, PAN, or another government-issued ID to verify the seller
                        profile.
                      </p>
                      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-soft">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-700">
                            {identityDocumentName || 'Upload identity document'}
                          </div>
                          <div className="text-xs text-slate-500">PNG, JPG, or PDF up to 10MB</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleDocumentUpload('identity')}
                  />
                </label>

                <label className="group block cursor-pointer rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-float">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                      <Home className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-950">Land Verification</h3>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Registry papers
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Upload registry papers or ownership documents for the land so the property
                        can qualify for verification.
                      </p>
                      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-soft">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-700">
                            {propertyDocumentName || 'Upload land registry papers'}
                          </div>
                          <div className="text-xs text-slate-500">PNG, JPG, or PDF up to 10MB</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleDocumentUpload('property')}
                  />
                </label>
              </div>

              {submissionError && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {submissionError}
                </div>
              )}

              <Button
                onClick={() => handleSubmitProperty(false)}
                size="lg"
                className="mt-6"
                disabled={submitting}
              >
                <Check className="h-5 w-5" />
                {submitting ? 'Submitting...' : 'Submit Property'}
              </Button>

              <Button
                onClick={() => handleSubmitProperty(true)}
                variant="secondary"
                size="lg"
                className="mt-3"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Without Verification'}
              </Button>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
};

export default AddProperty;
