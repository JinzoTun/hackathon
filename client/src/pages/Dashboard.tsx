import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertCircle,
  Upload,
  Camera,
  Share2,
  MapPin,
  RotateCw,
  Leaf,
  ChevronRight,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/api/AuthContext';
import axios from 'axios';
import { API } from '@/config/env';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

// Define types for Plant.id API
interface PlantDisease {
  id: string;
  name: string;
  probability: number;
  description: string;
  treatment: string;
}

interface DiseaseAlert {
  _id: string;
  userId: string;
  userName: string;
  plantType: string;
  diseaseName: string;
  imageUrl: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  createdAt: string;
  probability: number;
  description?: string;
  treatment?: string;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('detection');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diseaseResults, setDiseaseResults] = useState<PlantDisease[] | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [userCultures, setUserCultures] = useState<
    { type: string; experience: number }[]
  >([]);
  const [selectedCulture, setSelectedCulture] = useState('');
  const [nearbyAlerts, setNearbyAlerts] = useState<DiseaseAlert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isLoadingCultures, setIsLoadingCultures] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token, user } = useAuth();

  useEffect(() => {
    // Extract coordinates from user's address field
    if (user?.address) {
      // Check if address contains coordinates
      const coordsMatch = user.address.match(
        /^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/
      );

      if (coordsMatch) {
        // If address is already in lat,lng format, parse it
        const lat = parseFloat(coordsMatch[1]);
        const lng = parseFloat(coordsMatch[3]);
        setUserLocation([lng, lat]); // Note: GeoJSON format requires [longitude, latitude]
      } else {
        // Fallback to geolocation API if address isn't in coordinate format
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation([
                position.coords.longitude,
                position.coords.latitude,
              ]);
            },
            (error) => {
              console.error('Error getting geolocation:', error);
              toast.error(
                'Failed to get your location. Some features may be limited.'
              );
            }
          );
        }
      }
    }

    // Fetch user's culture types
    fetchUserCultures();
  }, [token, user]);

  // Fetch nearby alerts when location is available
  useEffect(() => {
    if (userLocation) {
      fetchNearbyAlerts();
    }
  }, [userLocation]);

  const fetchUserCultures = async () => {
    if (!token) return;

    setIsLoadingCultures(true);
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data.cultureType) {
        setUserCultures(response.data.data.cultureType);
        if (response.data.data.cultureType.length > 0) {
          setSelectedCulture(response.data.data.cultureType[0].type);
        }
      }
    } catch (error) {
      console.error('Error fetching user cultures:', error);
      toast.error(
        'Failed to load your plant types. Please try refreshing the page.'
      );
    } finally {
      setIsLoadingCultures(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setDiseaseResults(null); // Reset previous results
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAnalyzeDisease = async () => {
    if (!image || !selectedCulture || !userLocation) {
      toast.error(
        'Please select an image, plant type, and allow location access'
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      // Create form data for uploading
      const formData = new FormData();
      formData.append('file', image);
      formData.append('plantType', selectedCulture);
      formData.append('longitude', userLocation[0].toString());
      formData.append('latitude', userLocation[1].toString());

      // Send image to backend for Plant.id API analysis
      const response = await axios.post(`${API}/plantid/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setDiseaseResults(response.data.data.diseases);

        // If high probability disease was found, notify
        const highProbabilityDisease = response.data.data.diseases.find(
          (d: PlantDisease) => d.probability > 0.7
        );

        if (highProbabilityDisease) {
          toast.success(
            'Disease detected! Alert has been shared with nearby farmers.'
          );
          // Refresh nearby alerts
          fetchNearbyAlerts();
        }
      }
    } catch (error) {
      console.error('Error analyzing plant disease:', error);
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchNearbyAlerts = async () => {
    if (!token || !userLocation) return;

    setIsLoadingAlerts(true);
    try {
      const response = await axios.get(`${API}/alerts/nearby`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          longitude: userLocation[0],
          latitude: userLocation[1],
          radius: 100, // 100km radius
        },
      });

      if (response.data.success) {
        setNearbyAlerts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching nearby alerts:', error);
      toast.error('Failed to load nearby alerts.');
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNearbyAlerts();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const probabilityColor = (probability: number) => {
    if (probability > 0.7) return 'destructive';
    if (probability > 0.4) return 'secondary';

    return 'default'; // Changed from 'success' to 'default' which is a valid variant
  };

  return (
    <div className='p-4 pt-12 md:pt-4 max-w-7xl mx-auto'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2'>
        <h1 className='text-3xl font-bold'>{t('dashboard.title')}</h1>
        <div className='flex items-center space-x-2'>
          {userLocation ? (
            <Badge
              variant='outline'
              className='flex gap-1 items-center px-2 py-1'
            >
              <MapPin size={14} className='text-green-600' />
              <span className='text-xs'>{t('dashboard.locationActive')}</span>
            </Badge>
          ) : (
            <Badge
              variant='outline'
              className='bg-yellow-50 flex gap-1 items-center px-2 py-1'
            >
              <AlertCircle size={14} className='text-yellow-600' />
              <span className='text-xs'>{t('dashboard.noLocation')}</span>
            </Badge>
          )}

          <Button
            variant='ghost'
            size='sm'
            onClick={handleRefresh}
            disabled={refreshing}
            className='h-8 px-2'
          >
            <RotateCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span className='ml-1 hidden md:inline'>
              {t('dashboard.refresh')}
            </span>
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue={activeTab}
        onValueChange={setActiveTab}
        className='w-full'
      >
        <TabsList className='grid grid-cols-2 mb-6'>
          <TabsTrigger value='detection' className='flex items-center gap-2'>
            <Leaf className='h-4 w-4' />
            <span className='hidden sm:inline'>
              {t('dashboard.diseaseDetection')}
            </span>
            <span className='sm:hidden'>{t('dashboard.detection')}</span>
          </TabsTrigger>
          <TabsTrigger value='alerts' className='flex items-center gap-2'>
            <AlertCircle className='h-4 w-4' />
            <span>{t('dashboard.nearbyAlerts')}</span>
            {nearbyAlerts.length > 0 && (
              <Badge variant='destructive' className='ml-1'>
                {nearbyAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='detection' className='space-y-6'>
          <Card className='shadow-sm'>
            <CardHeader>
              <CardTitle>{t('dashboard.plantDiseaseDetection')}</CardTitle>
              <CardDescription>
                {t('dashboard.uploadDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {userLocation ? (
                  <div className='flex items-center gap-2 text-sm bg-green-50 text-green-700 p-3 rounded-md'>
                    <MapPin
                      size={16}
                      className='text-green-600 flex-shrink-0'
                    />
                    <span className='text-xs md:text-sm'>
                      {t('dashboard.usingLocation')}{' '}
                      {userLocation[1].toFixed(6)}, {userLocation[0].toFixed(6)}
                    </span>
                  </div>
                ) : (
                  <div className='flex items-center gap-2 text-sm bg-yellow-50 text-yellow-700 p-3 rounded-md'>
                    <AlertCircle
                      size={16}
                      className='text-yellow-600 flex-shrink-0'
                    />
                    <span className='text-xs md:text-sm'>
                      {t('dashboard.locationNotAvailable')}
                    </span>
                  </div>
                )}

                <div
                  className='flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 cursor-pointer hover:bg-gray-50 transition-colors'
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt='Plant preview'
                      className='max-h-64 rounded-lg mb-4 object-contain'
                    />
                  ) : (
                    <div className='py-8 flex flex-col items-center'>
                      <Upload className='h-12 w-12 text-gray-400 mb-4' />
                      <p className='text-sm text-muted-foreground mb-1'>
                        {t('dashboard.clickToUpload')}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {t('dashboard.imageFormats')}
                      </p>
                    </div>
                  )}

                  <input
                    type='file'
                    ref={fileInputRef}
                    accept='image/*'
                    onChange={handleImageChange}
                    className='hidden'
                  />

                  <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4'>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      variant='outline'
                      className='flex-1'
                    >
                      <Upload className='h-4 w-4 mr-2' />
                      {t('dashboard.uploadImage')}
                    </Button>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCameraCapture();
                      }}
                      variant='outline'
                      className='flex-1'
                    >
                      <Camera className='h-4 w-4 mr-2' />
                      {t('dashboard.takePhoto')}
                    </Button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('dashboard.selectPlantType')}
                  </label>
                  {isLoadingCultures ? (
                    <Skeleton className='h-10 w-full' />
                  ) : (
                    <select
                      value={selectedCulture}
                      onChange={(e) => setSelectedCulture(e.target.value)}
                      className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    >
                      <option value=''>
                        {t('dashboard.selectPlantPrompt')}
                      </option>
                      {userCultures.map((culture, index) => (
                        <option key={index} value={culture.type}>
                          {culture.type}
                        </option>
                      ))}
                    </select>
                  )}

                  {userCultures.length === 0 && !isLoadingCultures && (
                    <p className='text-xs text-muted-foreground mt-1'>
                      {t('dashboard.noPlantTypes')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleAnalyzeDisease}
                disabled={
                  !image || !selectedCulture || isAnalyzing || !userLocation
                }
                className='w-full'
              >
                {isAnalyzing ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent'></div>
                    {t('dashboard.analyzing')}
                  </>
                ) : (
                  t('dashboard.analyzePlant')
                )}
              </Button>
            </CardFooter>
          </Card>

          {diseaseResults && diseaseResults.length > 0 && (
            <Card className='shadow-sm border-t-4 border-t-primary'>
              <CardHeader>
                <CardTitle>{t('dashboard.analysisResults')}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {diseaseResults.map((disease, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${
                      disease.probability > 0.9
                        ? 'border-red-500 bg-red-50'
                        : disease.probability > 0.4
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-green-500 bg-green-50'
                    }`}
                  >
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2'>
                      <h3 className='font-semibold'>{disease.name}</h3>
                      <Badge variant={probabilityColor(disease.probability)}>
                        {Math.round(disease.probability * 100)}%{' '}
                        {t('dashboard.probability')}
                      </Badge>
                    </div>

                    <div className='text-sm space-y-2'>
                      <p className='mb-2'>{disease.description}</p>

                      {disease.treatment && (
                        <div className='mt-2 p-2 bg-white bg-opacity-50 rounded'>
                          <p className='font-medium text-xs uppercase tracking-wide mb-1'>
                            {t('dashboard.recommendedTreatment')}
                          </p>
                          <p className='text-sm'>{disease.treatment}</p>
                        </div>
                      )}

                      {disease.probability > 0.7 && (
                        <div className='mt-3 flex justify-end'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='flex items-center gap-1'
                          >
                            <Share2 className='h-3 w-3' />
                            <span className='hidden sm:inline'>
                              {t('dashboard.alertShared')}
                            </span>
                            <span className='sm:hidden'>
                              {t('dashboard.shared')}
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='alerts' className='space-y-6'>
          <Card className='shadow-sm'>
            <CardHeader>
              <CardTitle>{t('dashboard.nearbyDiseaseAlerts')}</CardTitle>
              <CardDescription>
                {t('dashboard.alertsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAlerts ? (
                <div className='space-y-4'>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className='border rounded-lg overflow-hidden'>
                      <div className='p-4 border-b bg-gray-50'>
                        <div className='flex justify-between'>
                          <div className='space-y-2'>
                            <Skeleton className='h-5 w-32' />
                            <Skeleton className='h-4 w-24' />
                          </div>
                          <Skeleton className='h-6 w-16 rounded-full' />
                        </div>
                      </div>
                      <Skeleton className='w-full h-48' />
                      <div className='p-4'>
                        <div className='space-y-2'>
                          <Skeleton className='h-4 w-36' />
                          <Skeleton className='h-4 w-28' />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : nearbyAlerts.length > 0 ? (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                  {nearbyAlerts.map((alert) => (
                    <div
                      key={alert._id}
                      className='border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow'
                    >
                      <div className='p-3 md:p-4 border-b bg-amber-50 flex flex-col sm:flex-row justify-between items-start gap-2'>
                        <div>
                          <h3 className='font-semibold text-amber-800 line-clamp-1'>
                            {alert.diseaseName}
                          </h3>
                          <p className='text-sm text-gray-600'>
                            <span className='font-medium'>
                              {alert.plantType}
                            </span>{' '}
                            • {t('dashboard.reportedBy')} {alert.userName}
                          </p>
                        </div>
                        <Badge
                          variant={probabilityColor(alert.probability)}
                          className='whitespace-nowrap'
                        >
                          {Math.round(alert.probability * 100)}%{' '}
                          {t('dashboard.probability')}
                        </Badge>
                      </div>

                      {alert.imageUrl && (
                        <div className='relative'>
                          <img
                            src={alert.imageUrl}
                            alt={`${alert.plantType} disease`}
                            className='w-full h-36 sm:h-48 object-cover'
                            loading='lazy'
                          />
                          {alert.description && (
                            <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white'>
                              <p className='text-xs line-clamp-2'>
                                {alert.description}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className='p-3 md:p-4 flex flex-col sm:flex-row sm:justify-between gap-1 sm:items-center'>
                        <div>
                          <div className='flex items-center gap-1 text-xs text-gray-500 mb-1'>
                            <MapPin className='h-3 w-3 flex-shrink-0' />
                            <span>{t('dashboard.withinDistance')}</span>
                          </div>
                          <p className='text-xs text-gray-500'>
                            {t('dashboard.reportedOn')}{' '}
                            {formatDate(alert.createdAt)}
                          </p>
                        </div>

                        <Button
                          variant='ghost'
                          size='sm'
                          className='mt-2 sm:mt-0 text-xs flex items-center'
                        >
                          {t('dashboard.details')}
                          <ChevronRight className='h-3 w-3 ml-1' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-12 px-4'>
                  <AlertCircle className='mx-auto h-12 w-12 text-muted-foreground/50 mb-3' />
                  <p className='text-lg font-medium'>
                    {t('dashboard.noAlerts')}
                  </p>
                  <p className='text-sm text-muted-foreground max-w-sm mx-auto mt-1'>
                    {t('dashboard.stayVigilant')}
                  </p>
                  <Button
                    onClick={() => setActiveTab('detection')}
                    className='mt-4'
                    size='sm'
                  >
                    {t('dashboard.scanYourPlants')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
