import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PawPrint, Plus, Edit, Beef, Bird, Rabbit, Camera, X } from 'lucide-react';
import { useAnimalContext, Animal } from '@/context/AnimalContext';
import { Camera as CapCamera, CameraResultType } from '@capacitor/camera';
import { processImage } from '@/lib/image-processing';
import { Analytics, Crashlytics } from '@/lib/tracking';

const getHealthColor = (status: string) => {
  switch (status) {
    case 'Healthy':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
    case 'Sick':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700';
    case 'Under Observation':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700';
  }
};

const getVaccinationColor = (status: string) => {
  switch (status) {
    case 'Up to Date':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
    case 'Due':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700';
    case 'Not Vaccinated':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700';
  }
};

const getAnimalIcon = (type: string, imageUrl?: string) => {
  if (imageUrl) {
    return (
      <div className="w-12 h-12 rounded-lg overflow-hidden border border-border">
        <img src={imageUrl} alt="Animal" className="w-full h-full object-cover" />
      </div>
    );
  }
  switch (type) {
    case 'Cow':
      return <Beef className="w-6 h-6 text-primary" />;
    case 'Goat':
    case 'Sheep':
      return <Rabbit className="w-6 h-6 text-primary" />;
    case 'Pig':
      return <PawPrint className="w-6 h-6 text-primary" />;
    default:
      return <Bird className="w-6 h-6 text-primary" />;
  }
};

export function LivestockManagement() {
  const { animals, addAnimal, updateAnimal, deleteAnimal } = useAnimalContext();
  const [isAddAnimalOpen, setIsAddAnimalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [newAnimal, setNewAnimal] = useState({
    tagNumber: '',
    type: '' as Animal['type'] | '',
    sex: '' as Animal['sex'] | '',
    healthStatus: 'Healthy' as Animal['healthStatus'],
    vaccinationStatus: 'Up to Date' as Animal['vaccinationStatus'],
    notes: '',
    imageUrl: '',
  });

  const hasAnimals = animals.length > 0;

  const takePhoto = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
      });

      if (image.base64String) {
        const processedImage = await processImage(`data:image/jpeg;base64,${image.base64String}`);
        setNewAnimal((prev) => ({
          ...prev,
          imageUrl: processedImage,
        }));
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      Analytics.trackEvent('photo_upload_failed', { error: 'capture_or_processing_error' });
      Crashlytics.logError('Photo capture/processing error', error);
      toast.error('Failed to capture photo');
    }
  };

  const resetForm = () => {
    setNewAnimal({
      tagNumber: '',
      type: '',
      sex: '',
      healthStatus: 'Healthy',
      vaccinationStatus: 'Up to Date',
      notes: '',
      imageUrl: '',
    });
    setEditingAnimal(null);
  };

  const addOrUpdateAnimal = () => {
    if (newAnimal.tagNumber && newAnimal.type && newAnimal.sex) {
      if (editingAnimal) {
        updateAnimal(editingAnimal.id, {
          ...editingAnimal,
          tagNumber: newAnimal.tagNumber,
          type: newAnimal.type as Animal['type'],
          sex: newAnimal.sex as Animal['sex'],
          healthStatus: newAnimal.healthStatus,
          vaccinationStatus: newAnimal.vaccinationStatus,
          notes: newAnimal.notes,
          imageUrl: newAnimal.imageUrl,
        });
      } else {
        addAnimal({
          tagNumber: newAnimal.tagNumber,
          type: newAnimal.type as Animal['type'],
          sex: newAnimal.sex as Animal['sex'],
          healthStatus: newAnimal.healthStatus,
          vaccinationStatus: newAnimal.vaccinationStatus,
          notes: newAnimal.notes,
          imageUrl: newAnimal.imageUrl,
        });
      }

      resetForm();
      setIsAddAnimalOpen(false);
    }
  };

  const openEditDialog = (animal: Animal) => {
    setEditingAnimal(animal);
    setNewAnimal({
      tagNumber: animal.tagNumber,
      type: animal.type,
      sex: animal.sex,
      healthStatus: animal.healthStatus,
      vaccinationStatus: animal.vaccinationStatus,
      notes: animal.notes || '',
      imageUrl: animal.imageUrl || '',
    });
    setIsAddAnimalOpen(true);
  };

  const AnimalFormFields = () => (
    <div className="space-y-6 py-4">
      {/* Identity & Photo */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Identity
        </h3>

        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="tag-number" className="text-base">
              Tag Number *
            </Label>
            <Input
              id="tag-number"
              placeholder="e.g., A001"
              value={newAnimal.tagNumber}
              onChange={(e) => setNewAnimal({ ...newAnimal, tagNumber: e.target.value })}
              className="text-lg h-12"
              autoFocus
            />
          </div>
          <div className="w-24 h-24 relative bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden">
            {newAnimal.imageUrl ? (
              <>
                <img src={newAnimal.imageUrl} alt="Animal" className="w-full h-full object-cover" />
                <button
                  onClick={() => setNewAnimal(p => ({ ...p, imageUrl: '' }))}
                  className="absolute top-1 right-1 bg-background/80 rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Button variant="ghost" className="w-full h-full p-0" onClick={takePhoto}>
                <Camera className="w-8 h-8 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="animal-type" className="text-base">Type *</Label>
            <Select
              value={newAnimal.type}
              onValueChange={(value: string) =>
                setNewAnimal({ ...newAnimal, type: value as Animal['type'] })
              }
            >
              <SelectTrigger className="h-12 text-base" data-testid="type-select">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cow">Cow</SelectItem>
                <SelectItem value="Goat">Goat</SelectItem>
                <SelectItem value="Sheep">Sheep</SelectItem>
                <SelectItem value="Pig">Pig</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sex" className="text-base">Sex *</Label>
            <Select
              value={newAnimal.sex}
              onValueChange={(value: string) =>
                setNewAnimal({ ...newAnimal, sex: value as Animal['sex'] })
              }
            >
              <SelectTrigger className="h-12 text-base" data-testid="sex-select">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Health Snapshot */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Health Snapshot
        </h3>
        <div className="space-y-2">
          <Label className="text-base">Health Status</Label>
          <div className="flex flex-col gap-2">
            {(['Healthy', 'Sick', 'Under Observation'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setNewAnimal({ ...newAnimal, healthStatus: status })}
                className={`w-full h-12 px-4 rounded-md border-2 text-base font-medium transition-all flex items-center justify-center ${newAnimal.healthStatus === status
                  ? getHealthColor(status) + ' border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-muted-foreground'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vaccination" className="text-base">Vaccination Status</Label>
          <Select
            value={newAnimal.vaccinationStatus}
            onValueChange={(value: string) =>
              setNewAnimal({
                ...newAnimal,
                vaccinationStatus: value as Animal['vaccinationStatus'],
              })
            }
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Up to Date">Up to Date</SelectItem>
              <SelectItem value="Due">Due</SelectItem>
              <SelectItem value="Not Vaccinated">Not Vaccinated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional observations..."
          value={newAnimal.notes}
          onChange={(e) => setNewAnimal({ ...newAnimal, notes: e.target.value })}
          rows={3}
          className="resize-none text-base"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6 lg:max-w-7xl lg:mx-auto">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Animal Recording</h1>
          <p className="text-muted-foreground">
            {animals.length} {animals.length === 1 ? 'animal' : 'animals'} tracked in the field
          </p>
        </div>
        <Dialog
          open={isAddAnimalOpen}
          onOpenChange={(open: boolean) => {
            setIsAddAnimalOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="lg" className="h-14 md:h-11 px-8 text-lg md:text-base font-semibold shadow-lg md:shadow-none">
              <Plus className="w-6 h-6 md:w-4 md:h-4 mr-2" />
              Record Animal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md h-[90vh] overflow-y-auto landscape:max-h-screen">
            <DialogHeader>
              <DialogTitle className="text-2xl">{editingAnimal ? 'Edit Animal' : 'Record Animal'}</DialogTitle>
              <DialogDescription className="text-base">
                Quick field recording - tap to update essential data
              </DialogDescription>
            </DialogHeader>
            <AnimalFormFields />
            <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t sticky bottom-0 bg-background pb-2">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 text-base"
                onClick={() => {
                  resetForm();
                  setIsAddAnimalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={addOrUpdateAnimal} size="lg" className="w-full sm:w-auto h-12 text-base font-bold">
                <Plus className="w-5 h-5 mr-2" />
                {editingAnimal ? 'Update Animal' : 'Save Animal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!hasAnimals && (
        <div className="flex flex-col items-center justify-center py-20 px-4 space-y-8 bg-muted/30 rounded-3xl border-2 border-dashed border-primary/20">
          <div className="relative">
            <div className="w-28 h-28 bg-primary/15 rounded-full flex items-center justify-center animate-pulse">
              <PawPrint className="w-14 h-14 text-primary" />
            </div>
          </div>
          <div className="text-center space-y-3 max-w-sm">
            <h2 className="text-2xl font-bold">Field-Ready Tracking</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Start recording your livestock identifying tags and health snapshots directly from the field.
            </p>
          </div>
          <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl" onClick={() => setIsAddAnimalOpen(true)}>
            <Plus className="w-6 h-6 mr-2" />
            Add First Record
          </Button>
        </div>
      )}

      {/* Animal Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {animals.map((animal) => (
          <Card key={animal.id} className="active:scale-[0.98] transition-transform hover:shadow-md border-2 hover:border-primary/20 overflow-hidden">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                    {getAnimalIcon(animal.type, animal.imageUrl)}
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">{animal.tagNumber}</CardTitle>
                    <CardDescription className="text-base font-medium">
                      {animal.type} • {animal.sex}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!navigator.onLine) {
                        toast.error('Offline Mode', { description: 'Records can only be edited when online to prevent conflicts.' });
                        return;
                      }
                      openEditDialog(animal);
                    }}
                    className="h-12 w-12 p-0 rounded-full hover:bg-muted"
                  >
                    <Edit className="w-5 h-5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!navigator.onLine) {
                        toast.error('Offline Mode', { description: 'Records can only be removed when online.' });
                        return;
                      }
                      if (window.confirm('Are you sure you want to remove this record?')) {
                        deleteAnimal(animal.id);
                      }
                    }}
                    className="h-12 w-12 p-0 rounded-full hover:bg-muted text-destructive"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="flex flex-wrap gap-2 pt-2 border-t border-muted">
                <Badge variant="outline" className={`px-3 py-1 text-sm font-semibold rounded-full ${getHealthColor(animal.healthStatus)}`}>
                  {animal.healthStatus}
                </Badge>
                <Badge variant="outline" className={`px-3 py-1 text-sm font-semibold rounded-full ${getVaccinationColor(animal.vaccinationStatus)}`}>
                  {animal.vaccinationStatus}
                </Badge>
              </div>
              {animal.notes && (
                <p className="text-base text-muted-foreground bg-muted/40 p-3 rounded-xl line-clamp-2">
                  {animal.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
