import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSettings } from '../services/settingService.js';

const SettingsContext = createContext(null);

const FALLBACK = {
  hotelName: 'LuxuryStay Hospitality',
  currency: 'PKR',
  taxRate: 16,
  checkInTime: '14:00',
  checkOutTime: '12:00',
  servicePrices: {},
  roomRates: {},
  policies: {},
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);

  const refresh = useCallback(() => {
    getSettings()
      .then((res) => setSettings({ ...FALLBACK, ...res.data }))
      .catch(() => {});
  }, []);

  useEffect(refresh, [refresh]);

  return <SettingsContext.Provider value={{ settings, setSettings, refresh }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
