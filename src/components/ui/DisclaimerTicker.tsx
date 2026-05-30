import { AlertTriangle } from 'lucide-react';

const disclaimers = [
  'Users are solely responsible for their decisions. Please verify all details independently before proceeding.',
  'Price insights are estimates. Always verify details and negotiate before finalizing any deal.',
  'If you suspect a fake listing or profile, report it. We will initiate verification promptly.',
];

const tickerItems = [...disclaimers, ...disclaimers];

const DisclaimerTicker = () => {
  return (
    <div className="relative z-[20] border-b border-amber-300/90 bg-amber-50/96 text-slate-900 shadow-[0_10px_28px_rgba(15,23,42,0.16)] backdrop-blur-xl">
      <div className="flex items-center gap-3 overflow-hidden px-4 py-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="animate-ticker-scroll flex w-max items-center">
            {tickerItems.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-center gap-4 pr-10 text-sm font-semibold text-slate-800"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-600" />
                <span className="whitespace-nowrap">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerTicker;
