import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Bell, BellOff, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TimeCategoryBadge } from "@/components/time-category-badge";
import { EmojiPicker, suggestEmoji } from "@/components/emoji-picker";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { routinesApi } from "@/lib/storage";
import { CreateRoutineSchema, type Routine, type CreateRoutineInput } from "@/lib/schema";

// Format 24h time to 12h format
function formatTime12Hour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

const timeCategories = [
  { id: "AM", label: "AM" },
  { id: "NOON", label: "Noon" },
  { id: "PM", label: "PM" },
  { id: "ALL", label: "All Day" },
] as const;

const formSchema = CreateRoutineSchema.extend({
  name: z.string().min(1, "Routine name is required").max(100, "Name too long"),
  icon: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type RoutineFormProps = {
  routine?: Routine;
  onSubmit: (data: CreateRoutineInput) => void;
  onClose: () => void;
  isSubmitting?: boolean;
};

function RoutineForm({ routine, onSubmit, onClose, isSubmitting }: RoutineFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: routine?.name || "",
      icon: routine?.icon || "✅",
      timeCategories: routine?.timeCategories || ["ALL"],
      notificationEnabled: routine?.notificationEnabled ?? false,
      notificationTime: routine?.notificationTime || "09:00",
    },
  });

  const selectedCategories = form.watch("timeCategories");
  const notificationEnabled = form.watch("notificationEnabled");
  const currentName = form.watch("name");
  const currentIcon = form.watch("icon");

  // Auto-suggest emoji when name changes
  const handleNameBlur = () => {
    if (currentIcon === "✅" && currentName.trim()) {
      const suggested = suggestEmoji(currentName);
      if (suggested !== "✅") {
        form.setValue("icon", suggested);
      }
    }
  };

  const toggleCategory = (id: "AM" | "NOON" | "PM" | "ALL") => {
    const current = form.getValues("timeCategories");
    if (current.includes(id)) {
      if (current.length === 1) return;
      form.setValue("timeCategories", current.filter((c) => c !== id) as typeof current);
    } else {
      form.setValue("timeCategories", [...current, id]);
    }
  };

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      icon: data.icon || "✅",
      notificationTime: data.notificationEnabled ? data.notificationTime : undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="flex gap-3 items-start">
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <FormControl>
                  <EmojiPicker value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Routine Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Take Vitamins"
                    data-testid="input-routine-name"
                    autoFocus
                    {...field}
                    onBlur={(e) => {
                      field.onBlur();
                      handleNameBlur();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Time of Day</FormLabel>
          <div className="flex flex-wrap gap-2">
            {timeCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                data-testid={`button-category-${cat.id.toLowerCase()}`}
                className={`px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm ${
                  selectedCategories.includes(cat.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover-elevate"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Select one or more times</p>
        </div>

        <FormField
          control={form.control}
          name="notificationEnabled"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {field.value ? (
                    <Bell className="w-4 h-4 text-primary" />
                  ) : (
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <FormLabel className="!mt-0">Reminder Notification</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-notification"
                  />
                </FormControl>
              </div>
            </FormItem>
          )}
        />

        {notificationEnabled && (
          <FormField
            control={form.control}
            name="notificationTime"
            render={({ field }) => (
              <FormItem className="pl-6">
                <FormLabel className="text-xs text-muted-foreground">Notification Time</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    className="w-32"
                    data-testid="input-notification-time"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1" data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1" data-testid="button-save-routine">
            {isSubmitting ? "Saving..." : routine ? "Update" : "Add Routine"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function RoutinesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const { data: routines, isLoading } = useQuery<Routine[]>({
    queryKey: ["routines"],
    queryFn: () => routinesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRoutineInput) => routinesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      setIsAddOpen(false);
      toast({ title: "Routine created", description: "Your new routine has been added." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateRoutineInput }) =>
      routinesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      setEditingRoutine(null);
      toast({ title: "Routine updated", description: "Your routine has been updated." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routinesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      queryClient.invalidateQueries({ queryKey: ["dailyRoutines"] });
      queryClient.invalidateQueries({ queryKey: ["completions-all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Routine deleted", description: "The routine has been removed." });
    },
  });

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-routines-title">Manage Routines</h1>
            <p className="text-sm text-muted-foreground" data-testid="text-routine-count">
              {routines?.length || 0} routine{routines?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-routine">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Routine</DialogTitle>
                  <DialogDescription>Create a new daily routine to track</DialogDescription>
                </DialogHeader>
                <RoutineForm
                  onSubmit={(data) => createMutation.mutate(data)}
                  onClose={() => setIsAddOpen(false)}
                  isSubmitting={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : routines?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No routines yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first routine to start building healthy habits
            </p>
            <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-first-routine">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Routine
            </Button>
          </div>
        ) : (
          routines?.map((routine) => (
            <Card key={routine.id} className="p-4" data-testid={`card-routine-${routine.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{routine.icon || "✅"}</span>
                    <h3 className="font-semibold truncate" data-testid={`text-routine-name-${routine.id}`}>
                      {routine.name}
                    </h3>
                    {routine.notificationEnabled && routine.notificationTime && (
                      <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                        <Bell className="w-3 h-3" />
                        <span>{formatTime12Hour(routine.notificationTime)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {routine.timeCategories.map((cat) => (
                      <TimeCategoryBadge key={cat} category={cat} size="sm" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Dialog
                    open={editingRoutine?.id === routine.id}
                    onOpenChange={(open) => !open && setEditingRoutine(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingRoutine(routine)}
                        data-testid={`button-edit-${routine.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Routine</DialogTitle>
                        <DialogDescription>Update your routine details</DialogDescription>
                      </DialogHeader>
                      {editingRoutine && (
                        <RoutineForm
                          routine={editingRoutine}
                          onSubmit={(data) =>
                            updateMutation.mutate({ id: editingRoutine.id, data })
                          }
                          onClose={() => setEditingRoutine(null)}
                          isSubmitting={updateMutation.isPending}
                        />
                      )}
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${routine.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Routine?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{routine.name}" and all its history.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(routine.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-testid={`button-confirm-delete-${routine.id}`}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
