import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/api/AuthContext';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface LocationMarkerProps {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  setAddress: (address: string) => void;
}

// Component to handle map click events and reverse geocoding
function LocationMarker({
  position,
  setPosition,
  setAddress,
}: LocationMarkerProps) {
  const map = useMap();

  // This effect ensures the map centers on the current position
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  useMapEvents({
    click: async (e: L.LeafletMouseEvent) => {
      try {
        const { lat, lng } = e.latlng;
        console.log('Map clicked at:', lat, lng);

        // Update position state in parent component
        setPosition([lat, lng]);

        // Instead of geocoding, just use the lat,lng as address
        const coordsAddress = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        setAddress(coordsAddress);
        toast.success('Location selected');
      } catch (error) {
        console.error('Error in map click handler:', error);
        toast.error('Failed to set location. Please try clicking elsewhere.');
      }
    },
  });

  // Render the marker at the current position
  return position ? <Marker position={position} /> : null;
}

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'form'>) {
  let navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
  });
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const { t } = useTranslation();

  // Get user's current location for the initial map position
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log(
          'Got user location:',
          pos.coords.latitude,
          pos.coords.longitude
        );

        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.error('Error getting current position:', err);
        setPosition([40.7128, -74.006]);
      }
    );
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  // This function is passed to the LocationMarker component to update the address
  const setAddressFromMap = useCallback((address: string) => {
    console.log('Setting address in parent:', address);
    setFormData((prev) => ({
      ...prev,
      address,
    }));
    // Close the dialog after selecting a location
    // setMapDialogOpen(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.address) {
      setError(t('auth.pleaseSelectAddress'));
      toast.error(t('auth.pleaseSelectAddress'));
      return;
    }

    try {
      // Add default values for required API fields and include address
      const signUpData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: 0, // Default value for age
        job: 'Not specified', // Default value for job
        address: formData.address, // Include address in API call
      };

      // Save the address and location coordinates to localStorage
      if (position) {
        localStorage.setItem('userAddress', formData.address);
        localStorage.setItem('userCoordinates', JSON.stringify(position));
        console.log('Saved to localStorage:', {
          address: formData.address,
          coordinates: position,
        });
      }

      await signUp(signUpData);
      toast.success(t('auth.registrationSuccess'));

      navigate('/'); // Redirect to dashboard after successful registration
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-2xl font-bold'>{t('auth.createAccount')}</h1>
        <p className='text-balance text-sm text-muted-foreground'>
          {t('auth.enterDetails')}
        </p>
      </div>
      <div className='grid gap-6'>
        <div className='grid gap-2'>
          <Label htmlFor='name'>{t('name')}</Label>
          <Input
            id='name'
            type='text'
            placeholder='John Doe'
            required
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='email'>{t('emailAddress')}</Label>
          <Input
            id='email'
            type='email'
            placeholder='m@example.com'
            required
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='password'>{t('password')}</Label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type='button'
              variant='ghost'
              className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            </Button>
          </div>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='address'>{t('auth.addressLabel')}</Label>
          <div className='flex gap-2'>
            <Input
              id='address'
              type='text'
              placeholder='Select a location on the map'
              required
              value={formData.address}
              onChange={handleChange}
              readOnly
              className='flex-grow'
            />
            <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
              <DialogTrigger asChild>
                <Button type='button' variant='outline'>
                  {t('auth.selectLocation')}
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[600px]'>
                <DialogHeader>
                  <DialogTitle>{t('auth.selectLocationTitle')}</DialogTitle>
                </DialogHeader>
                <div className='h-[400px] w-full rounded-md overflow-hidden border border-input mt-2'>
                  {position && (
                    <MapContainer
                      center={position as L.LatLngExpression}
                      zoom={13}
                      scrollWheelZoom={true}
                      style={{ height: '100%', width: '100%' }}
                      key={`map-${position[0]}-${position[1]}`}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                      />
                      <LocationMarker
                        position={position}
                        setPosition={setPosition}
                        setAddress={setAddressFromMap}
                      />
                    </MapContainer>
                  )}
                </div>
                <p className='text-sm text-muted-foreground mt-2'>
                  {t('auth.clickOnMap')}
                </p>
                <DialogFooter>
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={() => setMapDialogOpen(false)}
                    className='mt-2'
                  >
                    {t('auth.close')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <p className='text-xs text-muted-foreground mt-1'>
            {t('auth.selectedCoordinates')}
          </p>
        </div>
        {error && <div className='text-red-500 text-sm'>{error}</div>}
        <Button type='submit' className='w-full'>
          {t('auth.registerButton')}
        </Button>
        <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
          <span className='relative z-10 bg-background px-2 text-muted-foreground'>
            {t('auth.continueWith')}
          </span>
        </div>
        <Button variant='outline' className='w-full'>
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
            <path
              d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'
              fill='currentColor'
            />
          </svg>
          {t('auth.registerWithGithub')}
        </Button>
      </div>
      <div className='text-center text-sm'>
        {t('alreadyHaveAccount')}{' '}
        <a href='/auth/login' className='underline underline-offset-4'>
          {t('login')}
        </a>
      </div>
    </form>
  );
}
