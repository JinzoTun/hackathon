import { useEffect, useState } from 'react';
import { useAuth } from '@/api/AuthContext';
import {
  getAllUsers,
  parseAddressToCoordinates,
  calculateDistance,
} from '@/api/userService';
import { User } from '@/types';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Create custom marker icons
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom marker icon for current user (blue color)
const currentUserIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconRetinaUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
  shadowSize: [41, 41],
});

const Home = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [center, setCenter] = useState<[number, number]>([20, 0]); // Default center
  const [invalidAddresses, setInvalidAddresses] = useState<string[]>([]);
  const [cultureTypes, setCultureTypes] = useState<string[]>([]);
  const [selectedCulture, setSelectedCulture] = useState<string>('');
  const [selectedExperience, setSelectedExperience] = useState<number | null>(
    null
  );
  const [distanceFilter, setDistanceFilter] = useState<number>(100); // Default 100km
  const [useDistanceFilter, setUseDistanceFilter] = useState<boolean>(false);
  const [currentUserCoords, setCurrentUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<string>('basic');
  const navigate = useNavigate(); // Initialize navigation hook
  const { t } = useTranslation();

  // Fetch all users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const userData = await getAllUsers(token);
        setUsers(userData);

        // Extract all unique culture types
        const uniqueCultureTypes = new Set<string>();
        userData.forEach((u) => {
          if (u.cultureType && u.cultureType.length > 0) {
            u.cultureType.forEach((culture) => {
              uniqueCultureTypes.add(culture.type);
            });
          }
        });
        setCultureTypes(Array.from(uniqueCultureTypes).sort());

        // Debug: Log all user addresses to help diagnose issues
        userData.forEach((u) => {
          console.log(`User ${u.name}: Address = "${u.address}"`);
        });

        // Track invalid addresses
        const invalid: string[] = [];

        // First try to center the map on the current user if we have their coordinates
        let foundCurrentUserCoords = false;
        if (user && user.address) {
          const coords = parseAddressToCoordinates(user.address);
          if (coords) {
            setCenter([coords.lat, coords.lng]);
            setCurrentUserCoords(coords);
            foundCurrentUserCoords = true;
          }
        }

        // If we couldn't center on current user, use the first valid user
        if (!foundCurrentUserCoords && userData.length > 0) {
          for (const u of userData) {
            const coords = parseAddressToCoordinates(u.address);
            if (coords) {
              setCenter([coords.lat, coords.lng]);
              break;
            } else {
              invalid.push(`${u.name}: "${u.address}"`);
            }
          }
        }

        setInvalidAddresses(invalid);

        // If no valid coords found, show a message
        if (invalid.length > 0 && userData.length > 0) {
          toast.warning(t('map.invalidAddressWarning'));
        }
      } catch (error) {
        toast.error(t('map.failedToLoadUsers'));
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token, user, t]);

  // Filter users based on selected culture type, experience level, and distance
  const filteredUsers = users.filter((mapUser) => {
    // Culture type and experience filter
    let passesExpertiseFilter = true;

    if (selectedCulture) {
      // If only culture type is selected
      if (selectedExperience === null) {
        passesExpertiseFilter =
          mapUser.cultureType?.some(
            (culture) => culture.type === selectedCulture
          ) || false;
      } else {
        // If both culture type and experience level are selected
        passesExpertiseFilter =
          mapUser.cultureType?.some(
            (culture) =>
              culture.type === selectedCulture &&
              culture.experience >= selectedExperience
          ) || false;
      }
    }

    // Distance filter
    let passesDistanceFilter = true;
    if (
      useDistanceFilter &&
      currentUserCoords &&
      user &&
      user._id !== mapUser._id
    ) {
      const userCoords = parseAddressToCoordinates(mapUser.address);
      if (userCoords) {
        const distance = calculateDistance(
          currentUserCoords.lat,
          currentUserCoords.lng,
          userCoords.lat,
          userCoords.lng
        );
        passesDistanceFilter = distance <= distanceFilter;
      }
    }

    return passesExpertiseFilter && passesDistanceFilter;
  });

  // Count of filtered users with valid coordinates
  const validFilteredUsers = filteredUsers.filter((user) => {
    const coords = parseAddressToCoordinates(user.address);
    return coords !== null;
  });

  const resetFilters = () => {
    setSelectedCulture('');
    setSelectedExperience(null);
    setUseDistanceFilter(false);
  };

  // Handle distance filter changes
  const handleDistanceChange = (value: number[]) => {
    setDistanceFilter(value[0]);
  };

  // Toggle distance filter
  const toggleDistanceFilter = (checked: boolean) => {
    setUseDistanceFilter(checked);

    // If enabling distance filter but no current user coords, show warning
    if (checked && !currentUserCoords) {
      toast.warning(t('map.distanceFilterWarning'));
      setUseDistanceFilter(false);
    }
  };

  // Handle contact user action
  const handleContactUser = (contactUser: User) => {
    if (!user) {
      toast.error(t('map.loginToContact'));
      navigate('/login');
      return;
    }

    // Navigate to chat page with the user ID
    navigate(
      `/chat?userId=${contactUser._id}&userName=${encodeURIComponent(
        contactUser.name
      )}`
    );
    toast.success(t('map.startingConversation', { name: contactUser.name }));
  };

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>{t('map.allUser')}</h1>

      {/* Filters section */}
      <Card className='mb-6'>
        <CardHeader className='pb-3'>
          <CardTitle>{t('map.filterUsers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeFilterTab} onValueChange={setActiveFilterTab}>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='basic'>{t('map.basicFilters')}</TabsTrigger>
              <TabsTrigger value='advanced'>
                {t('map.advancedFilters')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value='basic' className='space-y-4 mt-4'>
              {/* Culture type filter */}
              <div className='flex flex-wrap gap-3 items-center'>
                <div className='w-full sm:w-48'>
                  <Label htmlFor='culture-filter'>{t('map.cultureType')}</Label>
                  <Select
                    value={selectedCulture}
                    onValueChange={(value) => {
                      setSelectedCulture(value);
                      // Reset experience when culture changes
                      if (activeFilterTab === 'basic') {
                        setSelectedExperience(null);
                      }
                    }}
                  >
                    <SelectTrigger id='culture-filter' className='w-full'>
                      <SelectValue placeholder={t('map.filterByCultureType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {cultureTypes.map((culture) => (
                        <SelectItem key={culture} value={culture}>
                          {culture}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Distance filter */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label
                    htmlFor='distance-filter'
                    className='text-sm font-medium'
                  >
                    {t('map.showUsersWithin')} {distanceFilter}{' '}
                    {t('map.kmOfMe')}
                  </Label>
                  <Switch
                    id='distance-filter'
                    checked={useDistanceFilter}
                    onCheckedChange={toggleDistanceFilter}
                    disabled={!currentUserCoords}
                  />
                </div>

                <Slider
                  id='distance-slider'
                  disabled={!useDistanceFilter || !currentUserCoords}
                  value={[distanceFilter]}
                  min={5}
                  max={500}
                  step={5}
                  onValueChange={handleDistanceChange}
                  className='w-full'
                />
                <div className='flex justify-between text-xs text-muted-foreground'>
                  <span>5 {t('map.km')}</span>
                  <span>500 {t('map.km')}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value='advanced' className='space-y-4 mt-4'>
              <div className='space-y-4'>
                <p className='text-sm text-muted-foreground'>
                  {t('map.findUsersWithExpertise')}
                </p>

                {/* Culture type selection */}
                <div className='grid gap-2'>
                  <Label htmlFor='adv-culture-filter'>
                    {t('map.cultureType')}
                  </Label>
                  <Select
                    value={selectedCulture}
                    onValueChange={setSelectedCulture}
                  >
                    <SelectTrigger id='adv-culture-filter' className='w-full'>
                      <SelectValue placeholder={t('map.selectCropType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {cultureTypes.map((culture) => (
                        <SelectItem key={culture} value={culture}>
                          {culture}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience level selection */}
                <div className='grid gap-2'>
                  <Label htmlFor='experience-filter'>
                    {t('map.minimumExperienceLevel')}
                  </Label>
                  <Select
                    value={
                      selectedExperience !== null
                        ? selectedExperience.toString()
                        : 'any'
                    }
                    onValueChange={(value) =>
                      setSelectedExperience(
                        value === 'any' ? null : parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger id='experience-filter' className='w-full'>
                      <SelectValue
                        placeholder={t('map.selectExperienceLevel')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='any'>
                        {t('map.anyExperience')}
                      </SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}{' '}
                          {level === 1
                            ? `(${t('map.beginner')})`
                            : level === 10
                            ? `(${t('map.expert')})`
                            : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='pt-2'>
                  {selectedCulture && selectedExperience !== null && (
                    <Badge variant='secondary' className='text-sm'>
                      {t('map.showingUsersWithCultureExperience', {
                        culture: selectedCulture,
                        level: selectedExperience,
                      })}
                    </Badge>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Reset filters button */}
          {(selectedCulture ||
            selectedExperience !== null ||
            useDistanceFilter) && (
            <div className='mt-4 flex justify-end'>
              <Button variant='outline' size='sm' onClick={resetFilters}>
                {t('map.resetAllFilters')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map section */}
      {loading ? (
        <div className='flex justify-center items-center h-[500px]'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
        </div>
      ) : (
        <div className='h-[500px] w-full rounded-md overflow-hidden border border-input'>
          <MapContainer
            center={center}
            zoom={3}
            style={{ height: '100%', width: '100%' }}
            className='z-0'
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            {/* Display distance radius circle when filter is active */}
            {useDistanceFilter && currentUserCoords && (
              <Circle
                center={[currentUserCoords.lat, currentUserCoords.lng]}
                radius={distanceFilter * 1000} // Convert km to meters
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                }}
              />
            )}

            {filteredUsers.map((mapUser) => {
              const coords = parseAddressToCoordinates(mapUser.address);
              const isCurrentUser = user && user._id === mapUser._id;

              // Only render marker if we can parse coordinates
              if (coords) {
                // Calculate distance if we have current user coords
                let distance: number | null = null;
                if (currentUserCoords && !isCurrentUser) {
                  distance = calculateDistance(
                    currentUserCoords.lat,
                    currentUserCoords.lng,
                    coords.lat,
                    coords.lng
                  );
                }

                return (
                  <Marker
                    key={mapUser._id}
                    position={[coords.lat, coords.lng]}
                    icon={isCurrentUser ? currentUserIcon : defaultIcon}
                  >
                    <Popup>
                      <div className='p-2'>
                        <h3
                          className={`font-bold ${
                            isCurrentUser ? 'text-green-700' : ''
                          }`}
                        >
                          {mapUser.name}{' '}
                          {isCurrentUser ? `(${t('map.you')})` : ''}
                        </h3>
                        <p className='text-sm text-gray-600'>{mapUser.email}</p>
                        {distance !== null && (
                          <p className='text-xs text-green-700 font-medium'>
                            {distance.toFixed(1)} {t('map.kmFromYou')}
                          </p>
                        )}
                        <p className='text-xs text-gray-500'>
                          {t('map.address')}: {mapUser.address}
                        </p>
                        {mapUser.cultureType &&
                          mapUser.cultureType.length > 0 && (
                            <div className='mt-2'>
                              <p className='font-semibold'>
                                {t('map.cultures')}:
                              </p>
                              <ul className='list-disc pl-4'>
                                {mapUser.cultureType.map((culture, index) => {
                                  const isHighlighted =
                                    culture.type === selectedCulture;
                                  const meetsExperience =
                                    selectedExperience === null ||
                                    culture.experience >= selectedExperience;

                                  return (
                                    <li
                                      key={index}
                                      className={
                                        isHighlighted
                                          ? meetsExperience
                                            ? 'font-semibold text-green-700'
                                            : 'text-amber-600'
                                          : ''
                                      }
                                    >
                                      {culture.type} ({t('map.exp')}:{' '}
                                      {culture.experience})
                                      {isHighlighted &&
                                        meetsExperience &&
                                        selectedExperience !== null && (
                                          <span className='ml-1 text-xs'>
                                            ✓
                                          </span>
                                        )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        {!isCurrentUser && (
                          <Button
                            variant='outline'
                            size='sm'
                            className='mt-2'
                            onClick={() => handleContactUser(mapUser)}
                          >
                            {t('map.contactUser')}
                          </Button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}
          </MapContainer>
        </div>
      )}

      <div className='mt-4 flex items-center mb-2'>
        <div className='flex items-center mr-6'>
          <div className='w-5 h-5 bg-[#ef322b] rounded-full mr-2'></div>
          <span className='text-sm'>{t('map.yourLocation')}</span>
        </div>
        <div className='flex items-center'>
          <div className='w-5 h-5 bg-[#2a81cb] rounded-full mr-2'></div>
          <span className='text-sm'>{t('map.otherUsers')}</span>
        </div>
      </div>

      <div>
        <p className='text-sm text-muted-foreground mb-2'>
          {selectedCulture ||
          useDistanceFilter ||
          selectedExperience !== null ? (
            <>
              <span className='font-medium'>{validFilteredUsers.length}</span>{' '}
              {t('map.usersMatchFilters')}
              {selectedCulture && (
                <>
                  <span>
                    {' '}
                    ({t('map.culture')}:{' '}
                    <span className='font-medium'>{selectedCulture}</span>
                  </span>
                  {selectedExperience !== null && (
                    <span>
                      , {t('map.exp')}:{' '}
                      <span className='font-medium'>{selectedExperience}+</span>
                    </span>
                  )}
                  <span>)</span>
                </>
              )}
              {useDistanceFilter && (
                <span>
                  {' '}
                  ({t('map.within')}{' '}
                  <span className='font-medium'>
                    {distanceFilter}
                    {t('map.km')}
                  </span>
                  )
                </span>
              )}
            </>
          ) : (
            <>
              {users.length} {t('map.usersFound')},{' '}
              {users.length - invalidAddresses.length} {t('map.displayedOnMap')}
            </>
          )}
        </p>

        {invalidAddresses.length > 0 &&
          !selectedCulture &&
          !useDistanceFilter &&
          selectedExperience === null && (
            <div className='p-4 border border-orange-300 bg-orange-50 rounded-md mt-2'>
              <h3 className='font-medium text-orange-800 mb-2'>
                {t('map.invalidAddressFormats')}
              </h3>
              <p className='text-sm mb-2'>
                {t('map.invalidAddressExplanation')}
              </p>
              <ul className='list-disc pl-5 text-sm text-orange-700'>
                {invalidAddresses.map((addr, idx) => (
                  <li key={idx}>{addr}</li>
                ))}
              </ul>
            </div>
          )}
      </div>
    </div>
  );
};

export default Home;
