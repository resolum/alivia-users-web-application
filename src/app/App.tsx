import { RouterProvider } from 'react-router';
import { router } from './router.tsx';
import { Providers } from './providers.tsx';

export default function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
