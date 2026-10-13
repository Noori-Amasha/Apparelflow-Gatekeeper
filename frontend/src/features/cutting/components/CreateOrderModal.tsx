import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Info } from "lucide-react";
import { z } from "zod";
import { cuttingApi } from "../api/cutting.api";
import { useToast } from "../../../app/providers/ToastProvider";
import { apiError } from "../../../lib/api";
import { numberValue } from "../../../types/production";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/common/Modal";

const schema = z.object({
  recipe_id: z.uuid("Select a production recipe"),
  target_qty: z.number({ error: "Enter a valid quantity" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(1000000, "Quantity is too large"),
  fabric_roll_id: z.string()
    .trim()
    .min(1, "Fabric Roll ID is required")
    .max(100, "Maximum 100 characters"),
  actual_fabric_yds: z.number({ error: "Enter actual fabric usage" })
    .finite()
    .positive("Actual fabric must be greater than zero")
    .max(999999999.999)
    .refine(
      (value) =>
        Math.abs(value * 1000 - Math.round(value * 1000)) < 0.00001,
      "Maximum 3 decimal places"
    ),
});

type Values = z.infer<typeof schema>;

export default function CreateOrderModal({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      recipe_id: "",
      target_qty: 1,
      fabric_roll_id: "",
    },
  });

  const recipeId = useWatch({ control, name: "recipe_id" });
  const quantity = useWatch({ control, name: "target_qty" }) ?? 0;

  const recipes = useQuery({
    queryKey: ["recipes"],
    queryFn: cuttingApi.recipes,
    enabled: open,
  });

  const selectedRecipe = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => cuttingApi.recipe(recipeId),
    enabled: open && Boolean(recipeId),
  });

  const recipe = selectedRecipe.data;

  const expectedFabric = recipe
    ? numberValue(recipe.std_fabric_yards) *
      (Number.isFinite(quantity) ? quantity : 0)
    : null;

  const mutation = useMutation({
    mutationFn: cuttingApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["cutting-orders"],
      });
      notify("Cutting order created successfully", "success");
      reset();
      close();
    },
    onError: (error) => notify(apiError(error), "error"),
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const submit = handleSubmit((values) => {
    mutation.mutate(values);
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    reset();
    close();
  };

  return (
    <Modal
      open={open}
      title="Create Cutting Order"
      onClose={handleClose}
      wide
      busy={mutation.isPending}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <Select
          id="recipe"
          label="Production Recipe"
          placeholder="Select garment recipe"
          options={(recipes.data ?? []).map((item) => ({
            value: item.id,
            label: `${item.name} (${item.recipe_code})`,
          }))}
          error={errors.recipe_id?.message}
          {...register("recipe_id")}
        />

        {recipes.isError && (
          <p role="alert" className="text-sm text-red-600">
            Unable to load production recipes.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="quantity"
            label="Target Quantity"
            type="number"
            min="1"
            max="1000000"
            step="1"
            placeholder="Enter number of garments"
            error={errors.target_qty?.message}
            {...register("target_qty", { valueAsNumber: true })}
          />

          <Input
            id="actual-fabric"
            label="Actual Fabric Used (yards)"
            type="number"
            min="0"
            step="0.001"
            placeholder="Enter measured yards"
            hint="Enter the actual amount of fabric consumed during cutting."
            error={errors.actual_fabric_yds?.message}
            {...register("actual_fabric_yds", {
              valueAsNumber: true,
            })}
          />
        </div>

        <Input
          id="fabric-roll"
          label="Fabric Roll ID"
          placeholder="FAB-ROLL-882"
          error={errors.fabric_roll_id?.message}
          {...register("fabric_roll_id")}
        />

        {recipe && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <Calculator size={21} />
              </div>
              <div>
                <h3 className="font-bold text-primary-800">
                  Expected Production
                </h3>
                <p className="text-xs text-primary-700">
                  Automatically calculated from the recipe
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white p-4">
              <p className="text-xs font-medium text-slate-500">
                Expected Fabric (Standard)
              </p>
              <strong className="mt-1 block text-2xl text-slate-900">
                {expectedFabric?.toFixed(2)} yards
              </strong>
              <p className="mt-1 text-xs text-slate-500">
                {numberValue(recipe.std_fabric_yards).toFixed(2)} yards
                per garment × {Number.isFinite(quantity) ? quantity : 0} garments
              </p>
            </div>

            <h4 className="mt-5 font-semibold text-slate-800">
              Expected Components
            </h4>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(recipe.components ?? []).map((component) => (
                <div
                  key={component.id}
                  className="rounded-xl bg-white p-3"
                >
                  <p className="text-sm text-slate-600">
                    {component.component_name}
                  </p>
                  <strong className="mt-1 block text-lg text-slate-900">
                    {(Number.isFinite(quantity) ? quantity : 0) *
                      numberValue(component.pieces_per_garment)}
                    <span className="ml-1 text-xs font-normal text-slate-500">
                      pieces
                    </span>
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedRecipe.isError && recipeId && (
          <p role="alert" className="text-sm text-red-600">
            Unable to load the selected recipe details.
          </p>
        )}

        <div className="flex gap-3 rounded-xl bg-amber-50 p-4">
          <Info size={19} className="shrink-0 text-amber-700" />
          <p className="text-xs leading-5 text-amber-900">
            Expected fabric is calculated automatically. Actual fabric
            must be entered from the supervisor's measurement.
            The recorded value will be used for fabric variance and
            the verification audit. 
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={!recipe || selectedRecipe.isFetching}
          >
            Create Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
