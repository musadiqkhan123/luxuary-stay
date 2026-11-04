import { createContext, useContext, useMemo } from 'react';
import { ToastContainer, toast as toastify, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from './ThemeContext.jsx';

const ToastContext = createContext(null);

// All success / error / info messages in the app go through React-Toastify.
// Components call: const toast = useToast(); toast.success('Saved');
export function ToastProvider({ children }) {
  const { theme } = useTheme();

  const toast = useMemo(
    () => ({
      success: (message) => toastify.success(message),
      error: (message) => toastify.error(message, { autoClose: 6000 }),
      info: (message, options) => toastify.info(message, options),
      warning: (message) => toastify.warning(message),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3500}
        newestOnTop
        closeOnClick
        pauseOnHover
        pauseOnFocusLoss={false}
        draggable
        limit={4}
        transition={Slide}
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
