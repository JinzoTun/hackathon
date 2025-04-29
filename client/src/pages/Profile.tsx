import { useState, useEffect } from 'react';
import { useAuth } from '@/api/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { API } from '@/config/env';
import axios from 'axios';
import { toast } from 'sonner';
import {
  LineChart,
  BarChart,
  DonutChart,
  Card,
  Title,
  Text,
} from '@tremor/react';
import {
  User,
  Leaf,
  LeafIcon,
  Flower,
  History,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Edit,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Extended user interface to include culture types
interface ExtendedUser {
  _id: string;
  name: string;
  address: string;
  email: string;
  cultureType?: {
    type: string;
    experience: number;
    _id: string;
  }[];
}

// Interface for culture history
interface CultureHistory {
  _id: string;
  cultureType: string;
  startDate: string;
  endDate: string;
  yield: number;
  status: 'active' | 'completed' | 'failed';
  notes: string;
}

// Interface for yield statistics
interface YieldStatistics {
  cultureType: string;
  averageYield: number;
  totalHarvests: number;
  successRate: number;
}

export default function Profile() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
  });

  // State for culture management
  const [newCulture, setNewCulture] = useState({
    type: '',
    experience: 1,
  });
  const [culturesToAdd, setCulturesToAdd] = useState<
    { type: string; experience: number }[]
  >([]);
  const [cultureOptions, setCultureOptions] = useState<string[]>([]);
  const [isLoadingCultures, setIsLoadingCultures] = useState(false);
  const [showAddCultureDialog, setShowAddCultureDialog] = useState(false);
  const [customCultureType, setCustomCultureType] = useState('');
  const [addingCustomCulture, setAddingCustomCulture] = useState(false);

  // State for culture history management
  const [cultureHistory, setCultureHistory] = useState<CultureHistory[]>([]);
  const [showAddHistoryDialog, setShowAddHistoryDialog] = useState(false);
  const [showEditHistoryDialog, setShowEditHistoryDialog] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] =
    useState<CultureHistory | null>(null);
  const [newHistory, setNewHistory] = useState({
    cultureType: '',
    startDate: '',
    endDate: '',
    yield: 0,
    status: 'completed' as 'active' | 'completed' | 'failed',
    notes: '',
  });

  // State for yield statistics
  const [yieldStats, setYieldStats] = useState<YieldStatistics[]>([]);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'history' | 'statistics'
  >('profile');

  // Fetch user data with culture types
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setUser(response.data.data);
          setFormData({
            name: response.data.data.name || '',
            email: response.data.data.email || '',
            address: response.data.data.address || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  // Fetch available culture types
  useEffect(() => {
    const fetchCultureTypes = async () => {
      if (!token) return;

      try {
        setIsLoadingCultures(true);
        const response = await axios.get(`${API}/users/culture-types`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setCultureOptions([...response.data.data, 'Add Custom Culture']);
        }
      } catch (error) {
        console.error('Error fetching culture types:', error);
        // Use default types if API fails
        setCultureOptions([
          'Wheat',
          'Corn',
          'Rice',
          'Barley',
          'Oats',
          'Soybeans',
          'Potatoes',
          'Tomatoes',
          'Onions',
          'Lettuce',
          'Carrots',
          'Olives',
          'Grapes',
          'Apples',
          'Oranges',
          'Add Custom Culture',
        ]);
      } finally {
        setIsLoadingCultures(false);
      }
    };

    fetchCultureTypes();
  }, [token]);

  // Fetch culture history when history tab is selected
  useEffect(() => {
    const fetchCultureHistory = async () => {
      if (!token || activeTab !== 'history') return;

      try {
        const response = await axios.get(`${API}/users/culture-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setCultureHistory(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching culture history:', error);
        toast.error('Failed to load culture history');
      }
    };

    fetchCultureHistory();
  }, [token, activeTab]);

  // Fetch yield statistics
  const fetchYieldStatistics = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API}/users/yield-statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setYieldStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching yield statistics:', error);
      toast.error('Failed to load yield statistics');
    }
  };

  // Fetch yield statistics when statistics tab is selected
  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchYieldStatistics();
    }
  }, [token, activeTab]);

  // Handle input changes for profile form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  // Handle saving profile changes
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const response = await axios.put(
        `${API}/users/update-profile`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setUser(response.data.data);
        toast.success('Profile updated successfully');
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  // Handle culture type selection
  const handleCultureTypeSelect = (value: string) => {
    if (value === 'Add Custom Culture') {
      setAddingCustomCulture(true);
      setNewCulture({ ...newCulture, type: '' });
    } else {
      setAddingCustomCulture(false);
      setNewCulture({ ...newCulture, type: value });
    }
  };

  // Handle adding a culture type
  const handleAddCulture = () => {
    // Determine the culture type to add
    const cultureType =
      addingCustomCulture && customCultureType
        ? customCultureType
        : newCulture.type;

    if (!cultureType) {
      toast.error('Please provide a culture type');
      return;
    }

    // Check if this culture type already exists in the user's list
    const isDuplicate = user?.cultureType?.some(
      (culture) => culture.type.toLowerCase() === cultureType.toLowerCase()
    );

    // Check if it's already in the cultures to be added list
    const isInAddList = culturesToAdd.some(
      (culture) => culture.type.toLowerCase() === cultureType.toLowerCase()
    );

    if (isDuplicate || isInAddList) {
      toast.error(`${cultureType} is already in your cultures list`);
      return;
    }

    setCulturesToAdd([
      ...culturesToAdd,
      {
        type: cultureType,
        experience: newCulture.experience,
      },
    ]);

    // Reset the form
    setNewCulture({ type: '', experience: 1 });
    setCustomCultureType('');
    setAddingCustomCulture(false);
    setShowAddCultureDialog(false);

    toast.success(`Added ${cultureType} to your cultures`);
  };

  // Handle saving all new culture types
  const handleSaveCultures = async () => {
    if (!token || !user || culturesToAdd.length === 0) return;

    try {
      const response = await axios.post(
        `${API}/users/add-cultures`,
        { cultures: culturesToAdd },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setUser(response.data.data);
        setCulturesToAdd([]);
        toast.success('Culture types saved successfully');

        // Refresh the culture types list to include any new custom types
        const typesResponse = await axios.get(`${API}/users/culture-types`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (typesResponse.data.success) {
          setCultureOptions([...typesResponse.data.data, 'Add Custom Culture']);
        }
      }
    } catch (error) {
      console.error('Error saving cultures:', error);
      toast.error('Failed to save culture types');
    }
  };

  // Handle removing a culture type
  const handleRemoveCulture = async (id: string) => {
    if (!token || !user) return;

    try {
      const response = await axios.delete(`${API}/users/remove-culture/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUser(response.data.data);
        toast.success('Culture type removed successfully');
      }
    } catch (error) {
      console.error('Error removing culture:', error);
      toast.error('Failed to remove culture type');
    }
  };

  // Handle adding culture history
  const handleAddHistory = async () => {
    if (!newHistory.cultureType || !newHistory.startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await axios.post(
        `${API}/users/add-history`,
        newHistory,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setCultureHistory([...cultureHistory, response.data.data]);
        setNewHistory({
          cultureType: '',
          startDate: '',
          endDate: '',
          yield: 0,
          status: 'completed',
          notes: '',
        });
        setShowAddHistoryDialog(false);
        toast.success('Culture history entry added');
      }
    } catch (error) {
      console.error('Error adding history entry:', error);
      toast.error('Failed to add history entry');
    }
  };

  // Handle editing history entry
  const handleEditHistory = (historyEntry: CultureHistory) => {
    setSelectedHistoryEntry(historyEntry);
    setNewHistory({
      cultureType: historyEntry.cultureType,
      startDate: historyEntry.startDate,
      endDate: historyEntry.endDate || '',
      yield: historyEntry.yield || 0,
      status: historyEntry.status,
      notes: historyEntry.notes || '',
    });
    setShowEditHistoryDialog(true);
  };

  // Handle updating culture history
  const handleUpdateHistory = async () => {
    if (!selectedHistoryEntry) return;

    try {
      const response = await axios.put(
        `${API}/users/update-history/${selectedHistoryEntry._id}`,
        {
          endDate: newHistory.endDate,
          yield: newHistory.yield,
          status: newHistory.status,
          notes: newHistory.notes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Update local state with the updated entry
        setCultureHistory((prevHistory) =>
          prevHistory.map((item) =>
            item._id === selectedHistoryEntry._id ? response.data.data : item
          )
        );

        setSelectedHistoryEntry(null);
        setShowEditHistoryDialog(false);
        toast.success('Culture history entry updated');

        // Refresh yield statistics if we're in that tab
        if (activeTab === 'statistics') {
          fetchYieldStatistics();
        }
      }
    } catch (error) {
      console.error('Error updating history entry:', error);
      toast.error('Failed to update history entry');
    }
  };

  // Handle deleting history entry
  const handleDeleteHistory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this history entry?')) return;

    try {
      const response = await axios.delete(`${API}/users/delete-history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Remove the deleted entry from local state
        setCultureHistory((prevHistory) =>
          prevHistory.filter((item) => item._id !== id)
        );

        toast.success('Culture history entry deleted');

        // Refresh yield statistics if we're in that tab
        if (activeTab === 'statistics') {
          fetchYieldStatistics();
        }
      }
    } catch (error) {
      console.error('Error deleting history entry:', error);
      toast.error('Failed to delete history entry');
    }
  };

  // Prepare chart data for statistics
  const chartData = yieldStats.map((stat) => ({
    culture: stat.cultureType,
    'Average Yield (kg)': stat.averageYield,
    'Success Rate (%)': stat.successRate,
  }));

  const pieChartData = yieldStats.map((stat) => ({
    name: stat.cultureType,
    value: stat.totalHarvests,
  }));

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[80vh]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-lg font-semibold'>{t('profile.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className=' max-w-6xl mx-auto p'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2 flex items-center gap-3'>
          {t('profile.title')}
        </h1>
        <p className='text-muted-foreground'>{t('profile.subtitle')}</p>
      </div>

      {/* Tab Navigation */}
      <div className='flex flex-wrap items-center gap-2 mb-8 border-b'>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-b-2 border-primary text-primary font-medium'
              : 'text-muted-foreground'
          }`}
        >
          <User size={18} /> {t('profile.tabs.profileCultures')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-b-2 border-primary text-primary font-medium'
              : 'text-muted-foreground'
          }`}
        >
          <History size={18} /> {t('profile.tabs.history')}
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`px-4 py-2 flex items-center gap-2 ${
            activeTab === 'statistics'
              ? 'border-b-2 border-primary text-primary font-medium'
              : 'text-muted-foreground'
          }`}
        >
          <BarChart2 size={18} /> {t('profile.tabs.statistics')}
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className='grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8'>
          {/* Left Column - Basic Profile */}
          <div className='md:col-span-5'>
            <div className='bg-card rounded-lg shadow-sm border p-4 sm:p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>
                  {t('profile.basicInfo.title')}
                </h2>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setEditMode(!editMode)}
                  className='flex items-center gap-2'
                >
                  <Edit size={16} />
                  {editMode
                    ? t('profile.basicInfo.cancel')
                    : t('profile.basicInfo.editProfile')}
                </Button>
              </div>

              {editMode ? (
                <form onSubmit={handleProfileUpdate}>
                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor='name'>
                        {t('profile.basicInfo.name')}
                      </Label>
                      <Input
                        id='name'
                        value={formData.name}
                        onChange={handleChange}
                        className='mt-1'
                      />
                    </div>
                    <div>
                      <Label htmlFor='email'>
                        {t('profile.basicInfo.email')}
                      </Label>
                      <Input
                        id='email'
                        type='email'
                        value={formData.email}
                        onChange={handleChange}
                        className='mt-1'
                        disabled
                      />
                      <p className='text-xs text-muted-foreground mt-1'>
                        {t('profile.basicInfo.emailCannotChange')}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor='address'>
                        {t('profile.basicInfo.address')}
                      </Label>
                      <Input
                        id='address'
                        value={formData.address}
                        onChange={handleChange}
                        className='mt-1'
                      />
                    </div>
                    <Button type='submit' className='w-full'>
                      {t('profile.basicInfo.saveChanges')}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className='space-y-4'>
                  <div>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      {t('profile.basicInfo.name')}
                    </h3>
                    <p className='text-base'>{user?.name}</p>
                  </div>
                  <div>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      {t('profile.basicInfo.email')}
                    </h3>
                    <p className='text-base break-all'>{user?.email}</p>
                  </div>
                  <div>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      {t('profile.basicInfo.address')}
                    </h3>
                    <p className='text-base'>{user?.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Cultures */}
          <div className='md:col-span-7'>
            <div className='bg-card rounded-lg shadow-sm border p-4 sm:p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold flex items-center gap-2'>
                  <Leaf className='h-5 w-5 text-primary' />{' '}
                  {t('profile.cultures.title')}
                </h2>
                <Dialog
                  open={showAddCultureDialog}
                  onOpenChange={setShowAddCultureDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      className='flex items-center gap-2'
                    >
                      <Plus size={16} /> {t('profile.cultures.addCulture')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='max-w-md mx-auto'>
                    <DialogHeader>
                      <DialogTitle>
                        {t('profile.cultures.addNewCulture')}
                      </DialogTitle>
                      <DialogDescription>
                        {t('profile.cultures.selectDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4 py-4'>
                      {isLoadingCultures ? (
                        <div className='text-center py-2'>
                          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto'></div>
                          <p className='text-sm text-muted-foreground mt-2'>
                            {t('profile.cultures.loadingCultures')}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className='space-y-2'>
                            <Label htmlFor='culture-type'>
                              {t('profile.cultures.cultureType')}
                            </Label>
                            <Select
                              value={
                                addingCustomCulture
                                  ? 'Add Custom Culture'
                                  : newCulture.type
                              }
                              onValueChange={handleCultureTypeSelect}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    'profile.cultures.selectOrAddCulture'
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {cultureOptions.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {addingCustomCulture && (
                            <div className='space-y-2'>
                              <Label htmlFor='custom-culture'>
                                {t('profile.cultures.customCultureType')}
                              </Label>
                              <Input
                                id='custom-culture'
                                value={customCultureType}
                                onChange={(e) =>
                                  setCustomCultureType(e.target.value)
                                }
                                placeholder={t(
                                  'profile.cultures.enterCultureType'
                                )}
                                className='mt-1'
                              />
                              <p className='text-xs text-muted-foreground'>
                                {t('profile.cultures.customCultureNote')}
                              </p>
                            </div>
                          )}

                          <div className='space-y-2'>
                            <Label htmlFor='experience-level'>
                              {t('profile.cultures.experienceLevel')}
                            </Label>
                            <Input
                              id='experience-level'
                              type='number'
                              min='1'
                              max='10'
                              value={newCulture.experience}
                              onChange={(e) =>
                                setNewCulture({
                                  ...newCulture,
                                  experience: parseInt(e.target.value) || 1,
                                })
                              }
                            />
                            <p className='text-xs text-muted-foreground'>
                              {t('profile.cultures.experienceDescription')}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => {
                          setShowAddCultureDialog(false);
                          setAddingCustomCulture(false);
                          setNewCulture({ type: '', experience: 1 });
                          setCustomCultureType('');
                        }}
                      >
                        {t('profile.basicInfo.cancel')}
                      </Button>
                      <Button
                        onClick={handleAddCulture}
                        disabled={
                          isLoadingCultures ||
                          (!newCulture.type && !customCultureType) ||
                          (addingCustomCulture && !customCultureType)
                        }
                      >
                        {addingCustomCulture
                          ? t('profile.cultures.addCustomCulture')
                          : t('profile.cultures.addCulture')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Current Culture Types */}
              <div className='space-y-3'>
                {user?.cultureType && user.cultureType.length > 0 ? (
                  user.cultureType.map((culture) => (
                    <div
                      key={culture._id}
                      className='flex items-center justify-between border rounded-md p-3 bg-muted/30'
                    >
                      <div className='overflow-hidden'>
                        <h3 className='font-medium truncate'>{culture.type}</h3>
                        <div className='text-xs sm:text-sm text-muted-foreground'>
                          {t('profile.cultures.experienceLevel')}:{' '}
                          {culture.experience}/10
                        </div>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-destructive flex-shrink-0 ml-2'
                        onClick={() => handleRemoveCulture(culture._id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className='text-center p-4 text-muted-foreground'>
                    <LeafIcon className='mx-auto h-10 w-10 opacity-50 mb-2' />
                    <p>{t('profile.cultures.noCultures')}</p>
                    <p className='text-sm'>
                      {t('profile.cultures.addCulturesNote')}
                    </p>
                  </div>
                )}

                {/* Cultures to be added */}
                {culturesToAdd.length > 0 && (
                  <div className='mt-6'>
                    <h3 className='text-sm font-medium mb-2'>
                      {t('profile.cultures.newCulturesToAdd')}
                    </h3>
                    <div className='space-y-2'>
                      {culturesToAdd.map((culture, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between border rounded-md p-3 bg-primary/10'
                        >
                          <div className='overflow-hidden'>
                            <h3 className='font-medium truncate'>
                              {culture.type}
                            </h3>
                            <div className='text-xs sm:text-sm text-muted-foreground'>
                              {t('profile.cultures.experienceLevel')}:{' '}
                              {culture.experience}/10
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-destructive flex-shrink-0 ml-2'
                            onClick={() => {
                              const newCultures = [...culturesToAdd];
                              newCultures.splice(index, 1);
                              setCulturesToAdd(newCultures);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}

                      <Button
                        onClick={handleSaveCultures}
                        className='mt-4 w-full flex items-center justify-center gap-2'
                      >
                        <Save size={16} />{' '}
                        {t('profile.cultures.saveNewCultures')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Culture History Tab */}
      {activeTab === 'history' && (
        <div>
          <div className='bg-card rounded-lg shadow-sm border p-4 sm:p-6'>
            <div className='flex flex-wrap justify-between items-center gap-3 mb-4 sm:mb-6'>
              <h2 className='text-xl font-semibold flex items-center gap-2'>
                <History className='h-5 w-5 text-primary' />{' '}
                {t('profile.history.title')}
              </h2>
              <Dialog
                open={showAddHistoryDialog}
                onOpenChange={setShowAddHistoryDialog}
              >
                <DialogTrigger asChild>
                  <Button variant='outline' className='flex items-center gap-2'>
                    <Plus size={16} /> {t('profile.history.addHistory')}
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-md mx-auto'>
                  <DialogHeader>
                    <DialogTitle>
                      {t('profile.history.addCultureHistory')}
                    </DialogTitle>
                    <DialogDescription>
                      {t('profile.history.recordDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='history-culture-type'>
                        {t('profile.history.cultureType')}
                      </Label>
                      <Select
                        value={newHistory.cultureType}
                        onValueChange={(value) =>
                          setNewHistory({
                            ...newHistory,
                            cultureType: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('profile.history.selectCultureType')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {cultureOptions
                            .filter((type) => type !== 'Add Custom Culture')
                            .map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='start-date'>
                          {t('profile.history.startDate')}
                        </Label>
                        <Input
                          id='start-date'
                          type='date'
                          value={newHistory.startDate}
                          onChange={(e) =>
                            setNewHistory({
                              ...newHistory,
                              startDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='end-date'>
                          {t('profile.history.endDate')}
                        </Label>
                        <Input
                          id='end-date'
                          type='date'
                          value={newHistory.endDate}
                          onChange={(e) =>
                            setNewHistory({
                              ...newHistory,
                              endDate: e.target.value,
                            })
                          }
                        />
                        <p className='text-xs text-muted-foreground'>
                          {t('profile.history.endDateNote')}
                        </p>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='status'>
                        {t('profile.history.status')}
                      </Label>
                      <Select
                        value={newHistory.status}
                        onValueChange={(
                          value: 'active' | 'completed' | 'failed'
                        ) =>
                          setNewHistory({
                            ...newHistory,
                            status: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('profile.history.selectStatus')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='active'>
                            {t('profile.history.active')}
                          </SelectItem>
                          <SelectItem value='completed'>
                            {t('profile.history.completed')}
                          </SelectItem>
                          <SelectItem value='failed'>
                            {t('profile.history.failed')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='yield'>
                        {t('profile.history.yield')}
                      </Label>
                      <Input
                        id='yield'
                        type='number'
                        min='0'
                        value={newHistory.yield}
                        onChange={(e) =>
                          setNewHistory({
                            ...newHistory,
                            yield: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <p className='text-xs text-muted-foreground'>
                        {t('profile.history.yieldNote')}
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='notes'>
                        {t('profile.history.notes')}
                      </Label>
                      <Input
                        id='notes'
                        value={newHistory.notes}
                        onChange={(e) =>
                          setNewHistory({
                            ...newHistory,
                            notes: e.target.value,
                          })
                        }
                        placeholder={t('profile.history.notesPlaceholder')}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setShowAddHistoryDialog(false)}
                    >
                      {t('profile.basicInfo.cancel')}
                    </Button>
                    <Button onClick={handleAddHistory}>
                      {t('profile.history.addHistoryEntry')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Mobile-optimized Culture History Table */}
            <div className='overflow-x-auto -mx-4 sm:mx-0'>
              <div className='inline-block min-w-full align-middle'>
                <table className='min-w-full divide-y divide-border'>
                  <thead>
                    <tr className='text-muted-foreground text-xs sm:text-sm'>
                      <th
                        scope='col'
                        className='py-3 pl-4 pr-3 text-left font-medium sm:pl-6'
                      >
                        {t('profile.history.cultureType')}
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3 text-left font-medium hidden sm:table-cell'
                      >
                        {t('profile.history.period')}
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3 text-left font-medium'
                      >
                        {t('profile.history.status')}
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3 text-left font-medium hidden md:table-cell'
                      >
                        {t('profile.history.yield')}
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3 text-left font-medium hidden lg:table-cell'
                      >
                        {t('profile.history.notes')}
                      </th>
                      <th
                        scope='col'
                        className='py-3 pl-3 pr-4 text-right font-medium sm:pr-6'
                      >
                        {t('profile.history.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border/80 bg-background'>
                    {cultureHistory.length > 0 ? (
                      cultureHistory.map((history) => (
                        <tr key={history._id} className='hover:bg-muted/30'>
                          <td className='py-3 pl-4 pr-3 sm:pl-6'>
                            <div className='flex flex-col'>
                              <span className='font-medium'>
                                {history.cultureType}
                              </span>
                              <span className='text-xs text-muted-foreground sm:hidden'>
                                {history.startDate}{' '}
                                {history.endDate
                                  ? `- ${history.endDate}`
                                  : t('profile.history.ongoing')}
                              </span>
                            </div>
                          </td>
                          <td className='px-3 py-3 hidden sm:table-cell'>
                            {history.startDate}{' '}
                            {history.endDate
                              ? `${t('profile.history.to')} ${history.endDate}`
                              : t('profile.history.ongoing')}
                          </td>
                          <td className='px-3 py-3'>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                history.status === 'active'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : history.status === 'completed'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}
                            >
                              {t(`profile.history.${history.status}`)}
                            </span>
                          </td>
                          <td className='px-3 py-3 hidden md:table-cell'>
                            {history.status === 'active'
                              ? t('profile.history.na')
                              : `${history.yield} ${t('profile.history.kg')}`}
                          </td>
                          <td
                            className='px-3 py-3 max-w-xs truncate hidden lg:table-cell'
                            title={history.notes}
                          >
                            {history.notes }
                          </td>
                          <td className='py-3 pl-3 pr-4 text-right sm:pr-6'>
                            <div className='flex justify-end gap-1 sm:gap-2'>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-7 w-7 p-0'
                                onClick={() => handleEditHistory(history)}
                              >
                                <Edit className='h-4 w-4' />
                                <span className='sr-only'>
                                  {t('profile.history.edit')}
                                </span>
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10'
                                onClick={() => handleDeleteHistory(history._id)}
                              >
                                <Trash2 className='h-4 w-4' />
                                <span className='sr-only'>
                                  {t('profile.history.delete')}
                                </span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className='text-center py-8 text-muted-foreground'
                        >
                          <Leaf className='mx-auto h-10 w-10 opacity-50 mb-2' />
                          <p>{t('profile.history.noHistory')}</p>
                          <p className='text-sm'>
                            {t('profile.history.startAddingNote')}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Edit History Dialog */}
          <Dialog
            open={showEditHistoryDialog}
            onOpenChange={setShowEditHistoryDialog}
          >
            <DialogContent className='max-w-md mx-auto'>
              <DialogHeader>
                <DialogTitle>
                  {t('profile.history.editCultureHistory')}
                </DialogTitle>
                <DialogDescription>
                  {t('profile.history.updateDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                <div className='space-y-2'>
                  <Label>{t('profile.history.cultureType')}</Label>
                  <p className='font-medium'>
                    {selectedHistoryEntry?.cultureType}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {t('profile.history.startDate')}:{' '}
                    {selectedHistoryEntry?.startDate}
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='edit-end-date'>
                    {t('profile.history.endDate')}
                  </Label>
                  <Input
                    id='edit-end-date'
                    type='date'
                    value={newHistory.endDate}
                    onChange={(e) =>
                      setNewHistory({
                        ...newHistory,
                        endDate: e.target.value,
                      })
                    }
                  />
                  <p className='text-xs text-muted-foreground'>
                    {t('profile.history.endDateNote')}
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='edit-status'>
                    {t('profile.history.status')}
                  </Label>
                  <Select
                    value={newHistory.status}
                    onValueChange={(value: 'active' | 'completed' | 'failed') =>
                      setNewHistory({
                        ...newHistory,
                        status: value,
                      })
                    }
                  >
                    <SelectTrigger id='edit-status'>
                      <SelectValue
                        placeholder={t('profile.history.selectStatus')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='active'>
                        {t('profile.history.active')}
                      </SelectItem>
                      <SelectItem value='completed'>
                        {t('profile.history.completed')}
                      </SelectItem>
                      <SelectItem value='failed'>
                        {t('profile.history.failed')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='edit-yield'>
                    {t('profile.history.yield')}
                  </Label>
                  <Input
                    id='edit-yield'
                    type='number'
                    min='0'
                    value={newHistory.yield}
                    onChange={(e) =>
                      setNewHistory({
                        ...newHistory,
                        yield: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='edit-notes'>
                    {t('profile.history.notes')}
                  </Label>
                  <Input
                    id='edit-notes'
                    value={newHistory.notes}
                    onChange={(e) =>
                      setNewHistory({
                        ...newHistory,
                        notes: e.target.value,
                      })
                    }
                    placeholder={t('profile.history.notesPlaceholder')}
                  />
                </div>
              </div>
              <DialogFooter className='flex flex-col-reverse sm:flex-row gap-2 sm:gap-0'>
                <Button
                  variant='outline'
                  className='w-full sm:w-auto'
                  onClick={() => {
                    setShowEditHistoryDialog(false);
                    setSelectedHistoryEntry(null);
                  }}
                >
                  {t('profile.basicInfo.cancel')}
                </Button>
                <Button
                  className='w-full sm:w-auto'
                  onClick={handleUpdateHistory}
                >
                  {t('profile.history.updateHistory')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className='space-y-6 sm:space-y-8'>
          {/* Stats Header Section */}
          <div className='bg-card rounded-lg shadow-sm border p-4 sm:p-6'>
            <h2 className='text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2'>
              <BarChart2 className='h-5 w-5 text-primary' />{' '}
              {t('profile.statistics.title')}
            </h2>
            <p className='text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base'>
              {t('profile.statistics.description')}
            </p>

            {/* Summary Cards with improved design and mobile responsiveness */}
            <div className='grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4'>
              <div className='bg-primary/5 rounded-lg p-3 sm:p-4 border border-primary/20'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className='bg-primary/10 p-1.5 sm:p-2 rounded-full'>
                    <Flower className='h-5 w-5 sm:h-6 sm:w-6 text-primary' />
                  </div>
                  <div>
                    <p className='text-xs sm:text-sm font-medium text-muted-foreground'>
                      {t('profile.statistics.cultureTypes')}
                    </p>
                    <h3 className='text-xl sm:text-2xl font-bold'>
                      {(user?.cultureType?.length || 0) + culturesToAdd.length}
                    </h3>
                  </div>
                </div>
              </div>

              <div className='bg-amber-500/5 rounded-lg p-3 sm:p-4 border border-amber-500/20'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className='bg-amber-500/10 p-1.5 sm:p-2 rounded-full'>
                    <History className='h-5 w-5 sm:h-6 sm:w-6 text-amber-500' />
                  </div>
                  <div>
                    <p className='text-xs sm:text-sm font-medium text-muted-foreground'>
                      {t('profile.statistics.totalCycles')}
                    </p>
                    <h3 className='text-xl sm:text-2xl font-bold'>
                      {cultureHistory.length}
                    </h3>
                  </div>
                </div>
              </div>

              <div className='bg-blue-500/5 rounded-lg p-3 sm:p-4 border border-blue-500/20'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className='bg-blue-500/10 p-1.5 sm:p-2 rounded-full'>
                    <Leaf className='h-5 w-5 sm:h-6 sm:w-6 text-blue-500' />
                  </div>
                  <div>
                    <p className='text-xs sm:text-sm font-medium text-muted-foreground'>
                      {t('profile.statistics.activeCultures')}
                    </p>
                    <h3 className='text-xl sm:text-2xl font-bold'>
                      {
                        cultureHistory.filter((h) => h.status === 'active')
                          .length
                      }
                    </h3>
                  </div>
                </div>
              </div>

              <div className='bg-emerald-500/5 rounded-lg p-3 sm:p-4 border border-emerald-500/20'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className='bg-emerald-500/10 p-1.5 sm:p-2 rounded-full'>
                    <TrendingUp className='h-5 w-5 sm:h-6 sm:w-6 text-emerald-500' />
                  </div>
                  <div>
                    <p className='text-xs sm:text-sm font-medium text-muted-foreground'>
                      {t('profile.statistics.successRate')}
                    </p>
                    <h3 className='text-xl sm:text-2xl font-bold'>
                      {yieldStats.length > 0
                        ? Math.round(
                            yieldStats.reduce(
                              (sum, stat) => sum + stat.successRate,
                              0
                            ) / yieldStats.length
                          )
                        : 0}
                      %
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
            {/* Yield Chart */}
            <Card className='p-4 sm:p-6'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6'>
                <div>
                  <Title className='text-base sm:text-lg font-semibold flex items-center gap-2'>
                    <BarChart2 className='h-5 w-5 text-primary' />{' '}
                    {t('profile.statistics.yieldByType')}
                  </Title>
                  <Text className='text-xs sm:text-sm text-muted-foreground'>
                    {t('profile.statistics.yieldDescription')}
                  </Text>
                </div>
              </div>

              {yieldStats.length > 0 ? (
                <BarChart
                  className='mt-4 h-64 sm:h-72'
                  data={chartData}
                  index='culture'
                  categories={['Average Yield (kg)']}
                  colors={['primary']}
                  valueFormatter={(v) => `${v} kg`}
                />
              ) : (
                <div className='flex flex-col items-center justify-center h-64 sm:h-72 text-center p-4'>
                  <BarChart2 className='h-12 w-12 text-muted-foreground/30 mb-2' />
                  <p className='text-muted-foreground'>
                    {t('profile.statistics.noYieldData')}
                  </p>
                  <Text className='text-xs text-muted-foreground mt-2 max-w-xs'>
                    {t('profile.statistics.completeNote')}
                  </Text>
                </div>
              )}
            </Card>

            {/* Success Rate Chart */}
            <Card className='p-4 sm:p-6'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6'>
                <div>
                  <Title className='text-base sm:text-lg font-semibold flex items-center gap-2'>
                    <PieChartIcon className='h-5 w-5 text-primary' />{' '}
                    {t('profile.statistics.harvestDistribution')}
                  </Title>
                  <Text className='text-xs sm:text-sm text-muted-foreground'>
                    {t('profile.statistics.harvestDescription')}
                  </Text>
                </div>
              </div>

              {yieldStats.length > 0 ? (
                <div className='h-64 sm:h-72'>
                  <DonutChart
                    className='mt-4 h-full'
                    data={pieChartData}
                    category='value'
                    index='name'
                    valueFormatter={(v) =>
                      `${v} ${
                        v === 1
                          ? t('profile.statistics.harvest')
                          : t('profile.statistics.harvests')
                      }`
                    }
                    colors={[
                      'indigo',
                      'violet',
                      'cyan',
                      'amber',
                      'rose',
                      'emerald',
                      'blue',
                    ]}
                  />
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center h-64 sm:h-72 text-center p-4'>
                  <PieChartIcon className='h-12 w-12 text-muted-foreground/30 mb-2' />
                  <p className='text-muted-foreground'>
                    {t('profile.statistics.noHarvestData')}
                  </p>
                  <Text className='text-xs text-muted-foreground mt-2 max-w-xs'>
                    {t('profile.statistics.completeNote')}
                  </Text>
                </div>
              )}
            </Card>

            {/* Success Rate by Culture */}
            <Card className='p-4 sm:p-6 lg:col-span-2'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6'>
                <div>
                  <Title className='text-base sm:text-lg font-semibold flex items-center gap-2'>
                    <TrendingUp className='h-5 w-5 text-primary' />{' '}
                    {t('profile.statistics.cultureSuccessRate')}
                  </Title>
                  <Text className='text-xs sm:text-sm text-muted-foreground'>
                    {t('profile.statistics.successRateDescription')}
                  </Text>
                </div>
              </div>

              {yieldStats.length > 0 ? (
                <LineChart
                  className='mt-4 h-64 sm:h-72'
                  data={chartData}
                  index='culture'
                  categories={['Success Rate (%)']}
                  colors={['emerald']}
                  valueFormatter={(v) => `${v}%`}
                />
              ) : (
                <div className='flex flex-col items-center justify-center h-64 sm:h-72 text-center p-4'>
                  <TrendingUp className='h-12 w-12 text-muted-foreground/30 mb-2' />
                  <p className='text-muted-foreground'>
                    {t('profile.statistics.noSuccessData')}
                  </p>
                  <Text className='text-xs text-muted-foreground mt-2 max-w-xs'>
                    {t('profile.statistics.completeMoreNote')}
                  </Text>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
