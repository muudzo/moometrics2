import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PawPrint, Plus, Edit, Beef, Bird, Rabbit } from 'lucide-react';
import { useAnimalContext, Animal } from '@/context/AnimalContext';

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

const getAnimalIcon = (type: string) => {
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
  const { animals, addAnimal, updateAnimal } = useAnimalContext();
  const [isAddAnimalOpen, setIsAddAnimalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [newAnimal, setNewAnimal] = useState({
    tagNumber: '',
    type: '' as Animal['type'] | '',
    sex: '' as Animal['sex'] | '',
    healthStatus: 'Healthy' as Animal['healthStatus'],
    vaccinationStatus: 'Up to Date' as Animal['vaccinationStatus'],
    notes: '',
  });

  const hasAnimals = animals.length > 0;

  const resetForm = () => {
    setNewAnimal({
      tagNumber: '',
      type: '',
      sex: '',
      healthStatus: 'Healthy',
      vaccinationStatus: 'Up to Date',
      notes: '',
    });
    setEditingAnimal(null);
  };

  const addOrUpdateAnimal = () => {
    if (newAnimal.tagNumber && newAnimal.type && newAnimal.sex) {
      if (editingAnimal) {
        // Update existing animal
        updateAnimal(editingAnimal.id, {
          ...editingAnimal,
          tagNumber: newAnimal.tagNumber,
          type: newAnimal.type as Animal['type'],
          sex: newAnimal.sex as Animal['sex'],
          healthStatus: newAnimal.healthStatus,
          vaccinationStatus: newAnimal.vaccinationStatus,
          notes: newAnimal.notes,
        });
      } else {
        // Add new animal
        addAnimal({
          tagNumber: newAnimal.tagNumber,
          type: newAnimal.type as Animal['type'],
          sex: newAnimal.sex as Animal['sex'],
          healthStatus: newAnimal.healthStatus,
          vaccinationStatus: newAnimal.vaccinationStatus,
          notes: newAnimal.notes,
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
    });
    setIsAddAnimalOpen(true);
  };

  if (!hasAnimals) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center md:space-y-0">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Animal Recording</h1>
            <p className="text-muted-foreground">Quick field recording for individual animals</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <PawPrint className="w-12 h-12 text-primary" />
            </div>
          </div>

          <div className="text-center space-y-2 max-w-md">
            <h2 className="text-2xl font-semibold text-foreground">No animals recorded yet</h2>
            <p className="text-muted-foreground">
              Start recording animals with their tag numbers and essential health information.
            </p>
          </div>

          <Dialog open={isAddAnimalOpen} onOpenChange={setIsAddAnimalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Record First Animal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Animal</DialogTitle>
                <DialogDescription>
                  Quick field recording - essential information only
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Section 1: Identity */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Identity
                  </h3>
                  <div className="space-y-2">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="animal-type">Animal Type *</Label>
                      <Select
                        value={newAnimal.type}
                        onValueChange={(value: string) =>
                          setNewAnimal({ ...newAnimal, type: value as Animal['type'] })
                        }
                      >
                        <SelectTrigger className="h-11" data-testid="type-select">
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
                      <Label htmlFor="sex">Sex *</Label>
                      <Select
                        value={newAnimal.sex}
                        onValueChange={(value: string) =>
                          setNewAnimal({ ...newAnimal, sex: value as Animal['sex'] })
                        }
                      >
                        <SelectTrigger className="h-11" data-testid="sex-select">
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

                {/* Section 2: Health Snapshot */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Health Snapshot
                  </h3>
                  <div className="space-y-2">
                    <Label>Health Status</Label>
                    <div className="flex gap-2">
                      {(['Healthy', 'Sick', 'Under Observation'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setNewAnimal({ ...newAnimal, healthStatus: status })}
                          className={`flex-1 py-2.5 px-3 rounded-md border-2 text-sm font-medium transition-all ${newAnimal.healthStatus === status
                            ? getHealthColor(status) + ' border-current'
                            : 'bg-background text-muted-foreground border-border hover:border-muted-foreground'
                            }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vaccination">Vaccination Status</Label>
                    <Select
                      value={newAnimal.vaccinationStatus}
                      onValueChange={(value: string) =>
                        setNewAnimal({
                          ...newAnimal,
                          vaccinationStatus: value as Animal['vaccinationStatus'],
                        })
                      }
                    >
                      <SelectTrigger className="h-11">
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

                {/* Optional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional observations..."
                    value={newAnimal.notes}
                    onChange={(e) => setNewAnimal({ ...newAnimal, notes: e.target.value })}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsAddAnimalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={addOrUpdateAnimal} size="lg" className="h-12 text-base">
                  <Plus className="w-5 h-5 mr-2" />
                  Save Animal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Animal Recording</h1>
          <p className="text-muted-foreground">
            {animals.length} {animals.length === 1 ? 'animal' : 'animals'} recorded
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
            <Button className="md:w-auto h-11">
              <Plus className="w-4 h-4 mr-2" />
              Record Animal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAnimal ? 'Edit Animal' : 'Record Animal'}</DialogTitle>
              <DialogDescription>
                Quick field recording - essential information only
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Section 1: Identity */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Identity
                </h3>
                <div className="space-y-2">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="animal-type">Animal Type *</Label>
                    <Select
                      value={newAnimal.type}
                      onValueChange={(value: string) =>
                        setNewAnimal({ ...newAnimal, type: value as Animal['type'] })
                      }
                    >
                      <SelectTrigger className="h-11" data-testid="type-select">
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
                    <Label htmlFor="sex">Sex *</Label>
                    <Select
                      value={newAnimal.sex}
                      onValueChange={(value: string) =>
                        setNewAnimal({ ...newAnimal, sex: value as Animal['sex'] })
                      }
                    >
                      <SelectTrigger className="h-11" data-testid="sex-select">
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

              {/* Section 2: Health Snapshot */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Health Snapshot
                </h3>
                <div className="space-y-2">
                  <Label>Health Status</Label>
                  <div className="flex gap-2">
                    {(['Healthy', 'Sick', 'Under Observation'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setNewAnimal({ ...newAnimal, healthStatus: status })}
                        className={`flex-1 py-2.5 px-3 rounded-md border-2 text-sm font-medium transition-all ${newAnimal.healthStatus === status
                          ? getHealthColor(status) + ' border-current'
                          : 'bg-background text-muted-foreground border-border hover:border-muted-foreground'
                          }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vaccination">Vaccination Status</Label>
                  <Select
                    value={newAnimal.vaccinationStatus}
                    onValueChange={(value: string) =>
                      setNewAnimal({
                        ...newAnimal,
                        vaccinationStatus: value as Animal['vaccinationStatus'],
                      })
                    }
                  >
                    <SelectTrigger className="h-11">
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

              {/* Optional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional observations..."
                  value={newAnimal.notes}
                  onChange={(e) => setNewAnimal({ ...newAnimal, notes: e.target.value })}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsAddAnimalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={addOrUpdateAnimal} size="lg" className="h-12 text-base">
                <Plus className="w-5 h-5 mr-2" />
                {editingAnimal ? 'Update Animal' : 'Save Animal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Animal Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {animals.map((animal) => (
          <Card key={animal.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getAnimalIcon(animal.type)}
                  <div>
                    <CardTitle className="text-xl">{animal.tagNumber}</CardTitle>
                    <CardDescription>
                      {animal.type} • {animal.sex}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(animal)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={getHealthColor(animal.healthStatus)}>
                  {animal.healthStatus}
                </Badge>
                <Badge variant="outline" className={getVaccinationColor(animal.vaccinationStatus)}>
                  {animal.vaccinationStatus}
                </Badge>
              </div>
              {animal.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2">{animal.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
