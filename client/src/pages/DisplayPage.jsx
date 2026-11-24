import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Scissors, Clock } from 'lucide-react';

export const DisplayPage = () => {
  const { t } = useTranslation();

  const stations = [
    { chair: 1, barber: 'Rajesh Kumar', token: 'A-102', customer: 'Sanjay V.', status: 'IN_CHAIR' },
    { chair: 2, barber: 'Amit Patel', token: 'W-104', customer: 'Rohan M.', status: 'CALLING' },
    { chair: 3, barber: 'Vikram Singh', token: 'A-105', customer: 'Deepak S.', status: 'IN_CHAIR' },
    { chair: 4, barber: 'Hitesh Sharma', token: null, customer: null, status: 'AVAILABLE' },
  ];

  const upcomingTokens = [
    { token: 'A-106', preference: 'Any Barber', wait: '~10m' },
    { token: 'W-107', preference: 'Rajesh', wait: '~15m' },
    { token: 'A-108', preference: 'Any Barber', wait: '~25m' },
    { token: 'W-109', preference: 'Vikram', wait: '~30m' },
    { token: 'A-110', preference: 'Any Barber', wait: '~40m' },
  ];

  return (
    <div className="min-h-screen bg-salon-darker text-white p-6 sm:p-10 flex flex-col justify-between">
      {/* High-visibility Header */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-salon-gold flex items-center justify-center text-black font-black text-2xl shadow-gold-glow">
            <Scissors className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {t('brand.name', 'Elite Salon')}
            </h1>
            <p className="text-xs uppercase tracking-widest text-salon-gold font-bold">
              {t('display.title', 'Waiting Area Display')}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl sm:text-3xl font-mono font-bold text-white">02:30 PM</p>
          <p className="text-xs text-gray-400">Live Queue Broadcast</p>
        </div>
      </div>

      {/* Main Grid: Stations (65%) & Upcoming Ticker (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6">
        {/* Active Stations */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-lg font-bold text-salon-gold uppercase tracking-wider">
            {t('display.nowServing', 'Now Serving at Stations')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stations.map((st) => (
              <Card
                key={st.chair}
                variant={st.status === 'CALLING' ? 'goldBorder' : 'default'}
                className="space-y-3 p-6"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider font-bold text-gray-400">
                    Station {st.chair} • {st.barber}
                  </span>
                  <Badge
                    variant={
                      st.status === 'CALLING'
                        ? 'amber'
                        : st.status === 'IN_CHAIR'
                        ? 'green'
                        : 'gray'
                    }
                    size="sm"
                    pulse={st.status === 'CALLING'}
                  >
                    {st.status}
                  </Badge>
                </div>

                <div className="text-5xl font-black text-salon-gold tracking-tight py-2">
                  {st.token || '---'}
                </div>

                <p className="text-sm font-semibold text-salon-textSecondary">
                  {st.customer || 'Ready for next customer'}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Next 5 Tokens */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-lg font-bold text-salon-gold uppercase tracking-wider">
            {t('display.upcoming', 'Upcoming in Queue')}
          </h2>

          <div className="space-y-2">
            {upcomingTokens.map((item, idx) => (
              <div
                key={item.token}
                className="p-4 rounded-xl bg-salon-surface border border-gray-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-gray-500">#{idx + 1}</span>
                  <span className="text-2xl font-black text-white">{item.token}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{item.preference}</p>
                  <p className="text-xs font-bold text-salon-gold">{item.wait}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="pt-4 border-t border-gray-800 text-center text-xs text-gray-500">
        Please watch the display. When your token is paged, proceed promptly to the indicated station.
      </div>
    </div>
  );
};
